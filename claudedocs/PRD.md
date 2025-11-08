This PRD describes the feature to move character storage from local storage to a real backend using Firebase Auth and an SQL database on iFastNet, with role-based visibility for players, game masters, and the admin user.

---

## 1. Goal

* Authenticate users with Firebase.
* Store characters in the existing SQL DB on iFastNet.
* Show users the characters they own.
* Show GMs the characters they own **and** the characters they GM.
* Give the admin user `scottkunian@gmail.com` the ability to view all characters.
* Stop saving/deleting characters in local storage and use the DB instead.
* Set up VS Code so AI tools can run SQL against the DB during development.

---

## 2. Current State (assumed)

* App already exports characters as `.ds-hero` JSON objects (sample provided).
* App likely saves to `localStorage` now.
* No central user database.
* No server-backed character list.
* Auth is not yet Firebase-based.

So we’re adding: auth, user<->character mapping, server endpoints, and a DB schema.

---

## 3. Users & Roles

1. **Player (normal user)**

   * Logs in with Firebase.
   * Sees characters they own.
   * Can create, update, delete **their** characters.

2. **Game Master (GM)**

   * Same as Player.
   * Also sees characters that list them as GM.

3. **Admin**

   * Identified by email: `scottkunian@gmail.com`
   * Has a toggle in the UI: “Show all characters.”
   * When on, they can view all character rows in the DB.

Roles will be derived from:

* Firebase token (email)
* DB record for that user (optional future expansion)

---

## 4. Functional Requirements

### 4.1 Authentication (Firebase)

* App must use Firebase Authentication (email/password or existing provider).
* Client obtains Firebase ID token.
* Client sends ID token to backend on every API call.
* Backend verifies token with Firebase Admin SDK.
* On first successful login, backend creates/updates a `users` row in SQL (see DB section).

### 4.2 Character Storage in SQL

* Character is stored as JSON in the DB.
* Use a TEXT/LONGTEXT/JSON-like field depending on iFastNet MySQL/MariaDB version.

  * If MySQL ≥ 5.7: use `JSON`.
  * If older: use `LONGTEXT` and store stringified JSON.
* The JSON is the same as the `.ds-hero` export.

### 4.3 Character Visibility

When a user hits “My Characters”:

* Backend filters by:

  1. `owner_user_id = currentUser`
  2. `OR gm_user_id = currentUser`
  3. If admin and admin toggle = true → return all.

Returned fields:

* `id`
* `name` (pulled from JSON, or cached column)
* `owner_user_id`
* `gm_user_id`
* `updated_at`
* `character_json`

### 4.4 Create / Save Character

* Client sends POST/PUT to `/api/characters`.
* Body contains:

  * `character_json` (full `.ds-hero` JSON)
  * Optional `gm_email` or `gm_id` to assign GM
* Backend:

  * Verifies user from Firebase token.
  * Looks up or creates user row for the owner.
  * If new character → insert with `owner_user_id = currentUser`.
  * If existing character → check ownership OR admin OR GM before updating.
  * Writes JSON to DB.
  * Returns updated row.

### 4.5 Delete Character

* Client sends DELETE to `/api/characters/:id`.
* Backend checks:

  * Owner can delete.
  * Admin can delete.
  * GM can delete only if we approve that in this release. (Let’s say **no** for now: GM can’t delete, only owner and admin.)
* Perform soft-delete (recommended) or hard-delete.

  * Soft-delete = `is_deleted = 1`.
  * Client won’t show deleted rows.

### 4.6 Admin Toggle “All Characters”

* Only show this toggle if logged-in email is `scottkunian@gmail.com`.
* Toggle is client-side state.
* When on, client calls `/api/characters?scope=all`.
* Backend re-checks user email; if not admin, ignore the scope.

---

## 5. Non-Functional Requirements

* Auth must be verified server-side. No trust of client claims.
* Responses should be fast enough for listing 50–100 characters.
* JSON field should accept large strings (character art is base64 in sample file).

---

## 6. API Design (proposed)

**Auth note:** all endpoints require `Authorization: Bearer <firebase_id_token>`

1. `GET /api/me`

   * Verifies token, returns `{ firebase_uid, email, isAdmin }`
   * Creates user in DB if missing.

2. `GET /api/characters`

   * Query params:

     * `scope=mine` (default)
     * `scope=gm`
     * `scope=all` (admin only)
   * Returns array of character summaries.

3. `POST /api/characters`

   * Body:

     ```json
     {
       "id": "optional-if-updating",
       "character_json": { ...dsHeroObject... },
       "gm_email": "optional"
     }
     ```
   * Creates or updates.

4. `DELETE /api/characters/:id`

   * Deletes (soft) if owner or admin.

---

## 7. Database Design (MySQL on iFastNet)

**Table: `users`**

* `id` INT AUTO_INCREMENT PK
* `firebase_uid` VARCHAR(128) UNIQUE
* `email` VARCHAR(255) UNIQUE
* `display_name` VARCHAR(255) NULL
* `created_at` DATETIME
* `updated_at` DATETIME

**Table: `characters`**

* `id` INT AUTO_INCREMENT PK
* `owner_user_id` INT NOT NULL
* `gm_user_id` INT NULL
* `name` VARCHAR(255) NULL  ← optional cache of character name for listing
* `character_json` LONGTEXT NOT NULL  ← raw `.ds-hero`
* `is_deleted` TINYINT DEFAULT 0
* `created_at` DATETIME
* `updated_at` DATETIME
* FK (`owner_user_id`) → `users.id`
* FK (`gm_user_id`) → `users.id`

**Notes:**

* On save, server should try to read `name` from the JSON (like `"name": "Rathgar the Unyielding"`) and store it in the `name` column for faster lists.
* If GM is referenced by email but doesn’t exist, we can:

  * Option A (simple): leave `gm_user_id` NULL.
  * Option B: create a placeholder user with that email. (Call this out in implementation.)

---

## 8. Client Changes

* Replace calls to localStorage save/delete with API calls.
* On login, fetch `/api/characters?scope=mine` by default.
* Add a view/filter to switch between:

  * “My Characters”
  * “GM Characters”
  * “All Characters” (admin only)
* Add spinner and error states.
* Keep legacy “import from local file” feature if it already exists.

---

## 9. Migration

* No automatic migration required in this PRD.
* Users can open an old local character and press “Save” to push it to DB.
* Add a small banner: “You’re now saving to the server.”

---

## 10. VS Code Setup for AI to Access SQL

Goal: dev environment where AI tools in VS Code (GitHub Copilot Chat, OpenAI extension, etc.) can run or generate SQL against the actual schema.

Add to repo:

1. **`.vscode/settings.json`**

   * Add connection profile for MySQL/iFastNet:

     ```json
     {
       "sqltools.connections": [
         {
           "name": "ifastnet-mysql",
           "driver": "MySQL",
           "server": "YOUR_DB_HOSTNAME",
           "port": 3306,
           "database": "YOUR_DB_NAME",
           "username": "YOUR_DB_USER",
           "password": "YOUR_DB_PASSWORD"
         }
       ]
     }
     ```
   * This lets AI-aware extensions see the schema.

2. **`/db/schema.sql`**

   * Checked into git.
   * Contains `CREATE TABLE users (...)` and `CREATE TABLE characters (...)`.
   * AI can reference this file when generating queries.

3. **`.env.local` (not committed)**

   * `DATABASE_URL=mysql://user:pass@host:3306/dbname`
   * `FIREBASE_PROJECT_ID=...`
   * `FIREBASE_CLIENT_EMAIL=...`
   * `FIREBASE_PRIVATE_KEY=...`

4. **README snippet**

   * “Open VS Code → SQLTools → choose `ifastnet-mysql` → connect.”
   * So others can reproduce.

---

## 11. Security / Access Control

* Backend must verify Firebase token per request.
* Email from Firebase token is what we trust for identifying admin.
* All filtering is server-side.
* No client-side-only filtering.

---

## 12. Out of Scope (for this PRD)

* Offline-first sync.
* Version history of characters.
* Sharing characters to arbitrary users.
* Bulk import.

---

## 13. Acceptance Criteria

* ✅ User can log in with Firebase.
* ✅ After login, `GET /api/characters` returns only that user’s and GM-assigned characters.
* ✅ Admin email sees an “All characters” toggle and can list everything.
* ✅ Saving a character writes to SQL.
* ✅ Deleting a character marks it deleted in SQL.
* ✅ Character JSON in DB matches the `.ds-hero` format.
* ✅ Repo contains VS Code config to connect to iFastNet SQL.

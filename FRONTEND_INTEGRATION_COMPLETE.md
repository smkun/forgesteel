# Frontend-Backend Integration Complete

## Summary

Successfully integrated the React frontend with the Express backend API, including Firebase authentication and character storage services.

## Changes Made

### 1. Application Entry Point ([src/index.tsx](src/index.tsx))

**Added AuthProvider wrapper**:
- Imported `AuthProvider` from `@/contexts/AuthContext`
- Wrapped `<HashRouter>` with `<AuthProvider>` to provide authentication context throughout the app
- Auth state now available to all components via `useAuth()` hook

```typescript
<StrictMode>
  <AuthProvider>
    <HashRouter>
      <Main {...props} />
    </HashRouter>
  </AuthProvider>
</StrictMode>
```

### 2. Main Component ([src/components/main/main.tsx](src/components/main/main.tsx))

**Updated character persistence**:
- Imported `* as storage from '@/services/character-storage'`
- Imported `AuthPage` component
- Replaced `persistHeroes()` function to use new storage service:
  - Now uses `storage.saveCharacter()` for each hero
  - Automatically uses API when signed in, LocalForage when offline
  - Provides better error handling with console logging

**Added /auth route**:
- Added route: `<Route path='auth' element={<AuthPage />} />`
- Users can navigate to `/forgesteel/#/auth` for sign in/sign up

### 3. Environment Variables ([.env.local](.env.local))

**Added frontend API configuration**:
- `VITE_API_BASE_URL=http://localhost:4000` - Backend API URL for development
- `VITE_FIREBASE_API_KEY` - Already configured (Firebase client SDK key)

## Services Created (Previous Session)

### 1. Firebase Authentication Service ([src/services/firebase.ts](src/services/firebase.ts))

**Functions**:
- `signIn(email, password)` - Sign in with email/password
- `signUp(email, password)` - Create new account
- `signOut()` - Sign out current user
- `getIdToken()` - Get current user's Firebase ID token for API auth
- `getCurrentUser()` - Get currently signed-in user
- `onAuthChange(callback)` - Subscribe to auth state changes

### 2. API Client Service ([src/services/api.ts](src/services/api.ts))

**Character Endpoints**:
- `getCharacters(includeDeleted)` - GET /api/characters
- `getCharacter(id)` - GET /api/characters/:id
- `createCharacter(hero)` - POST /api/characters
- `updateCharacter(id, hero)` - PUT /api/characters/:id
- `deleteCharacter(id)` - DELETE /api/characters/:id

**Sharing Endpoints**:
- `shareCharacterWithGM(characterId, gmUserId)` - POST /api/characters/:id/share
- `unshareCharacterFromGM(characterId)` - DELETE /api/characters/:id/share
- `getCharacterAccessLevel(characterId)` - GET /api/characters/:id/access

**Auth Endpoint**:
- `getCurrentUserProfile()` - GET /api/auth/profile

**Features**:
- Automatic Firebase token injection in Authorization header
- ApiError class for structured error handling
- Base URL from VITE_API_BASE_URL environment variable

### 3. Character Storage Service ([src/services/character-storage.ts](src/services/character-storage.ts))

**Unified Storage Interface**:
- `getAllCharacters()` - Load all characters (API if signed in, LocalForage if offline)
- `getCharacter(id)` - Load single character
- `saveCharacter(hero)` - Save character (creates or updates automatically)
- `deleteCharacter(id)` - Delete character

**Migration Functions**:
- `needsMigration()` - Check if LocalForage has characters not in backend
- `migrateToBackend()` - Upload LocalForage characters to backend
- Returns `{ migrated: number, errors: number }`

**Storage Modes**:
- `StorageMode.API` - When user is signed in (uses backend API)
- `StorageMode.LOCAL` - When user is offline (uses LocalForage)
- Automatic fallback to LocalForage if API fails

### 4. Authentication Context ([src/contexts/AuthContext.tsx](src/contexts/AuthContext.tsx))

**Context State**:
- `user` - Current Firebase user (or null)
- `userProfile` - Backend user profile (email, admin status, etc.)
- `loading` - Authentication/profile loading state
- `error` - Error message (if any)

**Context Functions**:
- `signIn(email, password)` - Sign in and load profile
- `signUp(email, password)` - Sign up and create backend profile
- `signOut()` - Sign out and clear state
- `refreshProfile()` - Reload user profile from backend

**Features**:
- Automatic profile loading after sign in
- Automatic migration check and execution after sign in
- Subscribes to Firebase auth state changes
- Error handling for all operations

### 5. Authentication Page UI ([src/components/pages/auth/auth-page.tsx](src/components/pages/auth/auth-page.tsx))

**Features**:
- Toggle between sign in and sign up modes
- Email and password validation
- Error display (from AuthContext)
- Loading state during authentication
- Test account information display
- "Continue without signing in" link (offline mode)
- Beautiful gradient background with card UI
- Navigates to hero list after successful authentication

## How It Works

### User Flow: Sign In

1. User navigates to `/forgesteel/#/auth`
2. Enters email and password
3. AuthPage calls `signIn()` from AuthContext
4. AuthContext:
   - Signs in with Firebase Authentication
   - Loads user profile from backend API
   - Checks if migration is needed
   - If yes, uploads LocalForage characters to backend
5. AuthPage navigates to `/forgesteel/#/hero`
6. Hero list loads characters from backend API (via storage service)

### User Flow: Offline Mode

1. User navigates to `/forgesteel/#/hero` without signing in
2. Storage service detects no auth (StorageMode.LOCAL)
3. Characters load from LocalForage (offline storage)
4. All character operations use LocalForage
5. When user signs in later, characters are automatically migrated to backend

### Character Saving

1. User edits character in hero editor
2. Main component calls `persistHeroes(updatedHeroes)`
3. persistHeroes calls `storage.saveCharacter()` for each hero
4. Storage service:
   - If signed in: Checks if character exists in backend
     - Exists: Calls `api.updateCharacter()`
     - New: Calls `api.createCharacter()`
   - If offline: Saves to LocalForage
5. Character persisted successfully

## Testing Checklist

### ✅ Backend Server
- [x] Server running on port 4000
- [x] Firebase Admin SDK initialized
- [x] Test endpoints responding correctly
- [x] Sample character (Rathgar) loaded in database

### ✅ Frontend Server
- [x] Vite dev server running on port 5173
- [x] AuthProvider wrapping application
- [x] /auth route accessible
- [x] Character storage service integrated

### 🔄 Manual Testing Required

**Authentication Flow**:
- [ ] Navigate to http://localhost:5173/forgesteel/#/auth
- [ ] Test sign up with new email
- [ ] Test sign in with existing account (scottkunian@gmail.com)
- [ ] Verify error messages for invalid credentials
- [ ] Test "Continue without signing in" link

**Character Loading**:
- [ ] Sign in and verify characters load from backend
- [ ] Verify Rathgar character appears in hero list
- [ ] Test offline mode (without signing in)
- [ ] Verify LocalForage characters display in offline mode

**Character Saving**:
- [ ] Create new character while signed in
- [ ] Verify character saves to backend (check database)
- [ ] Edit existing character while signed in
- [ ] Verify updates save to backend
- [ ] Create character in offline mode
- [ ] Sign in and verify migration occurs

**Migration**:
- [ ] Create characters in offline mode (LocalForage)
- [ ] Sign in with account
- [ ] Verify console shows migration log
- [ ] Check backend database has migrated characters
- [ ] Verify no duplicate characters

**Error Handling**:
- [ ] Test with backend server stopped
- [ ] Verify fallback to LocalForage works
- [ ] Test with invalid Firebase credentials
- [ ] Verify error messages display correctly

## Server Status

### Backend Server
- **Status**: ✅ Running
- **Port**: 4000
- **URL**: http://localhost:4000
- **Health Check**: http://localhost:4000/healthz
- **Firebase**: Initialized (project: forgesteel-6e968)

### Frontend Server
- **Status**: ✅ Running
- **Port**: 5173
- **URL**: http://localhost:5173/forgesteel/
- **Auth Page**: http://localhost:5173/forgesteel/#/auth
- **Hero List**: http://localhost:5173/forgesteel/#/hero

## Database State

**Users**:
- ID 1: scottkunian@gmail.com (Admin, owner of Rathgar)
- ID 2: gm@example.com (Test GM user)

**Characters**:
- ID 1: Rathgar the Unyielding (Owner: User 1)
  - Ancestry: Aurealgar
  - Class: Fury
  - Level: 1
  - JSON Size: 2.67 MB

## Next Steps

1. **Manual Testing**: Follow the testing checklist above
2. **Bug Fixes**: Address any issues discovered during testing
3. **UI Improvements**: Add loading spinners during API calls if needed
4. **Error Messages**: Improve user-facing error messages
5. **Migration UI**: Consider adding UI feedback during migration
6. **Character List**: Ensure hero list page handles API characters correctly
7. **Sharing Features**: Test GM character sharing functionality
8. **Access Control**: Verify character access levels work correctly

## Files Modified

**Root Files**:
- `.env.local` - Added VITE_API_BASE_URL

**Source Files**:
- `src/index.tsx` - Added AuthProvider wrapper
- `src/components/main/main.tsx` - Updated persistHeroes, added /auth route

**New Files** (created in previous session):
- `src/services/firebase.ts` - Firebase authentication client
- `src/services/api.ts` - Backend API client
- `src/services/character-storage.ts` - Unified storage service
- `src/contexts/AuthContext.tsx` - Authentication context provider
- `src/components/pages/auth/auth-page.tsx` - Authentication UI page

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser (React App)                      │
├─────────────────────────────────────────────────────────────┤
│  AuthProvider (Context)                                     │
│    ├─ Manages user state                                    │
│    ├─ Handles sign in/sign up/sign out                      │
│    └─ Triggers migration after sign in                      │
├─────────────────────────────────────────────────────────────┤
│  Main Component                                              │
│    ├─ Routes (/, /auth, /hero, etc.)                        │
│    └─ Uses storage service for character persistence        │
├─────────────────────────────────────────────────────────────┤
│  Storage Service (character-storage.ts)                     │
│    ├─ StorageMode.API → Backend REST API                    │
│    └─ StorageMode.LOCAL → LocalForage (IndexedDB)           │
├─────────────────────────────────────────────────────────────┤
│  API Client (api.ts)                                         │
│    ├─ Automatic Firebase token injection                    │
│    ├─ Character CRUD endpoints                              │
│    └─ Sharing and access control endpoints                  │
├─────────────────────────────────────────────────────────────┤
│  Firebase Auth Client (firebase.ts)                         │
│    ├─ Email/password authentication                         │
│    └─ ID token management                                   │
└─────────────────────────────────────────────────────────────┘
                          ↓↑ HTTPS
┌─────────────────────────────────────────────────────────────┐
│              Backend REST API (Express)                     │
│                    Port 4000                                │
├─────────────────────────────────────────────────────────────┤
│  Auth Middleware                                             │
│    ├─ Verifies Firebase ID tokens                           │
│    └─ Loads user profile from database                      │
├─────────────────────────────────────────────────────────────┤
│  Character Logic                                             │
│    ├─ Ownership validation                                  │
│    ├─ Access control (owner/GM/admin)                       │
│    └─ GM sharing management                                 │
├─────────────────────────────────────────────────────────────┤
│  Repository Layer                                            │
│    ├─ Users repository                                      │
│    └─ Characters repository                                 │
└─────────────────────────────────────────────────────────────┘
                          ↓↑ SQL
┌─────────────────────────────────────────────────────────────┐
│                  MySQL Database                             │
│                  (iFastNet)                                 │
├─────────────────────────────────────────────────────────────┤
│  users table                                                 │
│    ├─ id, firebase_uid, email, display_name, is_admin      │
│    └─ created_at, updated_at                                │
├─────────────────────────────────────────────────────────────┤
│  characters table                                            │
│    ├─ id, owner_user_id, gm_user_id, name                  │
│    ├─ character_json (LONGTEXT - full Hero JSON)           │
│    ├─ is_deleted (soft delete)                             │
│    └─ created_at, updated_at                                │
└─────────────────────────────────────────────────────────────┘
```

## Key Concepts

### Storage Abstraction
The character-storage service provides a unified interface that automatically:
- Uses backend API when user is signed in
- Falls back to LocalForage when offline or API fails
- Handles migration from LocalForage to backend after sign in

### Authentication Flow
1. Firebase Authentication (client-side) provides user identity
2. Firebase ID token sent to backend in Authorization header
3. Backend verifies token with Firebase Admin SDK
4. Backend loads/creates user profile in MySQL database
5. User profile returned to frontend for display

### Character Ownership
- Every character has an `owner_user_id` (the user who created it)
- Characters can be shared with a GM via `gm_user_id`
- Access levels: `owner` (full control), `gm` (read/write), `admin` (full control)
- Soft delete: `is_deleted` flag instead of hard deletion

### Migration Strategy
- LocalForage characters migrated to backend after sign in
- Migration only uploads characters NOT already in backend (by hero.id)
- Migration results logged to console: `{ migrated: number, errors: number }`
- Original LocalForage data preserved (not deleted after migration)

---

**Status**: Integration Complete ✅
**Next**: Manual Testing and Bug Fixes 🧪

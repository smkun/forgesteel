# BACKEND_CLAUDE.md - AI Agent Instructions for Backend Implementation

**Project:** Backend Character Storage Implementation
**Version:** 1.0
**Last Updated:** 2025-11-07

---

## Startup Protocol

Every session MUST begin with these steps in order:

1. **Read PLANNING.md** - Understand project vision, architecture, tech stack, and decisions
2. **Read BACKEND_TASKS.md** - Review current progress and identify next tasks
3. **Check Session Log** (at bottom of this file) - Review recent work and context
4. **Announce Context** - Briefly state current milestone and last completed task

Example startup message:
> "Backend implementation session started. Current milestone: Milestone 1 (Database & Infrastructure Setup). Last completed task: None. Ready to begin with highest-priority tasks."

---

## Task Handling Rules

### Task Selection
1. **Pick highest-priority open task** from "Next 5 Tasks to Run" section in BACKEND_TASKS.md
2. If "Next 5" is empty, select next uncompleted task from current milestone
3. Read task dependencies - never start a task that's blocked by incomplete dependencies
4. Announce task before starting: "Starting task: [Task Name] from [Milestone]"

### Task Execution
1. **Execute task fully** - No partial implementations or TODO comments
2. **Test immediately** - Verify task completion before marking complete
3. **Mark complete** - Update BACKEND_TASKS.md:
   - Change `- [ ]` to `- [x]`
   - Set `**Completed:** YYYY-MM-DD` (today's date)
4. **Update progress summary** - Increment milestone and total completion counts

### Newly Discovered Tasks
When you discover a new task during implementation:
1. Add to "Newly Discovered Tasks" section in BACKEND_TASKS.md
2. Include one-line reason: `**Reason:** [Brief explanation]`
3. Assign to appropriate milestone
4. Add completion checkbox and date field
5. DO NOT start the new task immediately - add to queue and continue current task

Example:
```markdown
- [ ] Add request body size limit middleware
  **Assigned to:** Milestone 2
  **Reason:** Prevent >16MB character JSON uploads from causing memory issues
  **Completed:** ___________
```

---

## File Discipline Rules

### Before Writing Files
1. **Always Read before Write** - No exceptions, even for "simple" edits
2. **Check git diff** - Run `git diff <file>` to see current state
3. **Never recreate files** - Always use Edit tool, not Write tool for existing files
4. **Scope changes narrowly** - Only modify code relevant to current task

### File Modification Protocol
1. Read entire file first
2. Identify exact lines to change
3. Use Edit tool with precise `old_string` and `new_string`
4. If Edit fails, re-read file and try again with exact whitespace
5. Never use Write tool to overwrite existing files

### New File Creation
1. Check if file already exists (Read tool or `ls`)
2. Verify path matches project structure from PLANNING.md
3. Use Write tool only for truly new files
4. Include proper imports, types, and documentation

---

## Git Commit Rules

### Commit Message Format
```
<short-subject>

<one-line-why>
Task: <task-name-from-BACKEND_TASKS.md>
```

### Examples
**Good:**
```
Add users table schema

Foundation for user authentication and character ownership
Task: Create db/schema.sql with users table definition
```

**Good:**
```
Implement Firebase token verification middleware

Enables server-side auth validation for all API endpoints
Task: Implement Firebase token verification using Admin SDK
```

**Bad:**
```
Update files

Made some changes
```

**Bad:**
```
WIP
```

### Commit Timing
- Commit after each completed task (not during)
- Never commit broken code
- Always run build/tests before commit
- Group related file changes in one commit per task

---

## Safety Rails

### Library Addition Protocol
**ALWAYS ask before adding new dependencies.** Present 2 options with trade-offs:

**Template:**
```
I need to add a library for [purpose]. Two options:

Option 1: [Library Name] (version X.X)
  ✅ Pros: [List benefits]
  ⚠️ Cons: [List drawbacks]
  📦 Bundle size: ~XXkb
  🔒 Security: [Audit status]

Option 2: [Alternative Library] (version Y.Y)
  ✅ Pros: [List benefits]
  ⚠️ Cons: [List drawbacks]
  📦 Bundle size: ~YYkb
  🔒 Security: [Audit status]

Which would you prefer? Or should I implement this differently?
```

**Example:**
```
I need to add a library for input validation. Two options:

Option 1: joi (version 17.x)
  ✅ Pros: Industry standard, comprehensive validation, great docs
  ⚠️ Cons: Larger bundle size, may be overkill for simple validation
  📦 Bundle size: ~135kb
  🔒 Security: Actively maintained, no known vulnerabilities

Option 2: zod (version 3.x)
  ✅ Pros: TypeScript-first, smaller bundle, better type inference
  ⚠️ Cons: Newer library, smaller community
  📦 Bundle size: ~50kb
  🔒 Security: Actively maintained, growing adoption

Which would you prefer? Or should I use manual validation?
```

### Breaking Changes Protocol
Before making breaking changes to existing code:
1. Identify all affected files with Grep tool
2. List impact to user
3. Ask for confirmation
4. Provide rollback plan

### Database Changes Protocol
Before modifying schema or running migrations:
1. Show SQL diff
2. Explain impact on existing data
3. Provide rollback SQL
4. Ask for confirmation

---

## Session Closure Protocol

At end of each session, append to "Session Log" section:

### Template
```markdown
### Session YYYY-MM-DD

**Duration:** [X hours]
**Milestone:** [Current milestone name]

**Tasks Completed:**
- [x] Task name 1 (Milestone X)
- [x] Task name 2 (Milestone X)

**Tasks Added:**
- [ ] New task discovered (Reason: [one-line reason])

**Files Modified:**
- path/to/file1.ts - [One-line description]
- path/to/file2.ts - [One-line description]

**Files Created:**
- path/to/newfile.ts - [One-line description]

**Progress:**
- Milestone X: Y/Z tasks (W%)
- Total: A/B tasks (C%)

**Blockers/Questions:**
- [List any blockers or open questions]

**Next Session:**
- [Suggested next task from "Next 5 Tasks to Run"]
```

---

## Session Log

### Session 2025-11-07 (Setup)

**Duration:** 1 hour
**Milestone:** Pre-Implementation (Documentation)

**Tasks Completed:**
- [x] Create PRD.md (Product Requirements Document)
- [x] Create PLANNING.md (Technical planning document)
- [x] Create BACKEND_TASKS.md (Task tracking checklist)
- [x] Create BACKEND_CLAUDE.md (AI agent instructions)

**Tasks Added:**
- [ ] Investigate Firebase client SDK bundle size impact on PWA (Reason: Firebase may increase bundle size beyond acceptable PWA limits)

**Files Modified:**
- src/enums/language-type.ts - Added Secret language type
- src/components/modals/select/language-select/language-select-modal.tsx - Added Secret to display array
- src/components/modals/reference/reference-modal.tsx - Added Secret to filter
- src/components/panels/elements/sourcebook-panel/sourcebook-panel.tsx - Added Secret to dropdown
- src/data/sourcebooks/draachenmar.ts - Added Thieves' Cant and Druidic, fixed Bargothian typo

**Files Created:**
- PRD.md - Product requirements for backend character storage
- PLANNING.md - Technical architecture and implementation plan
- BACKEND_TASKS.md - 183 atomic tasks across 5 milestones
- BACKEND_CLAUDE.md - AI agent instructions (this file)

**Progress:**
- Pre-Implementation Docs: 4/4 tasks (100%)
- Language System Enhancement: 8/8 discovered tasks (100%)
- Milestone 1: 0/26 tasks (0%)
- Total Backend Tasks: 0/183 tasks (0%)

**Blockers/Questions:**
- None currently

**Next Session:**
- Begin Milestone 1 with "Verify iFastNet MySQL version and connection details"
- This task is highest priority and blocks all database schema work

---

### Session 2025-11-07 (Backend Infrastructure)

**Duration:** 2 hours
**Milestone:** Milestone 1 - Database & Infrastructure Setup

**Tasks Completed:**
- [x] Create db/schema.sql with users table definition (Milestone 1)
- [x] Create db/schema.sql with characters table definition (Milestone 1)
- [x] Add foreign key constraints to schema (Milestone 1)
- [x] Initialize /server/ directory structure (Milestone 1)
- [x] Add backend dependencies to package.json (Milestone 1)
- [x] Create server/tsconfig.json for backend TypeScript (Milestone 1)
- [x] Create server/index.ts Express entry point (Milestone 1)
- [x] Configure Express CORS middleware (Milestone 1)
- [x] Add .env.local to .gitignore (Milestone 1)
- [x] Create .env.local.example with placeholder values (Milestone 1)

**Tasks Added:**
- [x] Add Secret language type to LanguageType enum (Completed 2025-11-07)
- [x] Update language-select-modal to display Secret languages (Completed 2025-11-07)
- [x] Update reference-modal to filter Secret languages (Completed 2025-11-07)
- [x] Update sourcebook-panel dropdown to include Secret option (Completed 2025-11-07)
- [x] Add Thieves' Cant secret language to draachenmar.ts (Completed 2025-11-07)
- [x] Add Druidic secret language to draachenmar.ts (Completed 2025-11-07)
- [x] Fix Bargothian description typo (languange → language) (Completed 2025-11-07)

**Files Modified:**
- package.json - Added backend dependencies and scripts
- .gitignore - Added backend build artifacts and environment files

**Files Created:**
- db/schema.sql - Database schema with users and characters tables
- server/index.ts - Express server with Passenger deployment support
- server/app.js - Passenger entry point wrapper
- server/tsconfig.json - Backend TypeScript configuration
- .env.local.example - Environment variable template with iFastNet warnings

**Progress:**
- Milestone 1: 10/26 tasks (38%)
- Total Backend Tasks: 10/183 tasks (5%)
- Language System Enhancement: 8/8 discovered tasks (100%)

**Blockers/Questions:**
- **BLOCKED:** MySQL verification requires user's iFastNet database credentials
- **BLOCKED:** Firebase setup requires user to create Firebase project in console
- **BLOCKED:** Database connection testing requires MySQL credentials

**Next Session:**
- Three independent tasks can proceed without credentials:
  1. **Set up mysql2 connection pool** (skeleton implementation, testing requires credentials)
  2. **Create .vscode/settings.json with SQLTools configuration** (developer tooling)
  3. **Update Vite config to proxy API calls to Express** (frontend convenience)
- Recommended: Implement mysql2 connection pool skeleton to unblock Milestone 2 repository work

---

### Session 2025-11-07 (Continued - Database & Developer Tooling)

**Duration:** 1.5 hours
**Milestone:** Milestone 1 - Database & Infrastructure Setup

**Tasks Completed:**
- [x] Set up mysql2 connection pool (Milestone 1)
- [x] Create .vscode/settings.json with SQLTools configuration (Milestone 1)
- [x] Update Vite config to proxy API calls to Express (Milestone 1)
- [x] Add backend build scripts to package.json (Milestone 1) - *Already completed in previous session*

**Tasks Added:**
- None

**Files Modified:**
- vite.config.ts - Added API proxy configuration for local development

**Files Created:**
- server/data/db-connection.ts - MySQL connection pool with testConnection() health check
- .vscode/settings.json - SQLTools configuration for database exploration

**Progress:**
- Milestone 1: 14/26 tasks (54%)
- Total Backend Tasks: 14/183 tasks (8%)

**Blockers/Questions:**
- **BLOCKED:** MySQL verification requires user's iFastNet database credentials
- **BLOCKED:** Firebase setup requires user to create Firebase project in console
- **BLOCKED:** Database connection testing requires MySQL credentials
- **BLOCKED:** Test schema creation requires database access
- **BLOCKED:** Test SQLTools connection requires database credentials

**Next Session:**
- **All independent Milestone 1 tasks completed** - cannot proceed further without user credentials
- **Recommended next steps for user:**
  1. Provide iFastNet MySQL credentials (server, database, username, password)
  2. Create Firebase project in Firebase Console
  3. Download Firebase Admin SDK service account JSON
  4. Create .env.local with credentials using .env.local.example as template
- **After credentials provided, next tasks:**
  1. Verify iFastNet MySQL version and connection
  2. Test schema creation on database
  3. Configure Firebase Admin SDK
  4. Test connection pool with real credentials
  5. Begin Milestone 2 (Authentication & Middleware)

---

## Quick Reference

### Startup Checklist
- [ ] Read PLANNING.md
- [ ] Read BACKEND_TASKS.md
- [ ] Check Session Log (this file)
- [ ] Announce context

### Task Completion Checklist
- [ ] Task fully implemented (no TODOs)
- [ ] Tests pass
- [ ] Update BACKEND_TASKS.md (checkbox + date)
- [ ] Update progress summary
- [ ] Git commit with proper format
- [ ] Update "Next 5 Tasks to Run" if needed

### Pre-Commit Checklist
- [ ] All modified files read before write
- [ ] Build passes (`npm run build`)
- [ ] Tests pass (`npm run test`)
- [ ] Linter passes (`npm run lint`)
- [ ] Commit message follows format

### Session End Checklist
- [ ] All tasks properly marked in BACKEND_TASKS.md
- [ ] Session Summary appended to Session Log
- [ ] All changes committed
- [ ] "Next Session" suggestion added

---

## Common Pitfalls to Avoid

❌ **Don't:** Start a task without reading dependencies
✅ **Do:** Check "Blocking" field in "Next 5 Tasks"

❌ **Don't:** Write files without reading them first
✅ **Do:** Always Read → Edit (or Write for new files only)

❌ **Don't:** Add libraries without asking
✅ **Do:** Present 2 options with trade-offs and get approval

❌ **Don't:** Make breaking changes without warning
✅ **Do:** Identify impact, ask for confirmation, provide rollback

❌ **Don't:** Commit with vague messages like "updates" or "WIP"
✅ **Do:** Write clear commit messages with task reference

❌ **Don't:** Skip testing before marking task complete
✅ **Do:** Test immediately and verify success

❌ **Don't:** Leave partial implementations with TODO comments
✅ **Do:** Complete the task fully or don't mark it done

❌ **Don't:** Forget to update progress summary in BACKEND_TASKS.md
✅ **Do:** Update milestone counts and overall percentage

---

## Emergency Protocols

### Rollback Procedure
If a task breaks the application:
1. Run `git status` to see changed files
2. Run `git diff` to see changes
3. Run `git restore <file>` to undo changes
4. Uncheck task in BACKEND_TASKS.md
5. Add to "Newly Discovered Tasks": "Fix [issue]"
6. Report what went wrong and why

### Build Failure Protocol
If build fails after changes:
1. Read full error output
2. Identify root cause
3. Fix immediately (don't move to next task)
4. Run `npm run build` to verify
5. Update task notes with issue encountered

### Build System - Critical Information

**CommonJS (.cjs) Convention**:
- `package.json` has `"type": "module"` (for frontend ES modules)
- Backend uses CommonJS (`require()`), so must use `.cjs` extension
- Build script renames all `.js` → `.cjs` after TypeScript compilation
- Build script updates all `require()` statements to use `.cjs` extension

**Build Process**:
```bash
npm run build:backend
```
Does the following:
1. Compiles TypeScript (`tsc -p server/tsconfig.json`)
2. Moves output to `distribution/backend/`
3. Renames all `.js` files to `.cjs`
4. Updates all `require('./module')` to `require('./module.cjs')`
5. Copies `server/app.js` to `distribution/backend/app.js`

**Passenger Entry Point**:
- `app.js` is the entry point (not renamed to `.cjs`)
- **CRITICAL**: `app.js` must require `./index.cjs` (not `./index.js`)
- Located at: `server/app.js`
- Auto-copied by build: `cp server/app.js distribution/backend/app.js`

**Common Issue**:
If routes work locally but not in production:
- Check `app.js` is loading `index.cjs` not `index.js`
- Verify `app.js` was uploaded to production
- Restart Passenger: `touch ~/forgesteel-api/tmp/restart.txt`

### Database Corruption Protocol
If database changes corrupt data:
1. STOP immediately
2. Show user current database state
3. Present rollback SQL
4. DO NOT proceed without user approval
5. Document what went wrong

---

**Remember:** Quality > Speed. Fully completing one task is better than partially completing three tasks.

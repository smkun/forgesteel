# SQLTools Setup Guide

VS Code database exploration tool configuration for Forgesteel backend.

## Prerequisites

1. **VS Code** installed
2. **SQLTools extension** installed:
   - Open VS Code Extensions (Ctrl+Shift+X)
   - Search for "SQLTools"
   - Install "SQLTools" by Matheus Teixeira
   - Install "SQLTools MySQL/MariaDB" driver

## Configuration

The `.vscode/settings.json` file already contains two connection configurations:

### 1. iFastNet MySQL (Production)
```json
{
  "name": "iFastNet MySQL (Forgesteel)",
  "driver": "MySQL",
  "server": "31.22.4.44",
  "port": 3306,
  "database": "gamers_forgesteel",
  "username": "gamers_sa",
  "askForPassword": true
}
```

### 2. Local MySQL (Development)
```json
{
  "name": "Local MySQL (Development)",
  "driver": "MySQL",
  "server": "localhost",
  "port": 3306,
  "database": "forgesteel_dev",
  "username": "root",
  "askForPassword": true
}
```

## Testing the Connection

1. **Open SQLTools Panel**:
   - Click the SQLTools icon in VS Code sidebar (database icon)
   - Or press `Ctrl+Alt+D`

2. **Connect to iFastNet**:
   - Click "iFastNet MySQL (Forgesteel)" connection
   - Enter password when prompted: `KAd5Og-nJbDc%?C&`
   - Should see green indicator and database tables

3. **Verify Tables**:
   - Expand `gamers_forgesteel` database
   - Should see:
     - `users` table (0 rows)
     - `characters` table (0 rows)

4. **Test Query**:
   - Right-click connection → "New SQL File"
   - Run query:
     ```sql
     SELECT * FROM users LIMIT 10;
     ```
   - Should execute successfully (returns 0 rows)

## Troubleshooting

**Connection Timeout:**
- Check firewall settings
- Verify iFastNet allows remote MySQL connections
- Try increasing connectionTimeout in settings

**Authentication Failed:**
- Verify password is correct
- Check username matches: `gamers_sa`
- Ensure MySQL user has remote access permissions

**Tables Not Visible:**
- Refresh connection (right-click → Refresh)
- Verify database name: `gamers_forgesteel`
- Check schema deployment ran successfully

## Alternative: Command Line Test

If SQLTools doesn't work, test connection via command line:

```bash
# Test connection
npx tsx server/test-connection.ts

# Expected output:
# [TEST] ✅ MySQL connection pool established
# [TEST] MySQL Version: 11.4.8-MariaDB-cll-lve-log
# [TEST] Database: gamers_forgesteel
# [TEST] Existing Tables: characters, users
```

## Next Steps

Once SQLTools connection is verified, you can:
- Browse database schema
- Run ad-hoc queries for testing
- View character data as it's created
- Monitor database changes in real-time

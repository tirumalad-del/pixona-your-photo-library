# Database Error Fix: "no such column: file_hash"

## Error Details

```
Uncaught Exception:
SqliteError: no such column: file_hash
    at Database.exec
    at file:///C:/Users/tirum/Downloads/pixona-your-photo-library-main/pixona-your-photo-library-main/dist-electron/main.js:17:4
```

## Root Cause

You have an **OLD database file** from a previous version of PIXONA that uses a different schema. The current code expects a `file_hash` column in the database that doesn't exist in your old database.

**Database Location:**
```
C:\Users\tirum\AppData\Roaming\pixona-photo-library\pixona.db
```

---

## SOLUTION: Delete Old Database

The database schema has been updated. You MUST delete the old database file to allow the application to create a new one with the correct schema.

### Step 1: Close PIXONA Application

Make sure the application is completely closed.

### Step 2: Delete Old Database File

**Option A: Using File Explorer**
1. Press `Win + R`
2. Type: `%APPDATA%\pixona-photo-library`
3. Press Enter
4. Delete the file `pixona.db`

**Option B: Using PowerShell**
```powershell
# Delete the old database
del C:\Users\tirum\AppData\Roaming\pixona-photo-library\pixona.db

# OR delete entire folder to start completely fresh
rm -r -Force C:\Users\tirum\AppData\Roaming\pixona-photo-library
```

### Step 3: Download Latest Code

**IMPORTANT:** Also make sure you have the LATEST code from GitHub.

```powershell
# Download fresh code from:
https://github.com/tirumalad-del/pixona-your-photo-library/archive/refs/heads/main.zip

# Then:
cd C:\Users\tirum\Downloads\pixona-your-photo-library-main\pixona-your-photo-library-main
npm install
npm run build
npm start
```

### Step 4: Start Application

When you start the application, it will automatically create a NEW database with the correct schema including the `file_hash` column.

---

## What Changed in Database Schema

The new database schema includes:

### Photos Table
```sql
CREATE TABLE photos (
  id TEXT PRIMARY KEY,
  path TEXT UNIQUE NOT NULL,
  filename TEXT NOT NULL,
  file_hash TEXT,           -- ✅ NEW COLUMN
  file_size INTEGER,
  created_at INTEGER,
  modified_at INTEGER,
  taken_at INTEGER,
  width INTEGER,
  height INTEGER,
  camera_make TEXT,
  camera_model TEXT,
  iso INTEGER,
  aperture REAL,
  shutter_speed TEXT,
  focal_length REAL,
  latitude REAL,
  longitude REAL,
  has_gps BOOLEAN DEFAULT 0,
  rating INTEGER DEFAULT 0,
  favorite BOOLEAN DEFAULT 0,
  indexed_at INTEGER
)
```

The `file_hash` column is used for:
- Duplicate detection
- File integrity verification  
- Change detection

---

## Verification

After deleting the old database and restarting:

1. ✅ Application should start without errors
2. ✅ New database file will be created automatically
3. ✅ You can begin scanning photos
4. ✅ No "no such column: file_hash" error

---

## Important Notes

⚠️ **Deleting the database will:**
- Remove all previously scanned photo metadata
- Remove any ratings, favorites, or tags you added
- Require re-scanning your photo folders

✅ **Your actual photo files are NOT affected** - only the database metadata is deleted.

⚠️ **Backup (Optional):**
If you want to keep the old database:
```powershell
# Backup old database before deleting
copy C:\Users\tirum\AppData\Roaming\pixona-photo-library\pixona.db C:\Users\tirum\Desktop\pixona-old-backup.db
```

---

## If Error Persists

If you still see the error after deleting the database:

1. **Check the database was actually deleted:**
   ```powershell
   Test-Path C:\Users\tirum\AppData\Roaming\pixona-photo-library\pixona.db
   ```
   Should return `False`

2. **Make sure you downloaded LATEST code from GitHub**
   - Download link: https://github.com/tirumalad-del/pixona-your-photo-library/archive/refs/heads/main.zip
   - Your old downloaded ZIP is outdated

3. **Check you're in the correct folder:**
   ```powershell
   pwd
   # Should show: C:\Users\tirum\Downloads\pixona-your-photo-library-main\pixona-your-photo-library-main
   ```

4. **Rebuild from scratch:**
   ```powershell
   rm -r node_modules
   npm install
   npm run build
   npm start
   ```

---

## Summary

**Problem:** Old database schema is incompatible with new code  
**Solution:** Delete old database file at `C:\Users\tirum\AppData\Roaming\pixona-photo-library\pixona.db`  
**Result:** New database with correct schema will be created automatically

**The error will be COMPLETELY RESOLVED after deleting the old database!**

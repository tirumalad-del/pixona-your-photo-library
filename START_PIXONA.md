# 🚨 CRITICAL: Fix Database Error - START HERE

## ⚠️ ERROR: "SqliteError: no such column: file_hash"

### WHY THIS ERROR HAPPENS
You have an **OLD database file** from a previous version that doesn't have the new schema columns.

### ✅ SOLUTION (2 Steps)

#### **STEP 1: Delete Old Database (REQUIRED)**

Open PowerShell and run:

```powershell
Remove-Item "$env:APPDATA\pixona-photo-library\pixona.db" -Force
```

**OR** Manually delete this file:
```
C:\Users\tirum\AppData\Roaming\pixona-photo-library\pixona.db
```

---

#### **STEP 2: Download Fresh Code & Run**

```powershell
# 1. Close PIXONA if running

# 2. Delete old download folder
Remove-Item "$env:USERPROFILE\Downloads\pixona-your-photo-library-main" -Recurse -Force -ErrorAction SilentlyContinue

# 3. Download latest code
Invoke-WebRequest -Uri "https://github.com/tirumalad-del/pixona-your-photo-library/archive/refs/heads/main.zip" -OutFile "$env:USERPROFILE\Downloads\pixona-latest.zip"

# 4. Extract
Expand-Archive "$env:USERPROFILE\Downloads\pixona-latest.zip" -DestinationPath "$env:USERPROFILE\Downloads" -Force

# 5. Navigate to folder
cd "$env:USERPROFILE\Downloads\pixona-your-photo-library-main"

# 6. Install and run
npm install
npm run dev
```

---

## 🎯 WHAT HAPPENS NEXT

✅ **NEW database** will be created with correct schema  
✅ **All columns** (file_hash, organized_path, original_path) will exist  
✅ **NO MORE ERRORS** - App will start successfully  
✅ **Migration system** will protect against future schema changes

---

## ⚠️ IMPORTANT NOTES

1. **You MUST delete the old database** - The migration system works for incremental changes, but can't fix a completely incompatible schema
2. **All your scanned photos will be lost** - You'll need to scan your photos again
3. **This is a ONE-TIME fix** - Future updates will use the automatic migration system

---

## 🔍 VERIFY IT WORKED

After running the steps above, you should see:
- ✅ PIXONA starts without errors
- ✅ All pages load correctly
- ✅ No "SqliteError" messages
- ✅ Ready to scan photos

---

## 📞 STILL HAVING ISSUES?

If you still see errors after following these steps:

1. Make sure you deleted the database file in STEP 1
2. Make sure you downloaded the LATEST code (not the old folder)
3. Check that you're in the correct folder: `pixona-your-photo-library-main`
4. Try deleting `node_modules` and running `npm install` again

---

**Last Updated:** 6 PM GMT, January 25, 2026  
**Fix Applied:** Automatic migration system + Database reset requirement

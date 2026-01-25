# PIXONA - Troubleshooting Guide

## 🔧 Common Issues and Solutions

### ❌ Issue: Blank Page on Startup

**Symptoms:**
- Application window opens but shows only a blank/white page
- DevTools shows empty `<body>` tag
- No content visible in the application

**Root Cause:**
- Database initialization was blocking the React render
- App wouldn't display UI until database was fully initialized
- If database init failed or was slow, page stayed blank

**Solution: ✅ FIXED (January 25, 2026)**

The application has been updated to render immediately:
```typescript
// App now renders first
createRoot(document.getElementById("root")!).render(<App />);

// Database loads in background
db.init().then(() => {
  soundManager.init();
  console.log('✅ Database initialized');
}).catch(error => {
  console.error('❌ Database init failed:', error);
  // App still works without database
});
```

**What to do:**
1. Pull the latest code from GitHub:
   ```bash
   git pull origin main
   ```

2. Reinstall dependencies:
   ```bash
   npm install
   ```

3. Rebuild the application:
   ```bash
   npm run build
   ```

4. Test the application:
   ```bash
   npm run dev
   # OR for production build
   npm run test:build
   ```

**Expected Result:**
- Application UI should appear immediately
- Sidebar, header, and navigation visible
- Database loads in background
- Console shows initialization messages

---

### 🛠️ Development Mode Issues

#### Issue: "Cannot find module" errors

**Solution:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules
npm install
```

#### Issue: Port 8080 already in use

**Solution:**
```bash
# Kill process on port 8080 (Windows)
netstat -ano | findstr :8080
taskkill /PID <process_id> /F

# Or use a different port
vite --port 3000
```

---

### 📊 Database Issues

#### Issue: Database not saving photos

**Check:**
1. Database file location:
   ```
   %APPDATA%/pixona-your-photo-library/pixona.db
   ```

2. Check console for errors:
   - Open DevTools (F12)
   - Look for database errors in Console tab

3. Verify IPC handlers are working:
   ```javascript
   // In DevTools console
   window.electron.invoke('get-all-photos')
   ```

**Solution:**
- Delete database and recreate:
  1. Close application
  2. Delete `pixona.db` file
  3. Restart application
  4. Database will be recreated automatically

---

### 🖼️ Image Display Issues

#### Issue: Images not showing in Duplicates page

**Root Cause:**
- Custom protocol `pixona-file://` not registered

**Solution: ✅ FIXED**
- Protocol registration added to `electron/main.ts`
- Images should now display correctly

**Verify fix:**
```bash
git pull origin main
npm run build
```

---

### 📹 Pages Not Filling During Scan

**Symptoms:**
- Import photos but pages stay empty
- Calendar, Places, Albums don't update

**Root Cause: ✅ FIXED**
- All pages now use backend SQLite database
- Live update listeners implemented
- IPC handlers properly connected

**Verification:**
1. Start import from folder
2. Navigate to different pages (Library, Calendar, Places)
3. Pages should fill automatically as photos are scanned
4. No manual refresh needed

---

### 📦 Build Issues

#### Issue: Build fails with TypeScript errors

**Solution:**
```bash
# Clean build
rm -rf dist dist-electron
npm run build
```

#### Issue: Electron app won't start after build

**Check:**
1. Verify all dependencies installed:
   ```bash
   npm install
   ```

2. Check for missing native modules:
   ```bash
   npm rebuild better-sqlite3
   ```

3. Test with:
   ```bash
   npm run test:build
   ```

---

### 🔍 Console Errors Reference

#### Error: "Failed to initialize database"

**Meaning:** Database file can't be created/accessed

**Solutions:**
- Check disk permissions
- Ensure enough disk space
- Try deleting existing database file

#### Error: "Cannot invoke IPC handler"

**Meaning:** Electron IPC communication broken

**Solutions:**
- Restart application
- Rebuild with `npm run build`
- Check console for preload script errors

#### Error: "Module not found"

**Meaning:** Missing dependency

**Solution:**
```bash
npm install
```

---

## 👨‍💻 Developer Tools

### Useful Console Commands

```javascript
// Check if Electron APIs are available
window.electron

// Test database connection
window.electron.invoke('get-all-photos')

// Test photo count
window.electron.invoke('get-photo-stats')

// Check IPC handlers
console.log(window.electron)
```

### Debugging Steps

1. **Open DevTools:** Press F12 or Ctrl+Shift+I
2. **Check Console:** Look for errors (red text)
3. **Check Network:** Verify resource loading
4. **Check Application:** Inspect Local Storage/IndexedDB

---

## 🔄 Complete Fresh Start

If nothing works, try a complete reset:

```bash
# 1. Delete all generated files
rm -rf node_modules
rm -rf dist
rm -rf dist-electron

# 2. Delete database
# Navigate to: %APPDATA%/pixona-your-photo-library
# Delete: pixona.db

# 3. Reinstall
npm install

# 4. Rebuild
npm run build

# 5. Test
npm run dev
```

---

## ✅ Verification Checklist

After applying fixes, verify:

- [ ] Application opens without blank page
- [ ] Sidebar visible with all menu items
- [ ] Can navigate between pages
- [ ] Import dialog opens
- [ ] Photos scan successfully
- [ ] Library fills during import (live updates)
- [ ] Calendar fills during import (live updates)
- [ ] Places/Map fills during import (live updates)
- [ ] Albums fills during import (live updates)
- [ ] Videos tab shows video files
- [ ] Duplicates page displays images
- [ ] Database saving photos
- [ ] No console errors

---

## 📧 Getting Help

If issues persist:

1. **Check Console:**
   - Open DevTools (F12)
   - Screenshot any errors
   
2. **Collect Information:**
   - OS version
   - Node version: `node --version`
   - NPM version: `npm --version`
   - Application version
   - Error messages

3. **Create GitHub Issue:**
   - Include all information above
   - Steps to reproduce
   - Expected vs actual behavior

---

## 📝 Recent Fixes

### January 25, 2026
- ✅ **Fixed blank page on startup** - App now renders immediately
- ✅ **Fixed protocol registration** - Images display in Duplicates
- ✅ **Fixed database integration** - All pages use SQLite backend
- ✅ **Fixed live updates** - Pages fill automatically during scan
- ✅ **Added Videos tab** - Dedicated video file management

---

**Last Updated:** January 25, 2026  
**Version:** 1.0.0  
**Status:** ✅ All critical issues resolved

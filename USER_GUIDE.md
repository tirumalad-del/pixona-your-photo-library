# PIXONA User Guide

## Table of Contents
1. [Getting Started](#getting-started)
2. [First Time Setup](#first-time-setup)
3. [Scanning Your Library](#scanning-your-library)
4. [Library Features](#library-features)
5. [Map View (Places)](#map-view-places)
6. [Albums](#albums)
7. [People Recognition](#people-recognition)
8. [Duplicate Management](#duplicate-management)
9. [Settings](#settings)
10. [Troubleshooting](#troubleshooting)

---

## Getting Started

### System Requirements
- **Operating System**: Windows 10/11 (64-bit)
- **RAM**: Minimum 8GB (16GB recommended for large libraries)
- **Storage**: SSD recommended for better performance
- **Display**: 1920x1080 or higher resolution

### Installation
1. Download the latest PIXONA installer from the releases page
2. Run `PIXONA-Setup.exe`
3. Follow the installation wizard
4. Launch PIXONA from your desktop shortcut

---

## First Time Setup

### Initial Launch
When you first launch PIXONA:
1. You'll see the welcome screen
2. Click **"Start Scanning"** to begin importing your photos
3. The application will prompt you to select folders to scan

### Selecting Folders to Scan
- Click **Settings** > **Library Paths**
- Add folders containing your photos/videos
- You can add multiple drives (C:/, D:/, E:/, etc.)
- Common locations:
  - `C:\Users\YourName\Pictures`
  - External hard drives
  - Network drives (if accessible)

---

## Scanning Your Library

### How Scanning Works
PIXONA scans your folders in two phases:

#### Phase 1: Enumeration
- Discovers all photo and video files
- Shows total file count
- Progress: "Enumerating files..."

#### Phase 2: Indexing
- Extracts metadata (EXIF data, GPS coordinates, camera info)
- Generates file hashes for duplicate detection
- Organizes files by date
- Progress bar shows completion percentage

### Supported File Formats

**Images**:
- `.jpg`, `.jpeg`, `.png`, `.gif`, `.bmp`, `.webp`, `.heic`, `.heif`

**Videos**:
- `.mp4`, `.mov`, `.avi`, `.mkv`, `.webm`, `.m4v`

### Scan Progress
- Real-time progress updates in the status bar
- Shows: `Scanning... X / Y files (Z%)`
- Current file path displayed
- You can continue browsing while scanning

### Re-scanning
To refresh your library:
1. Go to **Settings** > **Library**
2. Click **"Rescan Library"**
3. Confirm the action (this will clear existing data)

---

## Library Features

### View Modes
PIXONA offers three view modes:

1. **Grid View** (Default)
   - Thumbnail grid layout
   - Best for browsing large collections
   - Adjustable thumbnail size

2. **List View**
   - Detailed file information
   - Shows filename, date, size, location
   - Sortable columns

3. **Timeline View**
   - Chronological organization
   - Photos grouped by date
   - Perfect for finding memories

### Media Type Tabs

#### All Tab
- Shows all photos and videos
- Total count displayed

#### Photos Tab
- Filters to show only images
- Excludes video files

#### Videos Tab
- Shows only video files
- Playback on click

### AI-Powered Search
- Natural language queries
- Examples:
  - "beach sunset"
  - "people smiling"
  - "cats and dogs"
  - "mountains"
- Works without pre-tagging
- Results appear in real-time

### Selection Mode
1. Click **"Select Items"** in status bar
2. Click photos to select/deselect
3. Selected count shown at top
4. Options:
   - **Edit Metadata**: Batch edit selected items
   - **Cancel**: Exit selection mode

---

## Map View (Places)

### Accessing Map View
- Click **"Places"** in the sidebar
- Or press `Ctrl+M`

### Features

#### Interactive World Map
- Powered by OpenStreetMap
- Marker clustering for dense areas
- Zoom and pan controls

#### Photo Markers
- Each marker represents a location
- Click marker to see photo thumbnails
- Shows photo count at each location
- GPS coordinates displayed

#### Location Groups
- Photos taken at similar coordinates are grouped
- Precision: ~100 meters
- Click thumbnail to open lightbox

### Requirements
- Photos must have GPS data in EXIF
- Data extracted during library scan
- Most smartphones automatically add GPS data

### No Location Data?
If you see "No Location Data":
- Your photos don't have GPS information
- Only GPS-tagged photos appear on the map
- Solution: Use a smartphone or GPS-enabled camera

---

## Albums

### Creating Albums
1. Go to **Albums** tab
2. Click **"Create Album"**
3. Enter album name
4. Add photos by:
   - Dragging and dropping
   - Selecting from library
   - Smart selection by date/location

### Smart Albums
Automatic albums based on:
- Date ranges
- Locations
- Camera models
- File types

### Album Management
- **Rename**: Right-click album > Rename
- **Delete**: Right-click album > Delete (doesn't delete photos)
- **Share**: Export album as folder

---

## People Recognition

### Face Detection
- Automatic face detection during scan
- Powered by face-api.js
- Browser-based processing (private)

### Naming People
1. Go to **People** tab
2. Click on an unnamed person cluster
3. Enter their name
4. PIXONA will suggest similar faces

### Privacy
- All face recognition happens locally
- No data sent to cloud
- Face data stored in local database

---

## Duplicate Management

### How It Works
PIXONA detects duplicates using:
1. **File Hash**: Exact duplicates
2. **Perceptual Hash**: Near-duplicates
3. **Metadata Comparison**: Same photo, different edits

### Viewing Duplicates
1. Go to **Duplicates** tab
2. Browse duplicate groups
3. See all versions side-by-side

### Managing Duplicates
- **Keep Original**: Mark the version to keep
- **Delete Others**: Move duplicates to trash
- **Space Saved**: Shows potential space reclamation

### Safe Deletion
- Files moved to Windows Recycle Bin
- Can be restored if needed
- No permanent deletion by default

---

## Settings

### Library Settings
- **Library Paths**: Add/remove scan folders
- **Rescan Library**: Refresh database
- **Clear Database**: Reset everything

### Display Settings
- **Theme**: Light/Dark mode
- **Thumbnail Size**: Small/Medium/Large
- **Date Format**: Customize display

### Performance Settings
- **Cache Size**: Thumbnail cache limit
- **Background Scanning**: Enable/disable
- **Batch Size**: Number of files processed at once

### Privacy Settings
- **Face Recognition**: Enable/disable
- **Location Data**: Show/hide GPS info
- **Telemetry**: Usage statistics (off by default)

---

## Troubleshooting

### Photos Not Appearing
**Check:**
- File format is supported
- Folder is added to library paths
- Scan completed successfully
- No file permission issues

**Solution:**
- Go to Settings > Rescan Library
- Check console for errors (F12)

### Map View Empty
**Reason:**
- Photos don't have GPS data

**Solution:**
- Use GPS-enabled camera/smartphone
- Manually geotag photos in photo editor

### Slow Performance
**Causes:**
- Large library (100,000+ files)
- Limited RAM
- HDD instead of SSD

**Solutions:**
- Increase cache size in settings
- Close other applications
- Upgrade to SSD
- Reduce thumbnail size

### Database Corruption
**Symptoms:**
- App crashes on startup
- Missing photos
- Errors in console

**Fix:**
1. Close PIXONA
2. Delete database file: `%APPDATA%\PIXONA\photos.db`
3. Restart PIXONA
4. Rescan library

### Videos Not Playing
**Check:**
- Codec support
- File not corrupted
- Video format in supported list

**Solution:**
- Install K-Lite Codec Pack
- Convert video to MP4 format

---

## Keyboard Shortcuts

### Global
- `Ctrl+N`: New search
- `Ctrl+F`: Focus search bar
- `Ctrl+,`: Open settings
- `F11`: Fullscreen
- `F5`: Refresh

### Navigation
- `Ctrl+1`: Library view
- `Ctrl+2`: Albums
- `Ctrl+3`: People
- `Ctrl+4`: Places
- `Ctrl+5`: Duplicates

### Photo Viewer
- `Space`: Next photo
- `Backspace`: Previous photo
- `Esc`: Close viewer
- `Delete`: Move to trash
- `F`: Toggle favorite

### Selection
- `Ctrl+A`: Select all
- `Ctrl+D`: Deselect all
- `Ctrl+I`: Invert selection

---

## Tips & Best Practices

### Organizing Your Library
1. **Use Albums**: Group related photos
2. **Tag People**: Name faces as you go
3. **Regular Scans**: Weekly re-scans for new photos
4. **Backup Database**: Export database monthly

### Performance Optimization
1. **SSD Storage**: Dramatically faster
2. **Limit Folders**: Don't scan entire drives
3. **Cache Management**: Clear cache monthly
4. **Close Unused Tabs**: Free up memory

### Privacy & Security
1. **Local Processing**: All data stays on your PC
2. **No Cloud Sync**: Complete privacy
3. **Encrypted Database**: Optional password protection
4. **Face Data**: Delete anytime in settings

---

## Getting Help

### Support Channels
- **GitHub Issues**: [Report bugs](https://github.com/tirumalad-del/pixona-your-photo-library/issues)
- **Discussions**: [Ask questions](https://github.com/tirumalad-del/pixona-your-photo-library/discussions)
- **Documentation**: Check README.md

### Before Asking for Help
1. Check this user guide
2. Search existing issues
3. Update to latest version
4. Check console for errors (F12)

### Reporting Bugs
Include:
- PIXONA version
- Windows version
- Steps to reproduce
- Screenshots/error messages
- Console logs (F12)

---

## Version History

### v1.0.0 (Latest)
- Initial release
- Core photo library management
- Map view with GPS support
- Video/Photo filtering tabs
- AI-powered search
- Duplicate detection
- Dark mode UI

---

**Made with ❤️ by the PIXONA Team**

*Last Updated: January 25, 2026*

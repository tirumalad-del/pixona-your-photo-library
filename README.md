# PIXONA - Desktop Photo Manager

A powerful desktop photo management application for Windows inspired by Apple Photos. Built with modern web technologies and packaged as a native desktop app using Electron.

![PIXONA](https://img.shields.io/badge/version-1.0.0-blue) ![Platform](https://img.shields.io/badge/platform-Windows-blue) ![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Features

### Current Features
- 🖼️ **Photo Library Management** - Browse and organize your photos in a beautiful grid layout
- 📂 **Multi-Drive Support** - Scan photos from multiple drives (C:/, D:/, E:/) and custom folders
- 🎨 **Modern Dark UI** - Clean, Apple Photos-inspired interface with smooth animations
- 📊 **Status Indicators** - Real-time scanning progress and library statistics
- 🔍 **Photo Organization** - View photos by Library, Albums, People, Places, and Duplicates
- ⚙️ **Settings** - Customize your experience with comprehensive settings

### Upcoming Features (Roadmap)
- 👤 **Face Recognition** - Automatic face detection and grouping using face-api.js
- 🌍 **GPS Map View** - Interactive world map showing geotagged photos with OpenStreetMap & Leaflet.js
- 🔄 **Duplicate Detection** - Smart duplicate and near-duplicate photo detection using perceptual hashing
- 📍 **Location Tagging** - Automatic location detection from EXIF GPS data
- 📅 **Event Auto-Grouping** - Intelligent photo grouping by time, location, and detected faces
- 💾 **SQLite Database** - Fast local indexing and metadata storage for large libraries
- 🗑️ **Safe Deletion** - Move duplicates to trash with space reclamation preview
- 📷 **Thumbnail Caching** - Fast loading with intelligent background thumbnail generation
- 🔄 **Background Scanning** - Incremental library updates without blocking the UI

## 🚀 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.x or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Git** (optional, for cloning) - [Download here](https://git-scm.com/)

To verify your installation:
```bash
node --version  # Should be v18.x or higher
npm --version   # Should be v9.x or higher
```

## 📦 Installation

### 1. Clone or Download the Repository
```bash
git clone <your-repo-url>
cd pixona
```

Or download and extract the ZIP file.

### 2. Install Dependencies
```bash
npm install
```

This will install all required packages including:
- React, TypeScript, Tailwind CSS (UI framework)
- Electron (desktop app packaging)
- Vite (build tool)
- All supporting libraries

## 🛠️ Development

### Run in Development Mode
Start the development server with hot-reload:

```bash
npm run dev
```

This will:
- Start the Vite dev server on `http://localhost:8080`
- Launch the Electron app window
- Enable hot-reload for instant updates
- Open DevTools for debugging

The app will automatically reload when you make code changes.

### Project Structure
```
pixona/
├── electron/              # Electron main process files
│   ├── main.ts           # Main Electron process (IPC handlers, window management)
│   ├── preload.ts        # Preload script (secure IPC bridge)
│   └── tsconfig.json     # TypeScript config for Electron
├── src/                  # React application source
│   ├── components/       # Reusable UI components
│   │   ├── Sidebar.tsx   # Main navigation sidebar
│   │   ├── PhotoGrid.tsx # Photo grid display
│   │   ├── StatusBar.tsx # Bottom status bar
│   │   └── ui/           # shadcn/ui components
│   ├── pages/            # Main app pages/views
│   │   ├── Library.tsx   # Main photo library view
│   │   ├── People.tsx    # Face recognition view (upcoming)
│   │   ├── Albums.tsx    # Album organization
│   │   ├── Places.tsx    # Map view (upcoming)
│   │   ├── Duplicates.tsx # Duplicate detection (upcoming)
│   │   └── Settings.tsx  # App settings
│   ├── lib/              # Utilities and helpers
│   │   ├── mockData.ts   # Mock photo data (for development)
│   │   └── utils.ts      # Utility functions
│   ├── types/            # TypeScript definitions
│   ├── index.css         # Global styles & design system
│   └── App.tsx           # Main app component
├── public/               # Static assets
├── electron-builder.json # Electron build configuration
├── vite.config.ts        # Vite & Electron plugin config
├── tailwind.config.ts    # Tailwind CSS configuration
└── package.json          # Dependencies and scripts
```

## 📸 Scanning Photos from Drives

### How Photo Scanning Works

PIXONA can scan and index photos from any location on your Windows PC:

1. **Multi-Drive Support**: Automatically detects all available drives (C:/, D:/, E:/, etc.)
2. **Custom Folders**: Select specific folders using the folder picker dialog
3. **Smart Filtering**: Only indexes supported image formats (JPG, PNG, GIF, HEIC) and videos (MP4, MOV, AVI)
4. **Progress Tracking**: Real-time updates showing current scan path and files found
5. **Background Processing**: Scans run without blocking the UI

### Using the Scanner (Current Implementation)

The scanning functionality is accessible through the Electron IPC bridge:

```typescript
// Get available drives
const { drives } = await window.electron.getDrives();
// Returns: ['C:/', 'D:/', 'E:/']

// Select folders via dialog
const { folders } = await window.electron.selectFolder();

// Scan a directory
const { files, totalFiles } = await window.electron.scanDirectory('C:/Users/Pictures');

// Listen to real-time progress
const unsubscribe = window.electron.onScanProgress((progress) => {
  console.log(`Scanning: ${progress.currentPath}`);
  console.log(`Found: ${progress.filesFound} files`);
});
```

### Supported File Formats
- **Images**: `.jpg`, `.jpeg`, `.png`, `.gif`, `.bmp`, `.webp`, `.heic`, `.heif`
- **Videos**: `.mp4`, `.mov`, `.avi`, `.mkv`, `.webm`, `.m4v`

### Future Enhancements
- Automatic background scanning on app startup
- Watch folders for new photos
- EXIF metadata extraction (GPS, camera info, timestamps)
- SQLite database integration for fast searches
- Thumbnail generation and caching

## 🏗️ Building for Production

### Build Windows Installer (.exe)

To create a Windows installer:

```bash
npm run build
```

This will:
1. Compile TypeScript and build the React app
2. Bundle Electron main and preload scripts
3. Create an optimized production build
4. Package everything with electron-builder
5. Generate a Windows installer in the `release/` folder

**Output**: `release/PIXONA-1.0.0-Setup.exe`

### Build Configuration

The build is configured in `electron-builder.json`:
- **Target**: Windows NSIS installer (64-bit)
- **Output Directory**: `release/`
- **Installer Options**: 
  - User can choose installation directory
  - Desktop shortcut created
  - Start menu shortcut created

### Customizing the Build

Edit `electron-builder.json` to customize:
```json
{
  "appId": "com.pixona.photoapp",
  "productName": "PIXONA",
  "win": {
    "target": ["nsis"],
    "icon": "public/favicon.ico"
  }
}
```

## 🧪 Testing the Installer

After building:

1. Navigate to the `release/` folder
2. Run `PIXONA-1.0.0-Setup.exe`
3. Follow the installation wizard
4. Launch PIXONA from the desktop shortcut or Start Menu

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development mode with hot-reload |
| `npm run build` | Build production Windows installer |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Check code for issues |

## 🎨 Technology Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Smooth animations
- **shadcn/ui** - Beautiful component library
- **React Router** - Client-side routing

### Desktop Integration
- **Electron** - Native desktop app framework
- **Vite** - Lightning-fast build tool
- **electron-builder** - Production packaging

### Future Integrations
- **face-api.js** - Browser-based face recognition
- **Leaflet.js + OpenStreetMap** - Interactive maps
- **SQLite** - Local database for indexing
- **sharp** - High-performance image processing

## 🗺️ Development Roadmap

### Phase 1: Core Infrastructure ✅ (Current)
- [x] Project setup with React + TypeScript + Electron
- [x] Modern Apple Photos-inspired UI
- [x] Navigation structure (Library, People, Albums, Places, Duplicates, Settings)
- [x] File system integration for Windows drives
- [x] Basic photo scanning with progress indicators

### Phase 2: Scanning & Indexing (Next)
- [ ] SQLite database integration for photo metadata
- [ ] EXIF data extraction (GPS, camera, timestamps)
- [ ] Thumbnail generation and caching
- [ ] Background scanning and incremental updates
- [ ] Watch folders for automatic updates

### Phase 3: Face Recognition
- [ ] Integrate face-api.js for browser-based face detection
- [ ] Face clustering and grouping algorithm
- [ ] People view with face thumbnails
- [ ] Name/tag faces with user labels
- [ ] Search photos by person

### Phase 4: Duplicate Detection
- [ ] Strong file hash comparison (exact duplicates)
- [ ] Perceptual hash comparison (near-duplicates)
- [ ] Visual similarity scoring
- [ ] Safe deletion with trash folder
- [ ] Space reclamation preview

### Phase 5: Location & Mapping
- [ ] GPS coordinate extraction from EXIF
- [ ] Leaflet.js + OpenStreetMap integration
- [ ] Clustered markers for photo locations
- [ ] Interactive map navigation
- [ ] Reverse geocoding for place names

### Phase 6: Smart Organization
- [ ] Automatic event detection (time-based clustering)
- [ ] Location-based event grouping
- [ ] Face-based event suggestions
- [ ] Custom album creation
- [ ] Advanced search and filters

## 📝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🐛 Troubleshooting

### Common Issues

**Issue**: `npm install` fails with permission errors
- **Solution**: Run as administrator or fix npm permissions

**Issue**: Electron window doesn't open in development
- **Solution**: Check that port 8080 is not in use. Change port in `vite.config.ts` if needed

**Issue**: Build fails with "Cannot find module" error
- **Solution**: Delete `node_modules` and `package-lock.json`, then run `npm install` again

**Issue**: Photos not appearing after scan
- **Solution**: Ensure the photo paths are accessible and formats are supported

### Getting Help

- Open an issue on GitHub
- Check existing issues for similar problems
- Review the console logs for detailed error messages

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Inspired by Apple Photos interface design
- Built with open-source technologies
- shadcn/ui for beautiful components
- Electron community for desktop integration

---

**Made with ❤️ for photographers and photo enthusiasts**

For more information, visit the [project repository](<your-repo-url>)

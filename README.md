# Murah Media Player

A modern, desktop-first video player built with Electron. Features a clean, native desktop interface with no scrolling, comprehensive playback controls, and subtitle support.

![Murah Media Player](https://img.shields.io/badge/Electron-18.18.2-blue)
![License](https://img.shields.io/badge/license-ISC-green)

## Features

- 🎬 **Video Playback** - Support for MP4, MKV, WebM, AVI, MOV, and more
- 📝 **Subtitle Support** - Load SRT subtitle files with customizable styling
- 🎚️ **Playback Controls** - Play/pause, seek, speed control (0.5x - 2.0x)
- 🔊 **Volume Control** - Adjustable volume with mute toggle
- 🖥️ **Fullscreen Mode** - Immersive fullscreen playback
- ⌨️ **Keyboard Shortcuts** - Full keyboard control for all features
- 🎨 **Modern UI** - Clean, desktop-native interface with dark theme
- 🎯 **No Scrolling** - Fixed layout optimized for desktop use

## Screenshots

*Add screenshots of your app here*

## Prerequisites

- Node.js (v14 or higher)
- npm (comes with Node.js)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/web-based-video-player.git
cd web-based-video-player
```

2. Install dependencies:
```bash
npm install
```

## Development

To run the app in development mode:

```bash
npm start
```

## Building for Production

### Option 1: Using electron-builder (Recommended)

1. Install electron-builder as a dev dependency:
```bash
npm install --save-dev electron-builder
```

2. Add build configuration to `package.json`:
```json
{
  "main": "main.js",
  "scripts": {
    "start": "electron .",
    "build": "electron-builder",
    "build:mac": "electron-builder --mac",
    "build:win": "electron-builder --win",
    "build:linux": "electron-builder --linux"
  },
  "build": {
    "appId": "com.yourcompany.mediaplayer",
    "productName": "Murah Media Player",
    "directories": {
      "output": "dist"
    },
    "files": [
      "**/*",
      "!node_modules/**/*",
      "!dist/**/*"
    ],
    "mac": {
      "category": "public.app-category.entertainment",
      "target": ["dmg", "zip"]
    },
    "win": {
      "target": ["nsis", "portable"]
    },
    "linux": {
      "target": ["AppImage", "deb"]
    }
  }
}
```

3. Build the app:
```bash
# Build for current platform
npm run build

# Build for specific platform
npm run build:mac
npm run build:win
npm run build:linux
```

The built applications will be in the `dist` folder.

### Option 2: Using electron-packager

1. Install electron-packager:
```bash
npm install --save-dev electron-packager
```

2. Add scripts to `package.json`:
```json
{
  "scripts": {
    "package:mac": "electron-packager . 'Murah Media Player' --platform=darwin --arch=x64 --out=dist/",
    "package:win": "electron-packager . 'Murah Media Player' --platform=win32 --arch=x64 --out=dist/",
    "package:linux": "electron-packager . 'Murah Media Player' --platform=linux --arch=x64 --out=dist/"
  }
}
```

3. Package the app:
```bash
npm run package:mac
npm run package:win
npm run package:linux
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play/Pause |
| `←` (Left Arrow) | Seek backward 5 seconds |
| `→` (Right Arrow) | Seek forward 5 seconds |
| `F` | Toggle fullscreen |
| `M` | Toggle mute |
| `Ctrl/Cmd + O` | Open video file |
| `Ctrl/Cmd + Shift + O` | Open subtitle file |

## Usage

1. **Load a Video**: Click "Load Video" button or use `Ctrl/Cmd + O` to select a video file
2. **Load Subtitles** (Optional): Click "Load Subtitle" button or use `Ctrl/Cmd + Shift + O` to select an SRT file
3. **Play**: Click the play button or press `Space`
4. **Adjust Settings**: Use the controls to adjust volume, playback speed, and subtitle styling

## Subtitle Styling

Customize subtitle appearance:
- **Font Size**: Adjust from 0.5rem to 3.0rem
- **Color**: Choose any color using the color picker

## Project Structure

```
web-based-video-player/
├── main.js              # Electron main process
├── preload.js           # Preload script (security bridge)
├── player.html          # Main HTML file
├── package.json         # Project configuration
├── scripts/             # JavaScript modules
│   ├── main.js          # Application entry point
│   ├── videoPlayer.js   # Video player controller
│   └── controls.js      # UI controls handler
└── styles/              # CSS files
    └── main.css         # Main stylesheet
```

## Known Issues

- **MKV Audio Codec**: Some MKV files use AC3 (Dolby Digital) audio codec which browsers cannot decode natively. You may need to re-encode the audio track to AAC.
- **macOS Menu Bar**: When running in development mode (`npm start`), the menu bar may show "Electron" instead of "Murah Media Player". This is normal in development and will be correct in the built application.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.

## Acknowledgments

- Built with [Electron](https://www.electronjs.org/)
- Icons by [Font Awesome](https://fontawesome.com/)


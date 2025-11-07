# Murah Media Player

I was initiate this (vibe-coded) because when I try to play MKV in mac os with srt subtitle, it's hard to find a proper media player, and we know that lot of app in apple environment is paid, that's when it comes an idea to build this player. Simple, but has enough feature for your basic needs to play a video.

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

### MKV Files with AC3 Audio Codec

Some MKV files use the AC3 (Dolby Digital) audio codec, which web browsers and Electron cannot decode natively. If you encounter playback issues with an MKV file (no audio, error messages, or the video won't play), the audio track likely uses an unsupported codec.

#### Checking Audio Codec

To check if your video file uses AC3 audio, use `ffprobe` (part of [FFmpeg](https://ffmpeg.org/)):

```bash
ffprobe -hide_banner -show_streams "video.mkv" | grep "codec_name"
```

This command will display the codec names for all streams in the file. If you see `ac3` in the output, the audio track uses AC3 and needs to be converted.

**Example output:**
```
codec_name=h264    # Video codec (usually fine)
codec_name=ac3     # Audio codec (needs conversion)
```

#### Converting AC3 to AAC

If your video uses AC3 audio, you can convert it to AAC (which is widely supported) using FFmpeg. This process will:

- **Copy the video stream** (no re-encoding, fast and preserves quality)
- **Re-encode only the audio** to AAC format
- **Preserve all other tracks** (subtitles, chapters, etc.)

**Conversion Command:**

```bash
ffmpeg -i "input.mkv" -c:v copy -c:a aac -b:a 256k "output.mkv"
```

**Command Breakdown:**
- `-i "input.mkv"` - Input video file
- `-c:v copy` - Copy video stream without re-encoding (fast, preserves quality)
- `-c:a aac` - Re-encode audio to AAC codec
- `-b:a 256k` - Set audio bitrate to 256 kbps (good quality, adjust as needed)
- `"output.mkv"` - Output filename

**Alternative: Higher Quality Audio**

For better audio quality, you can increase the bitrate:

```bash
ffmpeg -i "input.mkv" -c:v copy -c:a aac -b:a 320k "output.mkv"
```

**Note:** The conversion process may take some time depending on the file size. The video quality remains unchanged since we're only re-encoding the audio track.

#### Installing FFmpeg

If you don't have FFmpeg installed:

- **macOS**: `brew install ffmpeg`
- **Windows**: Download from [FFmpeg website](https://ffmpeg.org/download.html) or use `choco install ffmpeg`
- **Linux**: `sudo apt install ffmpeg` (Debian/Ubuntu) or `sudo yum install ffmpeg` (RHEL/CentOS)

### macOS Menu Bar

When running in development mode (`npm start`), the menu bar may show "Electron" instead of "Murah Media Player". This is normal in development and will be correct in the built application.

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


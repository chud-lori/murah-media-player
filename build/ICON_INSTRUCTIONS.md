# Icon Setup Instructions

This directory should contain the app icons for different platforms.

## Required Icon Files

You need to create the following icon files:

1. **icon.icns** - For macOS (512x512 or larger, multiple sizes)
2. **icon.ico** - For Windows (256x256 or larger, multiple sizes)
3. **icon.png** - For Linux (512x512 or larger)

## Quick Setup Options

### Option 1: Use Online Icon Generators

1. Create a 512x512 PNG image with your icon design
2. Use these online tools to convert:
   - **macOS (.icns)**: https://cloudconvert.com/png-to-icns or use `iconutil` on macOS
   - **Windows (.ico)**: https://cloudconvert.com/png-to-ico
   - **Linux (.png)**: Use your 512x512 PNG directly

### Option 2: Use macOS iconutil (for .icns)

If you have a PNG file:
```bash
# Create iconset directory
mkdir icon.iconset

# Create different sizes (required for macOS)
sips -z 16 16     icon.png --out icon.iconset/icon_16x16.png
sips -z 32 32     icon.png --out icon.iconset/icon_16x16@2x.png
sips -z 32 32     icon.png --out icon.iconset/icon_32x32.png
sips -z 64 64     icon.png --out icon.iconset/icon_32x32@2x.png
sips -z 128 128   icon.png --out icon.iconset/icon_128x128.png
sips -z 256 256   icon.png --out icon.iconset/icon_128x128@2x.png
sips -z 256 256   icon.png --out icon.iconset/icon_256x256.png
sips -z 512 512   icon.png --out icon.iconset/icon_256x256@2x.png
sips -z 512 512   icon.png --out icon.iconset/icon_512x512.png
sips -z 1024 1024 icon.png --out icon.iconset/icon_512x512@2x.png

# Convert to .icns
iconutil -c icns icon.iconset -o icon.icns
```

### Option 3: Use Electron Icon Generator

Install electron-icon-maker:
```bash
npm install -g electron-icon-maker
```

Then run:
```bash
electron-icon-maker --input=build/icon.png --output=build/icons
```

## Current Setup

- An SVG template is provided at `build/icon.svg`
- You can convert this SVG to PNG using any image editor or online tool
- Then convert the PNG to the required formats above

## Temporary Solution

If you want to build immediately without custom icons, you can:
1. Remove the `"icon"` lines from `package.json` build config
2. The app will use Electron's default icon
3. Add custom icons later and rebuild


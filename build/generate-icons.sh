#!/bin/bash

# Icon Generation Script for Murah Media Player
# This script generates icons for macOS, Windows, and Linux from a source PNG

SOURCE_ICON="icon.png"
ICONS_DIR="icons"

# Check if source icon exists
if [ ! -f "$SOURCE_ICON" ]; then
    echo "Error: $SOURCE_ICON not found in build directory"
    echo "Please create a 512x512 PNG icon and save it as build/icon.png"
    exit 1
fi

# Create icons directory
mkdir -p "$ICONS_DIR"

echo "Generating icons from $SOURCE_ICON..."

# Generate macOS .icns file
echo "Creating macOS icon set..."
mkdir -p icon.iconset

sips -z 16 16     "$SOURCE_ICON" --out icon.iconset/icon_16x16.png > /dev/null 2>&1
sips -z 32 32     "$SOURCE_ICON" --out icon.iconset/icon_16x16@2x.png > /dev/null 2>&1
sips -z 32 32     "$SOURCE_ICON" --out icon.iconset/icon_32x32.png > /dev/null 2>&1
sips -z 64 64     "$SOURCE_ICON" --out icon.iconset/icon_32x32@2x.png > /dev/null 2>&1
sips -z 128 128   "$SOURCE_ICON" --out icon.iconset/icon_128x128.png > /dev/null 2>&1
sips -z 256 256   "$SOURCE_ICON" --out icon.iconset/icon_128x128@2x.png > /dev/null 2>&1
sips -z 256 256   "$SOURCE_ICON" --out icon.iconset/icon_256x256.png > /dev/null 2>&1
sips -z 512 512   "$SOURCE_ICON" --out icon.iconset/icon_256x256@2x.png > /dev/null 2>&1
sips -z 512 512   "$SOURCE_ICON" --out icon.iconset/icon_512x512.png > /dev/null 2>&1
sips -z 1024 1024 "$SOURCE_ICON" --out icon.iconset/icon_512x512@2x.png > /dev/null 2>&1

iconutil -c icns icon.iconset -o "$ICONS_DIR/icon.icns"
rm -rf icon.iconset

echo "✓ macOS icon created: $ICONS_DIR/icon.icns"

# Copy PNG for Linux (use 512x512)
cp "$SOURCE_ICON" "$ICONS_DIR/icon.png"
echo "✓ Linux icon created: $ICONS_DIR/icon.png"

# For Windows .ico, we'll need to use an online converter or ImageMagick
# For now, copy the PNG and note that conversion is needed
echo ""
echo "⚠ Windows .ico file needs to be created manually:"
echo "   1. Use https://cloudconvert.com/png-to-ico"
echo "   2. Upload $SOURCE_ICON"
echo "   3. Download and save as $ICONS_DIR/icon.ico"
echo ""
echo "Or install ImageMagick and run:"
echo "   convert $SOURCE_ICON -define icon:auto-resize=256,128,64,48,32,16 $ICONS_DIR/icon.ico"

echo ""
echo "Icon generation complete!"
echo "Icons are in: $ICONS_DIR/"


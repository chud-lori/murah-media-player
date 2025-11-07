# Icon Setup

## Quick Start

1. **Create or find a 512x512 PNG icon** and save it as `build/icon.png`

2. **Generate icons** by running:
   ```bash
   cd build
   ./generate-icons.sh
   ```

3. **For Windows .ico file**, use an online converter:
   - Go to https://cloudconvert.com/png-to-ico
   - Upload `build/icon.png`
   - Download and save as `build/icons/icon.ico`

4. **Rebuild your app**:
   ```bash
   npm run build:mac
   ```

## Temporary Solution (Build Without Custom Icons)

If you want to build immediately without custom icons, temporarily remove the icon lines from `package.json`:

```json
"mac": {
  "category": "public.app-category.entertainment",
  // "icon": "build/icons/icon.icns",  // Comment this out
  ...
}
```

Do the same for `win` and `linux` sections, then rebuild.

## Icon Template

An SVG template is provided at `build/icon.svg` - you can:
- Open it in any image editor
- Customize the colors and design
- Export as 512x512 PNG
- Use the generation script above

## File Structure

```
build/
├── icon.svg              # SVG template
├── icon.png              # Your source PNG (512x512)
├── generate-icons.sh     # Icon generation script
├── ICON_INSTRUCTIONS.md  # Detailed instructions
└── icons/
    ├── icon.icns         # macOS icon (generated)
    ├── icon.ico          # Windows icon (manual conversion)
    └── icon.png          # Linux icon (copied from source)
```


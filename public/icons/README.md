# PWA Icon Conversion

This directory contains SVG icons for the NFL Scoreboard PWA. While SVG icons work in most modern browsers, some platforms may require PNG versions.

## Converting SVG to PNG

If you need PNG versions of the icons, you can convert them using various tools:

### Online Tools (Easiest)

1. Visit https://convertio.co/svg-png/ or similar
2. Upload the SVG files from this directory
3. Download the PNG versions
4. Replace the file extensions in `/public/manifest.json` from `.svg` to `.png`

### Using ImageMagick (Command Line)

```bash
# Install ImageMagick first
# On Windows with Chocolatey: choco install imagemagick
# On macOS with Homebrew: brew install imagemagick
# On Linux: sudo apt install imagemagick

# Convert icons
magick icon-192x192.svg icon-192x192.png
magick icon-512x512.svg icon-512x512.png
magick icon-192x192-maskable.svg icon-192x192-maskable.png
magick icon-512x512-maskable.svg icon-512x512-maskable.png
magick apple-touch-icon.svg apple-touch-icon.png
```

### Using Node.js (if you want to automate)

You can use the `sharp` package to convert SVGs to PNGs programmatically.

## Icon Purposes

- `icon-192x192.svg` - Standard app icon for most platforms
- `icon-512x512.svg` - High resolution icon for larger displays
- `icon-192x192-maskable.svg` - Android adaptive icon (safe area compatible)
- `icon-512x512-maskable.svg` - High-res Android adaptive icon
- `apple-touch-icon.svg` - iOS home screen icon with rounded corners

The maskable icons have extra padding to ensure the icon looks good when Android applies its various mask shapes (circle, square, rounded rectangle, etc.).

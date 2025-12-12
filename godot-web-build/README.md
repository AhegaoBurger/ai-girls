# Godot Web Build

This directory contains the HTML5 export of the Godot project.

## Exporting from Godot Editor

1. Open the `godot/` folder in Godot 4.5 (contains `project.godot`)
2. Go to **Project → Export**
3. Select **Web (HTML5)** preset
4. Click **Export Project**
5. Export to `../godot-web-build/index.html` (this directory, one level up)

## Files Generated

After export, this directory will contain:
- `index.html` - Main HTML file
- `index.js` - JavaScript runtime
- `index.wasm` - WebAssembly module
- `index.pck` - Packed game data
- `index.worker.js` - Web worker for threading

## Testing Locally

Serve the build with a local HTTP server:

```bash
cd godot-web-build
python3 -m http.server 8000
```

Open `http://localhost:8000` in your browser.

## Important Notes

- The GL Compatibility renderer is already configured in `project.godot`
- Threading is enabled for better performance
- WebSocket will connect to the backend at `ws://localhost:3000/godot` in development
- For production, set the `BACKEND_URL` environment variable

## Browser Requirements

- Modern browser with WebAssembly support
- SharedArrayBuffer support (requires secure context and proper headers)
- WebSocket support

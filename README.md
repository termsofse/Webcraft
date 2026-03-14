# Minecraft HTML

A voxel Minecraft clone built with vanilla HTML, CSS, JavaScript, and Three.js.
No build tools — just open \`index.html\` in your browser.

## How to Play

1. Open \`index.html\` in any modern browser
2. Click on the game canvas to lock your mouse
3. Use the controls below to play!

## Controls (Default)

| Action          | Key          |
|-----------------|-------------|
| Move Forward    | W           |
| Move Backward   | S           |
| Strafe Left     | A           |
| Strafe Right    | D           |
| Jump            | Space       |
| Toggle Flying   | Double-tap Space |
| Fly Up          | Hold Space  |
| Fly Down        | Hold Shift  |
| Break Block     | Left Click  |
| Place Block     | Right Click |
| Select Hotbar   | 1-9 / Scroll |
| Inventory       | E           |
| Keybind Menu    | O           |
| Pause           | Escape      |

All keybinds can be rebound by pressing **O** to open the keybind menu.

## Inventory System

- **Hotbar**: 9 slots at the bottom of the screen (always visible)
- **Survival Tab**: 3×9 inventory grid + hotbar. Click a slot to swap with selected hotbar slot.
- **Creative Tab**: Shows all blocks. Click one to place it in your selected hotbar slot.

## How to Add More Blocks

Adding a new block is simple! Edit the \`BLOCKS\` object in \`script.js\`:

\`\`\`javascript
// In script.js, find the BLOCKS object and add a new entry:
const BLOCKS = {
  // ... existing blocks ...
  
  // Add your new block with the next available ID:
  13: {
    name: "My Custom Block",
    solid: true,               // true = can walk on it, false = walk through
    top: "#FF0000",            // Color of the top face (hex color)
    side: "#CC0000",           // Color of the side faces
    bottom: "#990000",         // Color of the bottom face
    // transparent: true,      // Optional: set true for see-through blocks
  },
};
\`\`\`

### Block Properties

| Property      | Type    | Description |
|---------------|---------|-------------|
| \`name\`       | string  | Display name shown in debug info |
| \`solid\`      | boolean | \`true\` = collision enabled, \`false\` = no collision |
| \`top\`        | string  | Hex color for top face |
| \`side\`       | string  | Hex color for side faces |
| \`bottom\`     | string  | Hex color for bottom face |
| \`transparent\` | boolean | Optional. Makes block semi-transparent |

### Replacing Textures

The game already loads and uses the PNG files in \`textures/\`.
To swap in your own textures:

1. Replace any \`.png\` in the \`textures/\` folder with your own 16×16 image (same filename).
2. Reload the page — the new texture will appear automatically.

Each block definition in \`BLOCKS\` has a \`topTex\`, \`sideTex\`, and \`bottomTex\` field pointing to
a filename in \`textures/\`. If a texture file is missing or fails to load, the hex \`top\`/\`side\`/\`bottom\`
fallback color is used instead, so the game always renders something.

### Tips

- Keep block IDs sequential (no gaps)
- The block will automatically appear in the Creative inventory
- For special behavior (like water flowing), you'll need to add custom logic
- Colors with low contrast between top/side look more natural

## Project Structure

| minecraft-html/         | # Main Folder                            |
|-------------------------|------------------------------------------|
| ├── index.html          |    # Entry point                         |
| ├── style.css           | # All styles (HUD, inventory, menus)     |
| ├── script.js           | # Game engine (rendering, physics, input)|
| ├── README.md           | # This file                              |
| └── textures/           | # Block texture images                   |
| ____├── grass_top.png   | # Grass Texture                          |
| ____├── dirt.png        | # Dirt Texture                           |
| ____└── ...             | # Other Textures                         |

## Limitations

- Fixed world size (32×32×64)
- No multiplayer
- No save/load (world resets on refresh)
- Requires a browser with WebGL support (all modern browsers)

/*
 * Minecraft HTML - Voxel Minecraft clone using Three.js
 * Features: true 3D voxel world, block place/break, inventory, flying, rebindable keys
 */

// ============================================================
// THREE.JS SETUP
// ============================================================
const THREE_CDN = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";

function loadThree(cb) {
  const s = document.createElement("script");
  s.src = THREE_CDN;
  s.onload = cb;
  document.head.appendChild(s);
}

loadThree(main);

function main() {

// ============================================================
// BLOCK DEFINITIONS
// ============================================================
// topTex/sideTex/bottomTex = PNG filenames in textures/
// top/side/bottom = fallback hex if texture hasn't loaded
const BLOCKS = {
  0:  { name: "Air",         solid: false },
  1:  { name: "Grass",       solid: true,  topTex: "grass_top.png",    top: 0x5B8C3E, sideTex: "grass_side.png", side: 0x6B9E4A, bottomTex: "dirt.png",        bottom: 0x8B6914 },
  2:  { name: "Dirt",        solid: true,  topTex: "dirt.png",         top: 0x8B6914, sideTex: "dirt.png",       side: 0x8B6914, bottomTex: "dirt.png",        bottom: 0x8B6914 },
  3:  { name: "Stone",       solid: true,  topTex: "stone.png",        top: 0x7F7F7F, sideTex: "stone.png",      side: 0x7F7F7F, bottomTex: "stone.png",       bottom: 0x7F7F7F },
  4:  { name: "Cobblestone", solid: true,  topTex: "cobblestone.png",  top: 0x6B6B6B, sideTex: "cobblestone.png",side: 0x6B6B6B, bottomTex: "cobblestone.png", bottom: 0x6B6B6B },
  5:  { name: "Oak Log",     solid: true,  topTex: "oak_log_top.png",  top: 0xA08050, sideTex: "oak_log_side.png",side: 0x6B5234, bottomTex: "oak_log_top.png", bottom: 0xA08050 },
  6:  { name: "Oak Planks",  solid: true,  topTex: "oak_planks.png",   top: 0xBC9862, sideTex: "oak_planks.png", side: 0xBC9862, bottomTex: "oak_planks.png",  bottom: 0xBC9862 },
  7:  { name: "Sand",        solid: true,  topTex: "sand.png",         top: 0xDBD3A0, sideTex: "sand.png",       side: 0xDBD3A0, bottomTex: "sand.png",        bottom: 0xDBD3A0 },
  8:  { name: "Glass",       solid: true,  topTex: "glass.png",        top: 0xC0E8FF, sideTex: "glass.png",      side: 0xC0E8FF, bottomTex: "glass.png",       bottom: 0xC0E8FF, transparent: true, opacity: 0.5 },
  9:  { name: "Brick",       solid: true,  topTex: "brick.png",        top: 0x9B4A3C, sideTex: "brick.png",      side: 0x9B4A3C, bottomTex: "brick.png",       bottom: 0x9B4A3C },
  10: { name: "Water",       solid: false, topTex: "water.png",        top: 0x3366CC, sideTex: "water.png",      side: 0x3366CC, bottomTex: "water.png",       bottom: 0x3366CC, transparent: true, opacity: 0.6 },
  11: { name: "Leaves",      solid: true,  topTex: "leaves.png",       top: 0x3A7A20, sideTex: "leaves.png",     side: 0x3A7A20, bottomTex: "leaves.png",      bottom: 0x3A7A20, transparent: true, opacity: 0.85 },
  12: { name: "Bedrock",     solid: true,  topTex: "bedrock.png",      top: 0x3A3A3A, sideTex: "bedrock.png",    side: 0x3A3A3A, bottomTex: "bedrock.png",     bottom: 0x3A3A3A },
};

const ALL_BLOCK_IDS = Object.keys(BLOCKS).map(Number).filter(id => id !== 0);

// ============================================================
// WORLD CONFIG
// ============================================================
const WORLD_SIZE   = 32;
const WORLD_HEIGHT = 64;
const PLATFORM_Y   = 4;

// ============================================================
// KEYBINDS
// ============================================================
let keybinds = {
  forward:     "KeyW",
  backward:    "KeyS",
  left:        "KeyA",
  right:       "KeyD",
  jump:        "Space",
  sneak:       "ShiftLeft",
  inventory:   "KeyE",
  keybindMenu: "KeyO",
  pause:       "Escape",
};

const keybindLabels = {
  forward:     "Move Forward",
  backward:    "Move Backward",
  left:        "Strafe Left",
  right:       "Strafe Right",
  jump:        "Jump / Fly Up",
  sneak:       "Sneak / Fly Down",
  inventory:   "Inventory",
  keybindMenu: "Keybind Menu",
  pause:       "Pause",
};

// ============================================================
// THREE.JS RENDERER & SCENE
// ============================================================
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById("game"), antialias: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);
scene.fog = new THREE.Fog(0x87CEEB, 20, 60);

// Lighting
const sun = new THREE.DirectionalLight(0xffffff, 1.0);
sun.position.set(20, 40, 20);
sun.castShadow = true;
scene.add(sun);
scene.add(new THREE.AmbientLight(0xccddff, 0.5));

// Camera (first-person)
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.05, 80);
scene.add(camera);

window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

// ============================================================
// BLOCK MESH CACHE — one merged mesh per block type per chunk
// ============================================================
// We use instanced meshes keyed by block id.
// On world change we rebuild the instanced meshes.

// Build per-face materials for a block id
// BoxGeometry face order: +x, -x, +y, -y, +z, -z  →  side, side, top, bottom, side, side
function getMaterials(id) {
  const def = BLOCKS[id];
  // face tex names: right, left, top, bottom, front, back
  const faceInfo = [
    { tex: def.sideTex,    color: def.side   },
    { tex: def.sideTex,    color: def.side   },
    { tex: def.topTex,     color: def.top    },
    { tex: def.bottomTex,  color: def.bottom },
    { tex: def.sideTex,    color: def.side   },
    { tex: def.sideTex,    color: def.side   },
  ];
  return faceInfo.map(({ tex, color }) => {
    const opts = {};
    if (tex && TEX[tex]) {
      opts.map = TEX[tex];
    } else {
      opts.color = color;
    }
    if (def.transparent) { opts.transparent = true; opts.opacity = def.opacity ?? 0.7; }
    return new THREE.MeshLambertMaterial(opts);
  });
}

// World data
const world = [];
function initWorld() {
  for (let x = 0; x < WORLD_SIZE; x++) {
    world[x] = [];
    for (let y = 0; y < WORLD_HEIGHT; y++) {
      world[x][y] = new Uint8Array(WORLD_SIZE);
      for (let z = 0; z < WORLD_SIZE; z++) {
        if (y === 0)              world[x][y][z] = 12; // bedrock
        else if (y < PLATFORM_Y)  world[x][y][z] = 2;  // dirt
        else if (y === PLATFORM_Y) world[x][y][z] = 1;  // grass
        // else air = 0
      }
    }
  }
}
initWorld();

function getBlock(x, y, z) {
  if (x < 0 || x >= WORLD_SIZE || y < 0 || y >= WORLD_HEIGHT || z < 0 || z >= WORLD_SIZE) return 0;
  return world[x][y][z];
}
function setBlock(x, y, z, id) {
  if (x < 0 || x >= WORLD_SIZE || y < 0 || y >= WORLD_HEIGHT || z < 0 || z >= WORLD_SIZE) return;
  world[x][y][z] = id;
  rebuildMeshes();
}

// ============================================================
// TEXTURE LOADING
// ============================================================
const texLoader = new THREE.TextureLoader();
const TEX = {}; // filename -> THREE.Texture (once loaded)

const TEX_FILES = [
  "grass_top.png","grass_side.png","dirt.png","stone.png","cobblestone.png",
  "oak_log_top.png","oak_log_side.png","oak_planks.png","sand.png",
  "glass.png","brick.png","water.png","leaves.png","bedrock.png"
];

let texturesLoaded = 0;
TEX_FILES.forEach(name => {
  texLoader.load(
    "textures/" + name,
    tex => {
      tex.magFilter = THREE.NearestFilter;
      tex.minFilter = THREE.NearestFilter;
      TEX[name] = tex;
      texturesLoaded++;
      if (texturesLoaded === TEX_FILES.length) rebuildMeshes(); // rebuild once all loaded
    },
    undefined,
    () => { texturesLoaded++; } // count failed loads too so we don't hang
  );
});

// ---- Mesh building ----
const chunkGroup = new THREE.Group();
scene.add(chunkGroup);

// Shared box geometry (unit cube)
const boxGeo = new THREE.BoxGeometry(1, 1, 1);

let blockMeshes = {}; // id -> InstancedMesh

function rebuildMeshes() {
  // Remove old meshes and dispose materials
  while (chunkGroup.children.length) {
    const m = chunkGroup.children[0];
    if (Array.isArray(m.material)) m.material.forEach(mat => mat.dispose());
    chunkGroup.remove(m);
  }
  blockMeshes = {};

  // Count instances per block id
  const counts = {};
  for (let x = 0; x < WORLD_SIZE; x++)
    for (let y = 0; y < WORLD_HEIGHT; y++)
      for (let z = 0; z < WORLD_SIZE; z++) {
        const id = world[x][y][z];
        if (id === 0) continue;
        if (!isVisible(x, y, z)) continue;
        counts[id] = (counts[id] || 0) + 1;
      }

  // Create instanced meshes
  for (const id of Object.keys(counts)) {
    const mats = getMaterials(Number(id));
    const mesh = new THREE.InstancedMesh(boxGeo, mats, counts[id]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    blockMeshes[id] = { mesh, idx: 0 };
    chunkGroup.add(mesh);
  }

  // Fill instances
  const dummy = new THREE.Object3D();
  for (let x = 0; x < WORLD_SIZE; x++)
    for (let y = 0; y < WORLD_HEIGHT; y++)
      for (let z = 0; z < WORLD_SIZE; z++) {
        const id = world[x][y][z];
        if (id === 0 || !blockMeshes[id]) continue;
        if (!isVisible(x, y, z)) continue;
        dummy.position.set(x + 0.5, y + 0.5, z + 0.5);
        dummy.updateMatrix();
        const entry = blockMeshes[id];
        entry.mesh.setMatrixAt(entry.idx++, dummy.matrix);
      }

  for (const entry of Object.values(blockMeshes)) {
    entry.mesh.instanceMatrix.needsUpdate = true;
  }
}

// A block is visible if at least one neighbour is air/transparent
function isVisible(x, y, z) {
  const neighbors = [
    [x+1,y,z],[x-1,y,z],[x,y+1,z],[x,y-1,z],[x,y,z+1],[x,y,z-1]
  ];
  for (const [nx,ny,nz] of neighbors) {
    const nb = getBlock(nx,ny,nz);
    if (nb === 0 || BLOCKS[nb]?.transparent) return true;
  }
  return false;
}

// Block highlight outline
const highlightGeo = new THREE.BoxGeometry(1.02, 1.02, 1.02);
const highlightMat = new THREE.MeshBasicMaterial({ color: 0x000000, wireframe: true, transparent: true, opacity: 0.4 });
const highlightMesh = new THREE.Mesh(highlightGeo, highlightMat);
highlightMesh.visible = false;
scene.add(highlightMesh);

rebuildMeshes();

// ============================================================
// PLAYER
// ============================================================
const player = {
  x: WORLD_SIZE / 2 + 0.5,
  y: PLATFORM_Y + 2.6,
  z: WORLD_SIZE / 2 + 0.5,
  yaw: 0,
  pitch: 0,
  vy: 0,
  onGround: false,
  flying: false,
  width: 0.6,
  height: 1.8,
  eyeHeight: 1.62,
  speed: 4.3,
  flySpeed: 8,
  jumpForce: 7.8,
};

// Inventory
const inventory = new Array(27).fill(null);
const hotbar = [];
for (let i = 0; i < 9; i++) {
  hotbar.push(i + 1 <= ALL_BLOCK_IDS.length ? { id: ALL_BLOCK_IDS[i], count: 64 } : null);
}

let selectedSlot    = 0;
let inventoryOpen   = false;
let keybindMenuOpen = false;
let pauseOpen       = false;
let activeInvTab    = "survival";
let pointerLocked   = false;

const keys = {};
let lastSpaceTime = 0;

// ============================================================
// INPUT
// ============================================================
function getAction(code) {
  for (const [a, b] of Object.entries(keybinds)) if (b === code) return a;
  return null;
}

document.addEventListener("keydown", e => {
  keys[e.code] = true;
  const action = getAction(e.code);

  if (action === "jump") {
    const now = performance.now();
    if (now - lastSpaceTime < 300) { player.flying = !player.flying; player.vy = 0; }
    lastSpaceTime = now;
  }
  if (action === "inventory" && !keybindMenuOpen && !pauseOpen) {
    inventoryOpen = !inventoryOpen;
    updateInventoryUI();
    inventoryOpen ? document.exitPointerLock() : renderer.domElement.requestPointerLock();
  }
  if (action === "keybindMenu" && !inventoryOpen && !pauseOpen) {
    keybindMenuOpen = !keybindMenuOpen;
    document.getElementById("keybind-overlay").classList.toggle("hidden", !keybindMenuOpen);
    keybindMenuOpen ? (document.exitPointerLock(), buildKeybindUI()) : renderer.domElement.requestPointerLock();
  }
  if (action === "pause") {
    if (inventoryOpen) { inventoryOpen = false; updateInventoryUI(); renderer.domElement.requestPointerLock(); }
    else if (keybindMenuOpen) { keybindMenuOpen = false; document.getElementById("keybind-overlay").classList.add("hidden"); renderer.domElement.requestPointerLock(); }
    else {
      pauseOpen = !pauseOpen;
      document.getElementById("pause-overlay").classList.toggle("hidden", !pauseOpen);
      pauseOpen ? document.exitPointerLock() : renderer.domElement.requestPointerLock();
    }
  }
  if (e.code.startsWith("Digit")) {
    const n = parseInt(e.code.replace("Digit", ""));
    if (n >= 1 && n <= 9) { selectedSlot = n - 1; updateHotbarUI(); }
  }
});

document.addEventListener("keyup", e => { keys[e.code] = false; });

document.addEventListener("mousemove", e => {
  if (!pointerLocked) return;
  player.yaw   -= e.movementX * 0.002;
  player.pitch -= e.movementY * 0.002;
  player.pitch  = Math.max(-Math.PI/2 + 0.01, Math.min(Math.PI/2 - 0.01, player.pitch));
});

renderer.domElement.addEventListener("click", () => {
  if (!pointerLocked && !inventoryOpen && !keybindMenuOpen && !pauseOpen)
    renderer.domElement.requestPointerLock();
});

document.addEventListener("pointerlockchange", () => {
  pointerLocked = !!document.pointerLockElement;
});

renderer.domElement.addEventListener("mousedown", e => {
  if (!pointerLocked) return;
  const hit = castRay();
  if (!hit) return;
  if (e.button === 0) {
    if (getBlock(hit.x, hit.y, hit.z) !== 12) { setBlock(hit.x, hit.y, hit.z, 0); }
  } else if (e.button === 2) {
    const item = hotbar[selectedSlot];
    if (item && hit.face) {
      const px = hit.x + hit.face[0], py = hit.y + hit.face[1], pz = hit.z + hit.face[2];
      const bx = Math.floor(player.x), bz = Math.floor(player.z);
      const feetY = Math.floor(player.y - player.eyeHeight + 0.1);
      const headY = Math.floor(player.y - player.eyeHeight + player.height - 0.1);
      if (!((px === bx && pz === bz) && (py === feetY || py === headY))) {
        setBlock(px, py, pz, item.id);
      }
    }
  }
});

renderer.domElement.addEventListener("contextmenu", e => e.preventDefault());
renderer.domElement.addEventListener("wheel", e => {
  if (inventoryOpen) return;
  selectedSlot = (selectedSlot + Math.sign(e.deltaY) + 9) % 9;
  updateHotbarUI();
});

document.getElementById("resume-btn").addEventListener("click", () => {
  pauseOpen = false;
  document.getElementById("pause-overlay").classList.add("hidden");
  renderer.domElement.requestPointerLock();
});

// ============================================================ 
// DDA RAY CAST (Fixed for Three.js Voxel Grid) 
// ============================================================ 
    function castRay() { 
        // 1. Get direction from camera rotation 
        const dir = new THREE.Vector3(0, 0, -1); dir.applyQuaternion(camera.quaternion); const ox = player.x, oy = player.y, oz = player.z; let ix = Math.floor(ox), iy = Math.floor(oy), iz = Math.floor(oz); const sx = Math.sign(dir.x), sy = Math.sign(dir.y), sz = Math.sign(dir.z); 
        // Distance to the next grid line 
        const tdx = Math.abs(1 / dir.x), tdy = Math.abs(1 / dir.y), tdz = Math.abs(1 / dir.z); let tmx = dir.x > 0 ? (ix + 1 - ox) * tdx : (ox - ix) * tdx; let tmy = dir.y > 0 ? (iy + 1 - oy) * tdy : (oy - iy) * tdy; let tmz = dir.z > 0 ? (iz + 1 - oz) * tdz : (oz - iz) * tdz; let face = null; 
        // Max reach is 8 blocks 
        for (let i = 0; i < 50; i++) { const b = getBlock(ix, iy, iz); if (b !== 0 && BLOCKS[b]?.solid) { return { x: ix, y: iy, z: iz, face: face, blockId: b }; } if (tmx < tmy && tmx < tmz) { tmx += tdx; ix += sx; face = [-sx, 0, 0]; } else if (tmy < tmz) { tmy += tdy; iy += sy; face = [0, -sy, 0]; } else { tmz += tdz; iz += sz; face = [0, 0, -sz]; } } return null; } 
    

// ============================================================
// PHYSICS
// ============================================================
const GRAVITY = 25;

function isSolid(x, y, z) {
  return BLOCKS[getBlock(Math.floor(x), Math.floor(y), Math.floor(z))]?.solid || false;
}

function collides(px, py, pz) {
  const hw = player.width / 2;
  const fy = py - player.eyeHeight;
  for (let dx of [-1,1]) for (let dz of [-1,1]) {
    const cx = px + dx*hw*0.9, cz = pz + dz*hw*0.9;
    if (isSolid(cx, fy, cz)) return true;
    if (isSolid(cx, fy+0.9, cz)) return true;
    if (isSolid(cx, fy+player.height-0.1, cz)) return true;
  }
  return false;
}

function updatePhysics(dt) {
  if (pauseOpen || inventoryOpen || keybindMenuOpen) return;

  const spd = player.flying ? player.flySpeed : player.speed;
  let mx = 0, mz = 0;
  if (keys[keybinds.forward])  { 
    mx -= Math.sin(player.yaw); 
    mz -= Math.cos(player.yaw); 
  }
  if (keys[keybinds.backward]) { 
    mx += Math.sin(player.yaw); 
    mz += Math.cos(player.yaw); 
  }
  if (keys[keybinds.left]) { 
    mx -= Math.cos(player.yaw);  
    mz += Math.sin(player.yaw); 
  }
  if (keys[keybinds.right]) { 
    mx += Math.cos(player.yaw);  
    mz -= Math.sin(player.yaw); 
  }
  const len = Math.sqrt(mx*mx+mz*mz); if (len > 0) { mx /= len; mz /= len; }

  if (player.flying) {
    player.vy = 0;
    if (keys[keybinds.jump])  player.vy =  player.flySpeed;
    if (keys[keybinds.sneak]) player.vy = -player.flySpeed;
  } else {
    player.vy -= GRAVITY * dt;
    if (player.onGround && keys[keybinds.jump]) { player.vy = player.jumpForce; player.onGround = false; }
  }

  const nx = player.x + mx*spd*dt;
  if (!collides(nx, player.y, player.z)) player.x = nx;
  const nz = player.z + mz*spd*dt;
  if (!collides(player.x, player.y, nz)) player.z = nz;
  const ny = player.y + player.vy*dt;
  if (!collides(player.x, ny, player.z)) { player.y = ny; player.onGround = false; }
  else { if (player.vy < 0) player.onGround = true; player.vy = 0; }

  const hw = player.width/2;
  player.x = Math.max(hw, Math.min(WORLD_SIZE-hw, player.x));
  player.z = Math.max(hw, Math.min(WORLD_SIZE-hw, player.z));
  if (player.y < 1) { player.y = PLATFORM_Y+2.6; player.vy = 0; }
}

// ============================================================
// RENDER
// ============================================================
function render() {
  // Update camera to match player head
  camera.position.set(player.x, player.y, player.z);
  camera.rotation.order = "YXZ";
  camera.rotation.y = player.yaw;
  camera.rotation.x = player.pitch;

  // Block highlight
  const hit = castRay();
  if (hit && pointerLocked) {
    highlightMesh.position.set(hit.x + 0.5, hit.y + 0.5, hit.z + 0.5);
    highlightMesh.visible = true;
  } else {
    highlightMesh.visible = false;
  }

  renderer.render(scene, camera);

  // Debug HUD
  document.getElementById("debug-info").innerHTML =
    `XYZ: ${player.x.toFixed(1)} / ${player.y.toFixed(1)} / ${player.z.toFixed(1)}<br>` +
    `${player.flying ? "FLYING" : "WALKING"} | ${player.onGround ? "Ground" : "Air"}<br>` +
    `Block: ${hotbar[selectedSlot]?.id ? BLOCKS[hotbar[selectedSlot].id].name : "Empty"}`;
}

// ============================================================
// BLOCK ICON HELPER (2D canvas isometric, for HUD only)
// ============================================================
// IMG_CACHE: plain <img> elements for use in 2D canvas drawImage
const IMG_CACHE = {};
function getImg(texName) {
  if (IMG_CACHE[texName]) return IMG_CACHE[texName];
  const img = new Image();
  img.src = "textures/" + texName;
  IMG_CACHE[texName] = img;
  return img;
}

function drawFace2D(g, pts, texName, fallbackHex, darkFactor) {
  g.save();
  g.beginPath();
  g.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i+1]);
  g.closePath();
  g.clip();
  const img = texName ? getImg(texName) : null;
  if (img && img.complete && img.naturalWidth > 0) {
    g.drawImage(img, 0, 0, pts[0]*2, pts[0]*2); // rough fill
    if (darkFactor < 1) { g.fillStyle = `rgba(0,0,0,${1-darkFactor})`; g.fill(); }
  } else {
    g.fillStyle = fallbackHex;
    if (darkFactor < 1) {
      const r=parseInt(fallbackHex.slice(1,3),16), gr=parseInt(fallbackHex.slice(3,5),16), b=parseInt(fallbackHex.slice(5,7),16);
      g.fillStyle = `rgb(${Math.floor(r*darkFactor)},${Math.floor(gr*darkFactor)},${Math.floor(b*darkFactor)})`;
    }
    g.fill();
  }
  g.restore();
}

function hexColor(n) { return "#" + n.toString(16).padStart(6,"0"); }

function makeBlockIcon(blockId, size = 32) {
  const c = document.createElement("canvas");
  c.width = size; c.height = size;
  const g = c.getContext("2d");
  const block = BLOCKS[blockId];
  if (!block || !block.solid) return c;

  const hw = size * 0.5, qh = size * 0.25;

  // Top face
  drawFace2D(g, [hw,0, size,qh, hw,hw, 0,qh], block.topTex, hexColor(block.top), 1.0);
  // Left face (darker)
  drawFace2D(g, [0,qh, hw,hw, hw,size, 0,hw+qh], block.sideTex, hexColor(block.side), 0.75);
  // Right face (medium)
  drawFace2D(g, [hw,hw, size,qh, size,hw+qh, hw,size], block.sideTex, hexColor(block.side), 0.88);

  return c;
}

// ============================================================
// INVENTORY UI
// ============================================================
function updateHotbarUI() {
  const el = document.getElementById("hotbar");
  el.innerHTML = "";
  for (let i = 0; i < 9; i++) {
    const slot = document.createElement("div");
    slot.className = "hotbar-slot" + (i === selectedSlot ? " active" : "");
    if (hotbar[i]) { const icon = makeBlockIcon(hotbar[i].id, 36); icon.className = "block-icon"; slot.appendChild(icon); }
    slot.addEventListener("click", () => { selectedSlot = i; updateHotbarUI(); });
    el.appendChild(slot);
  }
}

function updateInventoryUI() {
  const overlay = document.getElementById("inventory-overlay");
  overlay.classList.toggle("hidden", !inventoryOpen);
  if (!inventoryOpen) return;

  document.querySelectorAll(".inv-tab").forEach(tab => {
    tab.classList.toggle("active", tab.dataset.tab === activeInvTab);
    tab.onclick = () => { activeInvTab = tab.dataset.tab; updateInventoryUI(); };
  });

  const content = document.getElementById("inv-content");
  content.innerHTML = "";

  if (activeInvTab === "creative") {
    const label = document.createElement("div"); label.className = "inv-label"; label.textContent = "All Blocks"; content.appendChild(label);
    const grid = document.createElement("div"); grid.className = "creative-grid";
    ALL_BLOCK_IDS.forEach(id => {
      const slot = document.createElement("div"); slot.className = "inv-slot"; slot.title = BLOCKS[id]?.name;
      const icon = makeBlockIcon(id, 28); icon.className = "block-icon"; slot.appendChild(icon);
      slot.addEventListener("click", () => { hotbar[selectedSlot] = { id, count: 64 }; updateHotbarUI(); updateInventoryUI(); });
      grid.appendChild(slot);
    });
    content.appendChild(grid);
  } else {
    const label = document.createElement("div"); label.className = "inv-label"; label.textContent = "Inventory"; content.appendChild(label);
    const grid = document.createElement("div"); grid.className = "inv-grid";
    for (let i = 0; i < 27; i++) {
      const slot = document.createElement("div"); slot.className = "inv-slot";
      if (inventory[i]) { const icon = makeBlockIcon(inventory[i].id, 28); icon.className = "block-icon"; slot.appendChild(icon); }
      slot.addEventListener("click", () => { const t = hotbar[selectedSlot]; hotbar[selectedSlot] = inventory[i]; inventory[i] = t; updateHotbarUI(); updateInventoryUI(); });
      grid.appendChild(slot);
    }
    content.appendChild(grid);
  }

  const hbSlots = document.getElementById("inv-hotbar-slots"); hbSlots.innerHTML = "";
  for (let i = 0; i < 9; i++) {
    const slot = document.createElement("div"); slot.className = "inv-slot" + (i === selectedSlot ? " active" : "");
    if (hotbar[i]) { const icon = makeBlockIcon(hotbar[i].id, 28); icon.className = "block-icon"; slot.appendChild(icon); }
    slot.addEventListener("click", () => { selectedSlot = i; updateHotbarUI(); updateInventoryUI(); });
    hbSlots.appendChild(slot);
  }
}

// ============================================================
// KEYBIND MENU
// ============================================================
let listeningFor = null;

function buildKeybindUI() {
  const list = document.getElementById("keybind-list"); list.innerHTML = "";
  for (const [action, label] of Object.entries(keybindLabels)) {
    const row = document.createElement("div"); row.className = "keybind-row";
    const span = document.createElement("span"); span.textContent = label; row.appendChild(span);
    const btn = document.createElement("button"); btn.className = "keybind-btn"; btn.textContent = fmt(keybinds[action]);
    btn.addEventListener("click", () => {
      if (listeningFor) return;
      listeningFor = action; btn.classList.add("listening"); btn.textContent = "Press a key...";
      const handler = e => {
        e.preventDefault(); e.stopPropagation();
        keybinds[action] = e.code; listeningFor = null;
        btn.classList.remove("listening"); btn.textContent = fmt(e.code);
        document.removeEventListener("keydown", handler, true);
      };
      document.addEventListener("keydown", handler, true);
    });
    row.appendChild(btn); list.appendChild(row);
  }
}

function fmt(code) {
  return code.replace("Key","").replace("Digit","").replace("ShiftLeft","L-Shift")
             .replace("ShiftRight","R-Shift").replace("ControlLeft","L-Ctrl")
             .replace("Space","Space").replace("ArrowUp","↑").replace("ArrowDown","↓")
             .replace("ArrowLeft","←").replace("ArrowRight","→");
}

document.getElementById("keybind-close").addEventListener("click", () => {
  keybindMenuOpen = false;
  document.getElementById("keybind-overlay").classList.add("hidden");
  renderer.domElement.requestPointerLock();
});

// ============================================================
// GAME LOOP
// ============================================================
let lastTime = performance.now();
function gameLoop(now) {
  const dt = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;
  updatePhysics(dt);
  render();
  updateHotbarUI();
  requestAnimationFrame(gameLoop);
}

updateHotbarUI();
requestAnimationFrame(gameLoop);

} // end main()
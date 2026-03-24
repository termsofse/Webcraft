/*
 * Minecraft HTML - Voxel Minecraft clone using Three.js
 * Features: true 3D voxel world, block place/break, inventory, flying, rebindable keys
 */

const THREE_CDN = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";

function loadThree(cb) {
    const s = document.createElement("script");
    s.src = THREE_CDN;
    s.onload = cb;
    [document.head.app](https://document.head.app)endChild(s);
}
loadThree(main);

function main() {

// ============================================================
// BLOCK DEFINITIONS
// ============================================================
const BLOCKS = {
    0:  { name: "Air",         solid: false },
    1:  { name: "Grass",       solid: true,  tab: "natural_blocks",  topTex: "grass_top.png",   top: 0x5B8C3E, sideTex: "grass_side.png",  side: 0x6B9E4A, bottomTex: "dirt.png",         bottom: 0x8B6914 },
    2:  { name: "Dirt",        solid: true,  tab: "natural_blocks",  topTex: "dirt.png",        top: 0x8B6914, sideTex: "dirt.png",        side: 0x8B6914, bottomTex: "dirt.png",         bottom: 0x8B6914 },
    3:  { name: "Stone",       solid: true,  tab: "building_blocks", topTex: "stone.png",       top: 0x7F7F7F, sideTex: "stone.png",       side: 0x7F7F7F, bottomTex: "stone.png",        bottom: 0x7F7F7F },
    4:  { name: "Cobblestone", solid: true,  tab: "building_blocks", topTex: "cobblestone.png", top: 0x6B6B6B, sideTex: "cobblestone.png", side: 0x6B6B6B, bottomTex: "cobblestone.png",  bottom: 0x6B6B6B },
    5:  { name: "Oak Log",     solid: true,  tab: "building_blocks", topTex: "oak_log_top.png", top: 0xA08050, sideTex: "oak_log_side.png",side: 0x6B5234, bottomTex: "oak_log_top.png",  bottom: 0xA08050 },
    6:  { name: "Oak Planks",  solid: true,  tab: "building_blocks", topTex: "oak_planks.png",  top: 0xBC9862, sideTex: "oak_planks.png",  side: 0xBC9862, bottomTex: "oak_planks.png",   bottom: 0xBC9862 },
    7:  { name: "Sand",        solid: true,  tab: "natural_blocks",  topTex: "sand.png",        top: 0xDBD3A0, sideTex: "sand.png",        side: 0xDBD3A0, bottomTex: "sand.png",         bottom: 0xDBD3A0 },
    8:  { name: "Glass",       solid: true,  tab: "colored_blocks",  topTex: "glass.png",       top: 0xC0E8FF, sideTex: "glass.png",       side: 0xC0E8FF, bottomTex: "glass.png",        bottom: 0xC0E8FF, transparent: true },
    9:  { name: "Brick",       solid: true,  tab: "building_blocks", topTex: "brick.png",       top: 0x9B4A3C, sideTex: "brick.png",       side: 0x9B4A3C, bottomTex: "brick.png",        bottom: 0x9B4A3C },
    10: { name: "Water",       solid: false, tab: "natural_blocks",  topTex: "water.png",       top: 0x3366CC, sideTex: "water.png",       side: 0x3366CC, bottomTex: "water.png",        bottom: 0x3366CC, transparent: true, opacity: 0.6 },
    11: { name: "Leaves",      solid: true,  tab: "natural_blocks",  topTex: "leaves.png",      top: 0x3A7A20, sideTex: "leaves.png",      side: 0x3A7A20, bottomTex: "leaves.png",       bottom: 0x3A7A20, transparent: true, opacity: 0.85 },
    12: { name: "Bedrock",     solid: true,  tab: "natural_blocks",  topTex: "bedrock.png",     top: 0x3A3A3A, sideTex: "bedrock.png",     side: 0x3A3A3A, bottomTex: "bedrock.png",      bottom: 0x3A3A3A },
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
    forward: "KeyW", backward: "KeyS", left: "KeyA", right: "KeyD",
    jump: "Space", sneak: "ShiftLeft", inventory: "KeyE",
    keybindMenu: "KeyO", pause: "Escape",
};
const keybindLabels = {
    forward: "Move Forward", backward: "Move Backward", left: "Strafe Left",
    right: "Strafe Right", jump: "Jump / Fly Up", sneak: "Sneak / Fly Down",
    inventory: "Inventory", keybindMenu: "Keybind Menu", pause: "Pause",
};

// ============================================================
// THREE.JS RENDERER & SCENE
// ============================================================
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById("game"), antialias: false });
renderer.setPixelRatio(Math.min([window.dev](https://window.dev)icePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);
scene.fog = new THREE.Fog(0x87CEEB, 20, 60);

const sun = new THREE.DirectionalLight(0xffffff, 1.0);
sun.position.set(20, 40, 20);
sun.castShadow = true;
scene.add(sun);
scene.add(new THREE.AmbientLight(0xccddff, 0.5));

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.05, 80);
scene.add(camera);

window.addEventListener("resize", () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

// ============================================================
// TEXTURES & MATERIALS
// ============================================================
function getMaterials(id) {
    const def = BLOCKS[id];
    const faceInfo = [
        { tex: def.sideTex, color: def.side },
        { tex: def.sideTex, color: def.side },
        { tex: def.topTex,  color: def.top  },
        { tex: def.bottomTex, color: def.bottom },
        { tex: def.sideTex, color: def.side },
        { tex: def.sideTex, color: def.side },
    ];
    return faceInfo.map(({ tex, color }) => {
        const opts = {};
        if (tex && TEX[tex]) { opts.map = TEX[tex]; } else { opts.color = color; }
        if (def.transparent) { opts.transparent = true; opts.opacity = def.opacity ?? 0.7; }
        return new [THREE.Me](https://THREE.Me)shLambertMaterial(opts);
    });
}

const world = [];
function initWorld() {
    for (let x = 0; x < WORLD_SIZE; x++) {
        world[x] = [];
        for (let y = 0; y < WORLD_HEIGHT; y++) {
            world[x][y] = new Uint8Array(WORLD_SIZE);
            for (let z = 0; z < WORLD_SIZE; z++) {
                if (y === 0)               world[x][y][z] = 12;
                else if (y < PLATFORM_Y)   world[x][y][z] = 2;
                else if (y === PLATFORM_Y) world[x][y][z] = 1;
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

const texLoader = new THREE.TextureLoader();
const TEX = {};
const TEX_FILES = [
    "grass_top.png","grass_side.png","dirt.png","stone.png","cobblestone.png",
    "oak_log_top.png","oak_log_side.png","oak_planks.png","sand.png",
    "glass.png","brick.png","water.png","leaves.png","bedrock.png"
];
let texturesLoaded = 0;
TEX_FILES.forEach(name => {
    texLoader.load("textures/block/" + name,
        tex => {
            tex.magFilter = THREE.NearestFilter;
            tex.minFilter = THREE.NearestFilter;
            TEX[name] = tex;
            texturesLoaded++;
            if (texturesLoaded === TEX_FILES.length) rebuildMeshes();
        },
        undefined,
        () => { texturesLoaded++; }
    );
});

const chunkGroup = new THREE.Group();
scene.add(chunkGroup);
const boxGeo = new THREE.BoxGeometry(1, 1, 1);
let blockMeshes = {};

function rebuildMeshes() {
    while (chunkGroup.children.length) {
        const m = chunkGroup.children[0];
        if (Array.isArray(m.material)) m.material.forEach(mat => mat.dispose());
        chunkGroup.remove(m);
    }
    blockMeshes = {};
    const counts = {};
    for (let x = 0; x < WORLD_SIZE; x++)
        for (let y = 0; y < WORLD_HEIGHT; y++)
            for (let z = 0; z < WORLD_SIZE; z++) {
                const id = world[x][y][z];
                if (id === 0 || !isVisible(x, y, z)) continue;
                counts[id] = (counts[id] || 0) + 1;
            }
    for (const id of Object.keys(counts)) {
        const mats = getMaterials(Number(id));
        const mesh = new THREE.InstancedMesh(boxGeo, mats, counts[id]);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        blockMeshes[id] = { mesh, idx: 0 };
        chunkGroup.add(mesh);
    }
    const dummy = new THREE.Object3D();
    for (let x = 0; x < WORLD_SIZE; x++)
        for (let y = 0; y < WORLD_HEIGHT; y++)
            for (let z = 0; z < WORLD_SIZE; z++) {
                const id = world[x][y][z];
                if (id === 0 || !blockMeshes[id] || !isVisible(x, y, z)) continue;
                dummy.position.set(x + 0.5, y + 0.5, z + 0.5);
                dummy.updateMatrix();
                const entry = blockMeshes[id];
                [entry.me](https://entry.me)sh.setMatrixAt(entry.idx++, dummy.matrix);
            }
    for (const entry of Object.values(blockMeshes)) {
        [entry.me](https://entry.me)sh.instanceMatrix.needsUpdate = true;
    }
}

function isVisible(x, y, z) {
    const neighbors = [[x+1,y,z],[x-1,y,z],[x,y+1,z],[x,y-1,z],[x,y,z+1],[x,y,z-1]];
    for (const [nx,ny,nz] of neighbors) {
        const nb = getBlock(nx, ny, nz);
        if (nb === 0 || BLOCKS[nb]?.transparent) return true;
    }
    return false;
}

const boxGeothing = new THREE.BoxGeometry(1.005, 1.005, 1.005);
const edges = new THREE.EdgesGeometry(boxGeothing);
const highlightMat = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2, transparent: true, opacity: 0.5 });
const highlightMesh = new THREE.LineSegments(edges, highlightMat);
highlightMesh.visible = false;
scene.add(highlightMesh);
rebuildMeshes();

// ============================================================
// PLAYER & INVENTORY GLOBALS
// ============================================================
const player = {
    x: WORLD_SIZE / 2 + 0.5, y: PLATFORM_Y + 2.6, z: WORLD_SIZE / 2 + 0.5,
    yaw: 0, pitch: 0, vy: 0, onGround: false, flying: false,
    width: 0.6, height: 1.8, eyeHeight: 1.62,
    speed: 4.3, flySpeed: 8, jumpForce: 7.8,
};

const inventory = new Array(27).fill(null);
const hotbar = [];
for (let i = 0; i < 9; i++) {
    hotbar.push(i < ALL_BLOCK_IDS.length ? { id: ALL_BLOCK_IDS[i], count: 64 } : null);
}

const INVENTORY_TABS = [
    { id: "building_blocks",   name: "Building Blocks"    },
    { id: "colored_blocks",    name: "Colored Blocks"     },
    { id: "natural_blocks",    name: "Natural Blocks"     },
    { id: "functional_blocks", name: "Functional Blocks"  },
    { id: "redstone_blocks",   name: "Redstone Blocks"    },
    { id: "tools_utilities",   name: "Tools & Utilities"  },
    { id: "combat",            name: "Combat"             },
    { id: "food_drinks",       name: "Food & Drinks"      },
    { id: "ingredients",       name: "Ingredients"        },
    { id: "spawn_eggs",        name: "Spawn Eggs"         },
    { id: "survival",          name: "Survival Inventory" },
    { id: "search",            name: "Search"             },
];

let selectedSlot    = 0;
let inventoryOpen   = false;
let keybindMenuOpen = false;
let pauseOpen       = false;
let activeInvTab    = "building_blocks";
let searchQuery     = "";
let pointerLocked   = false;
const keys = {};
let lastSpaceTime = 0;

// ============================================================
// INVENTORY STATE
// ============================================================
let cursorStack    = null; // { id, count }
let isDragging     = false;
let dragButton     = -1;
let dragStartStack = null;
let draggedSlots   = [];
const slotRegistry = new WeakMap();

// Cursor element that follows the mouse
const cursorEl = document.createElement("div");
cursorEl.id = "cursor-item";
cursorEl.style.cssText = "position:fixed;pointer-events:none;z-index:9999;display:none;width:36px;height:36px;transform:translate(-50%,-50%);";
[document.body.app](https://document.body.app)endChild(cursorEl);

function maxStack(id) { return BLOCKS[id]?.maxStack ?? 64; }

function updateCursorEl() {
    if (!cursorStack) {
        cursorEl.style.display = "none";
        cursorEl.innerHTML = "";
        return;
    }
    cursorEl.style.display = "block";
    cursorEl.innerHTML = "";
    const icon = makeBlockIcon(cursorStack.id, 36);
    icon.style.width = "36px";
    icon.style.height = "36px";
    [cursorEl.app](https://cursorEl.app)endChild(icon);
    if (cursorStack.count > 1) {
        const badge = document.createElement("span");
        badge.style.cssText = "position:absolute;bottom:1px;right:2px;font-size:10px;font-weight:bold;color:white;text-shadow:1px 1px 0 #000;pointer-events:none;";
        badge.textContent = cursorStack.count;
        [cursorEl.app](https://cursorEl.app)endChild(badge);
    }
}

function closeCursorOnInventoryClose() {
    cursorStack = null;
    updateCursorEl();
}

// ============================================================
// SLOT HANDLERS
// ============================================================
function attachSlotHandlers(el, slotGetter, slotSetter, isCreativeSource) {
    el.addEventListener("mousedown", e => {
        if (!inventoryOpen) return;
        e.preventDefault(); e.stopPropagation();
        if (e.button === 0 || e.button === 2) {
            isDragging = false; dragButton = e.button; draggedSlots = [];
            dragStartStack = cursorStack ? { ...cursorStack } : null;
        }
    });

    el.addEventListener("mouseenter", e => {
        if (!inventoryOpen) return;
        if ((e.buttons & 1) && dragButton === 0 && cursorStack) {
            if (!draggedSlots.includes(el)) { isDragging = true; draggedSlots.push(el); }
        } else if ((e.buttons & 2) && dragButton === 2 && cursorStack) {
            if (!draggedSlots.includes(el)) {
                isDragging = true; draggedSlots.push(el);
                applyRightDragStep(slotGetter, slotSetter);
            }
        }
    });

    el.addEventListener("mouseup", e => {
        if (!inventoryOpen) return;
        e.preventDefault(); e.stopPropagation();
        if (isDragging && dragButton === 0) {
            commitLeftDrag();
            isDragging = false; dragButton = -1; draggedSlots = [];
            return;
        }
        isDragging = false; dragButton = -1; draggedSlots = [];
        if (e.button === 0) handleLeftClick(e, slotGetter, slotSetter, isCreativeSource);
        if (e.button === 2) handleRightClick(slotGetter, slotSetter, isCreativeSource);
    });
}

function handleLeftClick(e, slotGetter, slotSetter, isCreativeSource) {
    const slotStack = slotGetter();
    if (isCreativeSource) {
        if (!slotStack) return;
        const amount = e.shiftKey ? maxStack(slotStack.id) : 1;
        if (!cursorStack)                              cursorStack = { id: slotStack.id, count: amount };
        else if (cursorStack.id === slotStack.id)      cursorStack.count = Math.min(cursorStack.count + amount, maxStack(slotStack.id));
        else                                           cursorStack = { id: slotStack.id, count: amount };
        updateCursorEl(); return;
    }
    if (!cursorStack && !slotStack) return;
    if (!cursorStack)                          { cursorStack = { ...slotStack }; slotSetter(null); }
    else if (!slotStack)                       { slotSetter({ ...cursorStack }); cursorStack = null; }
    else if (cursorStack.id === slotStack.id)  {
        const max = maxStack(cursorStack.id), total = cursorStack.count + slotStack.count;
        if (total <= max) { slotSetter({ id: slotStack.id, count: total }); cursorStack = null; }
        else { slotSetter({ id: slotStack.id, count: max }); cursorStack = { id: cursorStack.id, count: total - max }; }
    } else {
        const tmp = { ...slotStack }; slotSetter({ ...cursorStack }); cursorStack = tmp;
    }
    updateCursorEl();
}

function handleRightClick(slotGetter, slotSetter, isCreativeSource) {
    const slotStack = slotGetter();
    if (isCreativeSource) {
        if (!slotStack) return;
        if (!cursorStack)                          cursorStack = { id: slotStack.id, count: 1 };
        else if (cursorStack.id === slotStack.id)  cursorStack.count = Math.min(cursorStack.count + 1, maxStack(slotStack.id));
        else                                       cursorStack = { id: slotStack.id, count: 1 };
        updateCursorEl(); return;
    }
    if (!cursorStack) {
        if (!slotStack) return;
        const half = Math.ceil(slotStack.count / 2);
        cursorStack = { id: slotStack.id, count: half };
        const rem = slotStack.count - half;
        slotSetter(rem > 0 ? { id: slotStack.id, count: rem } : null);
        updateCursorEl(); return;
    }
    if (!slotStack) {
        slotSetter({ id: cursorStack.id, count: 1 });
        cursorStack.count--;
        if (cursorStack.count <= 0) cursorStack = null;
    } else if (slotStack.id === cursorStack.id) {
        const max = maxStack(cursorStack.id);
        if (slotStack.count < max) {
            slotSetter({ id: slotStack.id, count: slotStack.count + 1 });
            cursorStack.count--;
            if (cursorStack.count <= 0) cursorStack = null;
        }
    } else {
        const tmp = { ...slotStack }; slotSetter({ ...cursorStack }); cursorStack = tmp;
    }
    updateCursorEl();
}

function commitLeftDrag() {
    if (!cursorStack || draggedSlots.length === 0) return;
    const eligible = draggedSlots.filter(el => {
        const reg = slotRegistry.get(el);
        if (!reg) return false;
        const s = reg.getter();
        return s === null || s.id === cursorStack.id;
    });
    if (eligible.length === 0) return;
    const perSlot = Math.floor(cursorStack.count / eligible.length);
    if (perSlot < 1) return;
    let remaining = cursorStack.count;
    eligible.forEach(el => {
        const reg = slotRegistry.get(el);
        if (!reg) return;
        const s = reg.getter(), max = maxStack(cursorStack.id), cur = s ? s.count : 0;
        const add = Math.min(perSlot, max - cur, remaining);
        if (add > 0) { reg.setter({ id: cursorStack.id, count: cur + add }); remaining -= add; }
    });
    cursorStack = remaining > 0 ? { id: cursorStack.id, count: remaining } : null;
    updateCursorEl();
}

function applyRightDragStep(slotGetter, slotSetter) {
    if (!cursorStack) return;
    const slotStack = slotGetter();
    if (!slotStack) {
        slotSetter({ id: cursorStack.id, count: 1 });
        cursorStack.count--;
        if (cursorStack.count <= 0) cursorStack = null;
    } else if (slotStack.id === cursorStack.id) {
        const max = maxStack(cursorStack.id);
        if (slotStack.count < max) {
            slotSetter({ id: slotStack.id, count: slotStack.count + 1 });
            cursorStack.count--;
            if (cursorStack.count <= 0) cursorStack = null;
        }
    }
    updateCursorEl();
}

// Drop cursor when clicking outside slots
document.addEventListener("mouseup", e => {
    if (!inventoryOpen || isDragging) return;
    if (!e.target.closest(".inv-slot, .hotbar-slot, #cursor-item")) {
        cursorStack = null;
        updateCursorEl();
    }
});

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
        if (e.repeat) return;
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
        if (inventoryOpen)      { inventoryOpen = false; updateInventoryUI(); renderer.domElement.requestPointerLock(); }
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
    if (cursorStack) {
        cursorEl.style.left = e.clientX + "px";
        cursorEl.style.top  = e.clientY + "px";
    }
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
        if (getBlock(hit.x, hit.y, hit.z) !== 12) setBlock(hit.x, hit.y, hit.z, 0);
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
// DDA RAY CAST
// ============================================================
function castRay() {
    const dir = new THREE.Vector3(0, 0, -1);
    [dir.app](https://dir.app)lyQuaternion(camera.quaternion);
    const ox = player.x, oy = player.y, oz = player.z;
    let ix = Math.floor(ox), iy = Math.floor(oy), iz = Math.floor(oz);
    const sx = Math.sign(dir.x), sy = Math.sign(dir.y), sz = Math.sign(dir.z);
    const tdx = Math.abs(1/dir.x), tdy = Math.abs(1/dir.y), tdz = Math.abs(1/dir.z);
    let tmx = dir.x > 0 ? (ix+1-ox)*tdx : (ox-ix)*tdx;
    let tmy = dir.y > 0 ? (iy+1-oy)*tdy : (oy-iy)*tdy;
    let tmz = dir.z > 0 ? (iz+1-oz)*tdz : (oz-iz)*tdz;
    let face = null;
    for (let i = 0; i < 50; i++) {
        const b = getBlock(ix, iy, iz);
        if (b !== 0 && BLOCKS[b]?.solid) return { x: ix, y: iy, z: iz, face, blockId: b };
        if (tmx < tmy && tmx < tmz)      { tmx += tdx; ix += sx; face = [-sx,0,0]; }
        else if (tmy < tmz)              { tmy += tdy; iy += sy; face = [0,-sy,0]; }
        else                             { tmz += tdz; iz += sz; face = [0,0,-sz]; }
    }
    return null;
}

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
    if (keys[keybinds.forward])  { mx -= Math.sin(player.yaw); mz -= Math.cos(player.yaw); }
    if (keys[keybinds.backward]) { mx += Math.sin(player.yaw); mz += Math.cos(player.yaw); }
    if (keys[keybinds.left])     { mx -= Math.cos(player.yaw); mz += Math.sin(player.yaw); }
    if (keys[keybinds.right])    { mx += Math.cos(player.yaw); mz -= Math.sin(player.yaw); }
    const len = Math.sqrt(mx*mx+mz*mz);
    if (len > 0) { mx /= len; mz /= len; }
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
    camera.position.set(player.x, player.y, player.z);
    camera.rotation.order = "YXZ";
    camera.rotation.y = player.yaw;
    camera.rotation.x = player.pitch;
    const hit = castRay();
    if (hit && pointerLocked) {
        highlightMesh.position.set(hit.x+0.5, hit.y+0.5, hit.z+0.5);
        highlightMesh.visible = true;
    } else {
        highlightMesh.visible = false;
    }
    renderer.render(scene, camera);
    document.getElementById("debug-info").innerHTML =
        `XYZ: ${player.x.toFixed(1)} / ${player.y.toFixed(1)} / ${player.z.toFixed(1)}<br>` +
        `${player.flying ? "FLYING" : "WALKING"} | ${player.onGround ? "Ground" : "Air"}<br>` +
        `Block: ${hotbar[selectedSlot]?.id ? BLOCKS[hotbar[selectedSlot].id].name : "Empty"}`;
}

// ============================================================
// BLOCK ICON HELPER
// ============================================================
const IMG_CACHE = {};
function getImg(texName) {
    if (IMG_CACHE[texName]) return IMG_CACHE[texName];
    const img = new Image();
    img.src = "textures/" + texName;
    IMG_CACHE[texName] = img;
    return img;
}

function makeBlockIcon(blockId, size = 32) {
    const block = BLOCKS[blockId];
    if (!block || blockId === 0) return document.createElement("div");
    const img = new Image();
    const iconName = block.name.toLowerCase().replace(/ /g, "_") + ".png";
    img.src = "textures/icons/" + iconName;
    img.style.width  = size + "px";
    img.style.height = size + "px";
    img.style.imageRendering = "pixelated";
    return img;
}

// ============================================================
// HOTBAR UI
// ============================================================
function updateHotbarUI() {
    const el = document.getElementById("hotbar");
    if (!el) return;
    el.innerHTML = "";
    for (let i = 0; i < 9; i++) {
        const slot = document.createElement("div");
        slot.className = "hotbar-slot" + (i === selectedSlot ? " active" : "");
        slot.style.position = "relative";
        if (hotbar[i]) {
            const icon = makeBlockIcon(hotbar[i].id, 36);
            icon.className = "block-icon";
            [slot.app](https://slot.app)endChild(icon);
            if (hotbar[i].count > 1) {
                const badge = document.createElement("span");
                badge.style.cssText = "position:absolute;bottom:1px;right:2px;font-size:10px;font-weight:bold;color:white;text-shadow:1px 1px 0 #000;pointer-events:none;";
                badge.textContent = hotbar[i].count;
                [slot.app](https://slot.app)endChild(badge);
            }
        }
        slot.addEventListener("click", () => { selectedSlot = i; updateHotbarUI(); });
        [el.app](https://el.app)endChild(slot);
    }
}

// ============================================================
// INVENTORY UI
// ============================================================
function updateInventoryUI() {
    const overlay = document.getElementById("inventory-overlay");
    if (!overlay) return;
    overlay.classList.toggle("hidden", !inventoryOpen);
    if (!inventoryOpen) { closeCursorOnInventoryClose(); return; }

    // Tabs
    let tabsContainer = document.getElementById("inv-tabs-container");
    if (!tabsContainer) {
        tabsContainer = document.createElement("div");
        tabsContainer.id = "inv-tabs-container";
        tabsContainer.style.cssText = "display:flex;flex-wrap:wrap;gap:4px;margin-bottom:10px;";
        overlay.insertBefore(tabsContainer, document.getElementById("inv-content"));
    }
    tabsContainer.innerHTML = "";
    INVENTORY_TABS.forEach(tabDef => {
        const tabEl = document.createElement("div");
        tabEl.className = "inv-tab" + (activeInvTab === tabDef.id ? " active" : "");
        tabEl.title = tabDef.name;
        tabEl.style.cssText = "cursor:pointer;padding:2px;border:" + (activeInvTab === tabDef.id ? "2px solid white" : "2px solid transparent") + ";";
        const iconImg = document.createElement("img");
        iconImg.src = "/ui/" + tabDef.id + ".png";
        iconImg.alt = tabDef.name;
        iconImg.style.cssText = "width:32px;height:32px;display:block;";
        [tabEl.app](https://tabEl.app)endChild(iconImg);
        tabEl.onclick = () => { activeInvTab = tabDef.id; updateInventoryUI(); };
        [tabsContainer.app](https://tabsContainer.app)endChild(tabEl);
    });

    const content = document.getElementById("inv-content");
    content.innerHTML = "";

    if (activeInvTab !== "survival") {
        const label = document.createElement("div");
        label.className = "inv-label";
        label.style.cssText = "font-weight:bold;margin-bottom:8px;";
        const tabData = INVENTORY_TABS.find(t => t.id === activeInvTab);
        label.textContent = tabData ? tabData.name : "Inventory";
        [content.app](https://content.app)endChild(label);
    }

    if (activeInvTab === "search") {
        const searchInput = document.createElement("input");
        searchInput.type = "text";
        searchInput.placeholder = "Search items...";
        searchInput.value = searchQuery;
        searchInput.style.cssText = "width:100%;padding:6px;margin-bottom:10px;background:#222;color:white;border:2px solid #555;";
        searchInput.oninput = e => { searchQuery = e.target.value.toLowerCase(); renderGrid(); };
        [content.app](https://content.app)endChild(searchInput);
        setTimeout(() => searchInput.focus(), 10);
    }

    const gridContainer = document.createElement("div");
    gridContainer.id = "dynamic-inv-grid";
    gridContainer.style.cssText = "overflow-y:auto;max-height:280px;display:flex;flex-wrap:wrap;gap:4px;align-content:flex-start;";
    [content.app](https://content.app)endChild(gridContainer);
    gridContainer.addEventListener("contextmenu", e => e.preventDefault());

    function makeSlotEl(width) {
        const slot = document.createElement("div");
        slot.className = "inv-slot";
        slot.style.cssText = "width:" + width + "px;height:" + width + "px;border:2px solid #555;background:#8b8b8b;position:relative;cursor:pointer;user-select:none;";
        return slot;
    }

    function refreshSlotContents(slot, stack) {
        slot.innerHTML = "";
        if (!stack) return;
        const icon = makeBlockIcon(stack.id, 28);
        icon.className = "block-icon";
        [slot.app](https://slot.app)endChild(icon);
        if (stack.count > 1) {
            const badge = document.createElement("span");
            badge.style.cssText = "position:absolute;bottom:1px;right:2px;font-size:10px;font-weight:bold;color:white;text-shadow:1px 1px 0 #000;pointer-events:none;";
            badge.textContent = stack.count;
            [slot.app](https://slot.app)endChild(badge);
        }
    }

    function renderGrid() {
        gridContainer.innerHTML = "";
        if (activeInvTab === "survival") {
            for (let i = 0; i < 27; i++) {
                const idx = i;
                const slot = makeSlotEl(36);
                const getter = () => inventory[idx];
                const setter = v => { inventory[idx] = v; refreshSlotContents(slot, inventory[idx]); };
                refreshSlotContents(slot, inventory[idx]);
                slotRegistry.set(slot, { getter, setter });
                attachSlotHandlers(slot, getter, setter, false);
                [gridContainer.app](https://gridContainer.app)endChild(slot);
            }
        } else {
            let displayedBlocks = [];
            if (activeInvTab === "search") {
                displayedBlocks = ALL_BLOCK_IDS.filter(id => BLOCKS[id].name.toLowerCase().includes(searchQuery));
            } else {
                displayedBlocks = ALL_BLOCK_IDS.filter(id => (BLOCKS[id].tab || "building_blocks") === activeInvTab);
            }
            displayedBlocks.forEach(id => {
                const slot = makeSlotEl(36);
                slot.title = BLOCKS[id]?.name;
                const getter = () => ({ id, count: maxStack(id) });
                const setter = () => {};
                const icon = makeBlockIcon(id, 28);
                icon.className = "block-icon";
                [slot.app](https://slot.app)endChild(icon);
                slotRegistry.set(slot, { getter, setter });
                attachSlotHandlers(slot, getter, setter, true);
                [gridContainer.app](https://gridContainer.app)endChild(slot);
            });
        }
    }

    renderGrid();

    // Hotbar row at bottom of inventory
    const hbSlots = document.getElementById("inv-hotbar-slots");
    if (hbSlots) {
        hbSlots.innerHTML = "";
        hbSlots.addEventListener("contextmenu", e => e.preventDefault());
        for (let i = 0; i < 9; i++) {
            const idx = i;
            const slot = makeSlotEl(36);
            if (idx === selectedSlot) slot.className += " active";
            const getter = () => hotbar[idx];
            const setter = v => { hotbar[idx] = v; refreshSlotContents(slot, hotbar[idx]); updateHotbarUI(); };
            refreshSlotContents(slot, hotbar[idx]);
            slotRegistry.set(slot, { getter, setter });
            attachSlotHandlers(slot, getter, setter, false);
            [hbSlots.app](https://hbSlots.app)endChild(slot);
        }
    }
}

// ============================================================
// KEYBIND MENU
// ============================================================
let listeningFor = null;

function buildKeybindUI() {
    const list = document.getElementById("keybind-list");
    list.innerHTML = "";
    for (const [action, label] of Object.entries(keybindLabels)) {
        const row = document.createElement("div"); row.className = "keybind-row";
        const span = document.createElement("span"); span.textContent = label; [row.app](https://row.app)endChild(span);
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
        [row.app](https://row.app)endChild(btn); [list.app](https://list.app)endChild(row);
    }
}

function fmt(code) {
    return code.replace("Key","").replace("Digit","")
        .replace("ShiftLeft","L-Shift").replace("ShiftRight","R-Shift")
        .replace("ControlLeft","L-Ctrl").replace("Space","Space")
        .replace("ArrowUp","↑").replace("ArrowDown","↓")
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

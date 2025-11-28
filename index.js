const hexSize = 40;
const padding = 20;

const canvas = document.getElementById("hexCanvas");
const ctx = canvas.getContext("2d");

const pasture = "#00ac48ff";
const forest = "#005716ff";
const hills = "#a67700ff";
const mountain = "#797979ff";
const wheat = "#f6ff00ff";
const desert = "#f4ffccff";
const water = "#28a0ebff";
const gold = "#ffae00ff";
const test = "purple";

const gametype = document.getElementById("gametype");
const rerollButton = document.getElementById("reroll");
const playerCountButton = document.getElementById("playernumber");
playerCountButton.value = "4";

var fourPlayer = true;

rerollButton.addEventListener("click", () => {
    gametype.dispatchEvent(new Event("change"));
});

playerCountButton.addEventListener("change", () => {
    fourPlayer = playerCountButton.value === "4";
    gametype.dispatchEvent(new Event("change"));
});

function expandPool(pool) {
    const out = [];
    for (const item of pool) {
        const val = item[0];
        const count = item[1];
        const canAssign = item[2] !== undefined ? item[2] : true;

        for (let i = 0; i < count; i++) {
            if (typeof val === "string" && val.startsWith("#")) {
                out.push({ value: val, canAssign });
            } else {
                out.push(val);
            }
        }
    }
    return out;
}


function shuffle(arr) {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

function axialToPixel(q, r, size) {
    const x = size * Math.sqrt(3) * (q + r / 2);
    const y = size * 1.5 * r;
    return { x, y };
}

function drawHex(x, y, size, fillStyle, strokeStyle) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = Math.PI / 180 * (60 * i - 30);
        const vx = x + size * Math.cos(angle);
        const vy = y + size * Math.sin(angle);
        if (i === 0) ctx.moveTo(vx, vy);
        else ctx.lineTo(vx, vy);
    }
    ctx.closePath();
    ctx.fillStyle = fillStyle;
    ctx.fill();
    ctx.strokeStyle = strokeStyle;
    ctx.stroke();
}

function generateGrid(A, B, C, labelPool, colorPool, forcedTiles = []) {
    const forcedLookup = new Map();
    forcedTiles.forEach(t => forcedLookup.set(`${t.q},${t.r}`, t));

    A--; B--; C--;

    const labels = shuffle(expandPool(labelPool));
    const colors = shuffle(expandPool(colorPool));

    const coords = [];
    for (let q = -A; q <= B; q++) {
        const rMin = Math.max(-C, -C - q);
        const rMax = Math.min(A, B - q);
        for (let r = rMin; r <= rMax; r++) {
            coords.push({ q, r });
        }
    }


    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    const centers = coords.map(({ q, r }) => {
        const p = axialToPixel(q, r, hexSize);
        minX = Math.min(minX, p.x);
        maxX = Math.max(maxX, p.x);
        minY = Math.min(minY, p.y);
        maxY = Math.max(maxY, p.y);
        return p;
    });


    const dpr = window.devicePixelRatio || 1;
    const width = Math.ceil(maxX - minX + hexSize * Math.sqrt(3) + padding * 2);
    const height = Math.ceil(maxY - minY + hexSize * 2 + padding * 2);

    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.translate(
        padding - minX + (hexSize * Math.sqrt(3)) / 2,
        padding - minY + hexSize
    );

    let minCX = Infinity, maxCX = -Infinity;
    centers.forEach(c => {
        minCX = Math.min(minCX, c.x);
        maxCX = Math.max(maxCX, c.x);
    });
    const tipSet = new Set();
    centers.forEach((c, i) => {
        if (Math.abs(c.x - minCX) < 0.1) tipSet.add(i);
        if (Math.abs(c.x - maxCX) < 0.1) tipSet.add(i);
    });

    let labelPtr = 0;
    let colorPtr = 0;

    centers.forEach((c, i) => {
        const { q, r } = coords[i];
        const key = `${q},${r}`;

        let color;
        let label = null;

        if (forcedLookup.has(key)) {
            const f = forcedLookup.get(key);
            color = f.color;
            if (f.allowLabel && labels[labelPtr] !== undefined) {
                label = labels[labelPtr++];
            }
        }
        else if (tipSet.has(i) && gametype.value.startsWith("seafarers-")) {
            color = water;
        }
        else {
            const entry = colors[colorPtr++] || { value: "#cccccc", canAssign: false };
            color = entry.value;
            if (entry.canAssign && labels[labelPtr] !== undefined) {
                label = labels[labelPtr++];
            }
        }

        drawHex(c.x, c.y, hexSize - 1, color, "#444");

        if (label) {
            ctx.fillStyle = "#222";
            ctx.font = "14px sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(label, c.x, c.y);
        }
    });
}

//coordinate system guide
//q - positive means right
//r - positive means down diagonally to the right
//lock in gang
gametype.addEventListener("change", () => {
    switch (gametype.value) {

        case "base":
            generateGrid(
                3, 3, 3,
                [
                    ["2", 1], ["3", 2], ["4", 2], ["5", 2],
                    ["6", 2], ["8", 2], ["9", 2], ["10", 2],
                    ["11", 2], ["12", 1],
                ],
                [
                    [pasture, 4, true],
                    [forest, 4, true],
                    [hills, 3, true],
                    [mountain, 3, true],
                    [wheat, 4, true],
                    [desert, 1, false],
                ],
                []
            );
            break;
        case "seafarers-newshores":
            if (fourPlayer)
                generateGrid(
                    4, 5, 4,
                    [
                        ["2", 2], ["3", 3], ["4", 3], ["5", 3],
                        ["6", 3], ["8", 3], ["9", 3], ["10", 3],
                        ["11", 3], ["12", 1],
                    ],
                    [
                        [pasture, 5, true],
                        [forest, 5, true],
                        [hills, 5, true],
                        [mountain, 5, true],
                        [wheat, 5, true],
                        [desert, 1, false],
                        [gold, 2, true],
                    ],
                    [{ q: 3, r: 1, color: water, allowLabel: false },
                    { q: 2, r: 1, color: water, allowLabel: false },
                    { q: 1, r: 2, color: water, allowLabel: false },
                    { q: 0, r: 3, color: water, allowLabel: false },
                    { q: 2, r: 0, color: water, allowLabel: false },
                    { q: 3, r: 1, color: water, allowLabel: false },
                    { q: 4, r: -1, color: water, allowLabel: false },
                    { q: 2, r: -1, color: water, allowLabel: false },
                    { q: 2, r: -2, color: water, allowLabel: false },
                    { q: 2, r: -3, color: water, allowLabel: false },
                    { q: 4, r: -3, color: water, allowLabel: false },
                    { q: 1, r: -2, color: water, allowLabel: false },
                    { q: -1, r: -2, color: water, allowLabel: false },
                    { q: 0, r: -2, color: water, allowLabel: false },
                    { q: -2, r: -1, color: water, allowLabel: false },
                    ]
                );
            else
                generateGrid(
                    4, 4, 4,
                    [
                        ["2", 1], ["3", 2], ["4", 3], ["5", 3],
                        ["6", 2], ["8", 3], ["9", 2], ["10", 3],
                        ["11", 2], ["12", 1],
                    ],
                    [
                        [pasture, 5, true],
                        [forest, 3, true],
                        [hills, 4, true],
                        [mountain, 4, true],
                        [wheat, 4, true],
                        [gold, 2, true],
                    ],
                    [{ q: 1, r: 0, color: water, allowLabel: false },
                    { q: 1, r: 1, color: water, allowLabel: false },
                    { q: 2, r: 1, color: water, allowLabel: false },
                    { q: 0, r: 2, color: water, allowLabel: false },
                    { q: -1, r: 3, color: water, allowLabel: false },
                    { q: 1, r: 0, color: water, allowLabel: false },
                    { q: 1, r: -1, color: water, allowLabel: false },
                    { q: 1, r: -2, color: water, allowLabel: false },
                    { q: 0, r: -2, color: water, allowLabel: false },
                    { q: -1, r: -2, color: water, allowLabel: false },
                    { q: -2, r: -1, color: water, allowLabel: false },
                    { q: -1, r: -2, color: water, allowLabel: false },
                    { q: 3, r: -1, color: water, allowLabel: false },
                    { q: 2, r: -3, color: water, allowLabel: false },
                    { q: 3, r: -3, color: water, allowLabel: false },
                    ]
                );
            break;

        case "seafarers-fullrandom":
            generateGrid(
                4, 5, 4,
                [
                    ["2", 1], ["3", 3], ["4", 3], ["5", 3],
                    ["6", 2], ["8", 2], ["9", 3], ["10", 3],
                    ["11", 2], ["12", 1],
                ],
                [
                    [pasture, 5, true],
                    [forest, 5, true],
                    [hills, 4, true],
                    [mountain, 4, true],
                    [wheat, 5, true],
                    [water, 19, false],
                ],
                []
            );
            break;

        case "seafarers-fullrandommega":
            generateGrid(
                4, 6, 4,
                [
                    ["2", 2], ["3", 3], ["4", 3], ["5", 3],
                    ["6", 3], ["8", 3], ["9", 3], ["10", 3],
                    ["11", 2], ["12", 2],
                ],
                [
                    [pasture, 5, true],
                    [forest, 5, true],
                    [hills, 5, true],
                    [mountain, 5, true],
                    [wheat, 5, true],
                    [desert, 3, false],
                    [water, 19, false],
                    [gold, 2, true],
                ],
                []
            );
            break;

        default:
            console.error("Unknown game mode:", gametype.value);
            break;
    }
});


gametype.dispatchEvent(new Event("change"));

// Конвертация галочки из SVG пользователя в Android pathData (200x200, по центру)
const checkmark = "m2355 739 c44 -36 97 -80 118 -97 l37 -32 -62 -77 c-566 -691 -653 -798 -781 -957 -65 -80 -124 -146 -132 -146 -8 0 -122 99 -255 220 -132 121 -257 235 -277 252 l-36 32 99 108 c54 60 104 108 110 108 11 0 48 -32 253 -218 41 -37 75 -66 77 -64 1 1 44 54 96 118 93 115 180 222 418 513 69 84 152 187 185 229 33 42 62 76 65 77 3 0 42 -30 85 -66z";

function parseNumbers(str) {
    return (str.replace(/,/g, ' ').match(/-?[\.\d]+(?:e[+-]?\d+)?/g) || []).map(Number);
}

// Шаг 1: разобрать путь в абсолютные координаты, применяя transform translate(0,359) scale(0.1,-0.1)
// ax, ay стартуют с (0, 1795) - после прямоугольника
let ax = 0, ay = 1795;
const pts = []; // точки для bbox
const tokens = checkmark.match(/[MmZzLlCcSsQqTtAa][^MmZzLlCcSsQqTtAa]*/g) || [];
const abs = []; // команды в абсолютных координатах

for (const raw of tokens) {
    const t = raw.trim();
    const cmd = t[0];
    const nums = parseNumbers(t.substring(1));
    if (cmd === 'm') {
        ax += nums[0]; ay += nums[1];
        abs.push(['M', ax, ay]);
        pts.push([ax, ay]);
    } else if (cmd === 'l') {
        for (let i = 0; i < nums.length; i += 2) {
            ax += nums[i]; ay += nums[i + 1];
            abs.push(['L', ax, ay]);
            pts.push([ax, ay]);
        }
    } else if (cmd === 'c') {
        for (let i = 0; i < nums.length; i += 6) {
            const x1 = ax + nums[i], y1 = ay + nums[i + 1];
            const x2 = ax + nums[i + 2], y2 = ay + nums[i + 3];
            ax += nums[i + 4]; ay += nums[i + 5];
            abs.push(['C', x1, y1, x2, y2, ax, ay]);
            pts.push([ax, ay], [x1, y1], [x2, y2]);
        }
    } else if (cmd === 'z') {
        abs.push(['Z']);
    }
}

// Шаг 2: применить transform -> координаты в 367x359 пространстве
const tpts = pts.map(([x, y]) => [x * 0.1, 359 - y * 0.1]);

// Шаг 3: bbox
let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
for (const [x, y] of tpts) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
}
const w = maxX - minX, h = maxY - minY;
const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;

// Шаг 4: масштаб, чтобы ширина стала 150 (вписывается в scallop радиус ~85), центрировать на (100,100)
const scale = 90 / w;
const offX = 100 - cx * scale;
const offY = 100 - cy * scale;

// Шаг 5: вывести pathData
const out = [];
for (const seg of abs) {
    const c = seg[0];
    if (c === 'Z') { out.push('Z'); continue; }
    const t = (x, y) => {
        const nx = x * 0.1 * scale + offX;
        const ny = (359 - y * 0.1) * scale + offY;
        return `${nx.toFixed(1)},${ny.toFixed(1)}`;
    };
    if (c === 'M' || c === 'L') {
        out.push(`${c}${t(seg[1], seg[2])}`);
    } else if (c === 'C') {
        out.push(`C${t(seg[1], seg[2])} ${t(seg[3], seg[4])} ${t(seg[5], seg[6])}`);
    }
}
console.log(out.join(' '));
console.log(`\n// bbox: x ${minX.toFixed(1)}-${maxX.toFixed(1)} y ${minY.toFixed(1)}-${maxY.toFixed(1)}, w=${w.toFixed(1)} h=${h.toFixed(1)}`);

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xFF];
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function createChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, "ascii");
  data.copy(chunk, 8);
  const crcBuf = chunk.subarray(4, 8 + len);
  chunk.writeUInt32BE(crc32(crcBuf), 8 + len);
  return chunk;
}

function encodePNG(width, height, rgbaBuffer) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const ihdrChunk = createChunk("IHDR", ihdr);

  const scanlines = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    const rowOffset = y * (1 + width * 4);
    scanlines[rowOffset] = 0;
    rgbaBuffer.copy(scanlines, rowOffset + 1, y * width * 4, (y + 1) * width * 4);
  }

  const idatChunk = createChunk("IDAT", zlib.deflateSync(scanlines));
  const iendChunk = createChunk("IEND", Buffer.alloc(0));
  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function generateCodeforcesIcon(size) {
  const buffer = Buffer.alloc(size * size * 4);
  const bg = [15, 23, 42, 255];       // Dark slate
  const yellow = [245, 158, 11, 255]; // Yellow bar
  const blue = [37, 99, 235, 255];    // Blue bar
  const red = [220, 38, 38, 255];     // Red bar

  for (let i = 0; i < size * size; i++) {
    buffer[i * 4] = bg[0];
    buffer[i * 4 + 1] = bg[1];
    buffer[i * 4 + 2] = bg[2];
    buffer[i * 4 + 3] = bg[3];
  }

  const barWidth = Math.max(2, Math.floor(size * 0.18));
  const barGap = Math.max(1, Math.floor(size * 0.08));
  const totalBarsWidth = (3 * barWidth) + (2 * barGap);
  const startX = Math.floor((size - totalBarsWidth) / 2);
  const baseY = size - Math.floor(size * 0.18);

  const bars = [
    { color: yellow, heightRatio: 0.50, x: startX },
    { color: blue,   heightRatio: 0.78, x: startX + barWidth + barGap },
    { color: red,    heightRatio: 0.62, x: startX + 2 * (barWidth + barGap) }
  ];

  function fillRect(x1, y1, width, height, color) {
    for (let dy = 0; dy < height; dy++) {
      for (let dx = 0; dx < width; dx++) {
        const px = x1 + dx;
        const py = y1 + dy;
        if (px >= 0 && px < size && py >= 0 && py < size) {
          const idx = (py * size + px) * 4;
          buffer[idx] = color[0];
          buffer[idx + 1] = color[1];
          buffer[idx + 2] = color[2];
          buffer[idx + 3] = color[3];
        }
      }
    }
  }

  bars.forEach(bar => {
    const barHeight = Math.floor(size * bar.heightRatio);
    const topY = baseY - barHeight;
    fillRect(bar.x, topY, barWidth, barHeight, bar.color);
  });

  return encodePNG(size, size, buffer);
}

const iconsDir = path.resolve(__dirname);
[16, 48, 128].forEach(size => {
  const pngData = generateCodeforcesIcon(size);
  fs.writeFileSync(path.join(iconsDir, `icon-${size}.png`), pngData);
  console.log(`Generated: icon-${size}.png`);
});
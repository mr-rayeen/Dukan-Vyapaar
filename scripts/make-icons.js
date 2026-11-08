import fs from 'fs';
import zlib from 'zlib';

function createPng(width, height, r, g, b) {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // bit depth
  ihdr.writeUInt8(2, 9); // color type (truecolor RGB)
  ihdr.writeUInt8(0, 10); // compression
  ihdr.writeUInt8(0, 11); // filter
  ihdr.writeUInt8(0, 12); // interlace

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    const crc = crc32(Buffer.concat([typeBuf, data]));
    crcBuf.writeInt32BE(crc, 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  // Raw pixel data with filter byte 0 at start of each scanline
  const scanlineSize = 1 + width * 3;
  const rawData = Buffer.alloc(scanlineSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * scanlineSize;
    rawData[rowOffset] = 0; // Filter: none
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 3;
      // create a nice shopkeeper green emerald gradient with yellow/white box in center
      const distFromCenter = Math.sqrt(Math.pow(x - width / 2, 2) + Math.pow(y - height / 2, 2));
      const inBox = Math.abs(x - width / 2) < width * 0.28 && Math.abs(y - height / 2) < height * 0.28;
      
      if (inBox) {
        rawData[pxOffset] = 245;     // Amber box
        rawData[pxOffset + 1] = 158;
        rawData[pxOffset + 2] = 11;
      } else {
        rawData[pxOffset] = r;
        rawData[pxOffset + 1] = g;
        rawData[pxOffset + 2] = b;
      }
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressedData);
  const ihdrChunk = makeChunk('IHDR', ihdr);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Simple CRC32 table
const crcTable = new Int32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return crc ^ -1;
}

if (!fs.existsSync('public')) {
  fs.mkdirSync('public', { recursive: true });
}

fs.writeFileSync('public/pwa-192x192.png', createPng(192, 192, 16, 185, 129));
fs.writeFileSync('public/pwa-512x512.png', createPng(512, 512, 16, 185, 129));
fs.writeFileSync('public/apple-touch-icon.png', createPng(180, 180, 16, 185, 129));
console.log('PWA PNG icons generated successfully!');

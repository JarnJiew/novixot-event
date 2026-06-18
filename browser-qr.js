/*
  NOVI x OT browser QR generator.
  Self-contained QR Code Model 2 generator for byte-mode URLs, version 5-L.
  No network calls, no external runtime dependencies.
*/
(function () {
  const VERSION = 5;
  const SIZE = 17 + VERSION * 4;
  const DATA_CODEWORDS = 108;
  const ECC_CODEWORDS = 26;

  function bitsFromNumber(value, length, out) {
    for (let i = length - 1; i >= 0; i--) out.push((value >>> i) & 1);
  }

  function utf8Bytes(text) {
    return Array.from(new TextEncoder().encode(text));
  }

  function gfMul(x, y) {
    let z = 0;
    for (let i = 7; i >= 0; i--) {
      z = (z << 1) ^ ((z >>> 7) * 0x11d);
      z ^= ((y >>> i) & 1) * x;
    }
    return z & 0xff;
  }

  function rsGenerator(degree) {
    let poly = [1];
    let root = 1;
    for (let i = 0; i < degree; i++) {
      const next = new Array(poly.length + 1).fill(0);
      for (let j = 0; j < poly.length; j++) {
        next[j] ^= gfMul(poly[j], root);
        next[j + 1] ^= poly[j];
      }
      poly = next;
      root = gfMul(root, 2);
    }
    return poly.slice(0, degree);
  }

  function rsRemainder(data, degree) {
    const gen = rsGenerator(degree);
    const result = new Array(degree).fill(0);
    data.forEach((byte) => {
      const factor = byte ^ result.shift();
      result.push(0);
      for (let i = 0; i < degree; i++) result[i] ^= gfMul(gen[i], factor);
    });
    return result;
  }

  function dataCodewords(payload) {
    const bytes = utf8Bytes(payload);
    if (bytes.length > 106) throw new Error("QR payload is too long for built-in browser QR. Shorten PUBLIC_PASS_BASE_URL.");
    const bits = [];
    bitsFromNumber(0b0100, 4, bits);
    bitsFromNumber(bytes.length, 8, bits);
    bytes.forEach((b) => bitsFromNumber(b, 8, bits));
    const capacityBits = DATA_CODEWORDS * 8;
    const terminator = Math.min(4, capacityBits - bits.length);
    bitsFromNumber(0, terminator, bits);
    while (bits.length % 8) bits.push(0);
    const out = [];
    for (let i = 0; i < bits.length; i += 8) {
      let value = 0;
      for (let j = 0; j < 8; j++) value = (value << 1) | bits[i + j];
      out.push(value);
    }
    for (let pad = 0xec; out.length < DATA_CODEWORDS; pad ^= 0xec ^ 0x11) out.push(pad);
    return out;
  }

  function emptyMatrix() {
    return {
      modules: Array.from({ length: SIZE }, () => new Array(SIZE).fill(false)),
      reserved: Array.from({ length: SIZE }, () => new Array(SIZE).fill(false))
    };
  }

  function set(m, x, y, value, reserve = true) {
    if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) return;
    m.modules[y][x] = Boolean(value);
    if (reserve) m.reserved[y][x] = true;
  }

  function finder(m, x, y) {
    for (let dy = -1; dy <= 7; dy++) {
      for (let dx = -1; dx <= 7; dx++) {
        const xx = x + dx, yy = y + dy;
        const dark = dx >= 0 && dx <= 6 && dy >= 0 && dy <= 6 &&
          (dx === 0 || dx === 6 || dy === 0 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4));
        set(m, xx, yy, dark);
      }
    }
  }

  function alignment(m, cx, cy) {
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const d = Math.max(Math.abs(dx), Math.abs(dy));
        set(m, cx + dx, cy + dy, d !== 1);
      }
    }
  }

  function patterns(m) {
    finder(m, 0, 0);
    finder(m, SIZE - 7, 0);
    finder(m, 0, SIZE - 7);
    for (let i = 8; i < SIZE - 8; i++) {
      set(m, i, 6, i % 2 === 0);
      set(m, 6, i, i % 2 === 0);
    }
    alignment(m, 30, 30);
    set(m, 8, SIZE - 8, true);
  }

  function drawFormat(m, mask) {
    // ECC level L + mask, BCH encoded. Table entry for mask 0 is enough because this generator uses mask 0.
    const format = 0x77c4; // 111011111000100
    const coords = [
      [8,0],[8,1],[8,2],[8,3],[8,4],[8,5],[8,7],[8,8],[7,8],[5,8],[4,8],[3,8],[2,8],[1,8],[0,8],
      [SIZE-1,8],[SIZE-2,8],[SIZE-3,8],[SIZE-4,8],[SIZE-5,8],[SIZE-6,8],[SIZE-7,8],[8,SIZE-8],[8,SIZE-7],[8,SIZE-6],[8,SIZE-5],[8,SIZE-4],[8,SIZE-3],[8,SIZE-2],[8,SIZE-1]
    ];
    coords.forEach((c, i) => set(m, c[0], c[1], ((format >>> (14 - (i % 15))) & 1) !== 0));
  }

  function placeData(m, codewords) {
    const bits = [];
    codewords.concat(rsRemainder(codewords, ECC_CODEWORDS)).forEach((b) => bitsFromNumber(b, 8, bits));
    let i = 0;
    let upward = true;
    for (let right = SIZE - 1; right >= 1; right -= 2) {
      if (right === 6) right--;
      for (let vert = 0; vert < SIZE; vert++) {
        const y = upward ? SIZE - 1 - vert : vert;
        for (let dx = 0; dx < 2; dx++) {
          const x = right - dx;
          if (m.reserved[y][x]) continue;
          const mask = (x + y) % 2 === 0;
          set(m, x, y, Boolean(bits[i++] || 0) ^ mask, false);
        }
      }
      upward = !upward;
    }
  }

  function matrixFor(payload) {
    const m = emptyMatrix();
    patterns(m);
    drawFormat(m, 0);
    placeData(m, dataCodewords(payload));
    return m.modules;
  }

  function renderSvg(container, payload, options = {}) {
    if (!container) throw new Error("QR container is required.");
    const modules = matrixFor(payload);
    const quiet = options.quietZone ?? 4;
    const pixel = options.moduleSize ?? 8;
    const dim = (SIZE + quiet * 2) * pixel;
    const rects = [];
    modules.forEach((row, y) => row.forEach((dark, x) => {
      if (dark) rects.push(`<rect x="${(x + quiet) * pixel}" y="${(y + quiet) * pixel}" width="${pixel}" height="${pixel}"/>`);
    }));
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${dim} ${dim}" width="${options.size || 292}" height="${options.size || 292}" role="img" aria-label="NOVI Pass QR"><rect width="100%" height="100%" fill="#fff"/><g fill="#000">${rects.join("")}</g></svg>`;
    container.innerHTML = svg;
    container.dataset.qrPayload = payload;
    return svg;
  }

  window.NOVIXOT_QR = { renderSvg };
})();

// SHA-256 via Web Crypto for any ArrayBuffer
export async function sha256(buffer) {
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// dHash (difference hash) for images: returns 64-bit hex string
// Steps: draw image to 9x8 canvas grayscale, compare adjacent pixels row-wise.
export async function imageDHashFromFile(file) {
  const img = await fileToImage(file);
  const { canvas, ctx } = makeCanvas(9, 8);
  ctx.drawImage(img, 0, 0, 9, 8);
  // get grayscale data
  const data = ctx.getImageData(0, 0, 9, 8).data;
  const gray = [];
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i],
      g = data[i + 1],
      b = data[i + 2];
    gray.push(Math.round(0.299 * r + 0.587 * g + 0.114 * b));
  }
  // compare cols: (x,y) vs (x+1,y) for x in 0..7, y in 0..7 => 64 bits
  let bits = [];
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const left = gray[y * 9 + x];
      const right = gray[y * 9 + x + 1];
      bits.push(left < right ? 1 : 0);
    }
  }
  // bits -> hex
  let hex = "";
  for (let i = 0; i < 64; i += 4) {
    const nibble =
      (bits[i] << 3) | (bits[i + 1] << 2) | (bits[i + 2] << 1) | bits[i + 3];
    hex += nibble.toString(16);
  }
  return hex;
}

function fileToImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = reject;
    img.src = url;
  });
}

function makeCanvas(w, h) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  return { canvas, ctx };
}

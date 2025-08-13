// Re-encode image via canvas to strip EXIF/metadata. Returns a Blob (JPEG).
export async function scrubImageFile(file, quality = 0.92) {
  const url = URL.createObjectURL(file);
  const img = await loadImg(url);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  return await new Promise((res) =>
    canvas.toBlob(
      (b) => {
        URL.revokeObjectURL(url);
        res(b);
      },
      "image/jpeg",
      quality
    )
  );
}
function loadImg(src) {
  return new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = src;
  });
}

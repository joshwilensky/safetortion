let exifrLib = null;

async function loadExifr() {
  if (exifrLib) return exifrLib;
  await import(
    /* @vite-ignore */ "https://cdn.jsdelivr.net/npm/exifr/dist/full.umd.js"
  );
  // exifr attaches to window
  // eslint-disable-next-line no-undef
  exifrLib = window.exifr;
  return exifrLib;
}

export async function readGPS(blob) {
  const exifr = await loadExifr();
  try {
    const gps = await exifr.gps(blob);
    if (!gps) return null;
    const { latitude, longitude } = gps;
    if (typeof latitude === "number" && typeof longitude === "number") {
      return { lat: latitude, lon: longitude };
    }
    return null;
  } catch {
    return null;
  }
}

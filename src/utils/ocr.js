// On-device OCR using Tesseract.js. PDF text via PDF.js; if text layer is empty,
// we render pages to canvases and OCR them with Tesseract.
// Note: Loads third-party libs from CDN at runtime (no npm install needed).

let TESS = null;
let pdfjsLib = null;

async function loadTesseract() {
  if (TESS) return TESS;
  await import(
    /* @vite-ignore */ "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js"
  );
  // global Tesseract now available
  // eslint-disable-next-line no-undef
  TESS = Tesseract;
  return TESS;
}

async function loadPDFJS() {
  if (pdfjsLib) return pdfjsLib;
  const mod = await import(
    /* @vite-ignore */ "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.6.82/build/pdf.min.mjs"
  );
  pdfjsLib = mod;
  // Set worker
  const workerSrc =
    "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.6.82/build/pdf.worker.min.mjs";
  // @ts-ignore
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
  return pdfjsLib;
}

export async function ocrImageBlob(blob) {
  const T = await loadTesseract();
  const { data } = await T.recognize(blob, "eng", { logger: () => {} });
  return data.text || "";
}

export async function extractPdfTextOrOCR(blob, { ocrFallback = true } = {}) {
  const pdfjs = await loadPDFJS();
  const buf = await blob.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buf }).promise;

  let fullText = "";
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    // Try text layer first
    const textContent = await page.getTextContent();
    const strings =
      textContent.items?.map((it) => it.str).filter(Boolean) || [];
    fullText += strings.join(" ") + "\n";

    if (ocrFallback && strings.length < 10) {
      // Render page to canvas and OCR
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d");
      const renderTask = page.render({ canvasContext: ctx, viewport });
      await renderTask.promise;
      const pageBlob = await new Promise((res) =>
        canvas.toBlob(res, "image/png")
      );
      fullText += await ocrImageBlob(pageBlob);
    }
  }
  return fullText.trim();
}

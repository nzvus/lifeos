/**
 * features/account/assistant/extract.ts — turning attachments into text ON
 * THE PHONE (ADR-0018: text by default, the file never leaves the device):
 *
 *   photo        OCR (tesseract.js, Italian + English)
 *   PDF          its text layer (pdf.js); a page with no text — a scanned
 *                receipt — is rendered and read by OCR
 *   Excel .xlsx  every sheet as CSV (read-excel-file)
 *   JSON/TXT/CSV/MD  as they are
 *
 * Libraries load only when a file of that kind is attached. Browser only.
 */

/** Rough cap: the model reads text, not novels (and free plans count tokens). */
const MAX = 40000;

export async function ocrImage(source: Blob | HTMLCanvasElement): Promise<string> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker(["ita", "eng"]);
  try {
    const { data } = await worker.recognize(source);
    return data.text.trim();
  } finally {
    await worker.terminate();
  }
}

export async function readPdf(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();
  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const pages: string[] = [];
  for (let n = 1; n <= Math.min(doc.numPages, 20); n++) {
    const page = await doc.getPage(n);
    const content = await page.getTextContent();
    let text = content.items
      .map((i) => ("str" in i ? i.str + (i.hasEOL ? "\n" : " ") : ""))
      .join("")
      .trim();
    if (text.length < 20) {
      // A scanned page: draw it and read it.
      const viewport = page.getViewport({ scale: 2 });
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvas, viewport }).promise;
      text = await ocrImage(canvas);
    }
    pages.push(`--- page ${n} ---\n${text}`);
  }
  return pages.join("\n\n").slice(0, MAX);
}

/** Every sheet as CSV (";" separated, quotes where needed). */
export async function readSpreadsheet(file: File): Promise<string> {
  const { default: readXlsxFile } = await import("read-excel-file/browser");
  const sheets = await readXlsxFile(file);
  const cell = (v: unknown) => {
    const s =
      v instanceof Date
        ? v.toISOString().slice(0, 10)
        : v === null || v === undefined
          ? ""
          : String(v);
    return /[;"\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
  };
  return sheets
    .map(
      (s) => `## ${s.sheet}\n${s.data.map((row) => row.map(cell).join(";")).join("\n")}`,
    )
    .join("\n\n")
    .slice(0, MAX);
}

/** A photo shrunk to `max` px on its long side, as a JPEG data URL. */
export async function shrinkImage(file: File, max = 1280): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.8);
}

export const TEXT_FILE = /\.(json|txt|csv|md)$/i;
export const PDF_FILE = /\.pdf$/i;
export const SHEET_FILE = /\.xlsx$/i;

export async function readTextFile(file: File): Promise<string> {
  return (await file.text()).slice(0, MAX);
}

import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import worker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { PdfPage } from "./imports";
GlobalWorkerOptions.workerSrc = worker;
export async function extractPDF(file: File): Promise<PdfPage[]> {
  const document = await getDocument({
    data: new Uint8Array(await file.arrayBuffer()),
    isEvalSupported: false,
    disableFontFace: true,
  }).promise;
  const pages: PdfPage[] = [];
  try {
    for (let n = 1; n <= document.numPages; n++) {
      const page = await document.getPage(n);
      const viewport = page.getViewport({ scale: 1 });
      const text = await page.getTextContent();
      pages.push({
        width: viewport.width,
        height: viewport.height,
        words: text.items
          .filter(
            (i): i is import("pdfjs-dist/types/src/display/api").TextItem =>
              "str" in i,
          )
          .map((i) => ({
            text: i.str,
            x: i.transform[4],
            y: viewport.height - i.transform[5],
            width: i.width,
          })),
      });
    }
    return pages;
  } finally {
    await document.destroy();
  }
}

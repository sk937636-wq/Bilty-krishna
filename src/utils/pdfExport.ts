import html2canvas from 'html2canvas-pro';
import jsPDF from 'jspdf';

interface FontSpec {
  family: string;
  url: string;
  weight: string;
}

const BILTY_FONT_SPECS: FontSpec[] = [
  { family: 'Bookman Old Style', url: '/assets/fonts/BOOKOS.TTF', weight: '400' },
  { family: 'Bookman Old Style', url: '/assets/fonts/BOOKOSB.TTF', weight: '700' },
  { family: 'Calibri', url: '/assets/fonts/calibri.ttf', weight: '400' },
  { family: 'Calibri', url: '/assets/fonts/calibrib.ttf', weight: '700' },
  { family: 'Calibri', url: '/assets/fonts/calibrib.ttf', weight: '800' },
  { family: 'Calibri', url: '/assets/fonts/calibrib.ttf', weight: '900' },
];

const BILTY_FONT_LOAD_QUERIES = [
  '700 32pt "Bookman Old Style"',
  '400 32pt "Bookman Old Style"',
  '700 14pt "Calibri"',
  '400 14pt "Calibri"',
  '700 13.5pt "Calibri"',
  '700 13pt "Calibri"',
  '400 12pt "Calibri"',
  '400 11pt "Calibri"',
];

let fontBufferCachePromise: Promise<Map<string, ArrayBuffer>> | null = null;
const loadedFontDocs = new WeakSet<Document>();

function getBiltyFontBuffers(): Promise<Map<string, ArrayBuffer>> {
  if (!fontBufferCachePromise) {
    fontBufferCachePromise = (async () => {
      const uniqueUrls = Array.from(new Set(BILTY_FONT_SPECS.map((s) => s.url)));
      const map = new Map<string, ArrayBuffer>();
      await Promise.allSettled(
        uniqueUrls.map(async (url) => {
          const absUrl = new URL(url, window.location.origin).href;
          const res = await fetch(absUrl, { cache: 'force-cache' });
          if (res.ok) {
            const buf = await res.arrayBuffer();
            map.set(url, buf);
          }
        })
      );
      return map;
    })();
  }
  return fontBufferCachePromise;
}

async function ensureBiltyFontsLoaded(
  targetDoc: Document,
  buffers: Map<string, ArrayBuffer>
): Promise<void> {
  if (!targetDoc || !('fonts' in targetDoc)) return;
  const targetWin = targetDoc.defaultView || window;
  const FontFaceCtor = (targetWin as unknown as { FontFace?: typeof FontFace }).FontFace || window.FontFace;

  if (FontFaceCtor && buffers.size > 0 && !loadedFontDocs.has(targetDoc)) {
    loadedFontDocs.add(targetDoc);
    const loadTasks: Promise<unknown>[] = [];
    for (const spec of BILTY_FONT_SPECS) {
      const rawBuf = buffers.get(spec.url);
      if (!rawBuf) continue;
      try {
        const face = new FontFaceCtor(spec.family, rawBuf.slice(0), {
          weight: spec.weight,
          style: 'normal',
          display: 'block',
        });
        targetDoc.fonts.add(face);
        loadTasks.push(face.load());
      } catch {
        // Fallback to stylesheet @font-face below
      }
    }
    await Promise.allSettled(loadTasks);
  }

  await Promise.allSettled(
    BILTY_FONT_LOAD_QUERIES.map((q) => targetDoc.fonts.load(q, 'KRISHNA TRANSPORT COMPANY 0123456789'))
  );
  await targetDoc.fonts.ready;
}

/**
 * Builds the exact A4 Landscape jsPDF instance matching "1 - LR - R.xlsx":
 * - Paper Size: A4 Landscape (297mm × 210mm)
 * - Print Scale: 96%
 * - Top Margin: 11.68 mm (0.46")
 * - Left Margin: 23.50 mm
 * - Printed Table Width: 254.22 mm (744.5pt * 0.968)
 * - Printed Table Height: 184.65 mm (540.75pt * 0.968)
 */
async function buildBiltyPdf(
  elementId: string,
  options?: { orientation?: 'portrait' | 'landscape' }
): Promise<jsPDF | null> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error('Element to export not found:', elementId);
    return null;
  }

  const fontBuffers = await getBiltyFontBuffers();
  if (typeof document !== 'undefined') {
    await ensureBiltyFontsLoaded(document, fontBuffers);
  }

  const targetWidth = 993;
  const targetHeight = Math.max(900, element.scrollHeight + 120);
  const origin = window.location.origin;

  const canvas = await html2canvas(element, {
    scale: 4,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: targetWidth,
    windowHeight: targetHeight,
    scrollX: 0,
    scrollY: 0,
    onclone: (async (clonedDoc: Document) => {
      // 1. Prevent Android Chrome Text Autosizing (Font Boosting) & provide absolute @font-face URLs
      const styleEl = clonedDoc.createElement('style');
      styleEl.textContent = `
        @font-face {
          font-family: 'Bookman Old Style';
          src: url('${origin}/assets/fonts/BOOKOS.TTF') format('truetype');
          font-weight: 400;
          font-style: normal;
          font-display: block;
        }
        @font-face {
          font-family: 'Bookman Old Style';
          src: url('${origin}/assets/fonts/BOOKOSB.TTF') format('truetype');
          font-weight: 700;
          font-style: normal;
          font-display: block;
        }
        @font-face {
          font-family: 'Calibri';
          src: url('${origin}/assets/fonts/calibri.ttf') format('truetype');
          font-weight: 400;
          font-style: normal;
          font-display: block;
        }
        @font-face {
          font-family: 'Calibri';
          src: url('${origin}/assets/fonts/calibrib.ttf') format('truetype');
          font-weight: 700;
          font-style: normal;
          font-display: block;
        }
        html, body, #${elementId}, #${elementId} * {
          -webkit-text-size-adjust: none !important;
          text-size-adjust: none !important;
          font-synthesis: none;
        }
      `;
      (clonedDoc.head || clonedDoc.documentElement).appendChild(styleEl);

      // 2. Make cloned document element and ancestors visible BEFORE awaiting font layout
      const clonedEl = clonedDoc.getElementById(elementId);
      if (clonedEl) {
        clonedEl.style.opacity = '1';
        clonedEl.style.visibility = 'visible';
        clonedEl.style.padding = '0';
        clonedEl.style.margin = '0';
        clonedEl.style.border = 'none';
        clonedEl.style.boxShadow = 'none';
        clonedEl.style.borderRadius = '0';
        clonedEl.style.width = `${targetWidth}px`;
        clonedEl.style.minWidth = `${targetWidth}px`;
        clonedEl.style.setProperty('-webkit-text-size-adjust', 'none', 'important');
        clonedEl.style.setProperty('text-size-adjust', 'none', 'important');

        let parent = clonedEl.parentElement;
        while (parent && parent !== clonedDoc.body) {
          parent.style.opacity = '1';
          parent.style.visibility = 'visible';
          parent = parent.parentElement;
        }
      }

      // 3. Load exact TTF ArrayBuffers directly into the cloned iframe's FontFaceSet
      //    so Range.getClientRects() in clonedDoc matches parent Canvas fillText() 1:1 on Android/mobile
      await ensureBiltyFontsLoaded(clonedDoc, fontBuffers);

      // 4. Ensure logo images inside cloned element are decoded
      if (clonedEl) {
        const imgs = Array.from(clonedEl.querySelectorAll('img'));
        await Promise.allSettled(
          imgs.map((img) => (typeof img.decode === 'function' ? img.decode() : Promise.resolve()))
        );
        // Force synchronous reflow with the loaded fonts before html2canvas reads Range bounds
        void clonedEl.offsetWidth;
        void clonedEl.offsetHeight;
      }

      const clonedWin = clonedDoc.defaultView || window;
      await new Promise<void>((resolve) =>
        clonedWin.requestAnimationFrame(() => clonedWin.requestAnimationFrame(() => resolve()))
      );
    }) as unknown as (doc: Document, el: HTMLElement) => void,
  });

  const imgData = canvas.toDataURL('image/png');

  const orientation = options?.orientation || 'landscape';
  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const marginLeft = 23.50;
  const marginTop = 11.68;

  const imgWidth = canvas.width;
  const imgHeight = canvas.height;

  const printWidth = 254.22;
  const printHeight = (imgHeight / imgWidth) * printWidth;

  pdf.addImage(imgData, 'PNG', marginLeft, marginTop, printWidth, printHeight, undefined, 'FAST');
  return pdf;
}

export async function exportBiltyToPdf(
  elementId: string,
  fileName: string,
  options?: { orientation?: 'portrait' | 'landscape' }
): Promise<boolean> {
  try {
    const pdf = await buildBiltyPdf(elementId, options);
    if (!pdf) return false;
    pdf.save(`${fileName.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`);
    return true;
  } catch (error) {
    console.error('PDF generation error:', error);
    window.print();
    return false;
  }
}

export async function generateBiltyPdfFile(
  elementId: string,
  fileName: string
): Promise<File | null> {
  try {
    const pdf = await buildBiltyPdf(elementId, { orientation: 'landscape' });
    if (!pdf) return null;
    const rawBlob = pdf.output('blob');
    const pdfBlob = new Blob([rawBlob], { type: 'application/pdf' });
    const stripped = fileName.replace(/\.pdf$/i, '');
    const cleanBase = stripped.replace(/[^a-zA-Z0-9 _-]/g, '').trim() || 'Bilty';
    const cleanFileName = `${cleanBase}.pdf`;
    return new File([pdfBlob], cleanFileName, {
      type: 'application/pdf',
      lastModified: Date.now(),
    });
  } catch (error) {
    console.error('Error generating PDF file for sharing:', error);
    return null;
  }
}

export function triggerPrint(): void {
  window.print();
}

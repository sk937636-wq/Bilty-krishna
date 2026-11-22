import html2canvas from 'html2canvas-pro';
import jsPDF from 'jspdf';

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

  if (typeof document !== 'undefined' && 'fonts' in document) {
    await Promise.allSettled([
      document.fonts.load("700 32pt 'Bookman Old Style'"),
      document.fonts.load("400 32pt 'Bookman Old Style'"),
      document.fonts.load("700 14pt 'Calibri'"),
      document.fonts.load("400 14pt 'Calibri'"),
      document.fonts.load("700 13pt 'Calibri'"),
      document.fonts.load("400 12pt 'Calibri'"),
      document.fonts.load("400 11pt 'Calibri'"),
    ]);
    await document.fonts.ready;
    await new Promise((r) => setTimeout(r, 150));
  }

  const targetWidth = 993;
  const canvas = await html2canvas(element, {
    scale: 4,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: targetWidth,
    scrollX: 0,
    scrollY: 0,
    onclone: (clonedDoc) => {
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

        let parent = clonedEl.parentElement;
        while (parent && parent !== clonedDoc.body) {
          parent.style.opacity = '1';
          parent.style.visibility = 'visible';
          parent = parent.parentElement;
        }
      }
    },
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
    const blob = pdf.output('blob');
    const cleanFileName = `${fileName.replace(/[^a-zA-Z0-9 _-]/g, '').trim() || 'Bilty'}.pdf`;
    return new File([blob], cleanFileName, { type: 'application/pdf' });
  } catch (error) {
    console.error('Error generating PDF file for sharing:', error);
    return null;
  }
}

export function triggerPrint(): void {
  window.print();
}

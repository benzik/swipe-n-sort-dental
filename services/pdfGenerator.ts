import { ServiceItem } from '../types';

declare global {
  interface Window {
    jspdf: any;
  }
}

// Cache for the loaded font to avoid re-fetching
let fontData: string | null = null;

const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};


const loadFont = async () => {
  if (fontData) {
    return fontData;
  }
  try {
    const response = await fetch('Roboto/Roboto-VariableFont_wdth,wght.ttf');
    if (!response.ok) {
      throw new Error(`Failed to fetch font: ${response.statusText}`);
    }
    const fontBuffer = await response.arrayBuffer();
    fontData = arrayBufferToBase64(fontBuffer);
    return fontData;
  } catch (error) {
    console.error("Font download failed:", error);
    throw new Error(`Failed to fetch font: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const exportToPdf = async (items: ServiceItem[]) => {
  const { jsPDF } = window.jspdf;
  if (!jsPDF) {
    console.error("jsPDF not loaded");
    throw new Error("jsPDF library is not available.");
  }
  
  const doc = new jsPDF();
  const docAsAny = doc as any;

  try {
    const base64Font = await loadFont();
    doc.addFileToVFS('Roboto-Regular.ttf', base64Font);
    doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
    doc.setFont('Roboto');
  } catch (e) {
      console.error("Font loading failed:", e);
      throw new Error(`Failed to load font: ${e instanceof Error ? e.message : String(e)}`);
  }

  doc.setFontSize(18);
  doc.text('Выбранные стоматологические услуги', 14, 22);

  const tableData = items.map(item => [item.code, item.name]);

  docAsAny.autoTable({
    startY: 30,
    head: [['Код', 'Наименование услуги']],
    body: tableData,
    headStyles: {
      fillColor: [37, 99, 235], // bg-blue-600
      textColor: 255,
      fontStyle: 'bold',
      font: 'Roboto',
    },
    styles: {
      font: 'Roboto',
      cellPadding: 3,
    },
    alternateRowStyles: {
      fillColor: [243, 244, 246] // bg-gray-100
    },
    didDrawPage: (data: any) => {
        // Footer - Part 1: Add current page number
        doc.setFontSize(10);
        doc.text('Страница ' + String(data.pageNumber), data.settings.margin.left, doc.internal.pageSize.height - 10);
    }
  });
  
  // Footer - Part 2: Add total page count
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    const pageNumberText = 'Страница ' + i;
    const pageNumberTextWidth = doc.getTextWidth(pageNumberText);
    const totalPagesText = ' из ' + pageCount;
    // Get the left margin from the last autoTable settings
    const marginLeft = docAsAny.autoTable.previous.settings.margin.left;
    doc.text(totalPagesText, marginLeft + pageNumberTextWidth, doc.internal.pageSize.height - 10);
  }


  doc.save('dental_services_list.pdf');
};
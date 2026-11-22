import JSZip from 'jszip';
import { BiltyRecord, CompanyProfile } from '../types';
import { DEFAULT_COMPANY_PROFILE } from './storage';

function formatDateDdMmYyyy(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    if (dateStr.includes('-')) {
      const parts = dateStr.split('-');
      if (parts[0].length === 4) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Exports a BiltyRecord into an exact .xlsx file using the uploaded
 * "1 - LR - R.xlsx" template (/assets/lr_template.xlsx), preserving 100% of
 * original fonts (Bookman Old Style 32pt, Calibri 14pt), borders, merged cells,
 * column widths, row heights, print settings, and embedded KRL logo image.
 */
export async function exportBiltyToExcelLr(
  bilty: BiltyRecord,
  propCompany?: CompanyProfile
): Promise<boolean> {
  const company = propCompany || DEFAULT_COMPANY_PROFILE;

  try {
    const response = await fetch('/assets/lr_template.xlsx');
    if (!response.ok) {
      throw new Error(`Failed to load LR template: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);

    const sheetXmlFile = zip.file('xl/worksheets/sheet1.xml');
    if (!sheetXmlFile) {
      throw new Error('sheet1.xml not found in template');
    }

    let sheetXml = await sheetXmlFile.async('string');

    const formattedDate = formatDateDdMmYyyy(bilty.date);
    const formattedInDate = formatDateDdMmYyyy(bilty.inDate || bilty.date);

    // Split goods description across up to 5 rows (A15..A19)
    const rawGoodsLines = (bilty.goodsDescription || '').split(/\r?\n/);
    const goodsLines = [
      rawGoodsLines[0] || '',
      rawGoodsLines[1] || '',
      rawGoodsLines[2] || '',
      rawGoodsLines[3] || '',
      rawGoodsLines.slice(4).join(' ') || '',
    ];

    // Build shared strings table (plain text or rich text XML inside <si>...</si>)
    const siEntries: string[] = [];
    const addPlainString = (text: string): number => {
      const escaped = escapeXml(text);
      const preserve =
        text.startsWith(' ') || text.endsWith(' ') || text.includes('  ')
          ? ' xml:space="preserve"'
          : '';
      const idx = siEntries.length;
      siEntries.push(`<si><t${preserve}>${escaped}</t></si>`);
      return idx;
    };

    const addCheckedLabelString = (label: string, isChecked: boolean): number => {
      const idx = siEntries.length;
      if (isChecked) {
        siEntries.push(
          `<si><r><t xml:space="preserve">${escapeXml(label)}  </t></r><r><rPr><b/><sz val="14"/><color theme="1"/><rFont val="Wingdings"/><charset val="2"/></rPr><t>ü</t></r></si>`
        );
      } else {
        siEntries.push(`<si><t xml:space="preserve">${escapeXml(label)}        </t></si>`);
      }
      return idx;
    };

    const isToPay = bilty.paymentMode === 'TO_PAY';
    const isToBeBilled =
      bilty.paymentMode === 'TO_BE_BILLED' || bilty.paymentMode === 'PAID';
    const bottomPaymentLabel =
      bilty.paymentMode === 'PAID' ? 'FRIEGHT PAID' : 'FRIEGHT TO BE BILD';

    const gstRate = bilty.gstRate || 18;
    const halfGstRate = gstRate / 2;

    // Map of cell coordinate -> { type: 's' | 'n', value: string | number }
    const cellUpdates: Record<string, { type: 's' | 'n'; val: number | string }> = {
      // Row 1: Top Header Bar
      A1: {
        type: 's',
        val: addPlainString(`GST IN.${company.gstin || '09DZWPS1204Q1ZE'}                 `),
      },
      C1: {
        type: 's',
        val: addPlainString(
          `  ${company.jurisdiction || 'SUBJECT TO GUATAM BUDH NAGAR JURISDICTION ONLY'}  `
        ),
      },
      D1: {
        type: 's',
        val: addPlainString(`MOB NO: ${company.phone || '9540003838'}`),
      },

      // Rows 2-6: Company Header Block
      A2: {
        type: 's',
        val: addPlainString(`     ${company.companyName || 'KRISHNA ROADLINES'}`),
      },
      A3: {
        type: 's',
        val: addPlainString(
          `                     ${company.tagline || "FLEET ONWER & TRANSPORT CONTRACTOR'S"}`
        ),
      },
      A4: {
        type: 's',
        val: addPlainString(
          `                    ${
            company.routes ||
            'DAILY SERVICE : DELHI, UP, HARYANA, RAJASTHAN, GUJRAT AND ALL OVER INDIA'
          }`
        ),
      },
      A5: {
        type: 's',
        val: addPlainString(
          `                     ${
            company.address ||
            'J-152 A, SECTOR-9, VIJAY NAGAR, GHAZIABAD, UTTAR PRADESH'
          }`
        ),
      },
      A6: {
        type: 's',
        val: addPlainString(
          `               ${company.email || 'KRISHNAROADLINES38@GMAIL.COM'}  `
        ),
      },

      // Rows 7-9: Date, From, To | Bank | Vehicle Size, Vehicle No, LR No
      A7: { type: 's', val: addPlainString('DATE ') },
      B7: { type: 's', val: addPlainString(formattedDate) },
      C7: {
        type: 's',
        val: addPlainString(company.bankName || 'IDBI BANK LTD - SEC 63 NOIDA'),
      },
      D7: { type: 's', val: addPlainString('VEHICLE SIZE') },
      F7: { type: 's', val: addPlainString(bilty.vehicleSize || '22 FEET') },

      A8: { type: 's', val: addPlainString('FROM') },
      B8: { type: 's', val: addPlainString(bilty.fromCity || '') },
      C8: {
        type: 's',
        val: addPlainString(`A/C.NO. ${company.bankAccountNo || '0200102000032203'} `),
      },
      D8: { type: 's', val: addPlainString('VEHICLE NO ') },
      F8: { type: 's', val: addPlainString('LR NO') },

      A9: { type: 's', val: addPlainString('TO') },
      B9: { type: 's', val: addPlainString(bilty.toCity || '') },
      C9: {
        type: 's',
        val: addPlainString(`IFSC. CODE. ${company.bankIfsc || 'IBKL0000200'}`),
      },
      D9: { type: 's', val: addPlainString(bilty.vehicleNo || '') },
      F9: /^\d+$/.test(String(bilty.lrNo || '').trim())
        ? { type: 'n', val: Number(String(bilty.lrNo).trim()) }
        : { type: 's', val: addPlainString(String(bilty.lrNo || '')) },

      // Rows 10-13: Consignor & Consignee
      A10: { type: 's', val: addPlainString('CONSIGNOR') },
      B10: { type: 's', val: addPlainString(bilty.consignorName || '') },
      D10: { type: 's', val: addPlainString('GST IN') },
      E10: { type: 's', val: addPlainString(bilty.consignorGst || '') },

      A11: { type: 's', val: addPlainString('ADDRESS') },
      B11: { type: 's', val: addPlainString(bilty.consignorAddress || '') },

      A12: { type: 's', val: addPlainString('CONSINEE') },
      B12: { type: 's', val: addPlainString(bilty.consigneeName || '') },
      D12: { type: 's', val: addPlainString('GST IN') },
      E12: { type: 's', val: addPlainString(bilty.consigneeGst || '') },

      A13: { type: 's', val: addPlainString('ADDRESS') },
      B13: { type: 's', val: addPlainString(bilty.consigneeAddress || '') },

      // Rows 14-19: Goods, Disclaimers, Freight & GST
      A14: { type: 's', val: addPlainString('WHAT IS THE GOODS') },
      D14: { type: 's', val: addPlainString('FRIEGHT') },
      ...(bilty.freight ? { F14: { type: 'n', val: bilty.freight } } : {}),

      ...(goodsLines[0].trim()
        ? { A15: { type: 's', val: addPlainString(goodsLines[0].trim()) } }
        : {}),
      C15: {
        type: 's',
        val: addPlainString('PARTY SEND ITS OWN MATERIAL INSURANCE, IT IS'),
      },
      ...(bilty.otherCharges
        ? {
            D15: {
              type: 's',
              val: addPlainString(bilty.otherChargesLabel || 'CHARGES'),
            },
            F15: { type: 'n', val: bilty.otherCharges },
          }
        : {}),

      ...(goodsLines[1].trim()
        ? { A16: { type: 's', val: addPlainString(goodsLines[1].trim()) } }
        : {}),
      C16: {
        type: 's',
        val: addPlainString('NOT THE RESPONSIBILITY OF THE TRANSPORTER'),
      },

      ...(goodsLines[2].trim()
        ? { A17: { type: 's', val: addPlainString(goodsLines[2].trim()) } }
        : {}),
      D17: { type: 's', val: addPlainString('TOTAL') },
      ...(bilty.total ? { F17: { type: 'n', val: bilty.total } } : {}),

      ...(goodsLines[3].trim()
        ? { A18: { type: 's', val: addPlainString(goodsLines[3].trim()) } }
        : {}),
      C18: { type: 's', val: addPlainString('FOR TRANSPORTER NOT RESPONSIBLE') },
      D18: { type: 's', val: addPlainString(`S.GST    ${halfGstRate} %`) },
      ...(bilty.sgstAmount ? { F18: { type: 'n', val: bilty.sgstAmount } } : {}),

      ...(goodsLines[4].trim()
        ? { A19: { type: 's', val: addPlainString(goodsLines[4].trim()) } }
        : {}),
      C19: { type: 's', val: addPlainString('FOR LEAKAGE BREAKAGE AND DAMAGE') },
      D19: { type: 's', val: addPlainString(`C.GST    ${halfGstRate} %`) },
      ...(bilty.cgstAmount ? { F19: { type: 'n', val: bilty.cgstAmount } } : {}),

      // Rows 20-25: Metrics, Disclaimers, In-Date, Totals & Payment Mode
      A20: { type: 's', val: addPlainString('QUANTITY') },
      B20: { type: 's', val: addPlainString(bilty.quantity || '') },
      D20: { type: 's', val: addPlainString(`I .GST  ${gstRate} %`) },
      ...(bilty.igstAmount ? { F20: { type: 'n', val: bilty.igstAmount } } : {}),

      A21: { type: 's', val: addPlainString('SEAL NUMBER') },
      B21: { type: 's', val: addPlainString(bilty.sealNumber || '') },
      C21: { type: 's', val: addPlainString('PLEASE CHECK THE ATTACHED') },
      D21: { type: 's', val: addPlainString('G.TOTAL ') },
      ...(bilty.grandTotal ? { F21: { type: 'n', val: bilty.grandTotal } } : {}),

      A22: { type: 's', val: addPlainString('NET WEIGHT') },
      B22: { type: 's', val: addPlainString(bilty.netWeight || '') },
      C22: { type: 's', val: addPlainString('INVOICE FOR MORE INFORMATION') },
      D22: { type: 's', val: addPlainString('ADVANCE') },
      ...(bilty.advance ? { F22: { type: 'n', val: bilty.advance } } : {}),

      A23: { type: 's', val: addPlainString('INVOICE NO') },
      B23: { type: 's', val: addPlainString(bilty.invoiceNo || '') },
      D23: { type: 's', val: addPlainString('BALANCE') },
      ...(bilty.balance ? { F23: { type: 'n', val: bilty.balance } } : {}),

      A24: { type: 's', val: addPlainString('INVOICE VALUE') },
      B24: { type: 's', val: addPlainString(String(bilty.invoiceValue || '')) },
      C24: { type: 's', val: addPlainString(`IN-DATE  ${formattedInDate}`) },
      D24: { type: 's', val: addCheckedLabelString('FRIEGHT TO PAY', isToPay) },

      A25: { type: 's', val: addPlainString('E-WAY BILL NO') },
      B25: { type: 's', val: addPlainString(bilty.eWayBillNo || '') },
      D25: { type: 's', val: addCheckedLabelString(bottomPaymentLabel, isToBeBilled) },

      // Row 26: Signatory
      C26: {
        type: 's',
        val: addPlainString(
          company.signText || `FOR ${company.companyName || 'KRISHNA ROADLINES'}`
        ),
      },
    };

    // First clear any existing <v>...</v> on cells in sheet1.xml so no stale sharedString index remains,
    // then populate all cells in cellUpdates while preserving every cell's exact s="..." style attribute.
    sheetXml = sheetXml.replace(
      /<c\s+r="([A-Z]+\d+)"([^>]*?)(?:\/>|>[\s\S]*?<\/c>)/g,
      (_match, cellRef: string, attrs: string) => {
        const styleMatch = attrs.match(/\bs="(\d+)"/);
        const styleAttr = styleMatch ? ` s="${styleMatch[1]}"` : '';
        const update = cellUpdates[cellRef];
        if (!update) {
          return `<c r="${cellRef}"${styleAttr}/>`;
        }
        if (update.type === 'n') {
          return `<c r="${cellRef}"${styleAttr}><v>${update.val}</v></c>`;
        }
        return `<c r="${cellRef}"${styleAttr} t="s"><v>${update.val}</v></c>`;
      }
    );

    const newSharedStringsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="${siEntries.length}" uniqueCount="${siEntries.length}">${siEntries.join('')}</sst>`;

    zip.file('xl/worksheets/sheet1.xml', sheetXml);
    zip.file('xl/sharedStrings.xml', newSharedStringsXml);

    const outBlob = await zip.generateAsync({
      type: 'blob',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const cleanLr = String(bilty.lrNo || 'LR').replace(/[^a-zA-Z0-9_-]/g, '_');
    const cleanVeh = String(bilty.vehicleNo || '').replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = cleanVeh
      ? `${cleanLr} - LR - ${cleanVeh}.xlsx`
      : `${cleanLr} - LR.xlsx`;

    const url = URL.createObjectURL(outBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 2000);

    return true;
  } catch (error) {
    console.error('Failed to export Excel LR:', error);
    return false;
  }
}

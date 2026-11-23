import React from 'react';
import { BiltyRecord, CompanyProfile } from '../types';
import { DEFAULT_COMPANY_PROFILE } from '../utils/storage';

interface BiltyPreviewProps {
  bilty: BiltyRecord;
  company?: CompanyProfile;
  copyType?: string;
  isPrintMode?: boolean;
  isEditable?: boolean;
  onUpdateField?: (field: keyof BiltyRecord, value: any) => void;
  elementId?: string;
}

const NAVY = '#1F3864';
const KTC_BROWN = '#833C0C';
const BLACK = '#000000';
const BORDER = '1px solid #000000';

export const BiltyPreview: React.FC<BiltyPreviewProps> = ({
  bilty,
  company: propCompany,
  isPrintMode = false,
  isEditable = false,
  onUpdateField,
  elementId,
}) => {
  const company = propCompany || DEFAULT_COMPANY_PROFILE;
  const isKtc =
    bilty.companyId === 'KTC' ||
    company.logoMonogram === 'KTC' ||
    company.companyName?.includes('TRANSPORT COMPANY');
  const THEME_COLOR = isKtc ? KTC_BROWN : NAVY;

  // Format date as DD-MM-YYYY just like "30-10-2026" in 1 - LR - R.xlsx
  const formatDate = (dateStr?: string) => {
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
  };

  const formattedDate = formatDate(bilty.date);
  const formattedInDate = formatDate(bilty.inDate || bilty.date);

  // Split goodsDescription across the 5 merged rows A15:B15 .. A19:B19
  // If a single line is longer than 30 chars and has no manual newlines, wrap words cleanly across rows
  const computeGoodsLines = (desc?: string): string[] => {
    const raw = (desc || '').split(/\r?\n/);
    if (raw.length === 1 && raw[0].length > 28 && !isEditable) {
      const words = raw[0].split(/\s+/);
      const wrapped: string[] = [];
      let current = '';
      for (const word of words) {
        if ((current + (current ? ' ' : '') + word).length <= 28) {
          current = current ? `${current} ${word}` : word;
        } else {
          if (current) wrapped.push(current);
          current = word;
        }
      }
      if (current) wrapped.push(current);
      return [
        wrapped[0] || '',
        wrapped[1] || '',
        wrapped[2] || '',
        wrapped[3] || '',
        wrapped.slice(4).join(' ') || '',
      ];
    }
    return [
      raw[0] || '',
      raw[1] || '',
      raw[2] || '',
      raw[3] || '',
      raw.slice(4).join(' ') || '',
    ];
  };

  const goodsRowValues = computeGoodsLines(bilty.goodsDescription);

  const updateGoodsLine = (lineIndex: number, newLineVal: string) => {
    if (!onUpdateField) return;
    const nextLines = [...goodsRowValues];
    nextLines[lineIndex] = newLineVal.toUpperCase();
    // Trim trailing empty lines while keeping internal lines intact
    while (nextLines.length > 0 && !nextLines[nextLines.length - 1].trim()) {
      nextLines.pop();
    }
    onUpdateField('goodsDescription', nextLines.join('\n'));
  };

  const renderField = (
    field: keyof BiltyRecord,
    val: string | number | undefined | null,
    opts?: {
      placeholder?: string;
      className?: string;
      uppercase?: boolean;
      type?: string;
      align?: 'left' | 'center' | 'right';
      bold?: boolean;
    }
  ) => {
    const {
      uppercase = true,
      type = 'text',
      className = '',
      placeholder = '',
      align = 'left',
      bold = false,
    } = opts || {};

    if (!isEditable || !onUpdateField) {
      if (val !== undefined && val !== null && String(val).trim() !== '') {
        return (
          <span
            style={{
              color: BLACK,
              fontWeight: bold ? 700 : 400,
              textAlign: align,
              display: 'block',
              width: '100%',
              fontFamily: "Calibri, 'Segoe UI', Arial, sans-serif",
              fontSize: '14pt',
              lineHeight: '1',
            }}
            className={className}
          >
            {String(val)}
          </span>
        );
      }
      return <span className="inline-block min-w-[4px]">&nbsp;</span>;
    }

    return (
      <input
        type={type}
        value={val !== undefined && val !== null ? String(val) : ''}
        placeholder={placeholder}
        onChange={(e) => {
          let v: any = e.target.value;
          if (type === 'number') {
            v = parseFloat(v) || 0;
          } else if (uppercase && typeof v === 'string') {
            v = v.toUpperCase();
          }
          onUpdateField(field, v);
        }}
        style={{
          color: BLACK,
          fontWeight: bold ? 700 : 400,
          textAlign: align,
          fontFamily: "Calibri, 'Segoe UI', Arial, sans-serif",
          fontSize: '14pt',
          lineHeight: '1',
        }}
        className={`w-full bg-transparent border-0 p-0 m-0 outline-none focus:bg-blue-50/60 hover:bg-slate-50/60 transition-colors ${className}`}
      />
    );
  };

  const renderGoodsLineField = (lineIdx: number) => {
    const val = goodsRowValues[lineIdx] || '';
    if (!isEditable || !onUpdateField) {
      if (val.trim() !== '') {
        return (
          <span
            style={{
              color: BLACK,
              fontWeight: 400,
              textAlign: 'left',
              display: 'block',
              width: '100%',
              fontFamily: "Calibri, 'Segoe UI', Arial, sans-serif",
              fontSize: '14pt',
              lineHeight: '1',
            }}
          >
            {val}
          </span>
        );
      }
      return <span className="inline-block min-w-[4px]">&nbsp;</span>;
    }

    return (
      <input
        type="text"
        value={val}
        placeholder={lineIdx === 0 ? 'ENTER GOODS DESCRIPTION...' : ''}
        onChange={(e) => updateGoodsLine(lineIdx, e.target.value)}
        style={{
          color: BLACK,
          fontWeight: 400,
          textAlign: 'left',
          fontFamily: "Calibri, 'Segoe UI', Arial, sans-serif",
          fontSize: '14pt',
          lineHeight: '1',
        }}
        className="w-full bg-transparent border-0 p-0 m-0 outline-none focus:bg-blue-50/60 hover:bg-slate-50/60 transition-colors"
      />
    );
  };

  const containerId =
    elementId || (isPrintMode ? 'bilty-export-clean-document' : 'bilty-print-document');

  const gstRate = bilty.gstRate || 18;
  const halfGstRate = gstRate / 2;

  const bottomPaymentLabel =
    bilty.paymentMode === 'PAID' ? 'FRIEGHT PAID' : 'FRIEGHT TO BE BILD';

  // Standard 19.2pt row cell style matching "1 - LR - R.xlsx"
  const cellBaseStyle: React.CSSProperties = {
    padding: '0px 3pt 1.5pt 3pt',
    height: '19.2pt',
    lineHeight: '1.05',
    verticalAlign: 'bottom',
    fontSize: '14pt',
    fontFamily: "Calibri, 'Segoe UI', Arial, sans-serif",
    boxSizing: 'border-box',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
  };

  return (
    <div
      id={containerId}
      className={`bg-white text-black select-none mx-auto ${
        isPrintMode
          ? 'p-0 border-0 shadow-none'
          : 'border border-slate-300 shadow-md rounded-xs p-3 sm:p-5'
      }`}
      style={{
        boxSizing: 'border-box',
        width: '993px',
        minWidth: '993px',
        backgroundColor: '#ffffff',
        color: BLACK,
        fontFamily: "Calibri, 'Segoe UI', Arial, sans-serif",
        fontWeight: 400,
        WebkitTextStroke: '0px',
        WebkitTextSizeAdjust: 'none',
        textSizeAdjust: 'none',
      }}
    >
      {/* Exact 26-Row x 6-Column Table matching "1 - LR - R.xlsx" */}
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          tableLayout: 'fixed',
          backgroundColor: '#ffffff',
        }}
      >
        {/*2. GRID DIMENSIONS (26 Rows × 6 Columns: A to F):
           - Column A: 17.44140625 (13.1035%)
           - Column B: 26.00000000 (19.5334%)
           - Column C: 57.00000000 (42.8232%)
           - Column D: 9.33203125  (7.0110%)
           - Column E: 7.77734375  (5.8430%)
           - Column F: 15.55468750 (11.6860%)
        */}
        <colgroup>
          <col style={{ width: isKtc ? '12.9315%' : '13.1035%' }} />
          <col style={{ width: isKtc ? '19.5233%' : '19.5334%' }} />
          <col style={{ width: isKtc ? '43.2489%' : '42.8232%' }} />
          <col style={{ width: isKtc ? '6.4238%' : '7.0110%' }} />
          <col style={{ width: isKtc ? '7.1652%' : '5.8430%' }} />
          <col style={{ width: isKtc ? '10.7073%' : '11.6860%' }} />
        </colgroup>

        <tbody>
          {/* ROW 1 (19.2pt) */}
          <tr style={{ height: '19.2pt' }}>
            <td
              colSpan={2}
              style={{
                ...cellBaseStyle,
                borderTop: BORDER,
                borderLeft: BORDER,
                color: THEME_COLOR,
                fontWeight: 700,
                fontSize: '14pt',
                textAlign: 'left',
              }}
            >
              GST IN.{company.gstin || '09DZWPS1204Q1ZE'}
            </td>
            <td
              style={{
                ...cellBaseStyle,
                borderTop: BORDER,
                color: THEME_COLOR,
                fontWeight: 700,
                fontSize: '13pt',
                textAlign: 'center',
                padding: '0px 1px 1.5pt 1px',
                overflow: 'visible',
              }}
            >
              {company.jurisdiction || 'SUBJECT TO GUATAM BUDH NAGAR JURISDICTION ONLY'}
            </td>
            <td
              colSpan={3}
              style={{
                ...cellBaseStyle,
                borderTop: BORDER,
                borderRight: BORDER,
                color: THEME_COLOR,
                fontWeight: 700,
                fontSize: '14pt',
                textAlign: 'right',
              }}
            >
              MOB NO: {company.phone || '9540003838'}
            </td>
          </tr>

          {/* ROW 2 (30pt) */}
          <tr style={{ height: '30pt' }}>
            <td
              colSpan={6}
              style={{
                ...cellBaseStyle,
                height: '30pt',
                borderLeft: BORDER,
                borderRight: BORDER,
                position: 'relative',
                textAlign: 'center',
                verticalAlign: 'middle',
                padding: '0 5px',
                overflow: 'visible',
              }}
            >
              <img
                src={isKtc ? '/assets/ktc-logo.png' : '/assets/excel_logo.png'}
                alt={isKtc ? 'KTC Logo' : 'KRL Logo'}
                style={{
                  position: 'absolute',
                  left: isKtc ? '38pt' : '34.5pt',
                  top: isKtc ? '3pt' : '4.4pt',
                  width: isKtc ? '54pt' : '52.5pt',
                  height: isKtc ? '54.5pt' : '52.5pt',
                  objectFit: 'contain',
                  pointerEvents: 'none',
                  zIndex: 2,
                }}
              />
              <span
                style={{
                  fontFamily: "'Bookman Old Style', Georgia, serif",
                  fontSize: '32pt',
                  fontWeight: 700,
                  color: THEME_COLOR,
                  lineHeight: '1',
                  display: 'inline-block',
                  whiteSpace: 'pre',
                }}
              >
                {`     ${company.companyName || 'KRISHNA ROADLINES'}`}
              </span>
            </td>
          </tr>

          {/* ROW 3 (19.2pt) */}
          <tr style={{ height: '19.2pt' }}>
            <td
              colSpan={6}
              style={{
                ...cellBaseStyle,
                borderLeft: BORDER,
                borderRight: BORDER,
                color: THEME_COLOR,
                fontWeight: 700,
                fontSize: '14pt',
                textAlign: 'center',
                whiteSpace: 'pre',
              }}
            >
              {`                     ${company.tagline || "FLEET ONWER & TRANSPORT CONTRACTOR'S"}`}
            </td>
          </tr>

          {/* ROW 4 (19.2pt) */}
          <tr style={{ height: '19.2pt' }}>
            <td
              colSpan={6}
              style={{
                ...cellBaseStyle,
                borderLeft: BORDER,
                borderRight: BORDER,
                color: THEME_COLOR,
                fontWeight: 700,
                fontSize: '14pt',
                textAlign: 'center',
                whiteSpace: 'pre',
              }}
            >
              {`                    ${
                company.routes ||
                'DAILY SERVICE : DELHI, UP, HARYANA, RAJASTHAN, GUJRAT AND ALL OVER INDIA'
              }`}
            </td>
          </tr>

          {/* ROW 5 (19.2pt) */}
          <tr style={{ height: '19.2pt' }}>
            <td
              colSpan={6}
              style={{
                ...cellBaseStyle,
                borderLeft: BORDER,
                borderRight: BORDER,
                color: THEME_COLOR,
                fontWeight: 700,
                fontSize: '14pt',
                textAlign: 'center',
                whiteSpace: 'pre',
              }}
            >
              {`                     ${
                company.address ||
                'J-152 A, SECTOR-9, VIJAY NAGAR, GHAZIABAD, UTTAR PRADESH'
              }`}
            </td>
          </tr>

          {/* ROW 6 (19.2pt) */}
          <tr style={{ height: '19.2pt' }}>
            <td
              colSpan={6}
              style={{
                ...cellBaseStyle,
                padding: '0px 3pt',
                borderLeft: BORDER,
                borderRight: BORDER,
                borderBottom: BORDER,
                color: THEME_COLOR,
                fontWeight: 400,
                fontSize: '12pt',
                textAlign: 'center',
                verticalAlign: 'middle',
                whiteSpace: 'pre',
              }}
            >
              {isKtc
                ? `                 ${company.email || 'KRISHNATRANSPORTCOMPANY26@GMAIL.COM'}`
                : `               ${company.email || 'KRISHNAROADLINES38@GMAIL.COM'}  `}
            </td>
          </tr>

          {/* ROW 7 (19.2pt) */}
          <tr style={{ height: '19.2pt' }}>
            <td
              style={{
                ...cellBaseStyle,
                border: BORDER,
                color: THEME_COLOR,
                fontWeight: 700,
                textAlign: 'left',
              }}
            >
              DATE{' '}
            </td>
            <td
              style={{
                ...cellBaseStyle,
                border: BORDER,
                color: BLACK,
                fontWeight: 400,
                textAlign: 'left',
              }}
            >
              {renderField('date', formattedDate, {
                uppercase: false,
                placeholder: 'DD-MM-YYYY',
                align: 'left',
                bold: false,
              })}
            </td>
            <td
              style={{
                ...cellBaseStyle,
                borderTop: BORDER,
                borderLeft: BORDER,
                borderRight: BORDER,
                color: THEME_COLOR,
                fontWeight: 700,
                textAlign: 'center',
              }}
            >
              {company.bankName || 'IDBI BANK LTD - SEC 63 NOIDA'}
            </td>
            <td
              colSpan={2}
              style={{
                ...cellBaseStyle,
                border: BORDER,
                color: THEME_COLOR,
                fontWeight: 700,
                textAlign: 'center',
              }}
            >
              VEHICLE SIZE
            </td>
            <td
              style={{
                ...cellBaseStyle,
                border: BORDER,
                color: BLACK,
                fontWeight: 400,
                textAlign: 'center',
              }}
            >
              {renderField('vehicleSize', bilty.vehicleSize || '22 FEET', {
                align: 'center',
                bold: false,
              })}
            </td>
          </tr>

          {/* ROW 8 (19.2pt) */}
          <tr style={{ height: '19.2pt' }}>
            <td
              style={{
                ...cellBaseStyle,
                border: BORDER,
                color: THEME_COLOR,
                fontWeight: 700,
                textAlign: 'left',
              }}
            >
              FROM
            </td>
            <td
              style={{
                ...cellBaseStyle,
                border: BORDER,
                color: BLACK,
                fontWeight: 400,
                textAlign: 'left',
              }}
            >
              {renderField('fromCity', bilty.fromCity, { align: 'left', bold: false })}
            </td>
            <td
              style={{
                ...cellBaseStyle,
                padding: '0px 3pt',
                borderLeft: BORDER,
                borderRight: BORDER,
                color: THEME_COLOR,
                fontWeight: 700,
                textAlign: 'center',
                verticalAlign: 'middle',
              }}
            >
              A/C.NO. {company.bankAccountNo || (isKtc ? '0200102000036014' : '0200102000032203')}{' '}
            </td>
            <td
              colSpan={2}
              style={{
                ...cellBaseStyle,
                borderTop: BORDER,
                borderLeft: BORDER,
                borderRight: BORDER,
                color: THEME_COLOR,
                fontWeight: 700,
                textAlign: 'center',
              }}
            >
              VEHICLE NO{' '}
            </td>
            <td
              style={{
                ...cellBaseStyle,
                borderTop: BORDER,
                borderLeft: BORDER,
                borderRight: BORDER,
                color: THEME_COLOR,
                fontWeight: 700,
                textAlign: 'center',
              }}
            >
              LR NO
            </td>
          </tr>

          {/* ROW 9 (19.2pt) */}
          <tr style={{ height: '19.2pt' }}>
            <td
              style={{
                ...cellBaseStyle,
                border: BORDER,
                color: THEME_COLOR,
                fontWeight: 700,
                textAlign: 'left',
              }}
            >
              TO
            </td>
            <td
              style={{
                ...cellBaseStyle,
                border: BORDER,
                color: BLACK,
                fontWeight: 400,
                textAlign: 'left',
              }}
            >
              {renderField('toCity', bilty.toCity, { align: 'left', bold: false })}
            </td>
            <td
              style={{
                ...cellBaseStyle,
                padding: '0px 3pt',
                borderLeft: BORDER,
                borderRight: BORDER,
                borderBottom: BORDER,
                color: THEME_COLOR,
                fontWeight: 700,
                textAlign: 'center',
                verticalAlign: 'middle',
              }}
            >
              IFSC. CODE. {company.bankIfsc || 'IBKL0000200'}
            </td>
            <td
              colSpan={2}
              style={{
                ...cellBaseStyle,
                padding: '0px 3pt',
                borderLeft: BORDER,
                borderRight: BORDER,
                borderBottom: BORDER,
                color: BLACK,
                fontWeight: 400,
                textAlign: 'center',
                verticalAlign: 'middle',
              }}
            >
              {renderField('vehicleNo', bilty.vehicleNo, {
                align: 'center',
                bold: false,
              })}
            </td>
            <td
              style={{
                ...cellBaseStyle,
                padding: '0px 3pt',
                borderLeft: BORDER,
                borderRight: BORDER,
                borderBottom: BORDER,
                color: BLACK,
                fontWeight: 700,
                textAlign: 'center',
                verticalAlign: 'middle',
              }}
            >
              {renderField('lrNo', bilty.lrNo, { align: 'center', bold: true })}
            </td>
          </tr>

          {/* ROW 10 (19.2pt) */}
          <tr style={{ height: '19.2pt' }}>
            <td
              style={{
                ...cellBaseStyle,
                border: BORDER,
                color: THEME_COLOR,
                fontWeight: 700,
                textAlign: 'left',
              }}
            >
              CONSIGNOR
            </td>
            <td
              colSpan={2}
              style={{
                ...cellBaseStyle,
                border: BORDER,
                color: BLACK,
                fontWeight: 400,
                textAlign: 'left',
              }}
            >
              {renderField('consignorName', bilty.consignorName, {
                align: 'left',
                bold: false,
              })}
            </td>
            <td
              style={{
                ...cellBaseStyle,
                borderTop: BORDER,
                borderBottom: BORDER,
                borderLeft: BORDER,
                color: THEME_COLOR,
                fontWeight: 700,
                textAlign: 'left',
              }}
            >
              GST IN
            </td>
            <td
              colSpan={2}
              style={{
                ...cellBaseStyle,
                borderTop: BORDER,
                borderBottom: BORDER,
                borderRight: BORDER,
                color: BLACK,
                fontWeight: 400,
                textAlign: 'left',
              }}
            >
              {renderField('consignorGst', bilty.consignorGst, {
                align: 'left',
                bold: false,
              })}
            </td>
          </tr>

          {/* ROW 11 (19.2pt) */}
          <tr style={{ height: '19.2pt' }}>
            <td
              style={{
                ...cellBaseStyle,
                border: BORDER,
                color: THEME_COLOR,
                fontWeight: 700,
                textAlign: 'left',
              }}
            >
              ADDRESS
            </td>
            <td
              colSpan={5}
              style={{
                ...cellBaseStyle,
                border: BORDER,
                color: BLACK,
                fontWeight: 400,
                textAlign: 'left',
              }}
            >
              {renderField('consignorAddress', bilty.consignorAddress, {
                align: 'left',
                bold: false,
              })}
            </td>
          </tr>

          {/* ROW 12 (19.2pt) */}
          <tr style={{ height: '19.2pt' }}>
            <td
              style={{
                ...cellBaseStyle,
                border: BORDER,
                color: THEME_COLOR,
                fontWeight: 700,
                textAlign: 'left',
              }}
            >
              CONSINEE
            </td>
            <td
              colSpan={2}
              style={{
                ...cellBaseStyle,
                border: BORDER,
                color: BLACK,
                fontWeight: 400,
                textAlign: 'left',
              }}
            >
              {renderField('consigneeName', bilty.consigneeName, {
                align: 'left',
                bold: false,
              })}
            </td>
            <td
              style={{
                ...cellBaseStyle,
                borderTop: BORDER,
                borderBottom: BORDER,
                borderLeft: BORDER,
                color: THEME_COLOR,
                fontWeight: 700,
                textAlign: 'left',
              }}
            >
              GST IN
            </td>
            <td
              colSpan={2}
              style={{
                ...cellBaseStyle,
                borderTop: BORDER,
                borderBottom: BORDER,
                borderRight: BORDER,
                color: BLACK,
                fontWeight: 400,
                textAlign: 'left',
              }}
            >
              {renderField('consigneeGst', bilty.consigneeGst, {
                align: 'left',
                bold: false,
              })}
            </td>
          </tr>

          {/* ROW 13 (19.2pt) */}
          <tr style={{ height: '19.2pt' }}>
            <td
              style={{
                ...cellBaseStyle,
                border: BORDER,
                color: THEME_COLOR,
                fontWeight: 700,
                textAlign: 'left',
              }}
            >
              ADDRESS
            </td>
            <td
              colSpan={5}
              style={{
                ...cellBaseStyle,
                border: BORDER,
                color: BLACK,
                fontWeight: 400,
                textAlign: 'left',
              }}
            >
              {renderField('consigneeAddress', bilty.consigneeAddress, {
                align: 'left',
                bold: false,
              })}
            </td>
          </tr>

          {isKtc ? (
            <>
              {/* KTC ROW 14 (19.2pt):
                  - A14:B14: "WHAT IS THE GOODS" | Calibri 14pt BOLD Brown | Left | Top, Left, Right border
                  - C14: "PARTY SEND ITS OWN MATERIAL INSURANCE, IT IS" | Calibri 14pt BOLD Brown | Center | Top, Left, Right border
                  - D14:E14: "FRIEGHT" | Calibri 14pt BOLD Brown | Left | Full border
                  - F14: [Freight Amt] | Full border
              */}
              <tr style={{ height: '19.2pt' }}>
                <td
                  colSpan={2}
                  style={{
                    ...cellBaseStyle,
                    borderTop: BORDER,
                    borderLeft: BORDER,
                    borderRight: BORDER,
                    color: THEME_COLOR,
                    fontWeight: 700,
                    textAlign: 'left',
                  }}
                >
                  WHAT IS THE GOODS
                </td>
                <td
                  style={{
                    ...cellBaseStyle,
                    borderTop: BORDER,
                    borderLeft: BORDER,
                    borderRight: BORDER,
                    color: THEME_COLOR,
                    fontWeight: 700,
                    textAlign: 'center',
                  }}
                >
                  PARTY SEND ITS OWN MATERIAL INSURANCE, IT IS
                </td>
                <td
                  colSpan={2}
                  style={{
                    ...cellBaseStyle,
                    border: BORDER,
                    color: THEME_COLOR,
                    fontWeight: 700,
                    textAlign: 'left',
                  }}
                >
                  FRIEGHT
                </td>
                <td
                  style={{
                    ...cellBaseStyle,
                    border: BORDER,
                    color: BLACK,
                    fontWeight: 400,
                    textAlign: 'right',
                  }}
                >
                  {renderField('freight', bilty.freight ? bilty.freight : '', {
                    type: 'number',
                    uppercase: false,
                    align: 'right',
                    bold: false,
                  })}
                </td>
              </tr>

              {/* KTC ROW 15 (19.2pt):
                  - A15:B15: [Goods Line 1] | Left & Right border
                  - C15: "NOT THE RESPONSIBILITY OF THE TRANSPORTER" | Calibri 14pt BOLD Brown | Center | Left & Right border
                  - D15:E15: [Extra Charge Label 1] | Full border
                  - F15: [Amt] | Full border
              */}
              <tr style={{ height: '19.2pt' }}>
                <td
                  colSpan={2}
                  style={{
                    ...cellBaseStyle,
                    borderLeft: BORDER,
                    borderRight: BORDER,
                    color: BLACK,
                    fontWeight: 400,
                    textAlign: 'left',
                  }}
                >
                  {renderGoodsLineField(0)}
                </td>
                <td
                  style={{
                    ...cellBaseStyle,
                    borderLeft: BORDER,
                    borderRight: BORDER,
                    color: THEME_COLOR,
                    fontWeight: 700,
                    textAlign: 'center',
                  }}
                >
                  NOT THE RESPONSIBILITY OF THE TRANSPORTER
                </td>
                <td
                  colSpan={2}
                  style={{
                    ...cellBaseStyle,
                    border: BORDER,
                    color: BLACK,
                    fontWeight: 400,
                    textAlign: 'left',
                  }}
                >
                  {bilty.otherCharges ? bilty.otherChargesLabel || 'CHARGES' : '\u00A0'}
                </td>
                <td
                  style={{
                    ...cellBaseStyle,
                    border: BORDER,
                    color: BLACK,
                    fontWeight: 400,
                    textAlign: 'right',
                  }}
                >
                  {renderField(
                    'otherCharges',
                    bilty.otherCharges ? bilty.otherCharges : '',
                    { type: 'number', uppercase: false, align: 'right', bold: false }
                  )}
                </td>
              </tr>

              {/* KTC ROW 16 (19.2pt):
                  - A16:B16: [Goods Line 2] | Left & Right border
                  - C16: "" | Top, Left, Right border
                  - D16:E16: "" | Full border
                  - F16: "" | Full border
              */}
              <tr style={{ height: '19.2pt' }}>
                <td
                  colSpan={2}
                  style={{
                    ...cellBaseStyle,
                    borderLeft: BORDER,
                    borderRight: BORDER,
                    color: BLACK,
                    fontWeight: 400,
                    textAlign: 'left',
                  }}
                >
                  {renderGoodsLineField(1)}
                </td>
                <td
                  style={{
                    ...cellBaseStyle,
                    borderTop: BORDER,
                    borderLeft: BORDER,
                    borderRight: BORDER,
                    color: THEME_COLOR,
                    fontWeight: 700,
                    textAlign: 'center',
                  }}
                >
                  &nbsp;
                </td>
                <td
                  colSpan={2}
                  style={{
                    ...cellBaseStyle,
                    border: BORDER,
                    color: BLACK,
                    fontWeight: 400,
                    textAlign: 'left',
                  }}
                >
                  &nbsp;
                </td>
                <td
                  style={{
                    ...cellBaseStyle,
                    border: BORDER,
                    color: BLACK,
                    fontWeight: 400,
                    textAlign: 'right',
                  }}
                >
                  &nbsp;
                </td>
              </tr>

              {/* KTC ROW 17 (19.2pt):
                  - A17:B17: [Goods Line 3] | Left & Right border
                  - C17: "FOR TRANSPORTER NOT RESPONSIBLE" | Calibri 14pt BOLD Brown | Center | Left & Right border
                  - D17:E17: "TOTAL" | Calibri 14pt BOLD Brown | Left | Full border
                  - F17: [Total Amt] | Full border
              */}
              <tr style={{ height: '19.2pt' }}>
                <td
                  colSpan={2}
                  style={{
                    ...cellBaseStyle,
                    borderLeft: BORDER,
                    borderRight: BORDER,
                    color: BLACK,
                    fontWeight: 400,
                    textAlign: 'left',
                  }}
                >
                  {renderGoodsLineField(2)}
                </td>
                <td
                  style={{
                    ...cellBaseStyle,
                    borderLeft: BORDER,
                    borderRight: BORDER,
                    color: THEME_COLOR,
                    fontWeight: 700,
                    textAlign: 'center',
                  }}
                >
                  FOR TRANSPORTER NOT RESPONSIBLE
                </td>
                <td
                  colSpan={2}
                  style={{
                    ...cellBaseStyle,
                    border: BORDER,
                    color: THEME_COLOR,
                    fontWeight: 700,
                    textAlign: 'left',
                  }}
                >
                  TOTAL
                </td>
                <td
                  style={{
                    ...cellBaseStyle,
                    border: BORDER,
                    color: BLACK,
                    fontWeight: 400,
                    textAlign: 'right',
                  }}
                >
                  {bilty.total > 0 ? bilty.total : ''}
                </td>
              </tr>

              {/* KTC ROW 18 (19.2pt):
                  - A18:B18: [Goods Line 4] | Left & Right border
                  - C18: "FOR LEAKAGE BREAKAGE AND DAMAGE" | Calibri 14pt BOLD Brown | Center | Left & Right border
                  - D18:E18: "S.GST    2.5 %" | Calibri 14pt BOLD Brown | Left | Full border
                  - F18: [SGST Amt] | Full border
              */}
              <tr style={{ height: '19.2pt' }}>
                <td
                  colSpan={2}
                  style={{
                    ...cellBaseStyle,
                    borderLeft: BORDER,
                    borderRight: BORDER,
                    color: BLACK,
                    fontWeight: 400,
                    textAlign: 'left',
                  }}
                >
                  {renderGoodsLineField(3)}
                </td>
                <td
                  style={{
                    ...cellBaseStyle,
                    borderLeft: BORDER,
                    borderRight: BORDER,
                    color: THEME_COLOR,
                    fontWeight: 700,
                    textAlign: 'center',
                  }}
                >
                  FOR LEAKAGE BREAKAGE AND DAMAGE
                </td>
                <td
                  colSpan={2}
                  style={{
                    ...cellBaseStyle,
                    border: BORDER,
                    color: THEME_COLOR,
                    fontWeight: 700,
                    textAlign: 'left',
                    whiteSpace: 'pre',
                  }}
                >
                  {`S.GST    2.5 %`}
                </td>
                <td
                  style={{
                    ...cellBaseStyle,
                    border: BORDER,
                    color: BLACK,
                    fontWeight: 400,
                    textAlign: 'right',
                  }}
                >
                  {bilty.sgstAmount > 0 ? bilty.sgstAmount : ''}
                </td>
              </tr>

              {/* KTC ROW 19 (19.2pt):
                  - A19: "QUANTITY" | Calibri 14pt BOLD Brown | Left | Full border
                  - B19: [Quantity Value] | Full border
                  - C19: "" | Top, Left, Right border
                  - D19:E19: "C.GST    2.5 %" | Calibri 14pt BOLD Brown | Left | Full border
                  - F19: [CGST Amt] | Full border
              */}
              <tr style={{ height: '19.2pt' }}>
                <td
                  style={{
                    ...cellBaseStyle,
                    border: BORDER,
                    color: THEME_COLOR,
                    fontWeight: 700,
                    textAlign: 'left',
                  }}
                >
                  QUANTITY
                </td>
                <td
                  style={{
                    ...cellBaseStyle,
                    border: BORDER,
                    color: BLACK,
                    fontWeight: 400,
                    textAlign: 'left',
                  }}
                >
                  {renderField('quantity', bilty.quantity, { align: 'left', bold: false })}
                </td>
                <td
                  style={{
                    ...cellBaseStyle,
                    borderTop: BORDER,
                    borderLeft: BORDER,
                    borderRight: BORDER,
                  }}
                >
                  &nbsp;
                </td>
                <td
                  colSpan={2}
                  style={{
                    ...cellBaseStyle,
                    border: BORDER,
                    color: THEME_COLOR,
                    fontWeight: 700,
                    textAlign: 'left',
                    whiteSpace: 'pre',
                  }}
                >
                  {`C.GST    2.5 %`}
                </td>
                <td
                  style={{
                    ...cellBaseStyle,
                    border: BORDER,
                    color: BLACK,
                    fontWeight: 400,
                    textAlign: 'right',
                  }}
                >
                  {bilty.cgstAmount > 0 ? bilty.cgstAmount : ''}
                </td>
              </tr>

              {/* KTC ROW 20 (19.2pt):
                  - A20: "SEAL NUMBER" | Calibri 14pt BOLD Brown | Left | Full border
                  - B20: [Seal No Value] | Full border
                  - C20: "PLEASE CHECK THE ATTACHED" | Calibri 14pt BOLD Brown | Center | Left & Right border
                  - D20:E20: "I .GST        5 %" | Calibri 14pt BOLD Brown | Left | Full border
                  - F20: [IGST Amt] | Full border
              */}
              <tr style={{ height: '19.2pt' }}>
                <td
                  style={{
                    ...cellBaseStyle,
                    border: BORDER,
                    color: THEME_COLOR,
                    fontWeight: 700,
                    textAlign: 'left',
                  }}
                >
                  SEAL NUMBER
                </td>
                <td
                  style={{
                    ...cellBaseStyle,
                    border: BORDER,
                    color: BLACK,
                    fontWeight: 400,
                    textAlign: 'left',
                  }}
                >
                  {renderField('sealNumber', bilty.sealNumber, {
                    align: 'left',
                    bold: false,
                  })}
                </td>
                <td
                  style={{
                    ...cellBaseStyle,
                    borderLeft: BORDER,
                    borderRight: BORDER,
                    color: THEME_COLOR,
                    fontWeight: 700,
                    textAlign: 'center',
                  }}
                >
                  PLEASE CHECK THE ATTACHED
                </td>
                <td
                  colSpan={2}
                  style={{
                    ...cellBaseStyle,
                    border: BORDER,
                    color: THEME_COLOR,
                    fontWeight: 700,
                    textAlign: 'left',
                    whiteSpace: 'pre',
                  }}
                >
                  {`I .GST        5 %`}
                </td>
                <td
                  style={{
                    ...cellBaseStyle,
                    border: BORDER,
                    color: BLACK,
                    fontWeight: 400,
                    textAlign: 'right',
                  }}
                >
                  {bilty.igstAmount > 0 ? bilty.igstAmount : ''}
                </td>
              </tr>

              {/* KTC ROW 21 (19.2pt):
                  - A21: "NET WEIGHT" | Calibri 14pt BOLD Brown | Left | Full border
                  - B21: [Net Weight] | Full border
                  - C21: "INVOICE FOR MORE INFORMATION" | Calibri 14pt BOLD Brown | Center | Left & Right border
                  - D21:E21: "G.TOTAL " | Calibri 14pt BOLD Brown | Left | Full border
                  - F21: [Grand Total] | Full border
              */}
              <tr style={{ height: '19.2pt' }}>
                <td
                  style={{
                    ...cellBaseStyle,
                    border: BORDER,
                    color: THEME_COLOR,
                    fontWeight: 700,
                    textAlign: 'left',
                  }}
                >
                  NET WEIGHT
                </td>
                <td
                  style={{
                    ...cellBaseStyle,
                    border: BORDER,
                    color: BLACK,
                    fontWeight: 400,
                    textAlign: 'left',
                  }}
                >
                  {renderField('netWeight', bilty.netWeight, {
                    align: 'left',
                    bold: false,
                  })}
                </td>
                <td
                  style={{
                    ...cellBaseStyle,
                    borderLeft: BORDER,
                    borderRight: BORDER,
                    color: THEME_COLOR,
                    fontWeight: 700,
                    textAlign: 'center',
                  }}
                >
                  INVOICE FOR MORE INFORMATION
                </td>
                <td
                  colSpan={2}
                  style={{
                    ...cellBaseStyle,
                    border: BORDER,
                    color: THEME_COLOR,
                    fontWeight: 700,
                    textAlign: 'left',
                  }}
                >
                  G.TOTAL{' '}
                </td>
                <td
                  style={{
                    ...cellBaseStyle,
                    border: BORDER,
                    color: BLACK,
                    fontWeight: 400,
                    textAlign: 'right',
                  }}
                >
                  {bilty.grandTotal > 0 ? bilty.grandTotal : ''}
                </td>
              </tr>

              {/* KTC ROW 22 (19.2pt):
                  - A22: "INVOICE NO" | Calibri 14pt BOLD Brown | Left | Full border
                  - B22: [Invoice No] | Full border
                  - C22: "" | Top, Left, Right border
                  - D22:E22: "ADVANCE" | Calibri 14pt BOLD Brown | Left | Full border
                  - F22: [Advance] | Full border
              */}
              <tr style={{ height: '19.2pt' }}>
                <td
                  style={{
                    ...cellBaseStyle,
                    border: BORDER,
                    color: THEME_COLOR,
                    fontWeight: 700,
                    textAlign: 'left',
                  }}
                >
                  INVOICE NO
                </td>
                <td
                  style={{
                    ...cellBaseStyle,
                    border: BORDER,
                    color: BLACK,
                    fontWeight: 400,
                    textAlign: 'left',
                  }}
                >
                  {renderField('invoiceNo', bilty.invoiceNo, {
                    align: 'left',
                    bold: false,
                  })}
                </td>
                <td
                  style={{
                    ...cellBaseStyle,
                    borderTop: BORDER,
                    borderLeft: BORDER,
                    borderRight: BORDER,
                  }}
                >
                  &nbsp;
                </td>
                <td
                  colSpan={2}
                  style={{
                    ...cellBaseStyle,
                    border: BORDER,
                    color: THEME_COLOR,
                    fontWeight: 700,
                    textAlign: 'left',
                  }}
                >
                  ADVANCE
                </td>
                <td
                  style={{
                    ...cellBaseStyle,
                    border: BORDER,
                    color: BLACK,
                    fontWeight: 400,
                    textAlign: 'right',
                  }}
                >
                  {renderField('advance', bilty.advance ? bilty.advance : '', {
                    type: 'number',
                    uppercase: false,
                    align: 'right',
                    bold: false,
                  })}
                </td>
              </tr>

              {/* KTC ROW 23 (19.2pt):
                  - A23: "INVOICE VALUE" | Calibri 14pt BOLD Brown | Left | Full border
                  - B23: [Invoice Value] | Full border
                  - C23: "IN-DATE  [DD-MM-YYYY]" | Calibri 14pt BOLD Black | Center, Middle | Left & Right border
                  - D23:E23: "BALANCE" | Calibri 14pt BOLD Brown | Left | Full border
                  - F23: [Balance] | Full border
              */}
              <tr style={{ height: '19.2pt' }}>
                <td
                  style={{
                    ...cellBaseStyle,
                    border: BORDER,
                    color: THEME_COLOR,
                    fontWeight: 700,
                    textAlign: 'left',
                  }}
                >
                  INVOICE VALUE
                </td>
                <td
                  style={{
                    ...cellBaseStyle,
                    border: BORDER,
                    color: BLACK,
                    fontWeight: 400,
                    textAlign: 'left',
                  }}
                >
                  {renderField('invoiceValue', bilty.invoiceValue, {
                    uppercase: false,
                    align: 'left',
                    bold: false,
                  })}
                </td>
                <td
                  style={{
                    ...cellBaseStyle,
                    padding: '0px 3pt',
                    borderLeft: BORDER,
                    borderRight: BORDER,
                    color: BLACK,
                    fontWeight: 700,
                    textAlign: 'center',
                    verticalAlign: 'middle',
                    whiteSpace: 'pre',
                  }}
                >
                  {`IN-DATE  ${formattedInDate}`}
                </td>
                <td
                  colSpan={2}
                  style={{
                    ...cellBaseStyle,
                    border: BORDER,
                    color: THEME_COLOR,
                    fontWeight: 700,
                    textAlign: 'left',
                  }}
                >
                  BALANCE
                </td>
                <td
                  style={{
                    ...cellBaseStyle,
                    border: BORDER,
                    color: BLACK,
                    fontWeight: 400,
                    textAlign: 'right',
                  }}
                >
                  {bilty.balance > 0 ? bilty.balance : ''}
                </td>
              </tr>

              {/* KTC ROW 24 (19.2pt):
                  - A24: "E-WAY BILL NO" | Calibri 14pt BOLD Brown | Left | Full border
                  - B24: [E-Way Bill] | Full border
                  - C24: "" | Left & Right border
                  - D24:F24: "FRIEGHT TO PAY        " | Calibri 14pt BOLD Brown | Left | Full border
              */}
              <tr style={{ height: '19.2pt' }}>
                <td
                  style={{
                    ...cellBaseStyle,
                    border: BORDER,
                    color: THEME_COLOR,
                    fontWeight: 700,
                    textAlign: 'left',
                  }}
                >
                  E-WAY BILL NO
                </td>
                <td
                  style={{
                    ...cellBaseStyle,
                    border: BORDER,
                    color: BLACK,
                    fontWeight: 400,
                    textAlign: 'left',
                  }}
                >
                  {renderField('eWayBillNo', bilty.eWayBillNo, {
                    align: 'left',
                    bold: false,
                  })}
                </td>
                <td
                  style={{
                    ...cellBaseStyle,
                    borderLeft: BORDER,
                    borderRight: BORDER,
                  }}
                >
                  &nbsp;
                </td>
                <td
                  colSpan={3}
                  onClick={() =>
                    isEditable && onUpdateField && onUpdateField('paymentMode', 'TO_PAY')
                  }
                  style={{
                    ...cellBaseStyle,
                    border: BORDER,
                    color: THEME_COLOR,
                    fontWeight: 700,
                    textAlign: 'left',
                    cursor: isEditable ? 'pointer' : 'default',
                    whiteSpace: 'pre',
                  }}
                >
                  <span>FRIEGHT TO PAY</span>
                </td>
              </tr>

              {/* KTC ROW 25 (19.2pt):
                  - A25: "GST PAID BY" | Calibri 14pt BOLD Brown | Left | Full border
                  - B25: "TRANSPORTER" | Calibri 14pt BOLD Brown | Left | Full border
                  - C25: "CONSINOR  ✔                                           CONSINEE" | Calibri 14pt BOLD Brown (+ Black Wingdings ✔) | Left | Full border
                  - D25:F25: "FRIEGHT TO BE BILD  ✔" | Calibri 14pt BOLD Brown (+ Black Wingdings ✔) | Left | Full border
              */}
              <tr style={{ height: '19.2pt' }}>
                <td
                  style={{
                    ...cellBaseStyle,
                    border: BORDER,
                    color: THEME_COLOR,
                    fontWeight: 700,
                    textAlign: 'left',
                  }}
                >
                  GST PAID BY
                </td>
                <td
                  style={{
                    ...cellBaseStyle,
                    border: BORDER,
                    color: THEME_COLOR,
                    fontWeight: 700,
                    textAlign: 'left',
                  }}
                >
                  TRANSPORTER
                </td>
                <td
                  style={{
                    ...cellBaseStyle,
                    border: BORDER,
                    color: THEME_COLOR,
                    fontWeight: 700,
                    textAlign: 'left',
                    whiteSpace: 'pre',
                  }}
                >
                  <span>
                    CONSINOR  <span style={{ color: BLACK }}>&#10004;</span>                                           CONSINEE
                  </span>
                </td>
                <td
                  colSpan={3}
                  onClick={() =>
                    isEditable &&
                    onUpdateField &&
                    onUpdateField('paymentMode', 'TO_BE_BILLED')
                  }
                  style={{
                    ...cellBaseStyle,
                    border: BORDER,
                    color: THEME_COLOR,
                    fontWeight: 700,
                    textAlign: 'left',
                    cursor: isEditable ? 'pointer' : 'default',
                    whiteSpace: 'pre',
                  }}
                >
                  <span>{bottomPaymentLabel}</span>
                </td>
              </tr>

              {/* KTC ROW 26 (49.95pt):
                  - A26:B26 (Merged): "" | Top thin border only
                  - C26:F26 (Merged): "FOR KRISHNA TRANSPORT COMPANY" | Calibri 13.5pt BOLD Brown | Right, Middle | Top thin border only
              */}
              <tr style={{ height: '49.95pt' }}>
                <td
                  colSpan={2}
                  style={{
                    ...cellBaseStyle,
                    height: '49.95pt',
                    borderTop: BORDER,
                    verticalAlign: 'middle',
                    padding: '0px 3pt',
                  }}
                >
                  &nbsp;
                </td>
                <td
                  colSpan={4}
                  style={{
                    ...cellBaseStyle,
                    height: '49.95pt',
                    borderTop: BORDER,
                    color: THEME_COLOR,
                    fontWeight: 700,
                    fontSize: '13.5pt',
                    textAlign: 'right',
                    verticalAlign: 'middle',
                    padding: '0px 6px',
                  }}
                >
                  {company.signText || `FOR ${company.companyName || 'KRISHNA TRANSPORT COMPANY'}`}
                </td>
              </tr>
            </>
          ) : (
            <>
              {/* ROW 14 (19.2pt):
                  - A14:B14 (Merged): "WHAT IS THE GOODS" | Calibri 14pt BOLD Navy | Left | Left, Right, Top thin border
                  - C14: "" | Top, Left, Right thin border
                  - D14:E14 (Merged): "FRIEGHT" | Calibri 14pt BOLD Navy | Left | Full thin border
                  - F14: [Freight Amt] | Calibri 14pt REGULAR Black | Right | Full thin border
              */}
              <tr style={{ height: '19.2pt' }}>
                <td
                  colSpan={2}
                  style={{
                    ...cellBaseStyle,
                    borderTop: BORDER,
                    borderLeft: BORDER,
                    borderRight: BORDER,
                    color: NAVY,
                    fontWeight: 700,
                    textAlign: 'left',
                  }}
                >
                  WHAT IS THE GOODS
                </td>
                <td
                  style={{
                    ...cellBaseStyle,
                    borderTop: BORDER,
                    borderLeft: BORDER,
                    borderRight: BORDER,
                  }}
                >
                  &nbsp;
                </td>
                <td
                  colSpan={2}
                  style={{
                    ...cellBaseStyle,
                    border: BORDER,
                    color: NAVY,
                    fontWeight: 700,
                    textAlign: 'left',
                  }}
                >
                  FRIEGHT
                </td>
                <td
                  style={{
                    ...cellBaseStyle,
                    border: BORDER,
                    color: BLACK,
                    fontWeight: 400,
                    textAlign: 'right',
                  }}
                >
                  {renderField('freight', bilty.freight ? bilty.freight : '', {
                    type: 'number',
                    uppercase: false,
                    align: 'right',
                    bold: false,
                  })}
                </td>
              </tr>

              {/* ROW 15 (19.2pt):
                  - A15:B15 (Merged): [Goods Description Line 1] | Calibri 14pt REGULAR Black | Left | Left & Right thin border only
                  - C15: "PARTY SEND ITS OWN MATERIAL INSURANCE, IT IS" | Calibri 14pt BOLD Navy | Center | Left & Right thin border
                  - D15:E15 (Merged): [Extra Charge Label 1] | Calibri 14pt REGULAR | Left | Full thin border
                  - F15: [Amt] | Calibri 14pt REGULAR Black | Right | Full thin border
              */}
              <tr style={{ height: '19.2pt' }}>
                <td
                  colSpan={2}
                  style={{
                    ...cellBaseStyle,
                    borderLeft: BORDER,
                    borderRight: BORDER,
                    color: BLACK,
                    fontWeight: 400,
                    textAlign: 'left',
                  }}
                >
                  {renderGoodsLineField(0)}
                </td>
                <td
                  style={{
                    ...cellBaseStyle,
                    borderLeft: BORDER,
                    borderRight: BORDER,
                    color: NAVY,
                    fontWeight: 700,
                    textAlign: 'center',
                  }}
                >
                  PARTY SEND ITS OWN MATERIAL INSURANCE, IT IS
                </td>
                <td
                  colSpan={2}
                  style={{
                    ...cellBaseStyle,
                    border: BORDER,
                    color: BLACK,
                    fontWeight: 400,
                    textAlign: 'left',
                  }}
                >
                  {bilty.otherCharges ? bilty.otherChargesLabel || 'CHARGES' : '\u00A0'}
                </td>
                <td
                  style={{
                    ...cellBaseStyle,
                    border: BORDER,
                    color: BLACK,
                    fontWeight: 400,
                    textAlign: 'right',
                  }}
                >
                  {renderField(
                    'otherCharges',
                    bilty.otherCharges ? bilty.otherCharges : '',
                    { type: 'number', uppercase: false, align: 'right', bold: false }
                  )}
                </td>
              </tr>

              {/* ROW 16 (19.2pt):
                  - A16:B16 (Merged): [Goods Description Line 2] | Calibri 14pt REGULAR Black | Left | Left & Right thin border only
                  - C16: "NOT THE RESPONSIBILITY OF THE TRANSPORTER" | Calibri 14pt BOLD Navy | Center | Left & Right thin border
                  - D16:E16 (Merged): [Extra Charge Label 2] | Calibri 14pt REGULAR | Left | Full thin border
                  - F16: [Amt] | Calibri 14pt REGULAR Black | Right | Full thin border
              */}
              <tr style={{ height: '19.2pt' }}>
                <td
                  colSpan={2}
                  style={{
                    ...cellBaseStyle,
                    borderLeft: BORDER,
                    borderRight: BORDER,
                    color: BLACK,
                    fontWeight: 400,
                    textAlign: 'left',
                  }}
                >
                  {renderGoodsLineField(1)}
                </td>
                <td
                  style={{
                    ...cellBaseStyle,
                    borderLeft: BORDER,
                    borderRight: BORDER,
                    color: NAVY,
                    fontWeight: 700,
                    textAlign: 'center',
                  }}
                >
                  NOT THE RESPONSIBILITY OF THE TRANSPORTER
                </td>
                <td
                  colSpan={2}
                  style={{
                    ...cellBaseStyle,
                    border: BORDER,
                    color: BLACK,
                    fontWeight: 400,
                    textAlign: 'left',
                  }}
                >
                  &nbsp;
                </td>
                <td
                  style={{
                    ...cellBaseStyle,
                    border: BORDER,
                    color: BLACK,
                    fontWeight: 400,
                    textAlign: 'right',
                  }}
                >
                  &nbsp;
                </td>
              </tr>

              {/* ROW 17 (19.2pt):
                  - A17:B17 (Merged): [Goods Description Line 3] | Calibri 14pt REGULAR Black | Left | Left & Right thin border only
                  - C17: "" | Calibri 14pt BOLD Navy | Center | Top, Left, Right thin border
                  - D17:E17 (Merged): "TOTAL" | Calibri 14pt BOLD Navy | Left | Full thin border
                  - F17: [Total Amt] | Calibri 14pt REGULAR Black | Right | Full thin border
              */}
              <tr style={{ height: '19.2pt' }}>
                <td
                  colSpan={2}
                  style={{
                    ...cellBaseStyle,
                    borderLeft: BORDER,
                    borderRight: BORDER,
                    color: BLACK,
                    fontWeight: 400,
                    textAlign: 'left',
                  }}
                >
                  {renderGoodsLineField(2)}
                </td>
                <td
                  style={{
                    ...cellBaseStyle,
                    borderTop: BORDER,
                    borderLeft: BORDER,
                    borderRight: BORDER,
                    color: NAVY,
                    fontWeight: 700,
                    textAlign: 'center',
                  }}
                >
                  &nbsp;
                </td>
                <td
                  colSpan={2}
                  style={{
                    ...cellBaseStyle,
                    border: BORDER,
                    color: NAVY,
                    fontWeight: 700,
                    textAlign: 'left',
                  }}
                >
                  TOTAL
                </td>
                <td
                  style={{
                    ...cellBaseStyle,
                    border: BORDER,
                    color: BLACK,
                    fontWeight: 400,
                    textAlign: 'right',
                  }}
                >
                  {bilty.total > 0 ? bilty.total : ''}
                </td>
              </tr>

              {/* ROW 18 (19.2pt):
                  - A18:B18 (Merged): [Goods Description Line 4] | Calibri 14pt REGULAR Black | Left | Left & Right thin border only
                  - C18: "FOR TRANSPORTER NOT RESPONSIBLE" | Calibri 14pt BOLD Navy | Center | Left & Right thin border
                  - D18:E18 (Merged): "S.GST    9 %" | Calibri 14pt BOLD Navy | Left | Full thin border
                  - F18: [SGST Amt] | Calibri 14pt REGULAR Black | Right | Full thin border
              */}
              <tr style={{ height: '19.2pt' }}>
                <td
                  colSpan={2}
                  style={{
                    ...cellBaseStyle,
                    borderLeft: BORDER,
                    borderRight: BORDER,
                    color: BLACK,
                    fontWeight: 400,
                    textAlign: 'left',
                  }}
                >
                  {renderGoodsLineField(3)}
                </td>
                <td
                  style={{
                    ...cellBaseStyle,
                    borderLeft: BORDER,
                    borderRight: BORDER,
                    color: NAVY,
                    fontWeight: 700,
                    textAlign: 'center',
                  }}
                >
                  FOR TRANSPORTER NOT RESPONSIBLE
                </td>
                <td
                  colSpan={2}
                  style={{
                    ...cellBaseStyle,
                    border: BORDER,
                    color: NAVY,
                    fontWeight: 700,
                    textAlign: 'left',
                    whiteSpace: 'pre',
                  }}
                >
                  {`S.GST    ${halfGstRate} %`}
                </td>
                <td
                  style={{
                    ...cellBaseStyle,
                    border: BORDER,
                    color: BLACK,
                    fontWeight: 400,
                    textAlign: 'right',
                  }}
                >
                  {bilty.sgstAmount > 0 ? bilty.sgstAmount : ''}
                </td>
              </tr>

              {/* ROW 19 (19.2pt):
                  - A19:B19 (Merged): [Goods Description Line 5] | Calibri 14pt REGULAR Black | Left | Left & Right thin border only
                  - C19: "FOR LEAKAGE BREAKAGE AND DAMAGE" | Calibri 14pt BOLD Navy | Center | Left & Right thin border
                  - D19:E19 (Merged): "C.GST    9 %" | Calibri 14pt BOLD Navy | Left | Full thin border
                  - F19: [CGST Amt] | Calibri 14pt REGULAR Black | Right | Full thin border
              */}
              <tr style={{ height: '19.2pt' }}>
                <td
                  colSpan={2}
                  style={{
                    ...cellBaseStyle,
                    borderLeft: BORDER,
                    borderRight: BORDER,
                    color: BLACK,
                    fontWeight: 400,
                    textAlign: 'left',
                  }}
                >
                  {renderGoodsLineField(4)}
                </td>
                <td
                  style={{
                    ...cellBaseStyle,
                    borderLeft: BORDER,
                    borderRight: BORDER,
                    color: NAVY,
                    fontWeight: 700,
                    textAlign: 'center',
                  }}
                >
                  FOR LEAKAGE BREAKAGE AND DAMAGE
                </td>
                <td
                  colSpan={2}
                  style={{
                    ...cellBaseStyle,
                    border: BORDER,
                    color: NAVY,
                    fontWeight: 700,
                    textAlign: 'left',
                    whiteSpace: 'pre',
                  }}
                >
                  {`C.GST    ${halfGstRate} %`}
                </td>
                <td
                  style={{
                    ...cellBaseStyle,
                    border: BORDER,
                    color: BLACK,
                    fontWeight: 400,
                    textAlign: 'right',
                  }}
                >
                  {bilty.cgstAmount > 0 ? bilty.cgstAmount : ''}
                </td>
              </tr>

              {/* ROW 20 (19.2pt):
                  - A20: "QUANTITY" | Calibri 14pt BOLD Navy | Left | Full thin border
                  - B20: [Quantity Value] | Calibri 14pt REGULAR Black | Left | Full thin border
                  - C20: "" | Top, Left, Right thin border
                  - D20:E20 (Merged): "I .GST  18 %" | Calibri 14pt BOLD Navy | Left | Full thin border
                  - F20: [IGST Amt] | Calibri 14pt REGULAR Black | Right | Full thin border
              */}
              <tr style={{ height: '19.2pt' }}>
                <td
                  style={{
                    ...cellBaseStyle,
                    border: BORDER,
                    color: NAVY,
                    fontWeight: 700,
                    textAlign: 'left',
                  }}
                >
                  QUANTITY
                </td>
                <td
                  style={{
                    ...cellBaseStyle,
                    border: BORDER,
                    color: BLACK,
                    fontWeight: 400,
                    textAlign: 'left',
                  }}
                >
                  {renderField('quantity', bilty.quantity, { align: 'left', bold: false })}
                </td>
                <td
                  style={{
                    ...cellBaseStyle,
                    borderTop: BORDER,
                    borderLeft: BORDER,
                    borderRight: BORDER,
                  }}
                >
                  &nbsp;
                </td>
                <td
                  colSpan={2}
                  style={{
                    ...cellBaseStyle,
                    border: BORDER,
                    color: NAVY,
                    fontWeight: 700,
                    textAlign: 'left',
                    whiteSpace: 'pre',
                  }}
                >
                  {`I .GST  ${gstRate} %`}
                </td>
                <td
                  style={{
                    ...cellBaseStyle,
                    border: BORDER,
                    color: BLACK,
                    fontWeight: 400,
                    textAlign: 'right',
                  }}
                >
                  {bilty.igstAmount > 0 ? bilty.igstAmount : ''}
                </td>
              </tr>

              {/* ROW 21 (19.2pt):
                  - A21: "SEAL NUMBER" | Calibri 14pt BOLD Navy | Left | Full thin border
                  - B21: [Seal No Value] | Calibri 14pt REGULAR Black | Left | Full thin border
                  - C21: "PLEASE CHECK THE ATTACHED" | Calibri 14pt BOLD Navy | Center | Left & Right thin border
                  - D21:E21 (Merged): "G.TOTAL " | Calibri 14pt BOLD Navy | Left | Full thin border
                  - F21: [Grand Total Amt] | Calibri 14pt REGULAR Black | Right | Full thin border
              */}
              <tr style={{ height: '19.2pt' }}>
                <td
                  style={{
                    ...cellBaseStyle,
                    border: BORDER,
                    color: NAVY,
                    fontWeight: 700,
                    textAlign: 'left',
                  }}
                >
                  SEAL NUMBER
                </td>
                <td
                  style={{
                    ...cellBaseStyle,
                    border: BORDER,
                    color: BLACK,
                    fontWeight: 400,
                    textAlign: 'left',
                  }}
                >
                  {renderField('sealNumber', bilty.sealNumber, {
                    align: 'left',
                    bold: false,
                  })}
                </td>
                <td
                  style={{
                    ...cellBaseStyle,
                    borderLeft: BORDER,
                    borderRight: BORDER,
                    color: NAVY,
                    fontWeight: 700,
                    textAlign: 'center',
                  }}
                >
                  PLEASE CHECK THE ATTACHED
                </td>
                <td
                  colSpan={2}
                  style={{
                    ...cellBaseStyle,
                    border: BORDER,
                    color: NAVY,
                    fontWeight: 700,
                    textAlign: 'left',
                  }}
                >
                  G.TOTAL{' '}
                </td>
                <td
                  style={{
                    ...cellBaseStyle,
                    border: BORDER,
                    color: BLACK,
                    fontWeight: 400,
                    textAlign: 'right',
                  }}
                >
                  {bilty.grandTotal > 0 ? bilty.grandTotal : ''}
                </td>
              </tr>

              {/* ROW 22 (19.2pt):
                  - A22: "NET WEIGHT" | Calibri 14pt BOLD Navy | Left | Full thin border
                  - B22: [Weight Value] | Calibri 14pt REGULAR Black | Left | Full thin border
                  - C22: "INVOICE FOR MORE INFORMATION" | Calibri 14pt BOLD Navy | Center | Left & Right thin border
                  - D22:E22 (Merged): "ADVANCE" | Calibri 14pt BOLD Navy | Left | Full thin border
                  - F22: [Advance Amt] | Calibri 14pt REGULAR Black | Right | Full thin border
              */}
              <tr style={{ height: '19.2pt' }}>
                <td
                  style={{
                    ...cellBaseStyle,
                    border: BORDER,
                    color: NAVY,
                    fontWeight: 700,
                    textAlign: 'left',
                  }}
                >
                  NET WEIGHT
                </td>
                <td
                  style={{
                    ...cellBaseStyle,
                    border: BORDER,
                    color: BLACK,
                    fontWeight: 400,
                    textAlign: 'left',
                  }}
                >
                  {renderField('netWeight', bilty.netWeight, {
                    align: 'left',
                    bold: false,
                  })}
                </td>
                <td
                  style={{
                    ...cellBaseStyle,
                    borderLeft: BORDER,
                    borderRight: BORDER,
                    color: NAVY,
                    fontWeight: 700,
                    textAlign: 'center',
                  }}
                >
                  INVOICE FOR MORE INFORMATION
                </td>
                <td
                  colSpan={2}
                  style={{
                    ...cellBaseStyle,
                    border: BORDER,
                    color: NAVY,
                    fontWeight: 700,
                    textAlign: 'left',
                  }}
                >
                  ADVANCE
                </td>
                <td
                  style={{
                    ...cellBaseStyle,
                    border: BORDER,
                    color: BLACK,
                    fontWeight: 400,
                    textAlign: 'right',
                  }}
                >
                  {renderField('advance', bilty.advance ? bilty.advance : '', {
                    type: 'number',
                    uppercase: false,
                    align: 'right',
                    bold: false,
                  })}
                </td>
              </tr>

              {/* ROW 23 (19.2pt):
                  - A23: "INVOICE NO" | Calibri 14pt BOLD Navy | Left | Full thin border
                  - B23: [Invoice No Value] | Calibri 14pt REGULAR Black | Left | Full thin border
                  - C23: "" | Top, Left & Right thin border
                  - D23:E23 (Merged): "BALANCE" | Calibri 14pt BOLD Navy | Left | Full thin border
                  - F23: [Balance Amt] | Calibri 14pt REGULAR Black | Right | Full thin border
              */}
              <tr style={{ height: '19.2pt' }}>
                <td
                  style={{
                    ...cellBaseStyle,
                    border: BORDER,
                    color: NAVY,
                    fontWeight: 700,
                    textAlign: 'left',
                  }}
                >
                  INVOICE NO
                </td>
                <td
                  style={{
                    ...cellBaseStyle,
                    border: BORDER,
                    color: BLACK,
                    fontWeight: 400,
                    textAlign: 'left',
                  }}
                >
                  {renderField('invoiceNo', bilty.invoiceNo, {
                    align: 'left',
                    bold: false,
                  })}
                </td>
                <td
                  style={{
                    ...cellBaseStyle,
                    borderTop: BORDER,
                    borderLeft: BORDER,
                    borderRight: BORDER,
                  }}
                >
                  &nbsp;
                </td>
                <td
                  colSpan={2}
                  style={{
                    ...cellBaseStyle,
                    border: BORDER,
                    color: NAVY,
                    fontWeight: 700,
                    textAlign: 'left',
                  }}
                >
                  BALANCE
                </td>
                <td
                  style={{
                    ...cellBaseStyle,
                    border: BORDER,
                    color: BLACK,
                    fontWeight: 400,
                    textAlign: 'right',
                  }}
                >
                  {bilty.balance > 0 ? bilty.balance : ''}
                </td>
              </tr>

              {/* ROW 24 (19.2pt):
                  - A24: "INVOICE VALUE" | Calibri 14pt BOLD Navy | Left | Full thin border
                  - B24: [Invoice Value] | Calibri 14pt REGULAR Black | Left | Full thin border
                  - C24: "IN-DATE  [DD-MM-YYYY]" | Calibri 14pt BOLD Black | Center, Middle | Left & Right thin border
                  - D24:F24 (Merged): "FRIEGHT TO PAY        " (with ✔ if To Pay) | Calibri 14pt BOLD Navy | Left | Full thin border
              */}
              <tr style={{ height: '19.2pt' }}>
                <td
                  style={{
                    ...cellBaseStyle,
                    border: BORDER,
                    color: NAVY,
                    fontWeight: 700,
                    textAlign: 'left',
                  }}
                >
                  INVOICE VALUE
                </td>
                <td
                  style={{
                    ...cellBaseStyle,
                    border: BORDER,
                    color: BLACK,
                    fontWeight: 400,
                    textAlign: 'left',
                  }}
                >
                  {renderField('invoiceValue', bilty.invoiceValue, {
                    uppercase: false,
                    align: 'left',
                    bold: false,
                  })}
                </td>
                <td
                  style={{
                    ...cellBaseStyle,
                    padding: '0px 3pt',
                    borderLeft: BORDER,
                    borderRight: BORDER,
                    color: BLACK,
                    fontWeight: 700,
                    textAlign: 'center',
                    verticalAlign: 'middle',
                    whiteSpace: 'pre',
                  }}
                >
                  {`IN-DATE  ${formattedInDate}`}
                </td>
                <td
                  colSpan={3}
                  onClick={() =>
                    isEditable && onUpdateField && onUpdateField('paymentMode', 'TO_PAY')
                  }
                  style={{
                    ...cellBaseStyle,
                    border: BORDER,
                    color: NAVY,
                    fontWeight: 700,
                    textAlign: 'left',
                    cursor: isEditable ? 'pointer' : 'default',
                    whiteSpace: 'pre',
                  }}
                >
                  <span>FRIEGHT TO PAY</span>
                </td>
              </tr>

              {/* ROW 25 (19.2pt):
                  - A25: "E-WAY BILL NO" | Calibri 14pt BOLD Navy | Left | Full thin border
                  - B25: [E-Way Bill Value] | Calibri 14pt REGULAR Black | Left | Full thin border
                  - C25: "" | Left, Right, Bottom thin border
                  - D25:F25 (Merged): "FRIEGHT TO BE BILD  ✔" | Calibri 14pt BOLD Navy (+ Black Wingdings ✔) | Left | Full thin border
              */}
              <tr style={{ height: '19.2pt' }}>
                <td
                  style={{
                    ...cellBaseStyle,
                    border: BORDER,
                    color: NAVY,
                    fontWeight: 700,
                    textAlign: 'left',
                  }}
                >
                  E-WAY BILL NO
                </td>
                <td
                  style={{
                    ...cellBaseStyle,
                    border: BORDER,
                    color: BLACK,
                    fontWeight: 400,
                    textAlign: 'left',
                  }}
                >
                  {renderField('eWayBillNo', bilty.eWayBillNo, {
                    align: 'left',
                    bold: false,
                  })}
                </td>
                <td
                  style={{
                    ...cellBaseStyle,
                    borderLeft: BORDER,
                    borderRight: BORDER,
                    borderBottom: BORDER,
                  }}
                >
                  &nbsp;
                </td>
                <td
                  colSpan={3}
                  onClick={() =>
                    isEditable &&
                    onUpdateField &&
                    onUpdateField('paymentMode', 'TO_BE_BILLED')
                  }
                  style={{
                    ...cellBaseStyle,
                    border: BORDER,
                    color: NAVY,
                    fontWeight: 700,
                    textAlign: 'left',
                    cursor: isEditable ? 'pointer' : 'default',
                    whiteSpace: 'pre',
                  }}
                >
                  <span>{bottomPaymentLabel}</span>
                </td>
              </tr>

              {/* ROW 26 (49.95pt):
                  - A26:B26 (Merged): "" | Top thin border only (No Left, Right, or Bottom border)
                  - C26:F26 (Merged): "FOR KRISHNA ROADLINES" | Calibri 13.5pt BOLD Navy | Right, Middle | Top thin border only (No Left, Right, or Bottom border)
              */}
              <tr style={{ height: '49.95pt' }}>
                <td
                  colSpan={2}
                  style={{
                    ...cellBaseStyle,
                    height: '49.95pt',
                    borderTop: BORDER,
                    verticalAlign: 'middle',
                    padding: '0px 3pt',
                  }}
                >
                  &nbsp;
                </td>
                <td
                  colSpan={4}
                  style={{
                    ...cellBaseStyle,
                    height: '49.95pt',
                    borderTop: BORDER,
                    color: NAVY,
                    fontWeight: 700,
                    fontSize: '13.5pt',
                    textAlign: 'right',
                    verticalAlign: 'middle',
                    padding: '0px 6px',
                  }}
                >
                  {company.signText || `FOR ${company.companyName || 'KRISHNA ROADLINES'}`}
                </td>
              </tr>
            </>
          )}
        </tbody>
      </table>
    </div>
  );
};

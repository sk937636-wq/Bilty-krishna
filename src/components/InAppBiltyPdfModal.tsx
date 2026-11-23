import React, { useState, useEffect, useRef } from 'react';
import { BiltyRecord, CompanyId } from '../types';
import { DEFAULT_COMPANY_PROFILE, KTC_COMPANY_PROFILE } from '../utils/storage';
import { BiltyPreview } from './BiltyPreview';
import { getInDateDay } from './SharePartyModal';

interface InAppBiltyPdfModalProps {
  record: BiltyRecord | null;
  activeCompany: CompanyId;
  onClose: () => void;
}

// Exact A4 Landscape (297mm × 210mm) & Print Margin geometry matching pdfExport.ts
const DOC_TABLE_WIDTH_PX = 993;
const PRINT_TABLE_WIDTH_MM = 254.22;
const PX_PER_MM = DOC_TABLE_WIDTH_PX / PRINT_TABLE_WIDTH_MM;

const A4_SHEET_WIDTH_PX = Math.round(297 * PX_PER_MM); // 1160px
const A4_SHEET_MIN_HEIGHT_PX = Math.round(210 * PX_PER_MM); // 820px
const PAGE_MARGIN_LEFT_PX = Math.round(23.5 * PX_PER_MM); // 92px (23.50mm)
const PAGE_MARGIN_TOP_PX = Math.round(11.68 * PX_PER_MM); // 46px (11.68mm)
const PAGE_MARGIN_BOTTOM_MIN_PX = Math.round(11.68 * PX_PER_MM); // 46px

export const InAppBiltyPdfModal: React.FC<InAppBiltyPdfModalProps> = ({
  record,
  activeCompany,
  onClose,
}) => {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const onCloseRef = useRef(onClose);
  const hasPushedHistoryRef = useRef(false);
  const [fitScale, setFitScale] = useState(0.32);
  const [tableNaturalHeight, setTableNaturalHeight] = useState(710);

  onCloseRef.current = onClose;

  const isOpen = Boolean(record);

  const sheetHeightPx = Math.max(
    A4_SHEET_MIN_HEIGHT_PX,
    PAGE_MARGIN_TOP_PX + tableNaturalHeight + PAGE_MARGIN_BOTTOM_MIN_PX
  );

  const dd = record ? getInDateDay(record.inDate || record.date) : '';
  const lrPart = record ? (record.lrNo || 'LR').trim().toUpperCase() : '';
  const partyPart = record
    ? (record.partyName || record.consigneeName || '').trim().toUpperCase()
    : '';
  const baseFileName = record
    ? partyPart
      ? `${lrPart} - ${dd} - ${partyPart}`
      : `${lrPart} - ${dd}`
    : '';
  const displayFileName = baseFileName ? `${baseFileName}.pdf` : '';

  const handleUserClose = () => {
    const shouldPop =
      hasPushedHistoryRef.current && Boolean(window.history.state?.biltyFullPreview);
    hasPushedHistoryRef.current = false;
    onCloseRef.current();
    if (shouldPop) {
      window.history.back();
    }
  };

  // Sync document title for clean browser print / save filename
  useEffect(() => {
    if (!record || !baseFileName) return;
    const prevTitle = document.title;
    document.title = baseFileName;
    return () => {
      document.title = prevTitle;
    };
  }, [record, baseFileName]);

  // Support Android/Browser Back button and Escape key to close cleanly without auto-closing on re-renders
  useEffect(() => {
    if (!isOpen) return;

    if (!window.history.state?.biltyFullPreview) {
      window.history.pushState({ biltyFullPreview: true }, '');
    }
    hasPushedHistoryRef.current = true;

    const handlePopState = () => {
      if (hasPushedHistoryRef.current) {
        hasPushedHistoryRef.current = false;
        onCloseRef.current();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleUserClose();
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!record) return;
    const el = viewportRef.current;
    if (!el) return;

    const updateFitScale = () => {
      const style = window.getComputedStyle(el);
      const padX =
        (parseFloat(style.paddingLeft) || 0) + (parseFloat(style.paddingRight) || 0);
      const padY =
        (parseFloat(style.paddingTop) || 0) + (parseFloat(style.paddingBottom) || 0);
      const availableWidth = Math.max(200, el.clientWidth - padX);
      const availableHeight = Math.max(160, el.clientHeight - padY);
      const calculated = Math.min(
        availableWidth / A4_SHEET_WIDTH_PX,
        availableHeight / sheetHeightPx
      );
      setFitScale(calculated);
    };

    updateFitScale();
    const observer = new ResizeObserver(updateFitScale);
    observer.observe(el);
    window.addEventListener('resize', updateFitScale);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateFitScale);
    };
  }, [record, sheetHeightPx]);

  useEffect(() => {
    if (!record) return;
    const tableEl = previewRef.current;
    if (!tableEl) return;

    const measureHeight = () => {
      const h = tableEl.offsetHeight;
      if (h > 0) {
        setTableNaturalHeight(h);
      }
    };

    measureHeight();
    const observer = new ResizeObserver(measureHeight);
    observer.observe(tableEl);
    return () => observer.disconnect();
  }, [record]);

  if (!record) return null;

  const effectiveCompany = record.companyId || activeCompany;
  const isKtc = effectiveCompany === 'KTC';
  const companyProfile = isKtc ? KTC_COMPANY_PROFILE : DEFAULT_COMPANY_PROFILE;

  return (
    <div
      style={{ fontFamily: "'Calibri', sans-serif" }}
      className="fixed inset-0 z-50 w-screen h-screen flex flex-col bg-slate-900/20 backdrop-blur-md print:bg-white print:backdrop-blur-none"
      onClick={handleUserClose}
    >
      {/* Dedicated Top Header Bar: Displays only the PDF file name */}
      <header
        onClick={(e) => e.stopPropagation()}
        className={`no-print shrink-0 h-12 px-4 flex items-center justify-center bg-white/85 backdrop-blur-md border-b shadow-2xs select-text ${
          isKtc ? 'border-red-900/20' : 'border-blue-900/20'
        }`}
      >
        <span
          title={displayFileName}
          style={{
            fontFamily: "'Calibri', sans-serif",
            fontWeight: 900,
            WebkitTextStroke: '0.35px currentColor',
            transform: 'scaleY(1.15)',
          }}
          className={`block max-w-full truncate text-[15px] sm:text-[16px] font-black tracking-wide tabular-nums leading-none ${
            isKtc ? 'text-red-950' : 'text-slate-950'
          }`}
        >
          {displayFileName}
        </span>
      </header>

      {/* Padded Transparent Glass Stage framing the centered white A4 Bilty sheet */}
      <div
        ref={viewportRef}
        className="flex-1 min-h-0 w-full overflow-auto flex p-3 sm:p-5 print:p-0"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            width: `${Math.round(A4_SHEET_WIDTH_PX * fitScale)}px`,
            height: `${Math.round(sheetHeightPx * fitScale)}px`,
          }}
          className="relative bg-white shrink-0 m-auto overflow-hidden rounded-[2px] shadow-2xl ring-1 ring-slate-950/10 print:shadow-none print:ring-0 print:rounded-none"
        >
          <div
            style={{
              width: `${A4_SHEET_WIDTH_PX}px`,
              height: `${sheetHeightPx}px`,
              paddingTop: `${PAGE_MARGIN_TOP_PX}px`,
              paddingLeft: `${PAGE_MARGIN_LEFT_PX}px`,
              transform: `scale(${fitScale})`,
              transformOrigin: 'top left',
              boxSizing: 'border-box',
              backgroundColor: '#ffffff',
            }}
          >
            <div ref={previewRef} style={{ width: `${DOC_TABLE_WIDTH_PX}px` }}>
              <BiltyPreview
                bilty={record}
                company={companyProfile}
                isPrintMode={true}
                isEditable={false}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { BiltyRecord, CompanyId } from '../types';
import { DEFAULT_COMPANY_PROFILE, KTC_COMPANY_PROFILE } from '../utils/storage';
import { BiltyPreview } from './BiltyPreview';

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

function getInDateDay(dateStr?: string): string {
  if (!dateStr) {
    return String(new Date().getDate()).padStart(2, '0');
  }
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      return parts[2].padStart(2, '0');
    }
    return parts[0].padStart(2, '0');
  }
  return dateStr;
}

export const InAppBiltyPdfModal: React.FC<InAppBiltyPdfModalProps> = ({
  record,
  activeCompany,
  onClose,
}) => {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const closedByPopStateRef = useRef(false);
  const [fitScale, setFitScale] = useState(0.32);
  const [tableNaturalHeight, setTableNaturalHeight] = useState(710);

  const sheetHeightPx = Math.max(
    A4_SHEET_MIN_HEIGHT_PX,
    PAGE_MARGIN_TOP_PX + tableNaturalHeight + PAGE_MARGIN_BOTTOM_MIN_PX
  );

  // Sync document title for clean browser print / save filename
  useEffect(() => {
    if (!record) return;
    const prevTitle = document.title;
    const dd = getInDateDay(record.inDate || record.date);
    const party = (record.partyName || record.consigneeName || '').trim().toUpperCase();
    document.title = party
      ? `${record.lrNo} - ${dd} - ${party}`
      : `${record.lrNo} - ${dd}`;
    return () => {
      document.title = prevTitle;
    };
  }, [record]);

  // Support Android/Browser Back button and Escape key to close cleanly
  useEffect(() => {
    if (!record) return;
    closedByPopStateRef.current = false;
    window.history.pushState({ biltyFullPreview: true }, '');

    const handlePopState = () => {
      closedByPopStateRef.current = true;
      onClose();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeyDown);
      if (!closedByPopStateRef.current && window.history.state?.biltyFullPreview) {
        window.history.back();
      }
    };
  }, [record, onClose]);

  useEffect(() => {
    if (!record) return;
    const el = viewportRef.current;
    if (!el) return;

    const updateFitScale = () => {
      const availableWidth = Math.max(240, el.clientWidth);
      const availableHeight = Math.max(200, el.clientHeight);
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
      ref={viewportRef}
      style={{ fontFamily: "'Calibri', sans-serif" }}
      className="fixed inset-0 z-50 w-screen h-screen overflow-auto bg-white flex"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: `${Math.round(A4_SHEET_WIDTH_PX * fitScale)}px`,
          height: `${Math.round(sheetHeightPx * fitScale)}px`,
        }}
        className="relative bg-white shrink-0 m-auto overflow-hidden"
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
  );
};

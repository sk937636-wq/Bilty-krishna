import React from 'react';
import { BiltyRecord, CompanyProfile } from '../types';
import {
  X,
  FileText,
  FileDown,
  FileSpreadsheet,
  Printer,
  MessageCircle,
  Edit,
  Trash2,
  Calendar,
  Truck,
  Layers,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { shareBiltyOnWhatsApp } from '../utils/whatsapp';
import { exportBiltyToExcelLr } from '../utils/excelLrExport';

interface BiltyActionModalProps {
  record: BiltyRecord | null;
  company: CompanyProfile;
  isOpen: boolean;
  onClose: () => void;
  onPreview: (record: BiltyRecord) => void;
  onDownloadPdf: (record: BiltyRecord) => void;
  onPrint: (record: BiltyRecord) => void;
  onEdit: (record: BiltyRecord) => void;
  onDelete: (id: string) => void;
}

export const BiltyActionModal: React.FC<BiltyActionModalProps> = ({
  record,
  company,
  isOpen,
  onClose,
  onPreview,
  onDownloadPdf,
  onPrint,
  onEdit,
  onDelete,
}) => {
  if (!isOpen || !record) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-mono font-bold text-sm shadow-xs">
              LR
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 font-mono">
                  #{record.lrNo}
                </h3>
                <span className="text-[10px] font-mono font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  {record.vehicleNo}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {record.date || record.inDate} &bull; {record.vehicleSize || '22 FT'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Details summary */}
        <div className="p-4 bg-slate-50/50 border-b border-slate-100 grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">
              <strong>From:</strong> {record.fromCity || 'Ghaziabad'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">
              <strong>To:</strong> {record.toCity || 'All India'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">
              <strong>Size:</strong> {record.vehicleSize || '22 FT'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">
              <strong>Date:</strong> {record.date || record.inDate}
            </span>
          </div>
        </div>

        {/* Action Buttons list */}
        <div className="p-4 space-y-2">
          {/* 1. Full Preview / View Document */}
          <button
            onClick={() => {
              onPreview(record);
              onClose();
            }}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors cursor-pointer shadow-xs group"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4 text-emerald-400" />
              <div className="text-left">
                <div className="text-xs font-bold">Open Preview &amp; Document</div>
                <div className="text-[10px] text-slate-300">Krishna Roadlines Bilty print layout</div>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
          </button>

          {/* 2. Download Exact Excel LR (.xlsx) */}
          <button
            onClick={() => {
              exportBiltyToExcelLr(record, company);
              onClose();
            }}
            className="w-full flex items-center gap-3 p-3 rounded-xl border border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50/60 text-slate-800 transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-slate-900">Download Excel LR (.xlsx)</div>
              <div className="text-[10px] text-slate-500">Exact &quot;1 - LR - R.xlsx&quot; format with logo &amp; borders</div>
            </div>
          </button>

          {/* 3. Download PDF */}
          <button
            onClick={() => {
              onDownloadPdf(record);
              onClose();
            }}
            className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 text-slate-800 transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <FileDown className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-slate-900">Download PDF</div>
              <div className="text-[10px] text-slate-500">Standard A4 Print-ready PDF file</div>
            </div>
          </button>

          {/* 3. WhatsApp Share */}
          <button
            onClick={() => {
              shareBiltyOnWhatsApp(record, company);
              onClose();
            }}
            className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50 text-slate-800 transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <MessageCircle className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-slate-900">Share on WhatsApp</div>
              <div className="text-[10px] text-slate-500">Party ya driver ko direct WhatsApp karein</div>
            </div>
          </button>

          {/* 4. Direct Print */}
          <button
            onClick={() => {
              onPrint(record);
              onClose();
            }}
            className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800 transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
              <Printer className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-slate-900">Direct Print</div>
              <div className="text-[10px] text-slate-500">Printer se turant print karein</div>
            </div>
          </button>

          {/* 5. Edit & Delete Row */}
          <div className="pt-2 flex items-center gap-2">
            <button
              onClick={() => {
                onEdit(record);
                onClose();
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit Details</span>
            </button>

            <button
              onClick={() => {
                if (window.confirm(`Kya aap LR #${record.lrNo} ko delete karna chahte hain?`)) {
                  onDelete(record.id);
                  onClose();
                }
              }}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-red-200 hover:bg-red-50 text-red-600 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

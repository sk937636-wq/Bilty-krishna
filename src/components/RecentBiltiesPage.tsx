import React, { useState, useMemo } from 'react';
import { BiltyRecord, CompanyProfile } from '../types';
import {
  Search,
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
  ArrowUpDown,
  Filter,
  Plus,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { shareBiltyOnWhatsApp } from '../utils/whatsapp';
import { exportBiltyToExcelLr } from '../utils/excelLrExport';

interface RecentBiltiesPageProps {
  records: BiltyRecord[];
  company: CompanyProfile;
  onSelectRecordForPreview: (record: BiltyRecord) => void;
  onEditRecord: (record: BiltyRecord) => void;
  onDeleteRecord: (id: string) => void;
  onPrintRecord: (record: BiltyRecord) => void;
  onDownloadPdf: (record: BiltyRecord) => void;
  onOpenAddModal: () => void;
}

export const RecentBiltiesPage: React.FC<RecentBiltiesPageProps> = ({
  records,
  company,
  onSelectRecordForPreview,
  onEditRecord,
  onDeleteRecord,
  onPrintRecord,
  onDownloadPdf,
  onOpenAddModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const filteredRecords = useMemo(() => {
    const term = (searchTerm || '').toLowerCase().trim();
    return [...(records || [])]
      .filter((rec) => {
        if (!rec) return false;
        if (!term) return true;
        const lr = (rec.lrNo || '').toLowerCase();
        const veh = (rec.vehicleNo || '').toLowerCase();
        const size = (rec.vehicleSize || '').toLowerCase();
        const from = (rec.fromCity || '').toLowerCase();
        const to = (rec.toCity || '').toLowerCase();
        const cnor = (rec.consignorName || '').toLowerCase();
        const cnee = (rec.consigneeName || '').toLowerCase();
        const date = (rec.date || rec.inDate || '');
        return (
          lr.includes(term) ||
          veh.includes(term) ||
          size.includes(term) ||
          from.includes(term) ||
          to.includes(term) ||
          cnor.includes(term) ||
          cnee.includes(term) ||
          date.includes(term)
        );
      })
      .sort((a, b) => {
        const timeA = a.createdAt || (a.date ? new Date(a.date).getTime() : 0) || 0;
        const timeB = b.createdAt || (b.date ? new Date(b.date).getTime() : 0) || 0;
        return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
      });
  }, [records, searchTerm, sortOrder]);

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Top Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-xs">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900">
                Recent Bilties
              </h1>
              <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                {records.length} saved
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Yahan aapki saari banayi hui bilties surakshit save rehti hain
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
            <span>+ Add Bilty</span>
          </button>
        </div>
      </div>

      {/* Search & Sort Bar */}
      <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by LR No, Vehicle No, City, Date..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-slate-400 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium transition-colors cursor-pointer"
            title="Sort records by date"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>Date {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}</span>
          </button>
        </div>
      </div>

      {/* Bilties List */}
      {filteredRecords.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-2xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            {searchTerm ? 'Koi match nahi mila' : 'Abhi tak koi bilty save nahi hai'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchTerm
              ? 'Kripya doosra LR No ya Vehicle No search karein.'
              : 'Upar "+ Add Bilty" dabayein aur apni pehli transport bilty banayein.'}
          </p>
          {!searchTerm && (
            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer mt-2"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Pehli Bilty Banayein</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredRecords.map((rec) => (
            <div
              key={rec.id}
              className="bg-white rounded-xl border border-slate-200 hover:border-slate-400 hover:shadow-sm p-4 transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Top Row: LR Number & Vehicle */}
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black font-mono text-slate-900 group-hover:text-blue-600 transition-colors">
                        LR #{rec.lrNo}
                      </span>
                      <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                        {rec.vehicleNo || 'NO VEHICLE'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                      <span>Date: {rec.date || rec.inDate}</span>
                      {rec.vehicleSize && (
                        <>
                          <span>&bull;</span>
                          <span className="font-mono text-slate-600 font-semibold">{rec.vehicleSize}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => onSelectRecordForPreview(rec)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Open Full Preview"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>

                {/* Middle Info: Route & Consignor */}
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mb-4">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Route:</span>
                    <span className="font-semibold text-slate-800 truncate block">
                      {rec.fromCity || 'GHAZIABAD'} &rarr; {rec.toCity || 'MUMBAI'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Packages / Qty:</span>
                    <span className="font-semibold text-slate-800 truncate block">
                      {rec.packages || '1'} {rec.packingType || 'PKGS'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Action Buttons Toolbar */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1 text-xs">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onSelectRecordForPreview(rec)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-[11px] transition-colors cursor-pointer"
                    title="Open Document Preview"
                  >
                    <FileText className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Preview</span>
                  </button>

                  <button
                    onClick={() => exportBiltyToExcelLr(rec, company)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100 text-emerald-800 font-semibold text-[11px] transition-colors cursor-pointer"
                    title="Download Exact Excel LR (.xlsx)"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Excel</span>
                  </button>

                  <button
                    onClick={() => onDownloadPdf(rec)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-blue-50 hover:text-blue-700 text-slate-700 font-semibold text-[11px] transition-colors cursor-pointer"
                    title="Download A4 PDF"
                  >
                    <FileDown className="w-3.5 h-3.5 text-blue-600" />
                    <span>PDF</span>
                  </button>

                  <button
                    onClick={() => shareBiltyOnWhatsApp(rec, company)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 font-semibold text-[11px] transition-colors cursor-pointer"
                    title="Share via WhatsApp"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>WhatsApp</span>
                  </button>

                  <button
                    onClick={() => onPrintRecord(rec)}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                    title="Print Document"
                  >
                    <Printer className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onEditRecord(rec)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                    title="Edit Bilty"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => {
                      if (window.confirm(`Delete LR #${rec.lrNo}?`)) {
                        onDeleteRecord(rec.id);
                      }
                    }}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                    title="Delete Record"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

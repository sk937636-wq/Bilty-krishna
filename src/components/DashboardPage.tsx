import React, { useState, useMemo } from 'react';
import { BiltyRecord, CompanyProfile } from '../types';
import {
  Plus,
  FileText,
  Search,
  Truck,
  Calendar,
  Layers,
  MapPin,
  Sparkles,
  ChevronRight,
  Clock,
  Smartphone,
} from 'lucide-react';
import { BiltyActionModal } from './BiltyActionModal';

interface DashboardPageProps {
  records: BiltyRecord[];
  company: CompanyProfile;
  nextLrNumber: string;
  onOpenAddModal: () => void;
  onOpenInstallModal?: () => void;
  onSelectBiltyForPreview: (record: BiltyRecord) => void;
  onDownloadPdf: (record: BiltyRecord) => void;
  onPrintBilty: (record: BiltyRecord) => void;
  onEditBilty: (record: BiltyRecord) => void;
  onDeleteBilty: (id: string) => void;
  onNavigateToRecent: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  records,
  company,
  nextLrNumber,
  onOpenAddModal,
  onOpenInstallModal,
  onSelectBiltyForPreview,
  onDownloadPdf,
  onPrintBilty,
  onEditBilty,
  onDeleteBilty,
  onNavigateToRecent,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecordForActions, setSelectedRecordForActions] = useState<BiltyRecord | null>(null);

  // Filter and sort by latest
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
        const date = (rec.date || rec.inDate || '');
        return (
          lr.includes(term) ||
          veh.includes(term) ||
          size.includes(term) ||
          from.includes(term) ||
          to.includes(term) ||
          date.includes(term)
        );
      })
      .sort((a, b) => {
        const timeA = a.createdAt || (a.date ? new Date(a.date).getTime() : 0) || 0;
        const timeB = b.createdAt || (b.date ? new Date(b.date).getTime() : 0) || 0;
        return timeB - timeA;
      });
  }, [records, searchTerm]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Main Section: Clean Bar with Company & Prominent "+ Add Bilty" Button */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 font-serif">
              {company?.companyName || 'KRISHNA ROADLINES'}
            </h1>
            <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
              Bilty
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {company?.routes || 'Transport Contractor & Fleet Owner'}
          </p>
        </div>

        {/* Actions CTA Group */}
        <div className="flex items-center gap-2">
          {onOpenInstallModal && (
            <button
              onClick={onOpenInstallModal}
              className="flex items-center gap-1.5 px-3.5 py-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-98"
              title="Apne phone me app install karein"
            >
              <Smartphone className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Install App</span>
            </button>
          )}

          {/* The Single Central "+ Add Bilty" CTA Button */}
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer transform active:scale-98"
          >
            <Plus className="w-5 h-5 text-emerald-400 stroke-[3]" />
            <span>+ Add Bilty</span>
            <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono ml-1">
              #{nextLrNumber}
            </span>
          </button>
        </div>
      </div>

      {/* LR Numbers Grid Display on Home Page */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 px-1">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
              Bilty Records (Click to View / Export)
            </h2>
            <span className="text-xs font-mono font-bold bg-slate-200/80 text-slate-700 px-2 py-0.2 rounded-full">
              {records.length}
            </span>
          </div>

          {/* Quick Search for LR */}
          {records.length > 4 && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search LR / Gadi No..."
                className="bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-slate-400 transition-colors w-48 sm:w-56"
              />
            </div>
          )}
        </div>

        {filteredRecords.length === 0 ? (
          <div
            onClick={onOpenAddModal}
            className="bg-white rounded-2xl p-10 text-center border-2 border-dashed border-slate-200 hover:border-slate-400 cursor-pointer transition-colors space-y-3"
          >
            <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto">
              <Plus className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Abhi tak koi bilty nahi hai
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Yahan click karein ya upar &quot;+ Add Bilty&quot; dabakar 4 cards se pehli bilty banayein.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredRecords.map((rec) => (
              <div
                key={rec.id}
                onClick={() => setSelectedRecordForActions(rec)}
                className="bg-white rounded-xl border border-slate-200 hover:border-slate-800 hover:shadow-md p-4 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  {/* Card Header: LR Number prominent display */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-400 font-semibold">LR</span>
                      <span className="text-lg font-black font-mono text-slate-900 group-hover:text-blue-600 transition-colors">
                        #{rec.lrNo}
                      </span>
                    </div>

                    <span className="text-xs font-mono font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                      {rec.vehicleNo || 'NO VEHICLE'}
                    </span>
                  </div>

                  {/* Card Details: Date & Feet */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mt-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{rec.date || rec.inDate}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate font-mono font-medium">{rec.vehicleSize || '22 FT'}</span>
                    </div>
                  </div>

                  {/* Route */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate font-medium">
                      {rec.fromCity || 'Ghaziabad'} &rarr; {rec.toCity || 'Mumbai'}
                    </span>
                  </div>
                </div>

                {/* Click hint footer */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 group-hover:text-slate-700 transition-colors">
                  <span className="font-medium">Options (PDF / Print / Share)</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Modal when clicking on any LR card */}
      <BiltyActionModal
        isOpen={!!selectedRecordForActions}
        record={selectedRecordForActions}
        company={company}
        onClose={() => setSelectedRecordForActions(null)}
        onPreview={(rec) => {
          onSelectBiltyForPreview(rec);
        }}
        onDownloadPdf={(rec) => {
          onDownloadPdf(rec);
        }}
        onPrint={(rec) => {
          onPrintBilty(rec);
        }}
        onEdit={(rec) => {
          onEditBilty(rec);
        }}
        onDelete={(id) => {
          onDeleteBilty(id);
        }}
      />
    </div>
  );
};

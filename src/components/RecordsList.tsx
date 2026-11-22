import React, { useState, useMemo } from 'react';
import { BiltyRecord, CompanyProfile } from '../types';
import {
  Search,
  Eye,
  Edit2,
  Trash2,
  Copy,
  Printer,
  FileDown,
  Download,
  Upload,
  Filter,
  Truck,
  Hash,
  ArrowUpDown,
  MessageCircle,
} from 'lucide-react';
import { shareBiltyOnWhatsApp } from '../utils/whatsapp';

interface RecordsListProps {
  records: BiltyRecord[];
  company?: CompanyProfile;
  onSelectRecord: (record: BiltyRecord) => void;
  onEditRecord: (record: BiltyRecord) => void;
  onDuplicateRecord: (record: BiltyRecord) => void;
  onDeleteRecord: (id: string) => void;
  onPrintRecord: (record: BiltyRecord) => void;
  onDownloadPdf: (record: BiltyRecord) => void;
  onExportCsv: () => void;
  onImportBackup: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const RecordsList: React.FC<RecordsListProps> = ({
  records,
  company,
  onSelectRecord,
  onEditRecord,
  onDuplicateRecord,
  onDeleteRecord,
  onPrintRecord,
  onDownloadPdf,
  onExportCsv,
  onImportBackup,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'date' | 'lrNo'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const filteredRecords = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return records
      .filter((rec) => {
        const matchesSearch =
          rec.lrNo.toLowerCase().includes(term) ||
          rec.vehicleNo.toLowerCase().includes(term) ||
          rec.consignorName.toLowerCase().includes(term) ||
          rec.consigneeName.toLowerCase().includes(term) ||
          rec.fromCity.toLowerCase().includes(term) ||
          rec.toCity.toLowerCase().includes(term) ||
          rec.date.includes(term);

        if (!matchesSearch) return false;

        if (filterMode === 'ALL') return true;
        if (filterMode === 'TO_BE_BILLED') return rec.paymentMode === 'TO_BE_BILLED';
        if (filterMode === 'TO_PAY') return rec.paymentMode === 'TO_PAY';
        if (filterMode === 'PAID') return rec.paymentMode === 'PAID';
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'lrNo') {
          const numA = parseInt(a.lrNo.replace(/\D/g, '') || '0', 10);
          const numB = parseInt(b.lrNo.replace(/\D/g, '') || '0', 10);
          return sortOrder === 'asc' ? numA - numB : numB - numA;
        } else {
          const dateA = new Date(a.date).getTime() || 0;
          const dateB = new Date(b.date).getTime() || 0;
          return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        }
      });
  }, [records, searchTerm, filterMode, sortBy, sortOrder]);

  const stats = useMemo(() => {
    const totalCount = records.length;
    const totalFreight = records.reduce((acc, r) => acc + (Number(r.grandTotal) || 0), 0);
    const totalBalance = records.reduce((acc, r) => acc + (Number(r.balance) || 0), 0);
    return { totalCount, totalFreight, totalBalance };
  }, [records]);

  return (
    <div className="space-y-4">
      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase">Total Bilties</p>
            <p className="text-xl font-black text-gray-900 mt-0.5">{stats.totalCount}</p>
          </div>
          <span className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <Truck className="w-5 h-5" />
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase">Total Grand Value</p>
            <p className="text-xl font-black text-blue-900 mt-0.5 font-mono">
              ₹ {stats.totalFreight.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </p>
          </div>
          <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg font-bold text-base">
            ₹
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase">Total Balance Due</p>
            <p className="text-xl font-black text-red-700 mt-0.5 font-mono">
              ₹ {stats.totalBalance.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </p>
          </div>
          <span className="p-2 bg-red-50 text-red-600 rounded-lg">
            <Hash className="w-5 h-5" />
          </span>
        </div>
      </div>

      {/* Search & Action Toolbar */}
      <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by LR No, Vehicle, Consignor, Consignee, City..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 text-xs">
          <button
            onClick={() => setFilterMode('ALL')}
            className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
              filterMode === 'ALL' ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterMode('TO_BE_BILLED')}
            className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
              filterMode === 'TO_BE_BILLED'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            To Be Billed
          </button>
          <button
            onClick={() => setFilterMode('TO_PAY')}
            className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
              filterMode === 'TO_PAY'
                ? 'bg-amber-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            To Pay
          </button>
          <button
            onClick={() => setFilterMode('PAID')}
            className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
              filterMode === 'PAID'
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Paid
          </button>
        </div>

        {/* Export / Backup buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onExportCsv}
            title="Export records to Excel CSV"
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg shadow-2xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            Excel Export
          </button>

          <label
            title="Restore backup JSON file"
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg shadow-2xs cursor-pointer transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-blue-600" />
            Import
            <input
              type="file"
              accept=".json"
              onChange={onImportBackup}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-700">
            <thead className="bg-slate-50 text-gray-600 font-bold border-b border-gray-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-3">
                  <button
                    onClick={() => {
                      if (sortBy === 'lrNo') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      else {
                        setSortBy('lrNo');
                        setSortOrder('desc');
                      }
                    }}
                    className="flex items-center gap-1 hover:text-blue-600 font-bold"
                  >
                    LR NO
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3 px-3">
                  <button
                    onClick={() => {
                      if (sortBy === 'date') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      else {
                        setSortBy('date');
                        setSortOrder('desc');
                      }
                    }}
                    className="flex items-center gap-1 hover:text-blue-600 font-bold"
                  >
                    DATE
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3 px-3">VEHICLE &amp; SIZE</th>
                <th className="py-3 px-3">ROUTE</th>
                <th className="py-3 px-3">CONSIGNOR / CONSIGNEE</th>
                <th className="py-3 px-3">NET WEIGHT</th>
                <th className="py-3 px-3 text-right">G.TOTAL</th>
                <th className="py-3 px-3 text-right">BALANCE</th>
                <th className="py-3 px-3 text-center">STATUS</th>
                <th className="py-3 px-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-gray-400">
                    Koi record nahi mila. &quot;New Bilty&quot; pe click karke nayi entry karein.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec) => (
                  <tr
                    key={rec.id}
                    className="hover:bg-blue-50/40 transition-colors group cursor-pointer"
                    onClick={() => onSelectRecord(rec)}
                  >
                    {/* LR NO */}
                    <td className="py-2.5 px-3">
                      <span className="font-mono font-black text-red-700 text-xs px-2 py-0.5 bg-red-50 rounded border border-red-200">
                        {rec.lrNo}
                      </span>
                    </td>

                    {/* DATE */}
                    <td className="py-2.5 px-3 font-mono text-gray-600 whitespace-nowrap">
                      {rec.date}
                    </td>

                    {/* VEHICLE NO & SIZE */}
                    <td className="py-2.5 px-3">
                      <div className="font-mono font-bold text-gray-900">{rec.vehicleNo}</div>
                      <div className="text-[10px] text-gray-500 font-semibold">{rec.vehicleSize}</div>
                    </td>

                    {/* ROUTE */}
                    <td className="py-2.5 px-3">
                      <div className="text-gray-900 font-semibold uppercase">{rec.fromCity}</div>
                      <div className="text-[10px] text-gray-500 uppercase">→ {rec.toCity}</div>
                    </td>

                    {/* PARTIES */}
                    <td className="py-2.5 px-3 max-w-[200px]">
                      <div className="font-bold text-blue-950 truncate uppercase">{rec.consignorName}</div>
                      <div className="text-[10px] text-gray-500 truncate uppercase">To: {rec.consigneeName}</div>
                    </td>

                    {/* NET WEIGHT */}
                    <td className="py-2.5 px-3 font-mono text-gray-700 whitespace-nowrap">
                      {rec.netWeight || '—'}
                    </td>

                    {/* GRAND TOTAL */}
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-gray-900 whitespace-nowrap">
                      ₹ {rec.grandTotal.toFixed(2)}
                    </td>

                    {/* BALANCE */}
                    <td className="py-2.5 px-3 text-right font-mono font-black text-red-700 whitespace-nowrap">
                      ₹ {rec.balance.toFixed(2)}
                    </td>

                    {/* STATUS */}
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      {rec.paymentMode === 'TO_BE_BILLED' && (
                        <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">
                          To Be Billed
                        </span>
                      )}
                      {rec.paymentMode === 'TO_PAY' && (
                        <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                          To Pay
                        </span>
                      )}
                      {rec.paymentMode === 'PAID' && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                          Paid
                        </span>
                      )}
                    </td>

                    {/* ACTIONS */}
                    <td
                      className="py-2.5 px-4 text-right whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        {company && (
                          <button
                            onClick={() => shareBiltyOnWhatsApp(rec, company)}
                            title="WhatsApp par Bilty share karein"
                            className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded transition-colors"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          onClick={() => onSelectRecord(rec)}
                          title="Preview Bilty"
                          className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onDownloadPdf(rec)}
                          title="Download PDF"
                          className="p-1.5 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                        >
                          <FileDown className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onPrintRecord(rec)}
                          title="Print Bilty"
                          className="p-1.5 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onDuplicateRecord(rec)}
                          title="Duplicate with LR+1"
                          className="p-1.5 text-gray-600 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onEditRecord(rec)}
                          title="Edit"
                          className="p-1.5 text-gray-600 hover:text-slate-900 hover:bg-gray-100 rounded transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onDeleteRecord(rec.id)}
                          title="Delete"
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

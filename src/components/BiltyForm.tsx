import React, { useState, useEffect, useMemo } from 'react';
import { BiltyRecord, GstType, PaymentMode } from '../types';
import {
  Save,
  PlusCircle,
  Calculator,
  Truck,
  FileText,
  Building,
  DollarSign,
  Calendar,
  Sparkles,
} from 'lucide-react';

interface BiltyFormProps {
  initialData: BiltyRecord;
  onSave: (record: BiltyRecord, andNext?: boolean) => void;
  isEditingExisting?: boolean;
  onCancel?: () => void;
  recentVehicles?: string[];
  recentParties?: { name: string; gst: string; address: string }[];
}

const VEHICLE_SIZE_PRESETS = [
  '14 FEET',
  '17 FEET',
  '19 FEET',
  '22 FEET',
  '24 FEET',
  '32 FT SXL',
  '32 FT MXL',
  'CONTAINER',
  'CANTER',
];

export const BiltyForm: React.FC<BiltyFormProps> = ({
  initialData,
  onSave,
  isEditingExisting = false,
  onCancel,
  recentVehicles = [],
  recentParties = [],
}) => {
  const [form, setForm] = useState<BiltyRecord>({ ...initialData });

  // Update form if initialData changes (e.g., when clicking edit on another bilty)
  useEffect(() => {
    setForm({ ...initialData });
  }, [initialData]);

  // Handle generic field change
  const handleChange = (field: keyof BiltyRecord, value: any) => {
    setForm((prev) => {
      const updated = { ...prev, [field]: value };
      return calculateFinancials(updated);
    });
  };

  // Helper for numeric inputs
  const handleNumberChange = (field: 'freight' | 'otherCharges' | 'advance' | 'gstRate', rawVal: string) => {
    const num = parseFloat(rawVal) || 0;
    setForm((prev) => {
      const updated = { ...prev, [field]: num };
      return calculateFinancials(updated);
    });
  };

  // Live calculation of Total, GST, Grand Total, and Balance
  const calculateFinancials = (data: BiltyRecord): BiltyRecord => {
    const freight = Number(data.freight) || 0;
    const otherCharges = Number(data.otherCharges) || 0;
    const total = freight + otherCharges;

    let sgstAmount = 0;
    let cgstAmount = 0;
    let igstAmount = 0;
    const rate = Number(data.gstRate) || 18;

    if (data.gstType === 'CGST_SGST') {
      const halfRate = rate / 2;
      sgstAmount = (total * halfRate) / 100;
      cgstAmount = (total * halfRate) / 100;
    } else if (data.gstType === 'IGST') {
      igstAmount = (total * rate) / 100;
    }

    const totalGst = sgstAmount + cgstAmount + igstAmount;
    const grandTotal = total + totalGst;
    const advance = Number(data.advance) || 0;
    const balance = Math.max(0, grandTotal - advance);

    return {
      ...data,
      freight,
      otherCharges,
      total,
      sgstAmount,
      cgstAmount,
      igstAmount,
      grandTotal,
      advance,
      balance,
    };
  };

  const handleIncrementLr = () => {
    const current = form.lrNo.trim();
    const match = current.match(/^(.*?)(\d+)$/);
    if (match) {
      const prefix = match[1];
      const numStr = match[2];
      const nextVal = parseInt(numStr, 10) + 1;
      const padded = nextVal.toString().padStart(numStr.length, '0');
      handleChange('lrNo', `${prefix}${padded}`);
    } else {
      handleChange('lrNo', `${current}-1`);
    }
  };

  const setTodayDate = (field: 'date' | 'inDate') => {
    const today = new Date().toISOString().split('T')[0];
    handleChange(field, today);
  };

  const handleSelectConsignor = (party: { name: string; gst: string; address: string }) => {
    setForm((prev) => ({
      ...prev,
      consignorName: party.name,
      consignorGst: party.gst,
      consignorAddress: party.address,
    }));
  };

  const handleSelectConsignee = (party: { name: string; gst: string; address: string }) => {
    setForm((prev) => ({
      ...prev,
      consigneeName: party.name,
      consigneeGst: party.gst,
      consigneeAddress: party.address,
    }));
  };

  const handleSubmit = (e: React.FormEvent, andNext = false) => {
    e.preventDefault();
    onSave(form, andNext);
  };

  return (
    <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-5 text-gray-800">
      {/* Top Banner: LR Number & Date & Vehicle Controls */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <Truck className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-gray-900 text-sm md:text-base">
                {isEditingExisting ? `Edit Bilty / LR #${form.lrNo}` : 'New Bilty Entry'}
              </h3>
              <p className="text-xs text-gray-500">
                LR number, vehicle details, date aur financial calculations enter karein
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isEditingExisting && (
              <span className="text-[11px] bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200 font-medium flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Auto LR Incremented
              </span>
            )}
          </div>
        </div>

        {/* Essential Core Fields Row: LR NO, DATE, VEHICLE NO, VEHICLE SIZE */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* LR NO with Auto +1 button */}
          <div className="bg-amber-50/50 p-2.5 rounded-lg border border-amber-200/80">
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-black text-amber-900 uppercase">
                LR NO. (Bilty No) *
              </label>
              <button
                type="button"
                onClick={handleIncrementLr}
                title="Increase LR number by 1"
                className="text-[10px] font-bold text-amber-800 bg-amber-200/70 hover:bg-amber-300 px-2 py-0.5 rounded transition-colors"
              >
                +1 Next
              </button>
            </div>
            <input
              type="text"
              required
              value={form.lrNo}
              onChange={(e) => handleChange('lrNo', e.target.value.toUpperCase())}
              placeholder="e.g. 7974 or 102"
              className="w-full bg-white border border-amber-300 rounded-md px-3 py-1.5 text-base font-black text-red-700 tracking-wider font-mono uppercase focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            />
            <span className="text-[10px] text-amber-700 mt-1 block">
              Agli bilty me yeh number automatically +1 ho jayega
            </span>
          </div>

          {/* DATE */}
          <div className="p-2.5 rounded-lg border border-gray-200 bg-slate-50/50">
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-gray-700 uppercase">Date *</label>
              <button
                type="button"
                onClick={() => setTodayDate('date')}
                className="text-[10px] text-blue-600 hover:underline font-semibold"
              >
                Today
              </button>
            </div>
            <input
              type="date"
              required
              value={form.date}
              onChange={(e) => handleChange('date', e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-md px-3 py-1.5 text-sm font-semibold text-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          {/* VEHICLE NO */}
          <div className="p-2.5 rounded-lg border border-gray-200 bg-slate-50/50">
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Vehicle Number *
            </label>
            <input
              type="text"
              required
              value={form.vehicleNo}
              onChange={(e) => handleChange('vehicleNo', e.target.value.toUpperCase())}
              placeholder="e.g. UP14PT7105"
              className="w-full bg-white border border-gray-300 rounded-md px-3 py-1.5 text-sm font-bold font-mono uppercase text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
            {recentVehicles.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {recentVehicles.slice(0, 3).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => handleChange('vehicleNo', v)}
                    className="text-[9.5px] font-mono bg-white border border-gray-300 hover:border-blue-500 px-1.5 py-0.5 rounded text-gray-700 hover:text-blue-700"
                  >
                    {v}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* VEHICLE SIZE */}
          <div className="p-2.5 rounded-lg border border-gray-200 bg-slate-50/50">
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Vehicle Size *
            </label>
            <input
              type="text"
              value={form.vehicleSize}
              onChange={(e) => handleChange('vehicleSize', e.target.value.toUpperCase())}
              placeholder="e.g. 22 FEET"
              className="w-full bg-white border border-gray-300 rounded-md px-3 py-1.5 text-sm font-bold uppercase text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
            <div className="flex flex-wrap gap-1 mt-1.5">
              {['22 FEET', '14 FEET', '19 FEET', '32 FT'].map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => handleChange('vehicleSize', size)}
                  className={`text-[9.5px] px-1.5 py-0.5 rounded font-semibold border ${
                    form.vehicleSize === size
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white border-gray-300 text-gray-600 hover:border-blue-400'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Route Row: From and To */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">FROM *</label>
            <input
              type="text"
              required
              value={form.fromCity}
              onChange={(e) => handleChange('fromCity', e.target.value.toUpperCase())}
              placeholder="e.g. GHAZIABAD / DELHI"
              className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm font-semibold uppercase text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">TO *</label>
            <input
              type="text"
              required
              value={form.toCity}
              onChange={(e) => handleChange('toCity', e.target.value.toUpperCase())}
              placeholder="e.g. JAIPUR / MUMBAI"
              className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm font-semibold uppercase text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* Consignor and Consignee Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Consignor (Sender) Box */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <div className="flex items-center gap-1.5 text-blue-900 font-bold text-sm">
              <Building className="w-4 h-4 text-blue-600" />
              <span>CONSIGNOR (Sender / Mal Bhejne Wala)</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">CONSIGNOR NAME *</label>
            <input
              type="text"
              required
              value={form.consignorName}
              onChange={(e) => handleChange('consignorName', e.target.value.toUpperCase())}
              placeholder="e.g. SHREE GANESH ENTERPRISES"
              className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm font-semibold uppercase focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">GST IN</label>
            <input
              type="text"
              value={form.consignorGst}
              onChange={(e) => handleChange('consignorGst', e.target.value.toUpperCase())}
              placeholder="e.g. 09AAACG1234F1Z8"
              className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm font-mono uppercase focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">ADDRESS</label>
            <textarea
              rows={2}
              value={form.consignorAddress}
              onChange={(e) => handleChange('consignorAddress', e.target.value.toUpperCase())}
              placeholder="e.g. PLOT NO 45, INDUSTRIAL AREA, GHAZIABAD"
              className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-xs uppercase focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Consignee (Receiver) Box */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <div className="flex items-center gap-1.5 text-blue-900 font-bold text-sm">
              <Building className="w-4 h-4 text-emerald-600" />
              <span>CONSIGNEE (Receiver / Mal Lene Wala)</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">CONSIGNEE NAME *</label>
            <input
              type="text"
              required
              value={form.consigneeName}
              onChange={(e) => handleChange('consigneeName', e.target.value.toUpperCase())}
              placeholder="e.g. RAJASTHAN INDUSTRIAL SOLUTIONS"
              className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm font-semibold uppercase focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">GST IN</label>
            <input
              type="text"
              value={form.consigneeGst}
              onChange={(e) => handleChange('consigneeGst', e.target.value.toUpperCase())}
              placeholder="e.g. 08BBBPR5678H1Z2"
              className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm font-mono uppercase focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">ADDRESS</label>
            <textarea
              rows={2}
              value={form.consigneeAddress}
              onChange={(e) => handleChange('consigneeAddress', e.target.value.toUpperCase())}
              placeholder="e.g. F-12, VKI AREA, ROAD NO 9, JAIPUR"
              className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-xs uppercase focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* Goods & Logistics Details */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-2 font-bold text-sm text-gray-900">
          <FileText className="w-4 h-4 text-indigo-600" />
          <span>Goods &amp; Material Information (Mal Ka Vivaran)</span>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">
            WHAT IS THE GOODS (Description) *
          </label>
          <input
            type="text"
            required
            value={form.goodsDescription}
            onChange={(e) => handleChange('goodsDescription', e.target.value.toUpperCase())}
            placeholder="e.g. ELECTRICAL CABLES & HARDWARE APPLIANCES"
            className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm font-medium uppercase focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">QUANTITY</label>
            <input
              type="text"
              value={form.quantity}
              onChange={(e) => handleChange('quantity', e.target.value.toUpperCase())}
              placeholder="e.g. 180 BOXES"
              className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm font-semibold uppercase focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">SEAL NUMBER</label>
            <input
              type="text"
              value={form.sealNumber}
              onChange={(e) => handleChange('sealNumber', e.target.value.toUpperCase())}
              placeholder="e.g. KRL-9921"
              className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm font-mono uppercase focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">NET WEIGHT</label>
            <input
              type="text"
              value={form.netWeight}
              onChange={(e) => handleChange('netWeight', e.target.value.toUpperCase())}
              placeholder="e.g. 8.450 MT"
              className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm font-semibold uppercase focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">INVOICE NO</label>
            <input
              type="text"
              value={form.invoiceNo}
              onChange={(e) => handleChange('invoiceNo', e.target.value.toUpperCase())}
              placeholder="e.g. INV/26-27/0412"
              className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm font-mono uppercase focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">INVOICE VALUE</label>
            <input
              type="text"
              value={form.invoiceValue}
              onChange={(e) => handleChange('invoiceValue', e.target.value)}
              placeholder="e.g. ₹ 8,45,000"
              className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">E-WAY BILL NO</label>
            <input
              type="text"
              value={form.eWayBillNo}
              onChange={(e) => handleChange('eWayBillNo', e.target.value.toUpperCase())}
              placeholder="e.g. 541298450123"
              className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm font-mono font-bold uppercase focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-gray-700">IN-DATE (Reporting Date):</label>
            <input
              type="date"
              value={form.inDate}
              onChange={(e) => handleChange('inDate', e.target.value)}
              className="border border-gray-300 rounded-md px-2.5 py-1 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
            <button
              type="button"
              onClick={() => setTodayDate('inDate')}
              className="text-[11px] text-blue-600 hover:underline font-semibold"
            >
              Set Today
            </button>
          </div>
        </div>
      </div>

      {/* Freight & GST Calculation Section */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
          <div className="flex items-center gap-2 font-bold text-sm text-gray-900">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <span>Freight &amp; Payment Details (Bhada aur GST Hisab)</span>
          </div>

          {/* Payment Mode Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-600">Payment Status:</span>
            <div className="inline-flex rounded-lg border border-gray-300 p-0.5 bg-gray-50 text-xs">
              <button
                type="button"
                onClick={() => handleChange('paymentMode', 'TO_BE_BILLED')}
                className={`px-3 py-1 rounded-md font-bold transition-colors ${
                  form.paymentMode === 'TO_BE_BILLED'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                ✓ To Be Billed
              </button>
              <button
                type="button"
                onClick={() => handleChange('paymentMode', 'TO_PAY')}
                className={`px-3 py-1 rounded-md font-bold transition-colors ${
                  form.paymentMode === 'TO_PAY'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                To Pay
              </button>
              <button
                type="button"
                onClick={() => handleChange('paymentMode', 'PAID')}
                className={`px-3 py-1 rounded-md font-bold transition-colors ${
                  form.paymentMode === 'PAID'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                Paid
              </button>
            </div>
          </div>
        </div>

        {/* Inputs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Freight */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              FRIEGHT (Basic Bhada) ₹ *
            </label>
            <input
              type="number"
              min="0"
              step="any"
              required
              value={form.freight || ''}
              onChange={(e) => handleNumberChange('freight', e.target.value)}
              placeholder="0.00"
              className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm font-bold font-mono focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          {/* Other Charges */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              OTHER CHARGES / HAMALI ₹
            </label>
            <input
              type="number"
              min="0"
              step="any"
              value={form.otherCharges || ''}
              onChange={(e) => handleNumberChange('otherCharges', e.target.value)}
              placeholder="0.00"
              className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          {/* GST Type & Rate */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">GST TYPE</label>
            <div className="grid grid-cols-3 gap-1">
              <button
                type="button"
                onClick={() => handleChange('gstType', 'IGST')}
                className={`py-1.5 text-xs font-bold rounded border ${
                  form.gstType === 'IGST'
                    ? 'bg-blue-900 text-white border-blue-900'
                    : 'bg-white border-gray-300 text-gray-700'
                }`}
              >
                IGST (18%)
              </button>
              <button
                type="button"
                onClick={() => handleChange('gstType', 'CGST_SGST')}
                className={`py-1.5 text-xs font-bold rounded border ${
                  form.gstType === 'CGST_SGST'
                    ? 'bg-blue-900 text-white border-blue-900'
                    : 'bg-white border-gray-300 text-gray-700'
                }`}
              >
                CGST+SGST
              </button>
              <button
                type="button"
                onClick={() => handleChange('gstType', 'NONE')}
                className={`py-1.5 text-xs font-bold rounded border ${
                  form.gstType === 'NONE'
                    ? 'bg-blue-900 text-white border-blue-900'
                    : 'bg-white border-gray-300 text-gray-700'
                }`}
              >
                None (0%)
              </button>
            </div>
          </div>

          {/* Advance */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">ADVANCE ₹</label>
            <input
              type="number"
              min="0"
              step="any"
              value={form.advance || ''}
              onChange={(e) => handleNumberChange('advance', e.target.value)}
              placeholder="0.00"
              className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Financial Summary Strip */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
          <div>
            <span className="text-gray-500 block">Total Freight:</span>
            <span className="font-mono font-bold text-gray-900 text-sm">
              ₹ {form.total.toFixed(2)}
            </span>
          </div>

          <div>
            <span className="text-gray-500 block">
              {form.gstType === 'IGST'
                ? 'IGST 18%:'
                : form.gstType === 'CGST_SGST'
                ? 'SGST+CGST (9%+9%):'
                : 'GST:'}
            </span>
            <span className="font-mono font-bold text-blue-900 text-sm">
              ₹ {(form.igstAmount + form.sgstAmount + form.cgstAmount).toFixed(2)}
            </span>
          </div>

          <div>
            <span className="text-gray-500 block">Grand Total:</span>
            <span className="font-mono font-extrabold text-blue-950 text-sm">
              ₹ {form.grandTotal.toFixed(2)}
            </span>
          </div>

          <div>
            <span className="text-gray-500 block">Advance Received:</span>
            <span className="font-mono font-bold text-emerald-700 text-sm">
              ₹ {form.advance.toFixed(2)}
            </span>
          </div>

          <div className="col-span-2 md:col-span-1 bg-red-50 p-1.5 rounded border border-red-200">
            <span className="text-red-700 font-bold block">Balance Due:</span>
            <span className="font-mono font-black text-red-800 text-base">
              ₹ {form.balance.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel / Back to List
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Primary Save Button */}
          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-lg shadow-sm transition-all"
          >
            <Save className="w-4 h-4" />
            {isEditingExisting ? 'Update Bilty' : 'Save Bilty'}
          </button>

          {/* Auto Next LR Button: user specifically wanted:
              "ek LR number entry kre or vo automatically agla bill-t me bdh ke aaye jse humne LR dala 102 to agla LR no 103 hona chahiye next billt me"
          */}
          <button
            type="button"
            onClick={(e) => handleSubmit(e, true)}
            className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md hover:shadow-lg transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            Save &amp; Create Next Bilty (LR + 1)
          </button>
        </div>
      </div>
    </form>
  );
};

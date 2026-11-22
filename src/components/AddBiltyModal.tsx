import React, { useState, useEffect } from 'react';
import { BiltyRecord, CompanyId } from '../types';
import { CalendarDatePickerModal } from './CalendarDatePickerModal';

interface AddBiltyModalProps {
  isOpen: boolean;
  onClose: () => void;
  nextLrNumber?: string;
  defaultLrNo?: string;
  editingRecord?: BiltyRecord | null;
  existingRecords?: BiltyRecord[];
  activeCompany?: CompanyId;
  onSave?: (record: BiltyRecord) => void;
}

function formatToDdMmYyyy(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
}

interface FloatingFieldProps {
  id: string;
  label: string;
  type?: 'text' | 'date';
  value: string;
  onChange: (val: string) => void;
  required?: boolean;
  uppercase?: boolean;
  onFieldClick?: () => void;
  readOnly?: boolean;
  fillHex?: string;
  hasError?: boolean;
}

const OutlinedFloatingField: React.FC<FloatingFieldProps> = ({
  id,
  label,
  type = 'text',
  value,
  onChange,
  uppercase = false,
  onFieldClick,
  readOnly = false,
  fillHex = '#EFF6FF',
  hasError = false,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [uniqueFieldName] = useState(
    () => `${id}_${Math.random().toString(36).slice(2, 9)}`
  );
  const isFloating = isFocused || value.length > 0;

  return (
    <div className="relative" style={{ fontFamily: "'Calibri', sans-serif" }}>
      <fieldset
        style={{ backgroundColor: hasError ? '#FECACA' : fillHex }}
        className={`relative w-full h-16 m-0 p-0 border-2 ${
          hasError ? 'border-red-600' : 'border-slate-950'
        } rounded-[12px] transition-all ${
          isFocused ? 'ring-2 ring-slate-900/20' : ''
        }`}
      >
        <legend
          align="center"
          className={`mx-auto h-0 text-[13px] font-black uppercase tracking-wide select-none overflow-hidden transition-all duration-150 ${
            isFloating ? 'px-2 max-w-full' : 'px-0 max-w-0'
          }`}
        >
          <span className="opacity-0">{label}</span>
        </legend>

        <input
          id={uniqueFieldName}
          name={uniqueFieldName}
          type="search"
          inputMode="search"
          enterKeyHint="done"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize={uppercase ? 'characters' : 'off'}
          spellCheck={false}
          aria-autocomplete="none"
          data-form-type="other"
          data-lpignore="true"
          value={value}
          readOnly={readOnly}
          onClick={onFieldClick}
          onFocus={() => {
            setIsFocused(true);
            if (onFieldClick) onFieldClick();
          }}
          onBlur={() => setIsFocused(false)}
          onChange={(e) => onChange(uppercase ? e.target.value.toUpperCase() : e.target.value)}
          style={{
            fontFamily: "'Calibri', sans-serif",
            fontWeight: 900,
            WebkitTextStroke: '0.45px #000',
            textAlign: 'center',
            transform: 'scaleY(1.25)',
            transformOrigin: 'center',
          }}
          className={`w-full h-full bg-transparent border-none px-3.5 text-[18px] font-black text-slate-950 text-center tracking-wide outline-none appearance-none ${
            uppercase ? 'uppercase' : ''
          } ${readOnly ? 'cursor-pointer' : ''}`}
        />
      </fieldset>

      <label
        htmlFor={uniqueFieldName}
        style={{
          fontFamily: "'Calibri', sans-serif",
          fontWeight: 900,
          WebkitTextStroke: '0.4px #000',
          transform: isFloating
            ? 'translate(-50%, -50%) scaleY(1.28)'
            : 'translate(-50%, -50%) scaleY(1.25)',
          transformOrigin: 'center center',
        }}
        className={`pointer-events-none absolute left-1/2 font-black uppercase tracking-wide text-center transition-all duration-150 ${
          isFloating
            ? 'top-0 text-[13px] leading-none text-slate-950'
            : 'top-1/2 text-[17px] leading-none text-slate-950'
        }`}
      >
        {label}
      </label>
    </div>
  );
};

export const AddBiltyModal: React.FC<AddBiltyModalProps> = ({
  isOpen,
  onClose,
  nextLrNumber,
  defaultLrNo,
  editingRecord,
  existingRecords = [],
  activeCompany,
  onSave,
}) => {
  const effectiveLr = defaultLrNo || nextLrNumber || '8097';

  const [inDate, setInDate] = useState('');
  const [lrNo, setLrNo] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');
  const [vehicleSize, setVehicleSize] = useState('');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (editingRecord) {
        setInDate(editingRecord.inDate || new Date().toISOString().split('T')[0]);
        setLrNo(editingRecord.lrNo || '');
        setVehicleNo(editingRecord.vehicleNo || '');
        setVehicleSize(editingRecord.vehicleSize || '');
      } else {
        setInDate(new Date().toISOString().split('T')[0]);
        setLrNo(nextLrNumber || '8097');
        setVehicleNo('');
        setVehicleSize('');
      }
      setIsCalendarOpen(false);
    }
  }, [isOpen, nextLrNumber, editingRecord]);

  if (!isOpen) return null;

  const trimmedLr = lrNo.trim();
  const isDuplicateLr =
    trimmedLr.length > 0 &&
    existingRecords.some((rec) => {
      if (editingRecord && rec.id === editingRecord.id) return false;
      const existingLr = String(rec.lrNo || '').trim();
      if (!existingLr) return false;
      if (existingLr.toUpperCase() === trimmedLr.toUpperCase()) return true;
      if (/^\d+$/.test(existingLr) && /^\d+$/.test(trimmedLr)) {
        return parseInt(existingLr, 10) === parseInt(trimmedLr, 10);
      }
      return false;
    });

  const isAllFilled =
    inDate.trim().length > 0 &&
    trimmedLr.length > 0 &&
    vehicleNo.trim().length > 0 &&
    vehicleSize.trim().length > 0;

  const canSave = isAllFilled && !isDuplicateLr;

  const handleSaveEntry = () => {
    if (!canSave) return;

    const finalInDate = inDate || new Date().toISOString().split('T')[0];

    const newRecord: BiltyRecord = editingRecord
      ? {
          ...editingRecord,
          lrNo: trimmedLr || effectiveLr,
          inDate: finalInDate,
          vehicleNo: vehicleNo.trim().toUpperCase(),
          vehicleSize: vehicleSize.trim().toUpperCase(),
          updatedAt: Date.now(),
        }
      : {
          id: `bilty_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          lrNo: trimmedLr || effectiveLr,
          date: '',
          inDate: finalInDate,
          vehicleNo: vehicleNo.trim().toUpperCase(),
          vehicleSize: vehicleSize.trim().toUpperCase(),
          fromCity: '',
          toCity: '',
          consignorName: '',
          consignorAddress: '',
          consignorGst: '',
          consigneeName: '',
          consigneeAddress: '',
          consigneeGst: '',
          goodsDescription: '',
          quantity: '',
          sealNumber: '',
          netWeight: '',
          invoiceNo: '',
          invoiceValue: '',
          eWayBillNo: '',
          freight: 0,
          otherCharges: 0,
          total: 0,
          gstType: 'IGST',
          gstRate: 18,
          sgstAmount: 0,
          cgstAmount: 0,
          igstAmount: 0,
          grandTotal: 0,
          advance: 0,
          balance: 0,
          paymentMode: 'TO_BE_BILLED',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

    if (onSave) {
      onSave(newRecord);
    }
    onClose();
  };

  const effectiveCompany = editingRecord?.companyId || activeCompany;
  const isKtc = effectiveCompany === 'KTC';
  const boxFill = isKtc ? '#FEE2E2' : '#DBEAFE';

  return (
    <>
      <div
        style={{ fontFamily: "'Calibri', sans-serif" }}
        className="fixed inset-0 z-50 flex items-start pt-10 sm:items-center sm:pt-3 justify-center p-3 bg-slate-900/50 backdrop-blur-xs"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-2xl w-full max-w-md border-2 border-slate-950 shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 4 Outlined Highlighted Colored Floating-Label Grid Boxes (No Header) */}
          <div className="p-4 pt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <OutlinedFloatingField
                id="krl_dt"
                label="IN DATE"
                type="date"
                value={formatToDdMmYyyy(inDate)}
                onChange={setInDate}
                onFieldClick={() => setIsCalendarOpen(true)}
                readOnly
                fillHex={boxFill}
              />

              <OutlinedFloatingField
                id="krl_lr"
                label="LR NO"
                value={lrNo}
                onChange={setLrNo}
                fillHex={boxFill}
                hasError={isDuplicateLr}
              />

              <OutlinedFloatingField
                id="krl_vh"
                label="GADI NO"
                value={vehicleNo}
                onChange={setVehicleNo}
                uppercase
                fillHex={boxFill}
              />

              <OutlinedFloatingField
                id="krl_sz"
                label="FEET"
                value={vehicleSize}
                onChange={setVehicleSize}
                uppercase
                fillHex={boxFill}
              />
            </div>

            {/* Duplicate LR Warning Message */}
            {isDuplicateLr && (
              <div
                style={{
                  fontFamily: "'Calibri', sans-serif",
                  fontWeight: 900,
                  WebkitTextStroke: '0.4px currentColor',
                }}
                className="w-full h-12 rounded-[12px] bg-red-50 border-2 border-red-600 text-red-600 flex items-center justify-center px-3 text-center text-[16px] font-black uppercase tracking-wide"
              >
                <span style={{ display: 'inline-block', transform: 'scaleY(1.22)' }}>
                  YE LR PHLE SE EXISTS HAI
                </span>
              </div>
            )}

            {/* Equal-Size Dialog Action Buttons (Blue on Roadlines, Red on Transport) */}
            <div className="pt-1 grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={onClose}
                style={{
                  fontFamily: "'Calibri', sans-serif",
                  fontWeight: 900,
                  WebkitTextStroke: '0.4px currentColor',
                }}
                className={`w-full h-14 rounded-[12px] border-2 border-slate-950 text-slate-950 text-[18px] font-black shadow-xs transition-all cursor-pointer uppercase flex items-center justify-center tracking-wide ${
                  isKtc
                    ? 'bg-[#FEE2E2] hover:bg-[#FECACA]'
                    : 'bg-[#DBEAFE] hover:bg-[#BFDBFE]'
                }`}
              >
                <span style={{ display: 'inline-block', transform: 'scaleY(1.25)' }}>
                  CANCEL
                </span>
              </button>
              <button
                type="button"
                disabled={!canSave}
                onClick={handleSaveEntry}
                style={{
                  fontFamily: "'Calibri', sans-serif",
                  fontWeight: 900,
                  WebkitTextStroke: '0.4px currentColor',
                }}
                className={`w-full h-14 rounded-[12px] border-2 border-slate-950 text-slate-950 text-[18px] font-black shadow-xs transition-all uppercase flex items-center justify-center tracking-wide ${
                  canSave
                    ? 'bg-[#BBF7D0] hover:bg-[#86EFAC] cursor-pointer'
                    : 'bg-white cursor-not-allowed'
                }`}
              >
                <span style={{ display: 'inline-block', transform: 'scaleY(1.25)' }}>
                  SAVE
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Date Picker Modal */}
      <CalendarDatePickerModal
        isOpen={isCalendarOpen}
        selectedDate={inDate}
        onSelectDate={(dateStr) => setInDate(dateStr)}
        onClose={() => setIsCalendarOpen(false)}
      />
    </>
  );
};

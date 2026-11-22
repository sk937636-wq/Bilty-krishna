import React, { useState, useEffect, useMemo } from 'react';
import { BiltyRecord, CompanyId } from '../types';
import { Loader2, Share2 } from 'lucide-react';

interface SharePartyModalProps {
  record: BiltyRecord | null;
  recentParties?: string[];
  isSharing: boolean;
  activeCompany?: CompanyId;
  onClose: () => void;
  onSavePdf: (record: BiltyRecord, partyName: string) => void;
  onConfirmShare: (record: BiltyRecord, partyName: string, fileName: string) => void;
}

export function getInDateDay(dateStr?: string): string {
  if (dateStr) {
    const clean = dateStr.trim();
    if (clean.includes('-')) {
      const parts = clean.split('-');
      if (parts.length === 3) {
        if (parts[0].length === 4 && parts[2]) {
          return parts[2].padStart(2, '0');
        }
        if (parts[2].length === 4 && parts[0]) {
          return parts[0].padStart(2, '0');
        }
      }
    }
    if (clean.includes('/')) {
      const parts = clean.split('/');
      if (parts.length === 3) {
        if (parts[0].length === 4 && parts[2]) {
          return parts[2].padStart(2, '0');
        }
        if (parts[2].length === 4 && parts[0]) {
          return parts[0].padStart(2, '0');
        }
      }
    }
  }
  return String(new Date().getDate()).padStart(2, '0');
}

export const SharePartyModal: React.FC<SharePartyModalProps> = ({
  record,
  isSharing,
  activeCompany,
  onClose,
  onSavePdf,
  onConfirmShare,
}) => {
  const [partyName, setPartyName] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (record) {
      setPartyName((record.partyName || record.consigneeName || '').toUpperCase());
    } else {
      setPartyName('');
    }
  }, [record]);

  const dd = useMemo(
    () => (record ? getInDateDay(record.inDate || record.date) : ''),
    [record]
  );

  const fieldUid = useMemo(
    () => `krl_entry_${Math.random().toString(36).slice(2, 10)}`,
    [record]
  );

  if (!record) return null;

  const cleanParty = partyName.trim().toUpperCase();
  const lrPart = (record.lrNo || 'LR').trim().toUpperCase();
  const isFloating = isFocused || partyName.length > 0;

  const isKtc = (record?.companyId || activeCompany) === 'KTC';
  const boxFill = isKtc ? '#FEE2E2' : '#DBEAFE';

  const handleTriggerShare = () => {
    if (!cleanParty || isSharing) return;
    const finalBaseName = `${lrPart} - ${dd} - ${cleanParty}`;
    onConfirmShare(record, cleanParty, finalBaseName);
  };

  const handleTriggerSavePdf = () => {
    if (!cleanParty) return;
    onSavePdf(record, cleanParty);
  };

  return (
    <div
      style={{ fontFamily: "'Calibri', sans-serif" }}
      className="fixed inset-0 z-50 flex items-start pt-14 sm:items-center sm:pt-3 justify-center p-3 bg-slate-900/50 backdrop-blur-xs"
      onClick={() => !isSharing && onClose()}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md border-2 border-slate-950 shadow-2xl overflow-hidden p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="grid grid-cols-2 gap-3">
          {/* Top-Left: KISKO DI (Party Name Input Box) */}
          <div className="relative pt-1">
            <fieldset
              style={{ backgroundColor: boxFill }}
              className={`relative w-full h-16 m-0 p-0 border-[2.5px] border-slate-950 rounded-[12px] transition-all ${
                isFocused ? 'ring-2 ring-slate-900/20' : ''
              }`}
            >
              <legend
                align="center"
                className={`mx-auto h-0 text-[13px] font-black uppercase tracking-wide select-none overflow-hidden transition-all duration-150 ${
                  isFloating ? 'px-2 max-w-full' : 'px-0 max-w-0'
                }`}
              >
                <span className="opacity-0">KISKO DI</span>
              </legend>

              <input
                id={fieldUid}
                name={fieldUid}
                type="search"
                inputMode="search"
                enterKeyHint="done"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="characters"
                spellCheck={false}
                aria-autocomplete="none"
                data-form-type="other"
                data-lpignore="true"
                autoFocus
                disabled={isSharing}
                value={partyName}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onChange={(e) => setPartyName(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (cleanParty) handleTriggerSavePdf();
                  }
                }}
                style={{
                  fontFamily: "'Calibri', sans-serif",
                  fontWeight: 900,
                  WebkitTextStroke: '0.4px currentColor',
                  textAlign: 'center',
                  transform: 'scaleY(1.22)',
                  transformOrigin: 'center',
                }}
                className="w-full h-full bg-transparent border-none px-3 text-[16px] font-black text-slate-950 uppercase tracking-wide outline-none appearance-none text-center"
              />
            </fieldset>

            <label
              htmlFor={fieldUid}
              style={{
                fontFamily: "'Calibri', sans-serif",
                fontWeight: 900,
                WebkitTextStroke: '0.35px currentColor',
                transform: isFloating
                  ? 'translate(-50%, -50%) scaleY(1.25)'
                  : 'translate(-50%, -50%) scaleY(1.22)',
                transformOrigin: 'center center',
              }}
              className={`pointer-events-none absolute left-1/2 font-black uppercase tracking-wide text-center transition-all duration-150 ${
                isFloating
                  ? 'top-1 text-[12px] leading-none text-slate-950'
                  : 'top-1/2 text-[15px] leading-none text-slate-900'
              }`}
            >
              KISKO DI
            </label>
          </div>

          {/* Top-Right: SAVE PDF Button */}
          <button
            type="button"
            disabled={!cleanParty || isSharing}
            onClick={handleTriggerSavePdf}
            style={{
              fontFamily: "'Calibri', sans-serif",
              fontWeight: 900,
              WebkitTextStroke: '0.4px currentColor',
            }}
            className={`w-full h-16 rounded-[12px] border-[2.5px] border-slate-950 text-slate-950 text-[16px] font-black shadow-xs transition-all uppercase flex items-center justify-center tracking-wide ${
              cleanParty && !isSharing
                ? 'bg-[#BBF7D0] hover:bg-[#86EFAC] cursor-pointer'
                : 'bg-white cursor-not-allowed opacity-60'
            }`}
          >
            <span style={{ display: 'inline-block', transform: 'scaleY(1.25)' }}>
              SAVE PDF
            </span>
          </button>

          {/* Bottom-Left: CANCEL Button */}
          <button
            type="button"
            disabled={isSharing}
            onClick={onClose}
            style={{
              fontFamily: "'Calibri', sans-serif",
              fontWeight: 900,
              WebkitTextStroke: '0.4px currentColor',
            }}
            className={`w-full h-16 rounded-[12px] border-[2.5px] border-slate-950 disabled:opacity-50 text-slate-950 text-[16px] font-black shadow-xs transition-all cursor-pointer uppercase flex items-center justify-center tracking-wide ${
              isKtc
                ? 'bg-[#FEE2E2] hover:bg-[#FECACA]'
                : 'bg-[#DBEAFE] hover:bg-[#BFDBFE]'
            }`}
          >
            <span style={{ display: 'inline-block', transform: 'scaleY(1.25)' }}>
              CANCEL
            </span>
          </button>

          {/* Bottom-Right: SHARE PDF Button */}
          <button
            type="button"
            disabled={!cleanParty || isSharing}
            onClick={handleTriggerShare}
            style={{
              fontFamily: "'Calibri', sans-serif",
              fontWeight: 900,
              WebkitTextStroke: '0.4px currentColor',
            }}
            className={`w-full h-16 rounded-[12px] border-[2.5px] border-slate-950 text-slate-950 text-[16px] font-black shadow-xs transition-all uppercase flex items-center justify-center gap-2 tracking-wide ${
              cleanParty && !isSharing
                ? 'bg-[#BBF7D0] hover:bg-[#86EFAC] cursor-pointer'
                : 'bg-white cursor-not-allowed opacity-60'
            }`}
          >
            {isSharing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin stroke-[2.75]" />
                <span style={{ display: 'inline-block', transform: 'scaleY(1.25)' }}>
                  PDF...
                </span>
              </>
            ) : (
              <>
                <Share2 className="w-5 h-5 stroke-[2.75]" />
                <span style={{ display: 'inline-block', transform: 'scaleY(1.25)' }}>
                  PDF
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

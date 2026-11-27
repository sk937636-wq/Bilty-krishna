import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Plus,
  Share2,
  Loader2,
  LogOut,
  Search,
  MoreVertical,
  Trash2,
  Pencil,
} from 'lucide-react';
import { AddBiltyModal } from './components/AddBiltyModal';
import { BiltyPreview } from './components/BiltyPreview';
import { FastScrollerLeft } from './components/FastScrollerLeft';
import { InAppBiltyPdfModal } from './components/InAppBiltyPdfModal';
import { LoginPage } from './components/LoginPage';
import { SharePartyModal } from './components/SharePartyModal';
import { BiltyRecord, CompanyId } from './types';
import { DEFAULT_COMPANY_PROFILE, KTC_COMPANY_PROFILE } from './utils/storage';
import { generateBiltyPdfFile } from './utils/pdfExport';
import {
  saveBiltyToCloud,
  deleteBiltyFromCloud,
  subscribeToCloudBilties,
  subscribeToAuthState,
  logoutUser,
} from './firebase';

const STORAGE_KEY = 'krl_bilty_records_v2';
const ACTIVE_COMPANY_KEY = 'krl_active_company';

function formatDateDdMmYyyy(dateStr?: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    try {
      return localStorage.getItem('krl_is_logged_in') === 'true';
    } catch {
      return false;
    }
  });
  const [activeCompany, setActiveCompany] = useState<CompanyId>(() => {
    try {
      const saved = localStorage.getItem(ACTIVE_COMPANY_KEY);
      return saved === 'KTC' ? 'KTC' : 'KRL';
    } catch {
      return 'KRL';
    }
  });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<BiltyRecord | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<BiltyRecord | null>(null);
  const [records, setRecords] = useState<BiltyRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [sharingId, setSharingId] = useState<string | null>(null);
  const [shareModalRecord, setShareModalRecord] = useState<BiltyRecord | null>(null);
  const [activeBiltyForPdf, setActiveBiltyForPdf] = useState<BiltyRecord | null>(null);
  const [readyPdfShare, setReadyPdfShare] = useState<{
    record: BiltyRecord;
    partyName: string;
    file: File;
  } | null>(null);
  const [viewingPdfRecord, setViewingPdfRecord] = useState<BiltyRecord | null>(null);


  useEffect(() => {
    const unsubscribe = subscribeToAuthState((user) => {
      setIsLoggedIn(Boolean(user));
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('krl_is_logged_in', isLoggedIn ? 'true' : 'false');
    } catch (e) {
      console.error(e);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    try {
      localStorage.setItem(ACTIVE_COMPANY_KEY, activeCompany);
    } catch (e) {
      console.error(e);
    }
  }, [activeCompany]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch (e) {
      console.error(e);
    }
  }, [records]);

  const hasSearchHistoryRef = useRef(false);
  const searchQueryRef = useRef(searchQuery);

  useEffect(() => {
    searchQueryRef.current = searchQuery;
    if (searchQuery.length > 0 && !hasSearchHistoryRef.current) {
      window.history.pushState({ biltySearchActive: true }, '');
      hasSearchHistoryRef.current = true;
    } else if (searchQuery.length === 0 && hasSearchHistoryRef.current) {
      hasSearchHistoryRef.current = false;
      if (window.history.state?.biltySearchActive) {
        window.history.back();
      }
    }
  }, [searchQuery]);

  useEffect(() => {
    const handlePopState = () => {
      if (searchQueryRef.current.length > 0) {
        hasSearchHistoryRef.current = false;
        setSearchQuery('');
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const companyRecords = useMemo(() => {
    return records.filter((r) => (r.companyId || 'KRL') === activeCompany);
  }, [records, activeCompany]);

  const nextLrNumber = useMemo(() => {
    const defaultStart = activeCompany === 'KTC' ? '191' : '8097';
    if (companyRecords.length === 0) return defaultStart;
    const numericLrs = companyRecords
      .map((r) => parseInt(String(r.lrNo).replace(/\D/g, ''), 10))
      .filter((n) => !isNaN(n));
    if (numericLrs.length === 0) return defaultStart;
    return String(Math.max(...numericLrs) + 1);
  }, [companyRecords, activeCompany]);

  const recentParties = useMemo(() => {
    const seen = new Set<string>();
    const list: string[] = [];
    for (const r of companyRecords) {
      const p = (r.partyName || r.consigneeName || '').trim().toUpperCase();
      if (p && !seen.has(p)) {
        seen.add(p);
        list.push(p);
      }
    }
    return list;
  }, [companyRecords]);

  const filteredRecords = useMemo(() => {
    const q = searchQuery.trim().toUpperCase();
    if (!q) return companyRecords;
    return companyRecords.filter(
      (r) =>
        String(r.lrNo || '').toUpperCase().includes(q) ||
        String(r.vehicleNo || '').toUpperCase().includes(q) ||
        String(r.partyName || '').toUpperCase().includes(q) ||
        String(r.inDate || '').toUpperCase().includes(q)
    );
  }, [companyRecords, searchQuery]);

  // Real-time Firestore two-way sync when logged in
  useEffect(() => {
    if (!isLoggedIn) return;
    const pushedIds = new Set<string>();
    const unsubscribe = subscribeToCloudBilties(
      (cloudRecords) => {
        setRecords((prev) => {
          const cloudMap = new Map<string, BiltyRecord>();
          for (const c of cloudRecords) {
            cloudMap.set(c.id, c);
          }

          const mergedMap = new Map<string, BiltyRecord>();
          const toUpload: BiltyRecord[] = [];
          const now = Date.now();

          // 1. Merge cloud records with local records
          for (const cloudRec of cloudRecords) {
            const localRec = prev.find((p) => p.id === cloudRec.id);
            if (!localRec) {
              mergedMap.set(cloudRec.id, cloudRec);
              continue;
            }

            const localUpdated = Number(localRec.updatedAt) || 0;
            const cloudUpdated = Number(cloudRec.updatedAt) || 0;

            if (localUpdated > cloudUpdated) {
              mergedMap.set(localRec.id, localRec);
              if (!pushedIds.has(`${localRec.id}_${localUpdated}`)) {
                pushedIds.add(`${localRec.id}_${localUpdated}`);
                toUpload.push(localRec);
              }
            } else if (localRec.partyName && !cloudRec.partyName) {
              const patched: BiltyRecord = {
                ...cloudRec,
                partyName: localRec.partyName,
                isShared: true,
                sharedAt: localRec.sharedAt || cloudRec.sharedAt || Date.now(),
                updatedAt: Math.max(localUpdated, cloudUpdated, Date.now()),
              };
              mergedMap.set(patched.id, patched);
              if (!pushedIds.has(`${patched.id}_${patched.updatedAt}`)) {
                pushedIds.add(`${patched.id}_${patched.updatedAt}`);
                toUpload.push(patched);
              }
            } else {
              mergedMap.set(cloudRec.id, cloudRec);
            }
          }

          // 2. Keep local records ONLY if they were created very recently (< 15 seconds ago) and not yet in cloud
          for (const localRec of prev) {
            if (!cloudMap.has(localRec.id)) {
              const age = now - (localRec.createdAt || 0);
              if (age < 15000) {
                mergedMap.set(localRec.id, localRec);
                const stamp = Number(localRec.updatedAt) || 0;
                if (!pushedIds.has(`${localRec.id}_${stamp}`)) {
                  pushedIds.add(`${localRec.id}_${stamp}`);
                  toUpload.push(localRec);
                }
              }
            }
          }

          if (toUpload.length > 0) {
            Promise.allSettled(toUpload.map((rec) => saveBiltyToCloud(rec))).catch(() => {});
          }

          const combined = Array.from(mergedMap.values());
          combined.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
          return combined;
        });
      },
      (err) => {
        console.warn('Cloud bilties sync warning:', err);
      }
    );
    return () => {
      unsubscribe();
    };
  }, [isLoggedIn]);

  const markRecordAsShared = async (recordOrId: BiltyRecord | string, partyName?: string) => {
    const targetId = typeof recordOrId === 'string' ? recordOrId : recordOrId.id;
    const cleanParty = partyName ? partyName.trim().toUpperCase() : undefined;
    const now = Date.now();

    const baseRecord =
      typeof recordOrId === 'object'
        ? recordOrId
        : records.find((r) => r.id === targetId);

    const updatedRecord: BiltyRecord | undefined = baseRecord
      ? {
          ...baseRecord,
          companyId: baseRecord.companyId || activeCompany,
          partyName: cleanParty || baseRecord.partyName,
          isShared: true,
          sharedAt: now,
          updatedAt: now,
        }
      : undefined;

    setRecords((prev) => {
      const next = prev.map((item) => {
        if (item.id === targetId) {
          return {
            ...item,
            companyId: item.companyId || activeCompany,
            partyName: cleanParty || item.partyName,
            isShared: true,
            sharedAt: now,
            updatedAt: now,
          };
        }
        return item;
      });
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });

    if (updatedRecord) {
      try {
        await saveBiltyToCloud(updatedRecord);
      } catch (e) {
        console.error('Failed to sync shared status to cloud:', e);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (e) {}
    setIsLoggedIn(false);
    localStorage.removeItem('krl_is_logged_in');
  };

  // Save new or edited bilty to Home
  const handleSaveBilty = async (savedRecord: BiltyRecord) => {
    const isExisting = records.some((r) => r.id === savedRecord.id);
    const recordForHome: BiltyRecord = isExisting
      ? {
          ...savedRecord,
          companyId: savedRecord.companyId || activeCompany,
        }
      : {
          ...savedRecord,
          companyId: activeCompany,
          isShared: false,
        };

    setRecords((prev) => {
      if (prev.some((r) => r.id === recordForHome.id)) {
        return prev.map((r) => (r.id === recordForHome.id ? recordForHome : r));
      }
      return [recordForHome, ...prev];
    });
    setEditingRecord(null);

    try {
      await saveBiltyToCloud(recordForHome);
    } catch (e) {
      console.error('Failed to save bilty to cloud:', e);
    }
  };

  // Delete bilty from Home and Cloud
  const handleDeleteBilty = async (recordId: string, companyId?: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== recordId));
    try {
      await deleteBiltyFromCloud(recordId, companyId || activeCompany);
    } catch (e) {
      console.error('Failed to delete bilty from cloud:', e);
    }
  };

  // Generate PDF with "LR NO - DD - PARTY NAME.pdf" filename and share on WhatsApp
  const handleShareBiltyPdf = async (
    record: BiltyRecord,
    partyName: string,
    pdfFileName: string
  ) => {
    if (sharingId) return;
    setSharingId(record.id);
    setActiveBiltyForPdf(record);

    const cleanParty = partyName.trim().toUpperCase();
    const cleanBaseName = pdfFileName.replace(/\.pdf$/i, '').trim();
    const explicitFileName = `${cleanBaseName}.pdf`;

    // Save shared party name immediately so it appears below the LR number on the card
    markRecordAsShared(record, cleanParty);

    // Wait for React to render the selected Bilty in the offscreen BiltyPreview
    await new Promise((r) => setTimeout(r, 120));

    const generatedFile = await generateBiltyPdfFile('bilty-export-clean-document', explicitFileName);

    setSharingId(null);
    setShareModalRecord(null);

    if (!generatedFile) {
      return;
    }

    // Explicitly wrap in File constructor with exact clean filename to prevent randomized blob names
    const pdfBlob = new Blob([generatedFile], { type: 'application/pdf' });
    const pdfFile = new File([pdfBlob], explicitFileName, {
      type: 'application/pdf',
      lastModified: Date.now(),
    });

    // 1. Download the PDF file FIRST on the device with explicit filename
    const downloadUrl = URL.createObjectURL(pdfBlob);
    const downloadLink = document.createElement('a');
    downloadLink.href = downloadUrl;
    downloadLink.setAttribute('download', explicitFileName);
    downloadLink.download = explicitFileName;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    setTimeout(() => URL.revokeObjectURL(downloadUrl), 5000);

    // 2. Then trigger Share (Native file share on mobile/supported browsers, or WhatsApp fallback)
    if (
      typeof navigator !== 'undefined' &&
      navigator.share &&
      navigator.canShare &&
      navigator.canShare({ files: [pdfFile] })
    ) {
      try {
        await navigator.share({
          files: [pdfFile],
        });
        return;
      } catch (err: any) {
        if (err?.name === 'AbortError') {
          return;
        }
        // If browser blocked async share after download due to gesture timeout, show 1-tap instant share modal
        setReadyPdfShare({ record, partyName: cleanParty, file: pdfFile });
        return;
      }
    }

    // Fallback for browsers that don't support native file sharing: open WhatsApp after download
    const activeCompName =
      (record.companyId || activeCompany) === 'KTC'
        ? 'KRISHNA TRANSPORT COMPANY'
        : 'KRISHNA ROADLINES';
    const waText = encodeURIComponent(
      `*${activeCompName}*\n*LR NO:* ${record.lrNo}\n*PARTY:* ${cleanParty}\n*VEHICLE NO:* ${record.vehicleNo} (${record.vehicleSize})\n*IN-DATE:* ${formatDateDdMmYyyy(record.inDate)}`
    );
    window.location.href = `https://api.whatsapp.com/send?text=${waText}`;
  };

  // Instant synchronous share when user taps the ready PDF button
  const handleInstantShareReadyPdf = async () => {
    if (!readyPdfShare) return;
    const { record, partyName, file } = readyPdfShare;
    try {
      if (navigator.share) {
        await navigator.share({
          files: [file],
        });
        markRecordAsShared(record.id, partyName);
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        const url = URL.createObjectURL(file);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', file.name);
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 5000);
        markRecordAsShared(record.id, partyName);
      }
    } finally {
      setReadyPdfShare(null);
    }
  };



  const previewRecord = activeBiltyForPdf || companyRecords[0] || {
    id: 'blank',
    companyId: activeCompany,
    lrNo: '',
    date: '',
    inDate: '',
    fromCity: '',
    toCity: '',
    vehicleSize: '22 FEET',
    vehicleNo: '',
    consignorName: '',
    consignorGst: '',
    consignorAddress: '',
    consigneeName: '',
    consigneeGst: '',
    consigneeAddress: '',
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
    createdAt: 0,
    updatedAt: 0,
  };

  const previewCompanyProfile =
    (previewRecord.companyId || activeCompany) === 'KTC'
      ? KTC_COMPANY_PROFILE
      : DEFAULT_COMPANY_PROFILE;

  if (!isLoggedIn) {
    return <LoginPage onLoginSuccess={() => setIsLoggedIn(true)} />;
  }

  const isKtc = activeCompany === 'KTC';

  return (
    <div
      style={{ fontFamily: "'Calibri', sans-serif" }}
      className="fixed inset-0 w-full h-full overflow-hidden overscroll-none bg-slate-50 flex flex-col"
      onClick={() => isMenuOpen && setIsMenuOpen(false)}
    >
      <div className="max-w-xl sm:max-w-3xl w-full mx-auto flex-1 min-h-0 flex flex-col px-2 sm:px-4 pt-2 sm:pt-3">
        {/* LOCKED HEADER: Company Title + Plus Button (Above 3-Dot) + Search Bar + Three-Dot Menu */}
        <div className="shrink-0 space-y-2 pb-2 pl-[3px] z-30 bg-slate-50 select-none touch-none">
          {/* Top Row: Company Title Indicator (Left) + Plus Icon Button (Right, directly above Three-Dot Menu & same w-12 h-12 size) */}
          <div className="flex items-center justify-between">
            <span
              style={{
                fontFamily: "'Bookman Old Style', serif",
                fontWeight: 700,
                WebkitTextStroke: '0.4px currentColor',
                transform: 'scaleY(1.22)',
                display: 'inline-block',
              }}
              className={`text-[30px] sm:text-[35px] leading-none font-bold uppercase tracking-wider ${
                isKtc ? 'text-red-700' : 'text-blue-900'
              }`}
            >
              {isKtc ? 'TRANSPORT' : 'ROADLINES'}
            </span>

            <button
              type="button"
              onClick={() => {
                setEditingRecord(null);
                setIsAddModalOpen(true);
              }}
              aria-label="Add Bilty"
              title="ADD BILTY"
              className={`w-12 h-12 rounded-xl border-[2px] active:scale-95 text-white shadow-2xs flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                isKtc
                  ? 'bg-[#991B1B] hover:bg-[#7F1D1D] border-red-950'
                  : 'bg-[#1E3A8A] hover:bg-[#172554] border-blue-950'
              }`}
            >
              <Plus className="w-6 h-6 stroke-[3.25]" />
            </button>
          </div>

          {/* Top Bar: Search Bar (Same height & border as Three-Dot Button, placeholder "SEARCH") + Right Side Three-Dot Menu */}
          <div className="flex items-center gap-[3px]">
            <div
              className={`flex-1 h-12 bg-white border-[2px] ${
                isKtc
                  ? 'border-red-900 focus-within:ring-red-900/15'
                  : 'border-blue-900 focus-within:ring-blue-900/15'
              } rounded-xl flex items-center px-3.5 gap-2.5 shadow-2xs focus-within:ring-2 transition-all`}
            >
              <Search
                className={`w-5 h-5 ${
                  isKtc ? 'text-red-900' : 'text-blue-900'
                } stroke-[2.75] shrink-0 pointer-events-none`}
              />
              <input
                type="search"
                inputMode="search"
                enterKeyHint="search"
                name="krl_q_filter"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="characters"
                spellCheck={false}
                aria-autocomplete="none"
                data-form-type="other"
                data-lpignore="true"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
                placeholder="SEARCH"
                style={{
                  fontFamily: "'Calibri', sans-serif",
                  fontWeight: 900,
                  WebkitTextStroke: '0.35px currentColor',
                  transform: 'scaleY(1.22)',
                  transformOrigin: 'left center',
                }}
                className="w-full bg-transparent border-none text-[16px] font-black text-slate-950 placeholder:text-slate-500 outline-none uppercase tracking-wide appearance-none"
              />
              {searchQuery.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="w-8 h-8 rounded-full text-slate-950 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer shrink-0 flex items-center justify-center"
                  aria-label="Clear search"
                  title="Clear search"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="w-[18px] h-[18px] text-slate-950"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <line
                      x1="5.5"
                      y1="5.5"
                      x2="18.5"
                      y2="18.5"
                      stroke="currentColor"
                      strokeWidth="4.8"
                      strokeLinecap="round"
                    />
                    <line
                      x1="18.5"
                      y1="5.5"
                      x2="5.5"
                      y2="18.5"
                      stroke="currentColor"
                      strokeWidth="4.8"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              )}
            </div>

            {/* Right Side Three-Dot Menu Button & Dropdown */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => setIsMenuOpen((prev) => !prev)}
                aria-label="More options"
                className={`w-12 h-12 rounded-xl bg-white border-[2px] ${
                  isKtc ? 'border-red-900 text-red-950' : 'border-blue-900 text-blue-950'
                } flex items-center justify-center hover:bg-slate-100 active:scale-95 transition-all cursor-pointer shadow-2xs`}
              >
                <MoreVertical className="w-5 h-5 stroke-[2.75]" />
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-[143px] sm:w-[179px] h-[156px] bg-white border-[2px] border-slate-900 rounded-xl shadow-xl z-50 overflow-hidden flex flex-col">
                  {/* Company 1: ROADLINES */}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveCompany('KRL');
                      setSearchQuery('');
                      setIsMenuOpen(false);
                    }}
                    style={{
                      fontFamily: "'Calibri', sans-serif",
                      fontWeight: 900,
                      WebkitTextStroke: '0.35px currentColor',
                    }}
                    className={`flex-1 w-full px-2 text-center text-[15px] font-black flex items-center justify-center transition-colors cursor-pointer uppercase tracking-wide border-b border-slate-200 whitespace-nowrap ${
                      activeCompany === 'KRL'
                        ? 'bg-[#DBEAFE] text-blue-950'
                        : 'text-slate-950 hover:bg-slate-100'
                    }`}
                  >
                    <span style={{ display: 'inline-block', transform: 'scaleY(1.22)' }}>
                      ROADLINES
                    </span>
                  </button>

                  {/* Company 2: TRANSPORT */}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveCompany('KTC');
                      setSearchQuery('');
                      setIsMenuOpen(false);
                    }}
                    style={{
                      fontFamily: "'Calibri', sans-serif",
                      fontWeight: 900,
                      WebkitTextStroke: '0.35px currentColor',
                    }}
                    className={`flex-1 w-full px-2 text-center text-[15px] font-black flex items-center justify-center transition-colors cursor-pointer uppercase tracking-wide border-b border-slate-200 whitespace-nowrap ${
                      activeCompany === 'KTC'
                        ? 'bg-[#FEE2E2] text-red-950'
                        : 'text-slate-950 hover:bg-slate-100'
                    }`}
                  >
                    <span style={{ display: 'inline-block', transform: 'scaleY(1.22)' }}>
                      TRANSPORT
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      handleLogout();
                    }}
                    style={{
                      fontFamily: "'Calibri', sans-serif",
                      fontWeight: 900,
                      WebkitTextStroke: '0.35px currentColor',
                    }}
                    className="flex-1 w-full px-2 text-center text-[15px] font-black text-red-600 hover:bg-red-50 flex items-center justify-center gap-1.5 transition-colors cursor-pointer uppercase tracking-wide whitespace-nowrap"
                  >
                    <LogOut className="w-4 h-4 stroke-[2.75] shrink-0" />
                    <span style={{ display: 'inline-block', transform: 'scaleY(1.22)' }}>
                      LOGOUT
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* FastScrollerLeft Wrapper for Bilty Cards List */}
        <FastScrollerLeft
          totalItems={filteredRecords.length}
          isKtc={isKtc}
          edge="left"
        >
          {filteredRecords.length === 0 ? (
              <div
                style={{
                  fontFamily: "'Calibri', sans-serif",
                  fontWeight: 900,
                  WebkitTextStroke: isKtc ? '0.4px #7F1D1D' : '0.4px #1E3A8A',
                }}
                className={`w-full h-12 rounded-xl border-[2px] ${
                  isKtc
                    ? 'bg-red-50 border-red-900 text-red-900'
                    : 'bg-blue-50 border-blue-900 text-blue-900'
                } flex items-center justify-center px-4 text-center text-[18px] font-black tracking-wide shadow-2xs`}
              >
                <span style={{ display: 'inline-block', transform: 'scaleY(1.22)' }} className="truncate">
                  {searchQuery
                    ? 'YE DATA NAHI HAI'
                    : 'ABHI KOI BILTY NAHI HAI'}
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredRecords.map((rec) => {
                  const isCurrentSharing = sharingId === rec.id;
                  return (
                    <div
                      key={rec.id}
                      className={`rounded-xl border-[2px] bg-white ${
                        isKtc ? 'border-red-900' : 'border-blue-900'
                      } p-[3px] shadow-2xs flex items-center justify-between gap-[3px]`}
                    >
                      {/* Left Side: Inner Entry Box (h-16, flex-1, no inner border) */}
                      <div className="flex-1 h-16 rounded-lg bg-white px-3 flex flex-col justify-center gap-1.5 min-w-0 overflow-hidden select-none">
                        <span
                          style={{
                            fontFamily: "'Calibri', sans-serif",
                            fontWeight: 900,
                            WebkitTextStroke: isKtc ? '0.4px #450A0A' : '0.4px #020617',
                            display: 'inline-block',
                            transform: 'scaleY(1.22)',
                            transformOrigin: 'left center',
                          }}
                          className={`text-[18px] font-black tracking-wide truncate leading-none ${
                            isKtc ? 'text-red-950' : 'text-slate-950'
                          }`}
                        >
                          {rec.lrNo}
                        </span>

                        {rec.partyName && (
                          <span
                            style={{
                              fontFamily: "'Calibri', sans-serif",
                              fontWeight: 900,
                              WebkitTextStroke: '0.4px currentColor',
                              display: 'inline-block',
                              transform: 'scaleY(1.22)',
                              transformOrigin: 'left center',
                            }}
                            className={`text-[18px] font-black tracking-wide truncate leading-none uppercase ${
                              isKtc ? 'text-red-700' : 'text-blue-700'
                            }`}
                          >
                            {rec.partyName}
                          </span>
                        )}
                      </div>

                      {/* Right Side: 1. Share, 2. Edit, 3. Delete Action Buttons (Clean Borderless, Light Colored Icons) */}
                      <div className="shrink-0 flex items-center gap-[3px]">
                        {/* 1. Share Action Button */}
                        <button
                          type="button"
                          disabled={isCurrentSharing}
                          onClick={() => setShareModalRecord(rec)}
                          aria-label="Share Bilty"
                          title="SHARE"
                          className="w-11 sm:w-14 h-16 rounded-lg bg-white hover:bg-slate-50 text-green-500 disabled:opacity-60 active:scale-95 flex items-center justify-center transition-all cursor-pointer"
                        >
                          {isCurrentSharing ? (
                            <Loader2 className="w-5 h-5 animate-spin stroke-[2.75]" />
                          ) : (
                            <Share2 className="w-5 h-5 stroke-[2.75]" />
                          )}
                        </button>

                        {/* 2. Edit Action Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setEditingRecord(rec);
                            setIsAddModalOpen(true);
                          }}
                          aria-label="Edit Bilty"
                          title="EDIT"
                          className="w-11 sm:w-14 h-16 rounded-lg bg-white hover:bg-slate-50 text-amber-400 active:scale-95 flex items-center justify-center transition-all cursor-pointer"
                        >
                          <Pencil className="w-5 h-5 stroke-[2.75]" />
                        </button>

                        {/* 3. Delete Action Button */}
                        <button
                          type="button"
                          onClick={() => setDeletingRecord(rec)}
                          aria-label="Delete Bilty"
                          title="DELETE"
                          className="w-11 sm:w-14 h-16 rounded-lg bg-white hover:bg-slate-50 text-red-400 active:scale-95 flex items-center justify-center transition-all cursor-pointer"
                        >
                          <Trash2 className="w-5 h-5 stroke-[2.75]" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
        </FastScrollerLeft>
      </div>

      {/* Offscreen Clean Document for Exact PDF Generation */}
      <div
        id="bilty-export-clean-container"
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          width: '993px',
          backgroundColor: '#ffffff',
          opacity: 0,
          pointerEvents: 'none',
          zIndex: -9999,
        }}
        aria-hidden="true"
      >
        <BiltyPreview
          bilty={previewRecord}
          company={previewCompanyProfile}
          isPrintMode={true}
          isEditable={false}
          elementId="bilty-export-clean-document"
        />
      </div>

      {/* Delete Confirmation Modal */}
      {deletingRecord && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
          onClick={() => setDeletingRecord(null)}
        >
          <div
            className="bg-white rounded-2xl p-5 w-full max-w-xs border-2 border-slate-950 shadow-2xl text-center space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                fontFamily: "'Calibri', sans-serif",
                fontWeight: 900,
                WebkitTextStroke: '0.4px currentColor',
              }}
              className="text-[18px] font-black text-slate-950 tracking-wide uppercase"
            >
              <span style={{ display: 'inline-block', transform: 'scaleY(1.22)' }}>
                DELETE BILTY {deletingRecord.lrNo}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDeletingRecord(null)}
                style={{
                  fontFamily: "'Calibri', sans-serif",
                  fontWeight: 900,
                  WebkitTextStroke: '0.35px currentColor',
                }}
                className={`w-full h-12 rounded-xl border-2 border-slate-950 text-slate-950 text-[16px] font-black transition-all cursor-pointer uppercase flex items-center justify-center tracking-wide ${
                  isKtc
                    ? 'bg-[#FEE2E2] hover:bg-[#FECACA]'
                    : 'bg-[#DBEAFE] hover:bg-[#BFDBFE]'
                }`}
              >
                <span style={{ display: 'inline-block', transform: 'scaleY(1.22)' }}>
                  CANCEL
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleDeleteBilty(deletingRecord.id, deletingRecord.companyId);
                  setDeletingRecord(null);
                }}
                style={{
                  fontFamily: "'Calibri', sans-serif",
                  fontWeight: 900,
                  WebkitTextStroke: '0.35px currentColor',
                }}
                className={`w-full h-12 rounded-xl border-2 border-slate-950 text-slate-950 text-[16px] font-black transition-all cursor-pointer uppercase flex items-center justify-center tracking-wide ${
                  isKtc
                    ? 'bg-[#FEE2E2] hover:bg-[#FECACA]'
                    : 'bg-[#DBEAFE] hover:bg-[#BFDBFE]'
                }`}
              >
                <span style={{ display: 'inline-block', transform: 'scaleY(1.22)' }}>
                  DELETE
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1-Tap Instant WhatsApp PDF Share Confirmation (if browser requires fresh tap after PDF generation) */}
      {readyPdfShare && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
          onClick={() => setReadyPdfShare(null)}
        >
          <div
            className="bg-white rounded-2xl p-4 w-full max-w-xs border border-slate-200 shadow-xl text-center space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                fontFamily: "'Calibri', sans-serif",
                fontWeight: 900,
                WebkitTextStroke: '0.35px currentColor',
              }}
              className="text-[15px] font-black text-slate-950 tracking-wide"
            >
              <span style={{ display: 'inline-block', transform: 'scaleY(1.22)' }}>
                PDF READY: {readyPdfShare.file.name}
              </span>
            </div>
            <button
              type="button"
              onClick={handleInstantShareReadyPdf}
              style={{
                fontFamily: "'Calibri', sans-serif",
                fontWeight: 900,
                WebkitTextStroke: '0.35px currentColor',
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#BBF7D0] hover:bg-[#86EFAC] border-2 border-slate-950 text-emerald-950 text-[15px] font-black shadow-sm cursor-pointer uppercase tracking-wide"
            >
              <Share2 className="w-4 h-4 stroke-[2.75]" />
              <span style={{ display: 'inline-block', transform: 'scaleY(1.22)' }}>
                WHATSAPP PAR PDF BHEJEIN
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Add / Edit Bilty Dialog Box (Only In Date, LR Number, Vehicle Number, Vehicle Size) */}
      <AddBiltyModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingRecord(null);
        }}
        nextLrNumber={nextLrNumber}
        editingRecord={editingRecord}
        existingRecords={companyRecords}
        activeCompany={activeCompany}
        onSave={handleSaveBilty}
      />

      {/* Party Name Dialog Box when sharing PDF (File Name: LR NO - DD - PARTY NAME.pdf) */}
      <SharePartyModal
        record={shareModalRecord}
        recentParties={recentParties}
        isSharing={Boolean(sharingId)}
        activeCompany={activeCompany}
        onClose={() => setShareModalRecord(null)}
        onSavePdf={(rec, partyName) => {
          markRecordAsShared(rec, partyName);
          const updated = {
            ...rec,
            companyId: rec.companyId || activeCompany,
            partyName: partyName.trim().toUpperCase(),
          };
          setViewingPdfRecord(updated);
          setShareModalRecord(null);
        }}
        onConfirmShare={handleShareBiltyPdf}
      />

      {/* In-App Full Bilty PDF Viewer Modal (Triggered on SAVE PDF click) */}
      <InAppBiltyPdfModal
        record={viewingPdfRecord}
        activeCompany={activeCompany}
        onClose={() => setViewingPdfRecord(null)}
      />
    </div>
  );
}

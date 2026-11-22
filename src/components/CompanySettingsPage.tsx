import React, { useState } from 'react';
import { CompanyProfile } from '../types';
import { DEFAULT_COMPANY_PROFILE } from '../utils/storage';
import {
  Building2,
  Landmark,
  ShieldCheck,
  RotateCcw,
  Check,
  Eye,
  Phone,
  Mail,
  MapPin,
  Truck,
  Sparkles,
} from 'lucide-react';

interface CompanySettingsPageProps {
  currentProfile: CompanyProfile;
  onSave: (updatedProfile: CompanyProfile) => void;
  onBackToDashboard: () => void;
}

export const CompanySettingsPage: React.FC<CompanySettingsPageProps> = ({
  currentProfile,
  onSave,
  onBackToDashboard,
}) => {
  const [formData, setFormData] = useState<CompanyProfile>({ ...currentProfile });
  const [activeTab, setActiveTab] = useState<'profile' | 'bank' | 'terms'>('profile');
  const [isSavedRecently, setIsSavedRecently] = useState(false);

  const handleChange = (field: keyof CompanyProfile, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleReset = () => {
    if (window.confirm('Kya aap default transport format (Krishna Roadlines) restore karna chahte hain?')) {
      setFormData({ ...DEFAULT_COMPANY_PROFILE });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setIsSavedRecently(true);
    setTimeout(() => setIsSavedRecently(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 text-xs font-bold mb-1.5 border border-blue-200">
            <Building2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Transport Enterprise Letterhead</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Company Format &amp; Letterhead Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Bilty LR par print hone wali company ka naam, logo monogram, address, bank details aur terms yahan se set karein.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Default</span>
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>{isSavedRecently ? 'Saved Successfully!' : 'Save Format'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Form: Tabs & Inputs (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          {/* Internal Tab Selector */}
          <div className="flex border-b border-slate-200 bg-slate-50/70 p-2 gap-2 text-xs font-bold flex-wrap">
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Company &amp; Address</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('bank')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all cursor-pointer ${
                activeTab === 'bank'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Landmark className="w-3.5 h-3.5" />
              <span>Bank Details</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('terms')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all cursor-pointer ${
                activeTab === 'terms'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Terms &amp; Signature</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('handover')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all cursor-pointer ${
                activeTab === 'handover'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Client Handover, APK &amp; Excel Spec</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
            {/* TAB 1: Company Profile */}
            {activeTab === 'profile' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Transport Company Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.companyName}
                      onChange={(e) => handleChange('companyName', e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                      placeholder="e.g. KRISHNA ROADLINES"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Logo Monogram
                    </label>
                    <input
                      type="text"
                      maxLength={4}
                      value={formData.logoMonogram}
                      onChange={(e) => handleChange('logoMonogram', e.target.value.toUpperCase())}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg text-center font-bold tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="KRL"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tagline / Description
                  </label>
                  <input
                    type="text"
                    value={formData.tagline}
                    onChange={(e) => handleChange('tagline', e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="FLEET OWNERS & TRANSPORT CONTRACTORS"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Key Routes / Hubs
                  </label>
                  <input
                    type="text"
                    value={formData.routes}
                    onChange={(e) => handleChange('routes', e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-900 font-semibold"
                    placeholder="Daily Direct Service: DELHI - JAIPUR - MUMBAI - AHMEDABAD"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Full Office Address
                  </label>
                  <textarea
                    rows={2}
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Plot No. 12, Transport Nagar, Ring Road..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Contact Phone Numbers
                    </label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="98290XXXXX, 94140XXXXX"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="info@krishnaroadlines.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Company GSTIN
                    </label>
                    <input
                      type="text"
                      value={formData.gstin}
                      onChange={(e) => handleChange('gstin', e.target.value.toUpperCase())}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg uppercase font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="08AABCK1234F1Z5"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Court Jurisdiction
                    </label>
                    <input
                      type="text"
                      value={formData.jurisdiction}
                      onChange={(e) => handleChange('jurisdiction', e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="SUBJECT TO JAIPUR JURISDICTION ONLY"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Bank Details */}
            {activeTab === 'bank' && (
              <div className="space-y-4">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900">
                  Yeh Bank account details bilty ke bottom par NEFT/RTGS/IMPS payment ke liye print hoti hain.
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    value={formData.bankName}
                    onChange={(e) => handleChange('bankName', e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                    placeholder="e.g. HDFC BANK LTD / STATE BANK OF INDIA"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Current / Saving Account No
                    </label>
                    <input
                      type="text"
                      value={formData.bankAccountNo}
                      onChange={(e) => handleChange('bankAccountNo', e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="50200012345678"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      IFSC Code
                    </label>
                    <input
                      type="text"
                      value={formData.bankIfsc}
                      onChange={(e) => handleChange('bankIfsc', e.target.value.toUpperCase())}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg uppercase font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="HDFC0001234"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: Terms & Disclaimer */}
            {activeTab === 'terms' && (
              <div className="space-y-4">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                  Yeh legal terms bilty receipt ke foot notes par print hoti hain taaki claim ya damage disputes se transport company safe rahe.
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Disclaimer Point 1 (Owner Risk)
                  </label>
                  <input
                    type="text"
                    value={formData.disclaimer1}
                    onChange={(e) => handleChange('disclaimer1', e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Disclaimer Point 2 (Delivery &amp; Demurrage)
                  </label>
                  <input
                    type="text"
                    value={formData.disclaimer2}
                    onChange={(e) => handleChange('disclaimer2', e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Disclaimer Point 3 (Insurance Note)
                  </label>
                  <input
                    type="text"
                    value={formData.disclaimer3}
                    onChange={(e) => handleChange('disclaimer3', e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Signatory Text
                  </label>
                  <input
                    type="text"
                    value={formData.signText}
                    onChange={(e) => handleChange('signText', e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    placeholder="For KRISHNA ROADLINES (Authorised Signatory)"
                  />
                </div>
              </div>
            )}

            {activeTab === 'handover' && (
              <div className="space-y-4 text-xs">
                {/* Section 1: Private Client Handover */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
                  <h3 className="text-sm font-bold text-blue-900 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-blue-700" />
                    <span>1. Client ko Privately Kaise Dein (Client Handover Guide)</span>
                  </h3>
                  <p className="text-slate-700 leading-relaxed">
                    Aap is app ko apne kisi bhi client ko privately handover karne ke liye in tareeqon ka use kar sakte hain:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-slate-700 font-medium">
                    <li><strong>Private Web URL:</strong> App ko Vercel, Netlify, ya Firebase Hosting par apne personal/client domain par deploy karein.</li>
                    <li><strong>Data Privacy:</strong> Har client apna Google account login karke ya offline mode me apne device par secure localStorage / Firestore me bilties save kar sakta hai.</li>
                    <li><strong>Zero Maintenance:</strong> App puri tarah client-side React + Vite par bani hai, koi complex server backend ki zarurat nahi hai.</li>
                  </ul>
                </div>

                {/* Section 2: Android APK Guide */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-2">
                  <h3 className="text-sm font-bold text-emerald-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-700" />
                    <span>2. Android APK File Kaise Banayein & Dein</span>
                  </h3>
                  <p className="text-slate-700 leading-relaxed">
                    Client ko Play Store par daale bina direct <strong>.apk</strong> file dene ke liye 2 aasan steps hain:
                  </p>
                  <ol className="list-decimal pl-5 space-y-1 text-slate-700 font-medium">
                    <li>App ko live web URL par deploy karein (jaise Vercel ya Netlify).</li>
                    <li>Official free tool <strong><a href="https://www.pwabuilder.com" target="_blank" rel="noreferrer" className="text-blue-600 underline">PWABuilder.com</a></strong> par apni web URL daalein aur 2 minute me signed Android APK (`app-release.apk`) download kar lein.</li>
                    <li>Yeh APK aap apne client ko WhatsApp ya Google Drive ke zariye bhej sakte hain. Client apne phone me install karke bina browser ke direct native app ki tarah chala sakta hai!</li>
                  </ol>
                </div>

                {/* Section 3: Excel Format & Prompt Specs */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <Landmark className="w-4 h-4 text-slate-700" />
                    <span>3. Excel Template (`1 - LR - R.xlsx`) Spec &amp; Prompt</span>
                  </h3>
                  <p className="text-slate-600">
                    Aapke diye gaye Excel format ki exact specifications jo code me implement hain:
                  </p>
                  <div className="bg-white p-3 rounded-lg border border-slate-200 font-mono text-[11px] text-slate-800 space-y-1">
                    <div>• <strong>Page Setup:</strong> A4 Landscape, Margins: L 0.89", R 0.12", T 0.46", B 0.12"</div>
                    <div>• <strong>Grid &amp; Rows:</strong> 26 Rows × 6 Cols (A-F). Row heights: 19.2pt, Row 2 (30pt), Row 26 (49.95pt)</div>
                    <div>• <strong>Fonts:</strong> Bookman Old Style 32pt Bold Navy for Company Name; Calibri 14pt Bold Navy for headers; Calibri 14pt Regular Black for data values.</div>
                    <div>• <strong>Merged Cells:</strong> Total 36 Exact Merged Ranges (A1:B1, A2:F2, etc.)</div>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Changes will sync with Cloud Firestore immediately.
              </span>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Save Format Changes</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Card: Live Letterhead Visual Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-4 sticky top-24">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5">
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <Eye className="w-4 h-4 text-blue-600" />
                <span>Live Letterhead Header Preview</span>
              </div>
              <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                Interactive
              </span>
            </div>

            {/* Letterhead Replica Card */}
            <div className="border-2 border-slate-800 rounded-xl p-4 bg-white text-center space-y-2 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-300 pb-2 text-[10px] font-bold text-slate-600">
                <span>{formData.jurisdiction || 'SUBJECT TO JURISDICTION'}</span>
                <span>GSTIN: {formData.gstin || 'NOT SPECIFIED'}</span>
              </div>

              <div className="flex items-center justify-center gap-3 pt-1">
                <div className="w-10 h-10 rounded-lg bg-blue-950 text-white flex items-center justify-center font-black font-serif text-sm shadow-xs">
                  {formData.logoMonogram || 'KRL'}
                </div>
                <div className="text-left">
                  <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight font-serif uppercase">
                    {formData.companyName || 'COMPANY NAME'}
                  </h2>
                  <p className="text-[10px] font-bold text-slate-600 tracking-wide">
                    {formData.tagline || 'FLEET OPERATORS'}
                  </p>
                </div>
              </div>

              <div className="text-[10px] text-blue-900 font-bold bg-blue-50 py-1 px-2 rounded border border-blue-100">
                {formData.routes || 'DIRECT SERVICE ALL OVER INDIA'}
              </div>

              <p className="text-[10px] text-slate-600 max-w-sm mx-auto leading-relaxed">
                {formData.address || 'Company Address Line'}
              </p>

              <div className="flex items-center justify-center gap-4 text-[10px] text-slate-700 font-medium pt-1 border-t border-slate-200">
                <span>Phone: {formData.phone || '-'}</span>
                <span>Email: {formData.email || '-'}</span>
              </div>
            </div>

            {/* Bank Card Preview */}
            <div className="mt-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="font-bold text-slate-800 flex items-center gap-1.5 mb-1">
                <Landmark className="w-3.5 h-3.5 text-blue-700" />
                <span>Bank Payment Details on Bilty:</span>
              </div>
              <div className="text-[11px] text-slate-600">
                Bank: <strong className="text-slate-900">{formData.bankName || 'Not Set'}</strong>
              </div>
              <div className="text-[11px] text-slate-600">
                A/C No: <strong className="font-mono text-slate-900">{formData.bankAccountNo || 'Not Set'}</strong>
              </div>
              <div className="text-[11px] text-slate-600">
                IFSC: <strong className="font-mono text-slate-900">{formData.bankIfsc || 'Not Set'}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

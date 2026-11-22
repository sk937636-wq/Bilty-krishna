import React, { useState } from 'react';
import { CompanyProfile } from '../types';
import { DEFAULT_COMPANY_PROFILE } from '../utils/storage';
import { X, RotateCcw, Check, Building2, Landmark, ShieldCheck } from 'lucide-react';

interface FormatSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProfile: CompanyProfile;
  onSave: (updatedProfile: CompanyProfile) => void;
}

export const FormatSettingsModal: React.FC<FormatSettingsModalProps> = ({
  isOpen,
  onClose,
  currentProfile,
  onSave,
}) => {
  const [formData, setFormData] = useState<CompanyProfile>({ ...currentProfile });
  const [activeTab, setActiveTab] = useState<'company' | 'bank' | 'terms'>('company');

  if (!isOpen) return null;

  const handleChange = (field: keyof CompanyProfile, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleReset = () => {
    if (window.confirm('Kya aap default format (Krishna Roadlines) restore karna chahte hain?')) {
      setFormData({ ...DEFAULT_COMPANY_PROFILE });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-gray-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-slate-50 rounded-t-xl">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Format &amp; Company Settings</h2>
            <p className="text-xs text-gray-500">
              Apni company details, bank khata, aur terms apne hisab se format karein
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 px-6 bg-white gap-4">
          <button
            onClick={() => setActiveTab('company')}
            className={`py-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'company'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            Company &amp; Address
          </button>
          <button
            onClick={() => setActiveTab('bank')}
            className={`py-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'bank'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Landmark className="w-4 h-4" />
            Bank &amp; Account
          </button>
          <button
            onClick={() => setActiveTab('terms')}
            className={`py-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'terms'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Disclaimers &amp; Terms
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-sm">
          {activeTab === 'company' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Company Name (Transporter)
                  </label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => handleChange('companyName', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-semibold uppercase focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Logo Monogram (Short)
                  </label>
                  <input
                    type="text"
                    maxLength={5}
                    value={formData.logoMonogram}
                    onChange={(e) => handleChange('logoMonogram', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-bold uppercase text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden"
                    placeholder="KRL"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Tagline / Business Nature
                </label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={(e) => handleChange('tagline', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm uppercase focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Daily Services / Routes
                </label>
                <input
                  type="text"
                  value={formData.routes}
                  onChange={(e) => handleChange('routes', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm uppercase focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">GSTIN</label>
                  <input
                    type="text"
                    value={formData.gstin}
                    onChange={(e) => handleChange('gstin', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm uppercase font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Mobile No</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Jurisdiction Text
                </label>
                <input
                  type="text"
                  value={formData.jurisdiction}
                  onChange={(e) => handleChange('jurisdiction', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm uppercase focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Office Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm uppercase focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm uppercase focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden"
                />
              </div>
            </div>
          )}

          {activeTab === 'bank' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Bank Name &amp; Branch
                </label>
                <input
                  type="text"
                  value={formData.bankName}
                  onChange={(e) => handleChange('bankName', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm uppercase font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Account Number (A/C.NO.)
                </label>
                <input
                  type="text"
                  value={formData.bankAccountNo}
                  onChange={(e) => handleChange('bankAccountNo', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono font-bold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">IFSC Code</label>
                <input
                  type="text"
                  value={formData.bankIfsc}
                  onChange={(e) => handleChange('bankIfsc', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono font-bold uppercase focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden"
                />
              </div>

              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 text-xs text-blue-900 leading-relaxed">
                ℹ️ Ye bank details bilty ke beech wale column me print hongi, jisse parties direct
                payment transfer kar sakein.
              </div>
            </div>
          )}

          {activeTab === 'terms' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Insurance Disclaimer (Top Center)
                </label>
                <textarea
                  rows={2}
                  value={formData.disclaimer1}
                  onChange={(e) => handleChange('disclaimer1', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs uppercase focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Damage / Breakage Disclaimer (Middle Center)
                </label>
                <textarea
                  rows={2}
                  value={formData.disclaimer2}
                  onChange={(e) => handleChange('disclaimer2', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs uppercase focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Invoice Notice (Bottom Center)
                </label>
                <input
                  type="text"
                  value={formData.disclaimer3}
                  onChange={(e) => handleChange('disclaimer3', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs uppercase focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Signature Label (Bottom Right)
                </label>
                <input
                  type="text"
                  value={formData.signText}
                  onChange={(e) => handleChange('signText', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm uppercase font-bold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden"
                />
              </div>
            </div>
          )}

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-600 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset to Default Format
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
              >
                <Check className="w-4 h-4" />
                Save Format
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

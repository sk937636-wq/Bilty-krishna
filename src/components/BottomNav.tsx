import React from 'react';
import {
  LayoutDashboard,
  Plus,
  Clock,
  Settings,
} from 'lucide-react';

interface BottomNavProps {
  currentView: 'dashboard' | 'recent' | 'create' | 'preview' | 'settings';
  onChangeView: (view: 'dashboard' | 'recent' | 'settings') => void;
  onOpenAddModal: () => void;
  nextLrNumber: string;
  totalRecords: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentView,
  onChangeView,
  onOpenAddModal,
  nextLrNumber,
  totalRecords,
}) => {
  return (
    <nav className="no-print fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-4 py-2 sm:hidden">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {/* 1. Dashboard / Home */}
        <button
          onClick={() => onChangeView('dashboard')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
            currentView === 'dashboard'
              ? 'text-slate-900 font-bold scale-105'
              : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 font-medium">Home</span>
        </button>

        {/* 2. Center Highlight: + Add Bilty Modal Trigger */}
        <button
          onClick={onOpenAddModal}
          className="flex flex-col items-center justify-center -mt-5 group cursor-pointer"
        >
          <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg transition-transform group-active:scale-95 border-2 border-white">
            <Plus className="w-6 h-6 stroke-[3] text-emerald-400" />
          </div>
          <span className="text-[10px] mt-1 font-bold text-slate-800 tracking-tight flex items-center gap-0.5">
            + Add Bilty <span className="font-mono text-[9px] text-slate-500">#{nextLrNumber}</span>
          </span>
        </button>

        {/* 3. Recent Bilties Page */}
        <button
          onClick={() => onChangeView('recent')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer relative ${
            currentView === 'recent'
              ? 'text-slate-900 font-bold scale-105'
              : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <Clock className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 font-medium">Recent Bilties</span>
          {totalRecords > 0 && (
            <span className="absolute top-0.5 right-1.5 text-[8px] bg-slate-800 text-white font-mono px-1 rounded-full">
              {totalRecords}
            </span>
          )}
        </button>

        {/* 4. Settings & Format */}
        <button
          onClick={() => onChangeView('settings')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
            currentView === 'settings'
              ? 'text-slate-900 font-bold scale-105'
              : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 font-medium">Settings</span>
        </button>
      </div>
    </nav>
  );
};

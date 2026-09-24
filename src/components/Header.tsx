import React from 'react';
import { Download, Terminal } from 'lucide-react';

interface HeaderProps {
  activeTab: 'simulator' | 'code' | 'packaging' | 'ffmpeg' | 'icon';
  onSelectTab: (tab: 'simulator' | 'code' | 'packaging' | 'ffmpeg' | 'icon') => void;
  onOpenDownloadKit: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  onOpenDownloadKit,
}) => {
  return (
    <header className="border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Zone 1: Single text element Brand Title */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-sm">
            ♫
          </div>
          <span className="text-base sm:text-lg font-semibold tracking-tight text-neutral-100 font-sans">
            YouTube MP3 Downloader Studio
          </span>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <button
            onClick={() => onSelectTab('simulator')}
            className={`transition-colors relative py-1 ${
              activeTab === 'simulator'
                ? 'text-emerald-400 font-semibold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Desktop Simulator
            {activeTab === 'simulator' && (
              <span className="absolute -bottom-[21px] left-0 right-0 h-0.5 bg-emerald-400 rounded-full" />
            )}
          </button>

          <button
            onClick={() => onSelectTab('code')}
            className={`transition-colors relative py-1 ${
              activeTab === 'code'
                ? 'text-emerald-400 font-semibold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Python Source
            {activeTab === 'code' && (
              <span className="absolute -bottom-[21px] left-0 right-0 h-0.5 bg-emerald-400 rounded-full" />
            )}
          </button>

          <button
            onClick={() => onSelectTab('packaging')}
            className={`transition-colors relative py-1 ${
              activeTab === 'packaging'
                ? 'text-emerald-400 font-semibold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            PyInstaller Guide
            {activeTab === 'packaging' && (
              <span className="absolute -bottom-[21px] left-0 right-0 h-0.5 bg-emerald-400 rounded-full" />
            )}
          </button>

          <button
            onClick={() => onSelectTab('ffmpeg')}
            className={`transition-colors relative py-1 ${
              activeTab === 'ffmpeg'
                ? 'text-emerald-400 font-semibold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            FFmpeg Setup
            {activeTab === 'ffmpeg' && (
              <span className="absolute -bottom-[21px] left-0 right-0 h-0.5 bg-emerald-400 rounded-full" />
            )}
          </button>

          <button
            onClick={() => onSelectTab('icon')}
            className={`transition-colors relative py-1 flex items-center gap-1.5 ${
              activeTab === 'icon'
                ? 'text-emerald-400 font-semibold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <span>EXE Icon (.ico)</span>
            {activeTab === 'icon' && (
              <span className="absolute -bottom-[21px] left-0 right-0 h-0.5 bg-emerald-400 rounded-full" />
            )}
          </button>
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onSelectTab('packaging')}
            className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 text-xs font-mono text-neutral-300 bg-neutral-900 border border-neutral-800 rounded-lg hover:border-neutral-700 transition-colors"
            title="View PyInstaller one-liner"
          >
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span>--noconsole</span>
          </button>

          <button
            onClick={onOpenDownloadKit}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-neutral-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors shadow-sm font-sans whitespace-nowrap cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Project Files</span>
          </button>
        </div>
      </div>

      {/* Mobile nav tabs */}
      <div className="flex md:hidden border-t border-neutral-800/80 px-4 py-2 gap-4 text-xs font-medium overflow-x-auto">
        <button
          onClick={() => onSelectTab('simulator')}
          className={`whitespace-nowrap py-1 ${
            activeTab === 'simulator' ? 'text-emerald-400 font-semibold' : 'text-neutral-400'
          }`}
        >
          Simulator
        </button>
        <button
          onClick={() => onSelectTab('code')}
          className={`whitespace-nowrap py-1 ${
            activeTab === 'code' ? 'text-emerald-400 font-semibold' : 'text-neutral-400'
          }`}
        >
          Python Code
        </button>
        <button
          onClick={() => onSelectTab('packaging')}
          className={`whitespace-nowrap py-1 ${
            activeTab === 'packaging' ? 'text-emerald-400 font-semibold' : 'text-neutral-400'
          }`}
        >
          PyInstaller
        </button>
        <button
          onClick={() => onSelectTab('ffmpeg')}
          className={`whitespace-nowrap py-1 ${
            activeTab === 'ffmpeg' ? 'text-emerald-400 font-semibold' : 'text-neutral-400'
          }`}
        >
          FFmpeg
        </button>
        <button
          onClick={() => onSelectTab('icon')}
          className={`whitespace-nowrap py-1 ${
            activeTab === 'icon' ? 'text-emerald-400 font-semibold' : 'text-neutral-400'
          }`}
        >
          EXE Icon
        </button>
      </div>
    </header>
  );
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Header } from './components/Header';
import { DesktopSimulator } from './components/DesktopSimulator';
import { CodeViewer } from './components/CodeViewer';
import { PackagingStudio } from './components/PackagingStudio';
import { FfmpegGuide } from './components/FfmpegGuide';
import { IconStudio } from './components/IconStudio';
import { DownloadKitModal } from './components/DownloadKitModal';
import { Terminal, Github, Heart } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'simulator' | 'code' | 'packaging' | 'ffmpeg' | 'icon'>('simulator');
  const [accentColor, setAccentColor] = useState<'emerald' | 'indigo'>('emerald');
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col selection:bg-emerald-500/20 selection:text-emerald-300">
      
      {/* Top Bar (Follows Top Bar Contract: 3 zones, single wordmark) */}
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenDownloadKit={() => setIsDownloadModalOpen(true)}
      />

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        
        {activeTab === 'simulator' && (
          <DesktopSimulator
            accentColor={accentColor}
            onSelectAccent={setAccentColor}
            onOpenSourceCode={() => setActiveTab('code')}
          />
        )}

        {activeTab === 'code' && (
          <CodeViewer
            accentColor={accentColor}
            onSelectAccent={setAccentColor}
          />
        )}

        {activeTab === 'packaging' && (
          <PackagingStudio />
        )}

        {activeTab === 'ffmpeg' && (
          <FfmpegGuide />
        )}

        {activeTab === 'icon' && (
          <IconStudio />
        )}

      </main>

      {/* Global Download Starter Files Modal */}
      <DownloadKitModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
        accentColor={accentColor}
      />

      {/* Clean quiet Footer adhering to Anti-Slop Guidelines */}
      <footer className="border-t border-neutral-900 bg-neutral-950/80 py-8 text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span>YouTube MP3 Downloader</span>
            <span aria-hidden="true">·</span>
            <span>CustomTkinter & yt-dlp</span>
            <span aria-hidden="true">·</span>
            <span>PyInstaller --noconsole</span>
          </div>

          <div className="flex items-center gap-4 text-neutral-400">
            <button
              onClick={() => setActiveTab('packaging')}
              className="hover:text-emerald-400 transition-colors font-mono cursor-pointer"
            >
              pyinstaller --collect-all customtkinter
            </button>
            <span>·</span>
            <button
              onClick={() => setIsDownloadModalOpen(true)}
              className="hover:text-emerald-400 transition-colors cursor-pointer"
            >
              Download .py & .bat
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
}

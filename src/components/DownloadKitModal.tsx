import React, { useState } from 'react';
import { 
  Download, 
  FileCode, 
  FileText, 
  Terminal, 
  Check, 
  X, 
  Sparkles,
  Layers
} from 'lucide-react';
import { 
  generatePythonCode, 
  REQUIREMENTS_CONTENT, 
  BUILD_BAT_CONTENT, 
  BUILD_SH_CONTENT, 
  README_CONTENT 
} from '../data/pythonCode';

interface DownloadKitModalProps {
  isOpen: boolean;
  onClose: () => void;
  accentColor: 'emerald' | 'indigo';
}

export const DownloadKitModal: React.FC<DownloadKitModalProps> = ({
  isOpen,
  onClose,
  accentColor,
}) => {
  const [downloadedFiles, setDownloadedFiles] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  const pythonCode = generatePythonCode({
    themeColor: accentColor,
    includeBitrateSelector: true,
    autoDetectFfmpeg: true,
    defaultMode: 'Dark'
  });

  const files = [
    {
      name: 'app.py',
      desc: 'Complete CustomTkinter 480x320 application with yt-dlp worker threads',
      icon: FileCode,
      size: `${(pythonCode.length / 1024).toFixed(1)} KB`,
      content: pythonCode
    },
    {
      name: 'requirements.txt',
      desc: 'Pinned dependencies: customtkinter, yt-dlp, pyinstaller',
      icon: FileText,
      size: `${(REQUIREMENTS_CONTENT.length / 1024).toFixed(1)} KB`,
      content: REQUIREMENTS_CONTENT
    },
    {
      name: 'build.bat',
      desc: 'Windows 1-click automated build script (installs packages and runs PyInstaller)',
      icon: Terminal,
      size: `${(BUILD_BAT_CONTENT.length / 1024).toFixed(1)} KB`,
      content: BUILD_BAT_CONTENT
    },
    {
      name: 'build.sh',
      desc: 'macOS & Linux automated build shell script',
      icon: Terminal,
      size: `${(BUILD_SH_CONTENT.length / 1024).toFixed(1)} KB`,
      content: BUILD_SH_CONTENT
    },
    {
      name: 'README.md',
      desc: 'Setup manual, command reference, and PyInstaller instructions',
      icon: FileText,
      size: `${(README_CONTENT.length / 1024).toFixed(1)} KB`,
      content: README_CONTENT
    }
  ];

  const triggerDownload = (fileName: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadedFiles(prev => ({ ...prev, [fileName]: true }));
    setTimeout(() => {
      setDownloadedFiles(prev => ({ ...prev, [fileName]: false }));
    }, 2500);
  };

  const handleDownloadAll = () => {
    files.forEach((file, idx) => {
      setTimeout(() => {
        triggerDownload(file.name, file.content);
      }, idx * 250);
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-neutral-100 font-sans">
                Download Project Starter Kit
              </h2>
              <p className="text-xs text-neutral-400 font-sans">
                Get all source files ready to run and compile on your computer.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-6 overflow-y-auto space-y-3">
          {files.map((file) => {
            const Icon = file.icon;
            const isDownloaded = downloadedFiles[file.name];

            return (
              <div
                key={file.name}
                className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between gap-4 hover:border-neutral-700 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-emerald-400 shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-semibold text-neutral-200">
                        {file.name}
                      </span>
                      <span className="text-[10px] text-neutral-500 font-mono">
                        {file.size}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                      {file.desc}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => triggerDownload(file.name, file.content)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer ${
                    isDownloaded
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200'
                  }`}
                >
                  {isDownloaded ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Downloaded</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-between">
          <div className="text-xs text-neutral-500">
            No installation required on this web page
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-300 hover:text-white transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handleDownloadAll}
              className="px-4 py-2 text-xs font-semibold text-neutral-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-neutral-950" />
              <span>Download All Files</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { 
  Copy, 
  Check, 
  Download, 
  FileCode, 
  Terminal, 
  FileText, 
  Settings2,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { 
  generatePythonCode, 
  REQUIREMENTS_CONTENT, 
  BUILD_BAT_CONTENT, 
  BUILD_SH_CONTENT, 
  README_CONTENT,
  CodeTemplateOptions 
} from '../data/pythonCode';

interface CodeViewerProps {
  accentColor: 'emerald' | 'indigo';
  onSelectAccent: (color: 'emerald' | 'indigo') => void;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({
  accentColor,
  onSelectAccent,
}) => {
  const [activeFile, setActiveFile] = useState<'app.py' | 'requirements.txt' | 'build.bat' | 'build.sh' | 'README.md'>('app.py');
  const [copied, setCopied] = useState(false);
  
  // Customization options for Python code
  const [options, setOptions] = useState<CodeTemplateOptions>({
    themeColor: accentColor,
    includeBitrateSelector: true,
    autoDetectFfmpeg: true,
    defaultMode: 'Dark'
  });

  // Keep options in sync if accent changes
  const activePythonCode = generatePythonCode({
    ...options,
    themeColor: accentColor
  });

  const getActiveContent = () => {
    switch (activeFile) {
      case 'app.py':
        return activePythonCode;
      case 'requirements.txt':
        return REQUIREMENTS_CONTENT;
      case 'build.bat':
        return BUILD_BAT_CONTENT;
      case 'build.sh':
        return BUILD_SH_CONTENT;
      case 'README.md':
        return README_CONTENT;
    }
  };

  const currentContent = getActiveContent();

  const handleCopy = () => {
    navigator.clipboard.writeText(currentContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([currentContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = activeFile;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
        <div>
          <h1 className="text-2xl font-bold text-neutral-100 font-sans tracking-tight">
            Complete Python Source Code
          </h1>
          <p className="text-sm text-neutral-400 mt-1 max-w-2xl font-sans">
            Ready-to-run, fully commented Python code using <code className="text-emerald-400 font-mono">customtkinter</code> and <code className="text-emerald-400 font-mono">yt-dlp</code>. 
            Includes background worker threads, thread-safe GUI hooks, and automatic FFmpeg detection.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleCopy}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 transition-colors flex items-center gap-2 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy {activeFile}</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownload}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-500 hover:bg-emerald-600 text-neutral-950 transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-neutral-950" />
            <span>Download {activeFile}</span>
          </button>
        </div>
      </div>

      {/* Code Inspector Box */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-950 overflow-hidden shadow-2xl">
        
        {/* Top File Bar */}
        <div className="px-4 py-2.5 bg-neutral-900/90 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-3">
          
          {/* File Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto">
            <button
              onClick={() => setActiveFile('app.py')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeFile === 'app.py'
                  ? 'bg-neutral-800 text-emerald-400 font-semibold shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>app.py</span>
            </button>

            <button
              onClick={() => setActiveFile('requirements.txt')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeFile === 'requirements.txt'
                  ? 'bg-neutral-800 text-emerald-400 font-semibold shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>requirements.txt</span>
            </button>

            <button
              onClick={() => setActiveFile('build.bat')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeFile === 'build.bat'
                  ? 'bg-neutral-800 text-emerald-400 font-semibold shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>build.bat (Windows)</span>
            </button>

            <button
              onClick={() => setActiveFile('build.sh')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeFile === 'build.sh'
                  ? 'bg-neutral-800 text-emerald-400 font-semibold shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>build.sh (macOS/Linux)</span>
            </button>

            <button
              onClick={() => setActiveFile('README.md')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeFile === 'README.md'
                  ? 'bg-neutral-800 text-emerald-400 font-semibold shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>README.md</span>
            </button>
          </div>

          {/* Quick Customizer (for app.py) */}
          {activeFile === 'app.py' && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-neutral-400">Palette:</span>
              <button
                onClick={() => onSelectAccent('emerald')}
                className={`px-2 py-0.5 rounded text-[11px] font-mono cursor-pointer ${
                  accentColor === 'emerald' ? 'bg-emerald-500/20 text-emerald-300 font-semibold' : 'text-neutral-500'
                }`}
              >
                Emerald
              </button>
              <button
                onClick={() => onSelectAccent('indigo')}
                className={`px-2 py-0.5 rounded text-[11px] font-mono cursor-pointer ${
                  accentColor === 'indigo' ? 'bg-indigo-500/20 text-indigo-300 font-semibold' : 'text-neutral-500'
                }`}
              >
                Indigo
              </button>
            </div>
          )}

        </div>

        {/* Code Viewport with Line Numbers */}
        <div className="p-4 overflow-x-auto max-h-[640px] font-mono text-xs leading-relaxed text-neutral-300 selection:bg-emerald-500/20">
          <pre className="grid grid-cols-[auto_1fr] gap-x-4">
            {currentContent.split('\n').map((line, idx) => {
              const lineNum = idx + 1;
              const isComment = line.trim().startsWith('#') || line.trim().startsWith('"""') || line.trim().startsWith('::');
              const isImport = line.trim().startsWith('import ') || line.trim().startsWith('from ');
              const isDef = line.trim().startsWith('def ') || line.trim().startsWith('class ');
              const isKeyword = line.includes('try:') || line.includes('except ') || line.includes('return ') || line.includes('if ') || line.includes('elif ') || line.includes('else:');

              return (
                <React.Fragment key={idx}>
                  <span className="text-neutral-600 select-none text-right pr-2 tabular-nums">
                    {lineNum}
                  </span>
                  <span
                    className={
                      isComment
                        ? 'text-neutral-500 italic'
                        : isImport
                        ? 'text-purple-400'
                        : isDef
                        ? 'text-emerald-400 font-semibold'
                        : isKeyword
                        ? 'text-amber-300'
                        : 'text-neutral-200'
                    }
                  >
                    {line || ' '}
                  </span>
                </React.Fragment>
              );
            })}
          </pre>
        </div>

      </div>

      {/* Code Architecture Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800">
          <div className="text-xs font-semibold text-neutral-200 flex items-center gap-2 mb-1">
            <span className="text-emerald-400 font-mono">01.</span>
            <span>Threaded yt-dlp Execution</span>
          </div>
          <p className="text-xs text-neutral-400">
            Calls <code className="text-neutral-300 font-mono">threading.Thread(target=..., daemon=True)</code> so heavy network downloads and MP3 conversion never freeze the Tkinter mainloop.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800">
          <div className="text-xs font-semibold text-neutral-200 flex items-center gap-2 mb-1">
            <span className="text-emerald-400 font-mono">02.</span>
            <span>Thread-Safe UI Updates</span>
          </div>
          <p className="text-xs text-neutral-400">
            All progress calculations, speed statistics, and error messages are dispatched back to the UI thread via <code className="text-neutral-300 font-mono">self.after(0, ...)</code>.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800">
          <div className="text-xs font-semibold text-neutral-200 flex items-center gap-2 mb-1">
            <span className="text-emerald-400 font-mono">03.</span>
            <span>PyInstaller & FFmpeg Ready</span>
          </div>
          <p className="text-xs text-neutral-400">
            Automatically inspects <code className="text-neutral-300 font-mono">sys._MEIPASS</code> and the local exe folder, enabling seamless portable standalone packaging.
          </p>
        </div>
      </div>
    </div>
  );
};

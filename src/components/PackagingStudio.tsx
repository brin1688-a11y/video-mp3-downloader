import React, { useState } from 'react';
import { 
  Terminal, 
  Copy, 
  Check, 
  AlertCircle, 
  ShieldCheck, 
  Layers, 
  ExternalLink,
  Cpu,
  Package,
  FileCode,
  Sparkles
} from 'lucide-react';

export const PackagingStudio: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [copiedWinget, setCopiedWinget] = useState(false);
  const [copiedBrew, setCopiedBrew] = useState(false);

  // Command Builder Options
  const [appName, setAppName] = useState('YouTubeMP3Downloader');
  const [isOneFile, setIsOneFile] = useState(true);
  const [hideConsole, setHideConsole] = useState(true);
  const [collectCustomTkinter, setCollectCustomTkinter] = useState(true);
  const [includeIcon, setIncludeIcon] = useState(false);
  const [iconName, setIconName] = useState('icon.ico');
  const [bundleFfmpeg, setBundleFfmpeg] = useState(false);
  const [ffmpegBinaryPath, setFfmpegBinaryPath] = useState('C:\\ffmpeg\\bin\\ffmpeg.exe');

  // Generate dynamic PyInstaller command
  const generateCommand = () => {
    const parts = ['pyinstaller'];

    if (hideConsole) {
      parts.push('--noconsole');
    }

    if (isOneFile) {
      parts.push('--onefile');
    } else {
      parts.push('--onedir');
    }

    if (collectCustomTkinter) {
      parts.push('--collect-all customtkinter');
    }

    if (includeIcon && iconName) {
      parts.push(`--icon="${iconName}"`);
    }

    if (bundleFfmpeg) {
      const binPath = ffmpegBinaryPath.trim() || 'ffmpeg.exe';
      parts.push(`--add-binary "${binPath};."`);
    }

    if (appName) {
      parts.push(`--name "${appName}"`);
    }

    parts.push('app.py');

    return parts.join(' ');
  };

  const currentCommand = generateCommand();

  const handleCopy = (text: string, setter: (val: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  return (
    <div className="space-y-10">
      {/* Title section */}
      <div className="pb-6 border-b border-neutral-800">
        <h1 className="text-2xl font-bold text-neutral-100 font-sans tracking-tight">
          PyInstaller Packaging Studio & Standalone .EXE Guide
        </h1>
        <p className="text-sm text-neutral-400 mt-1 max-w-3xl font-sans">
          Turn your Python CustomTkinter script into a single, standalone executable that runs on any computer without needing Python installed.
        </p>
      </div>

      {/* 1. Exact One-Liner Box */}
      <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <h2 className="text-base font-semibold text-neutral-100 font-sans">
              The Exact PyInstaller Command
            </h2>
          </div>
          <span className="text-xs text-neutral-400 font-mono">
            Tested & Verified for CustomTkinter + yt-dlp
          </span>
        </div>

        {/* Command code block */}
        <div className="relative group">
          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 font-mono text-xs sm:text-sm text-emerald-400 overflow-x-auto selection:bg-emerald-500/20">
            <code>{currentCommand}</code>
          </div>

          <button
            onClick={() => handleCopy(currentCommand, setCopied)}
            className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs text-neutral-200 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-medium">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Command</span>
              </>
            )}
          </button>
        </div>

        {/* Interactive Flags Customizer */}
        <div className="pt-2 border-t border-neutral-800/80">
          <div className="text-xs font-semibold text-neutral-300 mb-3 font-sans">
            Customize Command Flags:
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            {/* Console toggle */}
            <label className="flex items-start gap-2.5 p-3 rounded-xl bg-neutral-950/60 border border-neutral-800 cursor-pointer hover:border-neutral-700 transition-colors">
              <input
                type="checkbox"
                checked={hideConsole}
                onChange={(e) => setHideConsole(e.target.checked)}
                className="mt-0.5 rounded accent-emerald-500"
              />
              <div>
                <span className="font-semibold text-neutral-200 font-mono">--noconsole</span>
                <p className="text-neutral-400 text-[11px] mt-0.5">
                  Hides the black console prompt window. Uncheck to view debug prints during troubleshooting.
                </p>
              </div>
            </label>

            {/* Single file toggle */}
            <label className="flex items-start gap-2.5 p-3 rounded-xl bg-neutral-950/60 border border-neutral-800 cursor-pointer hover:border-neutral-700 transition-colors">
              <input
                type="checkbox"
                checked={isOneFile}
                onChange={(e) => setIsOneFile(e.target.checked)}
                className="mt-0.5 rounded accent-emerald-500"
              />
              <div>
                <span className="font-semibold text-neutral-200 font-mono">--onefile</span>
                <p className="text-neutral-400 text-[11px] mt-0.5">
                  Bundles Python, libraries, and assets into a single portable <code className="text-neutral-300">.exe</code> file.
                </p>
              </div>
            </label>

            {/* Collect CustomTkinter assets */}
            <label className="flex items-start gap-2.5 p-3 rounded-xl bg-neutral-950/60 border border-neutral-800 cursor-pointer hover:border-neutral-700 transition-colors">
              <input
                type="checkbox"
                checked={collectCustomTkinter}
                onChange={(e) => setCollectCustomTkinter(e.target.checked)}
                className="mt-0.5 rounded accent-emerald-500"
              />
              <div>
                <span className="font-semibold text-emerald-400 font-mono">--collect-all customtkinter</span>
                <p className="text-neutral-400 text-[11px] mt-0.5">
                  <strong className="text-neutral-200">Critical!</strong> Includes CustomTkinter&apos;s theme JSON and font files.
                </p>
              </div>
            </label>

            {/* App Name */}
            <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800 flex flex-col justify-between">
              <div>
                <span className="font-semibold text-neutral-200 font-mono">--name &quot;{appName}&quot;</span>
                <p className="text-neutral-400 text-[11px] mt-0.5">Custom output executable name.</p>
              </div>
              <input
                type="text"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                className="mt-2 w-full px-2.5 py-1 text-xs rounded-md bg-neutral-900 border border-neutral-700 text-neutral-200 font-mono"
              />
            </div>

            {/* App Icon */}
            <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800 flex flex-col justify-between">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeIcon}
                  onChange={(e) => setIncludeIcon(e.target.checked)}
                  className="mt-0.5 rounded accent-emerald-500"
                />
                <div>
                  <span className="font-semibold text-neutral-200 font-mono">--icon=&quot;...&quot;</span>
                  <p className="text-neutral-400 text-[11px]">Attach Windows .ico icon file.</p>
                </div>
              </label>
              {includeIcon && (
                <input
                  type="text"
                  value={iconName}
                  onChange={(e) => setIconName(e.target.value)}
                  placeholder="icon.ico"
                  className="mt-2 w-full px-2.5 py-1 text-xs rounded-md bg-neutral-900 border border-neutral-700 text-neutral-200 font-mono"
                />
              )}
            </div>

            {/* Bundle FFmpeg */}
            <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800 flex flex-col justify-between">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={bundleFfmpeg}
                  onChange={(e) => setBundleFfmpeg(e.target.checked)}
                  className="mt-0.5 rounded accent-emerald-500"
                />
                <div>
                  <span className="font-semibold text-neutral-200 font-mono">--add-binary &quot;...;.&quot;</span>
                  <p className="text-neutral-400 text-[11px] mt-0.5">
                    Embeds FFmpeg binary directly into the standalone .exe bundle.
                  </p>
                </div>
              </label>
              {bundleFfmpeg && (
                <div className="mt-2 space-y-1">
                  <span className="text-[10px] text-neutral-400">Path to your ffmpeg.exe:</span>
                  <input
                    type="text"
                    value={ffmpegBinaryPath}
                    onChange={(e) => setFfmpegBinaryPath(e.target.value)}
                    placeholder="C:\ffmpeg\bin\ffmpeg.exe"
                    className="w-full px-2.5 py-1 text-xs rounded-md bg-neutral-900 border border-neutral-700 text-emerald-400 font-mono"
                  />
                  <div className="flex gap-1.5 pt-0.5">
                    <button
                      type="button"
                      onClick={() => setFfmpegBinaryPath('C:\\ffmpeg\\bin\\ffmpeg.exe')}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-mono cursor-pointer"
                    >
                      C:\ffmpeg\bin
                    </button>
                    <button
                      type="button"
                      onClick={() => setFfmpegBinaryPath('C:\\ffmpeg\\ffmpeg.exe')}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-mono cursor-pointer"
                    >
                      C:\ffmpeg
                    </button>
                    <button
                      type="button"
                      onClick={() => setFfmpegBinaryPath('ffmpeg.exe')}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-mono cursor-pointer"
                    >
                      Local
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* 2. Critical Warning: Why --collect-all customtkinter is mandatory */}
      <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-neutral-300 space-y-2">
        <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Why standard &quot;pyinstaller app.py&quot; fails with CustomTkinter</span>
        </div>
        <p className="text-xs leading-relaxed text-neutral-300">
          Unlike standard Tkinter, <strong className="text-white">CustomTkinter</strong> loads JSON theme files (<code className="text-amber-300 font-mono">green.json</code>, <code className="text-amber-300 font-mono">dark-blue.json</code>) and font assets at runtime from its installation directory.
          If you run PyInstaller without <code className="text-amber-300 font-mono">--collect-all customtkinter</code>, the resulting <code className="text-neutral-200">.exe</code> will crash immediately upon launch with:
        </p>
        <div className="p-2.5 rounded-lg bg-neutral-950 font-mono text-[11px] text-rose-400">
          FileNotFoundError: [Errno 2] No such file or directory: &apos;.../customtkinter/assets/themes/green.json&apos;
        </div>
        <p className="text-xs text-neutral-400">
          Adding <code className="text-emerald-400 font-mono">--collect-all customtkinter</code> copies all JSON themes, SVGs, and fonts into the PyInstaller bundle, guaranteeing a clean launch.
        </p>
      </div>

      {/* 3. Step-by-Step Packaging Walkthrough */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-neutral-100 font-sans">
          Step-by-Step Compilation Guide
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Step 1 */}
          <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">STEP 1</span>
              <span>Prerequisites</span>
            </div>
            <h3 className="text-sm font-semibold text-neutral-100">
              Install Python 3.10+
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Download Python from <a href="https://www.python.org" target="_blank" rel="noreferrer" className="text-emerald-400 underline">python.org</a>. 
              <strong className="text-neutral-200"> Important:</strong> Check the box that says <span className="text-neutral-200">&quot;Add python.exe to PATH&quot;</span> during setup.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">STEP 2</span>
              <span>Dependencies</span>
            </div>
            <h3 className="text-sm font-semibold text-neutral-100">
              Install Packages
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Open PowerShell, Terminal, or Command Prompt and run:
            </p>
            <div className="p-2.5 rounded-lg bg-neutral-950 font-mono text-xs text-emerald-400">
              pip install customtkinter yt-dlp pyinstaller
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">STEP 3</span>
              <span>Test Run</span>
            </div>
            <h3 className="text-sm font-semibold text-neutral-100">
              Verify the App Runs Locally
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Launch the script once to confirm everything opens properly:
            </p>
            <div className="p-2.5 rounded-lg bg-neutral-950 font-mono text-xs text-emerald-400">
              python app.py
            </div>
          </div>

          {/* Step 4 */}
          <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">STEP 4</span>
              <span>PyInstaller Build</span>
            </div>
            <h3 className="text-sm font-semibold text-neutral-100">
              Compile to Standalone .EXE
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Execute the bundling command:
            </p>
            <div className="p-2.5 rounded-lg bg-neutral-950 font-mono text-xs text-emerald-400 truncate">
              pyinstaller --noconsole --onefile --collect-all customtkinter app.py
            </div>
            <p className="text-[11px] text-neutral-500 mt-1">
              Your finished file will be created in the <code className="text-neutral-300">dist/</code> folder.
            </p>
          </div>

        </div>
      </div>

      {/* 4. The Critical FFmpeg Guide */}
      <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-semibold text-neutral-100 font-sans">
            FFmpeg Setup (Required for MP3 Conversion)
          </h2>
        </div>

        <p className="text-xs text-neutral-400 leading-relaxed">
          YouTube delivers audio streams in WebM (Opus codec) or MP4 (AAC codec). 
          <code className="text-neutral-300 font-mono">yt-dlp</code> requires <strong className="text-neutral-200">FFmpeg</strong> to extract and re-encode that stream into a clean <strong className="text-emerald-400">.mp3</strong> file. 
          Choose one of the 3 easy installation options below:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          
          {/* Option A: Windows Winget */}
          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 flex flex-col justify-between space-y-3">
            <div>
              <div className="text-xs font-semibold text-neutral-200">Windows (1-Command Install)</div>
              <p className="text-[11px] text-neutral-400 mt-1">
                Open PowerShell as Administrator and run:
              </p>
            </div>
            <div className="relative">
              <div className="p-2 rounded bg-neutral-900 font-mono text-[11px] text-emerald-400 pr-14">
                winget install Gyan.FFmpeg
              </div>
              <button
                onClick={() => handleCopy('winget install Gyan.FFmpeg', setCopiedWinget)}
                className="absolute right-1 top-1/2 -translate-y-1/2 px-2 py-1 text-[10px] rounded bg-neutral-800 text-neutral-200 hover:text-white"
              >
                {copiedWinget ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Option B: macOS Homebrew */}
          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 flex flex-col justify-between space-y-3">
            <div>
              <div className="text-xs font-semibold text-neutral-200">macOS (Homebrew)</div>
              <p className="text-[11px] text-neutral-400 mt-1">
                Run via Terminal:
              </p>
            </div>
            <div className="relative">
              <div className="p-2 rounded bg-neutral-900 font-mono text-[11px] text-emerald-400 pr-14">
                brew install ffmpeg
              </div>
              <button
                onClick={() => handleCopy('brew install ffmpeg', setCopiedBrew)}
                className="absolute right-1 top-1/2 -translate-y-1/2 px-2 py-1 text-[10px] rounded bg-neutral-800 text-neutral-200 hover:text-white"
              >
                {copiedBrew ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Option C: Portable ffmpeg.exe beside app */}
          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 flex flex-col justify-between space-y-3">
            <div>
              <div className="text-xs font-semibold text-neutral-200">Portable (Zero Install)</div>
              <p className="text-[11px] text-neutral-400 mt-1">
                Download <code className="text-emerald-400">ffmpeg.exe</code> and place it in the same directory as <code className="text-neutral-300">app.py</code> or <code className="text-neutral-300">YouTubeMP3Downloader.exe</code>.
              </p>
            </div>
            <div className="text-[11px] text-emerald-400 font-mono">
              Our code auto-detects local ffmpeg!
            </div>
          </div>

        </div>
      </div>

      {/* 5. Troubleshooting & FAQ */}
      <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-4">
        <h2 className="text-base font-semibold text-neutral-100 font-sans">
          PyInstaller Troubleshooting FAQ
        </h2>

        <div className="space-y-3 text-xs">
          <div className="p-3.5 rounded-xl bg-neutral-950/60 border border-neutral-800">
            <span className="font-semibold text-neutral-200">
              Q: Windows Defender flags the compiled .exe as an unrecognized application.
            </span>
            <p className="text-neutral-400 mt-1 leading-relaxed">
              This is a standard heuristic false-positive on freshly compiled PyInstaller single-file binaries because they unpack into a temporary directory (<code className="text-neutral-300">_MEIxxxxxx</code>) and lack an expensive commercial Authenticode code-signing certificate. Click &quot;More Info&quot; → &quot;Run Anyway&quot; in Windows SmartScreen.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-neutral-950/60 border border-neutral-800">
            <span className="font-semibold text-neutral-200">
              Q: How do I debug crashes if --noconsole is enabled?
            </span>
            <p className="text-neutral-400 mt-1 leading-relaxed">
              If an error occurs and the window closes immediately without an explanation, rebuild temporarily without <code className="text-neutral-300 font-mono">--noconsole</code> (or open PowerShell in the folder and run <code className="text-neutral-300 font-mono">.\dist\YouTubeMP3Downloader.exe</code>) to inspect the full traceback.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};

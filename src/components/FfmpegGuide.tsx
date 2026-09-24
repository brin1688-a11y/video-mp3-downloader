import React, { useState } from 'react';
import { 
  Cpu, 
  Terminal, 
  Copy, 
  Check, 
  ArrowRight, 
  CheckCircle2, 
  ExternalLink,
  HelpCircle,
  FileCheck
} from 'lucide-react';

export const FfmpegGuide: React.FC = () => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-neutral-800">
        <h1 className="text-2xl font-bold text-neutral-100 font-sans tracking-tight">
          FFmpeg Setup & Audio Pipeline Architecture
        </h1>
        <p className="text-sm text-neutral-400 mt-1 max-w-3xl font-sans">
          Understand why YouTube audio extraction requires FFmpeg and how our Python code automatically resolves it.
        </p>
      </div>

      {/* Visual Pipeline Architecture Diagram */}
      <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
        <h2 className="text-sm font-semibold text-neutral-200 font-sans">
          How yt-dlp Converts YouTube Streams to MP3
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center pt-2">
          {/* Node 1 */}
          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 text-center">
            <div className="text-xs font-semibold text-neutral-200">YouTube URL</div>
            <div className="text-[11px] text-neutral-500 font-mono mt-1">Video or Shorts</div>
            <div className="mt-2 text-[10px] text-neutral-400">yt-dlp parses audio stream</div>
          </div>

          <div className="hidden md:flex justify-center text-neutral-600">
            <ArrowRight className="w-5 h-5 text-emerald-400" />
          </div>

          {/* Node 2 */}
          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 text-center">
            <div className="text-xs font-semibold text-neutral-200">Raw Stream</div>
            <div className="text-[11px] text-amber-400 font-mono mt-1">.opus / .m4a</div>
            <div className="mt-2 text-[10px] text-neutral-400">Original YouTube audio</div>
          </div>

          <div className="hidden md:flex justify-center text-neutral-600">
            <ArrowRight className="w-5 h-5 text-emerald-400" />
          </div>

          {/* Node 3 */}
          <div className="p-4 rounded-xl bg-neutral-950 border border-emerald-500/30 text-center">
            <div className="text-xs font-semibold text-emerald-400 flex items-center justify-center gap-1">
              <Cpu className="w-3.5 h-3.5" />
              <span>FFmpeg Encoder</span>
            </div>
            <div className="text-[11px] text-neutral-400 font-mono mt-1">libmp3lame</div>
            <div className="mt-2 text-[10px] text-neutral-400">Transcodes stream to MP3</div>
          </div>

          <div className="hidden md:flex justify-center text-neutral-600">
            <ArrowRight className="w-5 h-5 text-emerald-400" />
          </div>

          {/* Node 4 */}
          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 text-center">
            <div className="text-xs font-semibold text-neutral-100">Clean MP3 File</div>
            <div className="text-[11px] text-emerald-400 font-mono mt-1">320 kbps .mp3</div>
            <div className="mt-2 text-[10px] text-neutral-400">Tagged with metadata</div>
          </div>
        </div>

        <p className="text-xs text-neutral-400 leading-relaxed pt-2">
          YouTube never stores raw MP3 audio on its servers; it stores Opus or AAC. To deliver an actual <strong className="text-neutral-200">.mp3</strong> file compatible with all music players and cars, <code className="text-emerald-400 font-mono">yt-dlp</code> invokes <code className="text-emerald-400 font-mono">ffmpeg</code> to extract and tag the audio.
        </p>
      </div>

      {/* OS Installation Instructions */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-neutral-100 font-sans">
          Installation by Operating System
        </h2>

        {/* Windows */}
        <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              <span>Windows Setup (Recommended 1-Liner)</span>
            </h3>
            <span className="text-xs text-neutral-500 font-mono">PowerShell</span>
          </div>

          <p className="text-xs text-neutral-400">
            Windows 10 & 11 include the official <code className="text-neutral-300">winget</code> package manager. Open PowerShell and paste:
          </p>

          <div className="relative">
            <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 font-mono text-xs text-emerald-400 pr-16">
              winget install Gyan.FFmpeg
            </div>
            <button
              onClick={() => copyText('winget install Gyan.FFmpeg', 'win-winget')}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-xs rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 cursor-pointer"
            >
              {copiedId === 'win-winget' ? 'Copied' : 'Copy'}
            </button>
          </div>

          <div className="text-xs text-neutral-400 pt-1">
            <strong>Manual Alternative:</strong> Download <code className="text-neutral-300 font-mono">ffmpeg-release-essentials.zip</code> from <a href="https://www.gyan.dev/ffmpeg/builds/" target="_blank" rel="noreferrer" className="text-emerald-400 underline">gyan.dev/ffmpeg/builds</a>, extract <code className="text-neutral-300 font-mono">ffmpeg.exe</code> from the <code className="text-neutral-300 font-mono">bin/</code> folder, and place it directly inside your app folder!
          </div>
        </div>

        {/* Dedicated: Have FFmpeg at C:\ffmpeg */}
        <div className="p-5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Already have FFmpeg installed at C:\ffmpeg?</span>
            </h3>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              Custom Location
            </span>
          </div>

          <p className="text-xs text-neutral-300 leading-relaxed">
            If your FFmpeg folder is at <code className="text-emerald-400 font-mono font-semibold">C:\ffmpeg</code>, you have <strong>two easy ways</strong> to make sure your app and system detect it seamlessly:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {/* Option 1: Automatic in app.py */}
            <div className="p-3.5 rounded-xl bg-neutral-950/80 border border-neutral-800 space-y-2">
              <div className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Option 1: Built into app.py (Zero Setup)</span>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Our updated <code className="text-neutral-300 font-mono">app.py</code> code automatically checks <code className="text-emerald-400 font-mono">C:\ffmpeg\bin\ffmpeg.exe</code> and <code className="text-emerald-400 font-mono">C:\ffmpeg\ffmpeg.exe</code> before falling back to system PATH!
              </p>
            </div>

            {/* Option 2: Add C:\ffmpeg to Windows PATH */}
            <div className="p-3.5 rounded-xl bg-neutral-950/80 border border-neutral-800 space-y-2">
              <div className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                <span>Option 2: Add to Windows PATH</span>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Run this command once in PowerShell so all apps & yt-dlp find <code className="text-neutral-300 font-mono">ffmpeg</code> globally:
              </p>
              <div className="relative">
                <div className="p-2 rounded bg-neutral-900 font-mono text-[10px] text-emerald-400 pr-14 select-all">
                  [Environment]::SetEnvironmentVariable(&quot;Path&quot;, $env:Path + &quot;;C:\ffmpeg\bin;C:\ffmpeg&quot;, &quot;User&quot;)
                </div>
                <button
                  onClick={() => copyText('[Environment]::SetEnvironmentVariable("Path", $env:Path + ";C:\\ffmpeg\\bin;C:\\ffmpeg", "User")', 'c-ffmpeg-path')}
                  className="absolute right-1 top-1/2 -translate-y-1/2 px-2 py-0.5 text-[10px] rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 cursor-pointer"
                >
                  {copiedId === 'c-ffmpeg-path' ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* macOS */}
        <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-neutral-300" />
              <span>macOS Setup (Homebrew)</span>
            </h3>
            <span className="text-xs text-neutral-500 font-mono">Terminal</span>
          </div>

          <div className="relative">
            <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 font-mono text-xs text-emerald-400 pr-16">
              brew install ffmpeg
            </div>
            <button
              onClick={() => copyText('brew install ffmpeg', 'mac-brew')}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-xs rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 cursor-pointer"
            >
              {copiedId === 'mac-brew' ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Linux */}
        <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Linux (Ubuntu / Debian / Mint)</span>
            </h3>
            <span className="text-xs text-neutral-500 font-mono">Bash</span>
          </div>

          <div className="relative">
            <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 font-mono text-xs text-emerald-400 pr-16">
              sudo apt update && sudo apt install -y ffmpeg
            </div>
            <button
              onClick={() => copyText('sudo apt update && sudo apt install -y ffmpeg', 'linux-apt')}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-xs rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 cursor-pointer"
            >
              {copiedId === 'linux-apt' ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>
      </div>

      {/* Verification Command */}
      <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-neutral-200">
          <FileCheck className="w-4 h-4 text-emerald-400" />
          <span>How to Test if FFmpeg is Ready on Your Machine</span>
        </div>
        <p className="text-xs text-neutral-400">
          Open a new command prompt or terminal window and enter:
        </p>
        <div className="p-2.5 rounded-lg bg-neutral-950 font-mono text-xs text-emerald-400">
          ffmpeg -version
        </div>
        <p className="text-[11px] text-neutral-500">
          If it displays &quot;ffmpeg version ... Copyright (c) 2000-2026 the FFmpeg developers&quot;, your environment is completely configured!
        </p>
      </div>
    </div>
  );
};

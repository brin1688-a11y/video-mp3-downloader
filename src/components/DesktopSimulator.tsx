import React, { useState, useEffect, useRef } from 'react';
import { 
  Copy, 
  FolderOpen, 
  Check, 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  AlertTriangle, 
  Sparkles,
  ExternalLink,
  Music2,
  Info
} from 'lucide-react';

interface DesktopSimulatorProps {
  accentColor: 'emerald' | 'indigo';
  onSelectAccent: (color: 'emerald' | 'indigo') => void;
  onOpenSourceCode: () => void;
}

const SAMPLE_TRACKS = [
  {
    title: "Lofi Hip Hop - Midnight Coffee",
    url: "https://www.youtube.com/watch?v=5qap5aO4i9A",
    duration: "2:45",
    author: "ChillHop Beats",
    frequency: 440 // A4 note for tone synth
  },
  {
    title: "Synthwave 1984 - Neon Highway",
    url: "https://www.youtube.com/watch?v=4xDzrJKXOOY",
    duration: "3:12",
    author: "Retrowave Collective",
    frequency: 330 // E4
  },
  {
    title: "Acoustic Sunset Fingerstyle Solo",
    url: "https://youtu.be/dQw4w9WgXcQ",
    duration: "2:10",
    author: "Guitar Lounge",
    frequency: 523 // C5
  },
  {
    title: "Shorts Audio - Viral Bassline",
    url: "https://www.youtube.com/shorts/3xyz987abcd",
    duration: "0:58",
    author: "Sound Trend",
    frequency: 392 // G4
  }
];

export const DesktopSimulator: React.FC<DesktopSimulatorProps> = ({
  accentColor,
  onSelectAccent,
  onOpenSourceCode
}) => {
  // CustomTkinter appearance mode in simulated window
  const [appearanceMode, setAppearanceMode] = useState<'Dark' | 'Light'>('Dark');
  
  // App state
  const [url, setUrl] = useState('');
  const [selectedBitrate, setSelectedBitrate] = useState<'192 kbps' | '256 kbps' | '320 kbps'>('320 kbps');
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Ready · Paste a YouTube URL to begin');
  const [statusType, setStatusType] = useState<'neutral' | 'success' | 'error' | 'warn'>('neutral');
  
  // Spinner animation frames
  const spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  const [spinnerIndex, setSpinnerIndex] = useState(0);

  // Audio preview simulation
  const [downloadedItem, setDownloadedItem] = useState<{
    title: string;
    bitrate: string;
    size: string;
    frequency: number;
  } | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [history, setHistory] = useState<Array<{ title: string; bitrate: string; timestamp: string }>>([
    { title: "Midnight Ambient Chill - Episode 42.mp3", bitrate: "320 kbps", timestamp: "10 mins ago" },
    { title: "Lo-Fi Study Session Vol. 3.mp3", bitrate: "320 kbps", timestamp: "Yesterday" }
  ]);

  // Audio Context Ref for Web Audio Synth
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);

  // Color mappings based on theme
  const accentClasses = accentColor === 'emerald'
    ? {
        primary: 'bg-emerald-500 hover:bg-emerald-600 text-white',
        text: 'text-emerald-500',
        textLight: 'text-emerald-600',
        progress: 'bg-emerald-500',
        border: 'border-emerald-500/30',
        glow: 'shadow-emerald-500/10',
        segmentedActive: 'bg-emerald-500 text-white'
      }
    : {
        primary: 'bg-indigo-600 hover:bg-indigo-700 text-white',
        text: 'text-indigo-400',
        textLight: 'text-indigo-600',
        progress: 'bg-indigo-500',
        border: 'border-indigo-500/30',
        glow: 'shadow-indigo-500/10',
        segmentedActive: 'bg-indigo-600 text-white'
      };

  // Spinner tick effect
  useEffect(() => {
    if (!isDownloading) return;
    const interval = setInterval(() => {
      setSpinnerIndex(prev => (prev + 1) % spinnerFrames.length);
    }, 100);
    return () => clearInterval(interval);
  }, [isDownloading]);

  // Play pleasant chime on download completion using Web Audio API
  const playCompletionChime = () => {
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const now = ctx.currentTime;
      
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5 major triad
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);
        
        gain.gain.setValueAtTime(0, now + idx * 0.1);
        gain.gain.linearRampToValueAtTime(0.15, now + idx * 0.1 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.1 + 0.6);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.6);
      });
    } catch {
      // Audio context might be restricted before interaction
    }
  };

  // Web Audio Synth for playing track preview
  const togglePlayAudio = () => {
    if (isPlayingAudio) {
      if (oscRef.current) {
        oscRef.current.stop();
        oscRef.current.disconnect();
        oscRef.current = null;
      }
      setIsPlayingAudio(false);
      return;
    }

    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const freq = downloadedItem?.frequency || 440;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      // Low soothing volume with gentle tremolo
      gain.gain.setValueAtTime(0.12, ctx.currentTime);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      oscRef.current = osc;
      setIsPlayingAudio(true);

      // Auto stop after 6 seconds preview
      setTimeout(() => {
        if (oscRef.current) {
          try {
            oscRef.current.stop();
            oscRef.current.disconnect();
          } catch {
            // Already stopped
          }
          oscRef.current = null;
          setIsPlayingAudio(false);
        }
      }, 6000);
    } catch {
      setIsPlayingAudio(false);
    }
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (oscRef.current) {
        try {
          oscRef.current.stop();
          oscRef.current.disconnect();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  // Validate URL matching YouTube pattern
  const validateUrl = (testUrl: string) => {
    const patterns = [
      /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+/,
      /^https?:\/\/(www\.)?youtu\.be\/[\w-]+/,
      /^https?:\/\/(www\.)?youtube\.com\/shorts\/[\w-]+/,
      /^https?:\/\/music\.youtube\.com\/watch\?v=[\w-]+/
    ];
    return patterns.some(pattern => pattern.test(testUrl.trim()));
  };

  // Paste from clipboard handler
  const handlePaste = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text.trim()) {
          setUrl(text.trim());
          setStatusText('Link pasted from clipboard');
          setStatusType('success');
          return;
        }
      }
    } catch {
      // Clipboard permission denied or unsupported in iframe
    }
    // Fallback: paste the first sample track
    setUrl(SAMPLE_TRACKS[0].url);
    setStatusText('Sample link pasted');
    setStatusType('neutral');
  };

  // Start simulated download matching CustomTkinter + yt-dlp lifecycle
  const handleStartDownload = () => {
    if (isDownloading) return;

    if (!url.trim()) {
      setStatusText('Please enter a YouTube link');
      setStatusType('warn');
      return;
    }

    if (!validateUrl(url)) {
      setStatusText('Invalid YouTube URL. Please verify the link.');
      setStatusType('error');
      return;
    }

    // Begin download
    setIsDownloading(true);
    setProgress(0.05);
    setStatusText('Connecting & fetching video metadata...');
    setStatusType('neutral');

    // Find title from sample tracks or create clean title
    const matchingSample = SAMPLE_TRACKS.find(t => t.url === url.trim());
    const videoTitle = matchingSample 
      ? matchingSample.title 
      : `YouTube Audio - ${url.substring(url.indexOf('v=') + 2 || 20, 36)}`;
    const frequency = matchingSample ? matchingSample.frequency : 440;

    // Stage 1: Metadata fetched (0.8s)
    setTimeout(() => {
      setProgress(0.2);
      setStatusText(`Downloading: ${videoTitle.slice(0, 32)}...`);

      // Stage 2: Downloading audio chunks (1.8s)
      const downloadInterval = setInterval(() => {
        setProgress(p => {
          if (p >= 0.85) {
            clearInterval(downloadInterval);
            
            // Stage 3: FFmpeg Conversion
            setStatusText('Converting audio to MP3 via FFmpeg...');
            setProgress(0.92);

            setTimeout(() => {
              // Stage 4: Finished!
              setProgress(1.0);
              const cleanTitle = videoTitle.length > 28 ? videoTitle.slice(0, 28) + '...' : videoTitle;
              setStatusText(`✓ Success! Saved: ${cleanTitle}.mp3`);
              setStatusType('success');
              setIsDownloading(false);

              // Set downloaded preview item
              setDownloadedItem({
                title: videoTitle,
                bitrate: selectedBitrate,
                size: (Math.random() * 4 + 4.5).toFixed(1) + ' MB',
                frequency
              });

              // Add to history
              setHistory(prev => [
                { title: `${videoTitle}.mp3`, bitrate: selectedBitrate, timestamp: 'Just now' },
                ...prev.slice(0, 5)
              ]);

              // Play chime
              playCompletionChime();
            }, 900);

            return 0.85;
          }
          const increment = 0.15 + Math.random() * 0.1;
          const nextVal = Math.min(0.85, p + increment);
          const percent = Math.round(nextVal * 100);
          const speed = (Math.random() * 2 + 4.1).toFixed(1);
          setStatusText(`Downloading: ${percent}% · ${speed} MiB/s · ETA: 00:02`);
          return nextVal;
        });
      }, 350);

    }, 800);
  };

  // Simulate specific error states for UX testing
  const triggerSimulatedError = (type: 'invalid' | 'ffmpeg' | 'private') => {
    if (isDownloading) return;
    if (type === 'invalid') {
      setUrl('https://not-a-youtube-link.org/xyz');
      setStatusText('Invalid YouTube URL. Check the link.');
      setStatusType('error');
    } else if (type === 'ffmpeg') {
      setUrl('https://www.youtube.com/watch?v=5qap5aO4i9A');
      setIsDownloading(true);
      setStatusText('Connecting...');
      setTimeout(() => {
        setIsDownloading(false);
        setProgress(0);
        setStatusText('FFmpeg is required for MP3 conversion. Please install FFmpeg.');
        setStatusType('error');
      }, 800);
    } else if (type === 'private') {
      setUrl('https://www.youtube.com/watch?v=private123');
      setIsDownloading(true);
      setStatusText('Fetching video metadata...');
      setTimeout(() => {
        setIsDownloading(false);
        setProgress(0);
        setStatusText('Video is private or unavailable.');
        setStatusType('error');
      }, 900);
    }
  };

  const isDark = appearanceMode === 'Dark';

  return (
    <div className="space-y-8">
      {/* Introduction banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
        <div>
          <h1 className="text-2xl font-bold text-neutral-100 font-sans tracking-tight">
            Interactive Desktop Simulator
          </h1>
          <p className="text-sm text-neutral-400 mt-1 max-w-2xl font-sans">
            Test the live 480×320 CustomTkinter application right in your browser. 
            Experience the exact window hierarchy, background threading responsiveness, progress tracking, and theme switching.
          </p>
        </div>

        {/* Theme customization controls */}
        <div className="flex items-center gap-3 bg-neutral-900 border border-neutral-800 p-2 rounded-xl">
          <span className="text-xs text-neutral-400 font-medium px-2">Accent:</span>
          <button
            onClick={() => onSelectAccent('emerald')}
            className={`px-3 py-1 text-xs rounded-lg transition-colors font-medium flex items-center gap-1.5 ${
              accentColor === 'emerald'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            Emerald
          </button>
          <button
            onClick={() => onSelectAccent('indigo')}
            className={`px-3 py-1 text-xs rounded-lg transition-colors font-medium flex items-center gap-1.5 ${
              accentColor === 'indigo'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
            Indigo
          </button>
        </div>
      </div>

      {/* Main Showcase Layout: Window on Left, Controls & Inspection on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Col: The 480x320 Desktop App Frame */}
        <div className="lg:col-span-7 flex flex-col items-center">
          
          {/* Virtual OS Desktop Environment */}
          <div className="w-full max-w-[540px] p-4 sm:p-6 bg-gradient-to-b from-neutral-900 via-neutral-900/90 to-neutral-950 rounded-2xl border border-neutral-800 shadow-2xl flex flex-col items-center">
            
            <div className="w-full flex items-center justify-between text-xs text-neutral-500 mb-3 px-1">
              <span className="font-mono">Viewport: 480 × 330 px (CustomTkinter)</span>
              <span className="text-neutral-400">Scale: 100%</span>
            </div>

            {/* Simulated Desktop Window Frame (480x330 aspect) */}
            <div 
              style={{ width: '100%', maxWidth: '480px', minHeight: '330px' }}
              className={`rounded-xl border transition-colors duration-200 shadow-xl overflow-hidden flex flex-col ${
                isDark 
                  ? 'bg-zinc-950 border-zinc-800 text-zinc-100' 
                  : 'bg-zinc-50 border-zinc-300 text-zinc-900'
              }`}
            >
              {/* Window Title Bar */}
              <div className={`h-8 px-3.5 flex items-center justify-between select-none border-b ${
                isDark ? 'bg-zinc-900/90 border-zinc-800/80 text-zinc-300' : 'bg-zinc-200/80 border-zinc-300 text-zinc-700'
              }`}>
                {/* Window buttons */}
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80 hover:opacity-100 transition-opacity cursor-pointer" title="Close" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80 hover:opacity-100 transition-opacity cursor-pointer" title="Minimize" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80 hover:opacity-100 transition-opacity cursor-pointer" title="Zoom" />
                </div>

                {/* Window Title */}
                <div className="text-xs font-semibold tracking-wide flex items-center gap-1.5">
                  <span className={accentClasses.text}>♫</span>
                  <span>YouTube MP3 Downloader</span>
                </div>

                <div className="w-12 text-right">
                  <span className="text-[10px] text-zinc-500 font-mono">v1.0</span>
                </div>
              </div>

              {/* CustomTkinter App Container (with generous 24px padding matching Python setup) */}
              <div className="p-6 flex-1 flex flex-col justify-between">
                
                {/* 1. TOP SECTION: Header + Theme Switcher */}
                <div className="flex items-center justify-between pb-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-xl font-bold ${accentClasses.text}`}>♫</span>
                    <span className={`text-lg font-bold tracking-tight ${isDark ? 'text-zinc-50' : 'text-zinc-900'}`}>
                      MP3 Downloader
                    </span>
                  </div>

                  {/* Dark / Light CustomTkinter Mode Button */}
                  <button
                    onClick={() => setAppearanceMode(prev => prev === 'Dark' ? 'Light' : 'Dark')}
                    className={`text-xs px-2.5 py-1 rounded-md transition-colors font-medium border flex items-center gap-1 cursor-pointer ${
                      isDark
                        ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800'
                        : 'bg-zinc-200 hover:bg-zinc-300 text-zinc-800 border-zinc-300'
                    }`}
                  >
                    {isDark ? '☀ Light' : '🌙 Dark'}
                  </button>
                </div>

                {/* 2. MIDDLE SECTION: URL Input, Paste Button, Bitrate, CTA */}
                <div className="space-y-3 my-auto">
                  {/* URL Input Row */}
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        disabled={isDownloading}
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleStartDownload()}
                        placeholder="Paste YouTube link here..."
                        className={`w-full h-10 px-3.5 text-sm rounded-lg border outline-none transition-all ${
                          isDark
                            ? 'bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-700'
                            : 'bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400'
                        } ${isDownloading ? 'opacity-60 cursor-not-allowed' : ''}`}
                      />
                      {url && !isDownloading && (
                        <button
                          onClick={() => setUrl('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-500 hover:text-zinc-300"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={isDownloading}
                      onClick={handlePaste}
                      className={`h-10 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                        isDark
                          ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border-zinc-800'
                          : 'bg-zinc-200 hover:bg-zinc-300 text-zinc-800 border-zinc-300'
                      } ${isDownloading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      title="Paste from clipboard"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Paste</span>
                    </button>
                  </div>

                  {/* Quality & Folder Row */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className={isDark ? 'text-zinc-400' : 'text-zinc-500'}>Quality:</span>
                      <div className={`flex items-center p-0.5 rounded-lg border ${
                        isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-200 border-zinc-300'
                      }`}>
                        {(['192 kbps', '256 kbps', '320 kbps'] as const).map(rate => (
                          <button
                            key={rate}
                            type="button"
                            disabled={isDownloading}
                            onClick={() => setSelectedBitrate(rate)}
                            className={`px-2 py-0.5 text-[11px] font-medium rounded-md transition-all ${
                              selectedBitrate === rate
                                ? accentClasses.segmentedActive
                                : isDark
                                ? 'text-zinc-400 hover:text-zinc-200'
                                : 'text-zinc-600 hover:text-zinc-900'
                            }`}
                          >
                            {rate.replace(' kbps', '')}k
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsFolderModalOpen(true)}
                      className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors cursor-pointer ${
                        isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-600 hover:text-zinc-900'
                      }`}
                    >
                      <FolderOpen className="w-3.5 h-3.5" />
                      <span>Downloads</span>
                    </button>
                  </div>

                  {/* Main Action Download Button */}
                  <button
                    type="button"
                    disabled={isDownloading}
                    onClick={handleStartDownload}
                    className={`w-full h-11 rounded-lg font-semibold text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                      accentClasses.primary
                    } ${isDownloading ? 'opacity-80 cursor-not-allowed' : 'active:scale-[0.99]'}`}
                  >
                    {isDownloading ? (
                      <span className="font-mono flex items-center gap-2">
                        <span className="text-base">{spinnerFrames[spinnerIndex]}</span>
                        <span>Downloading audio...</span>
                      </span>
                    ) : (
                      <span>Download MP3</span>
                    )}
                  </button>
                </div>

                {/* 3. BOTTOM SECTION: Progress Bar & Status Text */}
                <div className="space-y-2 pt-2">
                  {/* Progress Bar */}
                  <div className={`w-full h-1.5 rounded-full overflow-hidden ${
                    isDark ? 'bg-zinc-800' : 'bg-zinc-200'
                  }`}>
                    <div 
                      className={`h-full transition-all duration-300 ease-out ${accentClasses.progress}`}
                      style={{ width: `${Math.round(progress * 100)}%` }}
                    />
                  </div>

                  {/* Dynamic Status Text */}
                  <div className="flex items-center justify-between text-xs min-h-[18px]">
                    <span className={`truncate font-sans ${
                      statusType === 'success'
                        ? 'text-emerald-500 font-medium'
                        : statusType === 'error'
                        ? 'text-rose-500 font-medium'
                        : statusType === 'warn'
                        ? 'text-amber-500 font-medium'
                        : isDark ? 'text-zinc-400' : 'text-zinc-500'
                    }`}>
                      {statusText}
                    </span>

                    {progress > 0 && progress < 1 && (
                      <span className="font-mono text-[11px] text-zinc-400 ml-2 tabular-nums">
                        {Math.round(progress * 100)}%
                      </span>
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* Window info footer */}
            <div className="mt-4 flex items-center gap-4 text-xs text-neutral-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live CustomTkinter Simulation
              </span>
              <span>·</span>
              <button
                onClick={onOpenSourceCode}
                className="text-emerald-400 hover:text-emerald-300 underline underline-offset-4 cursor-pointer"
              >
                Inspect app.py
              </button>
            </div>

          </div>

          {/* Downloaded Audio Preview Card */}
          {downloadedItem && (
            <div className="w-full max-w-[540px] mt-4 p-4 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <Music2 className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-neutral-200 truncate">
                    {downloadedItem.title}
                  </div>
                  <div className="text-[11px] text-neutral-400 flex items-center gap-2 mt-0.5">
                    <span>{downloadedItem.bitrate}</span>
                    <span>·</span>
                    <span>{downloadedItem.size}</span>
                    <span>·</span>
                    <span className="text-emerald-400">Ready in Downloads</span>
                  </div>
                </div>
              </div>

              {/* Mini Audio Player Play/Stop */}
              <button
                onClick={togglePlayAudio}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer ${
                  isPlayingAudio
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                }`}
              >
                {isPlayingAudio ? (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    <span>Stop Preview</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    <span>Play Audio Preview</span>
                  </>
                )}
              </button>
            </div>
          )}

        </div>

        {/* Right Col: Quick Link Presets, Error Simulation & Architecture */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Quick 1-Click Sample Links */}
          <div className="p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-neutral-200 font-sans">
                Quick Test Links (1-Click)
              </h2>
              <span className="text-xs text-neutral-500 font-mono">Click to load</span>
            </div>
            <p className="text-xs text-neutral-400 mb-3 font-sans">
              Click any sample YouTube track below to auto-populate the URL input and test the downloader:
            </p>

            <div className="space-y-2">
              {SAMPLE_TRACKS.map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setUrl(sample.url);
                    setStatusText('Sample link loaded · Press Download');
                    setStatusType('neutral');
                  }}
                  className="w-full text-left p-2.5 rounded-xl bg-neutral-950/60 hover:bg-neutral-800 border border-neutral-800/80 hover:border-neutral-700 transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="min-w-0 pr-2">
                    <div className="text-xs font-medium text-neutral-200 group-hover:text-emerald-400 transition-colors truncate">
                      {sample.title}
                    </div>
                    <div className="text-[11px] text-neutral-500 font-mono truncate">
                      {sample.url}
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-neutral-500 shrink-0">
                    {sample.duration}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Test Error Handling Scenarios */}
          <div className="p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800">
            <h2 className="text-sm font-semibold text-neutral-200 font-sans mb-1">
              UX Error Resilience Simulator
            </h2>
            <p className="text-xs text-neutral-400 mb-3 font-sans">
              Test how the desktop application reports clear and friendly notifications for edge cases:
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => triggerSimulatedError('invalid')}
                disabled={isDownloading}
                className="p-2.5 text-left rounded-xl bg-neutral-950/60 hover:bg-neutral-800 border border-neutral-800/80 text-xs text-neutral-300 hover:text-white transition-colors cursor-pointer"
              >
                <div className="font-semibold text-neutral-200">Invalid Link</div>
                <div className="text-[11px] text-neutral-500 mt-0.5">Regex pattern check</div>
              </button>

              <button
                onClick={() => triggerSimulatedError('ffmpeg')}
                disabled={isDownloading}
                className="p-2.5 text-left rounded-xl bg-neutral-950/60 hover:bg-neutral-800 border border-neutral-800/80 text-xs text-neutral-300 hover:text-white transition-colors cursor-pointer"
              >
                <div className="font-semibold text-neutral-200">Missing FFmpeg</div>
                <div className="text-[11px] text-neutral-500 mt-0.5">Detects ffmpeg in PATH</div>
              </button>

              <button
                onClick={() => triggerSimulatedError('private')}
                disabled={isDownloading}
                className="p-2.5 text-left rounded-xl bg-neutral-950/60 hover:bg-neutral-800 border border-neutral-800/80 text-xs text-neutral-300 hover:text-white transition-colors cursor-pointer col-span-2"
              >
                <div className="font-semibold text-neutral-200">Private / Age-Restricted Video</div>
                <div className="text-[11px] text-neutral-500 mt-0.5">yt-dlp DownloadError catch block</div>
              </button>
            </div>
          </div>

          {/* Architecture Checklist Callout */}
          <div className="p-5 rounded-2xl bg-neutral-900/40 border border-neutral-800/60 space-y-3">
            <h2 className="text-sm font-semibold text-neutral-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Key Technical Highlights in Python Code</span>
            </h2>

            <ul className="space-y-2 text-xs text-neutral-400 font-sans">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span><strong>Daemon Threading:</strong> Download runs in a background thread so the GUI never locks or reports &quot;Not Responding&quot;.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span><strong>Thread-Safe GUI Updates:</strong> Uses CustomTkinter&apos;s <code className="text-neutral-200 font-mono">self.after(0, ...)</code> to safely update progress bars and labels.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span><strong>Auto FFmpeg Resolution:</strong> Looks in bundled <code className="text-neutral-200 font-mono">sys._MEIPASS</code>, beside the executable, and in system PATH.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span><strong>High-Quality MP3:</strong> Sets yt-dlp <code className="text-neutral-200 font-mono">FFmpegExtractAudio</code> with user-selected bitrate up to 320 kbps.</span>
              </li>
            </ul>
          </div>

        </div>

      </div>

      {/* Simulated Downloads Folder Modal */}
      {isFolderModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-semibold text-neutral-200">
                  Simulated Downloads Directory
                </span>
              </div>
              <button
                onClick={() => setIsFolderModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-200 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-3">
              <div className="text-xs text-neutral-400">
                In the desktop Python application, clicking <strong className="text-neutral-200">Downloads</strong> runs <code className="text-emerald-400 font-mono">os.startfile(folder)</code> (Windows) or <code className="text-emerald-400 font-mono">subprocess.run([&apos;open&apos;, folder])</code> (macOS) to directly open Explorer/Finder.
              </div>

              <div className="space-y-2 mt-4">
                <div className="text-xs font-semibold text-neutral-300">
                  Recent Saved MP3s:
                </div>
                {history.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs">
                    <div className="flex items-center gap-2.5 truncate">
                      <Music2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="text-neutral-200 truncate font-mono">{item.title}</span>
                    </div>
                    <div className="flex items-center gap-3 text-neutral-500 font-mono text-[11px] shrink-0">
                      <span>{item.bitrate}</span>
                      <span>{item.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-5 py-3 border-t border-neutral-800 bg-neutral-950/50 flex justify-end">
              <button
                onClick={() => setIsFolderModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-neutral-200 bg-neutral-800 hover:bg-neutral-700 rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

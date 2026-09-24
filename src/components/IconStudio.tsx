import React, { useState, useRef } from 'react';
import { 
  Download, 
  Copy, 
  Check, 
  Sparkles, 
  Sliders, 
  Palette, 
  Layers, 
  Terminal, 
  CheckCircle2,
  FileCode,
  ArrowRight
} from 'lucide-react';

interface IconPreset {
  id: string;
  name: string;
  style: 'emerald-neon' | 'obsidian-gold' | 'cyber-cyan' | 'ruby-red';
  symbol: 'musical-wave' | 'disc-download' | 'play-note' | 'minimal-waveform';
  bgGradient: [string, string];
  accentColor: string;
  glowColor: string;
}

const PRESETS: IconPreset[] = [
  {
    id: 'emerald-neon',
    name: 'Emerald Wave (Default)',
    style: 'emerald-neon',
    symbol: 'musical-wave',
    bgGradient: ['#09090b', '#18181b'],
    accentColor: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.45)',
  },
  {
    id: 'cyber-cyan',
    name: 'Cyan Soundwave',
    style: 'cyber-cyan',
    symbol: 'play-note',
    bgGradient: ['#030712', '#0f172a'],
    accentColor: '#06b6d4',
    glowColor: 'rgba(6, 182, 212, 0.45)',
  },
  {
    id: 'obsidian-gold',
    name: 'Studio Master Vinyl',
    style: 'obsidian-gold',
    symbol: 'disc-download',
    bgGradient: ['#1c1917', '#292524'],
    accentColor: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.45)',
  },
  {
    id: 'ruby-red',
    name: 'YouTube Crimson MP3',
    style: 'ruby-red',
    symbol: 'minimal-waveform',
    bgGradient: ['#0f0507', '#270a12'],
    accentColor: '#f43f5e',
    glowColor: 'rgba(244, 63, 94, 0.45)',
  },
];

export const IconStudio: React.FC = () => {
  const [selectedPreset, setSelectedPreset] = useState<IconPreset>(PRESETS[0]);
  const [appName, setAppName] = useState('YouTubeMP3Downloader');
  const [copiedPython, setCopiedPython] = useState(false);
  const [copiedPillow, setCopiedPillow] = useState(false);
  const [copiedCommand, setCopiedCommand] = useState(false);
  const [cornerRadius, setCornerRadius] = useState(48); // squircle curvature
  const [showGloss, setShowGloss] = useState(true);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Export SVG directly
  const handleDownloadSVG = () => {
    if (!svgRef.current) return;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svgRef.current);
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${appName.toLowerCase()}_icon.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export as 256x256 and 512x512 PNG via HTML5 Canvas
  const handleDownloadPNG = (size: number = 256) => {
    if (!svgRef.current) return;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svgRef.current);
    const svgBlob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const URLObject = window.URL || window.webkitURL || window;
    const blobURL = URLObject.createObjectURL(svgBlob);

    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext('2d');
      if (context) {
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';
        context.drawImage(image, 0, 0, size, size);
        const pngUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `${appName.toLowerCase()}_${size}x${size}.png`;
        link.href = pngUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      URLObject.revokeObjectURL(blobURL);
    };
    image.src = blobURL;
  };

  // Generate multi-size Windows .ICO file directly in the browser!
  // Windows .ico format: 6-byte header + 16-byte directory entries + PNG data for 256x256, 128x128, 64x64, 32x32, 16x16
  const handleDownloadICO = async () => {
    if (!svgRef.current) return;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svgRef.current);
    const svgBlob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const URLObject = window.URL || window.webkitURL;
    const blobURL = URLObject.createObjectURL(svgBlob);

    const image = new Image();
    image.onload = async () => {
      const sizes = [256, 64, 48, 32, 16];
      const pngBuffers: { size: number; buffer: Uint8Array }[] = [];

      for (const s of sizes) {
        const canvas = document.createElement('canvas');
        canvas.width = s;
        canvas.height = s;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(image, 0, 0, s, s);
          const dataUrl = canvas.toDataURL('image/png');
          const base64 = dataUrl.split(',')[1];
          const binaryStr = atob(base64);
          const len = binaryStr.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
          }
          pngBuffers.push({ size: s, buffer: bytes });
        }
      }

      // Build ICO file binary
      // ICONDIR: 3 WORDS (reserved=0, type=1 for icon, count=N)
      const numImages = pngBuffers.length;
      const headerSize = 6;
      const dirEntrySize = 16;
      let totalSize = headerSize + dirEntrySize * numImages;
      for (const item of pngBuffers) {
        totalSize += item.buffer.byteLength;
      }

      const icoArray = new Uint8Array(totalSize);
      const view = new DataView(icoArray.buffer);

      // Header
      view.setUint16(0, 0, true); // Reserved
      view.setUint16(2, 1, true); // Type: 1 = Icon
      view.setUint16(4, numImages, true); // Count

      let offset = headerSize + dirEntrySize * numImages;

      for (let i = 0; i < numImages; i++) {
        const item = pngBuffers[i];
        const entryOffset = headerSize + i * dirEntrySize;
        const widthByte = item.size === 256 ? 0 : item.size;
        const heightByte = item.size === 256 ? 0 : item.size;

        view.setUint8(entryOffset + 0, widthByte);
        view.setUint8(entryOffset + 1, heightByte);
        view.setUint8(entryOffset + 2, 0); // Palette count
        view.setUint8(entryOffset + 3, 0); // Reserved
        view.setUint16(entryOffset + 4, 1, true); // Color planes
        view.setUint16(entryOffset + 6, 32, true); // Bits per pixel
        view.setUint32(entryOffset + 8, item.buffer.byteLength, true); // Data size
        view.setUint32(entryOffset + 12, offset, true); // File offset

        icoArray.set(item.buffer, offset);
        offset += item.buffer.byteLength;
      }

      const icoBlob = new Blob([icoArray], { type: 'image/x-icon' });
      const icoUrl = URLObject.createObjectURL(icoBlob);
      const link = document.createElement('a');
      link.download = 'icon.ico';
      link.href = icoUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URLObject.revokeObjectURL(icoUrl);
      URLObject.revokeObjectURL(blobURL);
    };
    image.src = blobURL;
  };

  const copyText = (text: string, setter: (val: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  const pythonScriptContent = `from PIL import Image

# Convert any 256x256 or 512x512 PNG to a multi-resolution Windows .ico
img = Image.open("${appName.toLowerCase()}_256x256.png")
icon_sizes = [(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)]
img.save("icon.ico", format="ICO", sizes=icon_sizes)
print("✓ Successfully generated icon.ico with all Windows sizes!")
`;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-neutral-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-neutral-100 font-sans tracking-tight">
              Windows .EXE Icon & Logo Studio
            </h1>
            <p className="text-sm text-neutral-400 mt-1 max-w-3xl font-sans">
              Create and download a professional <strong className="text-emerald-400 font-mono">icon.ico</strong> for your compiled PyInstaller executable with true multi-resolution support (16×16 to 256×256 px).
            </p>
          </div>

          <button
            onClick={handleDownloadICO}
            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/10 shrink-0"
          >
            <Download className="w-4 h-4 text-neutral-950" />
            <span>Download icon.ico (Direct)</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Interactive Canvas Preview + Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left column: Live 256x256 Preview with Mock Windows Desktop Card */}
        <div className="lg:col-span-6 space-y-6">
          <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col items-center justify-center relative overflow-hidden">
            
            {/* Ambient Background glow */}
            <div 
              className="absolute w-72 h-72 rounded-full blur-3xl opacity-20 pointer-events-none"
              style={{ backgroundColor: selectedPreset.accentColor }}
            />

            <div className="relative z-10 flex flex-col items-center">
              {/* Scalable SVG Vector (256x256 viewbox) */}
              <div className="p-2 rounded-3xl bg-neutral-950/70 border border-neutral-800 shadow-2xl backdrop-blur-sm">
                <svg
                  ref={svgRef}
                  width="220"
                  height="220"
                  viewBox="0 0 256 256"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="rounded-[36px] overflow-hidden"
                >
                  <defs>
                    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor={selectedPreset.bgGradient[0]} />
                      <stop offset="100%" stopColor={selectedPreset.bgGradient[1]} />
                    </linearGradient>

                    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor={selectedPreset.accentColor} />
                      <stop offset="100%" stopColor="#ffffff" />
                    </linearGradient>

                    <linearGradient id="glossGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#ffffff" stopOpacity="0.18" />
                      <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
                    </linearGradient>

                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor={selectedPreset.accentColor} floodOpacity="0.5" />
                    </filter>
                  </defs>

                  {/* Outer Squircle Container */}
                  <rect
                    x="4"
                    y="4"
                    width="248"
                    height="248"
                    rx={cornerRadius}
                    fill="url(#bgGrad)"
                    stroke="rgba(255,255,255,0.12)"
                    strokeWidth="4"
                  />

                  {/* Inner Bevel Border */}
                  <rect
                    x="12"
                    y="12"
                    width="232"
                    height="232"
                    rx={cornerRadius - 8}
                    fill="none"
                    stroke={selectedPreset.accentColor}
                    strokeWidth="1.5"
                    strokeOpacity="0.3"
                  />

                  {/* Subtle Top Glass Gloss reflection */}
                  {showGloss && (
                    <path
                      d={`M 14 14 C 14 14 80 14 128 14 C 176 14 242 14 242 14 C 242 14 242 70 242 90 C 180 120 70 120 14 90 Z`}
                      fill="url(#glossGrad)"
                    />
                  )}

                  {/* SYMBOL GRAPHICS ACCORDING TO PRESET */}
                  {selectedPreset.symbol === 'musical-wave' && (
                    <g filter="url(#glow)">
                      {/* Musical Note with Audio Wave Tail */}
                      {/* Stem */}
                      <path
                        d="M152 70 L152 165 C152 178 140 188 126 188 C112 188 100 178 100 165 C100 152 112 142 126 142 C134 142 142 146 146 151 L146 88 L188 78 L188 108 L152 118"
                        fill={selectedPreset.accentColor}
                      />
                      {/* Note head */}
                      <ellipse cx="122" cy="165" rx="22" ry="16" fill={selectedPreset.accentColor} transform="rotate(-15 122 165)" />
                      {/* Note beam */}
                      <path d="M148 70 L194 60 L194 82 L148 92 Z" fill={selectedPreset.accentColor} />

                      {/* Soundwave bars on the left */}
                      <rect x="52" y="115" width="8" height="26" rx="4" fill={selectedPreset.accentColor} opacity="0.4" />
                      <rect x="66" y="98" width="8" height="60" rx="4" fill={selectedPreset.accentColor} opacity="0.75" />
                      <rect x="80" y="82" width="8" height="92" rx="4" fill={selectedPreset.accentColor} />
                    </g>
                  )}

                  {selectedPreset.symbol === 'play-note' && (
                    <g filter="url(#glow)">
                      {/* YouTube Play Triangle morphed with Music Note */}
                      <path
                        d="M78 80 C78 72 86 68 94 72 L186 122 C194 126 194 134 186 138 L94 188 C86 192 78 188 78 180 Z"
                        fill={selectedPreset.accentColor}
                      />
                      <circle cx="132" cy="130" r="24" fill={selectedPreset.bgGradient[0]} />
                      <path
                        d="M136 120 L136 136 C136 139 133 142 130 142 C127 142 124 139 124 136 C124 133 127 130 130 130 C132 130 134 131 135 132 L135 116 L144 114 L144 122 Z"
                        fill={selectedPreset.accentColor}
                      />
                    </g>
                  )}

                  {selectedPreset.symbol === 'disc-download' && (
                    <g filter="url(#glow)">
                      {/* Vinyl Record Disc with Center Download Arrow */}
                      <circle cx="128" cy="128" r="74" stroke={selectedPreset.accentColor} strokeWidth="6" opacity="0.3" fill="none" />
                      <circle cx="128" cy="128" r="54" stroke={selectedPreset.accentColor} strokeWidth="3" opacity="0.5" fill="none" />
                      <circle cx="128" cy="128" r="34" fill={selectedPreset.accentColor} />
                      {/* Download arrow inside */}
                      <path
                        d="M128 108 L128 144 M116 134 L128 146 L140 134"
                        stroke="#1c1917"
                        strokeWidth="5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </g>
                  )}

                  {selectedPreset.symbol === 'minimal-waveform' && (
                    <g filter="url(#glow)">
                      {/* Symmetrical Equalizer Soundwave */}
                      <rect x="52" y="112" width="10" height="32" rx="5" fill={selectedPreset.accentColor} opacity="0.4" />
                      <rect x="72" y="92" width="10" height="72" rx="5" fill={selectedPreset.accentColor} opacity="0.6" />
                      <rect x="92" y="68" width="10" height="120" rx="5" fill={selectedPreset.accentColor} opacity="0.85" />
                      <rect x="112" y="52" width="10" height="152" rx="5" fill={selectedPreset.accentColor} />
                      <rect x="134" y="68" width="10" height="120" rx="5" fill={selectedPreset.accentColor} opacity="0.85" />
                      <rect x="154" y="92" width="10" height="72" rx="5" fill={selectedPreset.accentColor} opacity="0.6" />
                      <rect x="174" y="112" width="10" height="32" rx="5" fill={selectedPreset.accentColor} opacity="0.4" />
                    </g>
                  )}

                  {/* Corner Badge: MP3 text */}
                  <rect x="162" y="196" width="56" height="22" rx="6" fill={selectedPreset.accentColor} />
                  <text
                    x="190"
                    y="212"
                    fill="#09090b"
                    fontFamily="monospace"
                    fontWeight="bold"
                    fontSize="12"
                    textAnchor="middle"
                    letterSpacing="1"
                  >
                    MP3
                  </text>
                </svg>
              </div>

              {/* Windows Desktop Mock Preview */}
              <div className="mt-4 flex items-center gap-2 p-2 px-3 rounded-lg bg-neutral-950/60 border border-neutral-800 text-xs">
                <div 
                  className="w-5 h-5 rounded-md border flex items-center justify-center font-bold text-[9px]"
                  style={{ 
                    backgroundColor: selectedPreset.bgGradient[0], 
                    color: selectedPreset.accentColor,
                    borderColor: selectedPreset.accentColor 
                  }}
                >
                  ♫
                </div>
                <span className="text-neutral-300 font-mono text-[11px] font-semibold">{appName}.exe</span>
                <span className="text-[10px] text-neutral-500 font-mono">Desktop Icon</span>
              </div>
            </div>

            {/* Quick Resolution Export Buttons */}
            <div className="w-full grid grid-cols-3 gap-2 mt-6">
              <button
                onClick={handleDownloadICO}
                className="px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>icon.ico</span>
              </button>

              <button
                onClick={() => handleDownloadPNG(256)}
                className="px-3 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>256px PNG</span>
              </button>

              <button
                onClick={handleDownloadSVG}
                className="px-3 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>SVG Vector</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right column: Preset Selector & Customization */}
        <div className="lg:col-span-6 space-y-5">
          
          {/* Preset Styles */}
          <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
            <h2 className="text-sm font-semibold text-neutral-200 flex items-center gap-2">
              <Palette className="w-4 h-4 text-emerald-400" />
              <span>Choose Icon Theme Preset</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => setSelectedPreset(preset)}
                  className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                    selectedPreset.id === preset.id
                      ? 'bg-neutral-800/90 border-emerald-500/80 shadow-md ring-1 ring-emerald-500/30'
                      : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold border shrink-0"
                    style={{
                      backgroundColor: preset.bgGradient[0],
                      borderColor: preset.accentColor,
                      color: preset.accentColor,
                    }}
                  >
                    ♫
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-neutral-200 truncate">{preset.name}</div>
                    <div className="text-[10px] text-neutral-400 font-mono mt-0.5" style={{ color: preset.accentColor }}>
                      {preset.accentColor}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Adjustments */}
          <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
            <h2 className="text-sm font-semibold text-neutral-200 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              <span>Shape & Styling Controls</span>
            </h2>

            <div className="space-y-3 text-xs">
              {/* Corner radius slider */}
              <div>
                <div className="flex justify-between text-neutral-300 mb-1">
                  <span>Corner Roundness (Squircle)</span>
                  <span className="font-mono text-emerald-400">{cornerRadius}px</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="70"
                  value={cornerRadius}
                  onChange={(e) => setCornerRadius(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              {/* Glass toggle */}
              <label className="flex items-center gap-2.5 cursor-pointer text-neutral-300 pt-1">
                <input
                  type="checkbox"
                  checked={showGloss}
                  onChange={(e) => setShowGloss(e.target.checked)}
                  className="rounded accent-emerald-500"
                />
                <span>Include Glass Gloss / Sheen Highlight</span>
              </label>

              {/* Custom Name */}
              <div className="pt-2">
                <span className="text-neutral-400 block mb-1">Executable Name:</span>
                <input
                  type="text"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-emerald-400 font-mono text-xs"
                />
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* How to attach this icon to your PyInstaller executable */}
      <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-semibold text-neutral-100 font-sans">
            How to Compile Your .EXE with this Icon
          </h2>
        </div>

        <p className="text-xs text-neutral-400 leading-relaxed">
          Follow these 2 simple steps to replace the default generic Windows program icon with your custom logo:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* Step 1 */}
          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
            <div className="text-xs font-semibold text-emerald-400 font-mono">STEP 1: Place icon in project folder</div>
            <p className="text-xs text-neutral-300">
              Download <strong className="text-emerald-400">icon.ico</strong> and put it in the same directory as <code className="text-neutral-200 font-mono">app.py</code>.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
            <div className="text-xs font-semibold text-emerald-400 font-mono">STEP 2: Run PyInstaller with --icon</div>
            <div className="relative">
              <div className="p-2.5 rounded-lg bg-neutral-900 font-mono text-[11px] text-emerald-400 pr-16 select-all">
                pyinstaller --noconsole --onefile --collect-all customtkinter --icon=&quot;icon.ico&quot; app.py
              </div>
              <button
                onClick={() => copyText('pyinstaller --noconsole --onefile --collect-all customtkinter --icon="icon.ico" app.py', setCopiedCommand)}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2 py-0.5 text-[10px] rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 cursor-pointer"
              >
                {copiedCommand ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
        </div>

        {/* Python Pillow snippet to convert PNG to ICO if user already has an image */}
        <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
              <FileCode className="w-4 h-4 text-emerald-400" />
              <span>Have your own image? Python 1-liner to convert PNG to Windows .ICO</span>
            </span>
            <button
              onClick={() => copyText(pythonScriptContent, setCopiedPython)}
              className="text-[11px] text-emerald-400 hover:underline cursor-pointer"
            >
              {copiedPython ? 'Copied Script!' : 'Copy Python Snippet'}
            </button>
          </div>
          <pre className="p-3 rounded-lg bg-neutral-900 font-mono text-xs text-neutral-300 overflow-x-auto">
            {pythonScriptContent}
          </pre>
        </div>
      </div>
    </div>
  );
};

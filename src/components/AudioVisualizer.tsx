import React, { useEffect, useRef, useState } from 'react';
import { audioEngine } from '../utils/audioEngine';
import { Eye, Radio, Sparkles, Activity } from 'lucide-react';

interface Props {
  isPlaying: boolean;
  isNitro: boolean;
  themeHue: number;
}

export const AudioVisualizer: React.FC<Props> = ({ isPlaying, isNitro, themeHue }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [visMode, setVisMode] = useState<'spectrogram' | 'oscilloscope' | 'radar'>('spectrogram');
  const [colorScheme, setColorScheme] = useState<'rainbow' | 'sunset' | 'matrix' | 'volcano' | 'cyan'>('rainbow');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      animId = requestAnimationFrame(render);

      const width = canvas.width;
      const height = canvas.height;

      // Dark background clear with subtle scanline
      ctx.fillStyle = 'rgba(0, 10, 28, 0.4)';
      ctx.fillRect(0, 0, width, height);

      const freqData = audioEngine.getFrequencyData();
      const timeData = audioEngine.getTimeDomainData();

      if (!isPlaying || freqData.length === 0) {
        // Idle LCD line with color
        let idleColor = 'rgba(0, 240, 255, 0.3)';
        if (colorScheme === 'volcano') idleColor = 'rgba(255, 60, 50, 0.35)';
        if (colorScheme === 'matrix') idleColor = 'rgba(16, 185, 129, 0.35)';
        if (colorScheme === 'sunset') idleColor = 'rgba(236, 72, 153, 0.35)';

        ctx.strokeStyle = idleColor;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        const time = Date.now() * 0.002;
        for (let x = 0; x < width; x += 5) {
          const y = height / 2 + Math.sin(x * 0.03 + time) * 6;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        return;
      }

      if (visMode === 'spectrogram') {
        const barCount = 44;
        const barWidth = width / barCount;

        for (let i = 0; i < barCount; i++) {
          // Distribuição logarítmica para sincronia perfeita com bumbo, baixo e transientes da batida
          const ratio = i / barCount;
          const logIdx = Math.floor(Math.pow(ratio, 1.65) * (freqData.length * 0.94));
          const dataIndex = Math.min(freqData.length - 1, Math.max(0, logIdx));

          // Realce rítmico automotivo nos graves e médios de impacto
          const boost = i < 14 ? 1.25 : i < 26 ? 1.1 : 1.0;
          const rawVal = (freqData[dataIndex] || 0) * boost;
          const val = Math.min(255, rawVal);
          const barHeight = (val / 255) * (height * 0.88);

          const x = i * barWidth;
          const y = height - barHeight;

          // Multi-color dynamic gradients based on selected color scheme
          const grad = ctx.createLinearGradient(0, height, 0, y);

          if (colorScheme === 'rainbow') {
            const hue = (i / barCount) * 320; // sweeps from red through yellow, green, cyan to purple
            grad.addColorStop(0, `hsl(${hue}, 80%, 25%)`);
            grad.addColorStop(0.6, `hsl(${hue}, 95%, 55%)`);
            grad.addColorStop(1, isNitro ? '#ffffff' : `hsl(${hue}, 100%, 75%)`);
          } else if (colorScheme === 'sunset') {
            grad.addColorStop(0, '#3b0764');
            grad.addColorStop(0.4, '#d946ef');
            grad.addColorStop(0.8, '#f97316');
            grad.addColorStop(1, '#fde047');
          } else if (colorScheme === 'volcano') {
            grad.addColorStop(0, '#450a0a');
            grad.addColorStop(0.4, '#dc2626');
            grad.addColorStop(0.8, '#f97316');
            grad.addColorStop(1, '#fef08a');
          } else if (colorScheme === 'matrix') {
            grad.addColorStop(0, '#022c22');
            grad.addColorStop(0.4, '#059669');
            grad.addColorStop(0.8, '#34d399');
            grad.addColorStop(1, '#a7f3d0');
          } else {
            // Classic Cyan
            grad.addColorStop(0, '#002277');
            grad.addColorStop(0.4, '#0088ff');
            grad.addColorStop(0.85, '#00f0ff');
            grad.addColorStop(1, '#ffffff');
          }

          ctx.fillStyle = grad;
          ctx.fillRect(x + 1, y, barWidth - 2, barHeight);

          // Top highlight cap
          let capColor = '#ffffff';
          if (colorScheme === 'sunset') capColor = '#fde047';
          if (colorScheme === 'volcano') capColor = '#ffea00';
          if (colorScheme === 'matrix') capColor = '#6ee7b7';

          ctx.fillStyle = capColor;
          ctx.fillRect(x + 1, y - 2, barWidth - 2, 2);
        }
      } else if (visMode === 'oscilloscope') {
        ctx.lineWidth = 2.5;
        let strokeColor = '#00f0ff';
        if (colorScheme === 'sunset') strokeColor = '#ec4899';
        if (colorScheme === 'volcano') strokeColor = '#ff4433';
        if (colorScheme === 'matrix') strokeColor = '#10b981';
        if (isNitro) strokeColor = '#ffea00';

        ctx.strokeStyle = strokeColor;
        ctx.shadowBlur = 10;
        ctx.shadowColor = strokeColor;
        ctx.beginPath();
        ctx.shadowBlur = 10;
        ctx.shadowColor = isNitro ? '#ffcc00' : '#00f0ff';
        ctx.beginPath();

        const sliceWidth = width / timeData.length;
        let x = 0;

        for (let i = 0; i < timeData.length; i++) {
          const v = timeData[i] / 128.0;
          const y = (v * height) / 2;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          x += sliceWidth;
        }

        ctx.lineTo(width, height / 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      } else if (visMode === 'radar') {
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(centerX, centerY) * 0.75;

        ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
        ctx.lineWidth = 1;
        for (let r = 1; r <= 3; r++) {
          ctx.beginPath();
          ctx.arc(centerX, centerY, (radius / 3) * r, 0, Math.PI * 2);
          ctx.stroke();
        }

        const points = 64;
        ctx.beginPath();
        for (let i = 0; i < points; i++) {
          const angle = (i / points) * Math.PI * 2;
          const dataIdx = Math.floor((i / points) * (freqData.length * 0.8));
          const amplitude = (freqData[dataIdx] / 255) * 45;
          const r = radius * 0.45 + amplitude;

          const px = centerX + Math.cos(angle) * r;
          const py = centerY + Math.sin(angle) * r;

          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.strokeStyle = isNitro ? '#ffcc00' : '#00f0ff';
        ctx.fillStyle = isNitro ? 'rgba(255, 204, 0, 0.15)' : 'rgba(0, 240, 255, 0.15)';
        ctx.fill();
        ctx.stroke();

        const sweepAngle = (Date.now() * 0.002) % (Math.PI * 2);
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX + Math.cos(sweepAngle) * radius, centerY + Math.sin(sweepAngle) * radius);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isPlaying, isNitro, visMode]);

  return (
    <div className="blue-lcd-screen p-4 flex flex-col gap-2">
      {/* Top bar with mode toggles and color scheme pills */}
      <div className="flex flex-wrap justify-between items-center gap-2 lcd-header-badge z-20 relative">
        <span className="flex items-center gap-1.5 uppercase font-bold lcd-text-cyan">
          <Eye className="w-3.5 h-3.5 text-amber-400" />
          <span>[ LCD-04: OPTICAL SPECTROGRAM V8 ]</span>
          <span className="text-amber-300 font-bold ml-1 hidden sm:inline">
            {isNitro ? '• NITRO RESONANCE 🔥' : '• MULTI-COLOR DSP'}
          </span>
        </span>

        <div className="flex flex-wrap items-center gap-1.5">
          {/* Color Palettes */}
          <div className="flex items-center gap-1 bg-[#001026] p-0.5 rounded-lg border border-[#004b99]">
            <button
              onClick={() => setColorScheme('rainbow')}
              className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase font-mono-tech cursor-pointer transition-all ${
                colorScheme === 'rainbow'
                  ? 'bg-gradient-to-r from-red-500 via-amber-400 to-cyan-400 text-black shadow-[0_0_8px_#ffea00]'
                  : 'text-amber-300 hover:text-white'
              }`}
              title="Paleta Arco-Íris Turbo"
            >
              🌈 RGB
            </button>
            <button
              onClick={() => setColorScheme('sunset')}
              className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase font-mono-tech cursor-pointer transition-all ${
                colorScheme === 'sunset'
                  ? 'bg-gradient-to-r from-pink-500 to-amber-500 text-white shadow-[0_0_8px_#ec4899]'
                  : 'text-pink-300 hover:text-white'
              }`}
              title="Paleta Neon Sunset Synthwave"
            >
              🌆 SUNSET
            </button>
            <button
              onClick={() => setColorScheme('volcano')}
              className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase font-mono-tech cursor-pointer transition-all ${
                colorScheme === 'volcano'
                  ? 'bg-gradient-to-r from-red-600 to-amber-500 text-white shadow-[0_0_8px_#ef4444]'
                  : 'text-rose-300 hover:text-white'
              }`}
              title="Paleta Magma / Vulcão"
            >
              🌋 VOLCANO
            </button>
            <button
              onClick={() => setColorScheme('matrix')}
              className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase font-mono-tech cursor-pointer transition-all ${
                colorScheme === 'matrix'
                  ? 'bg-emerald-500 text-black shadow-[0_0_8px_#10b981]'
                  : 'text-emerald-300 hover:text-white'
              }`}
              title="Paleta Matrix Verde Corrida"
            >
              🏎️ RACING
            </button>
            <button
              onClick={() => setColorScheme('cyan')}
              className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase font-mono-tech cursor-pointer transition-all ${
                colorScheme === 'cyan'
                  ? 'bg-cyan-500 text-black shadow-[0_0_8px_#00f0ff]'
                  : 'text-sky-400 hover:text-white'
              }`}
              title="Paleta Elétrica Cyan"
            >
              ⚡ CYAN
            </button>
          </div>

          {/* View Mode buttons */}
          <div className="flex items-center gap-1 bg-[#001026] p-0.5 rounded-lg border border-[#004b99]">
            <button
              onClick={() => setVisMode('spectrogram')}
              className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase transition-all font-mono-tech cursor-pointer ${
                visMode === 'spectrogram'
                  ? 'bg-cyan-500 text-black font-black shadow-[0_0_8px_#00f0ff]'
                  : 'text-sky-400 hover:text-white'
              }`}
            >
              BARRAS
            </button>
            <button
              onClick={() => setVisMode('oscilloscope')}
              className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase transition-all font-mono-tech cursor-pointer ${
                visMode === 'oscilloscope'
                  ? 'bg-cyan-500 text-black font-black shadow-[0_0_8px_#00f0ff]'
                  : 'text-sky-400 hover:text-white'
              }`}
            >
              OSCILO
            </button>
            <button
              onClick={() => setVisMode('radar')}
              className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase transition-all font-mono-tech cursor-pointer ${
                visMode === 'radar'
                  ? 'bg-cyan-500 text-black font-black shadow-[0_0_8px_#00f0ff]'
                  : 'text-sky-400 hover:text-white'
              }`}
            >
              RADAR 360°
            </button>
          </div>
        </div>
      </div>

      {/* Canvas Display */}
      <div
        className="w-full h-52 sm:h-56 rounded-xl overflow-hidden relative bg-[#001433] border border-[#004b99] z-20"
        style={{ filter: `hue-rotate(${themeHue}deg)` }}
      >
        <canvas
          ref={canvasRef}
          width={700}
          height={240}
          className="w-full h-full object-cover"
        />

        {/* Center Blue LCD HUD Stamp */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="bg-[#00122e]/85 border border-[#0077e6] px-5 py-2 rounded-2xl text-center backdrop-blur-md shadow-[0_0_20px_rgba(0,100,255,0.4)]">
            <div className="text-[8px] text-cyan-300 font-black tracking-[0.3em] font-mono-tech uppercase">
              INTERCONTINENTAL BLUE LCD
            </div>
            <div className="text-[13px] text-white font-black tracking-widest font-mono-tech flex items-center justify-center gap-1.5 lcd-text-white">
              <span>HIGH-PERFORMANCE AUDIO</span>
              {isNitro && <span className="text-amber-300 text-[10px]">⚡</span>}
            </div>
          </div>
        </div>

        {/* Corner HUD markers */}
        <div className="absolute top-2 left-2 text-[8px] font-mono-tech text-sky-400/80 tracking-wider">
          CH-L: 96KHz
        </div>
        <div className="absolute top-2 right-2 text-[8px] font-mono-tech text-sky-400/80 tracking-wider">
          CH-R: 96KHz
        </div>
        <div className="absolute bottom-2 left-2 text-[8px] font-mono-tech lcd-text-cyan tracking-wider">
          {isPlaying ? 'ENGINE ACTIVE' : 'ENGINE STANDBY'}
        </div>
        <div className="absolute bottom-2 right-2 text-[8px] font-mono-tech lcd-text-white tracking-wider">
          LCD SYNC 100%
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { Flame, Wind, Zap, Gauge, RotateCcw } from 'lucide-react';

interface TurboBoostGaugeProps {
  bass: number; // 0 - 100
  isNitro: boolean;
  isPlaying: boolean;
  className?: string;
}

export const TurboBoostGauge: React.FC<TurboBoostGaugeProps> = ({
  bass,
  isNitro,
  isPlaying,
  className = '',
}) => {
  const [unit, setUnit] = useState<'BAR' | 'PSI'>('BAR');
  const [peakLoad, setPeakLoad] = useState<number>(0);
  const [peakBar, setPeakBar] = useState<number>(0);
  const [isBovActive, setIsBovActive] = useState<boolean>(false);
  const prevBassRef = useRef<number>(0);
  const peakDecayTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Dynamic engine load calculation (0 - 100% or up to 125% in Nitro)
  const dynamicLoad = isPlaying
    ? Math.min(125, Math.round(bass * 0.95 + (isNitro ? 28 : (bass > 10 ? 8 : 2))))
    : 0;

  // Boost in BAR (-0.50 vacuum to +3.20 BAR overboost)
  const barValue = isPlaying
    ? Number(Math.max(-0.4, Math.min(3.2, (dynamicLoad / 100) * 2.8 - 0.2 + (isNitro ? 0.6 : 0))).toFixed(2))
    : 0.0;

  // Boost in PSI (-5.8 to 46.4 PSI)
  const psiValue = Number((barValue * 14.5038).toFixed(1));

  // Turbine Spool RPM (0 - 195,000 RPM)
  const turbineRpm = isPlaying
    ? Math.round(15000 + (dynamicLoad / 100) * 165000 + (isNitro ? 25000 : 0))
    : 0;

  // Track Peak Hold with decay
  useEffect(() => {
    if (dynamicLoad > peakLoad) {
      setPeakLoad(dynamicLoad);
      setPeakBar(barValue);

      if (peakDecayTimerRef.current) clearTimeout(peakDecayTimerRef.current);
      peakDecayTimerRef.current = setTimeout(() => {
        setPeakLoad((prev) => Math.max(0, Math.round(prev * 0.7)));
        setPeakBar((prev) => Math.max(0, Number((prev * 0.7).toFixed(2))));
      }, 2500);
    }
  }, [dynamicLoad, barValue, peakLoad]);

  // Blow-off valve (BOV) detection when bass drops abruptly after high load
  useEffect(() => {
    const prev = prevBassRef.current;
    if (isPlaying && prev > 60 && bass < 30) {
      setIsBovActive(true);
      const timer = setTimeout(() => setIsBovActive(false), 700);
      return () => clearTimeout(timer);
    }
    prevBassRef.current = bass;
  }, [bass, isPlaying]);

  // Needle angle: -120 deg (Min/Vacuum) to +120 deg (Max Overboost)
  // 0% load -> -120 deg, 100% load -> 95 deg, 125% (Nitro) -> 120 deg
  const needleRotation = isPlaying
    ? Math.min(120, Math.max(-120, -120 + (dynamicLoad / 100) * 215))
    : -120;

  const peakNeedleRotation = Math.min(
    120,
    Math.max(-120, -120 + (peakLoad / 100) * 215)
  );

  // Status message
  let statusText = 'VACUUM / IDLE';
  let statusColor = 'lcd-text-cyan';

  if (!isPlaying) {
    statusText = 'STANDBY';
    statusColor = 'text-sky-500/70';
  } else if (isNitro) {
    statusText = 'NITRO OVERBOOST';
    statusColor = 'lcd-text-amber animate-pulse';
  } else if (dynamicLoad > 85) {
    statusText = 'PEAK BOOST LOAD';
    statusColor = 'lcd-text-red';
  } else if (dynamicLoad > 55) {
    statusText = 'HIGH SPOOLING';
    statusColor = 'lcd-text-cyan';
  } else if (dynamicLoad > 25) {
    statusText = 'OPTIMAL CHARGE';
    statusColor = 'text-sky-300';
  }

  // 24 Radial LED Ticks around the dial
  const TOTAL_TICKS = 24;
  const activeTicksCount = isPlaying
    ? Math.min(TOTAL_TICKS, Math.round((dynamicLoad / 100) * TOTAL_TICKS))
    : 0;

  return (
    <div className={`blue-lcd-screen p-4 flex flex-col gap-3 relative overflow-hidden ${className}`}>
      {/* LCD Header */}
      <div className="flex justify-between items-center lcd-header-badge z-20 relative">
        <span className="lcd-text-cyan flex items-center gap-1.5 font-bold tracking-wider">
          <Wind className={`w-3.5 h-3.5 ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
          [ LCD-BOOST: TURBO ENGINE LOAD ]
        </span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setUnit((prev) => (prev === 'BAR' ? 'PSI' : 'BAR'))}
            className="px-1.5 py-0.5 rounded text-[8px] font-mono-tech font-bold bg-[#001f44] border border-[#0077e6] text-cyan-300 hover:text-white transition-colors cursor-pointer"
            title="Alternar unidade BAR / PSI"
          >
            {unit}
          </button>
          <span className="text-[9px] text-sky-400/80 font-mono-tech">
            {isNitro ? 'TWIN TURBO + N2O' : 'TWIN-SCROLL'}
          </span>
        </div>
      </div>

      {/* Main Dial & Telemetry Readouts Container */}
      <div className="bg-[#001026]/95 p-3 rounded-xl border border-[#004b99] shadow-inner flex flex-col items-center relative z-20">
        {/* BOV Atmospheric Vent Glow Alert */}
        {isBovActive && (
          <div className="absolute top-2 right-2 flex items-center gap-1 text-[9px] font-mono-tech font-bold text-cyan-300 bg-cyan-950/80 border border-cyan-400 px-2 py-0.5 rounded shadow-[0_0_12px_#00f0ff] animate-bounce z-30">
            <Wind className="w-3 h-3 animate-pulse" /> BOV VENT 💨
          </div>
        )}

        {/* Circular Turbo Gauge Dial */}
        <div className="relative w-44 h-44 sm:w-48 sm:h-48 flex items-center justify-center">
          {/* Outer Dial Outer Ring */}
          <div className="absolute inset-0 rounded-full border-2 border-[#0066cc] bg-gradient-to-b from-[#001b44] via-[#00102b] to-[#000818] shadow-[inset_0_0_20px_rgba(0,100,255,0.4),0_0_15px_rgba(0,180,255,0.2)]"></div>

          {/* Radial Tick Lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 200 200">
            {/* Background Arc Ticks */}
            {Array.from({ length: TOTAL_TICKS }).map((_, index) => {
              // Angles from -120 to +120 (total 240 deg range)
              const angleDeg = -120 + (index / (TOTAL_TICKS - 1)) * 240;
              const angleRad = (angleDeg - 90) * (Math.PI / 180);
              const cx = 100;
              const cy = 100;
              const r1 = 82;
              const r2 = 91;
              const x1 = cx + r1 * Math.cos(angleRad);
              const y1 = cy + r1 * Math.sin(angleRad);
              const x2 = cx + r2 * Math.cos(angleRad);
              const y2 = cy + r2 * Math.sin(angleRad);

              const isActive = index < activeTicksCount;
              let tickColor = '#003366';

              if (isActive) {
                if (index >= 20) {
                  tickColor = '#ff3344'; // Redline Overboost
                } else if (index >= 15) {
                  tickColor = '#ffcc00'; // High Load Amber
                } else {
                  tickColor = '#00f0ff'; // Normal/Spool Cyan
                }
              }

              return (
                <line
                  key={index}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={tickColor}
                  strokeWidth={index % 4 === 0 ? '3.5' : '2'}
                  strokeLinecap="round"
                  style={{
                    filter: isActive ? `drop-shadow(0 0 3px ${tickColor})` : 'none',
                    transition: 'stroke 0.08s ease, filter 0.08s ease',
                  }}
                />
              );
            })}

            {/* Inner scale arc guide */}
            <circle
              cx="100"
              cy="100"
              r="76"
              fill="none"
              stroke="#004488"
              strokeWidth="1"
              strokeDasharray="3 3"
              opacity="0.4"
            />
          </svg>

          {/* Scale Labels */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none font-mono-tech text-[8px] font-bold">
            <span className="absolute left-6 bottom-9 text-sky-400/80">-0.5</span>
            <span className="absolute left-7 top-14 text-cyan-300">0.0</span>
            <span className="absolute top-5 text-cyan-300 font-black">+1.5</span>
            <span className="absolute right-7 top-14 text-amber-300">+2.5</span>
            <span className="absolute right-6 bottom-9 text-red-400 font-black">+3.2</span>
          </div>

          {/* Center Rotating Impeller Wheel Background (Sync with bass frequency) */}
          <div
            className="absolute w-20 h-20 rounded-full border border-[#0055aa] bg-gradient-to-tr from-[#001738] to-[#002e6e] flex items-center justify-center overflow-hidden shadow-inner"
            style={{
              boxShadow: isPlaying && bass > 40
                ? '0 0 16px rgba(0, 240, 255, 0.4), inset 0 0 10px rgba(0, 240, 255, 0.3)'
                : 'inset 0 0 10px rgba(0, 50, 120, 0.5)',
            }}
          >
            {/* SVG Turbo Turbine Compressor Blades */}
            <svg
              className="w-16 h-16 pointer-events-none transition-transform"
              viewBox="0 0 100 100"
              style={{
                transform: `rotate(${isPlaying ? (Date.now() / (100 - bass * 0.75 + 10)) % 360 : 0}deg)`,
                animation: isPlaying ? `spin ${Math.max(0.2, 2.5 - (dynamicLoad / 100) * 2.2)}s linear infinite` : 'none',
              }}
            >
              <g fill="none" stroke="#00d4ff" strokeWidth="2.5" opacity={isPlaying ? 0.75 : 0.35}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <path
                    key={i}
                    d="M 50 50 Q 65 30 75 15"
                    transform={`rotate(${i * 45} 50 50)`}
                    strokeLinecap="round"
                  />
                ))}
              </g>
              <circle cx="50" cy="50" r="10" fill="#002244" stroke="#00f0ff" strokeWidth="2" />
              <circle cx="50" cy="50" r="4" fill="#ffffff" />
            </svg>
          </div>

          {/* Peak Ghost Needle (Recent Max Hold) */}
          {isPlaying && peakLoad > 20 && (
            <div
              className="absolute w-1 h-18 origin-bottom rounded-full transition-transform duration-300 pointer-events-none z-10 opacity-40"
              style={{
                bottom: '50%',
                left: 'calc(50% - 2px)',
                transform: `rotate(${peakNeedleRotation}deg)`,
                background: 'linear-gradient(to top, transparent, #ffcc00)',
                boxShadow: '0 0 6px #ffcc00',
              }}
            />
          )}

          {/* Dynamic Sweeping Needle (Synced with Bass & Engine Load) */}
          <div
            className="absolute w-1.5 h-19 origin-bottom rounded-full transition-transform duration-75 pointer-events-none z-20"
            style={{
              bottom: '50%',
              left: 'calc(50% - 3px)',
              transform: `rotate(${needleRotation}deg)`,
              background: isNitro
                ? 'linear-gradient(to top, #ff9900, #ff0055, #ffffff)'
                : 'linear-gradient(to top, #0055ff, #00f0ff, #ffffff)',
              boxShadow: isNitro
                ? '0 0 12px #ff0055, 0 0 4px #ffffff'
                : '0 0 10px #00f0ff, 0 0 2px #ffffff',
            }}
          >
            {/* Needle Counterbalance Cap */}
            <div className="absolute -bottom-2 -left-1 w-3.5 h-3.5 rounded-full bg-cyan-300 border border-white shadow-[0_0_8px_#00f0ff]"></div>
          </div>

          {/* Dial Center Hub Badge */}
          <div className="absolute z-20 w-8 h-8 rounded-full bg-[#001738] border-2 border-cyan-400 flex items-center justify-center shadow-[0_0_10px_rgba(0,240,255,0.7)]">
            <Flame
              className={`w-4 h-4 ${
                isNitro
                  ? 'text-amber-400 animate-bounce'
                  : isPlaying && dynamicLoad > 50
                  ? 'text-cyan-300 animate-pulse'
                  : 'text-sky-600'
              }`}
            />
          </div>
        </div>

        {/* Primary Digital Readout & Unit */}
        <div className="mt-1 flex flex-col items-center">
          <div className="flex items-baseline gap-1.5">
            <span
              className={`text-2xl sm:text-3xl font-black font-mono-tech tracking-tight ${
                isNitro
                  ? 'lcd-text-amber animate-pulse'
                  : dynamicLoad > 80
                  ? 'lcd-text-white'
                  : 'lcd-text-cyan'
              }`}
            >
              {unit === 'BAR'
                ? `${barValue >= 0 ? '+' : ''}${barValue.toFixed(2)}`
                : `${psiValue >= 0 ? '+' : ''}${psiValue.toFixed(1)}`}
            </span>
            <span className="text-xs font-bold font-mono-tech text-sky-300 tracking-wider">
              {unit}
            </span>
          </div>

          {/* Secondary Sub-Readout (PSI / BAR counterpart) */}
          <div className="text-[10px] font-mono-tech text-sky-400/80 -mt-0.5">
            {unit === 'BAR' ? `(${psiValue.toFixed(1)} PSI)` : `(${barValue.toFixed(2)} BAR)`} &bull;{' '}
            <span className="text-sky-300 font-bold">PEAK: {unit === 'BAR' ? `${peakBar} BAR` : `${(peakBar * 14.5038).toFixed(1)} PSI`}</span>
          </div>
        </div>

        {/* Engine Load Segmented Bar (Dynamic Bass Response) */}
        <div className="w-full mt-3 pt-2.5 border-t border-[#003d73] flex flex-col gap-1.5">
          <div className="flex justify-between items-center text-[10px] font-mono-tech">
            <span className="text-sky-300/80 font-bold tracking-wider flex items-center gap-1">
              <Zap className="w-3 h-3 text-cyan-400" /> ENGINE LOAD
            </span>
            <span className={`font-bold ${statusColor}`}>
              {dynamicLoad}% {isNitro ? '(OVERDRIVE)' : ''}
            </span>
          </div>

          {/* Segmented LED Bar Matrix */}
          <div className="grid grid-cols-16 gap-1 bg-[#000b1a] p-1 rounded border border-[#004488]">
            {Array.from({ length: 16 }).map((_, idx) => {
              const threshold = (idx + 1) * (100 / 16);
              const isFilled = isPlaying && dynamicLoad >= threshold;

              let segBg = 'bg-[#001738] opacity-30';
              let segShadow = 'none';

              if (isFilled) {
                if (idx >= 13) {
                  segBg = 'bg-red-500';
                  segShadow = '0 0 6px #ff3344';
                } else if (idx >= 10) {
                  segBg = 'bg-amber-400';
                  segShadow = '0 0 6px #ffcc00';
                } else {
                  segBg = 'bg-cyan-400';
                  segShadow = '0 0 6px #00f0ff';
                }
              }

              return (
                <div
                  key={idx}
                  className={`h-2.5 rounded-xs transition-all duration-75 ${segBg}`}
                  style={{ boxShadow: segShadow }}
                />
              );
            })}
          </div>
        </div>

        {/* Dynamic Telemetry Footer Metrics */}
        <div className="w-full grid grid-cols-3 gap-1.5 mt-2.5 text-[9px] font-mono-tech text-center bg-[#000c1e] p-1.5 rounded border border-[#003366]">
          <div className="flex flex-col">
            <span className="text-sky-400/70 text-[8px]">TURBINE SPEED</span>
            <span className="lcd-text-cyan font-bold">
              {isPlaying ? `${(turbineRpm / 1000).toFixed(1)}k` : '0k'} RPM
            </span>
          </div>
          <div className="flex flex-col border-x border-[#002e5c]">
            <span className="text-sky-400/70 text-[8px]">WASTEGATE</span>
            <span className={`font-bold ${dynamicLoad > 75 ? 'text-amber-400' : 'text-sky-300'}`}>
              {isPlaying ? (dynamicLoad > 85 ? 'RELIEVING' : dynamicLoad > 40 ? 'SEALED' : 'BYPASS') : 'PARKED'}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-sky-400/70 text-[8px]">ESTADO DO BOOST</span>
            <span className={`font-bold truncate px-0.5 ${statusColor}`}>
              {statusText}
            </span>
          </div>
        </div>

        {/* Reset Peak Button */}
        <div className="w-full flex justify-between items-center mt-2 pt-1 border-t border-[#002a4e] text-[9px] font-mono-tech">
          <span className="text-sky-400/60">BASS FREQ SYNC: <strong className="text-cyan-400">{isPlaying ? `${bass}%` : 'OFF'}</strong></span>
          <button
            onClick={() => {
              setPeakLoad(dynamicLoad);
              setPeakBar(barValue);
            }}
            className="flex items-center gap-1 text-[8px] text-sky-400 hover:text-cyan-300 transition-colors cursor-pointer"
            title="Resetar pico do boost"
          >
            <RotateCcw className="w-2.5 h-2.5" /> RESET PEAK
          </button>
        </div>
      </div>
    </div>
  );
};

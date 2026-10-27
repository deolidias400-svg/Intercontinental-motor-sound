import React, { useState, useEffect, useRef } from 'react';
import { TelemetryData } from '../types';
import { Activity, Gauge, Flame, Cpu, Timer, Play, Pause, RotateCcw, Flag, Trophy } from 'lucide-react';
import { TurboBoostGauge } from './TurboBoostGauge';
import { audioEngine } from '../utils/audioEngine';

export { TurboBoostGauge };

interface Props {
  telemetry: TelemetryData;
  isPlaying: boolean;
}

export const TelemetryGauges: React.FC<Props> = ({ telemetry, isPlaying }) => {
  const { bass, mid, high, psi, rpm, speed, hp, isNitro } = telemetry;

  // Lap Timer State (records track duration while audio is playing)
  const [isLapTimerRunning, setIsLapTimerRunning] = useState(false);
  const [lapElapsedMs, setLapElapsedMs] = useState(0);
  const [laps, setLaps] = useState<{ id: number; timeMs: number; splitMs: number }[]>([]);
  const lastTickRef = useRef<number | null>(null);
  const lastLapMarkRef = useRef<number>(0);

  // Synchronize timer: records duration when started and audio is playing
  useEffect(() => {
    if (!isLapTimerRunning || !isPlaying) {
      lastTickRef.current = null;
      return;
    }

    let animId: number;
    lastTickRef.current = performance.now();

    const tick = (now: number) => {
      if (lastTickRef.current !== null) {
        const delta = now - lastTickRef.current;
        setLapElapsedMs((prev) => prev + delta);
      }
      lastTickRef.current = now;
      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [isLapTimerRunning, isPlaying]);

  const handleStartStop = () => {
    audioEngine.playTouchSound(isLapTimerRunning ? 'switch' : 'toggle');
    setIsLapTimerRunning((prev) => !prev);
  };

  const handleLap = () => {
    if (lapElapsedMs === 0) return;
    audioEngine.playTouchSound('tick');
    const currentLapTime = lapElapsedMs - lastLapMarkRef.current;
    lastLapMarkRef.current = lapElapsedMs;
    setLaps((prev) => [
      {
        id: prev.length + 1,
        timeMs: lapElapsedMs,
        splitMs: currentLapTime,
      },
      ...prev,
    ]);
  };

  const handleReset = () => {
    audioEngine.playTouchSound('click');
    setIsLapTimerRunning(false);
    setLapElapsedMs(0);
    lastLapMarkRef.current = 0;
    setLaps([]);
  };

  const formatLapTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const hundredths = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}.${hundredths.toString().padStart(2, '0')}`;
  };

  const bestLapMs = laps.length > 0 ? Math.min(...laps.map((l) => l.splitMs)) : null;

  const rpmRotation = (rpm / 9000) * 180 - 90;
  const speedRotation = (speed / 360) * 180 - 90;

  // Dynamic thermal transition classes
  const screenClass = isNitro ? 'thermal-saturated-screen' : 'blue-lcd-screen';
  const panelClass = isNitro
    ? 'thermal-saturated-panel border-red-700/80 shadow-[inset_0_0_20px_rgba(239,68,68,0.35),0_0_20px_rgba(220,38,38,0.4)]'
    : 'bg-[#001026]/90 border-[#004b99]';
  const headerBadgeClass = isNitro ? 'lcd-header-badge-thermal' : 'lcd-header-badge';
  const accentTextClass = isNitro ? 'lcd-text-thermal' : 'lcd-text-cyan';

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* 1. BLUE LCD - STATUS DO MOTOR & STREAM HQ (SHIFTS TO THERMAL RED ON NITRO) */}
      <div className={`${screenClass} p-4 flex flex-col gap-2 transition-all duration-700 ease-in-out`}>
        <div className={`flex items-center justify-between ${headerBadgeClass} z-20 relative transition-colors duration-700`}>
          <span className={`flex items-center gap-1.5 ${accentTextClass} font-bold transition-colors duration-700`}>
            {isNitro ? <Flame className="w-3.5 h-3.5 text-red-400 animate-bounce" /> : <Cpu className="w-3.5 h-3.5" />}
            {isNitro ? '[ LCD-01: THERMAL OVERDRIVE TELEMETRY ]' : '[ LCD-01: ENGINE TELEMETRY ]'}
          </span>
          <span
            className={`px-2 py-0.5 rounded text-[8px] font-bold font-mono-tech transition-all duration-700 ${
              isPlaying
                ? isNitro
                  ? 'bg-red-600/30 text-red-200 border border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.8)] animate-pulse'
                  : 'bg-cyan-500/20 text-cyan-300 border border-cyan-400'
                : 'bg-blue-950/80 text-sky-400 border border-blue-800'
            }`}
          >
            {isPlaying ? (isNitro ? '🔥 SATURAÇÃO TÉRMICA: 1040°C' : 'RUNNING') : 'STANDBY'}
          </span>
        </div>

        <div className={`grid grid-cols-2 gap-2 text-[11px] font-mono-tech ${panelClass} p-2.5 rounded-lg border z-20 relative transition-all duration-700`}>
          <div className={`flex justify-between items-center pr-2 border-r ${isNitro ? 'border-red-900/60' : 'border-[#003d73]'} transition-colors duration-700`}>
            <span className={isNitro ? 'text-red-300/80' : 'text-sky-400/80'}>BUFFER:</span>
            <span className={`${accentTextClass} font-bold transition-colors duration-700`}>100% OK</span>
          </div>
          <div className="flex justify-between items-center pl-2">
            <span className={isNitro ? 'text-red-300/80' : 'text-sky-400/80'}>BITRATE:</span>
            <span className={`${isNitro ? 'text-amber-200 shadow-[0_0_8px_#ff9500]' : 'lcd-text-white'} font-bold transition-colors duration-700`}>320 KBPS</span>
          </div>
        </div>

        <div className={`mt-1 flex justify-between items-center text-[10px] font-mono-tech ${isNitro ? 'text-red-300' : 'text-sky-300'} z-20 relative transition-colors duration-700`}>
          <span>EGT (TEMP): <strong className={`${accentTextClass} transition-colors duration-700`}>{isNitro ? '1040°C (CRÍTICO)' : '580°C (NOMINAL)'}</strong></span>
          <span>SISTEMA: <strong className={isNitro ? 'text-red-200' : 'text-sky-200'}>{isNitro ? 'THERMAL REDLINE' : 'BLUE LCD V8'}</strong></span>
        </div>
      </div>

      {/* 2. BLUE LCD - EQUALIZAÇÃO GRÁFICA / BARRAS VU TRIDIMENSIONAIS (MOLTEN THERMAL RED ON NITRO) */}
      <div className={`${screenClass} p-4 flex flex-col gap-2 transition-all duration-700 ease-in-out`}>
        <div className={`flex justify-between items-center ${headerBadgeClass} z-20 relative transition-colors duration-700`}>
          <span className={`${accentTextClass} flex items-center gap-1.5 font-bold transition-colors duration-700`}>
            <Gauge className="w-3.5 h-3.5" />
            {isNitro ? '[ LCD-02: FREQUENCY SPECTRUM • THERMAL HEAT SATURATION ]' : '[ LCD-02: FREQUENCY SPECTRUM ]'}
          </span>
          <span className={`text-[9px] font-mono-tech transition-colors duration-700 ${isNitro ? 'text-red-400' : 'text-sky-400/70'}`}>
            {isNitro ? 'HOT REDLINE' : 'REALTIME DSP'}
          </span>
        </div>

        <div className={`flex justify-around items-end pt-2 pb-1 ${panelClass} p-3 rounded-xl border z-20 relative transition-all duration-700`}>
          {/* SUB-BASS VU */}
          <div className="flex flex-col items-center gap-1.5">
            <span className={`text-[9px] font-bold tracking-wider transition-colors duration-700 ${isNitro ? 'text-red-300' : 'text-sky-300'}`}>
              SUB-BASS
            </span>
            <div className={`bg-[#000814] ${isNitro ? 'border-red-600/80 shadow-[0_0_12px_rgba(239,68,68,0.4)]' : 'border-[#005bb5]'} h-28 w-5 rounded p-0.5 flex flex-col justify-end relative shadow-inner overflow-hidden transition-all duration-700`}>
              <div
                className="w-full rounded transition-all duration-150"
                style={{
                  height: `${isPlaying ? bass : 0}%`,
                  background: isNitro
                    ? 'linear-gradient(to top, #450a0a, #b91c1c, #ef4444, #fef08a)'
                    : 'linear-gradient(to top, #0044aa, #00f0ff, #ffffff)',
                  boxShadow: isNitro
                    ? '0 0 16px rgba(239, 68, 68, 0.95), 0 0 6px #ff4400'
                    : '0 0 12px rgba(0, 240, 255, 0.7)',
                }}
              />
            </div>
            <span className={`text-[10px] font-mono-tech ${accentTextClass} font-bold transition-colors duration-700`}>
              {isPlaying ? bass : 0}%
            </span>
          </div>

          {/* MID-RANGE VU */}
          <div className="flex flex-col items-center gap-1.5">
            <span className={`text-[9px] font-bold tracking-wider transition-colors duration-700 ${isNitro ? 'text-red-300' : 'text-sky-300'}`}>
              MID-RANGE
            </span>
            <div className={`bg-[#000814] ${isNitro ? 'border-red-600/80 shadow-[0_0_12px_rgba(239,68,68,0.4)]' : 'border-[#005bb5]'} h-28 w-5 rounded p-0.5 flex flex-col justify-end relative shadow-inner overflow-hidden transition-all duration-700`}>
              <div
                className="w-full rounded transition-all duration-150"
                style={{
                  height: `${isPlaying ? mid : 0}%`,
                  background: isNitro
                    ? 'linear-gradient(to top, #500707, #dc2626, #f97316, #fffbeb)'
                    : 'linear-gradient(to top, #0055d4, #38bdf8, #ffffff)',
                  boxShadow: isNitro
                    ? '0 0 16px rgba(249, 115, 22, 0.9), 0 0 6px #ff3300'
                    : '0 0 12px rgba(56, 189, 248, 0.7)',
                }}
              />
            </div>
            <span className={`text-[10px] font-mono-tech ${accentTextClass} font-bold transition-colors duration-700`}>
              {isPlaying ? mid : 0}%
            </span>
          </div>

          {/* TREBLE VU */}
          <div className="flex flex-col items-center gap-1.5">
            <span className={`text-[9px] font-bold tracking-wider transition-colors duration-700 ${isNitro ? 'text-red-300' : 'text-sky-300'}`}>
              TREBLE
            </span>
            <div className={`bg-[#000814] ${isNitro ? 'border-red-600/80 shadow-[0_0_12px_rgba(239,68,68,0.4)]' : 'border-[#005bb5]'} h-28 w-5 rounded p-0.5 flex flex-col justify-end relative shadow-inner overflow-hidden transition-all duration-700`}>
              <div
                className="w-full rounded transition-all duration-150"
                style={{
                  height: `${isPlaying ? high : 0}%`,
                  background: isNitro
                    ? 'linear-gradient(to top, #450a0a, #ef4444, #fb923c, #ffffff)'
                    : 'linear-gradient(to top, #0066ff, #00f0ff, #ffffff)',
                  boxShadow: isNitro
                    ? '0 0 16px rgba(239, 68, 68, 0.95), 0 0 6px #ffaa00'
                    : '0 0 12px rgba(0, 240, 255, 0.7)',
                }}
              />
            </div>
            <span className={`text-[10px] font-mono-tech ${accentTextClass} font-bold transition-colors duration-700`}>
              {isPlaying ? high : 0}%
            </span>
          </div>
        </div>
      </div>

      {/* 3. NEW 'TURBO BOOST' GAUGE COMPONENT (DYNAMIC ENGINE LOAD SYNCED WITH BASS) */}
      <TurboBoostGauge
        bass={bass}
        isNitro={isNitro}
        isPlaying={isPlaying}
      />

      {/* 4. BLUE LCD - RELÓGIOS DE TELEMETRIA RACING (RPM & VELOCIDADE COM TRANSIÇÃO TÉRMICA) */}
      <div className={`${screenClass} p-4 flex flex-col gap-2 transition-all duration-700 ease-in-out`}>
        <div className={`flex justify-between items-center ${headerBadgeClass} z-20 relative transition-colors duration-700`}>
          <span className={`${accentTextClass} flex items-center gap-1.5 font-bold transition-colors duration-700`}>
            <Flame className={`w-3.5 h-3.5 ${isNitro ? 'text-red-400 animate-pulse' : ''}`} />
            {isNitro ? '[ LCD-04: RACING GAUGES • HEAT SATURATION REDLINE ]' : '[ LCD-04: RACING GAUGES ]'}
          </span>
          <span className={`text-[9px] font-mono-tech transition-colors duration-700 ${isNitro ? 'text-red-400' : 'text-sky-400/70'}`}>
            {isNitro ? 'OVERDRIVE 1040°C' : 'RPM & SPEED'}
          </span>
        </div>

        <div className={`grid grid-cols-2 gap-3 ${panelClass} p-3 rounded-xl border z-20 relative transition-all duration-700`}>
          {/* GAUGE: SOUND RPM */}
          <div className="flex flex-col items-center">
            <div
              className={`w-20 h-20 rounded-full border-2 relative flex items-center justify-center shadow-inner transition-all duration-700 ${
                isNitro
                  ? 'border-red-500 bg-gradient-to-b from-[#3a0606] to-[#120202] shadow-[0_0_24px_rgba(239,68,68,0.7),inset_0_0_15px_rgba(185,28,28,0.6)]'
                  : 'border-[#0077e6] bg-gradient-to-b from-[#001b44] to-[#000d24]'
              }`}
            >
              <div
                className={`w-18 h-18 rounded-full border relative transition-colors duration-700 ${
                  isNitro ? 'border-red-600/70' : 'border-[#0055aa]'
                }`}
              >
                <div
                  className={`absolute inset-1 rounded-full border border-dashed pointer-events-none transition-colors duration-700 ${
                    isNitro ? 'border-red-500/50' : 'border-cyan-400/30'
                  }`}
                />
                <div
                  className={`absolute bottom-1/2 left-[calc(50%-1px)] w-0.5 h-8 origin-bottom transition-transform duration-75 ${
                    isNitro
                      ? 'bg-gradient-to-t from-red-600 via-rose-500 to-amber-300 shadow-[0_0_14px_#ff2200]'
                      : 'bg-sky-300 shadow-[0_0_8px_#38bdf8]'
                  }`}
                  style={{ transform: `rotate(${isPlaying ? rpmRotation : -90}deg)` }}
                />
                <div
                  className={`absolute inset-0 m-auto w-3 h-3 rounded-full transition-all duration-700 ${
                    isNitro ? 'bg-red-500 shadow-[0_0_10px_#ef4444]' : 'bg-sky-300 shadow-[0_0_6px_#38bdf8]'
                  }`}
                />
              </div>
            </div>
            <span className={`text-[8px] font-black mt-1.5 uppercase font-mono-tech transition-colors duration-700 ${isNitro ? 'text-red-300' : 'text-sky-300'}`}>
              SOUND RPM
            </span>
            <span className={`text-[12px] font-mono-tech font-bold transition-colors duration-700 ${isNitro ? 'lcd-text-thermal' : 'lcd-text-white'}`}>
              {isPlaying ? rpm : 0}
            </span>
          </div>

          {/* GAUGE: VELOCITY */}
          <div className="flex flex-col items-center">
            <div
              className={`w-20 h-20 rounded-full border-2 relative flex items-center justify-center shadow-inner transition-all duration-700 ${
                isNitro
                  ? 'border-red-500 bg-gradient-to-b from-[#3a0606] to-[#120202] shadow-[0_0_24px_rgba(239,68,68,0.7),inset_0_0_15px_rgba(185,28,28,0.6)]'
                  : 'border-[#0077e6] bg-gradient-to-b from-[#001b44] to-[#000d24]'
              }`}
            >
              <div
                className={`w-18 h-18 rounded-full border relative transition-colors duration-700 ${
                  isNitro ? 'border-red-600/70' : 'border-[#0055aa]'
                }`}
              >
                <div
                  className={`absolute inset-1 rounded-full border border-dashed pointer-events-none transition-colors duration-700 ${
                    isNitro ? 'border-red-500/50' : 'border-cyan-400/30'
                  }`}
                />
                <div
                  className={`absolute bottom-1/2 left-[calc(50%-1px)] w-0.5 h-8 origin-bottom transition-transform duration-75 ${
                    isNitro
                      ? 'bg-gradient-to-t from-red-600 via-orange-500 to-amber-200 shadow-[0_0_14px_#ff0033]'
                      : 'bg-cyan-300 shadow-[0_0_8px_#00f0ff]'
                  }`}
                  style={{ transform: `rotate(${isPlaying ? speedRotation : -90}deg)` }}
                />
                <div
                  className={`absolute inset-0 m-auto w-3 h-3 rounded-full transition-all duration-700 ${
                    isNitro ? 'bg-red-500 shadow-[0_0_10px_#ef4444]' : 'bg-cyan-300 shadow-[0_0_6px_#00f0ff]'
                  }`}
                />
              </div>
            </div>
            <span className={`text-[8px] font-black mt-1.5 uppercase font-mono-tech transition-colors duration-700 ${isNitro ? 'text-red-300' : 'text-sky-300'}`}>
              VELOCIDADE
            </span>
            <span className={`text-[12px] font-mono-tech font-bold transition-colors duration-700 ${accentTextClass}`}>
              {isPlaying ? speed : 0} KM/H
            </span>
          </div>
        </div>

        {/* BOTTOM POWER & THERMAL SATURATION STRIP */}
        <div className={`mt-2 pt-2 border-t ${isNitro ? 'border-red-900/60' : 'border-[#003d73]'} flex justify-between items-center text-xs z-20 relative transition-colors duration-700`}>
          <span className={`font-black text-[9px] tracking-wider uppercase font-mono-tech transition-colors duration-700 ${isNitro ? 'text-red-300 flex items-center gap-1' : 'text-sky-300/80'}`}>
            {isNitro && <Flame className="w-3 h-3 text-red-500 animate-bounce" />}
            {isNitro ? 'SATURAÇÃO DO TURBOCHARGER (EGT)' : 'POTÊNCIA DO MOTOR'}
          </span>
          <span
            className={`font-mono-tech font-black text-sm transition-all duration-700 ${
              isNitro ? 'lcd-text-thermal animate-pulse' : 'lcd-text-cyan'
            }`}
          >
            {hp}% HP {isNitro ? '🔥 REDLINE OVERDRIVE (1040°C)' : '⚡ NOMINAL'}
          </span>
        </div>
      </div>

      {/* 5. BLUE LCD - MOTORSPORT LAP TIMER (TRACK DURATION RECORDING SYNCED WITH AUDIO PLAYBACK) */}
      <div className={`${screenClass} p-4 flex flex-col gap-2.5 transition-all duration-700 ease-in-out`}>
        <div className={`flex items-center justify-between ${headerBadgeClass} z-20 relative transition-colors duration-700`}>
          <span className={`flex items-center gap-1.5 ${accentTextClass} font-bold transition-colors duration-700`}>
            <Timer className="w-3.5 h-3.5" />
            {isNitro ? '[ LCD-05: RACING LAP TIMER • REDLINE OVERDRIVE ]' : '[ LCD-05: RACING LAP TIMER ]'}
          </span>
          <span
            className={`px-2 py-0.5 rounded text-[8px] font-bold font-mono-tech transition-all duration-300 ${
              isLapTimerRunning
                ? isPlaying
                  ? isNitro
                    ? 'bg-red-600/40 text-red-200 border border-red-400 shadow-[0_0_10px_#ef4444] animate-pulse'
                    : 'bg-emerald-500/25 text-emerald-300 border border-emerald-400 shadow-[0_0_8px_#10b981] animate-pulse'
                  : 'bg-amber-500/25 text-amber-300 border border-amber-400'
                : lapElapsedMs > 0
                ? 'bg-blue-900/60 text-sky-300 border border-blue-700'
                : 'bg-blue-950/80 text-sky-400/70 border border-blue-800'
            }`}
          >
            {isLapTimerRunning
              ? isPlaying
                ? '● REC (AUDIO SYNC)'
                : '❚❚ PAUSADO (AUDIO OFF)'
              : lapElapsedMs > 0
              ? 'PARADO'
              : 'PRONTO'}
          </span>
        </div>

        {/* Digital Chronometer Display */}
        <div className={`${panelClass} p-3 rounded-xl border flex flex-col gap-2.5 z-20 relative transition-all duration-700`}>
          <div className="flex flex-col items-center justify-center py-1">
            <span className="text-[8px] font-black uppercase tracking-widest text-sky-400/80 font-mono-tech mb-0.5">
              CRONÔMETRO DE VOLTA / DURAÇÃO
            </span>
            <div className="flex items-baseline gap-1 select-none">
              <span className={`text-2xl sm:text-3xl font-black font-mono-tech tracking-tight leading-none ${accentTextClass}`}>
                {formatLapTime(lapElapsedMs)}
              </span>
            </div>
            {isLapTimerRunning && !isPlaying && (
              <span className="text-[9px] font-mono-tech text-amber-300/90 mt-1 animate-pulse">
                Áudio pausado: cronômetro em standby
              </span>
            )}
          </div>

          {/* Quick Stats: Best Lap & Split Laps Count */}
          <div className={`grid grid-cols-2 gap-2 text-[10px] font-mono-tech pt-2 border-t ${isNitro ? 'border-red-900/60' : 'border-[#003875]'}`}>
            <div className="flex items-center justify-between pr-2 border-r border-[#003366]">
              <span className="text-sky-400/80 flex items-center gap-1">
                <Trophy className="w-2.5 h-2.5 text-amber-400" /> MELHOR:
              </span>
              <strong className={bestLapMs !== null ? 'text-amber-300 font-bold' : 'text-gray-500'}>
                {bestLapMs !== null ? formatLapTime(bestLapMs) : '--:--.--'}
              </strong>
            </div>
            <div className="flex items-center justify-between pl-2">
              <span className="text-sky-400/80 flex items-center gap-1">
                <Flag className="w-2.5 h-2.5 text-cyan-400" /> VOLTAS:
              </span>
              <strong className={accentTextClass}>
                {laps.length}
              </strong>
            </div>
          </div>

          {/* Action Buttons: START/STOP, LAP, RESET */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            {/* START / STOP BUTTON */}
            <button
              onClick={handleStartStop}
              className={`px-2 py-2 rounded-lg font-mono-tech font-black text-[10px] uppercase flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-95 ${
                isLapTimerRunning
                  ? isNitro
                    ? 'bg-red-600 hover:bg-red-500 text-white border border-red-400 shadow-[0_0_12px_#ef4444]'
                    : 'bg-amber-500 hover:bg-amber-400 text-black border border-amber-300 shadow-[0_0_12px_#f59e0b]'
                  : isNitro
                  ? 'bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white border border-red-400 shadow-[0_0_10px_#ef4444]'
                  : 'bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white border border-emerald-400 shadow-[0_0_10px_#10b981]'
              }`}
              title={isLapTimerRunning ? 'Pausar gravação de tempo' : 'Iniciar gravação de volta'}
            >
              {isLapTimerRunning ? (
                <>
                  <Pause className="w-3 h-3" />
                  <span>PARAR</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 fill-current" />
                  <span>INICIAR</span>
                </>
              )}
            </button>

            {/* LAP BUTTON */}
            <button
              onClick={handleLap}
              disabled={lapElapsedMs === 0}
              className={`px-2 py-2 rounded-lg font-mono-tech font-bold text-[10px] uppercase flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                lapElapsedMs > 0
                  ? isNitro
                    ? 'bg-red-950/80 hover:bg-red-900 text-red-200 border-red-600/70 hover:border-red-400'
                    : 'bg-[#00224d] hover:bg-[#003366] text-cyan-300 border-[#0055aa] hover:border-cyan-400 shadow-[0_0_8px_rgba(0,240,255,0.2)]'
                  : 'bg-[#001026] text-gray-500 border-gray-800 cursor-not-allowed opacity-50'
              }`}
              title="Registrar volta atual (split)"
            >
              <Flag className="w-3 h-3" />
              <span>VOLTA</span>
            </button>

            {/* RESET BUTTON */}
            <button
              onClick={handleReset}
              disabled={lapElapsedMs === 0 && !isLapTimerRunning}
              className={`px-2 py-2 rounded-lg font-mono-tech font-bold text-[10px] uppercase flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                lapElapsedMs > 0 || isLapTimerRunning
                  ? 'bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 border-zinc-700 hover:border-zinc-500'
                  : 'bg-[#001026] text-gray-600 border-gray-800 cursor-not-allowed opacity-50'
              }`}
              title="Zerar cronômetro e voltas"
            >
              <RotateCcw className="w-3 h-3" />
              <span>ZERAR</span>
            </button>
          </div>

          {/* Laps History List (Up to 4 recent laps) */}
          {laps.length > 0 && (
            <div className={`mt-1 pt-2 border-t ${isNitro ? 'border-red-900/60' : 'border-[#003875]'} flex flex-col gap-1 max-h-28 overflow-y-auto pr-1`}>
              <span className="text-[8px] font-mono-tech font-bold text-sky-400/80 uppercase">
                HISTÓRICO DE VOLTAS
              </span>
              {laps.slice(0, 4).map((lap) => {
                const isBest = bestLapMs !== null && lap.splitMs === bestLapMs && laps.length > 1;
                return (
                  <div
                    key={lap.id}
                    className={`flex items-center justify-between px-2 py-1 rounded text-[9px] font-mono-tech border ${
                      isBest
                        ? 'bg-amber-500/20 text-amber-200 border-amber-400/60 shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                        : 'bg-[#000c1e] text-sky-200 border-[#002b55]'
                    }`}
                  >
                    <span className="flex items-center gap-1 font-bold">
                      {isBest ? <Trophy className="w-2.5 h-2.5 text-amber-400" /> : null}
                      VOLTA {lap.id}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono">{formatLapTime(lap.splitMs)}</span>
                      {isBest && (
                        <span className="text-[7px] font-black px-1 py-0.2 rounded bg-amber-500 text-black">
                          BEST
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

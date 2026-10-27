import React, { useState, useEffect } from 'react';
import { CockpitTheme, EQProfile } from '../types';
import { Track } from '../types/smartAudio';
import { audioEngine } from '../utils/audioEngine';
import {
  Clock,
  Calendar,
  Thermometer,
  Gauge,
  Sun,
  Flame,
  Volume2,
  Sliders,
  Radio,
  Sparkles,
  Zap,
  Music2,
  Disc3,
} from 'lucide-react';

interface Props {
  currentTheme: CockpitTheme;
  isPlaying: boolean;
  isNitro: boolean;
  volume: number;
  currentProfile?: EQProfile;
  currentTrack?: Track;
  stationName?: string;
  bitrate?: string;
  className?: string;
}

export const GreenLcdTripComputer: React.FC<Props> = ({
  currentTheme,
  isPlaying,
  isNitro,
  volume,
  currentProfile,
  currentTrack,
  stationName = 'INTERCONTINENTAL V8 FM',
  bitrate = '320 KBPS',
  className = '',
}) => {
  // Clock & Date States
  const [time, setTime] = useState(new Date());
  const [is24Hour, setIs24Hour] = useState(true);
  const [tempUnit, setTempUnit] = useState<'C' | 'F'>('C');
  const [isIndiglo, setIsIndiglo] = useState(false);
  const [colonVisible, setColonVisible] = useState(true);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
      setColonVisible((prev) => !prev);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format Hours & Minutes
  const hours = is24Hour
    ? time.getHours().toString().padStart(2, '0')
    : ((time.getHours() % 12 || 12).toString().padStart(2, '0'));
  const minutes = time.getMinutes().toString().padStart(2, '0');
  const seconds = time.getSeconds().toString().padStart(2, '0');
  const ampm = !is24Hour ? (time.getHours() >= 12 ? 'PM' : 'AM') : '';

  // Format Date in Portuguese
  const dayNames = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];
  const monthNames = [
    'JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN',
    'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ',
  ];
  const dayOfWeek = dayNames[time.getDay()];
  const dayOfMonth = time.getDate().toString().padStart(2, '0');
  const monthName = monthNames[time.getMonth()];
  const year = time.getFullYear();

  // Dynamic Temperatures (simulating cabin & V8 engine telemetry)
  const baseCabinTemp = 23.5;
  const cabinTempC = baseCabinTemp + (isNitro ? 1.5 : isPlaying ? 0.8 : 0);
  const engineTempC = isNitro ? 104 : isPlaying ? 92 : 78;

  const toFahrenheit = (c: number) => (c * 9) / 5 + 32;

  const displayCabinTemp =
    tempUnit === 'C'
      ? `${cabinTempC.toFixed(1)}°C`
      : `${toFahrenheit(cabinTempC).toFixed(1)}°F`;

  const displayEngineTemp =
    tempUnit === 'C'
      ? `${engineTempC}°C`
      : `${Math.round(toFahrenheit(engineTempC))}°F`;

  // Theme name mapping for LCD readout
  const getThemeDisplayName = (t: CockpitTheme) => {
    switch (t) {
      case 'volcano':
        return 'VOLCANO RED';
      case 'green-racing':
        return 'GREEN RACING';
      case 'purple-neon':
        return 'PURPLE NEON';
      case 'gold-luxury':
        return 'GOLD LUXURY';
      case 'synthwave-sunset':
        return 'SYNTHWAVE SUNSET';
      case 'chrome':
        return 'CYAN MATRIX';
      case 'dark':
        return 'DARK CARBON';
      default:
        return 'COBALT BLUE';
    }
  };

  return (
    <div className={`green-lcd-frame p-3 sm:p-4 w-full shadow-2xl ${className}`}>
      {/* Outer Casing Header Strip */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#2e442e] text-[9px] font-mono-tech text-[#8eb579]">
        <div className="flex items-center gap-1.5 font-bold uppercase tracking-widest">
          <span className="w-2 h-2 rounded-full bg-[#5a8b45] shadow-[0_0_6px_#76b359] animate-pulse" />
          <span>[ OBC-9000: ON-BOARD TRIP COMPUTER & MULTI-FUNCTION GREEN LCD ]</span>
        </div>

        {/* Tactile Control Buttons on Bezel */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              audioEngine.playTouchSound('tick');
              setIsIndiglo((prev) => !prev);
            }}
            className="green-lcd-btn px-2 py-0.5 rounded text-[8px] font-bold uppercase cursor-pointer"
            title="Alternar iluminação de fundo (Dia / Indiglo Noturno)"
          >
            💡 {isIndiglo ? 'INDIGLO ON' : 'LUZ LCD'}
          </button>

          <button
            onClick={() => {
              audioEngine.playTouchSound('tick');
              setTempUnit((prev) => (prev === 'C' ? 'F' : 'C'));
            }}
            className="green-lcd-btn px-2 py-0.5 rounded text-[8px] font-bold uppercase cursor-pointer"
            title="Alternar unidade de temperatura (°C / °F)"
          >
            🌡️ °{tempUnit}
          </button>

          <button
            onClick={() => {
              audioEngine.playTouchSound('tick');
              setIs24Hour((prev) => !prev);
            }}
            className="green-lcd-btn px-2 py-0.5 rounded text-[8px] font-bold uppercase cursor-pointer"
            title="Alternar formato 12h / 24h"
          >
            ⏱️ {is24Hour ? '24H' : '12H'}
          </button>
        </div>
      </div>

      {/* Main Light Green LCD Screen Surface with Black Digits & Letters */}
      <div
        className={`green-lcd-display p-3 sm:p-4 rounded-lg relative ${
          isIndiglo ? 'indiglo-active' : ''
        }`}
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 relative z-10 font-mono-tech text-[#0a140a]">
          {/* 1. SEÇÃO DIGITAL: HORA EXATA & DATA (MD: 4 COLS) */}
          <div className="md:col-span-4 flex flex-col justify-between border-b md:border-b-0 md:border-r border-[#698c55]/80 pb-2.5 md:pb-0 md:pr-4">
            <div>
              <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-wider mb-0.5 opacity-80">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#112211]" /> RELÓGIO COCKPIT
                </span>
                <span>{ampm || 'LOCAL'}</span>
              </div>

              {/* Big Solid LCD Digits */}
              <div className="flex items-baseline gap-1 select-none">
                <span className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-none">
                  {hours}
                  <span className={colonVisible ? 'opacity-100' : 'opacity-20'}>:</span>
                  {minutes}
                </span>
                <span className="text-base sm:text-lg font-black opacity-80">
                  :{seconds}
                </span>
              </div>
            </div>

            {/* Calendário e Data Completa */}
            <div className="mt-2 pt-1.5 border-t border-[#698c55]/60 flex items-center justify-between text-[11px] font-bold">
              <span className="flex items-center gap-1 font-black">
                <Calendar className="w-3 h-3 text-[#112211]" /> {dayOfWeek} • {dayOfMonth} {monthName} {year}
              </span>
              <span className="text-[9px] opacity-75 font-semibold">
                DIA {Math.floor((time.getTime() - new Date(time.getFullYear(), 0, 0).getTime()) / 86400000)}
              </span>
            </div>
          </div>

          {/* 2. SEÇÃO DE CLIMATIZAÇÃO & TEMPERATURAS (MD: 3 COLS) */}
          <div className="md:col-span-3 flex flex-col justify-between border-b md:border-b-0 md:border-r border-[#698c55]/80 pb-2.5 md:pb-0 md:pr-4">
            <div className="text-[9px] font-black uppercase tracking-wider mb-1 flex items-center gap-1 opacity-80">
              <Thermometer className="w-3 h-3 text-[#112211]" /> SENSORES DE TEMPERATURA
            </div>

            <div className="grid grid-cols-2 gap-2 my-auto">
              {/* Temperatura da Cabine */}
              <div className="bg-[#7fa769]/35 border border-[#5f844a] p-1.5 rounded flex flex-col shadow-inner">
                <span className="text-[8px] font-bold uppercase opacity-80">CABINE</span>
                <span className="text-lg sm:text-xl font-black leading-tight">
                  {displayCabinTemp}
                </span>
                <span className="text-[7px] opacity-70">CLIMA INTERNO</span>
              </div>

              {/* Temperatura do Motor V8 */}
              <div className="bg-[#7fa769]/35 border border-[#5f844a] p-1.5 rounded flex flex-col shadow-inner">
                <span className="text-[8px] font-bold uppercase flex items-center gap-0.5 opacity-80">
                  <Flame className="w-2.5 h-2.5" /> MOTOR V8
                </span>
                <span className="text-lg sm:text-xl font-black leading-tight">
                  {displayEngineTemp}
                </span>
                <span className={`text-[7px] font-bold ${isNitro ? 'text-[#800000] animate-pulse' : 'opacity-70'}`}>
                  {isNitro ? 'QUENTE 🔥' : 'NOMINAL'}
                </span>
              </div>
            </div>

            <div className="mt-1 flex items-center justify-between text-[9px] opacity-80 pt-1 border-t border-[#698c55]/60">
              <span>PRESSÃO: 1013 hPa</span>
              <span>HUMIDADE: 48%</span>
            </div>
          </div>

          {/* 3. SEÇÃO INFORMAÇÕES DO PLAYER: TEMA, STATUS, EQ & AUDIO (MD: 5 COLS) */}
          <div className="md:col-span-5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-wider mb-1 opacity-80">
              <span className="flex items-center gap-1">
                <Radio className="w-3 h-3 text-[#112211]" /> TELEMETRIA DO PLAYER V8
              </span>
              <span className="px-1.5 py-0.2 rounded bg-[#0a140a] text-[#8eb579] font-black text-[8px]">
                {isPlaying ? 'NO AR • ON' : 'STANDBY'}
              </span>
            </div>

            {/* Grid de Informações sobre o Player */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[10px]">
              {/* TEMA ATIVO */}
              <div className="bg-[#7fa769]/35 border border-[#5f844a] p-1.5 rounded flex flex-col">
                <span className="text-[8px] font-bold uppercase opacity-80 flex items-center gap-0.5">
                  <Sparkles className="w-2.5 h-2.5" /> TEMA ATUAL
                </span>
                <strong className="text-[11px] font-black truncate leading-tight mt-0.5">
                  {getThemeDisplayName(currentTheme)}
                </strong>
              </div>

              {/* PERFIL EQUALIZADOR */}
              <div className="bg-[#7fa769]/35 border border-[#5f844a] p-1.5 rounded flex flex-col">
                <span className="text-[8px] font-bold uppercase opacity-80 flex items-center gap-0.5">
                  <Sliders className="w-2.5 h-2.5" /> PERFIL EQ
                </span>
                <strong className="text-[11px] font-black truncate leading-tight mt-0.5">
                  {currentProfile ? currentProfile.name : 'V8 MASTER'}
                </strong>
              </div>

              {/* VOLUME & POTÊNCIA */}
              <div className="bg-[#7fa769]/35 border border-[#5f844a] p-1.5 rounded flex flex-col">
                <span className="text-[8px] font-bold uppercase opacity-80 flex items-center gap-0.5">
                  <Volume2 className="w-2.5 h-2.5" /> POTÊNCIA
                </span>
                <strong className="text-[11px] font-black leading-tight mt-0.5">
                  VOL: {volume}% {isNitro ? '⚡ N2O' : ''}
                </strong>
              </div>
            </div>

            {/* Bottom Strip: Estação, Bitrate & Status do Motor */}
            <div className="mt-2 pt-1.5 border-t border-[#698c55]/60 flex flex-wrap items-center justify-between text-[9px] font-bold">
              <span className="truncate max-w-[220px]">
                ESTAÇÃO: <strong>{stationName}</strong>
              </span>
              <div className="flex items-center gap-2">
                <span>BITRATE: <strong>{bitrate}</strong></span>
                <span>STATUS: <strong>{isPlaying ? (isNitro ? 'N2O BOOST' : 'OPERACIONAL') : 'PARADO'}</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. LOCAL DEDICADO DE DESTAQUE: NOME DA MÚSICA QUE ESTÁ TOCANDO E ARTISTA NO LCD VERDE */}
        <div className="mt-3 pt-2.5 border-t-2 border-[#5a7d47] relative z-10 font-mono-tech text-[#0a140a]">
          <div className="bg-[#7fa769]/40 border-2 border-[#4d6d3a] p-2.5 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[inset_0_1px_4px_rgba(0,0,0,0.18)]">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-8 h-8 rounded-md bg-[#0a140a] text-[#9fc68a] flex items-center justify-center font-black shrink-0 shadow">
                <Music2 className={`w-4 h-4 ${isPlaying ? 'animate-bounce text-[#9fc68a]' : 'text-gray-500'}`} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-[#0a140a] text-[#9fc68a] flex items-center gap-1 shadow-xs">
                    <span className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-[#9fc68a] animate-ping' : 'bg-gray-500'}`} />
                    TOCANDO AGORA
                  </span>
                  <span className="text-[9px] font-bold opacity-75 hidden sm:inline">
                    CANAL DE ÁUDIO STEREO V8
                  </span>
                </div>

                {/* NOME DA MÚSICA EM PRETO DESTACADO */}
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-[11px] font-black uppercase tracking-wider opacity-85 shrink-0">
                    MÚSICA:
                  </span>
                  <h3 className="text-base sm:text-lg lg:text-xl font-black tracking-tight truncate uppercase text-[#000000] drop-shadow-xs">
                    {currentTrack?.title || 'SELECIONE UMA MÚSICA PARA TOCAR'}
                  </h3>
                </div>
              </div>
            </div>

            {/* ARTISTA / CANTOR */}
            <div className="flex sm:flex-col items-baseline sm:items-end justify-between border-t sm:border-t-0 sm:border-l-2 border-[#5a7d47]/80 pt-1.5 sm:pt-0 sm:pl-4 shrink-0">
              <div className="flex items-baseline gap-1.5">
                <span className="text-[11px] font-black uppercase tracking-wider opacity-85">
                  CANTOR / ARTISTA:
                </span>
                <span className="text-sm sm:text-base font-black text-[#000000] uppercase tracking-tight">
                  🎤 {currentTrack?.artist || 'MOTOR SOUND BAND'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[9px] font-bold opacity-80 mt-0.5">
                <span>ÁLBUM: <strong>{currentTrack?.album || 'COCKPIT MASTER'}</strong></span>
                {currentTrack?.year && <span>• ANO: <strong>{currentTrack.year}</strong></span>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

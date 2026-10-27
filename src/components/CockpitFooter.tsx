import React from 'react';
import { ExternalLink, Sparkles } from 'lucide-react';
import { audioEngine } from '../utils/audioEngine';

interface Props {
  currentHue: number;
  onSelectHue: (hue: number) => void;
}

const QUICK_LINKS = [
  {
    name: 'DYNAC-X PLAY',
    url: 'https://sites.google.com/view/dynac-x-play-intercontinental/in%C3%ADcio',
  },
  {
    name: 'CONTATO',
    url: 'https://intercontinental-web-radio.webnode.page/contato/',
  },
  {
    name: 'YOUTUBE',
    url: 'https://www.youtube.com/@RadioWebintercontinental',
  },
  {
    name: 'TENDÊNCIAS',
    url: 'https://deolidias2000.blogspot.com/2025/02/as-tendencias-musicais-que-estao.html',
  },
  {
    name: 'VOX I.A',
    url: 'https://sites.google.com/view/vox-i-a/in%C3%ADcio',
  },
  {
    name: 'PANDORA',
    url: 'https://sites.google.com/view/pandora-e-euterpe/in%C3%ADcio',
  },
];

export const CockpitFooter: React.FC<Props> = ({ currentHue, onSelectHue }) => {
  return (
    <div className="flex flex-col gap-3 w-full mt-1">
      {/* 1. SELETOR DE COLORIMETRIA DA TURBINA NO BLUE LCD */}
      <div className="blue-lcd-screen p-3 flex flex-col gap-2">
        <div className="flex justify-between items-center text-[10px] font-black uppercase text-sky-400 font-mono-tech z-20 relative">
          <span className="flex items-center gap-1.5 lcd-text-cyan">
            <Sparkles className="w-3.5 h-3.5" /> [ LCD-11: TURBINE MATRIX COLOR ]
          </span>
          <span className="text-[9px] text-sky-300">HUE: {currentHue}°</span>
        </div>
        <div className="grid grid-cols-6 sm:grid-cols-9 md:grid-cols-18 gap-1.5 z-20 relative">
          {Array.from({ length: 18 }, (_, i) => {
            const hueVal = (i + 1) * 20;
            const isSelected = currentHue === hueVal;
            const label = i + 1 < 10 ? `0${i + 1}` : `${i + 1}`;
            return (
              <button
                key={hueVal}
                onClick={() => {
                  audioEngine.playCockpitBeep(900 + i * 20);
                  onSelectHue(hueVal);
                }}
                className={`py-1.5 px-1 rounded text-[9px] font-mono-tech font-bold transition-all border ${
                  isSelected
                    ? 'bg-cyan-400 text-black border-white shadow-[0_0_8px_#00f0ff] font-black scale-105'
                    : 'bg-[#001738] text-sky-300 border-[#003d73] hover:border-cyan-400 hover:text-white'
                }`}
                style={{
                  borderLeftColor: `hsl(${hueVal}, 90%, 60%)`,
                  borderLeftWidth: '3px',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. DOCK DE LINKS EXTERNOS EM ESTILO BLUE LCD */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
        {QUICK_LINKS.map((link) => (
          <a
            key={link.name}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-lcd-blue py-2.5 px-2 rounded-xl text-center text-[10px] font-mono-tech font-bold border transition-all flex items-center justify-center gap-1.5 hover:scale-102 active:scale-98 shadow-md"
          >
            <span>{link.name}</span>
            <ExternalLink className="w-3 h-3 opacity-70" />
          </a>
        ))}
      </div>

      {/* 3. MARQUEE DE NOTÍCIAS AUTOMOTIVAS EM TEMPO REAL NO AZUL LCD */}
      <div className="blue-lcd-screen h-11 flex items-center overflow-hidden relative">
        <div className="bg-[#002b66] border-r border-[#0077e6] text-cyan-300 font-black text-[10px] tracking-wider px-4 h-full flex items-center shrink-0 z-20 font-mono-tech shadow-[5px_0_15px_rgba(0,0,0,0.8)]">
          [ NOTÍCIAS LCD ]
        </div>

        <div className="animate-marquee text-xs font-mono-tech text-cyan-200 items-center whitespace-nowrap pl-4 z-20">
          <span className="flex items-center gap-2">
            🌐 INTERCONTINENTAL MOTOR SOUND BLUE LCD V8.5: SISTEMA DE SOM AUTOMOTIVO DE ALTA POTÊNCIA... 🤖 I-CON MUSIC AI MASTER CHATBOT ATIVO... ⚡ MATRIZ DE RECOMENDAÇÃO EM APRENDIZADO CONTÍNUO... 🏎️ PLAYLISTS DINÂMICAS OPERANDO EM 320 KBPS... &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          </span>
          <span className="flex items-center gap-2">
            🌐 INTERCONTINENTAL MOTOR SOUND BLUE LCD V8.5: SISTEMA DE SOM AUTOMOTIVO DE ALTA POTÊNCIA... 🤖 I-CON MUSIC AI MASTER CHATBOT ATIVO... ⚡ MATRIZ DE RECOMENDAÇÃO EM APRENDIZADO CONTÍNUO... 🏎️ PLAYLISTS DINÂMICAS OPERANDO EM 320 KBPS... &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          </span>
        </div>
      </div>
    </div>
  );
};

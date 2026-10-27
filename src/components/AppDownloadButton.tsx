import React from 'react';
import { Download, Sparkles, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { audioEngine } from '../utils/audioEngine';

interface Props {
  onClick: () => void;
  className?: string;
  variant?: 'compact' | 'full';
}

export const AppDownloadButton: React.FC<Props> = ({
  onClick,
  className = '',
  variant = 'compact',
}) => {
  const { isInstalled } = usePWAInstall();

  const handleClick = () => {
    audioEngine.playTouchSound('switch');
    onClick();
  };

  if (variant === 'full') {
    return (
      <button
        onClick={handleClick}
        className={`relative px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-display font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,240,255,0.5)] border border-cyan-200 transition-all cursor-pointer hover:scale-103 active:scale-95 group ${className}`}
        title="Baixar e instalar o aplicativo oficial da rádio"
      >
        <span className="absolute -inset-0.5 rounded-xl bg-cyan-400/40 animate-pulse pointer-events-none" />
        <Download className="w-4 h-4 text-black group-hover:translate-y-0.5 transition-transform shrink-0" />
        <span className="relative z-10 flex items-center gap-1.5">
          {isInstalled ? 'APP INSTALADO • GERENCIAR' : 'BAIXAR APLICATIVO'}
          <span className="px-1.5 py-0.2 rounded text-[8px] bg-black text-cyan-300 font-mono-tech">
            GRÁTIS
          </span>
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={`relative px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600/30 via-blue-600/20 to-indigo-600/30 hover:from-cyan-500/40 hover:to-blue-500/40 text-cyan-300 hover:text-white border border-cyan-400/60 hover:border-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.3)] font-mono-tech font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer hover:scale-103 active:scale-95 group ${className}`}
      title="Baixar e instalar o aplicativo oficial no seu celular ou computador"
    >
      <div className="relative">
        <Download className="w-3.5 h-3.5 text-cyan-300 group-hover:translate-y-0.5 transition-transform" />
        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
      </div>
      <span className="flex items-center gap-1">
        <span>BAIXAR APP</span>
        <span className="hidden sm:inline text-[9px] px-1 rounded bg-cyan-500/30 text-cyan-200 border border-cyan-400/40">
          V8
        </span>
      </span>
    </button>
  );
};

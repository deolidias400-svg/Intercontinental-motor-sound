import React, { useState } from 'react';
import { audioEngine } from '../utils/audioEngine';
import {
  Sparkles,
  Volume2,
  Radio,
  Eye,
  X,
  Maximize2,
  Flame,
  CheckCircle,
  Zap,
} from 'lucide-react';
import androidImg from '../assets/images/android_presenter_1791154832821.jpg';

interface Props {
  isPlaying: boolean;
  isNitro: boolean;
  className?: string;
}

export const AndroidElectronicMarquee: React.FC<Props> = ({
  isPlaying,
  isNitro,
  className = '',
}) => {
  const [speed, setSpeed] = useState<'normal' | 'slow' | 'fast'>('normal');
  const [colorScheme, setColorScheme] = useState<'amber' | 'lime' | 'cyan'>('amber');
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isPausedHover, setIsPausedHover] = useState(false);

  // Play audio voice greeting
  const handleAndroidVoiceGreet = () => {
    audioEngine.playTouchSound('toggle');
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance('Intercontinental e você: tudo a ver!');
      utterance.lang = 'pt-BR';
      utterance.pitch = 1.15;
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const getSchemeClass = () => {
    switch (colorScheme) {
      case 'lime':
        return 'electronic-marquee-lime';
      case 'cyan':
        return 'electronic-marquee-cyan';
      default:
        return 'electronic-marquee-amber';
    }
  };

  const getAnimationClass = () => {
    if (speed === 'slow') return 'animate-marquee-ltr-slow';
    if (speed === 'fast') return 'animate-marquee-ltr-fast';
    return 'animate-marquee-ltr';
  };

  // Repeated phrase for seamless infinite left-to-right looping marquee
  const phrase = (
    <>
      <span className="font-black text-black tracking-wider uppercase mx-3 inline-flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-black fill-black" />
        INTERCONTINENTAL E VOCÊ: TUDO A VER!
      </span>
      <span className="text-black/60 font-black mx-1">•</span>
      <span className="font-black text-black tracking-wider uppercase mx-3 inline-flex items-center gap-2">
        <Radio className="w-4 h-4 text-black" />
        INTERCONTINENTAL E VOCÊ TUDO HAVER
      </span>
      <span className="text-black/60 font-black mx-1">•</span>
      <span className="font-black text-black tracking-wider uppercase mx-3 inline-flex items-center gap-2">
        <Zap className="w-4 h-4 text-black fill-black" />
        SINTONIA MÁXIMA MOTOR SOUND V8
      </span>
      <span className="text-black/60 font-black mx-1">•</span>
    </>
  );

  return (
    <div className={`w-full flex flex-col gap-1.5 select-none ${className}`}>
      {/* Outer Chassis */}
      <div className="rounded-2xl bg-gradient-to-b from-[#111927] via-[#090d15] to-[#04060a] border-2 border-[#1e324d] shadow-[0_10px_30px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.15)] p-2 sm:p-2.5 relative overflow-hidden">
        {/* Top Control Bezel Strip */}
        <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-[#1c2e47] text-[9px] font-mono-tech text-sky-400/90 px-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981] animate-ping" />
            <span className="font-black tracking-widest uppercase text-white flex items-center gap-1">
              [ LETREIRO ELETRÔNICO DIGITAL • TRANSMISSÃO AO VIVO ]
            </span>
          </div>

          {/* Quick interactive controls for the Marquee */}
          <div className="flex items-center gap-1.5">
            {/* Color switcher: all maintain black letters */}
            <div className="flex items-center gap-1 bg-black/60 p-0.5 rounded border border-[#1e324d]">
              <button
                onClick={() => {
                  audioEngine.playTouchSound('tick');
                  setColorScheme('amber');
                }}
                className={`w-3.5 h-3.5 rounded-full bg-amber-400 cursor-pointer transition-transform ${
                  colorScheme === 'amber' ? 'scale-125 ring-2 ring-white shadow-[0_0_6px_#ffbe0a]' : 'opacity-60'
                }`}
                title="Fundo Âmbar Eletrônico com Letras Pretas"
              />
              <button
                onClick={() => {
                  audioEngine.playTouchSound('tick');
                  setColorScheme('lime');
                }}
                className={`w-3.5 h-3.5 rounded-full bg-lime-400 cursor-pointer transition-transform ${
                  colorScheme === 'lime' ? 'scale-125 ring-2 ring-white shadow-[0_0_6px_#9fe419]' : 'opacity-60'
                }`}
                title="Fundo Verde Neon com Letras Pretas"
              />
              <button
                onClick={() => {
                  audioEngine.playTouchSound('tick');
                  setColorScheme('cyan');
                }}
                className={`w-3.5 h-3.5 rounded-full bg-cyan-300 cursor-pointer transition-transform ${
                  colorScheme === 'cyan' ? 'scale-125 ring-2 ring-white shadow-[0_0_6px_#15d5ec]' : 'opacity-60'
                }`}
                title="Fundo Ciano Elétrico com Letras Pretas"
              />
            </div>

            {/* Speed toggle */}
            <button
              onClick={() => {
                audioEngine.playTouchSound('tick');
                setSpeed((prev) => (prev === 'normal' ? 'fast' : prev === 'fast' ? 'slow' : 'normal'));
              }}
              className="px-2 py-0.5 rounded bg-[#101b2b] hover:bg-[#192b45] text-cyan-300 border border-[#233d60] font-bold uppercase text-[8px] cursor-pointer"
              title="Velocidade de rolagem da esquerda para a direita"
            >
              VELOCIDADE: {speed.toUpperCase()}
            </button>
          </div>
        </div>

        {/* Main Display Row: Android Robot Presenter on Left + Moving Electronic Sign on Right */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          {/* ANDROID AVATAR / ROBÔ APRESENTADORA */}
          <div
            onClick={() => setIsPhotoModalOpen(true)}
            className="flex items-center gap-2.5 bg-[#00142e] border-2 border-cyan-400/60 hover:border-cyan-300 p-1.5 pr-3 rounded-xl shadow-[0_0_20px_rgba(0,240,255,0.25)] cursor-pointer group shrink-0 transition-all hover:scale-102"
            title="Clique para ver a foto completa da Android e ouvir sua voz!"
          >
            {/* Glowing Avatar Portrait */}
            <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden border-2 border-cyan-300 shadow-md">
              <img
                src={androidImg}
                alt="Robô Android Futurista - Locutora Intercontinental"
                className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-300"
              />
              {/* Online indicator ping */}
              <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#00f0ff] animate-ping" />
            </div>

            {/* Info Badge */}
            <div className="flex flex-col text-left">
              <span className="text-[8px] font-mono-tech font-black tracking-widest text-amber-400 uppercase flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> LOCUTORA V8
              </span>
              <span className="text-xs font-black font-display text-white tracking-tight leading-tight group-hover:text-cyan-300 transition-colors">
                ANDRÓIDE AI
              </span>
              <span className="text-[7.5px] font-mono-tech text-cyan-300/80 mt-0.5">
                INTERCONTINENTAL FM
              </span>
            </div>

            {/* Voice greet button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleAndroidVoiceGreet();
              }}
              className="p-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-300 border border-cyan-400/50 cursor-pointer ml-1"
              title="Ouvir mensagem de voz da Andróide"
            >
              <Volume2 className="w-3.5 h-3.5 animate-pulse" />
            </button>
          </div>

          {/* THE ELECTRONIC MARQUEE SCREEN (LETRAS PRETAS DA ESQUERDA PARA A DIREITA) */}
          <div
            onMouseEnter={() => setIsPausedHover(true)}
            onMouseLeave={() => setIsPausedHover(false)}
            className={`flex-1 w-full rounded-xl border-2 p-2.5 relative overflow-hidden flex items-center led-pixel-grid transition-all duration-300 ${getSchemeClass()}`}
            style={{ minHeight: '52px' }}
          >
            {/* Gloss reflection overlay */}
            <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none z-10" />

            {/* Scrolling track moving from left to right */}
            <div
              className={`w-full overflow-hidden relative flex items-center ${
                isPausedHover ? '' : ''
              }`}
            >
              <div
                className={`whitespace-nowrap font-mono-tech text-sm sm:text-base lg:text-lg select-none font-black flex items-center ${
                  isPausedHover ? '' : getAnimationClass()
                }`}
                style={{
                  animationPlayState: isPausedHover ? 'paused' : 'running',
                }}
              >
                {phrase}
                {phrase}
                {phrase}
                {phrase}
              </div>
            </div>

            {/* Direction indicator badge on the right */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 z-20 hidden md:flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/80 text-white font-mono-tech text-[8px] font-bold border border-white/20 shadow">
              <span>◄◄ LTR ROLL</span>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL EXPANDIDO COM A FOTO DA ANDRÓIDE FUTURISTA */}
      {isPhotoModalOpen && (
        <div
          onClick={() => setIsPhotoModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-gradient-to-b from-[#0a1628] via-[#040b15] to-[#010408] border-2 border-cyan-400 p-4 sm:p-6 rounded-3xl max-w-md w-full shadow-[0_0_50px_rgba(0,240,255,0.4)] relative flex flex-col items-center text-center gap-3 animate-in zoom-in-95 duration-200"
          >
            <button
              onClick={() => setIsPhotoModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-cyan-950/80 text-cyan-300 hover:text-white border border-cyan-500/40 hover:bg-cyan-900 transition-colors cursor-pointer"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Android Holographic Tag */}
            <div className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400 font-mono-tech text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-[0_0_12px_#00f0ff]">
              <Sparkles className="w-3.5 h-3.5" />
              ANDRÓIDE DIGITAL • LOCUTORA INTERCONTINENTAL
            </div>

            {/* Big High-Res Image of the Android */}
            <div className="w-64 h-64 sm:w-72 sm:h-72 rounded-2xl overflow-hidden border-3 border-cyan-300 shadow-[0_0_30px_rgba(0,240,255,0.5)] relative my-1">
              <img
                src={androidImg}
                alt="Andróide futurista"
                className="w-full h-full object-cover object-top"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/40 to-transparent p-2 text-white font-mono-tech text-[10px] font-bold">
                TRANSGRESSÃO VOCAL V8
              </div>
            </div>

            {/* Slogan Speech Box */}
            <div className="bg-[#001026] border border-cyan-500/50 p-3 rounded-xl w-full text-left font-mono-tech flex flex-col gap-1">
              <div className="flex items-center justify-between text-[9px] text-amber-400 font-black uppercase">
                <span>MENSAGEM AO OUVINTE:</span>
                <span className="text-cyan-300">VOZ DIGITAL 100% SINTONIZADA</span>
              </div>
              <p className="text-sm sm:text-base font-black text-white font-display italic">
                “Intercontinental e você: tudo a ver! Sinta a pulsação do motor e a melhor música do planeta!”
              </p>
            </div>

            {/* Action button to speak */}
            <button
              onClick={handleAndroidVoiceGreet}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-black font-mono-tech text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_15px_#00f0ff] cursor-pointer transition-all active:scale-98"
            >
              <Volume2 className="w-4 h-4 text-black" />
              OUVIR A VOZ DA ANDRÓIDE AO VIVO
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

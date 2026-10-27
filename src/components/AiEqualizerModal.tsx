import React, { useState } from 'react';
import { Sparkles, X, CheckCircle2 } from 'lucide-react';
import { EQProfile } from '../types';
import { audioEngine } from '../utils/audioEngine';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onApplyProfile: (profile: EQProfile, hue?: number, commentary?: string) => void;
}

const PRESET_IDEAS = [
  'Tokyo Drift Noturno no Asfalto Molhado',
  'Paredão Automotivo com Subgrave Estourando',
  'Autobahn 300km/h com Eurodance Eletrônico',
  'Acústico Intimista Vocal Cristalino',
  'V8 Muscle Car Retrô anos 70',
  'Phonk Pesado para Racha Noturno',
];

export const AiEqualizerModal: React.FC<Props> = ({ isOpen, onClose, onApplyProfile }) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async (queryText?: string) => {
    const q = queryText || prompt.trim();
    if (!q || isLoading) return;

    setIsLoading(true);
    setResult(null);

    try {
      audioEngine.playCockpitBeep(1100);

      const res = await fetch('/api/ai/smart-equalizer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: q }),
      });

      if (!res.ok) throw new Error('Falha ao gerar equalização');
      const data = await res.json();
      setResult(data);

      const newProfile: EQProfile = {
        id: `ai-${Date.now()}`,
        name: data.name || 'AI SMART TUNE',
        label: data.name || 'AI SMART TUNE',
        lowGain: data.lowGain,
        midGain: data.midGain,
        highGain: data.highGain,
        accentColor: 'text-cyan-400',
        rpmBoost: data.rpmTarget ? Math.round(data.rpmTarget / 4) : 1000,
      };

      onApplyProfile(newProfile, data.hue, data.aiCommentary);
      audioEngine.playTurboBlowOff();
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="blue-lcd-screen max-w-lg w-full p-6 shadow-[0_0_50px_rgba(0,120,255,0.4)] relative flex flex-col gap-4">
        {/* Header */}
        <div className="flex justify-between items-center lcd-header-badge z-20 relative">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-[#001f4d] text-cyan-300 border border-cyan-500/40">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-black lcd-text-cyan font-mono-tech uppercase">
                [ LCD-12: AI SMART EQUALIZER & DRIVE PROFILE ]
              </h3>
              <p className="text-[10px] text-sky-400 font-mono-tech">
                Equalização precisa calculada para acústica automotiva
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-sky-400 hover:text-white p-1 rounded-lg border border-[#004b99] hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Input box */}
        <div className="flex flex-col gap-2 z-20 relative">
          <label className="text-[10px] font-black uppercase text-sky-300 font-mono-tech">
            Descreva o estilo sonoro desejado:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ex: Noite de chuva em Tóquio com graves densos e agudos suaves..."
              className="flex-1 bg-[#000c1e] border border-[#0055aa] rounded-xl px-3 py-2 text-xs text-white placeholder-sky-500 font-mono-tech focus:outline-none focus:border-cyan-400"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleGenerate();
              }}
            />
            <button
              onClick={() => handleGenerate()}
              disabled={isLoading || !prompt.trim()}
              className="px-4 py-2 rounded-xl btn-lcd-blue font-black text-xs font-mono-tech uppercase flex items-center gap-1.5 disabled:opacity-40 text-white"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isLoading ? 'AFINANDO...' : 'CALCULAR'}</span>
            </button>
          </div>
        </div>

        {/* Preset quick pills */}
        <div className="flex flex-col gap-1.5 z-20 relative">
          <span className="text-[9px] text-sky-400 font-mono-tech uppercase font-bold">
            Conceitos de afinação rápida:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_IDEAS.map((idea) => (
              <button
                key={idea}
                onClick={() => {
                  setPrompt(idea);
                  handleGenerate(idea);
                }}
                className="text-[9px] font-mono-tech bg-[#001738] hover:bg-[#002855] text-sky-200 border border-[#003d73] hover:border-cyan-400 px-2 py-1 rounded-lg transition-all"
              >
                {idea}
              </button>
            ))}
          </div>
        </div>

        {/* Result Preview */}
        {result && (
          <div className="bg-[#001026] border border-cyan-500/50 rounded-xl p-3.5 flex flex-col gap-2 mt-1 z-20 relative">
            <div className="flex justify-between items-center">
              <span className="text-xs font-black lcd-text-cyan font-mono-tech uppercase flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-cyan-300" />
                {result.name}
              </span>
              <span className="text-[9px] text-cyan-300 font-mono-tech font-bold">
                APLICADO NO DSP DO COCKPIT
              </span>
            </div>
            <p className="text-[11px] text-sky-200 font-mono-tech italic">
              "{result.description}"
            </p>

            <div className="grid grid-cols-3 gap-2 bg-[#001738] p-2 rounded-lg text-center font-mono-tech text-[10px] border border-[#003d73]">
              <div>
                <span className="text-sky-300 block font-bold">SUB-BASS</span>
                <span className="text-white text-xs">{result.lowGain > 0 ? `+${result.lowGain}` : result.lowGain} dB</span>
              </div>
              <div>
                <span className="text-cyan-300 block font-bold">MID-RANGE</span>
                <span className="text-white text-xs">{result.midGain > 0 ? `+${result.midGain}` : result.midGain} dB</span>
              </div>
              <div>
                <span className="text-white block font-bold">TREBLE</span>
                <span className="text-white text-xs">{result.highGain > 0 ? `+${result.highGain}` : result.highGain} dB</span>
              </div>
            </div>

            <div className="text-[10px] text-cyan-300 font-mono-tech bg-[#001738] p-2 rounded border border-[#004b99]">
              <strong>I-CON DIZ:</strong> {result.aiCommentary}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-[#003d73] z-20 relative">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg btn-lcd-blue text-xs font-mono-tech uppercase font-bold"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

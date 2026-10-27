import React, { useState } from 'react';
import {
  Download,
  Smartphone,
  Laptop,
  CheckCircle2,
  Share,
  PlusSquare,
  Sparkles,
  Zap,
  Volume2,
  Radio,
  X,
  ArrowRight,
  ShieldCheck,
  Flame,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { audioEngine } from '../utils/audioEngine';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const AppDownloadModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const {
    canPromptDirectly,
    isInstalled,
    isIOS,
    isMobile,
    triggerInstall,
  } = usePWAInstall();

  const [activeTab, setActiveTab] = useState<'auto' | 'android' | 'ios' | 'pc'>(
    isIOS ? 'ios' : isMobile ? 'android' : 'auto'
  );
  const [installSuccess, setInstallSuccess] = useState(false);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    audioEngine.playTouchSound('switch');
    if (canPromptDirectly) {
      const outcome = await triggerInstall();
      if (outcome === 'accepted') {
        setInstallSuccess(true);
        audioEngine.playCelebrationSound();
      }
    } else if (isIOS) {
      setActiveTab('ios');
    } else {
      setActiveTab(isMobile ? 'android' : 'pc');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl blue-lcd-casing p-5 sm:p-6 shadow-2xl border-2 border-cyan-500/50 max-h-[90vh] overflow-y-auto">
        {/* Glow corner highlights */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-cyan-500/30 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/30 to-blue-900/60 border border-cyan-400/60 flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.4)]">
              <Download className="w-6 h-6 text-cyan-300 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[9px] font-mono-tech font-black bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 uppercase">
                  PWA OFICIAL V8
                </span>
                <span className="text-[10px] text-amber-400 font-mono-tech font-bold flex items-center gap-1">
                  <Zap className="w-3 h-3" /> INSTALAÇÃO NATIVA
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white font-display uppercase tracking-tight">
                Baixar Aplicativo da Rádio
              </h3>
            </div>
          </div>

          <button
            onClick={() => {
              audioEngine.playTouchSound('click');
              onClose();
            }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Already Installed Notice */}
        {isInstalled && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
            <div className="text-xs font-mono-tech">
              <strong className="block text-white font-bold">APLICATIVO JÁ INSTALADO!</strong>
              Você já está desfrutando do modo aplicativo autônomo com máximo desempenho.
            </div>
          </div>
        )}

        {/* Main 1-Click Action Button */}
        {canPromptDirectly && !isInstalled && (
          <div className="mb-5 p-4 rounded-xl bg-gradient-to-r from-cyan-950/80 via-blue-950/70 to-indigo-950/80 border-2 border-cyan-400 shadow-[0_0_20px_rgba(0,240,255,0.3)] flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-left">
              <div className="text-xs font-mono-tech text-cyan-300 font-black flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" /> SEU NAVEGADOR ESTÁ PRONTO
              </div>
              <p className="text-xs text-slate-300 font-mono-tech mt-0.5">
                Instale agora com apenas 1 clique diretamente na sua tela inicial ou desktop.
              </p>
            </div>

            <button
              onClick={handleInstallClick}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-display font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,240,255,0.5)] transition-all cursor-pointer hover:scale-103 active:scale-95 shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>Instalar Agora</span>
            </button>
          </div>
        )}

        {/* Tab selection */}
        <div className="flex rounded-lg bg-[#00142e] p-1 border border-cyan-500/30 mb-4 gap-1">
          <button
            onClick={() => {
              audioEngine.playTouchSound('switch');
              setActiveTab('android');
            }}
            className={`flex-1 py-2 px-2 rounded-md text-xs font-mono-tech font-bold uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'android'
                ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-400 shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Android</span>
          </button>

          <button
            onClick={() => {
              audioEngine.playTouchSound('switch');
              setActiveTab('ios');
            }}
            className={`flex-1 py-2 px-2 rounded-md text-xs font-mono-tech font-bold uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'ios'
                ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-400 shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>🍎 iOS / iPhone</span>
          </button>

          <button
            onClick={() => {
              audioEngine.playTouchSound('switch');
              setActiveTab('pc');
            }}
            className={`flex-1 py-2 px-2 rounded-md text-xs font-mono-tech font-bold uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'pc'
                ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-400 shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>Windows / Mac</span>
          </button>
        </div>

        {/* Tab Guides */}
        <div className="space-y-4 mb-5">
          {activeTab === 'android' && (
            <div className="p-4 rounded-xl bg-[#001738] border border-cyan-500/30 text-xs font-mono-tech space-y-3">
              <div className="font-bold text-cyan-300 text-sm flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                Como instalar no seu celular Android:
              </div>
              <ol className="list-decimal list-inside space-y-2 text-slate-300">
                <li>
                  Toque no botão <strong className="text-white">Instalar Agora</strong> acima ou nos três pontinhos <strong className="text-white">⋮</strong> no topo do Chrome.
                </li>
                <li>
                  Selecione <strong className="text-cyan-300">"Instalar aplicativo"</strong> ou <strong className="text-cyan-300">"Adicionar à tela inicial"</strong>.
                </li>
                <li>
                  Confirme em <strong className="text-white">Instalar</strong>. O ícone oficial do Intercontinental Motor Sound V8 aparecerá na sua tela de apps!
                </li>
              </ol>
            </div>
          )}

          {activeTab === 'ios' && (
            <div className="p-4 rounded-xl bg-[#001738] border border-cyan-500/30 text-xs font-mono-tech space-y-3">
              <div className="font-bold text-cyan-300 text-sm flex items-center gap-2">
                <span>🍎</span>
                Como instalar no iPhone ou iPad (Safari):
              </div>
              <ol className="list-decimal list-inside space-y-2 text-slate-300">
                <li>
                  No navegador <strong className="text-white">Safari</strong>, toque no botão de <strong className="text-cyan-300">Compartilhar</strong> (ícone do quadrado com a seta para cima <Share className="w-3.5 h-3.5 inline mx-1 text-sky-400" />).
                </li>
                <li>
                  Role a lista para baixo e toque em <strong className="text-cyan-300">"Adicionar à Tela de Início"</strong> (<PlusSquare className="w-3.5 h-3.5 inline mx-1 text-sky-400" />).
                </li>
                <li>
                  Toque em <strong className="text-white">Adicionar</strong> no canto superior direito. Pronto! O app abrirá em tela cheia direto do seu iPhone.
                </li>
              </ol>
            </div>
          )}

          {activeTab === 'pc' && (
            <div className="p-4 rounded-xl bg-[#001738] border border-cyan-500/30 text-xs font-mono-tech space-y-3">
              <div className="font-bold text-cyan-300 text-sm flex items-center gap-2">
                <Laptop className="w-4 h-4 text-sky-400" />
                Como instalar no PC (Windows, Mac ou Linux):
              </div>
              <ol className="list-decimal list-inside space-y-2 text-slate-300">
                <li>
                  No <strong className="text-white">Google Chrome</strong> ou <strong className="text-white">Microsoft Edge</strong>, olhe para o canto direito da barra de endereços (onde fica o link).
                </li>
                <li>
                  Clique no ícone de <strong className="text-cyan-300">computador com seta para baixo</strong> ou <strong className="text-cyan-300">"Instalar aplicativo"</strong>.
                </li>
                <li>
                  O player abrirá como um programa dedicado na barra de tarefas, com som potente e sem abas de navegador!
                </li>
              </ol>
            </div>
          )}
        </div>

        {/* Benefits Grid */}
        <div className="border-t border-cyan-500/20 pt-4">
          <h4 className="text-[11px] font-mono-tech font-black text-amber-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-amber-400" /> Vantagens Exclusivas do Aplicativo:
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono-tech text-slate-300">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-[#001229] border border-cyan-500/20">
              <Volume2 className="w-4 h-4 text-cyan-300 shrink-0" />
              <span>Áudio em segundo plano com a tela desligada</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-[#001229] border border-cyan-500/20">
              <Zap className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Acesso instantâneo com 1 toque na tela</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-[#001229] border border-cyan-500/20">
              <Radio className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Transmissão V8 sem interrupções</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-[#001229] border border-cyan-500/20">
              <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0" />
              <span>Cockpit imersivo em tela cheia nativa</span>
            </div>
          </div>
        </div>

        {/* Footer Close */}
        <div className="mt-5 flex justify-end">
          <button
            onClick={() => {
              audioEngine.playTouchSound('click');
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-[#001738] hover:bg-[#002855] text-cyan-300 border border-cyan-500/40 text-xs font-mono-tech font-bold uppercase transition-all cursor-pointer"
          >
            Fechar Janela
          </button>
        </div>
      </div>
    </div>
  );
};

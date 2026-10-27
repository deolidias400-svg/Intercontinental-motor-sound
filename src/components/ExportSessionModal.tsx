import React, { useState, useMemo } from 'react';
import {
  FileJson,
  Download,
  Copy,
  Check,
  X,
  FileCode2,
  Cpu,
  Music,
  Gauge,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { Track, UserPreferences } from '../types/smartAudio';
import { TelemetryData, EQProfile, RadioStation } from '../types';
import { generateSessionExportData, downloadJsonFile, SessionExportPayload } from '../utils/exportSessionLog';

export interface ExportPlayRecord {
  track: Track;
  playedAt: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentTrack: Track;
  isPlaying: boolean;
  isNitro: boolean;
  volume: number;
  currentProfile: EQProfile;
  currentStation: RadioStation;
  telemetry: TelemetryData;
  recentPlays?: ExportPlayRecord[];
  userPreferences: UserPreferences;
  currentTime?: number;
}

export const ExportSessionModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentTrack,
  isPlaying,
  isNitro,
  volume,
  currentProfile,
  currentStation,
  telemetry,
  recentPlays,
  userPreferences,
  currentTime = 0,
}) => {
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [viewMode, setViewMode] = useState<'preview' | 'json'>('preview');

  const exportPayload: SessionExportPayload = useMemo(() => {
    return generateSessionExportData({
      currentTrack,
      isPlaying,
      isNitro,
      volume,
      currentProfile,
      currentStation,
      telemetry,
      recentPlays,
      userPreferences,
      currentTime,
    });
  }, [
    currentTrack,
    isPlaying,
    isNitro,
    volume,
    currentProfile,
    currentStation,
    telemetry,
    recentPlays,
    userPreferences,
    currentTime,
    isOpen,
  ]);

  if (!isOpen) return null;

  const jsonString = JSON.stringify(exportPayload, null, 2);

  const cleanSlug = (text: string) =>
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 30);

  const filename = `motorsound-session-${cleanSlug(currentTrack.title)}-${new Date()
    .toISOString()
    .replace(/[:.]/g, '-')
    .slice(0, 19)}.json`;

  const handleDownload = () => {
    downloadJsonFile(exportPayload, filename);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3000);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div
        className="w-full max-w-3xl rounded-2xl border border-cyan-500/50 bg-[#000d20] shadow-[0_0_50px_rgba(0,180,255,0.3)] flex flex-col max-h-[92vh] overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative Top Accent Glow */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-cyan-400 to-emerald-400" />

        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#003d73] flex items-center justify-between bg-gradient-to-r from-[#001026] via-[#001633] to-[#000c1e]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-black shadow-[0_0_15px_rgba(0,240,255,0.5)]">
              <FileJson className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold font-mono-tech uppercase text-white tracking-wider flex items-center gap-2">
                  Exportar Metadados & Log de Sessão
                  <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                    .JSON
                  </span>
                </h3>
              </div>
              <p className="text-xs text-sky-300/80 font-mono-tech">
                Metadados completos da faixa atual + Telemetria em tempo real + Histórico cronológico
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-sky-400 hover:text-white hover:bg-[#002244] border border-transparent hover:border-sky-500/50 transition-all cursor-pointer"
            title="Fechar janela"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Bar (View mode toggles + Download & Copy actions) */}
        <div className="px-4 py-2.5 bg-[#00142e] border-b border-[#002d55] flex flex-wrap items-center justify-between gap-2 text-xs font-mono-tech">
          <div className="flex items-center gap-1.5 bg-[#000a18] p-1 rounded-lg border border-[#003866]">
            <button
              onClick={() => setViewMode('preview')}
              className={`px-3 py-1 rounded-md transition-all font-bold ${
                viewMode === 'preview'
                  ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(0,240,255,0.5)]'
                  : 'text-sky-300 hover:text-white'
              }`}
            >
              Visão Resumo
            </button>
            <button
              onClick={() => setViewMode('json')}
              className={`px-3 py-1 rounded-md transition-all font-bold flex items-center gap-1.5 ${
                viewMode === 'json'
                  ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(0,240,255,0.5)]'
                  : 'text-sky-300 hover:text-white'
              }`}
            >
              <FileCode2 className="w-3.5 h-3.5" /> Código JSON
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#001f3f] hover:bg-[#002b57] text-sky-200 border border-[#004b99] hover:border-cyan-400 transition-all cursor-pointer active:scale-95"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado!' : 'Copiar JSON'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg font-bold bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black shadow-[0_0_15px_rgba(16,185,129,0.5)] border border-emerald-300 transition-all cursor-pointer active:scale-95"
            >
              {downloaded ? (
                <>
                  <Check className="w-4 h-4 text-black stroke-[3]" />
                  <span>Baixado com Sucesso!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 stroke-[2.5]" />
                  <span>Baixar Arquivo .JSON</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 font-mono-tech space-y-4">
          {viewMode === 'preview' ? (
            <div className="space-y-4">
              {/* Summary Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. Track Info Card */}
                <div className="p-3 rounded-xl bg-[#001738]/90 border border-sky-500/40 flex flex-col gap-1.5">
                  <div className="text-[10px] text-amber-300 font-bold uppercase flex items-center gap-1.5">
                    <Music className="w-3.5 h-3.5 text-amber-400" /> Metadados da Música
                  </div>
                  <div className="text-sm font-bold text-white truncate" title={currentTrack.title}>
                    {currentTrack.title}
                  </div>
                  <div className="text-xs text-cyan-300 truncate">{currentTrack.artist}</div>
                  <div className="text-[11px] text-sky-400/90 truncate">
                    Álbum: <strong className="text-sky-200">{currentTrack.album || 'Single'}</strong> ({currentTrack.year || 2024})
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-[10px]">
                    <span className="px-1.5 py-0.5 rounded bg-[#002855] text-cyan-200 border border-[#004b99]">
                      {currentTrack.genre}
                    </span>
                    <span className="text-amber-400 font-bold">{currentTrack.bpm} BPM</span>
                  </div>
                </div>

                {/* 2. Cockpit Telemetry Card */}
                <div className="p-3 rounded-xl bg-[#001738]/90 border border-emerald-500/40 flex flex-col gap-1.5">
                  <div className="text-[10px] text-emerald-300 font-bold uppercase flex items-center gap-1.5">
                    <Gauge className="w-3.5 h-3.5 text-emerald-400" /> Telemetria de Sessão
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-xs">
                    <div>
                      <span className="text-[10px] text-sky-400 block">ROTAÇÃO</span>
                      <strong className="text-cyan-300">{telemetry.rpm} RPM</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-sky-400 block">VELOCIDADE</span>
                      <strong className="text-emerald-300">{telemetry.speed} km/h</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-sky-400 block">PRESSÃO TURBO</span>
                      <strong className="text-amber-300">{telemetry.psi.toFixed(1)} PSI</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-sky-400 block">NITRO OVERBOOST</span>
                      <strong className={telemetry.isNitro ? 'text-rose-400' : 'text-sky-400'}>
                        {telemetry.isNitro ? 'ATIVO 🔥' : 'OFF'}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* 3. Audio & Interaction Metrics Card */}
                <div className="p-3 rounded-xl bg-[#001738]/90 border border-purple-500/40 flex flex-col gap-1.5">
                  <div className="text-[10px] text-purple-300 font-bold uppercase flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-purple-400" /> Perfil & Histórico
                  </div>
                  <div className="text-xs">
                    <span className="text-[10px] text-sky-400 block">PERFIL ACÚSTICO</span>
                    <strong className="text-purple-300">{currentProfile.name}</strong>
                  </div>
                  <div className="text-xs">
                    <span className="text-[10px] text-sky-400 block">ESTAÇÃO SINTONIZADA</span>
                    <strong className="text-sky-200 truncate block">{currentStation.name}</strong>
                  </div>
                  <div className="text-[10px] text-sky-400 mt-1 flex justify-between">
                    <span>Faixas no Histórico:</span>
                    <strong className="text-cyan-300">{(recentPlays || []).length} registradas</strong>
                  </div>
                </div>
              </div>

              {/* JSON Architecture Overview */}
              <div className="p-3.5 rounded-xl bg-[#000a18] border border-[#00386b] text-xs space-y-2">
                <div className="flex items-center justify-between text-cyan-300 font-bold text-xs">
                  <span>Estrutura do Arquivo JSON para Análise Externa:</span>
                  <span className="text-amber-400 text-[10px]">motorsound-session-export.json</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-sky-300/90">
                  <div className="p-2 rounded bg-[#001229] border border-[#00244d]">
                    <strong className="text-white block font-bold">1. currentTrackMetadata</strong>
                    <span>Id, título, artista, álbum, ano, gênero, humor, atividade, duração, BPM, tom, bitrate, trivia e link de streaming.</span>
                  </div>
                  <div className="p-2 rounded bg-[#001229] border border-[#00244d]">
                    <strong className="text-white block font-bold">2. livePlaybackSession</strong>
                    <span>Estado da reprodução, volume, posição atual, perfil equalizador e rádio conectada.</span>
                  </div>
                  <div className="p-2 rounded bg-[#001229] border border-[#00244d]">
                    <strong className="text-white block font-bold">3. cockpitTelemetrySnapshot</strong>
                    <span>RPM, velocidade, pressão turbo (PSI/Bar), potência em cavalos (HP) e frequências sonoras (sub-grave, médio, agudo).</span>
                  </div>
                  <div className="p-2 rounded bg-[#001229] border border-[#00244d]">
                    <strong className="text-white block font-bold">4. recentPlaybackHistory & Analytics</strong>
                    <span>Registro cronológico das últimas 5 faixas tocadas, preferências do usuário e ambiente cliente.</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Raw Syntax JSON view */
            <div className="relative">
              <pre className="p-4 rounded-xl bg-[#000814] border border-[#004080] text-emerald-300 text-xs font-mono overflow-x-auto leading-relaxed max-h-[50vh] shadow-inner select-all">
                {jsonString}
              </pre>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#001026] border-t border-[#003366] flex flex-wrap items-center justify-between gap-3 text-xs font-mono-tech">
          <div className="text-sky-400/80 text-[11px] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Arquivo pronto para ingestão em Python, Jupyter, Pandas, PowerBI ou dashboards externos.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-[#001f3f] hover:bg-[#002b57] text-sky-200 border border-[#004080] transition-colors cursor-pointer"
            >
              Fechar
            </button>
            <button
              onClick={handleDownload}
              className="px-4 py-2 rounded-lg font-bold bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black shadow-[0_0_12px_rgba(16,185,129,0.5)] border border-emerald-300 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Exportar .JSON Agora</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

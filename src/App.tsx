/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CockpitTheme, RadioStation, EQProfile, TelemetryData } from './types';
import { Track, UserPreferences } from './types/smartAudio';
import { RADIO_STATIONS } from './data/radioStations';
import { TRACK_CATALOG } from './data/trackCatalog';
import { DRIVE_PROFILES } from './components/DriveProfiles';
import { audioEngine } from './utils/audioEngine';
import {
  getStoredPreferences,
  savePreferences,
} from './utils/recommendationEngine';

import { CockpitHeader } from './components/CockpitHeader';
import { TelemetryGauges } from './components/TelemetryGauges';
import { AudioVisualizer } from './components/AudioVisualizer';
import { CockpitControls } from './components/CockpitControls';
import { DriveProfiles } from './components/DriveProfiles';
import { MusicChatbotRobot } from './components/MusicChatbotRobot';
import { AiEqualizerModal } from './components/AiEqualizerModal';
import { CockpitFooter } from './components/CockpitFooter';
import { VoiceControlModule } from './components/VoiceControlModule';
import { NowPlayingCard } from './components/NowPlayingCard';
import { AudioTranscriberModal } from './components/AudioTranscriberModal';
import { ExportSessionModal } from './components/ExportSessionModal';
import { AppDownloadModal } from './components/AppDownloadModal';
import { GreenLcdTripComputer } from './components/GreenLcdTripComputer';
import { AndroidElectronicMarquee } from './components/AndroidElectronicMarquee';

import { Sparkles, Radio, Music, Cpu } from 'lucide-react';

export default function App() {
  // Theme state
  const [currentTheme, setCurrentTheme] = useState<CockpitTheme>('default');
  const [themeHue, setThemeHue] = useState<number>(0);

  // Playback & Audio state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isNitro, setIsNitro] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(80);
  const [currentStation, setCurrentStation] = useState<RadioStation>(RADIO_STATIONS[0]);
  const [currentProfile, setCurrentProfile] = useState<EQProfile>(DRIVE_PROFILES[0]);
  const [customAudioName, setCustomAudioName] = useState<string | null>(null);

  // Track state with clear default metadata (Música, Cantor, Disco)
  const [currentTrack, setCurrentTrack] = useState<Track>(() => ({
    ...TRACK_CATALOG[0],
    title: 'Intercontinental V8 Speed Anthem',
    artist: 'Motor Sound All-Stars',
    album: 'Disco Master V8 / Edição Especial',
  }));
  const [userPreferences, setUserPreferences] = useState<UserPreferences>(getStoredPreferences());

  // AI Modal, Transcriber Modal, Export Modal & PWA Download Modal
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [isTranscriberOpen, setIsTranscriberOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState<boolean>(false);

  // Real-time Telemetry
  const [telemetry, setTelemetry] = useState<TelemetryData>({
    bass: 0,
    mid: 0,
    high: 0,
    psi: 0,
    rpm: 0,
    speed: 0,
    hp: 100,
    isNitro: false,
  });

  // Restore saved theme on initial mount
  useEffect(() => {
    const saved = localStorage.getItem('cockpit-theme') as CockpitTheme;
    if (saved) {
      handleSelectTheme(saved);
    }
  }, []);

  // Polling de metadados do streaming ao vivo (nome da música, cantor e disco)
  useEffect(() => {
    let isCancelled = false;

    const fetchLiveStreamMetadata = async () => {
      try {
        const res = await fetch('/api/stream/live-metadata');
        if (!res.ok) return;
        const data = await res.json();
        if (isCancelled) return;

        if (data && data.title && data.artist) {
          setCurrentTrack((prev) => {
            if (customAudioName) return prev;
            if (prev.title === data.title && prev.artist === data.artist) return prev;
            return {
              ...prev,
              title: data.title,
              artist: data.artist,
              album: data.album || prev.album,
              genre: data.genre || prev.genre,
              bitrate: data.bitrate || prev.bitrate,
            };
          });
        }
      } catch (err) {
        // Fallback silencioso
      }
    };

    fetchLiveStreamMetadata();
    const interval = setInterval(fetchLiveStreamMetadata, 14000);

    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [customAudioName]);

  // Sons de clique em todos os botões do player (como em um sistema operacional)
  useEffect(() => {
    const handleGlobalButtonClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest('button, [role="button"], input[type="range"]');
      if (!target) return;

      const text = target.textContent?.toLowerCase() || '';
      // Avoid overlapping with special sounds
      if (
        text.includes('ignição') ||
        text.includes('stop ■') ||
        text.includes('acelerar motor') ||
        text.includes('amando a rádio') ||
        text.includes('curtindo a rádio')
      ) {
        return;
      }

      audioEngine.playTouchSound('click');
    };

    window.addEventListener('click', handleGlobalButtonClick, true);
    return () => {
      window.removeEventListener('click', handleGlobalButtonClick, true);
    };
  }, []);

  const handleSelectTheme = (theme: CockpitTheme) => {
    setCurrentTheme(theme);
    if (theme === 'default') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
    localStorage.setItem('cockpit-theme', theme);
  };

  // Telemetry loop with Web Audio Analyser
  useEffect(() => {
    let animId: number;

    const updateTelemetry = () => {
      animId = requestAnimationFrame(updateTelemetry);

      if (!isPlaying) {
        setTelemetry((prev) => ({
          ...prev,
          bass: 0,
          mid: 0,
          high: 0,
          psi: 0,
          rpm: 0,
          speed: 0,
          hp: isNitro ? 140 : 100,
          isNitro,
        }));
        return;
      }

      const freqData = audioEngine.getFrequencyData();
      if (freqData.length === 0) return;

      let bSum = 0;
      let mSum = 0;
      let hSum = 0;

      for (let i = 0; i < 18; i++) bSum += freqData[i] || 0;
      for (let i = 18; i < 55; i++) mSum += freqData[i] || 0;
      for (let i = 55; i < 95; i++) hSum += freqData[i] || 0;

      const calcBass = Math.min(100, Math.round((bSum / 18 / 255) * 100));
      const calcMid = Math.min(100, Math.round((mSum / 37 / 255) * 100));
      const calcHigh = Math.min(100, Math.round((hSum / 40 / 255) * 100));

      const calcRpm = Math.min(
        8800,
        Math.max(
          1200,
          Math.round(1800 + calcMid * 45 + (isNitro ? 2200 : 0) + currentProfile.rpmBoost)
        )
      );

      const calcPsi = Math.min(
        2.8,
        Math.max(0.2, Number(((calcBass / 100) * 1.8 + (isNitro ? 0.8 : 0.2)).toFixed(1)))
      );

      const calcSpeed = Math.min(
        360,
        Math.max(80, Math.round(90 + calcHigh * 2.1 + (isNitro ? 80 : 0)))
      );

      setTelemetry({
        bass: calcBass,
        mid: calcMid,
        high: calcHigh,
        psi: calcPsi,
        rpm: calcRpm,
        speed: calcSpeed,
        hp: isNitro ? 140 : 100,
        isNitro,
      });
    };

    updateTelemetry();

    return () => cancelAnimationFrame(animId);
  }, [isPlaying, isNitro, currentProfile]);

  // Pre-aquecer a conexão do streaming para que o botão de ignição toque instantaneamente
  useEffect(() => {
    audioEngine.warmUp(currentStation.url);

    const handleFirstGesture = () => {
      audioEngine.warmUp(currentStation.url);
    };

    window.addEventListener('pointerdown', handleFirstGesture, { once: true });
    window.addEventListener('touchstart', handleFirstGesture, { once: true });

    return () => {
      window.removeEventListener('pointerdown', handleFirstGesture);
      window.removeEventListener('touchstart', handleFirstGesture);
    };
  }, [currentStation.url]);

  // Audio Playback Handlers - Ignição Instantânea
  const handlePlay = (trackToPlay?: Track) => {
    audioEngine.init();
    const audioEl = audioEngine.getAudioElement();
    if (!audioEl) return;

    setIsConnecting(true);

    const targetTrack = trackToPlay || currentTrack;
    if (trackToPlay) {
      setCurrentTrack(trackToPlay);
      if (audioEl.src !== trackToPlay.url) {
        audioEl.src = trackToPlay.url;
      }
    } else {
      const neededSrc = targetTrack.url || currentStation.url;
      if (!audioEl.src || audioEl.src === window.location.href || audioEl.src !== neededSrc) {
        audioEl.src = neededSrc;
      }
    }

    audioEngine.setVolume(volume / 100);
    audioEngine.setEqualizer(currentProfile.lowGain, currentProfile.midGain, currentProfile.highGain);
    audioEngine.setNitro(isNitro);

    const playPromise = audioEl.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPlaying(true);
          setIsConnecting(false);
          recordPlayInHistory(targetTrack);
        })
        .catch((err) => {
          console.warn('Play error, retrying unmuted:', err);
          audioEl.muted = false;
          audioEl.play()
            .then(() => {
              setIsPlaying(true);
              setIsConnecting(false);
              recordPlayInHistory(targetTrack);
            })
            .catch(() => {
              setIsConnecting(false);
            });
        });
    } else {
      setIsPlaying(true);
      setIsConnecting(false);
      recordPlayInHistory(targetTrack);
    }
  };

  const handleStop = () => {
    const audioEl = audioEngine.getAudioElement();
    if (audioEl) {
      audioEl.pause();
    }
    setIsPlaying(false);
    setIsConnecting(false);
  };

  const handleNextTrack = () => {
    const curIdx = TRACK_CATALOG.findIndex((t) => t.id === currentTrack.id);
    const nextTrack = TRACK_CATALOG[(curIdx + 1) % TRACK_CATALOG.length];
    handlePlay(nextTrack);
  };

  const handlePrevTrack = () => {
    const curIdx = TRACK_CATALOG.findIndex((t) => t.id === currentTrack.id);
    const prevIdx = (curIdx - 1 + TRACK_CATALOG.length) % TRACK_CATALOG.length;
    const prevTrack = TRACK_CATALOG[prevIdx];
    handlePlay(prevTrack);
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    audioEngine.setVolume(newVol / 100);
  };

  const handleToggleNitro = () => {
    const nextNitro = !isNitro;
    setIsNitro(nextNitro);
    audioEngine.setNitro(nextNitro);
  };

  const handleSelectProfile = (profile: EQProfile) => {
    setCurrentProfile(profile);
    audioEngine.setEqualizer(profile.lowGain, profile.midGain, profile.highGain);
  };

  const handleSelectStation = (station: RadioStation) => {
    setCurrentStation(station);
    setCustomAudioName(null);

    const audioEl = audioEngine.getAudioElement();
    if (audioEl) {
      audioEl.src = station.url;
      if (isPlaying) {
        audioEl.play().catch((e) => console.warn(e));
      }
    }
  };

  const handleCustomAudioFile = (file: File) => {
    audioEngine.init();
    const objectUrl = URL.createObjectURL(file);
    const audioEl = audioEngine.getAudioElement();
    if (audioEl) {
      audioEl.src = objectUrl;
      setCustomAudioName(file.name);
      audioEl.play().then(() => setIsPlaying(true));
    }
  };

  const recordPlayInHistory = (track: Track) => {
    const playTimestamp = new Date().toISOString();

    setUserPreferences((prev) => {
      const newGenres = { ...prev.favoriteGenres };
      newGenres[track.genre] = (newGenres[track.genre] || 0) + 1;

      const newMoods = { ...prev.favoriteMoods };
      newMoods[track.mood] = (newMoods[track.mood] || 0) + 1;

      const newActs = { ...prev.favoriteActivities };
      newActs[track.activity] = (newActs[track.activity] || 0) + 1;

      const updated: UserPreferences = {
        ...prev,
        playedHistory: [
          ...prev.playedHistory.slice(-40),
          { trackId: track.id, playedAt: playTimestamp, completed: true },
        ],
        favoriteGenres: newGenres,
        favoriteMoods: newMoods,
        favoriteActivities: newActs,
      };

      savePreferences(updated);
      return updated;
    });
  };

  const handleLikeTrack = (trackId: string) => {
    audioEngine.playTouchSound('toggle');
    setUserPreferences((prev) => {
      const isAlreadyLiked = prev.likedTrackIds.includes(trackId);
      const newLiked = isAlreadyLiked
        ? prev.likedTrackIds.filter((id) => id !== trackId)
        : [...prev.likedTrackIds, trackId];

      const newDisliked = prev.dislikedTrackIds.filter((id) => id !== trackId);

      const trk = TRACK_CATALOG.find((t) => t.id === trackId);
      const newGenres = { ...prev.favoriteGenres };
      if (trk && !isAlreadyLiked) {
        newGenres[trk.genre] = (newGenres[trk.genre] || 0) + 3;
      }

      const updated: UserPreferences = {
        ...prev,
        likedTrackIds: newLiked,
        dislikedTrackIds: newDisliked,
        favoriteGenres: newGenres,
      };

      savePreferences(updated);
      return updated;
    });
  };

  const handleDislikeTrack = (trackId: string) => {
    audioEngine.playTouchSound('click');
    setUserPreferences((prev) => {
      const newDisliked = [...prev.dislikedTrackIds.filter((id) => id !== trackId), trackId];
      const newLiked = prev.likedTrackIds.filter((id) => id !== trackId);

      const updated: UserPreferences = {
        ...prev,
        likedTrackIds: newLiked,
        dislikedTrackIds: newDisliked,
      };

      savePreferences(updated);
      return updated;
    });
  };

  const handleSkipTrack = (trackId: string) => {
    audioEngine.playTouchSound('click');
    setUserPreferences((prev) => {
      const updated: UserPreferences = {
        ...prev,
        skippedTrackIds: [...prev.skippedTrackIds.slice(-20), trackId],
      };
      savePreferences(updated);
      return updated;
    });
    handleNextTrack();
  };

  const handleExecuteVoiceAction = (action: string, payload?: any) => {
    switch (action) {
      case 'PLAY':
        if (!isPlaying) handlePlay();
        break;
      case 'PAUSE':
        if (isPlaying) handleStop();
        break;
      case 'NEXT':
        handleNextTrack();
        break;
      case 'PREV':
        handlePrevTrack();
        break;
      case 'VOLUME_UP':
        handleVolumeChange(Math.min(100, volume + 15));
        break;
      case 'VOLUME_DOWN':
        handleVolumeChange(Math.max(0, volume - 15));
        break;
      case 'SET_VOLUME':
        if (typeof payload?.volumeTarget === 'number') {
          handleVolumeChange(payload.volumeTarget);
        }
        break;
      case 'TOGGLE_NITRO':
      case 'ENABLE_NITRO':
        if (!isNitro) {
          setIsNitro(true);
          audioEngine.setNitro(true);
          audioEngine.playNitroBlast();
        }
        break;
      case 'DISABLE_NITRO':
        if (isNitro) {
          setIsNitro(false);
          audioEngine.setNitro(false);
        }
        break;
      case 'PLAY_SEARCH':
        if (payload?.query) {
          const q = payload.query.toLowerCase();
          const match = TRACK_CATALOG.find(
            (t) =>
              t.title.toLowerCase().includes(q) ||
              t.artist.toLowerCase().includes(q) ||
              t.genre.toLowerCase().includes(q)
          );
          if (match) {
            handlePlay(match);
          }
        }
        break;
      case 'SET_EQ_TURBO': {
        const p = DRIVE_PROFILES.find((x) => x.id === 'TURBO');
        if (p) handleSelectProfile(p);
        break;
      }
      case 'SET_EQ_SPORT': {
        const p = DRIVE_PROFILES.find((x) => x.id === 'SPORT');
        if (p) handleSelectProfile(p);
        break;
      }
      case 'SET_EQ_CRUISE': {
        const p = DRIVE_PROFILES.find((x) => x.id === 'STOCK');
        if (p) handleSelectProfile(p);
        break;
      }
      case 'REV_ENGINE':
        audioEngine.playRevSound();
        break;
      default:
        break;
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-start p-3 sm:p-5 selection:bg-cyan-500 selection:text-black">
      <div className="max-w-[1380px] w-full flex flex-col gap-4">
        {/* 1. TOPO: MASTER BLUE LCD CONTROLLER & STATUS */}
        <CockpitHeader
          currentTheme={currentTheme}
          onSelectTheme={handleSelectTheme}
          isPlaying={isPlaying}
          isNitro={isNitro}
          currentTrack={currentTrack}
          onOpenTranscriber={() => setIsTranscriberOpen(true)}
          onOpenExport={() => setIsExportModalOpen(true)}
          onOpenDownloadApp={() => setIsDownloadModalOpen(true)}
        />

        {/* 2. PAINEL LCD RETRO DE FUNDO VERDE CLARO (DATA, HORA, TEMPERATURA E INFOS DO PLAYER) */}
        <GreenLcdTripComputer
          currentTheme={currentTheme}
          isPlaying={isPlaying}
          isNitro={isNitro}
          volume={volume}
          currentProfile={currentProfile}
          currentTrack={currentTrack}
          stationName={currentStation.name}
          bitrate={currentTrack.bitrate || '320 KBPS'}
        />

        {/* 3. LETREIRO ELETRÔNICO COM LETRAS PRETAS DA ESQUERDA PARA A DIREITA & IMAGEM DA ANDRÓIDE */}
        <AndroidElectronicMarquee
          isPlaying={isPlaying}
          isNitro={isNitro}
        />

        {/* 4. GRAND BLUE LCD MASTER CASING */}
        <div className="blue-lcd-casing p-4 sm:p-6 flex flex-col gap-5">
          {/* TOP THREE-COLUMN MATRIX GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* COLUNA ESQUERDA: TELEMETRIA EM BLUE LCD (3 COLUNAS) */}
            <div className="lg:col-span-3 flex flex-col gap-4">
              <TelemetryGauges telemetry={telemetry} isPlaying={isPlaying} />
            </div>

            {/* COLUNA CENTRAL: DISPLAY ESTAÇÃO, NOW PLAYING, VISUALIZADOR, CONTROLES & VOZ (5 COLUNAS) */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              {/* DISPLAY DA MARCA DA ESTAÇÃO EM BLUE LCD */}
              <div className="blue-lcd-screen text-center py-3 p-4">
                <div className="flex justify-between items-center lcd-header-badge z-20 relative mb-1">
                  <span>[ LCD-DISPLAY: INTERCONTINENTAL MOTOR SOUND V8.5 ]</span>
                  <span className="flex items-center gap-1 text-cyan-300">
                    <Sparkles className="w-3 h-3 text-amber-300 animate-spin" />
                    <span className="text-amber-300 font-bold">AI MATRIX</span>
                  </span>
                </div>

                <div className="text-[10px] tracking-[0.5em] text-amber-400 font-black uppercase mb-0.5 font-mono-tech z-20 relative">
                  HIGH-SPEED AUTOMOTIVE WEB PLAYER
                </div>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tighter lcd-text-cyan italic transition-all duration-300 font-display z-20 relative">
                  INTERCONTINENTAL
                </h1>
                <div className="text-base sm:text-lg font-bold tracking-[0.25em] text-white font-mono-tech mt-0.5 italic flex items-center justify-center gap-2 z-20 relative">
                  <span className="lcd-text-white">MOTOR SOUND</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-gradient-to-r from-red-600 via-amber-500 to-cyan-500 text-black font-black shadow-[0_0_10px_#ffea00]">
                    HQ STEREO
                  </span>
                </div>
              </div>

              {/* DETALHES COMPLETOS DA MÚSICA QUE ESTÁ TOCANDO (NOME, ARTISTA, ÁLBUM, GÊNERO, BITRATE, PROGRESSO) */}
              <NowPlayingCard
                currentTrack={currentTrack}
                isPlaying={isPlaying}
                isNitro={isNitro}
                isLiked={userPreferences.likedTrackIds.includes(currentTrack.id)}
                onToggleLike={() => handleLikeTrack(currentTrack.id)}
                onOpenExport={() => setIsExportModalOpen(true)}
                customAudioName={customAudioName}
                onAskCopilotAboutTrack={(track) => {
                  handleExecuteVoiceAction('PLAY_SEARCH', { query: `${track.title} ${track.artist}` });
                }}
              />

              {/* ESPECTROGRAMA ÓPTICO DINÂMICO MULTI-MODO NO BLUE LCD */}
              <AudioVisualizer
                isPlaying={isPlaying}
                isNitro={isNitro}
                themeHue={themeHue}
              />

              {/* CONTROLES DE PISTA COM PREV/NEXT, LIKE E KNOB DE POTÊNCIA NO BLUE LCD */}
              <CockpitControls
                isPlaying={isPlaying}
                onPlay={() => handlePlay()}
                onStop={handleStop}
                onNextTrack={handleNextTrack}
                onPrevTrack={handlePrevTrack}
                volume={volume}
                onVolumeChange={handleVolumeChange}
                isNitro={isNitro}
                onToggleNitro={handleToggleNitro}
                currentStation={currentStation}
                onSelectStation={handleSelectStation}
                onCustomAudioFile={handleCustomAudioFile}
                currentTrack={currentTrack}
                isLiked={userPreferences.likedTrackIds.includes(currentTrack.id)}
                onToggleLike={() => handleLikeTrack(currentTrack.id)}
                onOpenDownloadApp={() => setIsDownloadModalOpen(true)}
                isConnecting={isConnecting}
              />

              {/* MÓDULO DE CONTROLE POR VOZ COM IA NO BLUE LCD */}
              <VoiceControlModule
                isPlaying={isPlaying}
                volume={volume}
                isNitro={isNitro}
                currentTrackTitle={`${currentTrack.title} - ${currentTrack.artist}`}
                onExecuteAction={handleExecuteVoiceAction}
                onOpenTranscriber={() => setIsTranscriberOpen(true)}
              />

              {/* PERFIS DE PILOTAGEM ACÚSTICA & AFINADOR POR IA NO BLUE LCD */}
              <DriveProfiles
                currentProfile={currentProfile}
                onSelectProfile={handleSelectProfile}
                onOpenAiEqualizer={() => setIsAiModalOpen(true)}
              />
            </div>

            {/* COLUNA DIREITA: NOVO CHATBOT INTELIGENTE DE MÚSICA COM ROBÔ I-CON (4 COLUNAS) */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              <MusicChatbotRobot
                telemetry={telemetry}
                isPlaying={isPlaying}
                isNitro={isNitro}
                onExecuteAction={handleExecuteVoiceAction}
                currentTrack={currentTrack}
              />
            </div>
          </div>

          {/* RODAPÉ: COLORIMETRIA DE TURBINA, LINKS & MARQUEE NO BLUE LCD */}
          <div className="w-full">
            <CockpitFooter
              currentHue={themeHue}
              onSelectHue={setThemeHue}
            />
          </div>
        </div>
      </div>

      {/* AI SMART EQUALIZER MODAL EM BLUE LCD */}
      <AiEqualizerModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onApplyProfile={(newProfile, hue, commentary) => {
          handleSelectProfile(newProfile);
          if (hue !== undefined) setThemeHue(hue);
          setIsAiModalOpen(false);
        }}
      />

      {/* AUDIO TRANSCRIBER MODAL WITH GEMINI 3.5 TRANSCRIBE */}
      <AudioTranscriberModal
        isOpen={isTranscriberOpen}
        onClose={() => setIsTranscriberOpen(false)}
        onExecuteCommand={(commandText) => {
          handleExecuteVoiceAction('PLAY_SEARCH', { query: commandText });
        }}
        onSendToChatbot={(message) => {
          handleExecuteVoiceAction('VOICE_RAW', { query: message });
        }}
      />

      {/* EXPORT TRACK METADATA & SESSION LOGS MODAL (.JSON) */}
      <ExportSessionModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        isNitro={isNitro}
        volume={volume}
        currentProfile={currentProfile}
        currentStation={currentStation}
        telemetry={telemetry}
        userPreferences={userPreferences}
      />

      {/* PWA APP DOWNLOAD & INSTALLATION MODAL */}
      <AppDownloadModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
      />
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Sparkles } from 'lucide-react';
import { audioEngine } from '../utils/audioEngine';

interface Props {
  isPlaying: boolean;
  volume: number;
  isNitro: boolean;
  currentTrackTitle: string;
  onExecuteAction: (action: string, payload?: any) => void;
  onVoiceFeedback?: (feedback: string) => void;
  onOpenTranscriber?: () => void;
}

export const VoiceControlModule: React.FC<Props> = ({
  isPlaying,
  volume,
  isNitro,
  currentTrackTitle,
  onExecuteAction,
  onVoiceFeedback,
  onOpenTranscriber,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [lastCommand, setLastCommand] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [browserSupport, setBrowserSupport] = useState(true);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setBrowserSupport(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript('');
      setFeedback('Ouvindo comando no cockpit...');
      audioEngine.playCockpitBeep(1100);
    };

    recognition.onresult = (event: any) => {
      let current = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        current += event.results[i][0].transcript;
      }
      setTranscript(current);
    };

    recognition.onerror = (event: any) => {
      console.warn('Speech recognition error:', event.error);
      setIsListening(false);
      if (event.error === 'not-allowed') {
        setFeedback('Permissão de microfone negada no navegador.');
      } else {
        setFeedback('Microfone desconectado ou inativo.');
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
    };
  }, []);

  useEffect(() => {
    if (!isListening && transcript.trim().length > 1) {
      processVoiceCommand(transcript.trim());
    }
  }, [isListening]);

  const processVoiceCommand = async (spokenText: string) => {
    setIsProcessing(true);
    setLastCommand(spokenText);
    setFeedback('IA interpretando intenção sonora...');

    try {
      const res = await fetch('/api/ai/voice-command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: spokenText,
          currentStatus: {
            isPlaying,
            volume,
            isNitro,
            currentTrackTitle,
          },
        }),
      });

      if (!res.ok) throw new Error('Falha ao interpretar comando');
      const data = await res.json();

      setFeedback(data.spokenFeedback);
      if (onVoiceFeedback) onVoiceFeedback(data.spokenFeedback);

      audioEngine.playCockpitBeep(850);

      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(data.spokenFeedback);
        utterance.lang = 'pt-BR';
        utterance.rate = 1.15;
        window.speechSynthesis.speak(utterance);
      }

      onExecuteAction(data.action, {
        volumeTarget: data.volumeTarget,
        query: data.query,
        playlistCriteria: data.playlistCriteria,
      });
    } catch (e: any) {
      console.error('Voice error:', e);
      setFeedback('Erro ao conectar inteligência vocal.');
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleListening = () => {
    audioEngine.playTouchSound('toggle');
    if (!browserSupport) {
      const manualCmd = prompt(
        'Digite o comando de voz (Ex: "tocar música", "aumentar volume", "próxima música", "tocar synthwave"):'
      );
      if (manualCmd) {
        processVoiceCommand(manualCmd);
      }
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch (e) {}
      setIsListening(false);
    } else {
      try {
        recognitionRef.current?.start();
      } catch (e) {
        console.warn('Erro ao iniciar reconhecimento:', e);
      }
    }
  };

  const handleSimulateCommand = (cmd: string) => {
    audioEngine.playTouchSound('click');
    processVoiceCommand(cmd);
  };

  return (
    <div className="blue-lcd-screen p-3.5 flex flex-col gap-2.5">
      <div className="flex justify-between items-center lcd-header-badge z-20 relative">
        <span className="flex items-center gap-1.5 lcd-text-cyan font-bold">
          <Mic className="w-3.5 h-3.5 animate-pulse" /> [ LCD-07: AI VOICE COMMAND HANDS-FREE ]
        </span>
        <span
          className={`px-2 py-0.5 rounded text-[8px] font-bold font-mono-tech ${
            isListening
              ? 'bg-red-500/30 text-red-300 border border-red-500/60 animate-pulse'
              : 'bg-[#001026] text-sky-400 border border-[#003d73]'
          }`}
        >
          {isListening ? 'MICROFONE GRAVANDO...' : 'STANDBY'}
        </span>
      </div>

      <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 bg-[#001026]/90 p-2.5 rounded-xl border border-[#004b99] z-20 relative">
        <button
          onClick={toggleListening}
          className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
            isListening
              ? 'bg-red-600 text-white border-red-400 shadow-[0_0_20px_#ff0000] scale-105 animate-pulse'
              : 'btn-lcd-blue shadow-[0_0_15px_rgba(0,240,255,0.4)]'
          }`}
          title="Clique para falar um comando de voz"
        >
          {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <div className="text-[11px] font-mono-tech font-bold text-white truncate flex items-center gap-1.5">
            {isProcessing ? (
              <span className="lcd-text-cyan flex items-center gap-1">
                <Sparkles className="w-3 h-3 animate-spin" /> Interpretando voz com Gemini...
              </span>
            ) : isListening ? (
              <span className="text-cyan-300 animate-pulse">
                {transcript || 'Fale agora: "Tocar música", "Aumentar volume", "Próxima"...'}
              </span>
            ) : lastCommand ? (
              <span className="text-sky-200">
                Último: <strong className="lcd-text-white">"{lastCommand}"</strong>
              </span>
            ) : (
              <span className="text-sky-300/80">
                Toque no microfone para controlar o player sem as mãos
              </span>
            )}
          </div>

          {feedback && (
            <div className="text-[9px] font-mono-tech lcd-text-cyan truncate mt-0.5">
              🤖 I-CON: {feedback}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1 z-20 relative">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[8px] text-amber-300 font-mono-tech uppercase font-bold self-center mr-1">
            Comandos rápidos:
          </span>
          <button
            onClick={() => handleSimulateCommand('Tocar música')}
            className="bg-emerald-950/70 border border-emerald-500/60 text-emerald-300 hover:text-white hover:bg-emerald-900 text-[9px] px-2 py-0.5 rounded cursor-pointer transition-all"
          >
            ▶ "Tocar"
          </button>
          <button
            onClick={() => handleSimulateCommand('Pausar')}
            className="bg-red-950/70 border border-red-500/60 text-rose-300 hover:text-white hover:bg-red-900 text-[9px] px-2 py-0.5 rounded cursor-pointer transition-all"
          >
            ⏸ "Pausar"
          </button>
          <button
            onClick={() => handleSimulateCommand('Próxima música')}
            className="bg-purple-950/70 border border-purple-500/60 text-purple-300 hover:text-white hover:bg-purple-900 text-[9px] px-2 py-0.5 rounded cursor-pointer transition-all"
          >
            ⏭ "Próxima"
          </button>
          <button
            onClick={() => handleSimulateCommand('Aumentar volume')}
            className="bg-amber-950/70 border border-amber-500/60 text-amber-300 hover:text-white hover:bg-amber-900 text-[9px] px-2 py-0.5 rounded cursor-pointer transition-all"
          >
            🔊 "Aumentar vol"
          </button>
          <button
            onClick={() => handleSimulateCommand('Tocar Synthwave')}
            className="bg-pink-950/70 border border-pink-500/60 text-pink-300 hover:text-white hover:bg-pink-900 text-[9px] px-2 py-0.5 rounded cursor-pointer transition-all"
          >
            🎵 "Synthwave"
          </button>
        </div>

        {onOpenTranscriber && (
          <button
            onClick={onOpenTranscriber}
            className="text-[9px] font-mono-tech font-bold text-amber-300 hover:text-white bg-gradient-to-r from-red-900/60 to-amber-900/60 border border-amber-400/50 px-2 py-0.5 rounded flex items-center gap-1 cursor-pointer transition-all shadow-[0_0_8px_rgba(255,200,0,0.3)]"
          >
            <Sparkles className="w-2.5 h-2.5 text-amber-400" /> Transcrever com Gemini 3.5 &rarr;
          </button>
        )}
      </div>
    </div>
  );
};

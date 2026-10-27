import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Square,
  Sparkles,
  Upload,
  Copy,
  Check,
  Volume2,
  Play,
  RotateCcw,
  X,
  FileAudio,
  Radio,
  Send,
  Cpu,
} from 'lucide-react';
import { audioEngine } from '../utils/audioEngine';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onExecuteCommand?: (commandText: string) => void;
  onSendToChatbot?: (message: string) => void;
}

export const AudioTranscriberModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onExecuteCommand,
  onSendToChatbot,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Clean up on unmount or close
  useEffect(() => {
    if (!isOpen) {
      stopRecordingCleanup();
    }
  }, [isOpen]);

  const stopRecordingCleanup = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch (e) {}
    }
    setIsRecording(false);
  };

  // Start recording with microphone
  const handleStartRecording = async () => {
    setErrorMsg(null);
    setTranscript(null);
    setUploadedFileName(null);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Setup Web Audio Analyser for live recording waveform
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Draw live microphone waveform
      drawMicrophoneWaveform();

      // Setup MediaRecorder
      let mimeType = 'audio/webm';
      if (!MediaRecorder.isTypeSupported('audio/webm')) {
        mimeType = MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : 'audio/ogg';
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
          processAudioTranscription(audioBlob, mimeType);
        }
      };

      mediaRecorder.start(200); // 200ms slice
      setIsRecording(true);
      setRecordingDuration(0);
      audioEngine.playCockpitBeep(1100);

      // Duration counter
      timerIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => {
          if (prev >= 60) {
            handleStopRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err: any) {
      console.error('Microphone error:', err);
      setErrorMsg('Não foi possível acessar o microfone. Verifique as permissões do navegador.');
      setIsRecording(false);
    }
  };

  // Stop recording and send to gemini-3.5-transcribe
  const handleStopRecording = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      audioEngine.playCockpitBeep(650);
    }
    setIsRecording(false);
  };

  // Real-time canvas waveform animation while recording
  const drawMicrophoneWaveform = () => {
    const canvas = canvasRef.current;
    if (!canvas || !analyserRef.current) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      animFrameRef.current = requestAnimationFrame(render);
      analyser.getByteFrequencyData(dataArray);

      ctx.fillStyle = 'rgba(0, 16, 44, 0.4)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height * 0.85;

        // Glowing red / amber / cyan gradient for microphone
        const grad = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
        grad.addColorStop(0, '#ff0055');
        grad.addColorStop(0.5, '#ffb700');
        grad.addColorStop(1, '#00f0ff');

        ctx.fillStyle = grad;
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
        x += barWidth + 1;
      }
    };

    render();
  };

  // Convert audio Blob to Base64 and call server endpoint
  const processAudioTranscription = async (blob: Blob, mimeType: string) => {
    setIsTranscribing(true);
    setErrorMsg(null);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(blob);

      reader.onloadend = async () => {
        const base64Data = reader.result as string;

        const response = await fetch('/api/ai/transcribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audioBase64: base64Data,
            mimeType: mimeType || 'audio/webm',
            prompt: 'Transcreva todo o conteúdo deste áudio com fidelidade ortográfica e pontuação precisa.',
          }),
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Falha na resposta do modelo de transcrição');
        }

        const data = await response.json();
        setTranscript(data.transcript || '(Nenhuma fala audível detectada)');
        audioEngine.playCockpitBeep(980);
      };
    } catch (err: any) {
      console.error('Transcription error:', err);
      setErrorMsg(err.message || 'Erro ao comunicar com o modelo gemini-3.5-transcribe.');
    } finally {
      setIsTranscribing(false);
    }
  };

  // Upload an existing audio file for transcription
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    setTranscript(null);
    setErrorMsg(null);

    const mime = file.type || 'audio/mp3';
    processAudioTranscription(file, mime);
  };

  const handleCopyTranscript = () => {
    if (!transcript) return;
    navigator.clipboard.writeText(transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeakTranscript = () => {
    if (!transcript || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(transcript);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.05;
    window.speechSynthesis.speak(utterance);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl rounded-2xl bg-gradient-to-b from-[#001738] via-[#001026] to-[#000814] border-2 border-cyan-400 p-5 sm:p-6 shadow-[0_0_50px_rgba(0,240,255,0.3)] flex flex-col gap-4 text-white font-sans max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#003d73] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center shadow-[0_0_15px_#ff0055]">
              <Mic className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black font-display tracking-tight text-white flex items-center gap-2">
                TRANSCRIÇÃO DE ÁUDIO &bull; GEMINI 3.5
              </h3>
              <p className="text-[10px] text-cyan-300 font-mono-tech">
                Modelo: <strong className="text-amber-400">gemini-3.5-transcribe</strong> &bull; Microfone & Arquivos
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#001f44] border border-[#004b99] text-sky-400 hover:text-white hover:border-cyan-400 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Audio Recording & Waveform Section */}
        <div className="flex flex-col items-center justify-center bg-[#000c1e] p-4 rounded-xl border border-[#003366] relative overflow-hidden">
          {/* Live Waveform Canvas */}
          <canvas
            ref={canvasRef}
            width={520}
            height={90}
            className="w-full h-22 rounded-lg bg-[#000814] border border-[#002244]"
          />

          {/* Recording Timer / Status */}
          <div className="mt-3 flex items-center justify-between w-full text-xs font-mono-tech px-2">
            <div className="flex items-center gap-2">
              <span
                className={`w-3 h-3 rounded-full ${
                  isRecording ? 'bg-red-500 animate-ping' : 'bg-sky-600'
                }`}
              />
              <span className={`font-bold ${isRecording ? 'text-red-400' : 'text-sky-400'}`}>
                {isRecording ? `GRAVANDO VOZ: 00:${recordingDuration.toString().padStart(2, '0')}` : 'MICROFONE PRONTO'}
              </span>
            </div>

            <span className="text-[10px] text-sky-400/80">LIMITE: 60s &bull; FLAC/WAV COMPATÍVEL</span>
          </div>

          {/* Record / Stop Action Controls */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            {!isRecording ? (
              <button
                onClick={handleStartRecording}
                disabled={isTranscribing}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400 text-white font-bold text-xs uppercase font-mono-tech tracking-wider flex items-center gap-2 shadow-[0_0_20px_rgba(255,0,85,0.5)] transition-all cursor-pointer hover:scale-102 active:scale-98"
              >
                <Mic className="w-4 h-4 animate-pulse" /> INICIAR GRAVAÇÃO NO MICROFONE
              </button>
            ) : (
              <button
                onClick={handleStopRecording}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-400 hover:to-red-500 text-white font-black text-xs uppercase font-mono-tech tracking-wider flex items-center gap-2 shadow-[0_0_25px_#ffcc00] transition-all cursor-pointer animate-pulse hover:scale-102 active:scale-98"
              >
                <Square className="w-4 h-4 fill-current" /> PARAR & TRANSCREVER COM IA
              </button>
            )}

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isRecording || isTranscribing}
              className="px-4 py-3 rounded-xl bg-[#001f44] hover:bg-[#002f66] text-cyan-300 border border-cyan-500/50 font-bold text-xs uppercase font-mono-tech tracking-wider flex items-center gap-2 transition-all cursor-pointer"
              title="Carregar arquivo gravado para transcrição"
            >
              <Upload className="w-4 h-4" /> ENVIAR ARQUIVO DE ÁUDIO
            </button>
            <input
              type="file"
              ref={fileInputRef}
              accept="audio/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>

          {uploadedFileName && (
            <div className="mt-2 text-[10px] font-mono-tech text-amber-300 flex items-center gap-1">
              <FileAudio className="w-3.5 h-3.5" /> Arquivo selecionado: {uploadedFileName}
            </div>
          )}
        </div>

        {/* Loading Spinner for Transcription */}
        {isTranscribing && (
          <div className="flex flex-col items-center justify-center p-6 bg-[#00122e]/80 rounded-xl border border-cyan-500/40 gap-3">
            <Sparkles className="w-8 h-8 text-cyan-300 animate-spin" />
            <span className="text-sm font-bold font-mono-tech text-cyan-300 animate-pulse">
              Processando áudio com gemini-3.5-transcribe...
            </span>
            <span className="text-[10px] text-sky-400">
              Transformando ondas sonoras em texto de alta precisão
            </span>
          </div>
        )}

        {/* Error Notification */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/60 text-xs text-red-200 font-mono-tech">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Transcription Results Card */}
        {transcript && !isTranscribing && (
          <div className="flex flex-col gap-2.5 p-4 rounded-xl bg-[#000f28] border-2 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.2)] animate-fadeIn">
            <div className="flex items-center justify-between border-b border-[#003366] pb-2">
              <span className="text-[10px] font-mono-tech font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" /> TRANSCRIÇÃO CONCLUÍDA &bull; GEMINI 3.5 TRANSCRIBE
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleSpeakTranscript}
                  className="px-2 py-1 rounded bg-[#001f44] text-cyan-300 hover:text-white text-[10px] font-mono-tech border border-cyan-500/40 flex items-center gap-1 cursor-pointer"
                  title="Ouvir texto em voz alta"
                >
                  <Volume2 className="w-3 h-3" /> Ouvir
                </button>
                <button
                  onClick={handleCopyTranscript}
                  className="px-2 py-1 rounded bg-[#001f44] text-cyan-300 hover:text-white text-[10px] font-mono-tech border border-cyan-500/40 flex items-center gap-1 cursor-pointer"
                  title="Copiar texto"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
            </div>

            {/* Formatted Transcript Text */}
            <div className="p-3 rounded-lg bg-[#000814] border border-[#002244] text-sm text-sky-100 font-mono-tech leading-relaxed select-all">
              "{transcript}"
            </div>

            {/* Action buttons with transcript */}
            <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
              {onExecuteCommand && (
                <button
                  onClick={() => {
                    onExecuteCommand(transcript);
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-black font-black text-[10px] uppercase font-mono-tech flex items-center gap-1.5 cursor-pointer shadow-[0_0_10px_#00f0ff]"
                >
                  <Play className="w-3 h-3 fill-current" /> Executar como Comando no Cockpit
                </button>
              )}

              {onSendToChatbot && (
                <button
                  onClick={() => {
                    onSendToChatbot(transcript);
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#002b66] hover:bg-[#003d88] text-cyan-300 hover:text-white font-bold text-[10px] uppercase font-mono-tech border border-cyan-500/60 flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3 h-3" /> Enviar ao Robô I-CON
                </button>
              )}
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="flex items-center justify-between text-[9px] font-mono-tech text-sky-400/70 border-t border-[#002e5c] pt-2">
          <span>SUPORTE A MICROFONE EM TEMPO REAL & GRAVAÇÕES</span>
          <span className="text-amber-400 font-bold">API GEMINI-3.5-TRANSCRIBE OFICIAL</span>
        </div>
      </div>
    </div>
  );
};

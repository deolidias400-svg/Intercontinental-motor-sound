import React, { useState, useRef, useEffect } from 'react';
import { TelemetryData, CopilotMessage } from '../types';
import { audioEngine } from '../utils/audioEngine';
import { Bot, Send, Volume2, VolumeX, Sparkles, MessageSquare, Zap, Activity } from 'lucide-react';

interface Props {
  telemetry: TelemetryData;
  isPlaying: boolean;
  isNitro: boolean;
  onExecuteAction: (action: string) => void;
  currentChannelTitle?: string;
}

export const RobotCopilot: React.FC<Props> = ({
  telemetry,
  isPlaying,
  isNitro,
  onExecuteAction,
  currentChannelTitle,
}) => {
  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: 'init-1',
      sender: 'icon',
      text: 'Sistemas Intercontinental conectados! Co-piloto I-CON v8.5 online e pronto para acelerar.',
      timestamp: '00:00',
      vibe: 'RACING',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [currentVibe, setCurrentVibe] = useState('RACING');
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  // Net Oscilloscope canvas
  const netCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = netCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const renderNet = () => {
      animId = requestAnimationFrame(renderNet);
      const width = canvas.width;
      const height = canvas.height;

      ctx.fillStyle = 'rgba(2, 2, 5, 0.4)';
      ctx.fillRect(0, 0, width, height);

      const timeData = audioEngine.getTimeDomainData();
      if (!isPlaying || timeData.length === 0) {
        // Idle line
        ctx.strokeStyle = 'rgba(255, 183, 0, 0.25)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
        return;
      }

      ctx.lineWidth = 1.5;
      ctx.strokeStyle = isNitro ? '#ff4500' : '#00f0ff';
      ctx.beginPath();
      const sliceWidth = width / timeData.length;
      let x = 0;
      for (let i = 0; i < timeData.length; i++) {
        const v = timeData[i] / 128.0;
        const y = (v * height) / 2;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += sliceWidth;
      }
      ctx.lineTo(width, height / 2);
      ctx.stroke();
    };

    renderNet();
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, isNitro]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Voice synthesis helper
  const speakText = async (text: string) => {
    if (!voiceEnabled || !text) return;

    try {
      // First try Gemini server-side TTS
      const res = await fetch('/api/ai/copilot-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice: 'Fenrir' }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.audioBase64) {
          audioEngine.playPcmAudio(data.audioBase64);
          return;
        }
      }
    } catch (e) {
      console.warn('TTS server request failed, falling back to Web Speech:', e);
    }

    // Web Speech API fallback
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      utterance.pitch = 1.1;
      utterance.rate = 1.15;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSendMessage = async (msgToSend?: string) => {
    const text = msgToSend || inputText.trim();
    if (!text || isAiLoading) return;

    const userMsg: CopilotMessage = {
      id: String(Date.now()),
      sender: 'pilot',
      text,
      timestamp: new Date().toTimeString().split(' ')[0],
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsAiLoading(true);

    try {
      audioEngine.playCockpitBeep(1000);

      const res = await fetch('/api/ai/copilot-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          telemetry: {
            ...telemetry,
            activeChannel: currentChannelTitle,
          },
        }),
      });

      if (!res.ok) throw new Error('Falha na resposta do co-piloto IA');

      const data = await res.json();

      const aiMsg: CopilotMessage = {
        id: String(Date.now() + 1),
        sender: 'icon',
        text: data.reply || 'Comando processado pelos circuitos do V8!',
        timestamp: new Date().toTimeString().split(' ')[0],
        suggestedAction: data.suggestedAction,
        vibe: data.vibe,
      };

      setMessages((prev) => [...prev, aiMsg]);
      if (data.vibe) setCurrentVibe(data.vibe);

      // Execute suggested action if any
      if (data.suggestedAction && data.suggestedAction !== 'NONE') {
        onExecuteAction(data.suggestedAction);
      }

      // Voice response
      speakText(data.speechText || data.reply);
    } catch (err: any) {
      const errorMsg: CopilotMessage = {
        id: String(Date.now() + 1),
        sender: 'icon',
        text: 'Sistemas em overdrive! Frequência estabilizada e acelerador engatado!',
        timestamp: new Date().toTimeString().split(' ')[0],
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Quick Action Buttons
  const handleQuickAction = (cmd: string) => {
    handleSendMessage(cmd);
  };

  // Calculate mouth height based on bass
  const mouthHeight = isPlaying ? Math.max(5, Math.min(32, Math.round(telemetry.bass / 3))) : 6;
  const mouthRadius = telemetry.bass > 55 ? '50%' : '12px';

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* 1. MONITOR DE CONEXÃO TRANSATLÂNTICA / OSCILOSCÓPIO */}
      <div className="bg-gradient-to-b from-black/80 to-zinc-950/90 border border-white/10 rounded-xl p-3 shadow-xl flex flex-col">
        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-white/5 pb-1.5 mb-2 font-mono-tech">
          <span className="flex items-center gap-1.5 text-cyan-400">
            <Activity className="w-3.5 h-3.5" /> SINAL TRANSATLÂNTICO
          </span>
          <span className="text-[9px] text-green-400">100% LINK</span>
        </div>
        <div className="h-14 w-full rounded bg-black/80 border border-white/5 overflow-hidden">
          <canvas ref={netCanvasRef} width={300} height={56} className="w-full h-full object-cover" />
        </div>
      </div>

      {/* 2. REFINADO MASCOTE ROBÔ I-CON FLIGHT ASSISTANT */}
      <div
        className={`bg-gradient-to-b from-[#14131c] via-[#090810] to-[#020204] border border-white/10 rounded-2xl p-4 shadow-2xl flex flex-col items-center justify-center relative overflow-hidden transition-all duration-300 ${
          isNitro ? 'border-orange-500/50 shadow-[0_0_30px_rgba(255,69,0,0.3)]' : ''
        }`}
      >
        {/* Top Header Badge */}
        <div className="flex justify-between items-center w-full mb-2 px-1">
          <span className="text-[8px] font-black tracking-widest text-amber-400 uppercase font-mono-tech bg-black/60 px-2 py-0.5 rounded border border-white/5">
            I-CON • V8.5 AI COPILOT
          </span>
          <button
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className={`p-1 rounded text-[9px] font-mono-tech flex items-center gap-1 border ${
              voiceEnabled
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-black/40 text-gray-500 border-white/5'
            }`}
            title={voiceEnabled ? 'Voz da IA Ativada' : 'Voz da IA Desativada'}
          >
            {voiceEnabled ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
            <span className="text-[8px]">{voiceEnabled ? 'VOZ ON' : 'MUDO'}</span>
          </button>
        </div>

        {/* ROBOT ANIMATED BODY */}
        <div className={`flex flex-col items-center my-3 select-none ${isPlaying ? 'robot-dancing' : 'robot-floating'}`}>
          {/* Antennas */}
          <div className="w-24 -mb-1 flex justify-between px-2">
            <div className="w-1 h-4 bg-gradient-to-t from-zinc-700 to-amber-500 rounded relative">
              <span
                className={`absolute -top-1.5 -left-1 w-3 h-3 rounded-full ${
                  isNitro ? 'bg-orange-500 shadow-[0_0_8px_#ff4500]' : 'bg-cyan-400 shadow-[0_0_8px_#00f0ff]'
                }`}
              />
            </div>
            <div className="w-1 h-4 bg-gradient-to-t from-zinc-700 to-amber-500 rounded relative">
              <span
                className={`absolute -top-1.5 -left-1 w-3 h-3 rounded-full ${
                  isNitro ? 'bg-orange-500 shadow-[0_0_8px_#ff4500]' : 'bg-cyan-400 shadow-[0_0_8px_#00f0ff]'
                }`}
              />
            </div>
          </div>

          {/* Head */}
          <div className="w-32 h-26 rounded-[34px] border-4 border-[#07070a] bg-gradient-to-br from-amber-400 via-amber-200 to-amber-800 p-2 shadow-2xl relative z-10 flex items-center justify-center">
            {/* Ears */}
            <div className="absolute -left-3 top-6 w-3 h-8 bg-zinc-900 border-2 border-amber-500 rounded-sm"></div>
            <div className="absolute -right-3 top-6 w-3 h-8 bg-zinc-900 border-2 border-amber-500 rounded-sm"></div>

            {/* Screen */}
            <div className="w-full h-full bg-[#030305] rounded-[24px] border-2 border-[#16151e] flex flex-col items-center justify-center gap-2 p-1.5 shadow-inner">
              {/* Eyes */}
              <div className="flex gap-6 items-center justify-center">
                {isNitro ? (
                  <>
                    <div
                      className="w-5 h-5 bg-orange-500 shadow-[0_0_14px_#ff4500]"
                      style={{
                        clipPath: 'polygon(50% 15%, 0% 100%, 25% 100%, 50% 50%, 75% 100%, 100% 100%)',
                      }}
                    />
                    <div
                      className="w-5 h-5 bg-orange-500 shadow-[0_0_14px_#ff4500]"
                      style={{
                        clipPath: 'polygon(50% 15%, 0% 100%, 25% 100%, 50% 50%, 75% 100%, 100% 100%)',
                      }}
                    />
                  </>
                ) : (
                  <>
                    <div className="w-5 h-5 rounded-full bg-gradient-to-b from-white via-cyan-400 to-blue-700 shadow-[0_0_12px_#00f0ff] robot-eye-blink" />
                    <div className="w-5 h-5 rounded-full bg-gradient-to-b from-white via-cyan-400 to-blue-700 shadow-[0_0_12px_#00f0ff] robot-eye-blink" />
                  </>
                )}
              </div>

              {/* Reactive Mouth */}
              <div
                className={`transition-all duration-75 shadow-md ${
                  isNitro
                    ? 'bg-orange-500 shadow-[0_0_12px_#ff4500]'
                    : 'bg-cyan-400 shadow-[0_0_10px_#00f0ff]'
                }`}
                style={{
                  width: `${isPlaying ? Math.max(28, Math.min(60, telemetry.bass)) : 36}px`,
                  height: `${mouthHeight}px`,
                  borderRadius: mouthRadius,
                }}
              />
            </div>
          </div>

          {/* Body */}
          <div className="w-28 h-24 -mt-4 bg-gradient-to-b from-zinc-800 to-zinc-950 border-3 border-amber-500 rounded-[28px] relative z-5 flex flex-col items-center shadow-xl">
            {/* Badge */}
            <span className="text-[7px] font-black tracking-widest text-black bg-amber-400 px-2 py-0.5 rounded mt-2 shadow-[0_0_6px_rgba(255,183,0,0.5)] uppercase font-mono-tech">
              I-CON M.S.
            </span>

            {/* Glowing Core */}
            <div
              className={`w-9 h-9 rounded-full mt-2 relative flex items-center justify-center ${
                isNitro
                  ? 'bg-gradient-to-tr from-red-600 to-orange-400 shadow-[0_0_20px_#ff4500] animate-pulse'
                  : 'bg-gradient-to-tr from-cyan-600 to-blue-400 shadow-[0_0_16px_#00f0ff] robot-core-pulse'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white/80"></div>
            </div>

            {/* Arms */}
            <div
              className="absolute -left-4 top-4 w-4 h-12 bg-gradient-to-b from-amber-500 to-zinc-900 rounded-full border border-black transition-transform duration-200"
              style={{
                transform: isPlaying ? `rotate(${15 + (telemetry.mid % 20)}deg)` : 'rotate(15deg)',
              }}
            />
            <div
              className="absolute -right-4 top-4 w-4 h-12 bg-gradient-to-b from-amber-500 to-zinc-900 rounded-full border border-black transition-transform duration-200"
              style={{
                transform: isPlaying ? `rotate(${-15 - (telemetry.high % 20)}deg)` : 'rotate(-15deg)',
              }}
            />
          </div>
        </div>

        {/* 3. TERMINAL INTERCOM CHAT (GEMINI POWERED) */}
        <div className="w-full flex flex-col gap-2 mt-2 bg-black/60 p-2.5 rounded-xl border border-white/10">
          <div className="flex items-center justify-between text-[9px] font-mono-tech text-gray-400 border-b border-white/5 pb-1">
            <span className="flex items-center gap-1 text-amber-400 font-bold">
              <MessageSquare className="w-3 h-3" /> INTERCOM COCKPIT CHAT
            </span>
            <span className="text-[8px] text-cyan-400">VIBE: {currentVibe}</span>
          </div>

          {/* Messages list */}
          <div
            ref={chatScrollRef}
            className="h-28 overflow-y-auto pr-1 flex flex-col gap-1.5 custom-scroll text-[11px] font-mono-tech"
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`p-2 rounded-lg leading-tight ${
                  msg.sender === 'icon'
                    ? 'bg-amber-950/20 text-amber-300 border border-amber-500/20 self-start max-w-[95%]'
                    : 'bg-zinc-800 text-gray-200 border border-white/10 self-end max-w-[90%]'
                }`}
              >
                <div className="flex justify-between items-center text-[8px] opacity-60 mb-0.5">
                  <span className="font-bold">{msg.sender === 'icon' ? '🤖 I-CON' : '🏎️ PILOTO'}</span>
                  <span>{msg.timestamp}</span>
                </div>
                <div>{msg.text}</div>
              </div>
            ))}
            {isAiLoading && (
              <div className="p-1.5 rounded-lg bg-black/50 text-cyan-400 text-[10px] flex items-center gap-2 animate-pulse font-mono-tech">
                <Sparkles className="w-3 h-3 animate-spin" /> Processando telemetria neural com Gemini...
              </div>
            )}
          </div>

          {/* Quick command buttons */}
          <div className="flex flex-wrap gap-1 pt-1 border-t border-white/5">
            <button
              onClick={() => handleQuickAction('🔥 Ativar Modo Nitro e acelerar tudo!')}
              className="px-2 py-0.5 rounded bg-red-950/40 text-orange-400 border border-red-500/30 text-[9px] font-mono-tech hover:bg-red-900/50"
            >
              🔥 Nitro Overdrive
            </button>
            <button
              onClick={() => handleQuickAction('📊 Faça uma análise completa da telemetria de áudio atual')}
              className="px-2 py-0.5 rounded bg-cyan-950/40 text-cyan-300 border border-cyan-500/30 text-[9px] font-mono-tech hover:bg-cyan-900/50"
            >
              📊 Telemetria
            </button>
            <button
              onClick={() => handleQuickAction('🏎️ Mude para o modo de equalização Racing')}
              className="px-2 py-0.5 rounded bg-amber-950/40 text-amber-300 border border-amber-500/30 text-[9px] font-mono-tech hover:bg-amber-900/50"
            >
              🏎️ Modo Corrida
            </button>
          </div>

          {/* Text Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex gap-1.5 mt-1"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Fale com o robô I-CON..."
              className="flex-1 bg-black/80 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-gray-500 font-mono-tech focus:outline-none focus:border-amber-400"
            />
            <button
              type="submit"
              disabled={isAiLoading || !inputText.trim()}
              className="bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black p-2 rounded-lg font-bold flex items-center justify-center transition-all"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

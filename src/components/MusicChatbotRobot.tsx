import React, { useState, useRef, useEffect } from 'react';
import { TelemetryData, CopilotMessage } from '../types';
import { Track } from '../types/smartAudio';
import { audioEngine } from '../utils/audioEngine';
import { Bot, Send, Volume2, VolumeX, Sparkles, MessageSquare, Zap, Activity, Music, Radio, Disc } from 'lucide-react';

interface Props {
  telemetry: TelemetryData;
  isPlaying: boolean;
  isNitro: boolean;
  onExecuteAction: (action: string, payload?: any) => void;
  currentTrack?: Track;
}

const MUSIC_TOPICS = [
  '✨ Curiosidade da música tocando agora',
  '🎤 Quem é o artista e banda desta faixa?',
  '💿 Álbum, ano e detalhes de produção',
  '🎸 O que define o Synthwave?',
  '🎚️ Como equalizar graves no carro?',
  '🏎️ Músicas ideais para acelerar na estrada',
  '🎹 Eurodance 90s vs Phonk automotivo',
];

export const MusicChatbotRobot: React.FC<Props> = ({
  telemetry,
  isPlaying,
  isNitro,
  onExecuteAction,
  currentTrack,
}) => {
  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: 'init-1',
      sender: 'icon',
      text: 'Olá, Piloto! Sou o robô I-CON, sua Inteligência Artificial Especialista em Música. Vamos conversar sobre gêneros, história musical, equalização automotiva ou escolher a trilha sonora ideal!',
      timestamp: '00:00',
      vibe: 'MUSICOLOGIST',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [currentVibe, setCurrentVibe] = useState('MUSICOLOGIST');
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

      ctx.fillStyle = 'rgba(0, 16, 44, 0.4)';
      ctx.fillRect(0, 0, width, height);

      const timeData = audioEngine.getTimeDomainData();
      if (!isPlaying || timeData.length === 0) {
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
        return;
      }

      ctx.lineWidth = 1.5;
      ctx.strokeStyle = isNitro ? '#ffcc00' : '#00f0ff';
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
          telemetry,
          currentTrack,
        }),
      });

      if (!res.ok) throw new Error('Falha na resposta do I-CON');
      const data = await res.json();

      const aiMsg: CopilotMessage = {
        id: String(Date.now() + 1),
        sender: 'icon',
        text: data.reply || 'Comando musical recebido com sucesso!',
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

      speakText(data.speechText || data.reply);
    } catch (err: any) {
      const errorMsg: CopilotMessage = {
        id: String(Date.now() + 1),
        sender: 'icon',
        text: 'A música é a chave da ressonância! Estou sintonizado nas frequências do motor V8.',
        timestamp: new Date().toTimeString().split(' ')[0],
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Calculate mouth height based on bass
  const mouthHeight = isPlaying ? Math.max(5, Math.min(32, Math.round(telemetry.bass / 3))) : 6;
  const mouthRadius = telemetry.bass > 55 ? '50%' : '12px';

  return (
    <div className="blue-lcd-screen p-4 flex flex-col gap-3.5 w-full">
      {/* 1. HEADER DO CHATBOT ROBÔ */}
      <div className="flex justify-between items-center lcd-header-badge z-20 relative">
        <span className="flex items-center gap-1.5 lcd-text-cyan font-bold">
          <Bot className="w-4 h-4" /> [ LCD-08: I-CON • MUSIC MASTER AI CHATBOT ]
        </span>
        <button
          onClick={() => setVoiceEnabled(!voiceEnabled)}
          className={`px-2 py-0.5 rounded text-[8px] font-mono-tech flex items-center gap-1 border ${
            voiceEnabled
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400'
              : 'bg-[#001026] text-sky-500 border-[#003d73]'
          }`}
          title={voiceEnabled ? 'Voz da IA Ativada' : 'Voz da IA Desativada'}
        >
          {voiceEnabled ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
          <span>{voiceEnabled ? 'VOZ IA: ON' : 'MUDO'}</span>
        </button>
      </div>

      {/* 2. OSCILOSCÓPIO DO SINAL DE ÁUDIO */}
      <div className="h-10 w-full rounded-lg bg-[#000a1c] border border-[#004b99] overflow-hidden z-20 relative">
        <canvas ref={netCanvasRef} width={300} height={40} className="w-full h-full object-cover" />
      </div>

      {/* 3. MASCOTE ROBÔ I-CON NO AZUL LCD */}
      <div className="bg-[#001026]/90 border border-[#004b99] rounded-xl p-3 flex flex-col items-center justify-center relative z-20">
        <div className={`flex flex-col items-center my-1 select-none ${isPlaying ? 'robot-dancing' : 'robot-floating'}`}>
          {/* Antennas */}
          <div className="w-24 -mb-1 flex justify-between px-2">
            <div className="w-1 h-3.5 bg-gradient-to-t from-blue-700 to-cyan-400 rounded relative">
              <span
                className={`absolute -top-1.5 -left-1 w-2.5 h-2.5 rounded-full ${
                  isNitro ? 'bg-amber-400 shadow-[0_0_8px_#ffcc00]' : 'bg-cyan-400 shadow-[0_0_8px_#00f0ff]'
                }`}
              />
            </div>
            <div className="w-1 h-3.5 bg-gradient-to-t from-blue-700 to-cyan-400 rounded relative">
              <span
                className={`absolute -top-1.5 -left-1 w-2.5 h-2.5 rounded-full ${
                  isNitro ? 'bg-amber-400 shadow-[0_0_8px_#ffcc00]' : 'bg-cyan-400 shadow-[0_0_8px_#00f0ff]'
                }`}
              />
            </div>
          </div>

          {/* Head */}
          <div className="w-28 h-22 rounded-[28px] border-3 border-[#003d73] bg-gradient-to-br from-[#0055b3] via-[#002b66] to-[#001433] p-1.5 shadow-xl relative z-10 flex items-center justify-center">
            {/* Screen */}
            <div className="w-full h-full bg-[#000814] rounded-[20px] border border-[#0077e6] flex flex-col items-center justify-center gap-1.5 p-1 shadow-inner">
              {/* Eyes */}
              <div className="flex gap-5 items-center justify-center">
                {isNitro ? (
                  <>
                    <div className="w-4 h-4 bg-amber-400 shadow-[0_0_12px_#ffcc00] rounded-sm animate-pulse" />
                    <div className="w-4 h-4 bg-amber-400 shadow-[0_0_12px_#ffcc00] rounded-sm animate-pulse" />
                  </>
                ) : (
                  <>
                    <div className="w-4 h-4 rounded-full bg-cyan-300 shadow-[0_0_10px_#00f0ff] robot-eye-blink" />
                    <div className="w-4 h-4 rounded-full bg-cyan-300 shadow-[0_0_10px_#00f0ff] robot-eye-blink" />
                  </>
                )}
              </div>

              {/* Reactive Mouth */}
              <div
                className={`transition-all duration-75 shadow-md ${
                  isNitro ? 'bg-amber-400 shadow-[0_0_10px_#ffcc00]' : 'bg-cyan-400 shadow-[0_0_8px_#00f0ff]'
                }`}
                style={{
                  width: `${isPlaying ? Math.max(24, Math.min(50, telemetry.bass)) : 28}px`,
                  height: `${mouthHeight}px`,
                  borderRadius: mouthRadius,
                }}
              />
            </div>
          </div>

          {/* Body */}
          <div className="w-24 h-20 -mt-3 bg-gradient-to-b from-[#00224d] to-[#000d24] border-2 border-[#005bb5] rounded-[24px] relative z-5 flex flex-col items-center shadow-lg">
            <span className="text-[7px] font-black tracking-widest text-black bg-cyan-400 px-2 py-0.5 rounded mt-1.5 uppercase font-mono-tech shadow-[0_0_6px_#00f0ff]">
              I-CON MUSIC AI
            </span>
            <div
              className={`w-7 h-7 rounded-full mt-1.5 relative flex items-center justify-center ${
                isNitro
                  ? 'bg-amber-400 shadow-[0_0_15px_#ffcc00] animate-pulse'
                  : 'bg-cyan-500 shadow-[0_0_14px_#00f0ff] robot-core-pulse'
              }`}
            >
              <div className="w-3 h-3 rounded-full bg-white/90"></div>
            </div>
          </div>
        </div>

        <div className="text-[9px] font-mono-tech lcd-text-cyan font-bold mt-1 text-center">
          VIBE: <span className="text-white uppercase">{currentVibe}</span> • RESSONÂNCIA: 100%
        </div>
      </div>

      {/* 4. CHAT CONVERSACIONAL DE MÚSICA */}
      <div className="flex flex-col gap-2 bg-[#001026]/90 p-2.5 rounded-xl border border-[#004b99] z-20 relative">
        <div className="flex items-center justify-between text-[9px] font-mono-tech text-sky-400 border-b border-[#003d73] pb-1">
          <span className="flex items-center gap-1 lcd-text-cyan font-bold">
            <MessageSquare className="w-3 h-3" /> CONVERSA MUSICAL EM TEMPO REAL
          </span>
          <span className="text-[8px] text-sky-300">GEMINI NEURAL ENGINE</span>
        </div>

        {/* Message history */}
        <div
          ref={chatScrollRef}
          className="h-44 overflow-y-auto pr-1 flex flex-col gap-2 custom-scroll text-[11px] font-mono-tech"
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`p-2 rounded-lg leading-relaxed ${
                msg.sender === 'icon'
                  ? 'bg-[#00224d]/90 text-cyan-200 border border-cyan-500/30 self-start max-w-[95%] shadow-sm'
                  : 'bg-[#00183b] text-white border border-[#0055aa] self-end max-w-[90%]'
              }`}
            >
              <div className="flex justify-between items-center text-[8px] opacity-75 mb-0.5 text-sky-300">
                <span className="font-bold flex items-center gap-1">
                  {msg.sender === 'icon' ? (
                    <>
                      <Bot className="w-2.5 h-2.5" /> I-CON MUSIC AI
                    </>
                  ) : (
                    '🏎️ PILOTO'
                  )}
                </span>
                <span>{msg.timestamp}</span>
              </div>
              <div>{msg.text}</div>
            </div>
          ))}

          {isAiLoading && (
            <div className="p-2 rounded-lg bg-[#00183b] lcd-text-cyan text-[10px] flex items-center gap-2 animate-pulse font-mono-tech border border-[#0055aa]">
              <Sparkles className="w-3 h-3 animate-spin" /> I-CON consultando arquivo musical galáctico...
            </div>
          )}
        </div>

        {/* Quick topic buttons */}
        <div className="flex flex-wrap gap-1 pt-1 border-t border-[#003d73]">
          {MUSIC_TOPICS.map((topic) => (
            <button
              key={topic}
              onClick={() => handleSendMessage(topic)}
              className="text-[8px] font-mono-tech bg-[#00183b] hover:bg-[#002855] text-sky-200 border border-[#004b99] hover:border-cyan-400 px-2 py-0.5 rounded transition-all"
            >
              {topic}
            </button>
          ))}
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
            placeholder="Pergunte sobre música, estilos, produção, equalização..."
            className="flex-1 bg-[#000c1e] border border-[#0055aa] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-sky-500 font-mono-tech focus:outline-none focus:border-cyan-400"
          />
          <button
            type="submit"
            disabled={isAiLoading || !inputText.trim()}
            className="btn-lcd-blue disabled:opacity-40 p-2 rounded-lg font-bold flex items-center justify-center"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};

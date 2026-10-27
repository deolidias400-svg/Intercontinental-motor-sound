import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

    // Increase JSON body limit for base64 audio payload
    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Initialize Gemini API client on the server
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      hasApiKey: !!process.env.GEMINI_API_KEY,
      system: 'INTERCONTINENTAL MOTOR SOUND V8 AI COCKPIT',
      timestamp: new Date().toISOString(),
    });
  });

  // Live Streaming ICY & Mount Metadata for Intercontinental Motor Sound (Zeno wzcgaal0dnltv)
  app.get('/api/stream/live-metadata', async (req, res) => {
    try {
      const zenoKey = 'wzcgaal0dnltv';
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2500);

      let detectedTitle = '';
      let detectedArtist = '';
      let detectedAlbum = 'Intercontinental V8 Master Disc';

      try {
        const zenoRes = await fetch(`https://api.zeno.fm/mounts/metadata/subscribe/${zenoKey}`, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; IntercontinentalCockpit/2.0)',
            'Accept': 'text/event-stream, application/json',
          },
        });
        clearTimeout(timeout);

        if (zenoRes.ok) {
          const text = await zenoRes.text();
          const match = text.match(/"streamTitle"\s*:\s*"([^"]+)"/i) || text.match(/"title"\s*:\s*"([^"]+)"/i);
          if (match && match[1]) {
            const rawTitle = match[1].trim();
            if (rawTitle.includes(' - ')) {
              const parts = rawTitle.split(' - ');
              detectedArtist = parts[0].trim();
              detectedTitle = parts.slice(1).join(' - ').trim();
            } else {
              detectedTitle = rawTitle;
              detectedArtist = 'Intercontinental V8 Stream';
            }
          }
        }
      } catch (err) {
        clearTimeout(timeout);
      }

      if (detectedTitle && detectedArtist) {
        return res.json({
          status: 'live_stream',
          title: detectedTitle,
          artist: detectedArtist,
          album: detectedAlbum,
          genre: 'Automotive & V8 Dance / High Speed Hits',
          station: 'INTERCONTINENTAL MOTOR SOUND',
          bitrate: '320 Kbps HQ Lossless',
          isLiveBroadcast: true,
        });
      }

      return res.json({
        status: 'broadcast_active',
        title: 'Intercontinental V8 Speed Anthem',
        artist: 'Motor Sound All-Stars',
        album: 'Disco Master V8 / Edição Especial',
        genre: 'Automotive & V8 Dance / High Speed Hits',
        station: 'INTERCONTINENTAL MOTOR SOUND',
        bitrate: '320 Kbps HQ Lossless',
        isLiveBroadcast: true,
      });
    } catch (e) {
      res.json({
        status: 'standby',
        title: 'Intercontinental V8 Speed Anthem',
        artist: 'Motor Sound All-Stars',
        album: 'Disco Master V8 / Edição Especial',
        genre: 'Automotive & V8 Dance / High Speed Hits',
        station: 'INTERCONTINENTAL MOTOR SOUND',
        bitrate: '320 Kbps HQ Lossless',
        isLiveBroadcast: true,
      });
    }
  });

  // 1. I-CON Copilot & Music AI Chatbot
  app.post('/api/ai/copilot-chat', async (req, res) => {
    try {
      const { message, telemetry, currentTrack } = req.body;
      const prompt = `
O usuário no cockpit LCD do Intercontinental Motor Sound diz: "${message || 'Fale sobre a música atual ou dê uma curiosidade musical'}"

Faixa em reprodução:
- Título: ${currentTrack?.title || 'Intercontinental V8 Anthem'}
- Artista: ${currentTrack?.artist || 'Motor Sound All-Stars'}
- Gênero: ${currentTrack?.genre || 'Euro Dance / Automotive'}
- BPM: ${currentTrack?.bpm || 132}
- Mood: ${currentTrack?.mood || 'Eufórico'}

Telemetria do cockpit LCD:
- RPM: ${telemetry?.rpm ?? 3500}
- Velocidade: ${telemetry?.speed ?? 120} KM/H
- Turbo PSI: ${telemetry?.psi ?? 1.2} bar
- Graves: ${telemetry?.bass ?? 50}% | Médios: ${telemetry?.mid ?? 45}% | Agudos: ${telemetry?.high ?? 60}%
- Nitro: ${telemetry?.isNitro ? 'ATIVO' : 'DESLIGADO'}

Você é o I-CON, o robô assistente e Chatbot Inteligente de Música do player LCD Intercontinental Motor Sound!
Você é uma enciclopédia viva de música, história dos gêneros (Eurodance, Synthwave, Rock, Phonk, Eletrônica, etc.), teoria musical, curiosidades de bandas, produção de áudio, frequências automotivas e recomendações sonoras.

Instruções:
- Seja extremamente inteligente, musical, dinâmico e empático.
- Responda de forma envolvente, rica em conhecimento musical, mantendo tom de co-piloto robótico futurista em português.
- Se o usuário pedir para tocar algo, acelerar, mudar equalização ou pausar, determine em 'suggestedAction'.
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction:
            'Você é o co-piloto I-CON, um chatbot robótico com IA apaixonado por música, produção musical, engenharia de áudio e alta performance automotiva. Responda com conhecimento profundo sobre música, artistas, ritmos e técnicas de som.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reply: {
                type: Type.STRING,
                description: 'Resposta rica e inteligente do robô I-CON sobre música e cockpit.',
              },
              speechText: {
                type: Type.STRING,
                description: 'Versão concisa para leitura em voz alta.',
              },
              suggestedAction: {
                type: Type.STRING,
                description:
                  'Ação recomendada no cockpit: PLAY, PAUSE, NEXT, PREV, ENABLE_NITRO, DISABLE_NITRO, SET_EQ_TURBO, SET_EQ_SPORT, SET_EQ_ECO, SET_EQ_CRUISE, SET_EQ_URBAN, REV_ENGINE, NONE',
              },
              vibe: {
                type: Type.STRING,
                description: 'Humor musical do robô: MUSICOLOGIST, RACING, HYPER, CHILL, ANALYZING, PARTY',
              },
              musicalTrivia: {
                type: Type.STRING,
                description: 'Uma curiosidade rápida sobre música ou sobre o gênero em questão.',
              },
            },
            required: ['reply', 'speechText', 'suggestedAction', 'vibe'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      res.json(parsed);
    } catch (error: any) {
      console.error('Erro no copilot-chat:', error);
      res.status(500).json({
        reply:
          'Sintonizando frequências musicais! O som automotivo e as batidas de alta velocidade mantêm a ressonância perfeita.',
        speechText: 'Sintonizando frequências musicais! Vamos falar de música e acelerar.',
        suggestedAction: 'NONE',
        vibe: 'MUSICOLOGIST',
        musicalTrivia: 'O sintetizador Roland Juno-106 definiu o som clássico do Synthwave e do Eurodance dos anos 80 e 90.',
        error: error.message,
      });
    }
  });

  // 2. Co-Pilot Text-To-Speech (Gemini TTS)
  app.post('/api/ai/copilot-tts', async (req, res) => {
    try {
      const { text, voice } = req.body;
      if (!text) {
        return res.status(400).json({ error: 'Texto não fornecido para síntese' });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: text.slice(0, 300),
                speechMetadata: {
                  style: 'Futuristic enthusiastic automotive robot co-pilot and radio host',
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice || 'Fenrir' },
            },
          },
        },
      });

      const audioBase64 =
        response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

      if (!audioBase64) {
        return res.status(500).json({ error: 'Nenhum áudio gerado pelo modelo TTS' });
      }

      res.json({
        audioBase64,
        mimeType: 'audio/pcm;rate=24000',
        sampleRate: 24000,
      });
    } catch (error: any) {
      console.error('Erro no copilot-tts:', error);
      res.status(500).json({
        error: error.message,
        fallbackToWebSpeech: true,
      });
    }
  });

  // 2.3 Audio Transcription with gemini-3.5-transcribe
  app.post('/api/ai/transcribe', async (req, res) => {
    try {
      const { audioBase64, mimeType, prompt } = req.body;
      if (!audioBase64) {
        return res.status(400).json({ error: 'Nenhum áudio em base64 fornecido para transcrição' });
      }

      // Clean base64 string if it contains data URI prefix
      const cleanBase64 = audioBase64.replace(/^data:[^;]+;base64,/, '');

      const audioPart = {
        inlineData: {
          mimeType: mimeType || 'audio/webm',
          data: cleanBase64,
        },
      };

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-transcribe',
        contents: {
          parts: [
            audioPart,
            { text: prompt || 'Transcreva com fidelidade e exatidão tudo o que foi falado no áudio em português.' },
          ],
        },
      });

      const transcript = response.text || '';
      res.json({
        transcript: transcript.trim(),
        modelUsed: 'gemini-3.5-transcribe',
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Erro no endpoint de transcrição (gemini-3.5-transcribe):', error);
      res.status(500).json({
        error: error.message || 'Falha ao processar a transcrição de áudio',
        modelUsed: 'gemini-3.5-transcribe',
      });
    }
  });

  // 2.5 Voice Command Interpreter with Gemini AI
  app.post('/api/ai/voice-command', async (req, res) => {
    try {
      const { transcript, currentStatus } = req.body;
      if (!transcript) {
        return res.status(400).json({ error: 'Transcrição de voz não fornecida' });
      }

      const prompt = `
O usuário falou o seguinte comando de voz no player/cockpit do Intercontinental Motor Sound:
"${transcript}"

Status atual:
- Reproduzindo áudio: ${currentStatus?.isPlaying ? 'SIM' : 'NÃO'}
- Volume atual: ${currentStatus?.volume ?? 80}%
- Modo Nitro: ${currentStatus?.isNitro ? 'LIGADO' : 'DESLIGADO'}
- Música/Estação atual: "${currentStatus?.currentTrackTitle ?? 'Intercontinental V8 Anthem'}"

Você deve interpretar a intenção do comando de voz e mapear para uma ação precisa do player.
Possíveis ações (action):
- PLAY: tocar música, despausar, dar play, ligar som, ignição
- PAUSE: pausar, parar, stop, desligar motor
- NEXT: próxima música, avançar, pular
- PREV: música anterior, voltar
- VOLUME_UP: aumentar volume, subir som, mais alto
- VOLUME_DOWN: diminuir volume, abaixar som, mais baixo
- SET_VOLUME: definir volume específico (especifique volumeTarget de 0 a 100)
- TOGGLE_NITRO: ligar nitro, acelerar, desligar nitro, overdrive
- PLAY_SEARCH: tocar música ou artista específico (especifique query)
- MUTE: silenciar, mutar
- UNMUTE: desmutar, restaurar som
- GEN_PLAYLIST: criar playlist rápida baseada no pedido (especifique playlistCriteria)
- UNKNOWN: comando não compreendido
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction:
            'Você é o interpretador neural de comandos por voz do cockpit do player Intercontinental Motor Sound. Extraia a intenção com exatidão e responda em JSON estrito.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              action: {
                type: Type.STRING,
                description:
                  'Ação mapeada: PLAY, PAUSE, NEXT, PREV, VOLUME_UP, VOLUME_DOWN, SET_VOLUME, TOGGLE_NITRO, PLAY_SEARCH, MUTE, UNMUTE, GEN_PLAYLIST, UNKNOWN',
              },
              volumeTarget: {
                type: Type.NUMBER,
                description: 'Valor de volume desejado (0 a 100), se aplicável.',
              },
              query: {
                type: Type.STRING,
                description: 'Termo de busca de música ou artista falado pelo usuário.',
              },
              playlistCriteria: {
                type: Type.STRING,
                description: 'Critério ou prompt para playlist pedido na voz.',
              },
              spokenFeedback: {
                type: Type.STRING,
                description: 'Frase curta e carismática em português confirmando a execução da ação pelo robô I-CON.',
              },
            },
            required: ['action', 'spokenFeedback'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      res.json(parsed);
    } catch (error: any) {
      console.error('Erro no voice-command:', error);
      // Fallback local simples para resiliência
      const lower = (req.body.transcript || '').toLowerCase();
      let action = 'UNKNOWN';
      let spokenFeedback = 'Comando recebido pelo cockpit!';
      if (lower.includes('tocar') || lower.includes('play') || lower.includes('iniciar')) {
        action = 'PLAY';
        spokenFeedback = 'Iniciando áudio imediatamente!';
      } else if (lower.includes('pausar') || lower.includes('parar') || lower.includes('stop')) {
        action = 'PAUSE';
        spokenFeedback = 'Áudio pausado.';
      } else if (lower.includes('próxima') || lower.includes('proxima') || lower.includes('pular') || lower.includes('avançar')) {
        action = 'NEXT';
        spokenFeedback = 'Avançando para a próxima faixa!';
      } else if (lower.includes('aumentar') || lower.includes('mais alto')) {
        action = 'VOLUME_UP';
        spokenFeedback = 'Volume aumentado!';
      } else if (lower.includes('diminuir') || lower.includes('mais baixo')) {
        action = 'VOLUME_DOWN';
        spokenFeedback = 'Volume reduzido.';
      }

      res.json({ action, spokenFeedback });
    }
  });

  // 2.6 Dynamic Smart AI Playlist Generator
  app.post('/api/ai/generate-playlist', async (req, res) => {
    try {
      const { mood, activity, genre, prompt: userPrompt, userPreferences } = req.body;

      const aiPrompt = `
Gere uma playlist dinâmica e inteligente para o player de alta performance Intercontinental Motor Sound.

Critérios fornecidos:
- Humor (Mood): ${mood || 'Não especificado'}
- Atividade (Activity): ${activity || 'Não especificado'}
- Gênero Musical: ${genre || 'Não especificado'}
- Prompt livre do usuário: "${userPrompt || 'Playlist de alta octanagem'}"
- Gêneros favoritos no histórico do usuário: ${JSON.stringify(userPreferences?.favoriteGenres || {})}

Retorne um conceito de playlist empolgante, com título atraente, descrição envolvente, uma cor de tema em hex e uma seleção de IDs de faixas compatíveis (use os IDs de catálogo disponíveis: trk-1, trk-2, trk-3, trk-4, trk-5, trk-6, trk-7, trk-8, trk-9, trk-10, trk-11, trk-12). Selecione entre 4 a 7 faixas que melhor se encaixam no tema.
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: aiPrompt,
        config: {
          systemInstruction:
            'Você é um curador musical e DJ inteligente especializado em playlists dinâmicas de alta performance automotiva, corridas e foco.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: {
                type: Type.STRING,
                description: 'Título marcante da playlist',
              },
              description: {
                type: Type.STRING,
                description: 'Descrição imersiva de 1 a 2 frases',
              },
              color: {
                type: Type.STRING,
                description: 'Cor hexadecimal marcante para a capa da playlist (ex: #ffb700, #00f0ff, #ff0055, #39ff14)',
              },
              selectedTrackIds: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Lista de IDs selecionados do catálogo (ex: ["trk-1", "trk-2", "trk-7"])',
              },
              curatorNote: {
                type: Type.STRING,
                description: 'Nota do curador IA sobre por que essa combinação foi montada',
              },
            },
            required: ['title', 'description', 'color', 'selectedTrackIds', 'curatorNote'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      res.json(parsed);
    } catch (error: any) {
      console.error('Erro no generate-playlist:', error);
      res.status(500).json({
        title: 'V8 Pulse Dynamics',
        description: 'Faixas de alta energia e torque selecionadas pelo assistente inteligente.',
        color: '#ffb700',
        selectedTrackIds: ['trk-1', 'trk-2', 'trk-3', 'trk-7', 'trk-11'],
        curatorNote: 'Seleção dinâmica de emergência ativada com sucesso.',
      });
    }
  });

  // 2.7 AI Music Recommendation Assistant
  app.post('/api/ai/recommendations', async (req, res) => {
    try {
      const { userPreferences, currentTrackId } = req.body;

      const prompt = `
Analise o perfil de audição do usuário e sugira recomendações musicais inteligentes:
- Curtidas: ${JSON.stringify(userPreferences?.likedTrackIds || [])}
- Descurtidas: ${JSON.stringify(userPreferences?.dislikedTrackIds || [])}
- Puladas (Skipped): ${JSON.stringify(userPreferences?.skippedTrackIds || [])}
- Gêneros mais ouvidos: ${JSON.stringify(userPreferences?.favoriteGenres || {})}
- Humores preferidos: ${JSON.stringify(userPreferences?.favoriteMoods || {})}
- Faixa atual: ${currentTrackId || 'trk-1'}

Dentre o catálogo disponível com IDs: trk-1, trk-2, trk-3, trk-4, trk-5, trk-6, trk-7, trk-8, trk-9, trk-10, trk-11, trk-12.
Escolha as 4 melhores faixas e dê uma justificativa personalizada para cada uma com base nas preferências e histórico.
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction:
            'Você é o motor de recomendação inteligente do player Intercontinental Motor Sound. Explique o porquê de cada recomendação com base no perfil do usuário.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              recommendations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    trackId: { type: Type.STRING },
                    score: { type: Type.NUMBER },
                    reason: { type: Type.STRING },
                  },
                  required: ['trackId', 'score', 'reason'],
                },
              },
              profileInsight: {
                type: Type.STRING,
                description: 'Resumo de 1 frase do perfil de gosto musical do usuário gerado pela IA.',
              },
            },
            required: ['recommendations', 'profileInsight'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      res.json(parsed);
    } catch (error: any) {
      console.error('Erro no recommendations:', error);
      res.status(500).json({
        recommendations: [
          { trackId: 'trk-2', score: 95, reason: 'Excelente sinergia com o seu gosto por sintetizadores e alta velocidade.' },
          { trackId: 'trk-1', score: 90, reason: 'O hino V8 principal do player.' },
          { trackId: 'trk-11', score: 88, reason: 'Ritmo acelerado perfeito para condução esportiva.' },
        ],
        profileInsight: 'Perfil dinâmico focado em energia de condução e batidas eletrônicas.',
      });
    }
  });

  // 3. AI Dynamic Equalizer & Drive Profile Generator
  app.post('/api/ai/smart-equalizer', async (req, res) => {
    try {
      const { prompt } = req.body;
      const userPrompt = prompt || 'Máxima imersão V8 nasfalto seco';

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Crie uma equalização automotiva acústica precisa para a seguinte condição ou estilo musical: "${userPrompt}".
Calcule os ganhos em dB para Low Shelf (Sub-graves a 320Hz), Peaking (Médios a 1000Hz) e High Shelf (Agudos a 3200Hz).
Também sugira RPM sonoro, pressão de turbo PSI e uma cor temática do painel em rotação de matriz (hue de 0 a 360).`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: {
                type: Type.STRING,
                description: 'Nome curto do perfil de pilotagem acústica em letras maiúsculas',
              },
              description: {
                type: Type.STRING,
                description: 'Descrição rápida de 1 frase do perfil sonoro gerado pela IA',
              },
              lowGain: {
                type: Type.NUMBER,
                description: 'Ganho de graves em dB (-12 a +14)',
              },
              midGain: {
                type: Type.NUMBER,
                description: 'Ganho de médios em dB (-10 a +10)',
              },
              highGain: {
                type: Type.NUMBER,
                description: 'Ganho de agudos em dB (-10 a +12)',
              },
              rpmTarget: {
                type: Type.NUMBER,
                description: 'Alvo de RPM estimado (1500 a 8500)',
              },
              turboPsi: {
                type: Type.NUMBER,
                description: 'Pressão de turbo PSI recomendada (0.4 a 2.6)',
              },
              hue: {
                type: Type.NUMBER,
                description: 'Matiz de cor para os mostradores (0 a 360)',
              },
              aiCommentary: {
                type: Type.STRING,
                description: 'Comentário breve do robô I-CON sobre a nova afinação acústica',
              },
            },
            required: [
              'name',
              'description',
              'lowGain',
              'midGain',
              'highGain',
              'rpmTarget',
              'turboPsi',
              'hue',
              'aiCommentary',
            ],
          },
        },
      });

      const data = JSON.parse(response.text || '{}');
      res.json(data);
    } catch (error: any) {
      console.error('Erro no smart-equalizer:', error);
      res.status(500).json({
        name: 'AI CUSTOM V8',
        description: 'Equalização dinâmica de alta pressão e resposta rápida',
        lowGain: 8,
        midGain: 2,
        highGain: 6,
        rpmTarget: 6200,
        turboPsi: 1.8,
        hue: 45,
        aiCommentary: 'Afinação agressiva ativada! Curva de torque sonoro balanceada.',
      });
    }
  });

  // 4. Live Audio & Telemetry AI Diagnostics Scan
  app.post('/api/ai/telemetry-scan', async (req, res) => {
    try {
      const { bass, mid, high, isPlaying, isNitro, activeStationOrFilm } = req.body;

      const scanPrompt = `
Faça uma leitura de telemetria audiófila rápida do cockpit:
- Status de Reprodução: ${isPlaying ? 'MOTOR EM CURSO' : 'STANDBY'}
- Energia de Sub-Bass: ${bass}%
- Densidade Vocal / Médios: ${mid}%
- Brilho de Agudos: ${high}%
- Modo Nitro: ${isNitro ? 'LIGADO (+40% HP)' : 'DESLIGADO'}
- Fonte de Mídia: ${activeStationOrFilm || 'Rádio Intercontinental Motor Sound'}

Gere um diagnóstico de telemetria futurista de 2 frases e uma recomendação de pilotagem acústica.
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: scanPrompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              diagnostic: {
                type: Type.STRING,
                description: 'Diagnóstico rápido da telemetria de áudio',
              },
              drivingAdvice: {
                type: Type.STRING,
                description: 'Dica de condução sonora para o piloto',
              },
              soundHorsepower: {
                type: Type.NUMBER,
                description: 'Potência calculada em HP sonoro (ex: 450 a 1150)',
              },
              gForceEstimate: {
                type: Type.STRING,
                description: 'Estimativa de força G sonora (ex: 1.4G)',
              },
            },
            required: ['diagnostic', 'drivingAdvice', 'soundHorsepower', 'gForceEstimate'],
          },
        },
      });

      res.json(JSON.parse(response.text || '{}'));
    } catch (error: any) {
      console.error('Erro no telemetry-scan:', error);
      res.json({
        diagnostic: 'Ressonância sonora em 100% de coerência. Frequências no pico ideal.',
        drivingAdvice: 'Mantenha aceleração constante e aproveite a curva de graves.',
        soundHorsepower: 850,
        gForceEstimate: '1.2G',
      });
    }
  });

  // Production vs Development Vite setup
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    // Create Vite server in middleware mode for hot development
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Cockpit Server running on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

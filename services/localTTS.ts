import { pipeline, env } from '@xenova/transformers';
import { PodcastConfig, ScriptLine } from '../types';
import { LANGUAGE_MODELS } from '../constants';
import { 
  createAudioBufferFromFloat32, 
  applyPitchShift, 
  concatenateAudioBuffers, 
  audioBufferToWav 
} from './audioUtils';

// Configure Transformers.js
// We must disable local models check to force fetching from CDN/Hub
env.allowLocalModels = false;
env.useBrowserCache = true;

// Singleton cache
let ttsPipeline: any = null;
let currentModelId: string | null = null;

const getPitchFactor = (voiceName: string): number => {
  switch (voiceName) {
    case 'Deep': return 0.85;
    case 'Deeper': return 0.75;
    case 'Light': return 1.15;
    case 'High': return 1.3;
    default: return 1.0;
  }
};

export const generateLocalPodcastAudio = async (
  script: ScriptLine[],
  config: PodcastConfig,
  onProgress: (msg: string) => void
): Promise<Blob> => {
  
  const modelId = LANGUAGE_MODELS[config.language] || LANGUAGE_MODELS['English'];
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

  // 1. Load Model
  if (!ttsPipeline || currentModelId !== modelId) {
    onProgress(`Downloading ${config.language} model (approx 50MB)...`);
    
    if (ttsPipeline) {
       // @ts-ignore
       await ttsPipeline.dispose?.();
    }

    try {
      // Use quantized models for better performance/memory in browser
      ttsPipeline = await pipeline('text-to-speech', modelId, {
        quantized: true,
        progress_callback: (data: any) => {
            if (data.status === 'progress' && onProgress) {
                // Throttle updates or just show generic message
                if (data.progress) {
                    onProgress(`Loading Model: ${Math.round(data.progress)}%`);
                }
            }
        }
      });
      currentModelId = modelId;
    } catch (err) {
      console.error("Pipeline Error:", err);
      throw new Error(`Failed to load model for ${config.language}. Error: ${err}`);
    }
  }

  const audioBuffers: AudioBuffer[] = [];

  // 2. Synthesize lines
  for (let i = 0; i < script.length; i++) {
    const line = script[i];
    onProgress(`Synthesizing line ${i + 1} of ${script.length}...`);

    try {
      // Inference
      // Returns { audio: Float32Array, sampling_rate: number }
      const output = await ttsPipeline(line.text);
      
      // Convert raw output to AudioBuffer
      const rawBuffer = createAudioBufferFromFloat32(
        audioContext, 
        output.audio, 
        output.sampling_rate
      );

      // Apply Pitch Shift (DSP)
      const isHost1 = line.speakerId === config.speaker1.id;
      const speakerConfig = isHost1 ? config.speaker1 : config.speaker2;
      const pitchFactor = getPitchFactor(speakerConfig.voiceName);

      const processedBuffer = await applyPitchShift(audioContext, rawBuffer, pitchFactor);
      
      audioBuffers.push(processedBuffer);

      // Add Silence Gap (0.5s)
      const silenceFrames = Math.floor(audioContext.sampleRate * 0.5);
      const silenceBuffer = audioContext.createBuffer(1, silenceFrames, audioContext.sampleRate);
      audioBuffers.push(silenceBuffer);

    } catch (err) {
      console.warn(`Error synthesizing line ${i}:`, err);
      // Continue to next line
    }
  }

  if (audioBuffers.length === 0) {
    throw new Error("No audio was generated.");
  }

  onProgress("Finalizing audio...");
  const finalBuffer = concatenateAudioBuffers(audioContext, audioBuffers);
  
  return audioBufferToWav(finalBuffer);
};
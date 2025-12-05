export interface Speaker {
  id: string;
  name: string;
  voiceName: string; // 'Natural' | 'Deep' | 'Deeper' | 'Light' | 'High'
  avatar: string;
}

export interface PodcastConfig {
  sourceMode: 'topic' | 'file';
  topic: string;
  file: {
    name: string;
    type: string;
    content: string;
  } | null;
  language: string;
  duration: 'Short' | 'Medium' | 'Long';
  speaker1: Speaker;
  speaker2: Speaker;
}

export interface ScriptLine {
  speakerId: string;
  speakerName: string;
  text: string;
}

export enum AppState {
  IDLE = 'IDLE',
  GENERATING_SCRIPT = 'GENERATING_SCRIPT',
  SCRIPT_READY = 'SCRIPT_READY',
  GENERATING_AUDIO = 'GENERATING_AUDIO',
  PLAYING = 'PLAYING',
  ERROR = 'ERROR',
}

export interface GeneratedContent {
  script: ScriptLine[];
  audioUrl: string | null;
  audioBlob: Blob | null;
}
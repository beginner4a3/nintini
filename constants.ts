import { Speaker } from './types';

// Using Xenova's quantized versions of MMS models for efficient in-browser inference
export const LANGUAGE_MODELS: { [key: string]: string } = {
  'English': 'Xenova/mms-tts-eng',
  'Hindi': 'Xenova/mms-tts-hin',
  'Tamil': 'Xenova/mms-tts-tam',
  'Telugu': 'Xenova/mms-tts-tel',
  'Malayalam': 'Xenova/mms-tts-mal',
  'Kannada': 'Xenova/mms-tts-kan',
  'Marathi': 'Xenova/mms-tts-mar',
  'Bengali': 'Xenova/mms-tts-ben',
  'Gujarati': 'Xenova/mms-tts-guj'
};

export const SUPPORTED_LANGUAGES = Object.keys(LANGUAGE_MODELS);

// Since MMS models are single-speaker per language, we use DSP pitch shifting
export const AVAILABLE_VOICES = [
  { name: 'Natural', gender: 'Neutral', description: 'Original model output' },
  { name: 'Deep', gender: 'Male', description: 'Pitch lowered (0.85x)' },
  { name: 'Deeper', gender: 'Male', description: 'Pitch lowered heavily (0.75x)' },
  { name: 'Light', gender: 'Female', description: 'Pitch raised (1.1x)' },
  { name: 'High', gender: 'Female', description: 'Pitch raised heavily (1.25x)' },
];

export const DEFAULT_SPEAKERS: { [key: string]: Speaker } = {
  host1: {
    id: 'Host1',
    name: 'Aditi',
    voiceName: 'Natural',
    avatar: 'https://picsum.photos/seed/aditi/200/200',
  },
  host2: {
    id: 'Host2',
    name: 'Arjun',
    voiceName: 'Deep',
    avatar: 'https://picsum.photos/seed/arjun/200/200',
  },
};

export const SAMPLE_TOPICS = [
  "The future of AI in India",
  "A brief history of Hyderabadi Biryani",
  "Why cricket is a religion in India",
  "Mental health awareness for students",
  "Top travel destinations in Kerala"
];
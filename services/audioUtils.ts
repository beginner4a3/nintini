/**
 * Utility to create a WAV header for the raw PCM data.
 */
export const createWavHeader = (
  dataLength: number, 
  sampleRate: number, 
  numChannels: number = 1, 
  bitsPerSample: number = 16 
): Uint8Array => {
  const header = new ArrayBuffer(44);
  const view = new DataView(header);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true);
  view.setUint16(32, numChannels * (bitsPerSample / 8), true);
  view.setUint16(34, bitsPerSample, true);
  writeString(36, 'data');
  view.setUint32(40, dataLength, true);

  return new Uint8Array(header);
};

/**
 * Creates an AudioBuffer from a Float32Array (used by transformers.js output)
 */
export const createAudioBufferFromFloat32 = (
  ctx: AudioContext,
  data: Float32Array,
  sampleRate: number
): AudioBuffer => {
  const buffer = ctx.createBuffer(1, data.length, sampleRate);
  buffer.copyToChannel(data, 0);
  return buffer;
};

/**
 * Concatenates multiple AudioBuffers into a single AudioBuffer.
 */
export const concatenateAudioBuffers = (
  ctx: AudioContext, 
  buffers: AudioBuffer[]
): AudioBuffer => {
  // Calculate total length
  const totalLength = buffers.reduce((acc, b) => acc + b.length, 0);
  
  if (totalLength === 0) {
      return ctx.createBuffer(1, 1, 16000); // Return empty buffer if nothing
  }

  // Create new buffer
  const result = ctx.createBuffer(
    1, // Force mono for consistency
    totalLength, 
    buffers[0].sampleRate
  );

  const data = result.getChannelData(0);
  let offset = 0;

  for (const buffer of buffers) {
    // If input is stereo, we mix down or take left channel. 
    // For simplicity, taking channel 0.
    data.set(buffer.getChannelData(0), offset);
    offset += buffer.length;
  }

  return result;
};

/**
 * Applies pitch shift using a simple playback rate resampling approximation.
 */
export const applyPitchShift = (
  ctx: AudioContext, 
  inputBuffer: AudioBuffer, 
  pitchFactor: number
): Promise<AudioBuffer> => {
  if (pitchFactor === 1.0) return Promise.resolve(inputBuffer);

  const newLength = Math.floor(inputBuffer.length / pitchFactor);
  const outputBuffer = ctx.createBuffer(1, newLength, inputBuffer.sampleRate);
  
  // Offline rendering to resample
  const offlineCtx = new OfflineAudioContext(1, newLength, inputBuffer.sampleRate);
  const source = offlineCtx.createBufferSource();
  source.buffer = inputBuffer;
  source.playbackRate.value = pitchFactor;
  source.connect(offlineCtx.destination);
  source.start();

  return offlineCtx.startRendering();
};

/**
 * Converts an AudioBuffer to a WAV Blob.
 */
export const audioBufferToWav = (buffer: AudioBuffer): Blob => {
  const numChannels = 1;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  
  const data = buffer.getChannelData(0);
  const bufferLength = data.length;
  const byteLength = bufferLength * 2; // 16-bit = 2 bytes per sample
  
  const wavHeader = createWavHeader(byteLength, sampleRate, numChannels, bitDepth);
  const wavBytes = new Uint8Array(wavHeader.length + byteLength);
  
  wavBytes.set(wavHeader);
  
  // Convert float to int16
  const pcmData = new Int16Array(bufferLength);
  for (let i = 0; i < bufferLength; i++) {
    // Clamp
    const s = Math.max(-1, Math.min(1, data[i]));
    pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  
  wavBytes.set(new Uint8Array(pcmData.buffer), wavHeader.length);
  
  return new Blob([wavBytes], { type: 'audio/wav' });
};
// Browser-side conversion of a MediaRecorder clip to a WAV file Twilio can <Play>.
// MediaRecorder gives WebM/Opus (Chrome, Firefox) or MP4/AAC (Safari), and Twilio only
// plays MP3, WAV, AIFF, GSM and u-law, so recorded names are converted before upload.

// Phone audio is 8 kHz, so a higher rate only makes the file bigger.
const PHONE_SAMPLE_RATE = 8000;

async function renderMono(source: AudioBuffer): Promise<AudioBuffer> {
  let offline: OfflineAudioContext;
  try {
    offline = new OfflineAudioContext(1, Math.ceil(source.duration * PHONE_SAMPLE_RATE), PHONE_SAMPLE_RATE);
  } catch {
    // Some browsers refuse rates this low; keep the original rate (still a valid WAV).
    offline = new OfflineAudioContext(1, source.length, source.sampleRate);
  }
  const node = offline.createBufferSource();
  node.buffer = source;
  node.connect(offline.destination); // a 1-channel destination downmixes stereo input
  node.start();
  return offline.startRendering();
}

function encodeWav(buffer: AudioBuffer): Blob {
  const samples = buffer.getChannelData(0);
  const dataSize = samples.length * 2;
  const view = new DataView(new ArrayBuffer(44 + dataSize));
  const writeString = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, buffer.sampleRate, true);
  view.setUint32(28, buffer.sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeString(36, "data");
  view.setUint32(40, dataSize, true);

  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return new Blob([view], { type: "audio/wav" });
}

/** Converts a recorded clip (any format the browser can decode) to 16-bit mono PCM WAV. */
export async function toPhoneWav(recording: Blob): Promise<Blob> {
  const context = new AudioContext();
  try {
    const decoded = await context.decodeAudioData(await recording.arrayBuffer());
    return encodeWav(await renderMono(decoded));
  } finally {
    void context.close();
  }
}

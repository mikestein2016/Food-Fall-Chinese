// Thin wrapper over the Web Speech API SpeechRecognition (zh-CN), replacing
// Construct's SpeechRecognition plugin. Resolves with the best transcript.

export function isRecognitionSupported(): boolean {
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export type RecognitionHandle = { stop: () => void };

/**
 * Listen for one phrase. Calls `onResult` with the recognized transcript, or
 * `onError` if recognition is unsupported/fails. Returns a handle to stop early.
 */
export function recognizeOnce(
  lang: string,
  onResult: (transcript: string) => void,
  onError?: (reason: string) => void,
): RecognitionHandle {
  const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Ctor) {
    onError?.("unsupported");
    return { stop: () => undefined };
  }
  const rec = new Ctor();
  rec.lang = lang;
  rec.interimResults = false;
  rec.maxAlternatives = 1;
  rec.continuous = false;
  rec.onresult = (e) => {
    if (e.results.length > 0) onResult(e.results[0][0].transcript.trim());
  };
  rec.onerror = () => onError?.("error");
  rec.start();
  return { stop: () => rec.abort() };
}

/** Compare a recognized phrase to the expected hanzi, ignoring punctuation. */
export function transcriptMatches(transcript: string, hanzi: string): boolean {
  const clean = (s: string) => s.replace(/[\s。，、！？.,!?]/g, "");
  return clean(transcript) === clean(hanzi);
}

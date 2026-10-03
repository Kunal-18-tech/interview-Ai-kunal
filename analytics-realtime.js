/**
 * InterviewIQ AI — Real-time Speech Analytics Engine
 * Calculates Words Per Minute (WPM), detects filler words, and estimates tone.
 */

export class RealtimeSpeechAnalytics {
  constructor() {
    this.fillerWords = ['uh', 'um', 'like', 'basically', 'you know', 'actually', 'sort of', 'kind of', 'literally', 'i mean'];
    this.startTime = null;
    this.wordHistory = [];
  }

  startSession() {
    this.startTime = Date.now();
    this.wordHistory = [];
  }

  analyze(text) {
    if (!text || !text.trim()) {
      return {
        wpm: 0,
        wpmStatus: 'Optimal',
        fillerCount: 0,
        detectedFillers: [],
        tone: 'Neutral',
        wordCount: 0
      };
    }

    const cleanedText = text.trim().toLowerCase();
    const words = cleanedText.split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;

    // Calculate WPM based on elapsed speaking time
    const elapsedMinutes = Math.max((Date.now() - (this.startTime || Date.now())) / 60000, 0.08);
    const wpm = Math.round(wordCount / elapsedMinutes);

    let wpmStatus = 'Optimal (120–150 WPM)';
    if (wpm < 90) wpmStatus = 'Too Slow (<90 WPM)';
    else if (wpm > 170) wpmStatus = 'Too Fast (>170 WPM)';

    // Detect Filler Words
    const detectedFillers = [];
    let fillerCount = 0;

    this.fillerWords.forEach(filler => {
      const regex = new RegExp(`\\b${filler}\\b`, 'gi');
      const matches = cleanedText.match(regex);
      if (matches) {
        fillerCount += matches.length;
        detectedFillers.push({ word: filler, count: matches.length });
      }
    });

    // Tone Estimation Heuristics
    let tone = 'Confident & Structured';
    if (cleanedText.includes('maybe') || cleanedText.includes('not sure') || cleanedText.includes('i guess')) {
      tone = 'Hesitant / Uncertain';
    } else if (cleanedText.includes('firstly') || cleanedText.includes('because') || cleanedText.includes('for example') || cleanedText.includes('result')) {
      tone = 'Analytical & Structured (STAR)';
    }

    return {
      wpm: wpm,
      wpmStatus: wpmStatus,
      fillerCount: fillerCount,
      detectedFillers: detectedFillers,
      tone: tone,
      wordCount: wordCount
    };
  }
}

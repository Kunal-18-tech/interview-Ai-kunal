/**
 * InterviewIQ AI — Speech & Audio Module
 * Handles Web Speech Recognition (STT), Speech Synthesis (TTS), 
 * MediaRecorder audio preview, and Canvas Audio Equalizer Visualizer.
 */

export class SpeechEngine {
  constructor(onTranscriptCallback, onStateChangeCallback) {
    this.onTranscript = onTranscriptCallback;
    this.onStateChange = onStateChangeCallback;
    
    this.recognition = null;
    this.isListening = false;
    this.synth = window.speechSynthesis;
    
    // Audio Visualizer & Recording
    this.audioContext = null;
    this.analyser = null;
    this.mediaStream = null;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.currentAudioUrl = null;
    this.animationFrameId = null;
    
    this.initRecognition();
  }

  initRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Speech Recognition API is not supported in this browser.");
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    this.recognition.onstart = () => {
      this.isListening = true;
      if (this.onStateChange) this.onStateChange(true);
    };

    this.recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      if (this.onTranscript) {
        this.onTranscript(finalTranscript, interimTranscript);
      }
    };

    this.recognition.onerror = (event) => {
      console.error("Speech Recognition Error:", event.error);
      this.stopListening();
    };

    this.recognition.onend = () => {
      this.isListening = false;
      if (this.onStateChange) this.onStateChange(false);
    };
  }

  // --- Start Listening & Recording Audio ---
  async startListening(canvasElement) {
    if (this.isListening) return;

    try {
      // 1. Microphone Audio Stream for MediaRecorder & Visualizer
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // MediaRecorder Setup
      this.audioChunks = [];
      this.mediaRecorder = new MediaRecorder(this.mediaStream);
      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) this.audioChunks.push(e.data);
      };
      this.mediaRecorder.start();

      // Audio Visualizer Setup
      if (canvasElement) {
        this.setupVisualizer(this.mediaStream, canvasElement);
      }

      // 2. Speech Recognition
      if (this.recognition) {
        this.recognition.start();
      }
    } catch (error) {
      console.error("Microphone access denied or unsupported:", error);
      alert("Microphone access is required for voice answering. Please allow microphone permissions or use text input.");
    }
  }

  // --- Stop Listening & Return Audio Recording URL ---
  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
    
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        this.currentAudioUrl = URL.createObjectURL(audioBlob);
      };
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
    }

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    
    this.isListening = false;
    if (this.onStateChange) this.onStateChange(false);
  }

  // --- Canvas Audio Equalizer Oscilloscope ---
  setupVisualizer(stream, canvas) {
    const ctx = canvas.getContext('2d');
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const source = this.audioContext.createMediaStreamSource(stream);
    this.analyser = this.audioContext.createAnalyser();
    
    this.analyser.fftSize = 64;
    source.connect(this.analyser);
    
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      this.animationFrameId = requestAnimationFrame(draw);
      this.analyser.getByteFrequencyData(dataArray);

      ctx.fillStyle = '#0b0d13';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 1.8;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height * 0.8;
        
        // Gradient color for visualizer bars
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, '#6c8cff');
        gradient.addColorStop(1, '#a78bfa');

        ctx.fillStyle = gradient;
        ctx.borderRadius = 4;
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 3, barHeight);

        x += barWidth;
      }
    };

    draw();
  }

  // --- Text-to-Speech (AI Voice Reader) ---
  speakQuestion(text, onEndCallback) {
    if (!this.synth) return;
    
    this.stopSpeaking(); // Cancel any existing speech

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    // Choose a natural English voice if available
    const voices = this.synth.getVoices();
    const preferredVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha')));
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    if (onEndCallback) {
      utterance.onend = onEndCallback;
    }

    this.synth.speak(utterance);
  }

  stopSpeaking() {
    if (this.synth && this.synth.speaking) {
      this.synth.cancel();
    }
  }
}

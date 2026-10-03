/**
 * InterviewIQ AI — Animated Avatar Module
 * Controls animated SVG AI Interviewer with dynamic states (Speaking, Listening, Thinking)
 * and audio-driven lip sync animation.
 */

export class AIAvatar {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.state = 'idle'; // 'idle', 'speaking', 'listening', 'thinking'
    this.lipSyncInterval = null;
    this.blinkInterval = null;

    if (this.container) {
      this.render();
      this.startBlinking();
    }
  }

  render() {
    this.container.innerHTML = `
      <div class="avatar-wrapper">
        <svg class="avatar-svg" viewBox="0 0 200 200">
          <!-- Background Glow Halo -->
          <circle cx="100" cy="100" r="90" fill="url(#avatarGlow)" />
          
          <!-- Outer Ring -->
          <circle cx="100" cy="100" r="85" fill="none" stroke="#272c40" stroke-width="3" />
          <circle class="avatar-status-ring" cx="100" cy="100" r="85" fill="none" stroke="#6c8cff" stroke-width="3" stroke-dasharray="534" stroke-dashoffset="0" />

          <!-- Futuristic AI Head Base -->
          <rect x="55" y="45" width="90" height="110" rx="45" fill="#1c2030" stroke="#3a4166" stroke-width="2" />
          
          <!-- Visor / Face Screen -->
          <rect x="65" y="65" width="70" height="50" rx="20" fill="#0b0d13" stroke="#272c40" stroke-width="1.5" />

          <!-- Expressive AI Eyes -->
          <g class="avatar-eyes">
            <ellipse class="avatar-eye left-eye" cx="85" cy="85" rx="7" ry="9" fill="#6c8cff" />
            <ellipse class="avatar-eye right-eye" cx="115" cy="85" rx="7" ry="9" fill="#6c8cff" />
            <!-- Eye Highlights -->
            <circle cx="83" cy="82" r="2.5" fill="#ffffff" />
            <circle cx="113" cy="82" r="2.5" fill="#ffffff" />
          </g>

          <!-- Animated Mouth Line -->
          <path id="avatarMouth" d="M 85 102 Q 100 106 115 102" fill="none" stroke="#6c8cff" stroke-width="3" stroke-linecap="round" />

          <!-- Audio Wavelength Indicator in Visor -->
          <line class="visor-wave" x1="75" y1="72" x2="85" y2="72" stroke="rgba(108, 140, 255, 0.3)" stroke-width="2" />
          <line class="visor-wave" x1="115" y1="72" x2="125" y2="72" stroke="rgba(108, 140, 255, 0.3)" stroke-width="2" />

          <defs>
            <radialGradient id="avatarGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#6c8cff" stop-opacity="0.25" />
              <stop offset="100%" stop-color="#0b0d13" stop-opacity="0" />
            </radialGradient>
          </defs>
        </svg>

        <div class="avatar-status-badge" id="avatarStatusBadge">
          <span class="status-dot"></span> <span id="avatarStatusText">AI Interviewer Online</span>
        </div>
      </div>
    `;
  }

  setState(newState) {
    this.state = newState;
    const badge = document.getElementById('avatarStatusBadge');
    const text = document.getElementById('avatarStatusText');
    const mouth = document.getElementById('avatarMouth');

    if (!badge || !text) return;

    badge.className = 'avatar-status-badge ' + newState;

    switch (newState) {
      case 'speaking':
        text.textContent = 'Speaking...';
        this.startLipSync();
        break;
      case 'listening':
        text.textContent = 'Listening to your response...';
        this.stopLipSync();
        if (mouth) mouth.setAttribute('d', 'M 85 104 Q 100 109 115 104');
        break;
      case 'thinking':
        text.textContent = 'Evaluating answer...';
        this.stopLipSync();
        if (mouth) mouth.setAttribute('d', 'M 88 104 L 112 104');
        break;
      default:
        text.textContent = 'AI Interviewer Ready';
        this.stopLipSync();
        if (mouth) mouth.setAttribute('d', 'M 85 102 Q 100 106 115 102');
    }
  }

  startLipSync() {
    this.stopLipSync();
    const mouth = document.getElementById('avatarMouth');
    if (!mouth) return;

    const shapes = [
      'M 85 102 Q 100 112 115 102', // O shape
      'M 85 104 Q 100 107 115 104', // Small open
      'M 85 101 Q 100 115 115 101', // Wide open
      'M 85 103 Q 100 105 115 103'  // Semi closed
    ];

    let step = 0;
    this.lipSyncInterval = setInterval(() => {
      mouth.setAttribute('d', shapes[step % shapes.length]);
      step++;
    }, 140);
  }

  stopLipSync() {
    if (this.lipSyncInterval) {
      clearInterval(this.lipSyncInterval);
      this.lipSyncInterval = null;
    }
  }

  startBlinking() {
    this.blinkInterval = setInterval(() => {
      const leftEye = this.container.querySelector('.left-eye');
      const rightEye = this.container.querySelector('.right-eye');
      if (!leftEye || !rightEye) return;

      leftEye.setAttribute('ry', '1');
      rightEye.setAttribute('ry', '1');

      setTimeout(() => {
        leftEye.setAttribute('ry', '9');
        rightEye.setAttribute('ry', '9');
      }, 150);
    }, 4500);
  }
}

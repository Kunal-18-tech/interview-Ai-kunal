/**
 * InterviewIQ AI Pro — Main Application Controller (Competition Edition)
 * Coordinates SPA navigation, animated AI Avatar studio, real-time speech telemetry,
 * code sandbox, whiteboard canvas, certificate generator, and resume rewriter.
 */

import { StorageManager } from './storage.js';
import { AIEngine } from './ai-engine.js';
import { SpeechEngine } from './speech.js';
import { PdfParser } from './pdf-parser.js';
import { AIAvatar } from './avatar.js';
import { RealtimeSpeechAnalytics } from './analytics-realtime.js';
import { TechnicalCodeSandbox } from './code-editor.js';
import { SystemDesignWhiteboard } from './whiteboard.js';
import { CertificateGenerator } from './certificate.js';

class InterviewIQApp {
  constructor() {
    this.currentView = 'dashboard';
    
    // Active Interview State
    this.interviewConfig = {
      role: 'Full Stack Developer',
      experience: '1–3 years',
      difficulty: 'Medium',
      type: 'Technical'
    };
    
    this.questions = [];
    this.answers = [];
    this.currentQuestionIdx = 0;
    this.timerInterval = null;
    this.secondsElapsed = 0;
    
    this.currentScorecard = null;
    this.speechEngine = null;
    this.aiAvatar = null;
    this.realtimeAnalytics = new RealtimeSpeechAnalytics();
    
    this.codeSandbox = null;
    this.whiteboard = null;
    this.webcamStream = null;

    this.init();
  }

  init() {
    this.renderUserProfile();
    this.updateDashboardStats();
    this.setupNavigation();
    this.setupEventListeners();
    this.initSpeechEngine();
    this.initAvatar();
  }

  // --- Profile & Dashboard Updates ---
  renderUserProfile() {
    // Prefer live session data so the header always reflects the logged-in user
    let session;
    try { session = JSON.parse(sessionStorage.getItem('interviewiq_session') || 'null'); } catch(e) {}
    const profile = session ? {
      name: session.name,
      role: session.role || 'Candidate',
      avatarText: session.avatarText || session.name.substring(0,2).toUpperCase()
    } : StorageManager.getProfile();

    const avatarEl = document.getElementById('userAvatar');
    const nameEl = document.getElementById('userName');
    
    if (avatarEl) avatarEl.textContent = profile.avatarText;
    if (nameEl) nameEl.textContent = profile.name;

    // Mark guest badge
    if (session && session.isGuest) {
      if (nameEl) nameEl.textContent = 'Guest User';
      if (avatarEl) { avatarEl.textContent = 'G'; avatarEl.style.background = 'linear-gradient(135deg,#64748b,#475569)'; }
    }
    
    // Populate settings inputs
    const nameInput = document.getElementById('profileNameInput');
    const roleInput = document.getElementById('profileRoleInput');
    const keyInput = document.getElementById('apiKeyInput');
    
    if (nameInput) nameInput.value = profile.name;
    if (roleInput) roleInput.value = profile.role;
    if (keyInput) keyInput.value = StorageManager.getApiKey();
  }

  updateDashboardStats() {
    const stats = StorageManager.getStats();
    
    const countEl = document.getElementById('statCompletedCount');
    const scoreEl = document.getElementById('statAvgScore');
    const streakEl = document.getElementById('statStreakDays');
    
    if (countEl) countEl.textContent = stats.completedCount;
    if (scoreEl) scoreEl.textContent = stats.avgScore + '%';
    if (streakEl) streakEl.textContent = stats.streakDays + ' Days';
  }

  // --- SPA Navigation ---
  setupNavigation() {
    const navButtons = document.querySelectorAll('[data-target-view]');
    navButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetView = e.currentTarget.getAttribute('data-target-view');
        this.navigateTo(targetView);
      });
    });
  }

  navigateTo(viewId) {
    // Hide all view sections
    document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
    
    // Show target section
    const targetSection = document.getElementById(`view-${viewId}`);
    if (targetSection) {
      targetSection.classList.add('active');
      this.currentView = viewId;
    }

    // Update active nav button
    document.querySelectorAll('.nav-btn').forEach(btn => {
      if (btn.getAttribute('data-target-view') === viewId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // View specific triggers
    if (viewId === 'dashboard') {
      this.updateDashboardStats();
    } else if (viewId === 'analytics') {
      this.renderAnalyticsHistory();
    }
  }

  // --- Avatar & Speech Engine Initialization ---
  initAvatar() {
    this.aiAvatar = new AIAvatar('aiAvatarContainer');
  }

  initSpeechEngine() {
    const answerInput = document.getElementById('answerTextInput');
    const micBtn = document.getElementById('micRecordBtn');

    this.speechEngine = new SpeechEngine(
      (finalText, interimText) => {
        if (answerInput) {
          answerInput.value = (answerInput.value + ' ' + finalText).trim();
          this.updateWordCountAndTelemetry();
        }
      },
      (isListening) => {
        if (micBtn) {
          if (isListening) {
            micBtn.classList.add('recording');
            micBtn.innerHTML = '🛑 Stop';
            if (this.aiAvatar) this.aiAvatar.setState('listening');
          } else {
            micBtn.classList.remove('recording');
            micBtn.innerHTML = '🎙️ Speak';
            if (this.aiAvatar) this.aiAvatar.setState('idle');
          }
        }
      }
    );
  }

  // --- Event Listeners Binding ---
  setupEventListeners() {
    // Start New Interview Button
    const startNewBtn = document.getElementById('startNewInterviewBtn');
    if (startNewBtn) {
      startNewBtn.addEventListener('click', () => this.navigateTo('setup'));
    }

    // Setup Option Card Selectors
    this.bindOptionSelectors();

    // Start Question Generation
    const generateBtn = document.getElementById('generateQuestionsBtn');
    if (generateBtn) {
      generateBtn.addEventListener('click', () => this.startInterviewSession());
    }

    // Voice Mic Toggle Button
    const micBtn = document.getElementById('micRecordBtn');
    if (micBtn) {
      micBtn.addEventListener('click', () => {
        if (this.speechEngine.isListening) {
          this.speechEngine.stopListening();
          this.showAudioPreview();
        } else {
          this.realtimeAnalytics.startSession();
          const canvas = document.getElementById('visualizerCanvas');
          this.speechEngine.startListening(canvas);
        }
      });
    }

    // Text-to-Speech Question Reader
    const ttsBtn = document.getElementById('ttsQuestionBtn');
    if (ttsBtn) {
      ttsBtn.addEventListener('click', () => {
        const qText = this.questions[this.currentQuestionIdx];
        if (qText) {
          if (this.aiAvatar) this.aiAvatar.setState('speaking');
          this.speechEngine.speakQuestion(qText, () => {
            if (this.aiAvatar) this.aiAvatar.setState('idle');
          });
        }
      });
    }

    // Candidate Webcam Toggle
    const webcamBtn = document.getElementById('toggleWebcamBtn');
    if (webcamBtn) {
      webcamBtn.addEventListener('click', () => this.toggleWebcam());
    }

    // Answer Input Word Counter & Telemetry
    const answerInput = document.getElementById('answerTextInput');
    if (answerInput) {
      answerInput.addEventListener('input', () => this.updateWordCountAndTelemetry());
    }

    // Next / Previous Question Navigation
    const nextBtn = document.getElementById('nextQuestionBtn');
    const prevBtn = document.getElementById('prevQuestionBtn');
    
    if (nextBtn) nextBtn.addEventListener('click', () => this.handleNextQuestion());
    if (prevBtn) prevBtn.addEventListener('click', () => this.handlePrevQuestion());

    // Submit Complete Interview
    const submitBtn = document.getElementById('submitInterviewBtn');
    if (submitBtn) {
      submitBtn.addEventListener('click', () => this.submitInterviewForEvaluation());
    }

    // Print Official Certificate
    const printCertBtn = document.getElementById('printCertBtn');
    if (printCertBtn) {
      printCertBtn.addEventListener('click', () => {
        if (this.currentScorecard) {
          CertificateGenerator.printCertificate(
            {
              displayDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
              config: this.interviewConfig,
              scorecard: this.currentScorecard
            },
            StorageManager.getProfile()
          );
        }
      });
    }

    // Resume Matcher Handlers
    this.setupResumeMatcher();

    // Settings Form & Modal Handlers
    this.setupSettingsHandlers();
  }

  bindOptionSelectors() {
    const bindGroup = (groupId, configKey) => {
      const container = document.getElementById(groupId);
      if (!container) return;
      
      container.addEventListener('click', (e) => {
        const btn = e.target.closest('.option-btn');
        if (!btn) return;

        container.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.interviewConfig[configKey] = btn.getAttribute('data-value');
      });
    };

    bindGroup('experienceGroup', 'experience');
    bindGroup('difficultyGroup', 'difficulty');
    bindGroup('typeGroup', 'type');
  }

  // --- WebCam Feed Control ---
  async toggleWebcam() {
    const video = document.getElementById('webcamVideo');
    const placeholder = document.getElementById('webcamPlaceholder');

    if (this.webcamStream) {
      // Turn off
      this.webcamStream.getTracks().forEach(t => t.stop());
      this.webcamStream = null;
      if (video) video.style.display = 'none';
      if (placeholder) placeholder.style.display = 'flex';
      this.showToast("Webcam feed stopped.");
    } else {
      // Turn on
      try {
        this.webcamStream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (video) {
          video.srcObject = this.webcamStream;
          video.style.display = 'block';
        }
        if (placeholder) placeholder.style.display = 'none';
        this.showToast("Webcam feed active!");
      } catch (err) {
        alert("Unable to access camera: " + err.message);
      }
    }
  }

  // --- Interview Session Flow ---
  async startInterviewSession() {
    const roleInput = document.getElementById('customRoleInput');
    if (roleInput && roleInput.value.trim()) {
      this.interviewConfig.role = roleInput.value.trim();
    }

    this.showLoadingModal("AI Avatar Studio is generating interview questions...");

    try {
      if (this.interviewConfig.type === 'Panel Mode') {
        const panelData = AIEngine.generatePanelQuestions(this.interviewConfig);
        this.questions = panelData.map(p => `[${p.persona}]: ${p.question}`);
      } else {
        this.questions = await AIEngine.generateQuestions(this.interviewConfig);
      }

      this.answers = new Array(this.questions.length).fill('');
      this.currentQuestionIdx = 0;
      this.secondsElapsed = 0;

      this.hideLoadingModal();
      this.navigateTo('room');
      this.setupRoomSandboxAndWhiteboard();
      this.renderQuestion();
      this.startTimer();
      
      // Auto speak first question with AI Avatar
      if (this.aiAvatar) this.aiAvatar.setState('speaking');
      this.speechEngine.speakQuestion(this.questions[0], () => {
        if (this.aiAvatar) this.aiAvatar.setState('idle');
      });
    } catch (error) {
      this.hideLoadingModal();
      alert("Error generating questions: " + error.message);
    }
  }

  setupRoomSandboxAndWhiteboard() {
    const codeContainer = document.getElementById('codeSandboxContainer');
    const wbContainer = document.getElementById('whiteboardContainer');

    if (codeContainer) codeContainer.innerHTML = '';
    if (wbContainer) wbContainer.innerHTML = '';

    if (this.interviewConfig.type === 'Technical' || this.interviewConfig.type === 'Panel Mode') {
      this.codeSandbox = new TechnicalCodeSandbox('codeSandboxContainer');
    } else if (this.interviewConfig.type === 'Case Study') {
      this.whiteboard = new SystemDesignWhiteboard('whiteboardContainer');
    }
  }

  renderQuestion() {
    const total = this.questions.length;
    const currentNum = this.currentQuestionIdx + 1;

    document.getElementById('qCounterLabel').textContent = `Question ${currentNum} of ${total}`;
    document.getElementById('qTextDisplay').textContent = this.questions[this.currentQuestionIdx];
    
    // Set current answer in textarea
    const answerInput = document.getElementById('answerTextInput');
    answerInput.value = this.answers[this.currentQuestionIdx] || '';
    this.updateWordCountAndTelemetry();

    // Update Sidebar Navigation
    const qListContainer = document.getElementById('qListNav');
    if (qListContainer) {
      qListContainer.innerHTML = this.questions.map((q, idx) => `
        <div class="q-nav-item ${idx === this.currentQuestionIdx ? 'active' : ''} ${this.answers[idx] ? 'answered' : ''}" data-qidx="${idx}">
          <span>Q${idx + 1}. ${q.substring(0, 24)}...</span>
          <span>${this.answers[idx] ? '✓' : '•'}</span>
        </div>
      `).join('');

      qListContainer.querySelectorAll('.q-nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
          this.saveCurrentAnswer();
          const targetIdx = parseInt(e.currentTarget.getAttribute('data-qidx'), 10);
          this.currentQuestionIdx = targetIdx;
          this.renderQuestion();
        });
      });
    }

    // Toggle Next/Submit buttons visibility
    const nextBtn = document.getElementById('nextQuestionBtn');
    const submitBtn = document.getElementById('submitInterviewBtn');

    if (currentNum === total) {
      nextBtn.style.display = 'none';
      submitBtn.style.display = 'inline-flex';
    } else {
      nextBtn.style.display = 'inline-flex';
      submitBtn.style.display = 'none';
    }
  }

  saveCurrentAnswer() {
    const answerInput = document.getElementById('answerTextInput');
    let ans = answerInput ? answerInput.value.trim() : '';

    // Append code sandbox content if present
    if (this.codeSandbox) {
      const code = this.codeSandbox.getCode();
      if (code && code.trim()) ans += `\n[Submitted Code Solution]:\n${code}`;
    }

    this.answers[this.currentQuestionIdx] = ans;
  }

  handleNextQuestion() {
    this.saveCurrentAnswer();
    if (this.currentQuestionIdx < this.questions.length - 1) {
      this.currentQuestionIdx++;
      this.renderQuestion();
      if (this.aiAvatar) this.aiAvatar.setState('speaking');
      this.speechEngine.speakQuestion(this.questions[this.currentQuestionIdx], () => {
        if (this.aiAvatar) this.aiAvatar.setState('idle');
      });
    }
  }

  handlePrevQuestion() {
    this.saveCurrentAnswer();
    if (this.currentQuestionIdx > 0) {
      this.currentQuestionIdx--;
      this.renderQuestion();
    }
  }

  updateWordCountAndTelemetry() {
    const input = document.getElementById('answerTextInput');
    const countEl = document.getElementById('wordCountDisplay');
    
    if (input) {
      const text = input.value.trim();
      const words = text ? text.split(/\s+/).length : 0;
      if (countEl) countEl.textContent = `${words} Words`;

      // Telemetry Analytics Update
      const telemetry = this.realtimeAnalytics.analyze(text);
      
      const wpmEl = document.getElementById('wpmValueDisplay');
      const fillersEl = document.getElementById('fillersValueDisplay');
      const toneEl = document.getElementById('toneValueDisplay');

      if (wpmEl) wpmEl.textContent = `${telemetry.wpm} WPM (${telemetry.wpmStatus})`;
      if (fillersEl) fillersEl.textContent = `${telemetry.fillerCount} Detected`;
      if (toneEl) toneEl.textContent = telemetry.tone;
    }
  }

  showAudioPreview() {
    const previewContainer = document.getElementById('audioPreviewContainer');
    if (previewContainer && this.speechEngine.currentAudioUrl) {
      previewContainer.innerHTML = `
        <div class="audio-preview-player">
          <span>🎧 Playback Voice Recording:</span>
          <audio controls src="${this.speechEngine.currentAudioUrl}"></audio>
        </div>
      `;
    }
  }

  startTimer() {
    clearInterval(this.timerInterval);
    const timerDisplay = document.getElementById('timerDisplay');
    
    this.timerInterval = setInterval(() => {
      this.secondsElapsed++;
      const mins = Math.floor(this.secondsElapsed / 60).toString().padStart(2, '0');
      const secs = (this.secondsElapsed % 60).toString().padStart(2, '0');
      if (timerDisplay) timerDisplay.textContent = `${mins}:${secs}`;
    }, 1000);
  }

  stopTimer() {
    clearInterval(this.timerInterval);
  }

  // --- Submit & AI Evaluation ---
  async submitInterviewForEvaluation() {
    this.saveCurrentAnswer();
    this.stopTimer();

    if (this.aiAvatar) this.aiAvatar.setState('thinking');
    this.showLoadingModal("Evaluating interview transcript with AI metrics...");

    try {
      const scorecard = await AIEngine.evaluateInterview(
        this.interviewConfig,
        this.questions,
        this.answers
      );

      this.currentScorecard = scorecard;
      
      // Save session in localStorage history
      StorageManager.saveSession({
        config: this.interviewConfig,
        questions: this.questions,
        answers: this.answers,
        scorecard: scorecard
      });

      this.hideLoadingModal();
      if (this.aiAvatar) this.aiAvatar.setState('idle');
      this.renderScorecard(scorecard);
      this.navigateTo('scorecard');
    } catch (error) {
      this.hideLoadingModal();
      if (this.aiAvatar) this.aiAvatar.setState('idle');
      alert("Evaluation failed: " + error.message);
    }
  }

  // --- Render AI Scorecard ---
  renderScorecard(scorecard) {
    // Overall Score Dial Animation
    const dialNumber = document.getElementById('overallScoreNumber');
    const dialProgress = document.getElementById('dialProgressSvg');
    
    if (dialNumber) dialNumber.textContent = scorecard.overallScore;
    if (dialProgress) {
      const offset = 502 - (502 * (scorecard.overallScore / 100));
      setTimeout(() => {
        dialProgress.style.strokeDashoffset = offset;
      }, 100);
    }

    // Category Metric Bars
    const scores = scorecard.scores;
    const metricMapping = [
      { id: 'techScoreFill', labelId: 'techScoreVal', key: 'technical' },
      { id: 'commScoreFill', labelId: 'commScoreVal', key: 'communication' },
      { id: 'confScoreFill', labelId: 'confScoreVal', key: 'confidence' },
      { id: 'gramScoreFill', labelId: 'gramScoreVal', key: 'grammar' },
      { id: 'clarScoreFill', labelId: 'clarScoreVal', key: 'clarity' },
      { id: 'probScoreFill', labelId: 'probScoreVal', key: 'problemSolving' }
    ];

    metricMapping.forEach(item => {
      const val = scores[item.key] || 0;
      const fillEl = document.getElementById(item.id);
      const labelEl = document.getElementById(item.labelId);
      
      if (labelEl) labelEl.textContent = val + '/100';
      if (fillEl) {
        setTimeout(() => {
          fillEl.style.width = val + '%';
        }, 200);
      }
    });

    // Summary text
    const summaryEl = document.getElementById('scorecardSummary');
    if (summaryEl) summaryEl.textContent = scorecard.summary;

    // Strengths
    const strengthsList = document.getElementById('strengthsList');
    if (strengthsList) {
      strengthsList.innerHTML = scorecard.strengths.map(s => `
        <li><span style="color: var(--success);">✓</span> ${s}</li>
      `).join('');
    }

    // Improvements
    const improvementsList = document.getElementById('improvementsList');
    if (improvementsList) {
      improvementsList.innerHTML = scorecard.improvements.map(i => `
        <li><span style="color: var(--warning);">⚡</span> ${i}</li>
      `).join('');
    }

    // Detailed Per-Question Breakdown
    const breakdownContainer = document.getElementById('questionBreakdownList');
    if (breakdownContainer && scorecard.questionFeedback) {
      breakdownContainer.innerHTML = scorecard.questionFeedback.map((fb, idx) => `
        <div class="question-breakdown-card">
          <div class="qb-header">
            <h4>Q${idx + 1}: ${fb.question}</h4>
          </div>
          <p style="font-size: 0.9rem; color: var(--text-main); margin-bottom: 0.5rem;">
            <strong>Your Response:</strong> ${fb.candidateAnswer || '<i>No response provided.</i>'}
          </p>
          <div class="qb-model-answer">
            <strong>💡 AI Model Answer & Strategy:</strong><br/>
            ${fb.modelAnswer}
          </div>
          <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.5rem;">
            <strong>Feedback:</strong> ${fb.feedback}
          </p>
        </div>
      `).join('');
    }
  }

  // --- Resume ↔ JD Matcher Module & AI Bullet Rewriter ---
  setupResumeMatcher() {
    const fileInput = document.getElementById('pdfFileInput');
    const dropZone = document.getElementById('pdfDropZone');
    const resumeTextarea = document.getElementById('resumeTextInput');
    const matchBtn = document.getElementById('runJdMatchBtn');
    const rewriteBtn = document.getElementById('aiRewriteBulletsBtn');

    if (dropZone && fileInput) {
      dropZone.addEventListener('click', () => fileInput.click());
      
      fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
          try {
            this.showLoadingModal("Extracting text from PDF resume...");
            const text = await PdfParser.extractTextFromPdf(file);
            if (resumeTextarea) resumeTextarea.value = text;
            this.hideLoadingModal();
            this.showToast("PDF parsed successfully!");
          } catch (err) {
            this.hideLoadingModal();
            alert(err.message);
          }
        }
      });
    }

    if (matchBtn) {
      matchBtn.addEventListener('click', async () => {
        const resumeText = document.getElementById('resumeTextInput').value;
        const jdText = document.getElementById('jdTextInput').value;

        if (!resumeText.trim() || !jdText.trim()) {
          alert("Please provide both Resume text/PDF and Job Description text.");
          return;
        }

        this.showLoadingModal("Analyzing Resume against Job Description...");
        
        try {
          const matchResult = await AIEngine.matchResumeJD(resumeText, jdText);
          this.hideLoadingModal();
          this.renderJdMatchResult(matchResult);
        } catch (e) {
          this.hideLoadingModal();
          alert("Matching failed: " + e.message);
        }
      });
    }

    if (rewriteBtn) {
      rewriteBtn.addEventListener('click', async () => {
        const outputBox = document.getElementById('aiBulletsOutputBox');
        this.showLoadingModal("AI is rewriting optimized resume bullet points...");

        try {
          const bullets = await AIEngine.rewriteResumeBulletPoints(['Docker', 'AWS Cloud', 'Microservices'], 'Full Stack Developer');
          this.hideLoadingModal();
          if (outputBox) {
            outputBox.style.display = 'block';
            outputBox.innerHTML = `
              <h5 style="margin-bottom: 0.5rem; color: var(--primary);">✨ AI Generated Resume Bullet Points:</h5>
              <ul style="padding-left: 1.2rem; font-size: 0.9rem;">
                ${bullets.map(b => `<li style="margin-bottom: 0.4rem;">${b}</li>`).join('')}
              </ul>
            `;
          }
        } catch (e) {
          this.hideLoadingModal();
          alert("Bullet generation failed.");
        }
      });
    }
  }

  renderJdMatchResult(result) {
    const resultCard = document.getElementById('jdMatchResultCard');
    if (!resultCard) return;

    resultCard.style.display = 'block';
    resultCard.scrollIntoView({ behavior: 'smooth' });

    document.getElementById('jdMatchScoreDisplay').textContent = result.matchPercentage + '%';
    document.getElementById('jdMatchSummary').textContent = result.summary;

    const matchedContainer = document.getElementById('matchedSkillsBadges');
    if (matchedContainer) {
      matchedContainer.innerHTML = result.matchedSkills.map(s => `
        <span class="badge badge-success">✓ ${s}</span>
      `).join('');
    }

    const missingTechContainer = document.getElementById('missingTechBadges');
    if (missingTechContainer) {
      missingTechContainer.innerHTML = result.missingTechnicalSkills.map(s => `
        <span class="badge badge-error">✕ ${s}</span>
      `).join('');
    }

    const atsList = document.getElementById('atsSuggestionsList');
    if (atsList) {
      atsList.innerHTML = result.atsSuggestions.map(tip => `
        <li>📌 ${tip}</li>
      `).join('');
    }
  }

  // --- Analytics & History Module ---
  renderAnalyticsHistory() {
    const history = StorageManager.getHistory();
    const historyListContainer = document.getElementById('historySessionsList');
    
    if (!historyListContainer) return;

    if (history.length === 0) {
      historyListContainer.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: var(--text-muted);">
          <p>No completed interviews found. Start your first mock interview to track progress!</p>
        </div>
      `;
      return;
    }

    historyListContainer.innerHTML = history.map(session => `
      <div class="card" style="margin-bottom: 1rem;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h4 style="margin-bottom: 0.25rem;">${session.config.role} (${session.config.type})</h4>
            <p style="font-size: 0.82rem; color: var(--text-muted);">${session.displayDate} • Difficulty: ${session.config.difficulty}</p>
          </div>
          <div style="display: flex; align-items: center; gap: 1rem;">
            <span style="font-family: var(--font-heading); font-size: 1.4rem; font-weight: 700; color: var(--primary);">
              ${session.scorecard?.overallScore || 0}%
            </span>
            <button class="btn btn-sm btn-secondary view-session-btn" data-session-id="${session.id}">Review Report</button>
          </div>
        </div>
      </div>
    `).join('');

    historyListContainer.querySelectorAll('.view-session-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-session-id');
        const session = history.find(s => s.id === id);
        if (session && session.scorecard) {
          this.renderScorecard(session.scorecard);
          this.navigateTo('scorecard');
        }
      });
    });
  }

  // --- Settings & Modal Controls ---
  setupSettingsHandlers() {
    const saveProfileBtn = document.getElementById('saveProfileBtn');
    if (saveProfileBtn) {
      saveProfileBtn.addEventListener('click', () => {
        const name = document.getElementById('profileNameInput').value;
        const role = document.getElementById('profileRoleInput').value;
        const key = document.getElementById('apiKeyInput').value;

        StorageManager.saveProfile({ name, role });
        StorageManager.saveApiKey(key);

        this.renderUserProfile();
        this.showToast("Settings saved successfully!");
      });
    }

    const openSettingsBtn = document.getElementById('openSettingsBtn');
    const closeSettingsBtn = document.getElementById('closeSettingsBtn');
    const settingsModal = document.getElementById('settingsModal');

    if (openSettingsBtn && settingsModal) {
      openSettingsBtn.addEventListener('click', () => settingsModal.classList.add('active'));
    }
    if (closeSettingsBtn && settingsModal) {
      closeSettingsBtn.addEventListener('click', () => settingsModal.classList.remove('active'));
    }
  }

  // --- Modal & Toast Helpers ---
  showLoadingModal(message) {
    const modal = document.getElementById('loadingModal');
    const label = document.getElementById('loadingText');
    if (label) label.textContent = message;
    if (modal) modal.classList.add('active');
  }

  hideLoadingModal() {
    const modal = document.getElementById('loadingModal');
    if (modal) modal.classList.remove('active');
  }

  showToast(msg) {
    const container = document.getElementById('toastContainer') || document.body;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>✨</span> ${msg}`;
    container.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }
}

// Instantiate app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new InterviewIQApp();
});

// Global logout handler — called by inline onclick in index.html
window.handleLogout = function() {
  try {
    // Sync any history/profile changes back to the users DB before leaving
    StorageManager.syncUserData();
  } catch(e) {}
  sessionStorage.removeItem('interviewiq_session');
  window.location.replace('login.html');
};

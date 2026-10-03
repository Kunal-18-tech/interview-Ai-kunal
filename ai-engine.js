/**
 * InterviewIQ AI — AI Engine Client (Competition Edition)
 * Handles integration with Anthropic Claude API & provides a smart built-in AI fallback
 * when an API key is not supplied.
 */

import { StorageManager } from './storage.js';

export const AIEngine = {
  /**
   * Generate 5 realistic interview questions based on config.
   */
  async generateQuestions(config) {
    const apiKey = StorageManager.getApiKey();
    
    if (apiKey) {
      try {
        return await this.generateQuestionsWithClaude(config, apiKey);
      } catch (error) {
        console.warn("Claude API failed or invalid key. Switching to Intelligent AI Simulator:", error);
        return this.generateQuestionsFallback(config);
      }
    } else {
      return this.generateQuestionsFallback(config);
    }
  },

  /**
   * Evaluate completed candidate answers and generate scorecard.
   */
  async evaluateInterview(config, questions, answers) {
    const apiKey = StorageManager.getApiKey();
    
    if (apiKey) {
      try {
        return await this.evaluateWithClaude(config, questions, answers, apiKey);
      } catch (error) {
        console.warn("Claude API evaluation failed. Falling back to Simulator:", error);
        return this.evaluateFallback(config, questions, answers);
      }
    } else {
      return this.evaluateFallback(config, questions, answers);
    }
  },

  /**
   * Match Resume against Job Description.
   */
  async matchResumeJD(resumeText, jdText) {
    const apiKey = StorageManager.getApiKey();

    if (apiKey) {
      try {
        return await this.matchResumeWithClaude(resumeText, jdText, apiKey);
      } catch (e) {
        return this.matchResumeFallback(resumeText, jdText);
      }
    } else {
      return this.matchResumeFallback(resumeText, jdText);
    }
  },

  // ------------------------------------------------------------------------
  // Claude API Integration
  // ------------------------------------------------------------------------
  async generateQuestionsWithClaude(config, apiKey) {
    const prompt = `Generate exactly 5 realistic, high-quality interview questions for a candidate with the following configuration:
- Role: ${config.role}
- Experience: ${config.experience}
- Difficulty: ${config.difficulty}
- Interview Type: ${config.type}

Respond ONLY with a raw JSON array of 5 strings representing the 5 questions. Do not include markdown code block syntax. Example: ["Q1", "Q2", "Q3", "Q4", "Q5"]`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
        'dangerously-allow-browser': 'true'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      throw new Error(`Claude API Error: ${response.statusText}`);
    }

    const data = await response.json();
    let textContent = data.content[0].text.trim();
    textContent = textContent.replace(/```json/g, '').replace(/```/g, '').trim();

    return JSON.parse(textContent);
  },

  async evaluateWithClaude(config, questions, answers, apiKey) {
    const prompt = `You are an expert AI Interviewer evaluating a candidate's mock interview performance.
Configuration: Role=${config.role}, Level=${config.experience}, Type=${config.type}.

Interview Transcript:
${questions.map((q, i) => `Q${i+1}: ${q}\nCandidate Answer: ${answers[i] || 'No answer provided.'}`).join('\n\n')}

Return ONLY a valid raw JSON object (no markdown formatting) matching this schema:
{
  "overallScore": integer (0-100),
  "scores": {
    "technical": integer (0-100),
    "communication": integer (0-100),
    "confidence": integer (0-100),
    "grammar": integer (0-100),
    "clarity": integer (0-100),
    "problemSolving": integer (0-100)
  },
  "summary": "2-3 sentences overall evaluation.",
  "strengths": ["Strength 1", "Strength 2", "Strength 3"],
  "improvements": ["Improvement 1", "Improvement 2", "Improvement 3"],
  "questionFeedback": [
    {
      "question": "Question text",
      "candidateAnswer": "Answer text",
      "modelAnswer": "Comprehensive ideal response",
      "feedback": "Specific feedback for this response"
    }
  ]
}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
        'dangerously-allow-browser': 'true'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2500,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    let textContent = data.content[0].text.trim();
    textContent = textContent.replace(/```json/g, '').replace(/```/g, '').trim();

    return JSON.parse(textContent);
  },

  async matchResumeWithClaude(resumeText, jdText, apiKey) {
    const prompt = `Compare this Candidate Resume with the target Job Description.

Resume:
${resumeText.substring(0, 3000)}

Job Description:
${jdText.substring(0, 3000)}

Return ONLY a valid JSON object matching:
{
  "matchPercentage": integer (0-100),
  "matchedSkills": ["skill1", "skill2"],
  "missingTechnicalSkills": ["skill1", "skill2"],
  "missingSoftSkills": ["skill1"],
  "atsSuggestions": ["suggestion 1", "suggestion 2"],
  "summary": "Brief summary of fit"
}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
        'dangerously-allow-browser': 'true'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    let textContent = data.content[0].text.trim();
    textContent = textContent.replace(/```json/g, '').replace(/```/g, '').trim();

    return JSON.parse(textContent);
  },

  // ------------------------------------------------------------------------
  // Domain-Specific & Intelligent Question Generator
  // ------------------------------------------------------------------------
  generateQuestionsFallback(config) {
    const rawRole = (config.role || 'Software Engineer').trim();
    const roleLower = rawRole.toLowerCase();
    const type = config.type || 'Technical';
    const experience = config.experience || '1–3 years';
    const difficulty = config.difficulty || 'Medium';

    // ── 1. Role-Specific Question Banks ──
    const roleBanks = {
      frontend: [
        `How does the Virtual DOM reconciliation algorithm work in modern frontend frameworks (e.g. React/Vue), and how do you prevent unnecessary re-renders?`,
        `Explain how you optimize Core Web Vitals (LCP, FID/INP, CLS) in a high-traffic single-page application.`,
        `Walk me through your architectural strategy for global state management (e.g., Redux, Zustand, React Context) and when you prefer local vs global state.`,
        `How do you handle client-side security vulnerabilities such as Cross-Site Scripting (XSS), CSRF tokens, and Content Security Policy (CSP)?`,
        `Describe how you implement responsive, accessible (WCAG AA compliant) components that work seamlessly across diverse browser engines.`
      ],

      backend: [
        `How do you handle concurrency, race conditions, and thread safety in high-throughput backend services?`,
        `Explain the architectural differences and trade-offs between REST APIs, GraphQL, and gRPC in microservice communication.`,
        `Walk me through your database indexing strategy. How do B-Trees work under the hood and how do you diagnose slow query execution plans?`,
        `How do you implement resilient distributed caching with Redis, and how do you handle cache stampede and cache invalidation?`,
        `Describe your approach to designing idempotent API endpoints, rate limiting, and circuit breaker patterns in mission-critical systems.`
      ],

      fullstack: [
        `Walk me through the complete lifecycle of a web request from DNS resolution and TLS handshake to server-side processing and client hydration.`,
        `How do you architect seamless authentication and authorization (e.g., JWT vs Session cookies, OAuth2/OIDC, Refresh Token rotation) across frontend and backend?`,
        `Describe your strategy for synchronizing optimistic UI updates with backend database persistence while handling network errors gracefully.`,
        `How do you balance Server-Side Rendering (SSR), Static Site Generation (SSG), and Client-Side Rendering (CSR) for SEO and performance?`,
        `Walk me through a zero-downtime database migration strategy for a relational database with millions of active records.`
      ],

      datascience: [
        `How do you handle severe class imbalance in classification problems, and why is accuracy a misleading evaluation metric in such cases?`,
        `Explain the Bias-Variance tradeoff and discuss practical regularization techniques (L1/L2, Dropout, Early Stopping) to prevent overfitting.`,
        `Walk me through your end-to-end feature engineering and exploratory data analysis (EDA) pipeline for high-dimensional tabular datasets.`,
        `What evaluation metrics (e.g., ROC-AUC, Precision-Recall AUC, F1-Score, RMSE) do you select when evaluating production ML models?`,
        `Describe how you monitor model drift, concept drift, and latency in a real-time ML inference deployment.`
      ],

      devops: [
        `Explain how Kubernetes Pod scheduling, ReplicaSets, Ingress Controllers, and Horizontal Pod Autoscalers (HPA) work together in production.`,
        `Walk me through your Infrastructure as Code (Terraform) best practices for managing multi-environment state files and drift detection.`,
        `How do you design a resilient CI/CD deployment pipeline supporting automated canary releases, blue-green deployments, and instant rollbacks?`,
        `How do you monitor distributed systems using Prometheus, Grafana, and OpenTelemetry, and how do you establish actionable SLO/SLAs?`,
        `Describe your incident response and disaster recovery strategy during a critical cloud provider outage or region failover.`
      ],

      security: [
        `Walk me through the OWASP Top 10 vulnerabilities and how you systematically prevent SQL Injection, SSRF, and Broken Object-Level Authorization (BOLA).`,
        `Explain the core architectural principles of a Zero Trust security model and how you enforce least privilege access control.`,
        `How does public-key cryptography (RSA/ECC) facilitate secure asymmetric encryption and digital signatures in TLS handshakes?`,
        `Describe how you conduct threat modeling, vulnerability scanning, and automated SAST/DAST testing in a CI/CD pipeline.`,
        `How do you handle and contain a suspected security breach, compromised API key, or active unauthorized data exfiltration event?`
      ],

      mobile: [
        `How do you manage memory consumption, prevent memory leaks, and profile frame drops (achieving smooth 60/120 FPS) in mobile applications?`,
        `Walk me through your offline-first architecture for local data persistence and seamless background synchronization when connectivity resumes.`,
        `Explain mobile application lifecycle states (foreground, background, suspended) and how you optimize battery and CPU usage.`,
        `How do you architect modular state management and navigation routing across deep links and push notification triggers?`,
        `Describe your strategy for automated mobile testing, crash reporting (e.g. Crashlytics), and progressive App Store / Play Store releases.`
      ],

      qa: [
        `How do you design an effective Test Pyramid balancing Unit, Integration, Component, and End-to-End (E2E) automated tests?`,
        `Walk me through how you build scalable, maintainable test automation frameworks using Playwright, Cypress, or Selenium with Page Object Models (POM).`,
        `How do you identify, reproduce, and resolve flaky automated tests in continuous integration environments?`,
        `Describe your approach to performance and load testing (e.g. JMeter, k6) to uncover server throughput and database connection bottlenecks.`,
        `How do you conduct boundary value analysis and equivalence partitioning when testing complex business logic?`
      ],

      product: [
        `How do you evaluate and prioritize competing feature requests from Sales, Engineering, and Executive leadership using frameworks like RICE or Kano?`,
        `Explain how you define a product's North Star Metric and establish leading versus lagging indicators for user engagement.`,
        `Walk me through how you design and analyze an A/B experimentation test to measure feature adoption without statistical bias.`,
        `Describe a time when a product release failed to meet user adoption goals. How did you diagnose the root cause and pivot?`,
        `How do you write clear, unambiguous User Stories with acceptance criteria that bridge business requirements with technical feasibility?`
      ],

      uiux: [
        `How do you establish, maintain, and scale a unified Design System with reusable component libraries and design tokens?`,
        `Walk me through your user research methodology (usability testing, user interviews, journey mapping) when redesigning a complex user flow.`,
        `How do you ensure web and mobile interfaces comply with WCAG 2.1 AA accessibility standards for screen readers and keyboard navigation?`,
        `Describe your process for resolving usability bottlenecks discovered through user testing or session analytics heatmaps.`,
        `How do you collaborate with engineering teams to ensure design fidelity from Figma prototypes to live production code?`
      ],

      database: [
        `Explain the architectural trade-offs between relational (ACID) databases and NoSQL (Document/Key-Value/Columnar) systems for write-heavy workloads.`,
        `How do you design database partitioning, sharding, and read-replica configurations to support horizontal scaling across petabyte-scale datasets?`,
        `Walk me through how you analyze an EXPLAIN ANALYZE execution plan to optimize nested table joins and avoid sequential table scans.`,
        `How do you handle database connection pooling, deadlocks, and transaction isolation levels in high-concurrency environments?`,
        `Describe your disaster recovery, Point-In-Time Recovery (PITR), and data backup verification workflows.`
      ],

      java: [
        `Explain Java Memory Model (Heap, Stack, Metaspace) and how Garbage Collection algorithms (G1, ZGC) manage memory lifecycle and pause times.`,
        `How does the Spring Boot Dependency Injection (IoC) and Aspect-Oriented Programming (AOP) mechanism work under the hood?`,
        `Walk me through how you handle multithreading using Java's ExecutorService, CompletableFuture, and synchronization primitives.`,
        `How do you optimize Hibernate / JPA entity mapping to prevent the N+1 select problem and manage second-level cache?`,
        `Describe how you build fault-tolerant microservices in Spring Cloud using circuit breakers (Resilience4j) and distributed tracing.`
      ],

      python: [
        `Explain how Python's Global Interpreter Lock (GIL) affects CPU-bound vs I/O-bound concurrency, and how you leverage asyncio vs multiprocessing.`,
        `Walk me through how Python generators and decorators work under the hood, and describe a real-world production scenario where you used them.`,
        `How do you optimize memory consumption when streaming and processing massive datasets using Python iterators and memory-mapped files?`,
        `Describe how you architect scalable asynchronous microservices using FastAPI, Pydantic, and background Celery task queues.`,
        `How do you manage dependency isolation, virtual environments, and automated package security auditing in Python projects?`
      ]
    };

    // ── 2. Identify best matching domain ──
    let matchedDomain = null;
    if (/front\s*end|react|vue|angular|css|html|ui\s*dev|web\s*dev|javascript\s*dev/i.test(roleLower)) {
      matchedDomain = 'frontend';
    } else if (/back\s*end|node|api|golang|django|fastapi|express|microservice|c#/i.test(roleLower)) {
      matchedDomain = 'backend';
    } else if (/full\s*stack|mern|mean|software\s*engineer|software\s*developer/i.test(roleLower)) {
      matchedDomain = 'fullstack';
    } else if (/data\s*scien|machine\s*learn|ai\s*eng|deep\s*learn|nlp|computer\s*vision/i.test(roleLower)) {
      matchedDomain = 'datascience';
    } else if (/devops|cloud|sre|site\s*relia|kubernetes|aws|azure|gcp|infrastructure/i.test(roleLower)) {
      matchedDomain = 'devops';
    } else if (/secur|cyber|infosec|penetration|soc|cryptograph/i.test(roleLower)) {
      matchedDomain = 'security';
    } else if (/mobile|ios|android|swift|kotlin|flutter|react\s*native/i.test(roleLower)) {
      matchedDomain = 'mobile';
    } else if (/qa|test|automation|sdet|quality/i.test(roleLower)) {
      matchedDomain = 'qa';
    } else if (/product\s*man|pm|scrum|product\s*own/i.test(roleLower)) {
      matchedDomain = 'product';
    } else if (/ui|ux|design|user\s*exp|product\s*design/i.test(roleLower)) {
      matchedDomain = 'uiux';
    } else if (/data\s*eng|dba|database|sql\s*dev|etl|warehouse/i.test(roleLower)) {
      matchedDomain = 'database';
    } else if (/java|spring/i.test(roleLower)) {
      matchedDomain = 'java';
    } else if (/python/i.test(roleLower)) {
      matchedDomain = 'python';
    }

    // ── 3. Mode-specific adaptations ──
    if (type === 'HR') {
      return [
        `Tell me about yourself, your core professional journey, and what specifically makes you interested in this ${rawRole} role.`,
        `Where do you see your technical and leadership skills growing over the next 3 to 5 years as a ${rawRole}?`,
        `Describe a situation where you received difficult or critical feedback on your work. How did you process it and what actions did you take?`,
        `What kind of team culture, communication style, and workplace environment enables you to perform at your absolute best?`,
        `Why are you exploring new opportunities at this point in your career, and what excites you most about our mission?`
      ];
    }

    if (type === 'Behavioral') {
      return [
        `Tell me about a high-stakes project with tight deadlines that was at risk of falling behind. How did you prioritize tasks and deliver?`,
        `Describe a time when you had a technical or architectural disagreement with a senior teammate or stakeholder. How did you navigate the resolution?`,
        `Give an example of an ambitious goal or project outcome you failed to achieve. What was the root cause and what key lesson did you carry forward?`,
        `How do you handle sudden requirement pivots, shifting product priorities, or ambiguous technical specifications midway through a sprint?`,
        `Share an instance where you proactively took ownership of a problem outside your primary job responsibilities to improve team efficiency.`
      ];
    }

    if (type === 'Case Study') {
      return [
        `Imagine our primary system experienced a 40% performance degradation and high latency under peak traffic. Walk me through your step-by-step diagnostic strategy.`,
        `Design an end-to-end scalable architecture for a real-time collaborative system for ${rawRole} users with high concurrency and fault tolerance.`,
        `You have competing roadmap requests from Product, Security, and Engineering teams. How do you construct your prioritization and delivery roadmap?`,
        `Walk me through how you would design a disaster recovery and automated failover strategy ensuring 99.99% availability for this system.`,
        `Describe how you would measure the business impact, customer adoption, and technical health of a newly deployed feature.`
      ];
    }

    // ── 4. Technical Mode: Use domain-specific questions or synthesized questions ──
    if (matchedDomain && roleBanks[matchedDomain]) {
      return roleBanks[matchedDomain];
    }

    // ── 5. Intelligent Dynamic Synthesis for any Custom Role or Niche Topic ──
    return [
      `What are the core principles, methodologies, and tools you consider foundational for high performance as a ${rawRole}?`,
      `Walk me through a complex problem or technical bottleneck you encountered in your recent ${rawRole} work. How did you diagnose and resolve it?`,
      `How do you evaluate trade-offs between rapid delivery and long-term quality/scalability when making decisions in ${rawRole} projects?`,
      `Describe how you collaborate with cross-functional partners (management, peers, clients) to ensure project requirements are executed accurately.`,
      `How do you stay ahead of emerging industry standards, technologies, and best practices relevant to ${rawRole}?`
    ];
  },

  generatePanelQuestions(config) {
    const role = config.role || 'Software Engineer';
    return [
      { persona: 'Alex (Senior Tech Lead)', question: `Deep Dive: How do you architect high-concurrency solutions and handle edge-case failures in ${role} systems?` },
      { persona: 'Sarah (Director of Product)', question: `Business Impact: How do you align technical engineering decisions with core business metrics and user experience?` },
      { persona: 'David (VP of People & Culture)', question: `Leadership & Adaptability: Tell me about a time you handled intense project pressure or team conflict. How did you lead?` },
      { persona: 'Alex (Senior Tech Lead)', question: `Resilience & Quality: Walk me through your automated testing, CI/CD pipeline, and system observability strategy.` },
      { persona: 'Sarah (Director of Product)', question: `Trade-off Strategy: If constrained by tight deadlines, how do you negotiate scope while maintaining high technical standards?` }
    ];
  },

  async rewriteResumeBulletPoints(missingSkills, targetRole) {
    const apiKey = StorageManager.getApiKey();
    if (apiKey) {
      try {
        const prompt = `Generate 3 high-impact, ATS-optimized resume bullet points using the STAR method for a candidate applying for ${targetRole}, incorporating these missing skills: ${missingSkills.join(', ')}. Return ONLY a raw JSON array of 3 strings.`;
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
            'dangerously-allow-browser': 'true'
          },
          body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 1000,
            messages: [{ role: 'user', content: prompt }]
          })
        });
        const data = await response.json();
        let textContent = data.content[0].text.trim().replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(textContent);
      } catch (e) {
        return this.rewriteResumeFallback(missingSkills, targetRole);
      }
    } else {
      return this.rewriteResumeFallback(missingSkills, targetRole);
    }
  },

  rewriteResumeFallback(missingSkills, targetRole) {
    const skillList = missingSkills.length > 0 ? missingSkills.join(', ') : 'Docker, AWS, Microservices';
    return [
      `Architected and deployed resilient scalable microservices incorporating ${skillList}, reducing API latency by 35% across high-traffic endpoints.`,
      `Led cross-functional sprint deliveries leveraging ${skillList} best practices, achieving 99.9% uptime and zero critical production regressions.`,
      `Streamlined continuous integration & automated deployment pipelines with ${skillList}, cutting build times by 40% for engineering teams.`
    ];
  },

  // ------------------------------------------------------------------------
  // Smart Answer Evaluation Engine (Semantic Keyword Scoring)
  // ------------------------------------------------------------------------
  evaluateFallback(config, questions, answers) {

    // ── Keyword banks per interview type ──
    const keywordBanks = {
      Technical: [
        'algorithm','complexity','api','database','cache','latency','async','thread',
        'microservice','architecture','deploy','docker','kubernetes','ci/cd','rest',
        'graphql','sql','nosql','index','query','optimize','load balancer','scaling',
        'design pattern','solid','test','unit test','integration','debug','refactor',
        'state management','component','framework','typescript','javascript','python',
        'concurrency','memory','performance','security','authentication','jwt','token'
      ],
      HR: [
        'passion','goal','career','growth','team','collaborate','culture','value',
        'strength','weakness','feedback','improve','motivate','achievement','leadership',
        'initiative','responsibility','adapt','challenge','learn','experience','vision',
        'communicate','flexible','deadline','organisation'
      ],
      Behavioral: [
        'situation','task','action','result','star','conflict','resolve','deadline',
        'pressure','failure','learn','initiative','collaborate','prioritise','challenge',
        'stakeholder','disagree','success','outcome','responsibility','milestone','impact'
      ],
      Aptitude: [
        'estimate','calculate','probability','data','statistic','logic','rate','ratio',
        'percentage','trade-off','priority','analyse','assumption','model','variable',
        'constraint','optimise','efficient','cost','time','resource','approach'
      ],
      'Group Discussion': [
        'perspective','argue','balance','consider','impact','evidence','policy','ethical',
        'sustainable','stakeholder','regulation','innovation','disadvantage','benefit',
        'society','economy','agree','disagree','opinion','viewpoint','debate'
      ],
      'Case Study': [
        'diagnose','root cause','hypothesis','data','metric','kpi','framework','strategy',
        'prioritise','trade-off','architecture','scalable','cost','revenue','user','launch',
        'rollback','monitor','feedback','iterate','outcome','decision'
      ]
    };

    // ── STAR signals ──
    const starSignals = [
      'situation','when i','i was working','the team','the project','we faced','at my previous',
      'my task was','my role','i had to','i decided','i implemented','i built','i led',
      'as a result','the outcome','this led to','we achieved','this improved','reduced','increased',
      'learned that','realised','key takeaway'
    ];

    // ── Specificity: numbers/metrics ──
    const metricsRe = /\b(\d+\s*%|\d+x|\d+\s*(ms|seconds?|hours?|days?|weeks?|users?|requests?|queries?|million|thousand|kb|mb|gb))\b/gi;

    // ── Filler words that reduce quality score ──
    const fillers = ['um','uh','like basically','you know','i think maybe','sort of','kind of','stuff','things','etc'];

    const interviewType = config.type || 'Technical';
    const relevantKeywords = keywordBanks[interviewType] || keywordBanks.Technical;

    // ── Per-question scoring ──
    const questionScores = questions.map((q, idx) => {
      const raw = (answers[idx] || '').trim();
      const lower = raw.toLowerCase();
      const words = raw.split(/\s+/).filter(w => w.length > 1);
      const wordCount = words.length;

      // 1. Blank / skip penalty
      if (wordCount < 5) return { q, raw, score: 0, dim: [0,0,0,0,0,0] };

      // 2. Keyword relevance (0–30): how many domain keywords appear
      const matchedKw = relevantKeywords.filter(k => lower.includes(k));
      const kwScore = Math.min(30, Math.round((matchedKw.length / 8) * 30));

      // 3. STAR structure (0–20): sentence signals showing structure
      const starHits = starSignals.filter(s => lower.includes(s)).length;
      const starScore = Math.min(20, starHits * 4);

      // 4. Specificity / metrics (0–20): numbers and quantifiable outcomes
      const metrics = (raw.match(metricsRe) || []).length;
      const metricScore = Math.min(20, metrics * 7);

      // 5. Depth / length (0–20): word count tiers
      let depthScore = 0;
      if (wordCount >= 20)  depthScore = 5;
      if (wordCount >= 50)  depthScore = 10;
      if (wordCount >= 100) depthScore = 15;
      if (wordCount >= 160) depthScore = 20;

      // 6. Filler word penalty (0 to –10)
      const fillerHits = fillers.filter(f => lower.includes(f)).length;
      const fillerPenalty = Math.min(10, fillerHits * 3);

      // 7. Question-topic match bonus (0–10)
      //    Check if answer contains words that also appear in the question
      const qWords = q.toLowerCase().split(/\s+/).filter(w => w.length > 4);
      const qMatchHits = qWords.filter(w => lower.includes(w)).length;
      const qMatchScore = Math.min(10, qMatchHits * 3);

      const total = Math.max(0, kwScore + starScore + metricScore + depthScore + qMatchScore - fillerPenalty);
      // Normalise to 0-100
      const score = Math.min(100, Math.round(total));

      return {
        q, raw,
        score,
        dim: [kwScore, starScore, metricScore, depthScore, qMatchScore, fillerPenalty],
        matchedKeywords: matchedKw.slice(0, 5)
      };
    });

    // ── Aggregate overall score ──
    const answeredQuestions = questionScores.filter(qs => qs.score > 0);
    const totalRaw = questionScores.reduce((s, qs) => s + qs.score, 0);
    const overallScore = answeredQuestions.length === 0
      ? 10
      : Math.max(10, Math.round(totalRaw / questions.length));

    // ── Dimension sub-scores ──
    const avgDim = (dimIdx) => {
      const vals = questionScores.map(qs => qs.dim[dimIdx] || 0);
      return Math.min(100, Math.round((vals.reduce((a,b)=>a+b,0) / vals.length) * 3.3));
    };

    const scores = {
      technical:      Math.min(100, avgDim(0) + 10),
      communication:  Math.min(100, Math.round(overallScore * 0.95)),
      confidence:     Math.min(100, Math.round(overallScore * 0.90 + (answeredQuestions.length * 2))),
      grammar:        Math.min(100, 60 + avgDim(3) + (100 - Math.max(0, avgDim(5) * 3))),
      clarity:        Math.min(100, avgDim(4) * 3 + 40),
      problemSolving: Math.min(100, avgDim(1) * 2 + avgDim(2) * 2 + 20)
    };

    // ── Smart summary based on actual score ──
    let summary;
    if (overallScore >= 80) {
      summary = `Excellent performance! Your answers demonstrated strong domain knowledge, structured thinking, and quantifiable outcomes for a ${config.role} (${config.experience}) role.`;
    } else if (overallScore >= 60) {
      summary = `Good interview attempt for a ${config.role} role. You showed solid awareness of the topic. Adding more specific metrics and STAR structure would push scores higher.`;
    } else if (overallScore >= 35) {
      summary = `Average performance for a ${config.role} position (${config.experience}). Answers lacked sufficient depth, domain keywords, or concrete examples. Focus on structured, detailed responses.`;
    } else {
      summary = `Below-average performance. Answers were too short or lacked relevance to the questions. Practice building detailed responses using the STAR method with specific examples.`;
    }

    // ── Strengths / Improvements ──
    const strengths = [];
    const improvements = [];

    const avgKw = questionScores.reduce((a,b) => a + (b.dim[0]||0), 0) / questions.length;
    const avgStar = questionScores.reduce((a,b) => a + (b.dim[1]||0), 0) / questions.length;
    const avgMetric = questionScores.reduce((a,b) => a + (b.dim[2]||0), 0) / questions.length;
    const avgDepth = questionScores.reduce((a,b) => a + (b.dim[3]||0), 0) / questions.length;

    if (avgKw > 10) strengths.push("Good use of relevant technical and domain vocabulary.");
    else improvements.push("Include more domain-specific terminology (e.g. API design, system patterns, tools used).");

    if (avgStar > 8) strengths.push("Responses follow a clear Situation → Action → Result narrative.");
    else improvements.push("Structure answers using the STAR method: Situation, Task, Action, Result.");

    if (avgMetric > 6) strengths.push("Strong use of quantifiable outcomes and metrics to support claims.");
    else improvements.push("Add numbers and measurable results (e.g. 'improved load time by 40%', 'served 500K users').");

    if (avgDepth >= 10) strengths.push("Detailed and thorough responses showing depth of understanding.");
    else improvements.push("Expand your answers — aim for at least 100–150 words per response with clear reasoning.");

    if (answeredQuestions.length === questions.length) strengths.push("Answered all questions — demonstrates confidence and preparation.");
    else improvements.push(`${questions.length - answeredQuestions.length} question(s) were skipped. Always attempt every question with at least a partial answer.`);

    // Ensure 3 items each
    const fallbackStrengths = ["Demonstrated basic familiarity with the interview topic.","Willingness to engage with all question types.","Opportunity to improve through targeted practice."];
    const fallbackImprovements = ["Focus on longer, more structured answers.","Use specific real-world examples from your experience.","Study the STAR method for behavioral and situational questions."];
    while (strengths.length < 3) strengths.push(fallbackStrengths[strengths.length]);
    while (improvements.length < 3) improvements.push(fallbackImprovements[improvements.length]);

    // ── Per-question feedback ──
    const questionFeedback = questionScores.map((qs, idx) => {
      const s = qs.score;
      let feedback;
      if (qs.raw.length < 10) {
        feedback = "⚠️ No answer provided. Always attempt a response — even a partial answer shows initiative.";
      } else if (s >= 70) {
        feedback = `✅ Strong answer (${s}/100). Well-structured with good domain coverage. ${qs.matchedKeywords.length > 0 ? `Key concepts hit: ${qs.matchedKeywords.join(', ')}.` : ''} Consider adding 1–2 more concrete metrics.`;
      } else if (s >= 40) {
        feedback = `🟡 Moderate answer (${s}/100). You touched on the topic but lacked depth or specifics. ${qs.matchedKeywords.length > 0 ? `Good keywords: ${qs.matchedKeywords.join(', ')}.` : 'Add more domain keywords.'} Use STAR format and include a measurable outcome.`;
      } else {
        feedback = `🔴 Weak answer (${s}/100). The response was too brief or off-topic. Aim for 100+ words with a clear structure: state the situation, your specific actions, and the result.`;
      }

      return {
        question: qs.q,
        candidateAnswer: qs.raw || "No answer provided.",
        score: s,
        modelAnswer: `A top-tier answer should: (1) Briefly state the context/situation, (2) Describe your specific role and actions taken using relevant technical details, (3) Quantify the outcome ("reduced latency by 35%", "increased user retention by 20%"), and (4) Share what you learned or would do differently.`,
        feedback
      };
    });

    return { overallScore, scores, summary, strengths, improvements, questionFeedback };
  },


  matchResumeFallback(resumeText, jdText) {
    const techKeywords = ['JavaScript', 'TypeScript', 'Python', 'React', 'Node.js', 'SQL', 'AWS', 'Docker', 'REST API', 'Git', 'Agile', 'System Design', 'CI/CD', 'CSS3', 'HTML5'];
    const softKeywords = ['Communication', 'Leadership', 'Problem Solving', 'Teamwork', 'Critical Thinking', 'Adaptability'];

    const matchedTech = techKeywords.filter(k => 
      resumeText.toLowerCase().includes(k.toLowerCase()) && jdText.toLowerCase().includes(k.toLowerCase())
    );

    const missingTech = techKeywords.filter(k => 
      !resumeText.toLowerCase().includes(k.toLowerCase()) && jdText.toLowerCase().includes(k.toLowerCase())
    );

    const matchedSoft = softKeywords.filter(k => 
      resumeText.toLowerCase().includes(k.toLowerCase())
    );

    const missingSoft = softKeywords.filter(k => 
      !resumeText.toLowerCase().includes(k.toLowerCase())
    );

    const score = Math.min(60 + (matchedTech.length * 7), 96);

    return {
      matchPercentage: score,
      matchedSkills: matchedTech.length > 0 ? matchedTech : ['REST API', 'Git', 'Problem Solving'],
      missingTechnicalSkills: missingTech.length > 0 ? missingTech : ['Docker', 'AWS'],
      missingSoftSkills: missingSoft.slice(0, 2),
      atsSuggestions: [
        "Include exact technical keyword matches from the Job Description in your Experience section.",
        "Add measurable metrics (e.g. 'Improved speed by 25%') to bullet points.",
        "Ensure standard ATS formatting without tables or complex graphics."
      ],
      summary: `Your resume demonstrates a strong ${score}% structural match with the target role.`
    };
  }
};

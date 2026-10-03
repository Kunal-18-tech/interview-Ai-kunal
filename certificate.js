/**
 * InterviewIQ AI — Performance Certificate Generator
 * Generates printable & downloadable official InterviewIQ Performance Certificates.
 */

export class CertificateGenerator {
  static generateCertificateHtml(sessionData, profile) {
    const dateStr = sessionData.displayDate || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const score = sessionData.scorecard?.overallScore || 85;
    const certId = 'IQ-CERT-' + Math.floor(100000 + Math.random() * 900000);

    return `
      <div id="printableCertificate" class="certificate-container">
        <div class="cert-border">
          <div class="cert-inner">
            <div class="cert-header">
              <div class="cert-badge-logo">⚡ InterviewIQ AI</div>
              <div class="cert-id">VERIFICATION ID: ${certId}</div>
            </div>

            <div class="cert-title">CERTIFICATE OF PERFORMANCE</div>
            <div class="cert-subtitle">This official certificate verifies that</div>

            <div class="cert-candidate-name">${profile.name}</div>

            <div class="cert-body">
              has successfully completed an AI-powered Technical & Behavioral Mock Interview for the role of
              <br/>
              <strong style="color: #6c8cff; font-size: 1.2rem;">${sessionData.config.role} (${sessionData.config.experience})</strong>
            </div>

            <div class="cert-score-box">
              <div class="cert-score-num">${score}%</div>
              <div class="cert-score-lbl">OVERALL COMPETENCY RATING</div>
            </div>

            <div class="cert-footer">
              <div>
                <div class="cert-date">${dateStr}</div>
                <div style="font-size: 0.75rem; color: #8b90a3;">DATE ISSUED</div>
              </div>

              <div class="cert-seal">
                <span>OFFICIAL</span>
                <span>VERIFIED</span>
              </div>

              <div>
                <div class="cert-sig">InterviewIQ AI Engine</div>
                <div style="font-size: 0.75rem; color: #8b90a3;">AUTHENTICATED EVALUATOR</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  static printCertificate(sessionData, profile) {
    const certHtml = this.generateCertificateHtml(sessionData, profile);
    const printWindow = window.open('', '_blank', 'width=900,height=650');
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>InterviewIQ Performance Certificate - ${profile.name}</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Space+Grotesk:wght@600;700&display=swap" rel="stylesheet">
        <style>
          body {
            margin: 0;
            padding: 2rem;
            background: #0b0d13;
            color: #f3f4f8;
            font-family: 'Inter', sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
          }
          .certificate-container {
            width: 800px;
            background: #151824;
            border-radius: 20px;
            padding: 15px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.6);
          }
          .cert-border {
            border: 2px stroke #272c40;
            border-radius: 16px;
            padding: 2.5rem;
            border: 2px dashed #6c8cff;
            text-align: center;
          }
          .cert-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
          }
          .cert-badge-logo {
            font-family: 'Space Grotesk', sans-serif;
            font-size: 1.3rem;
            font-weight: 700;
            color: #6c8cff;
          }
          .cert-id {
            font-size: 0.75rem;
            color: #8b90a3;
            letter-spacing: 0.1em;
          }
          .cert-title {
            font-family: 'Space Grotesk', sans-serif;
            font-size: 2.2rem;
            font-weight: 700;
            letter-spacing: 0.05em;
            margin-bottom: 0.5rem;
            color: #f3f4f8;
          }
          .cert-subtitle {
            font-size: 0.95rem;
            color: #8b90a3;
            margin-bottom: 1.5rem;
          }
          .cert-candidate-name {
            font-family: 'Space Grotesk', sans-serif;
            font-size: 2.5rem;
            font-weight: 700;
            color: #ffffff;
            margin-bottom: 1.25rem;
            text-decoration: underline;
            text-decoration-color: #6c8cff;
          }
          .cert-body {
            font-size: 1rem;
            color: #8b90a3;
            max-width: 600px;
            margin: 0 auto 2rem auto;
            line-height: 1.6;
          }
          .cert-score-box {
            display: inline-block;
            background: rgba(108, 140, 255, 0.1);
            border: 1px solid #6c8cff;
            padding: 1rem 2.5rem;
            border-radius: 12px;
            margin-bottom: 2.5rem;
          }
          .cert-score-num {
            font-family: 'Space Grotesk', sans-serif;
            font-size: 2.8rem;
            font-weight: 700;
            color: #4ade80;
            line-height: 1;
          }
          .cert-score-lbl {
            font-size: 0.75rem;
            letter-spacing: 0.1em;
            color: #8b90a3;
            margin-top: 0.3rem;
          }
          .cert-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-top: 1.5rem;
            border-top: 1px solid #272c40;
          }
          .cert-seal {
            width: 70px;
            height: 70px;
            border-radius: 50%;
            background: #6c8cff;
            color: white;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            font-size: 0.65rem;
            font-weight: 700;
          }
          @media print {
            body { background: white; color: black; }
            .certificate-container { background: white; border: 2px solid #000; box-shadow: none; }
            .cert-title, .cert-candidate-name { color: #000; }
          }
        </style>
      </head>
      <body>
        ${certHtml}
        <script>
          setTimeout(() => { window.print(); }, 500);
        </script>
      </body>
      </html>
    `);
  }
}

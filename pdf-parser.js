/**
 * InterviewIQ AI — PDF Parser Module
 * Handles PDF resume reading and text extraction using PDF.js library
 */

export const PdfParser = {
  /**
   * Extracts clean text content from a PDF File object.
   * @param {File} file 
   * @returns {Promise<string>}
   */
  async extractTextFromPdf(file) {
    if (!file) throw new Error("No PDF file provided.");
    
    // Check if pdfjsLib is loaded from CDN
    if (typeof window.pdfjsLib === 'undefined') {
      console.warn("PDF.js library not loaded yet. Falling back to plain text read if applicable.");
      return await file.text();
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;

      let extractedText = '';
      const numPages = pdf.numPages;

      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageItems = textContent.items.map(item => item.str).join(' ');
        extractedText += pageItems + '\n';
      }

      return extractedText.trim();
    } catch (error) {
      console.error("PDF Parsing Error:", error);
      throw new Error("Failed to parse PDF file. Please copy & paste your resume text manually.");
    }
  }
};

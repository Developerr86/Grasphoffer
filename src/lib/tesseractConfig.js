import { createWorker } from 'tesseract.js';

/**
 * Tesseract.js configuration for local usage
 * This avoids downloading language files from CDN during runtime
 */

// Language codes we support
export const SUPPORTED_LANGUAGES = [
  'eng',    // English
  'spa',    // Spanish
  'fra',    // French
  'deu',    // German
  'ita',    // Italian
  'por',    // Portuguese
  'rus',    // Russian
  'ara',    // Arabic
  'chi_sim', // Chinese Simplified
  'jpn'     // Japanese
];

// Default language combination for multi-language support
export const DEFAULT_LANGUAGES = 'eng+spa+fra+deu';

/**
 * Create a Tesseract worker with optimized configuration
 * @param {string} languages - Language codes separated by +
 * @param {number} oem - OCR Engine Mode (default: 1)
 * @param {Object} options - Additional options
 * @returns {Promise<Worker>} Configured Tesseract worker
 */
export async function createOptimizedWorker(
  languages = DEFAULT_LANGUAGES, 
  oem = 1, 
  options = {}
) {
  const defaultOptions = {
    logger: m => {
      if (m.status === 'recognizing text') {
        console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
      } else {
        console.log('OCR Status:', m.status);
      }
    },
    errorHandler: err => console.error('OCR Error:', err),
    ...options
  };

  try {
    console.log(`Creating Tesseract worker with languages: ${languages}`);
    
    const worker = await createWorker(languages, oem, defaultOptions);
    
    // Set additional parameters for better OCR performance
    await worker.setParameters({
      tessedit_pageseg_mode: '1', // Automatic page segmentation with OSD
      tessedit_char_whitelist: '', // Allow all characters
      preserve_interword_spaces: '1', // Preserve spaces between words
      tessedit_do_invert: '0', // Don't invert image
      tessedit_create_hocr: '0', // Don't create HOCR output
      tessedit_create_tsv: '0', // Don't create TSV output
      tessedit_create_pdf: '0', // Don't create PDF output
    });

    console.log('Tesseract worker created and configured successfully');
    return worker;

  } catch (error) {
    console.error('Failed to create Tesseract worker:', error);
    throw new Error(`OCR initialization failed: ${error.message}`);
  }
}

/**
 * Detect the best language for OCR based on file name or content
 * @param {string} fileName - Name of the file being processed
 * @returns {string} Language code combination
 */
export function detectLanguageFromFileName(fileName) {
  const name = fileName.toLowerCase();
  
  // Simple heuristics based on file name
  if (name.includes('chinese') || name.includes('中文') || name.includes('zh')) {
    return 'eng+chi_sim';
  }
  if (name.includes('japanese') || name.includes('日本語') || name.includes('jp')) {
    return 'eng+jpn';
  }
  if (name.includes('arabic') || name.includes('عربي') || name.includes('ar')) {
    return 'eng+ara';
  }
  if (name.includes('russian') || name.includes('русский') || name.includes('ru')) {
    return 'eng+rus';
  }
  if (name.includes('spanish') || name.includes('español') || name.includes('es')) {
    return 'eng+spa';
  }
  if (name.includes('french') || name.includes('français') || name.includes('fr')) {
    return 'eng+fra';
  }
  if (name.includes('german') || name.includes('deutsch') || name.includes('de')) {
    return 'eng+deu';
  }
  if (name.includes('italian') || name.includes('italiano') || name.includes('it')) {
    return 'eng+ita';
  }
  if (name.includes('portuguese') || name.includes('português') || name.includes('pt')) {
    return 'eng+por';
  }
  
  // Default to multi-language European support
  return DEFAULT_LANGUAGES;
}

/**
 * OCR configuration presets for different use cases
 */
export const OCR_PRESETS = {
  // Fast processing with basic accuracy
  FAST: {
    languages: 'eng',
    oem: 1,
    psm: '6', // Uniform block of text
    options: {
      tessedit_pageseg_mode: '6',
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,!?-'
    }
  },
  
  // Balanced speed and accuracy
  BALANCED: {
    languages: DEFAULT_LANGUAGES,
    oem: 1,
    psm: '1', // Automatic page segmentation with OSD
    options: {
      tessedit_pageseg_mode: '1',
      preserve_interword_spaces: '1'
    }
  },
  
  // High accuracy for complex documents
  ACCURATE: {
    languages: 'eng+spa+fra+deu+ita+por',
    oem: 1,
    psm: '1',
    options: {
      tessedit_pageseg_mode: '1',
      preserve_interword_spaces: '1',
      tessedit_do_invert: '1',
      tessedit_create_hocr: '1'
    }
  },
  
  // Handwriting recognition
  HANDWRITING: {
    languages: 'eng',
    oem: 1,
    psm: '8', // Single word
    options: {
      tessedit_pageseg_mode: '8',
      tessedit_char_whitelist: '',
      preserve_interword_spaces: '1'
    }
  },
  
  // Multi-language Asian support
  ASIAN: {
    languages: 'eng+chi_sim+jpn',
    oem: 1,
    psm: '1',
    options: {
      tessedit_pageseg_mode: '1',
      preserve_interword_spaces: '1'
    }
  }
};

/**
 * Get OCR preset configuration
 * @param {string} presetName - Name of the preset
 * @returns {Object} OCR configuration
 */
export function getOCRPreset(presetName = 'BALANCED') {
  return OCR_PRESETS[presetName] || OCR_PRESETS.BALANCED;
}

/**
 * Validate if language is supported
 * @param {string} language - Language code
 * @returns {boolean} Whether language is supported
 */
export function isLanguageSupported(language) {
  return SUPPORTED_LANGUAGES.includes(language);
}

/**
 * Clean and validate language string
 * @param {string} languages - Language string
 * @returns {string} Cleaned language string
 */
export function cleanLanguageString(languages) {
  const langArray = languages.split('+');
  const validLangs = langArray.filter(lang => isLanguageSupported(lang.trim()));
  
  if (validLangs.length === 0) {
    console.warn('No valid languages found, using default');
    return 'eng';
  }
  
  return validLangs.join('+');
}

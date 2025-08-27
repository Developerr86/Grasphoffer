import { useState, useCallback } from 'react';
import { processFile, processMultipleFiles } from '../lib/fileProcessor';
import { useAuth } from '../context/AuthContext';

/**
 * Custom hook for file processing with progress tracking
 */
export function useFileProcessor() {
  const { user } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState('');
  const [results, setResults] = useState([]);
  const [errors, setErrors] = useState([]);

  /**
   * Process a single file
   * @param {File} file - File to process
   * @returns {Promise<Object>} Processing result
   */
  const processSingleFile = useCallback(async (file) => {
    if (!user) {
      throw new Error('User must be authenticated to process files');
    }

    setProcessing(true);
    setProgress(0);
    setCurrentFile(file.name);
    setErrors([]);

    try {
      console.log(`Starting processing for: ${file.name}`);
      
      // Validate file
      if (!isValidFile(file)) {
        throw new Error(`Invalid file type or size: ${file.name}`);
      }

      setProgress(10);
      
      const result = await processFile(file, user.id);
      
      setProgress(100);
      
      if (result.success) {
        setResults(prev => [...prev, result]);
        console.log('File processing completed successfully:', result);
      } else {
        setErrors(prev => [...prev, result.error]);
        console.error('File processing failed:', result.error);
      }
      
      return result;
      
    } catch (error) {
      console.error('File processing error:', error);
      setErrors(prev => [...prev, error.message]);
      return {
        success: false,
        error: error.message,
        fileName: file.name
      };
    } finally {
      setProcessing(false);
      setCurrentFile('');
      // Don't reset progress immediately - let it stay at 100% for a moment
      setTimeout(() => {
        setProgress(0);
      }, 2000); // Reset after 2 seconds
    }
  }, [user]);

  /**
   * Process multiple files sequentially
   * @param {File[]} files - Array of files to process
   * @returns {Promise<Array>} Array of processing results
   */
  const processFiles = useCallback(async (files) => {
    if (!user) {
      throw new Error('User must be authenticated to process files');
    }

    if (!files || files.length === 0) {
      return [];
    }

    setProcessing(true);
    setProgress(0);
    setErrors([]);
    setResults([]);

    const validFiles = files.filter(isValidFile);
    const invalidFiles = files.filter(file => !isValidFile(file));

    // Add errors for invalid files
    if (invalidFiles.length > 0) {
      const invalidErrors = invalidFiles.map(file => 
        `Invalid file: ${file.name} (${file.type}, ${(file.size / 1024 / 1024).toFixed(2)}MB)`
      );
      setErrors(prev => [...prev, ...invalidErrors]);
    }

    const allResults = [];

    try {
      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        setCurrentFile(file.name);

        // Set progress for starting this file
        const baseProgress = (i / validFiles.length) * 100;
        setProgress(baseProgress);
        console.log(`Progress: ${baseProgress}% - Starting file ${i + 1}/${validFiles.length}: ${file.name}`);

        // Update progress during processing
        const progressStep = (1 / validFiles.length) * 100;
        const midProgress = baseProgress + progressStep * 0.5;
        setProgress(midProgress); // 50% through current file
        console.log(`Progress: ${midProgress}% - Processing ${file.name}...`);

        const result = await processFile(file, user.id);
        allResults.push(result);

        if (result.success) {
          setResults(prev => [...prev, result]);
        } else {
          setErrors(prev => [...prev, `${file.name}: ${result.error}`]);
        }

        // Complete progress for this file
        const completedProgress = baseProgress + progressStep;
        setProgress(completedProgress);
        console.log(`Progress: ${completedProgress}% - Completed ${file.name}`);
      }

      setProgress(100);
      console.log(`Progress: 100% - Completed processing ${validFiles.length} files`);
      
      return allResults;

    } catch (error) {
      console.error('Batch file processing error:', error);
      setErrors(prev => [...prev, error.message]);
      return allResults;
    } finally {
      setProcessing(false);
      setCurrentFile('');
      // Don't reset progress immediately - let it stay at 100% for a moment
      setTimeout(() => {
        setProgress(0);
      }, 2000); // Reset after 2 seconds
    }
  }, [user]);

  /**
   * Clear results and errors
   */
  const clearResults = useCallback(() => {
    setResults([]);
    setErrors([]);
  }, []);

  /**
   * Reset all state
   */
  const reset = useCallback(() => {
    setProcessing(false);
    setProgress(0);
    setCurrentFile('');
    setResults([]);
    setErrors([]);
  }, []);

  return {
    // State
    processing,
    progress,
    currentFile,
    results,
    errors,
    
    // Actions
    processSingleFile,
    processFiles,
    clearResults,
    reset,
    
    // Computed
    hasResults: results.length > 0,
    hasErrors: errors.length > 0,
    successCount: results.filter(r => r.success).length,
    errorCount: errors.length
  };
}

/**
 * Validate file type and size
 * @param {File} file - File to validate
 * @returns {boolean} Whether file is valid
 */
function isValidFile(file) {
  const MAX_SIZE = 50 * 1024 * 1024; // 50MB
  const ALLOWED_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/bmp',
    'image/webp',
    'image/tiff'
  ];

  if (file.size > MAX_SIZE) {
    console.warn(`File ${file.name} exceeds size limit: ${file.size} bytes`);
    return false;
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    console.warn(`File ${file.name} has unsupported type: ${file.type}`);
    return false;
  }

  return true;
}

/**
 * Get file type display name
 * @param {string} mimeType - MIME type
 * @returns {string} Display name
 */
export function getFileTypeDisplay(mimeType) {
  const typeMap = {
    'application/pdf': 'PDF Document',
    'image/jpeg': 'JPEG Image',
    'image/jpg': 'JPG Image',
    'image/png': 'PNG Image',
    'image/gif': 'GIF Image',
    'image/bmp': 'BMP Image',
    'image/webp': 'WebP Image',
    'image/tiff': 'TIFF Image'
  };

  return typeMap[mimeType] || mimeType;
}

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted size
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

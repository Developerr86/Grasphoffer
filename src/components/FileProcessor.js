import React from 'react';
import { useFileProcessor, formatFileSize, getFileTypeDisplay } from '../hooks/useFileProcessor';
import './FileProcessor.css';

const FileProcessor = ({ files, onComplete, onError }) => {
  const {
    processing,
    progress,
    currentFile,
    results,
    errors,
    processFiles,
    clearResults,
    hasResults,
    hasErrors,
    successCount,
    errorCount
  } = useFileProcessor();

  // Auto-process files when they change
  React.useEffect(() => {
    if (files && files.length > 0 && !processing) {
      handleProcessFiles();
    }
  }, [files]);

  // Debug progress changes
  React.useEffect(() => {
    console.log(`FileProcessor: Progress updated to ${progress}%, Processing: ${processing}, Current file: ${currentFile}`);
  }, [progress, processing, currentFile]);

  // Notify parent component when processing completes
  React.useEffect(() => {
    if (!processing && (hasResults || hasErrors) && results.length > 0) {
      // Check if we have multiple files
      if (results.length > 1) {
        // Combine markdown content from all successful results
        const combinedMarkdown = results
          .filter(r => r.success && r.markdownContent)
          .map(r => r.markdownContent)
          .join('\n\n---\n\n');
        
        if (onComplete) {
          onComplete({
            results,
            errors,
            successCount,
            errorCount,
            combinedMarkdown,
            allSuccess: results.every(r => r.success)
          });
        }
      } else if (results.length === 1) {
        // Single file result
        if (onComplete) {
          onComplete(results[0]);
        }
      }
      
      if (hasErrors && onError) {
        onError(errors);
      }
    }
  }, [processing, hasResults, hasErrors, results, errors, successCount, errorCount, onComplete, onError]);

  const handleProcessFiles = async () => {
    if (!files || files.length === 0) return;
    
    console.log(`Starting to process ${files.length} files`);
    clearResults();
    await processFiles(files);
  };

  if (!files || files.length === 0) {
    return null;
  }

  return (
    <div className="file-processor">
      {processing && (
        <div className="processing-status">
          <div className="processing-header">
            <h4>Processing Files...</h4>
            <span className="file-count">{successCount + errorCount + 1} / {files.length}</span>
          </div>
          
          {currentFile && (
            <div className="current-file">
              <span className="file-icon">📄</span>
              <span className="file-name">{currentFile}</span>
            </div>
          )}
          
          <div className="progress-container">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <span className="progress-text">{Math.round(progress)}%</span>
          </div>
          
          <div className="processing-info">
            <p>Extracting text using PDF.js and Tesseract OCR...</p>
            <p>This may take a few minutes for large files.</p>
          </div>
        </div>
      )}

      {!processing && (hasResults || hasErrors) && (
        <div className="processing-results">
          <div className="results-header">
            <h4>Processing Complete</h4>
            <div className="results-summary">
              {successCount > 0 && (
                <span className="success-count">✅ {successCount} successful</span>
              )}
              {errorCount > 0 && (
                <span className="error-count">❌ {errorCount} failed</span>
              )}
            </div>
          </div>

          {results.length > 0 && (
            <div className="success-results">
              <h5>Successfully Processed:</h5>
              <div className="results-list">
                {results.map((result, index) => (
                  <div key={index} className="result-item success">
                    <div className="result-header">
                      <span className="result-icon">✅</span>
                      <span className="result-filename">{result.fileName}</span>
                      <span className="result-method">{result.processingMethod}</span>
                    </div>
                    
                    <div className="result-details">
                      <div className="text-preview">
                        <strong>Extracted Text Preview:</strong>
                        <p>{result.extractedText.substring(0, 200)}...</p>
                      </div>
                      
                      {result.markdownUrl && (
                        <div className="storage-info">
                          <strong>Stored in Supabase:</strong>
                          <a 
                            href={result.markdownUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="storage-link"
                          >
                            View Markdown File
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {errors.length > 0 && (
            <div className="error-results">
              <h5>Processing Errors:</h5>
              <div className="error-list">
                {errors.map((error, index) => (
                  <div key={index} className="result-item error">
                    <span className="result-icon">❌</span>
                    <span className="error-message">{error}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="results-actions">
            <button 
              onClick={clearResults}
              className="clear-results-btn"
            >
              Clear Results
            </button>
          </div>
        </div>
      )}

      {files.length > 0 && !processing && !hasResults && !hasErrors && (
        <div className="file-queue">
          <h4>Files Ready for Processing:</h4>
          <div className="file-list">
            {files.map((file, index) => (
              <div key={index} className="file-item">
                <span className="file-icon">
                  {file.type === 'application/pdf' ? '📄' : '🖼️'}
                </span>
                <div className="file-info">
                  <span className="file-name">{file.name}</span>
                  <span className="file-details">
                    {getFileTypeDisplay(file.type)} • {formatFileSize(file.size)}
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          <button 
            onClick={handleProcessFiles}
            className="process-btn"
            disabled={processing}
          >
            Start Processing
          </button>
        </div>
      )}
    </div>
  );
};

export default FileProcessor;

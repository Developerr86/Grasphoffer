import React, { useState, useRef } from 'react';
import FileProcessor from './FileProcessor';
import './FileUpload.css';

const FileUpload = ({ onFilesSubmit, disabled = false }) => {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [attachedLinks, setAttachedLinks] = useState([]);
  const [linkInput, setLinkInput] = useState('');
  const [filesToProcess, setFilesToProcess] = useState([]);
  const [showFileProcessor, setShowFileProcessor] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // Handle file uploads
  const handleFileUpload = (files) => {
    console.log('Files uploaded:', files);

    // Separate files that need processing (PDFs and images) from regular files
    const processableFiles = files.filter(file =>
      file.type === 'application/pdf' || file.type.startsWith('image/')
    );
    const regularFiles = files.filter(file =>
      file.type !== 'application/pdf' && !file.type.startsWith('image/')
    );

    // Add regular files to uploaded files immediately
    if (regularFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...regularFiles]);
    }

    // Set processable files for processing
    if (processableFiles.length > 0) {
      setFilesToProcess(processableFiles);
      setShowFileProcessor(true);
      console.log(`${processableFiles.length} files queued for text extraction`);
    }
  };

  // Handle file input change
  const handleFileInputChange = (event) => {
    const files = Array.from(event.target.files);
    handleFileUpload(files);
  };

  // Handle click on drop zone to open file browser
  const handleDropZoneClick = () => {
    if (fileInputRef.current && !disabled) {
      fileInputRef.current.click();
    }
  };

  // Handle drag and drop
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files);
      handleFileUpload(files);
    }
  };

  // Handle link submission
  const handleLinkSubmit = () => {
    if (linkInput.trim()) {
      console.log('Link added:', linkInput);
      setAttachedLinks(prev => [...prev, linkInput.trim()]);
      setLinkInput('');
    }
  };

  // Handle file processing completion
  const handleFileProcessingComplete = async (processingResults) => {
    console.log('File processing completed:', processingResults);

    // Extract successfully processed files
    let processedFiles = [];
    let combinedMarkdown = '';
    
    // Check if we have multiple files processed
    if (processingResults.results && Array.isArray(processingResults.results)) {
      // Multiple files
      processedFiles = processingResults.results.filter(r => r.success);
      combinedMarkdown = processingResults.combinedMarkdown || '';
    } else if (processingResults.success) {
      // Single file
      processedFiles = [processingResults];
      combinedMarkdown = processingResults.markdownContent || '';
    }
    
    if (processedFiles.length > 0) {
      // Store processed files with their markdown content
      const filesWithContent = processedFiles.map(file => ({
        ...file,
        markdownContent: file.markdownContent || file.extractedText
      }));
      
      setUploadedFiles(prev => [...prev, ...filesWithContent]);
      
      // Store combined markdown for later use
      window.processedMarkdown = combinedMarkdown || processedFiles[0].markdownContent;
    }

    // Clear the files to process
    setFilesToProcess([]);
    setShowFileProcessor(false);
  };

  // Handle file processing errors
  const handleFileProcessingError = (errors) => {
    console.error('File processing errors:', errors);
    setFilesToProcess([]);
    setShowFileProcessor(false);
  };

  // Handle main submission
  const handleSubmit = async () => {
    const hasContent = uploadedFiles.length > 0 || attachedLinks.length > 0;
    
    if (hasContent && onFilesSubmit) {
      // Prepare the submission data
      const submissionData = {
        files: uploadedFiles,
        links: attachedLinks,
        markdownContent: window.processedMarkdown || null,
        hasProcessedContent: !!window.processedMarkdown
      };
      
      // Call the parent handler
      onFilesSubmit(submissionData);
    }
  };

  // Remove attached file
  const removeFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Remove attached link
  const removeLink = (index) => {
    setAttachedLinks(prev => prev.filter((_, i) => i !== index));
  };

  const hasContent = uploadedFiles.length > 0 || attachedLinks.length > 0;

  return (
    <div className="file-upload-container">
      <div className="input-method-card">
        <div className="input-method-header">
          <div className="input-method-icon">📁</div>
          <h3>Upload Files</h3>
          <p>Upload documents, images, or add links to learn from</p>
        </div>

        {/* Drag and Drop Area */}
        <div 
          className={`file-drop-zone ${dragActive ? 'drag-active' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={handleDropZoneClick}
        >
          <div className="drop-zone-content">
            <div className="upload-icon">📤</div>
            <p>Drag and drop files here, or click to browse</p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileInputChange}
              className="hidden-file-input"
              disabled={disabled}
            />
            <div className="supported-formats">
              <span>Supported: PDF, Images, Documents</span>
            </div>
          </div>
        </div>

        {/* Link Input */}
        <div className="link-input-section">
          <div className="link-input-group">
            <input
              type="url"
              placeholder="Or paste a link here..."
              value={linkInput}
              onChange={(e) => setLinkInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLinkSubmit()}
              className="link-input-field"
              disabled={disabled}
            />
            <button
              onClick={handleLinkSubmit}
              className="link-add-button"
              disabled={!linkInput.trim() || disabled}
            >
              Add Link
            </button>
          </div>
        </div>

        {/* Attached Files Display */}
        {hasContent && (
          <div className="attachments-display">
            <h4>Attached Content:</h4>
            <div className="attachments-list">
              {uploadedFiles.map((file, index) => (
                <div key={`file-${index}`} className="attachment-item">
                  <span className="attachment-icon">
                    {file.fileName ? '📄' : (file.type === 'application/pdf' ? '📄' : '🖼️')}
                  </span>
                  <span className="attachment-name">
                    {file.fileName || file.name}
                    {file.processingMethod && (
                      <span className="processing-badge">{file.processingMethod}</span>
                    )}
                  </span>
                  <button
                    onClick={() => removeFile(index)}
                    className="remove-attachment"
                    disabled={disabled}
                  >
                    ✕
                  </button>
                </div>
              ))}
              {attachedLinks.map((link, index) => (
                <div key={`link-${index}`} className="attachment-item">
                  <span className="attachment-icon">🔗</span>
                  <span className="attachment-name">{link}</span>
                  <button
                    onClick={() => removeLink(index)}
                    className="remove-attachment"
                    disabled={disabled}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            
            <button
              onClick={handleSubmit}
              className="files-submit-button"
              disabled={!hasContent || disabled}
            >
              Start Learning from Files
            </button>
          </div>
        )}

        {/* File Processing Component */}
        {showFileProcessor && filesToProcess.length > 0 && (
          <FileProcessor
            files={filesToProcess}
            onComplete={handleFileProcessingComplete}
            onError={handleFileProcessingError}
          />
        )}
      </div>
    </div>
  );
};

export default FileUpload;

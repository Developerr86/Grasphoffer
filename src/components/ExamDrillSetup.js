import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import FileProcessor from './FileProcessor';
import NeoButton from './ui/NeoButton';
import './ExamDrillSetup.css';
import checkIcon from '../assets/icons/green-tick.PNG';
import treeIcon from '../assets/icons/knowledge-tree-icon.PNG';

const ExamDrillSetup = ({ onStartDrill }) => {
  const { user } = useAuth();
  const [papers, setPapers] = useState([]);
  const [selectedPapers, setSelectedPapers] = useState([]);
  const [filesToProcess, setFilesToProcess] = useState([]);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef(null);

  // Load previously uploaded papers from Supabase storage on mount
  useEffect(() => {
    if (user) {
      loadExistingPapers();
    }
  }, [user]);

  const loadExistingPapers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .list(user.id, {
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) {
        console.error('Error loading papers:', error);
      } else if (data) {
        const existingPapers = data
          .filter(file => file.name.endsWith('.md'))
          .map(file => ({
            id: file.id || file.name,
            fileName: file.name.replace(/^\d+_/, '').replace(/\.md$/, ''),
            storagePath: `${user.id}/${file.name}`,
            createdAt: file.created_at,
            isExisting: true
          }));
        setPapers(existingPapers);
      }
    } catch (err) {
      console.error('Error fetching papers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files).filter(
      f => f.type === 'application/pdf'
    );
    if (files.length > 0) {
      setFilesToProcess(files);
    }
    // Reset file input so the same file can be re-selected
    event.target.value = '';
  };

  const handleProcessingComplete = (resultData) => {
    // Handle both single and multi-file results
    let processedFiles = [];
    if (resultData.results && Array.isArray(resultData.results)) {
      processedFiles = resultData.results.filter(r => r.success);
    } else if (resultData.success) {
      processedFiles = [resultData];
    }

    const newPapers = processedFiles.map((f, i) => ({
      id: `paper-${Date.now()}-${i}`,
      fileName: f.fileName || `Paper ${papers.length + i + 1}`,
      storagePath: f.storageInfo?.path || '',
      markdownContent: f.markdownContent,
      markdownUrl: f.markdownUrl,
      isExisting: false
    }));

    setPapers(prev => [...newPapers, ...prev]);
    setFilesToProcess([]);
  };

  const togglePaperSelection = (paperId) => {
    setSelectedPapers(prev =>
      prev.includes(paperId)
        ? prev.filter(id => id !== paperId)
        : [...prev, paperId]
    );
  };

  const handleStartDrill = () => {
    const selected = papers.filter(p => selectedPapers.includes(p.id));
    onStartDrill({ selectedPapers: selected });
  };

  return (
    <div className="exam-drill-setup">
      <div className="papers-section">
        <h3 className="papers-list-title">Your Question Papers</h3>

        {loading ? (
          <div className="papers-loading">
            <p>Loading your papers...</p>
          </div>
        ) : papers.length === 0 ? (
          <div className="no-papers-message">
            <p>No question papers uploaded yet. Upload PDFs below to get started.</p>
          </div>
        ) : (
          <div className="papers-grid">
            {papers.map(paper => (
              <div
                key={paper.id}
                className={`paper-item ${selectedPapers.includes(paper.id) ? 'selected' : ''}`}
                onClick={() => togglePaperSelection(paper.id)}
              >
                <div className="paper-checkbox">
                  {selectedPapers.includes(paper.id) && (
                    <img src={checkIcon} alt="Selected" style={{ width: '16px', height: '16px' }} />
                  )}
                </div>
                <img src={treeIcon} alt="PDF" style={{ width: '24px', height: '24px' }} className="paper-icon" />
                <span className="paper-name">{paper.fileName}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload section */}
      <div className="upload-section">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf"
          onChange={handleFileSelect}
          className="hidden-file-input"
        />
        <NeoButton variant="outline" onClick={() => fileInputRef.current?.click()}>
          Upload Question Papers (PDF)
        </NeoButton>
      </div>

      {/* File processor - shows progress when processing */}
      {filesToProcess.length > 0 && (
        <div className="processor-section">
          <FileProcessor
            files={filesToProcess}
            onComplete={handleProcessingComplete}
            onError={(errors) => {
              console.error('Processing errors:', errors);
              setFilesToProcess([]);
            }}
          />
        </div>
      )}

      {/* Start button */}
      <div className="drill-start-section">
        <NeoButton
          size="large"
          onClick={handleStartDrill}
          disabled={selectedPapers.length === 0}
          fullWidth
        >
          Start Exam Drill ({selectedPapers.length} paper{selectedPapers.length !== 1 ? 's' : ''} selected)
        </NeoButton>
      </div>
    </div>
  );
};

export default ExamDrillSetup;

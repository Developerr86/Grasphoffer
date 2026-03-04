import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { checkIfAnswersExist, deletePaper } from '../lib/examDrillService';
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
  const [deleteConfirm, setDeleteConfirm] = useState(null); // paperId to confirm delete
  const [deleting, setDeleting] = useState(null); // paperId being deleted
  const fileInputRef = useRef(null);

  const loadExistingPapers = useCallback(async () => {
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
        // Only show source papers (not answers_ files)
        const sourcePapers = data.filter(
          (file) => file.name.endsWith('.md') && !file.name.startsWith('answers_')
        );

        // Check each paper for existing answers
        const papersWithStatus = await Promise.all(
          sourcePapers.map(async (file) => {
            const storagePath = `${user.id}/${file.name}`;
            const hasAnswers = await checkIfAnswersExist(storagePath);
            return {
              id: file.id || file.name,
              fileName: file.name.replace(/^\d+_/, '').replace(/\.md$/, ''),
              rawName: file.name,
              storagePath,
              createdAt: file.created_at,
              isExisting: true,
              hasAnswers,
            };
          })
        );

        setPapers(papersWithStatus);
      }
    } catch (err) {
      console.error('Error fetching papers:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadExistingPapers();
    }
  }, [user, loadExistingPapers]);

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files).filter(
      (f) => f.type === 'application/pdf'
    );
    if (files.length > 0) {
      setFilesToProcess(files);
    }
    event.target.value = '';
  };

  const handleProcessingComplete = (resultData) => {
    let processedFiles = [];
    if (resultData.results && Array.isArray(resultData.results)) {
      processedFiles = resultData.results.filter((r) => r.success);
    } else if (resultData.success) {
      processedFiles = [resultData];
    }

    const newPapers = processedFiles.map((f, i) => ({
      id: `paper-${Date.now()}-${i}`,
      fileName: f.fileName || `Paper ${papers.length + i + 1}`,
      rawName: '',
      storagePath: f.storageInfo?.path || '',
      markdownContent: f.markdownContent,
      markdownUrl: f.markdownUrl,
      isExisting: false,
      hasAnswers: false,
    }));

    setPapers((prev) => [...newPapers, ...prev]);
    setFilesToProcess([]);
  };

  const togglePaperSelection = (paper) => {
    if (paper.hasAnswers) return; // Already drilled – cannot select
    setSelectedPapers((prev) =>
      prev.includes(paper.id)
        ? prev.filter((id) => id !== paper.id)
        : [...prev, paper.id]
    );
  };

  const handleDeleteRequest = (e, paperId) => {
    e.stopPropagation();
    setDeleteConfirm(paperId);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    const paper = papers.find((p) => p.id === deleteConfirm);
    if (!paper) return;

    setDeleting(deleteConfirm);
    setDeleteConfirm(null);

    try {
      await deletePaper(paper.storagePath);
      setPapers((prev) => prev.filter((p) => p.id !== paper.id));
      setSelectedPapers((prev) => prev.filter((id) => id !== paper.id));
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setDeleting(null);
    }
  };

  const handleStartDrill = () => {
    const selected = papers.filter((p) => selectedPapers.includes(p.id));
    onStartDrill({ selectedPapers: selected });
  };

  return (
    <div className="exam-drill-setup">
      <div className="papers-section">
        <h3 className="papers-list-title">Your Question Papers</h3>

        {loading ? (
          <div className="papers-loading">
            <div className="setup-spinner" />
            <p>Loading your papers…</p>
          </div>
        ) : papers.length === 0 ? (
          <div className="no-papers-message">
            <p>No question papers uploaded yet. Upload PDFs below to get started.</p>
          </div>
        ) : (
          <div className="papers-grid">
            {papers.map((paper) => {
              const isSelected = selectedPapers.includes(paper.id);
              const isBeingDeleted = deleting === paper.id;

              return (
                <div
                  key={paper.id}
                  className={`paper-item ${isSelected ? 'selected' : ''} ${paper.hasAnswers ? 'drilled' : ''} ${isBeingDeleted ? 'deleting' : ''}`}
                  onClick={() => togglePaperSelection(paper)}
                >
                  {/* Selection checkbox */}
                  <div className="paper-checkbox">
                    {isSelected && (
                      <img src={checkIcon} alt="Selected" style={{ width: '16px', height: '16px' }} />
                    )}
                    {paper.hasAnswers && <span className="drilled-badge">✓ Drilled</span>}
                  </div>

                  <img
                    src={treeIcon}
                    alt="Paper"
                    style={{ width: '24px', height: '24px' }}
                    className="paper-icon"
                  />
                  <span className="paper-name">{paper.fileName}</span>

                  {/* Delete button */}
                  <button
                    className="paper-delete-btn"
                    onClick={(e) => handleDeleteRequest(e, paper.id)}
                    title="Delete paper"
                    disabled={isBeingDeleted}
                  >
                    {isBeingDeleted ? '…' : '🗑'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      {deleteConfirm && (
        <div className="delete-confirm-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="delete-confirm-box" onClick={(e) => e.stopPropagation()}>
            <p>
              Delete <strong>{papers.find((p) => p.id === deleteConfirm)?.fileName}</strong>?
              <br />
              <span className="delete-warn">This will also delete its saved answers.</span>
            </p>
            <div className="delete-confirm-actions">
              <button className="delete-cancel-btn" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </button>
              <button className="delete-confirm-btn" onClick={handleDeleteConfirm}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* File processor – shows progress when processing */}
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

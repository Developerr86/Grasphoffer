import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '../context/AuthContext';
import {
  fetchPaperContent,
  parseQuestionsFromPaper,
  generateMCQAnswers,
  generateLongAnswers,
  saveAnswersToStorage,
  loadAnswersFromStorage,
  checkIfAnswersExist,
} from '../lib/examDrillService';
import './ExamDrillSession.css';

// ─── Phase constants ─────────────────────────────────────────────────────────
const PHASE = {
  IDLE: 'idle',
  FETCHING: 'fetching',
  PARSING: 'parsing',
  GENERATING: 'generating',
  SAVING: 'saving',
  DONE: 'done',
  REVISIT: 'revisit',
  ERROR: 'error',
};

// ─── Individual question card ────────────────────────────────────────────────
const QuestionCard = ({ question, index, isGenerating }) => {
  const [open, setOpen] = useState(false);
  const answerRef = useRef(null);
  const hasAnswer = question.answer && question.answer.trim().length > 0;
  // Auto-open as soon as the answer arrives (only once)
  const prevHasAnswer = useRef(false);
  useEffect(() => {
    if (hasAnswer && !prevHasAnswer.current) {
      prevHasAnswer.current = true;
      // Don't auto-open — let user choose — but mark card as ready
    }
  }, [hasAnswer]);

  return (
    <div className={`question-card ${question.type} ${!hasAnswer && isGenerating ? 'pending' : ''} ${hasAnswer ? 'answered' : ''}`}>
      {/* Header */}
      <div className="question-header">
        <span className="question-number">Q{index + 1}</span>
        <span className={`question-type-badge ${question.type}`}>
          {question.type === 'mcq' ? 'MCQ' : 'Long Form'}
        </span>
        {!hasAnswer && isGenerating && (
          <span className="generating-pill">
            <span className="generating-dot" />
            Generating…
          </span>
        )}
        {hasAnswer && (
          <span className="ready-pill">✓ Ready</span>
        )}
      </div>

      {/* Question text */}
      <div className="question-text">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{question.text}</ReactMarkdown>
      </div>

      {/* MCQ options */}
      {question.type === 'mcq' && question.options && question.options.length > 0 && (
        <div className="mcq-options">
          {question.options.map((opt, i) => (
            <div key={i} className="mcq-option">{opt}</div>
          ))}
        </div>
      )}

      {/* Collapsible answer */}
      <div className={`answer-accordion ${open ? 'open' : ''}`}>
        {hasAnswer ? (
          <>
            <button
              className="answer-toggle"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
            >
              <span>{open ? '▲ Hide Answer' : '▼ Show Answer'}</span>
            </button>
            <div
              className="answer-body-wrapper"
              style={{
                maxHeight: open
                  ? (answerRef.current ? answerRef.current.scrollHeight + 'px' : '2000px')
                  : '0px',
              }}
            >
              <div className="answer-body" ref={answerRef}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{question.answer}</ReactMarkdown>
              </div>
            </div>
          </>
        ) : (
          /* Skeleton shimmer while answer is being generated */
          <div className="answer-skeleton">
            <div className="skeleton-line wide" />
            <div className="skeleton-line medium" />
            <div className="skeleton-line narrow" />
          </div>
        )}
      </div>
    </div>
  );
};

// ─── ExamDrillSession ────────────────────────────────────────────────────────
const ExamDrillSession = ({ papers = [], onBack }) => {
  const { user } = useAuth();
  const [phase, setPhase] = useState(PHASE.IDLE);
  const [questions, setQuestions] = useState([]);
  const [progress, setProgress] = useState({ current: 0, total: 0, label: '' });
  const [errorMsg, setErrorMsg] = useState('');
  const [paperTitle, setPaperTitle] = useState('');
  const [savedToast, setSavedToast] = useState(false);
  const hasStarted = useRef(false);

  const paper = papers && papers.length > 0 ? papers[0] : null;

  // ── Helper: update a single question by id ──────────────────────────────
  const patchQuestion = useCallback((id, patch) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, ...patch } : q))
    );
  }, []);

  // ── Main processing pipeline ────────────────────────────────────────────
  const runDrill = useCallback(async () => {
    if (!paper || !user) return;

    setPaperTitle(paper.fileName || 'Exam Paper');
    const storagePath = paper.storagePath;

    try {
      // ── Review mode: questions already loaded ──
      if (paper._savedQuestions && paper._savedQuestions.length > 0) {
        setQuestions(paper._savedQuestions);
        setPhase(PHASE.REVISIT);
        return;
      }

      // ── Check storage for pre-existing answers ──
      const alreadyDone = await checkIfAnswersExist(storagePath);
      if (alreadyDone) {
        setPhase(PHASE.FETCHING);
        const saved = await loadAnswersFromStorage(storagePath);
        setQuestions(saved);
        setPhase(PHASE.REVISIT);
        return;
      }

      // ── FETCHING: download the paper markdown ──
      setPhase(PHASE.FETCHING);
      let mdContent = paper.markdownContent;
      if (!mdContent) {
        mdContent = await fetchPaperContent(storagePath);
      }

      // ── PARSING: identify all questions ──
      setPhase(PHASE.PARSING);
      setProgress({ current: 0, total: 0, label: 'Identifying questions in the paper…' });
      const { mcqQuestions, longQuestions } = await parseQuestionsFromPaper(mdContent);

      const totalAnswers = (mcqQuestions.length > 0 ? 1 : 0) + longQuestions.length;
      let completedAnswers = 0;

      // ── Immediately populate the question cards (no answers yet) ──
      // This lets the user see all questions right away as skeletons.
      const initialQuestions = [
        ...mcqQuestions.map((q) => ({ ...q, type: 'mcq', answer: '' })),
        ...longQuestions.map((q) => ({ ...q, type: 'long', answer: '' })),
      ];
      setQuestions(initialQuestions);

      // ── GENERATING ──
      setPhase(PHASE.GENERATING);

      // MCQ batch call (all MCQs in one API call)
      if (mcqQuestions.length > 0) {
        setProgress({
          current: 0,
          total: totalAnswers,
          label: `Answering ${mcqQuestions.length} MCQ question${mcqQuestions.length !== 1 ? 's' : ''}…`,
        });

        const mcqAnswers = await generateMCQAnswers(mcqQuestions);

        // Patch each MCQ card with its answer as soon as the batch returns
        mcqQuestions.forEach((q) => {
          if (mcqAnswers[q.id]) {
            patchQuestion(q.id, { answer: mcqAnswers[q.id] });
          }
        });

        completedAnswers += 1;
        setProgress({
          current: completedAnswers,
          total: totalAnswers,
          label: `MCQs done. Starting long-form answers…`,
        });
      }

      // Long-form questions one at a time with incremental card updates
      if (longQuestions.length > 0) {
        await generateLongAnswers(longQuestions, (current, total, qId, answer) => {
          // Patch just the card that just finished — user sees it immediately
          patchQuestion(qId, { answer });

          completedAnswers += 1;
          setProgress({
            current: (mcqQuestions.length > 0 ? 1 : 0) + completedAnswers,
            total: totalAnswers,
            label: `Long-form answer ${current} of ${total} ready…`,
          });
        });
      }

      // ── Build the final snapshot for saving ──
      // We read the latest state via a functional updater to avoid stale closure
      setQuestions((current) => {
        const finalQuestions = current; // already fully patched by this point

        // Fire-and-forget save (async IIFE – don't block UI)
        (async () => {
          try {
            setPhase(PHASE.SAVING);
            setProgress({ current: totalAnswers, total: totalAnswers, label: 'Saving answers…' });
            await saveAnswersToStorage(storagePath, finalQuestions);
            setSavedToast(true);
            setTimeout(() => setSavedToast(false), 4000);
          } catch (e) {
            console.error('Save failed:', e);
          } finally {
            setPhase(PHASE.DONE);
          }
        })();

        return finalQuestions;
      });

    } catch (err) {
      console.error('Exam drill error:', err);
      setErrorMsg(err.message || 'An unexpected error occurred.');
      setPhase(PHASE.ERROR);
    }
  }, [paper, user, patchQuestion]);

  useEffect(() => {
    if (!hasStarted.current) {
      hasStarted.current = true;
      runDrill();
    }
  }, [runDrill]);

  // ── Helpers ─────────────────────────────────────────────────────────────
  const progressPct = progress.total > 0
    ? Math.round((progress.current / progress.total) * 100)
    : 0;

  const isLoading = [PHASE.IDLE, PHASE.FETCHING, PHASE.PARSING].includes(phase);
  const isGenerating = phase === PHASE.GENERATING || phase === PHASE.SAVING;
  // Show questions whenever we have any — even while still generating
  const showQuestions = questions.length > 0;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="eds-container">
      {/* ── Header ── */}
      <header className="eds-header">
        <button className="eds-back-btn" onClick={onBack} title="Back to Dashboard">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Dashboard
        </button>
        <div className="eds-title">
          <span className="eds-badge">Exam Drill</span>
          <h1 className="eds-paper-title">{paperTitle || 'Loading…'}</h1>
        </div>
        {phase === PHASE.REVISIT && (
          <span className="eds-revisit-tag">Revisiting saved session</span>
        )}
      </header>

      {/* ── Saved toast ── */}
      {savedToast && (
        <div className="eds-toast">
          ✅ Answers saved! You can revisit this session anytime.
        </div>
      )}

      {/* ── Loading spinner (fetching + parsing only) ── */}
      {isLoading && (
        <div className="eds-loading-state">
          <div className="eds-spinner" />
          <p className="eds-loading-label">
            {phase === PHASE.FETCHING && 'Loading question paper…'}
            {phase === PHASE.PARSING && 'Identifying questions in the paper…'}
            {phase === PHASE.IDLE && 'Starting…'}
          </p>
        </div>
      )}

      {/* ── Progress bar (shown above the list while generating) ── */}
      {isGenerating && (
        <div className="eds-progress-section">
          <div className="eds-progress-bar-track">
            <div
              className="eds-progress-bar-fill"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="eds-progress-label">
            {progress.label} ({progressPct}%)
          </p>
        </div>
      )}

      {/* ── Error state ── */}
      {phase === PHASE.ERROR && (
        <div className="eds-error-state">
          <span className="eds-error-icon">⚠️</span>
          <p className="eds-error-msg">{errorMsg}</p>
          <button className="eds-retry-btn" onClick={() => { hasStarted.current = false; setQuestions([]); runDrill(); }}>
            Retry
          </button>
          <button className="eds-back-link" onClick={onBack}>Back to Dashboard</button>
        </div>
      )}

      {/* ── Questions list – rendered as soon as parsing is done ── */}
      {showQuestions && (
        <main className="eds-questions-area">
          {phase === PHASE.REVISIT && (
            <div className="eds-revisit-banner">
              <span>📂</span> Loaded from saved session — no API calls needed.
            </div>
          )}

          <div className="eds-questions-meta">
            <span>{questions.length} question{questions.length !== 1 ? 's' : ''}</span>
            <span>·</span>
            <span>{questions.filter((q) => q.type === 'mcq').length} MCQ</span>
            <span>·</span>
            <span>{questions.filter((q) => q.type !== 'mcq').length} Long Form</span>
            {isGenerating && (
              <>
                <span>·</span>
                <span className="eds-answered-count">
                  {questions.filter((q) => q.answer).length} answered
                </span>
              </>
            )}
          </div>

          <div className="eds-questions-list">
            {questions.map((q, idx) => (
              <QuestionCard
                key={q.id || idx}
                question={q}
                index={idx}
                isGenerating={isGenerating}
              />
            ))}
          </div>
        </main>
      )}

      {/* ── Empty state (no questions found after parsing) ── */}
      {phase === PHASE.DONE && questions.length === 0 && (
        <div className="eds-empty-state">
          <p>No questions were identified in this paper. The paper may not be a question paper, or the OCR quality may be too low.</p>
          <button className="eds-back-link" onClick={onBack}>Back to Dashboard</button>
        </div>
      )}
    </div>
  );
};

export default ExamDrillSession;

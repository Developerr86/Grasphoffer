import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserTopics, generatePodcastScript, generatePodcastAudio } from '../lib/podcastService';
import './PodcastPage.css';

// Icons
import podcastIcon from '../assets/icons/podcast.png';
import stopwatchIcon from '../assets/icons/Stop_watch-logo.PNG';
import checkIcon from '../assets/icons/green-tick.PNG';
import targetIcon from '../assets/icons/Target-board.PNG';
import homeIcon from '../assets/icons/home.png';
import treeIcon from '../assets/icons/knowledge-tree-icon.PNG';

const PodcastPage = ({ onBack }) => {
  const { user } = useAuth();
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [podcastScript, setPodcastScript] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(null);
  const [audioReady, setAudioReady] = useState(false);
  const [error, setError] = useState(null);
  const [enableAudioSave, setEnableAudioSave] = useState(true); // Toggle for saving audio files

  // Load user topics on component mount
  useEffect(() => {
    loadUserTopics();
  }, [user]);

  const loadUserTopics = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user?.id) {
        setError('User not authenticated');
        return;
      }

      const userTopics = await getUserTopics(user.id);
      setTopics(userTopics);

      if (userTopics.length === 0) {
        setError('No topics found. Complete some learning sessions or upload documents first.');
      }

    } catch (error) {
      console.error('Error loading topics:', error);
      setError('Failed to load topics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTopicSelect = (topic) => {
    setSelectedTopic(topic);
    setPodcastScript(null);
    setAudioReady(false);
    setError(null);
  };

  const generatePodcast = async () => {
    if (!selectedTopic) return;

    try {
      setIsGenerating(true);
      setError(null);

      // Enhanced initial message with time estimate
      setGenerationProgress({
        progress: 5,
        status: <span><img src={podcastIcon} alt="Podcast" style={{ width: '24px', height: '24px', verticalAlign: 'middle' }} /> Starting podcast generation... This may take 2-3 minutes for high-quality audio.</span>,
        timeEstimate: 'Estimated time: 2-3 minutes'
      });

      // Generate script
      setGenerationProgress({
        progress: 10,
        status: <span><img src={treeIcon} alt="Script" style={{ width: '24px', height: '24px', verticalAlign: 'middle' }} /> Generating engaging podcast script with Gemini AI...</span>,
        timeEstimate: 'This step usually takes 30-60 seconds'
      });

      const script = await generatePodcastScript(selectedTopic.title, user.id);
      setPodcastScript(script);

      setGenerationProgress({
        progress: 30,
        status: <span><img src={podcastIcon} alt="Audio" style={{ width: '24px', height: '24px', verticalAlign: 'middle' }} /> Script complete! Now generating professional audio with Gemini TTS...</span>,
        timeEstimate: 'Audio generation may take 1-2 minutes - please be patient'
      });

      // Generate audio using Gemini TTS
      const audioResult = await generatePodcastAudio(script, (progress) => {
        setGenerationProgress({
          progress: 30 + (progress.progress * 0.65),
          status: progress.status,
          currentSegment: progress.currentSegment,
          totalSegments: progress.totalSegments,
          timeEstimate: 'Processing high-quality audio... almost done!'
        });
      });

      // Store audio URL for playback
      setPodcastScript({
        ...script,
        audioUrl: audioResult.audioUrl,
        audioBlob: audioResult.audioBlob
      });

      // Save audio file locally if enabled
      if (enableAudioSave && audioResult.audioBlob) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `podcast-${selectedTopic.title.replace(/[^a-zA-Z0-9]/g, '_')}-${timestamp}.wav`;
        saveAudioFile(audioResult.audioBlob, filename);

        setGenerationProgress({
          progress: 98,
          status: <span><img src={targetIcon} alt="Save" style={{ width: '24px', height: '24px', verticalAlign: 'middle' }} /> Saving audio file locally...</span>,
          timeEstimate: null
        });

        // Small delay to show the saving message
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      setGenerationProgress({
        progress: 100,
        status: <span><img src={checkIcon} alt="Ready" style={{ width: '24px', height: '24px', verticalAlign: 'middle' }} /> Professional podcast audio ready! Click play to listen.</span>,
        timeEstimate: null
      });
      setAudioReady(true);

      // Clear progress after a delay
      setTimeout(() => {
        setGenerationProgress(null);
      }, 3000);

    } catch (error) {
      console.error('Error generating podcast:', error);
      setError(error.message);
      setGenerationProgress(null);
    } finally {
      setIsGenerating(false);
    }
  };

  const playPodcast = () => {
    if (!podcastScript || !podcastScript.audioUrl) {
      console.error('No audio available to play');
      setError('No audio available. Please generate the podcast first.');
      return;
    }

    console.log('🎵 Playing high-quality Gemini TTS audio...');
    console.log('Audio URL:', podcastScript.audioUrl);
    console.log('Audio blob size:', podcastScript.audioBlob?.size, 'bytes');
    console.log('Audio MIME type:', podcastScript.mimeType || 'unknown');

    // Create audio element with multiple format support
    const audio = new Audio();

    // Set up event listeners before setting src
    audio.onloadstart = () => {
      console.log('🔄 Audio loading started...');
    };

    audio.oncanplay = () => {
      console.log('✅ Audio ready to play');
    };

    audio.onplay = () => {
      console.log('🎙️ Podcast playback started');
    };

    audio.onended = () => {
      console.log('🎉 Podcast playback completed');
    };

    audio.onerror = (error) => {
      console.error('❌ Audio playback error:', error);
      console.error('Audio error details:', {
        error: audio.error,
        networkState: audio.networkState,
        readyState: audio.readyState,
        src: audio.src
      });

      // Try alternative playback method
      tryAlternativePlayback();
    };

    audio.onabort = () => {
      console.warn('⚠️ Audio playback aborted');
    };

    audio.onstalled = () => {
      console.warn('⚠️ Audio playback stalled');
    };

    // Store reference for stop functionality
    window.currentPodcastAudio = audio;

    // Set the audio source
    audio.src = podcastScript.audioUrl;

    // Attempt to play
    audio.play().catch(error => {
      console.error('❌ Failed to play audio:', error);
      tryAlternativePlayback();
    });

    // Alternative playback method if main method fails
    const tryAlternativePlayback = () => {
      console.log('🔄 Trying alternative playback method...');

      if (podcastScript.audioBlob) {
        try {
          // Create a new blob URL with different MIME type
          const alternativeBlob = new Blob([podcastScript.audioBlob], { type: 'audio/mpeg' });
          const alternativeUrl = URL.createObjectURL(alternativeBlob);

          const alternativeAudio = new Audio(alternativeUrl);

          alternativeAudio.oncanplay = () => {
            console.log('✅ Alternative audio method working');
          };

          alternativeAudio.onerror = () => {
            console.error('❌ Alternative playback also failed');
            setError('Unable to play audio. The audio format may not be supported by your browser. The file has been saved locally if enabled.');
          };

          window.currentPodcastAudio = alternativeAudio;
          alternativeAudio.play();

        } catch (altError) {
          console.error('❌ Alternative playback method failed:', altError);
          setError('Audio playback failed. Please check if your browser supports the audio format.');
        }
      }
    };
  };

  const stopPodcast = () => {
    // Stop current audio if playing
    if (window.currentPodcastAudio) {
      window.currentPodcastAudio.pause();
      window.currentPodcastAudio.currentTime = 0;
      console.log('🛑 Podcast playback stopped');
    }

    // Also cancel any speech synthesis as fallback
    speechSynthesis.cancel();
  };

  const saveAudioFile = (audioBlob, filename) => {
    if (!enableAudioSave) {
      console.log('Audio saving is disabled');
      return;
    }

    try {
      // Create download link
      const url = URL.createObjectURL(audioBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Clean up the URL object
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      console.log(`✅ Audio file saved: ${filename}`);
    } catch (error) {
      console.error('Error saving audio file:', error);
    }
  };

  if (loading) {
    return (
      <div className="podcast-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your topics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="podcast-page">
      <header className="podcast-header">
        <button className="back-to-dashboard" onClick={onBack}>
          <img src={homeIcon} alt="Back" style={{ width: '24px', height: '24px', verticalAlign: 'middle', marginRight: '5px' }} /> Back to Dashboard
        </button>
        <h1><img src={podcastIcon} alt="Podcast" style={{ width: '40px', height: '40px', verticalAlign: 'middle' }} /> AI Podcast Generator</h1>
        <p>Turn your learning topics into engaging podcast conversations</p>
      </header>

      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={loadUserTopics} className="retry-button">
            Try Again
          </button>
        </div>
      )}

      {!selectedTopic ? (
        <div className="topics-grid">
          <h2>Choose a Topic</h2>
          <div className="topics-container">
            {topics.map((topic) => (
              <div
                key={topic.id}
                className="topic-card"
                onClick={() => handleTopicSelect(topic)}
              >
                <div className="topic-header">
                  <h3>{topic.title}</h3>
                  <span className="topic-type">{topic.type}</span>
                </div>
                <div className="topic-meta">
                  <span className="topic-date">
                    {new Date(topic.date).toLocaleDateString()}
                  </span>
                  {topic.score && (
                    <span className="topic-score">Score: {topic.score}%</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="podcast-generator">
          <div className="selected-topic">
            <button
              className="back-button"
              onClick={() => setSelectedTopic(null)}
            >
              ← Back to Topics
            </button>
            <h2><img src={podcastIcon} alt="Podcast" style={{ width: '32px', height: '32px', verticalAlign: 'middle' }} /> {selectedTopic.title}</h2>
            <p className="topic-description">
              Generate an AI podcast conversation about this topic
            </p>
          </div>

          {!podcastScript && !isGenerating && (
            <div className="generate-section">
              <div className="audio-save-toggle">
                <label className="toggle-container">
                  <input
                    type="checkbox"
                    checked={enableAudioSave}
                    onChange={(e) => setEnableAudioSave(e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                  <span className="toggle-label">
                    <img src={targetIcon} alt="Save" style={{ width: '24px', height: '24px', verticalAlign: 'middle' }} /> Save audio file locally after generation
                  </span>
                </label>
              </div>

              <button
                className="generate-button"
                onClick={generatePodcast}
                disabled={isGenerating}
              >
                Generate Podcast
              </button>
            </div>
          )}

          {generationProgress && (
            <div className="progress-container">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${generationProgress.progress}%` }}
                ></div>
              </div>
              <p className="progress-text">{generationProgress.status}</p>
              {generationProgress.timeEstimate && (
                <p className="progress-time-estimate">
                  <img src={stopwatchIcon} alt="Time" style={{ width: '24px', height: '24px', verticalAlign: 'middle' }} /> {generationProgress.timeEstimate}
                </p>
              )}
              {generationProgress.currentSegment && (
                <p className="progress-detail">
                  Processing segment {generationProgress.currentSegment} of {generationProgress.totalSegments}
                </p>
              )}
              <div className="progress-tips">
                <p><img src={targetIcon} alt="Tip" style={{ width: '24px', height: '24px', verticalAlign: 'middle' }} /> <strong>Tip:</strong> We're creating broadcast-quality audio with different voices for each speaker</p>
              </div>
            </div>
          )}

          {podcastScript && (
            <div className="podcast-player">
              <div className="podcast-info">
                <h3>{podcastScript.title}</h3>
                <p className="podcast-duration">
                  Estimated Duration: {podcastScript.duration}
                </p>
                <div className="speakers-info">
                  <span className="speaker"><img src={podcastIcon} alt="Host" style={{ width: '24px', height: '24px', verticalAlign: 'middle' }} /> {podcastScript.speakers.host}</span>
                  <span className="speaker"><img src={treeIcon} alt="Expert" style={{ width: '24px', height: '24px', verticalAlign: 'middle' }} /> {podcastScript.speakers.expert}</span>
                </div>
              </div>

              <div className="audio-controls">
                <button
                  className="play-button"
                  onClick={playPodcast}
                  disabled={!audioReady || isGenerating}
                >
                  Play High-Quality Audio
                </button>
                <button
                  className="stop-button"
                  onClick={stopPodcast}
                >
                  Stop
                </button>
              </div>

              {podcastScript.keyTakeaways && (
                <div className="key-takeaways">
                  <h4>Key Takeaways:</h4>
                  <ul>
                    {podcastScript.keyTakeaways.map((takeaway, index) => (
                      <li key={index}>{takeaway}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PodcastPage;

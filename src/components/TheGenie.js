import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { prepareLearningContext, callTheGenie } from '../lib/theGenieService';
import MagicLoader from './MagicLoader';
import './TheGenie.css';

const TheGenie = ({ onClose }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [contextReady, setContextReady] = useState(false);
  const [contextInfo, setContextInfo] = useState('');
  const [weakConcepts, setWeakConcepts] = useState([]);
  const [processingStatus, setProcessingStatus] = useState(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize context when component mounts
  useEffect(() => {
    if (user) {
      prepareContext();
    }
  }, [user]);

  // Prepare context by combining user's documents and flashcards
  const prepareContext = async () => {
    try {
      setIsLoading(true);
      
      // Use the service to prepare context
      const result = await prepareLearningContext(user.id);
      
      if (result.success) {
        setContextInfo(result.contextContent);
        setContextReady(true);
        
        // Extract weak concepts for enhanced responses
        if (result.metadata.struggleCount > 0) {
          const struggles = result.contextContent.match(/\*\*(.*?)\*\*/g)?.map(s => s.replace(/\*\*/g, '')) || [];
          setWeakConcepts(struggles);
        }
        
        // Add welcome message with context summary
        setMessages([
          {
            id: 1,
            type: 'genie',
            content: `🧞‍♂️ **TheGenie is ready to help!**\n\nI have access to:\n• ${result.metadata.documentCount} uploaded documents\n• ${result.metadata.flashcardCount} generated flashcards\n• ${result.metadata.struggleCount} areas you're working on\n• ${result.metadata.sessionCount} learning sessions\n\nAsk me anything about your learning materials, or get help with concepts you find challenging!`,
            timestamp: new Date()
          }
        ]);
      } else {
        throw new Error(result.error || 'Failed to prepare context');
      }

    } catch (error) {
      console.error('Error preparing context:', error);
      setMessages([
        {
          id: 1,
          type: 'genie',
          content: '🧞‍♂️ **TheGenie is here to help!**\n\nI\'m having trouble accessing your learning materials right now, but I can still help with general questions. What would you like to know?',
          timestamp: new Date()
        }
      ]);
      setContextReady(true); // Still allow basic interaction
    } finally {
      setIsLoading(false);
    }
  };

  // Handle progress updates from TheGenie service
  const handleProgressUpdate = (progressData) => {
    setProcessingStatus(progressData);
    
    // Update the thinking message with progress
    setMessages(prev => prev.map(msg => {
      if (msg.type === 'genie' && msg.isThinking) {
        return {
          ...msg,
          content: `🧠 **TheGenie is processing your question...**\n\n**Progress:** ${progressData.progress}%\n**Status:** ${progressData.message}\n\nThis may take a few minutes as I analyze your learning materials and generate a personalized response.`,
          progress: progressData.progress
        };
      }
      return msg;
    }));
  };

  // Send message to TheGenie
  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setProcessingStatus(null);

    try {
      // Add thinking message with initial status
      const thinkingMessage = {
        id: Date.now() + 1,
        type: 'genie',
        content: `🧠 **TheGenie is processing your question...**\n\n**Progress:** 0%\n**Status:** Initializing...\n\nThis may take a few minutes as I analyze your learning materials and generate a personalized response.`,
        timestamp: new Date(),
        isThinking: true,
        progress: 0
      };

      setMessages(prev => [...prev, thinkingMessage]);

      // Call TheGenie service with progress callback
      const response = await callTheGenie(
        inputMessage, 
        contextInfo, 
        weakConcepts, 
        handleProgressUpdate
      );
      
      if (response.success) {
        // Replace thinking message with actual response
        setMessages(prev => prev.map(msg => {
          if (msg.isThinking) {
            return {
              id: msg.id,
              type: 'genie',
              content: response.answer,
              timestamp: new Date(),
              processingTime: response.processingTime
            };
          }
          return msg;
        }));

        // Add processing time info if available
        if (response.processingTime) {
          const timeMessage = {
            id: Date.now() + 2,
            type: 'system',
            content: `⏱️ **Processing completed in ${Math.round(response.processingTime / 1000)} seconds**`,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, timeMessage]);
        }

      } else {
        throw new Error(response.error || 'Failed to get response');
      }

    } catch (error) {
      console.error('Error calling TheGenie:', error);
      
      // Replace thinking message with error
      setMessages(prev => prev.map(msg => {
        if (msg.isThinking) {
          return {
            id: msg.id,
            type: 'genie',
            content: `❌ **I apologize, but I encountered an error:**\n\n${error.message}\n\nPlease try again in a moment, or rephrase your question.`,
            timestamp: new Date()
          };
        }
        return msg;
      }));
    } finally {
      setIsLoading(false);
      setProcessingStatus(null);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Render progress bar for processing status
  const renderProgressBar = () => {
    if (!processingStatus) return null;

    return (
      <div className="progress-container">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${processingStatus.progress}%` }}
          ></div>
        </div>
        <div className="progress-text">
          {processingStatus.progress}% - {processingStatus.message}
        </div>
      </div>
    );
  };

  return (
    <div className="thegenie-overlay">
      <div className="thegenie-container">
        <div className="thegenie-header">
          <h2>🧞‍♂️ TheGenie</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="thegenie-status">
          {!contextReady ? (
            <div className="status-loading">
              <MagicLoader size={24} particleCount={1} speed={1.5} hueRange={[200, 280]} />
              Preparing your learning context...
            </div>
          ) : (
            <div className="status-ready">
              ✅ Ready to help with your learning materials
            </div>
          )}
        </div>

        {renderProgressBar()}

        <div className="messages-container">
          {messages.map((message) => (
            <div key={message.id} className={`message ${message.type}`}>
              <div className="message-content">
                {message.content}
              </div>
              <div className="message-timestamp">
                {message.timestamp.toLocaleTimeString()}
                {message.processingTime && (
                  <span className="processing-time">
                    ⏱️ {Math.round(message.processingTime / 1000)}s
                  </span>
                )}
              </div>
            </div>
          ))}
          
          {isLoading && !processingStatus && (
            <div className="message genie">
              <div className="message-content">
                <span className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </span>
                TheGenie is thinking...
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        <div className="input-container">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask TheGenie anything about your learning materials..."
            disabled={!contextReady || isLoading}
            rows={2}
          />
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || !contextReady || isLoading}
            className="send-button"
          >
            {isLoading ? 'Processing...' : 'Send'}
          </button>
        </div>

        <div className="thegenie-footer">
          <small>
            TheGenie uses your uploaded documents, flashcards, and learning history to provide personalized answers.
            {processingStatus && (
              <span className="processing-note">
                Processing may take 2-5 minutes for complex questions.
              </span>
            )}
          </small>
        </div>
      </div>
    </div>
  );
};

export default TheGenie;

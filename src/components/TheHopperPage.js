import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../context/AuthContext';
import { callTheHopper, prepareLearningContext } from '../lib/theHopperService';
import ForceDirectedGraph from './ForceDirectedGraph';
import './TheHopperPage.css';

const TheHopperPage = ({ onBack }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');

    // Add user message
    const newUserMessage = {
      id: Date.now(),
      text: userMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      console.log('=== THEHOPPER PAGE RAG CALL ===');
      console.log('Question:', userMessage);

      // Prepare learning context for RAG
      const contextResult = await prepareLearningContext(user?.id);

      if (!contextResult.success) {
        throw new Error('Failed to prepare learning context');
      }

      console.log('Context prepared successfully');
      console.log('Stats:', contextResult.Stats);

      // Call RAG backend
      const response = await callTheHopper(
        userMessage,
        contextResult.contextContent,
        [], // weak concepts - could be extracted from context
        contextResult.Stats
      );

      console.log('=== RAG RESPONSE RECEIVED ===');
      console.log('Source:', response.source);
      console.log('Processing Time:', response.processingTime);
      console.log('=== END RAG RESPONSE ===');

      const aiMessage = {
        id: Date.now() + 1,
        text: response.answer,
        sender: 'ai',
        timestamp: new Date(),
        citations: response.citations || [],
        themes: response.themes || '',
        processingTime: response.processingTime,
        source: response.source
      };

      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      console.error('=== THEHOPPER PAGE ERROR ===');
      console.error('Error:', error.message);
      console.error('=== END ERROR ===');

      const errorMessage = {
        id: Date.now() + 1,
        text: `❌ **RAG Backend Error**\n\n${error.message}\n\n**Please ensure:**\n• Backend server is running: \`npm run server\`\n• Server is accessible at: \`http://localhost:3002\`\n• Check browser console for detailed logs`,
        sender: 'ai',
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };



  return (
    <div className="thehopper-page">
      {/* Header */}
      <header className="hopper-header">
        <div className="header-left">
          <button className="back-button" onClick={onBack}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <div className="hopper-title">
            <span className="hopper-icon">🦗</span>
            <span>TheHopper</span>
          </div>
        </div>
        <div className="header-right">
          <button className="settings-button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"/>
            </svg>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="hopper-main">
        {/* Force Directed Graph Background */}
        <div className="graph-background">
          <ForceDirectedGraph />
        </div>

        {messages.length === 0 ? (
          /* Welcome Screen */
          <div className="welcome-screen">
            <h1>Hi, I'm TheHopper</h1>
            <p>Can I help you with anything?</p>
            <span className="welcome-subtitle">
              Ready to assist you with anything you need, from answering
              questions to providing recommendations. Let's get started!
            </span>
          </div>
        ) : (
          /* Chat Messages */
          <div className="chat-container">
            <div className="messages-container">
              {messages.map((message) => (
                <div key={message.id} className={`message ${message.sender}`}>
                  {message.sender === 'ai' && (
                    <div className="message-avatar">
                      <span>🦗</span>
                    </div>
                  )}
                  <div className="message-content">
                    <div className="message-text">
                      {message.sender === 'ai' ? (
                        <ReactMarkdown>{message.text}</ReactMarkdown>
                      ) : (
                        message.text
                      )}
                    </div>
                    <div className="message-time">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="message ai">
                  <div className="message-avatar">
                    <span>🦗</span>
                  </div>
                  <div className="message-content">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}
      </main>

      {/* Input Area */}
      <div className="input-area">
        <div className="input-container">
          <button className="attachment-button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
            </svg>
          </button>
          
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask TheHopper anything..."
            className="message-input"
            rows="1"
          />
          
          <button 
            className="send-button"
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22,2 15,22 11,13 2,9 22,2"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TheHopperPage;
import React, { useState, useEffect, useRef } from 'react';
import { generateResponse } from '../lib/gemini';
import ForceDirectedGraph from './ForceDirectedGraph';
import './TheGeniePage.css';

const TheGeniePage = ({ onBack }) => {
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
      // Generate AI response with conversation context
      const aiResponse = await generateResponse(userMessage, messages);

      const aiMessage = {
        id: Date.now() + 1,
        text: aiResponse,
        sender: 'ai',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error generating response:', error);
      const errorMessage = {
        id: Date.now() + 1,
        text: "I apologize, but I'm having trouble processing your request right now. Please try again.",
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
    <div className="thegenie-page">
      {/* Header */}
      <header className="genie-header">
        <div className="header-left">
          <button className="back-button" onClick={onBack}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <div className="genie-title">
            <span className="genie-icon">🧞‍♂️</span>
            <span>TheGenie</span>
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
      <main className="genie-main">
        {/* Force Directed Graph Background */}
        <div className="graph-background">
          <ForceDirectedGraph />
        </div>

        {messages.length === 0 ? (
          /* Welcome Screen */
          <div className="welcome-screen">
            <h1>Hi, I'm TheGenie</h1>
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
                      <span>🧞‍♂️</span>
                    </div>
                  )}
                  <div className="message-content">
                    <div className="message-text">{message.text}</div>
                    <div className="message-time">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="message ai">
                  <div className="message-avatar">
                    <span>🧞‍♂️</span>
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
            placeholder="Ask TheGenie anything..."
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

export default TheGeniePage;

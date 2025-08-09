import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Auth = () => {
  const { signIn, signUp } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      let result;
      if (isLogin) {
        result = await signIn(email, password);
        if (!result.error) {
          setMessage('Login successful!');
        }
      } else {
        result = await signUp(email, password);
        if (!result.error) {
          setMessage('Check your email for the confirmation link!');
        }
      }
      
      if (result.error) {
        throw result.error;
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Grasphoffer</h1>
        
        <form onSubmit={handleAuth} className="auth-form">
          <div className="input-group">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="auth-input"
            />
          </div>
          
          <div className="input-group">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="auth-input"
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="auth-button"
          >
            {loading ? 'Loading...' : isLogin ? 'Login' : 'Sign Up'}
          </button>
        </form>

        {message && (
          <div className={`message ${message.includes('successful') || message.includes('confirmation') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        <div className="auth-switch">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span 
            className="auth-link" 
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? 'Sign up' : 'Login'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Auth;

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import NeoButton from './ui/NeoButton';
import NeoInput from './ui/NeoInput';
import NeoCard from './ui/NeoCard';
import './Auth.css';

// Icons
import hopperIcon from '../assets/icons/TheHopper_Icon.PNG';
import boltIcon from '../assets/icons/Lightning-bolt.PNG';

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
    <div className="auth-page">
      <div className="auth-card-container">
        <NeoCard padding="large">
          {/* Decorative elements */}
          <div className="auth-decoration deco-genie"><img src={hopperIcon} alt="Genie" style={{ width: '48px', height: '48px' }} /></div>
          <div className="auth-decoration deco-sparkle"><img src={boltIcon} alt="Sparkle" style={{ width: '32px', height: '32px' }} /></div>

          <div className="auth-header">
            <h1 className="auth-title">Grasphopper</h1>
            <p className="auth-subtitle">
              {isLogin ? 'Welcome back, learner!' : 'Join the learning revolution!'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="auth-form">
            <NeoInput
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <NeoInput
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <NeoButton
              type="submit"
              disabled={loading}
              fullWidth
              size="large"
              className="auth-submit-btn"
            >
              {loading ? 'Loading...' : isLogin ? 'Login' : 'Sign Up'}
            </NeoButton>
          </form>

          {message && (
            <div className={`auth-message ${message.includes('successful') || message.includes('confirmation') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}

          <div className="auth-footer">
            <p className="auth-footer-text">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button
                className="auth-link"
                onClick={() => setIsLogin(!isLogin)}
              >
                {isLogin ? 'Sign up' : 'Login'}
              </button>
            </p>
          </div>
        </NeoCard>
      </div>
    </div>
  );
};

export default Auth;

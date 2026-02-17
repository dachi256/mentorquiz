import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../App.css';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false); // Toggle state
  const [error, setError] = useState('');
  const [message, setMessage] = useState(''); // Success message
  const [loading, setLoading] = useState(false);
  
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  // Auto-clear errors after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (isSignUp) {
        // --- Handle Sign Up ---
        const { data, error } = await signUp(email, password);
        if (error) throw error;
        
        // Check if email confirmation is required
        if (data?.user && !data?.session) {
          setMessage("Account created! Please check your email to confirm registration.");
          // Optional: Switch back to login mode
          // setIsSignUp(false); 
        } else {
          // Auto-logged in (if email confirm is disabled in Supabase)
          navigate('/');
        }
      } else {
        // --- Handle Login ---
        const { error } = await signIn(email, password);
        if (error) throw error;
        navigate('/');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div style={{ maxWidth: '400px', margin: '0 auto', padding: '20px' }}>
        <h1 className="title">{isSignUp ? 'Create Account' : 'Login'}</h1>
        
        <form onSubmit={handleSubmit} style={{ marginTop: '30px' }}>
          <div style={{ marginBottom: '20px' }}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                border: '2px solid #ddd',
                borderRadius: '8px',
                boxSizing: 'border-box'
              }}
            />
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                border: '2px solid #ddd',
                borderRadius: '8px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {error && (
            <div style={{
              padding: '10px',
              marginBottom: '20px',
              backgroundColor: '#fee',
              color: '#c33',
              borderRadius: '8px',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          {message && (
            <div style={{
              padding: '10px',
              marginBottom: '20px',
              backgroundColor: '#d1fae5',
              color: '#065f46',
              borderRadius: '8px',
              fontSize: '14px'
            }}>
              {message}
            </div>
          )}

          <button
            type="submit"
            className="button"
            disabled={loading}
            style={{ width: '100%' }}
          >
            {loading 
              ? 'Processing...' 
              : (isSignUp ? 'Sign Up' : 'Login')
            }
          </button>

          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
                setMessage('');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#3b82f6',
                cursor: 'pointer',
                textDecoration: 'underline',
                fontSize: '14px'
              }}
            >
              {isSignUp 
                ? 'Already have an account? Login' 
                : 'Need an account? Sign up'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;


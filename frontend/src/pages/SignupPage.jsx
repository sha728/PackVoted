import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { register } from '../api/authService';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import ErrorBanner from '../components/common/ErrorBanner';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await register(name, email, password);
      // Automatically login after signup
      login(data.access_token, data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-app py-20 max-w-md animate-fade-in flex flex-col items-center">
      <div className="text-5xl mb-4" aria-hidden="true">✨</div>
      <h1 className="text-3xl font-bold text-surface-900 mb-2">Create Account</h1>
      <p className="text-surface-500 mb-8 text-center text-sm">
        Sign up to save your trips, manage groups, and see your past decisions.
      </p>
      
      <Card padding="lg" className="w-full">
        <ErrorBanner message={error} className="mb-4" />
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <Input 
            id="name" 
            label="Full Name" 
            type="text" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            required 
          />
          <Input 
            id="email" 
            label="Email" 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
          />
          <Input 
            id="password" 
            label="Password" 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
          <Button type="submit" size="lg" loading={loading} className="mt-2">
            Sign Up
          </Button>
        </form>
      </Card>
      
      <p className="mt-8 text-surface-500 text-sm">
        Already have an account? <Link to="/login" className="text-brand-600 font-medium hover:underline">Log in</Link>
      </p>
    </div>
  );
}

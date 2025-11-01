import React, { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup, // <-- Added
} from 'firebase/auth';
import { auth, googleProvider } from '../../config/firebase'; // <-- Added
import { useNavigate } from 'react-router-dom';
import Button from '../common/Button';
import Spinner from '../common/Spinner';
import { FaGoogle } from 'react-icons/fa'; // <-- Added

export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- New Google Sign-In Handler ---
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-white  shadow-lg">
      <h2 className="text-3xl font-bold text-center text-gray-900">
        {isLogin ? 'Welcome Back' : 'Create Account'}
      </h2>

      {/* --- Google Sign-In Button --- */}
      <Button
        variant="secondary"
        className="w-full justify-center text-gray-700 border border-secondary-DEFAULT"
        onClick={handleGoogleSignIn}
        disabled={googleLoading}
      >
        {googleLoading ? (
          <Spinner />
        ) : (
          <>
            <FaGoogle className="mr-2" />
            Sign {isLogin ? 'in' : 'up'} with Google
          </>
        )}
      </Button>

      {/* --- Divider --- */}
      <div className="flex items-center">
        <hr className="flex-grow border-t border-secondary-DEFAULT" />
        <span className="px-3 text-sm text-secondary-dark">OR</span>
        <hr className="flex-grow border-t border-secondary-DEFAULT" />
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        {error && (
          <p className="text-sm text-center text-red-600">{error}</p>
        )}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            Email address
          </label>
          <div className="mt-1">
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full  border-secondary-DEFAULT shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700"
          >
            Password
          </label>
          <div className="mt-1">
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full  border-secondary-DEFAULT shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            />
          </div>
        </div>

        <div>
          <Button
            type="submit"
            className="w-full justify-center"
            disabled={loading}
          >
            {loading ? <Spinner /> : isLogin ? 'Log In' : 'Sign Up'}
          </Button>
        </div>
      </form>

      {/* --- Toggle between Login/Sign Up --- */}
      <p className="text-sm text-center text-gray-600">
        {isLogin ? "Don't have an account?" : 'Already have an account?'}
        <button
          onClick={() => setIsLogin(!isLogin)}
          className="ml-1 font-medium text-primary hover:text-primary-dark"
        >
          {isLogin ? 'Sign Up' : 'Log In'}
        </button>
      </p>
    </div>
  );
}
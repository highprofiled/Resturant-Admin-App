import React, { useState, useEffect } from 'react';
import { auth, handleFirestoreError, OperationType, db } from '../lib/firebase';
import { signInWithEmailAndPassword, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink, sendPasswordResetEmail, updatePassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { UtensilsCrossed } from 'lucide-react';

export function Login({ onLogin }: { onLogin: (role: string) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isMagicLink, setIsMagicLink] = useState(false);

  useEffect(() => {
    // Check if we are returning from a magic link
    if (isSignInWithEmailLink(auth, window.location.href)) {
      let savedEmail = window.localStorage.getItem('emailForSignIn');
      if (!savedEmail) {
        savedEmail = window.prompt('Please provide your email for confirmation');
      }
      setLoading(true);
      signInWithEmailLink(auth, savedEmail || '', window.location.href)
        .then(async (result) => {
          window.localStorage.removeItem('emailForSignIn');
          await checkAccessAndLogin(result.user);
        })
        .catch((err) => {
          setError(err.message);
          setLoading(false);
        });
    }
  }, []);

  const checkAccessAndLogin = async (user: any) => {
    if (user.email === 'highprofiled@gmail.com') {
      onLogin('superadmin');
      return;
    }
    
    try {
      const userDoc = await getDoc(doc(db, 'users', user.email));
      if (userDoc.exists()) {
        onLogin(userDoc.data().role || 'member');
      } else {
        await auth.signOut();
        setError('Access denied. You are not registered as a member.');
        setLoading(false);
      }
    } catch (err: any) {
      if (err.message.includes('permission-denied') || err.code === 'permission-denied') {
         await auth.signOut();
         setError('Access denied.');
      } else {
         setError(err.message);
      }
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      await checkAccessAndLogin(result.user);
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email. Try logging in with a Magic Link to create your account.');
      } else {
        setError(err.message);
      }
      setLoading(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (!email) {
      setError('Please enter your email.');
      return;
    }
    setLoading(true);
    const actionCodeSettings = {
      url: window.location.origin,
      handleCodeInApp: true,
    };
    try {
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      window.localStorage.setItem('emailForSignIn', email);
      setMessage('A login link has been sent to your email. You can use it to log in and set your password.');
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError('Please enter your email first to reset your password.');
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('Password reset email sent! Follow the link to set a new password.');
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        setError('Account does not exist yet. Please use the Magic Link to log in for the first time.');
      } else {
        setError(err.message);
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-base text-text-main p-4">
      <div className="max-w-md w-full bg-bg-surface p-8 rounded-2xl shadow-sm border border-border-subtle">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-white mb-4 shadow-md shadow-primary/20">
            <UtensilsCrossed className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome to ResoAdmin</h1>
          <p className="text-text-muted text-sm mt-1">Sign in to manage reservations</p>
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm">{error}</div>}
        {message && <div className="mb-4 p-3 bg-green-50 text-green-700 border border-green-200 rounded-lg text-sm">{message}</div>}

        <div className="flex gap-2 mb-6 p-1 bg-bg-base rounded-lg p-1 border border-border-subtle">
          <button 
            type="button"
            onClick={() => setIsMagicLink(false)}
            className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-colors ${!isMagicLink ? 'bg-bg-surface shadow-sm text-text-main' : 'text-text-muted'}`}
          >
            Password
          </button>
          <button 
            type="button"
            onClick={() => setIsMagicLink(true)}
            className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-colors ${isMagicLink ? 'bg-bg-surface shadow-sm text-text-main' : 'text-text-muted'}`}
          >
            Email Link
          </button>
        </div>

        <form onSubmit={isMagicLink ? handleMagicLink : handlePasswordLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-bg-base border border-border-subtle rounded-lg py-2.5 px-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              required 
            />
          </div>

          {!isMagicLink && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium">Password</label>
                <button type="button" onClick={handleResetPassword} className="text-xs font-semibold text-primary hover:text-primary-hover">
                  Forgot?
                </button>
              </div>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-bg-base border border-border-subtle rounded-lg py-2.5 px-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                required={!isMagicLink}
              />
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-2.5 bg-primary text-white rounded-lg font-semibold hover:bg-primary-hover transition-colors shadow-sm disabled:opacity-50"
          >
            {loading ? 'Processing...' : isMagicLink ? 'Send Login Link' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

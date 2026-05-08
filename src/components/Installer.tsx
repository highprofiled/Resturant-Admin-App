import React, { useState, useEffect } from 'react';
import { WPServices, WPConfig } from '../lib/wp-api';
import { Settings, Save, ArrowRight, Zap, CheckCircle2, Database, Key, Shield, Image as ImageIcon } from 'lucide-react';
import { getStoredFirebaseConfig, initFirebase, auth, db } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

export function Installer({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Step 2: Firebase
  const [fbConfigText, setFbConfigText] = useState('');
  
  // Step 3: Superadmin
  const [adminPassword, setAdminPassword] = useState('');

  // Step 4: WP
  const [wpConfig, setWpConfig] = useState<WPConfig>({
    url: '',
    apiKey: '',
    endpoint: '/wp-json/wptbp/v1/bookings'
  });

  // Step 5: Branding 
  const [branding, setBranding] = useState({ name: 'ResoAdmin', description: 'Management Center', logoUrl: '' });

  useEffect(() => {
    const existing = getStoredFirebaseConfig();
    if (existing) {
      setFbConfigText(JSON.stringify(existing, null, 2));
    } else {
      setFbConfigText('{\n  "apiKey": "",\n  "authDomain": "",\n  "projectId": "",\n  "storageBucket": "",\n  "messagingSenderId": "",\n  "appId": ""\n}');
    }
  }, []);

  const handleNext = async () => {
    setError('');
    
    if (step === 1) {
      setStep(2);
    } 
    else if (step === 2) {
      setLoading(true);
      try {
        const configParams = JSON.parse(fbConfigText);
        if (!configParams.apiKey || !configParams.projectId) {
          throw new Error("Missing apiKey or projectId");
        }
        window.localStorage.setItem('custom-firebase-config', JSON.stringify(configParams));
        initFirebase(configParams);
        setStep(3);
      } catch (err: any) {
        setError("Invalid JSON or missing fields: " + err.message);
      }
      setLoading(false);
    }
    else if (step === 3) {
      setLoading(true);
      try {
        if (!adminPassword || adminPassword.length < 6) throw new Error("Password must be at least 6 characters");
        
        try {
          await signInWithEmailAndPassword(auth, 'highprofiled@gmail.com', adminPassword);
        } catch (e: any) {
           // If user doesn't exist, create them
           if (e.code === 'auth/user-not-found' || e.code === 'auth/invalid-credential' || e.code === 'auth/invalid-login-credentials') {
             await createUserWithEmailAndPassword(auth, 'highprofiled@gmail.com', adminPassword);
             // Also create their member record
             await setDoc(doc(db, 'users', 'highprofiled@gmail.com'), {
                email: 'highprofiled@gmail.com',
                role: 'superadmin',
                createdAt: new Date().toISOString()
             });
           } else {
             throw e;
           }
        }
        setStep(4);
      } catch (err: any) {
        setError(err.message || 'Failed to setup admin account.');
      }
      setLoading(false);
    }
    else if (step === 4) {
      setLoading(true);
      try {
        await WPServices.saveConfig(wpConfig);
        setStep(5);
      } catch (err: any) {
        setError(err.message || 'Failed to save WP configuration.');
      }
      setLoading(false);
    }
    else if (step === 5) {
      setLoading(true);
      try {
        await setDoc(doc(db, 'settings', 'app'), branding);
        setStep(6);
      } catch (err: any) {
        setError(err.message || 'Failed to save branding settings.');
      }
      setLoading(false);
    }
    else {
      onComplete();
    }
  };

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-6 text-text-main">
      <div className="w-full max-w-2xl bg-bg-surface border border-border-subtle shadow-xl rounded-2xl overflow-hidden">
        {/* Progress Bar */}
        <div className="flex w-full h-2 bg-bg-base">
          <div className="h-full bg-primary transition-all duration-500" style={{ width: `${(step / 6) * 100}%` }}></div>
        </div>

        <div className="p-8 md:p-10">
          {error && (
            <div className="bg-red-50 text-red-600 border border-red-200 p-4 rounded-xl text-sm font-medium mb-6">
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="animate-in slide-in-from-right-4 fade-in duration-500">
              <div className="w-16 h-16 bg-primary-soft text-primary rounded-2xl flex items-center justify-center mb-6">
                <Zap className="w-8 h-8" />
              </div>
              <h1 className="text-3xl font-black text-text-main mb-3 tracking-tight">System Setup</h1>
              <p className="text-text-muted text-lg mb-8 leading-relaxed">
                Welcome to ResoAdmin! Complete this one-time setup to connect Firebase, WordPress, and establish your Superadmin account.
              </p>
              
              <div className="bg-primary-soft/50 border border-primary/20 rounded-xl p-5 mb-8">
                <h3 className="font-semibold text-primary flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-5 h-5" /> Hosting Ready
                </h3>
                 <p className="text-sm text-text-muted">
                    Your code is packaged with a <code>.htaccess</code> file to ensure compatibility with shared hosting, cPanel, and Apache out of the box.
                 </p>
              </div>

              <button 
                onClick={handleNext}
                className="w-full sm:w-auto bg-primary text-white px-8 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary-hover shadow-lg shadow-primary/30 transition-all active:scale-95"
              >
                Begin Setup <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in slide-in-from-right-4 fade-in duration-500">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-yellow-100 text-yellow-600 rounded-xl flex items-center justify-center">
                  <Database className="w-5 h-5" />
                </div>
                <h2 className="text-2xl font-bold text-text-main">Firebase Configuration</h2>
              </div>
              <p className="text-text-muted mb-6 text-sm">
                Paste your Firebase Project configuration. If you are in AI Studio, this may already be filled out for you.
              </p>

              <div>
                <textarea
                  value={fbConfigText}
                  onChange={(e) => setFbConfigText(e.target.value)}
                  className="w-full h-48 bg-bg-base border border-border-subtle rounded-xl p-4 text-text-main font-mono text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  placeholder="{&#10;  &quot;apiKey&quot;: &quot;...&quot;,&#10;  ...&#10;}"
                />
              </div>

              <div className="mt-8 flex justify-end">
                <button 
                  onClick={handleNext}
                  disabled={loading}
                  className="bg-primary text-white px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary-hover shadow-lg shadow-primary/30 transition-all disabled:opacity-50"
                >
                  {loading ? 'Validating...' : 'Initialize Firebase'} <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-in slide-in-from-right-4 fade-in duration-500">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                  <Shield className="w-5 h-5" />
                </div>
                <h2 className="text-2xl font-bold text-text-main">Superadmin Account</h2>
              </div>
              <p className="text-text-muted mb-6 text-sm">
                Your superadmin email is securely locked to <strong className="text-text-main">highprofiled@gmail.com</strong>.
                Set a password to create or log in to your account.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Superadmin Password</label>
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Enter a secure password..."
                    className="w-full bg-bg-base border border-border-subtle rounded-xl py-3 px-4 text-text-main shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button 
                  onClick={handleNext}
                  disabled={loading || !adminPassword}
                  className="bg-primary text-white px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary-hover shadow-lg shadow-primary/30 transition-all disabled:opacity-50"
                >
                  {loading ? 'Authenticating...' : 'Set Admin Password'} <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="animate-in slide-in-from-right-4 fade-in duration-500">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
                  <Key className="w-5 h-5" />
                </div>
                <h2 className="text-2xl font-bold text-text-main">WordPress Plugin Link</h2>
              </div>
              <p className="text-text-muted mb-8">
                Connect your dashboard to your live WordPress Booking plugin.
              </p>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">1. Your Website URL</label>
                  <input
                    type="url"
                    value={wpConfig.url}
                    onChange={(e) => setWpConfig({...wpConfig, url: e.target.value})}
                    placeholder="https://my-restaurant-site.com"
                    className="w-full bg-bg-base border border-border-subtle rounded-xl py-3 px-4 text-text-main shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">2. REST API Key</label>
                  <input
                    type="text"
                    value={wpConfig.apiKey}
                    onChange={(e) => setWpConfig({...wpConfig, apiKey: e.target.value})}
                    placeholder="Paste the random key here..."
                    className="w-full bg-bg-base border border-border-subtle rounded-xl py-3 px-4 text-text-main shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-mono"
                  />
                </div>
                <div className="bg-bg-base border border-border-subtle rounded-xl p-4">
                  <label className="block text-sm font-semibold mb-2 text-text-muted">3. REST API Endpoint Path</label>
                  <input
                    type="text"
                    value={wpConfig.endpoint}
                    onChange={(e) => setWpConfig({...wpConfig, endpoint: e.target.value})}
                    className="w-full bg-bg-surface border border-border-subtle rounded-lg py-2.5 px-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all font-mono text-text-muted"
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button 
                  onClick={handleNext}
                  disabled={loading || !wpConfig.url || !wpConfig.apiKey}
                  className="bg-primary text-white px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary-hover shadow-lg shadow-primary/30 transition-all disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Connect Plugin'} <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="animate-in slide-in-from-right-4 fade-in duration-500">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-pink-100 text-pink-600 rounded-xl flex items-center justify-center">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <h2 className="text-2xl font-bold text-text-main">App Branding</h2>
              </div>
              <p className="text-text-muted mb-8">
                Finally, customize the look of your dashboard.
              </p>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">Platform Name</label>
                  <input
                    type="text"
                    value={branding.name}
                    onChange={(e) => setBranding({...branding, name: e.target.value})}
                    className="w-full bg-bg-base border border-border-subtle rounded-xl py-3 px-4 text-text-main shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Description</label>
                  <input
                    type="text"
                    value={branding.description}
                    onChange={(e) => setBranding({...branding, description: e.target.value})}
                    className="w-full bg-bg-base border border-border-subtle rounded-xl py-3 px-4 text-text-main shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Logo URL (Optional)</label>
                  <input
                    type="url"
                    value={branding.logoUrl}
                    onChange={(e) => setBranding({...branding, logoUrl: e.target.value})}
                    placeholder="https://example.com/logo.png"
                    className="w-full bg-bg-base border border-border-subtle rounded-xl py-3 px-4 text-text-main shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button 
                  onClick={handleNext}
                  disabled={loading || !branding.name}
                  className="bg-primary text-white px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary-hover shadow-lg shadow-primary/30 transition-all disabled:opacity-50"
                >
                  {loading ? 'Finishing...' : 'Complete Setup'} <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="animate-in slide-in-from-right-4 fade-in duration-500 text-center py-6">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-bold text-text-main mb-3">Installation Complete!</h2>
              <p className="text-text-muted mb-8 max-w-sm mx-auto">
                Your dashboard is fully connected and ready. You are logged in as superadmin.
              </p>
              
              <button 
                onClick={handleNext}
                className="w-full sm:w-auto bg-text-main text-bg-surface px-10 py-3.5 rounded-xl font-bold hover:opacity-90 shadow-xl transition-all active:scale-95"
              >
                Launch Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

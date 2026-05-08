import React, { useState, useEffect } from 'react';
import { Settings, Save, ArrowRight, Zap, CheckCircle2, Database, Key, Shield, Image as ImageIcon } from 'lucide-react';
import { apiRequest } from '../lib/api';

export function Installer({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Step 2: Database
  const [dbConfig, setDbConfig] = useState({ host: 'localhost', name: '', user: '', pass: '' });
  
  // Step 3: Superadmin
  const [adminPassword, setAdminPassword] = useState('');

  // Step 4: WP
  const [wpConfig, setWpConfig] = useState({
    url: '',
    apiKey: '',
    endpoint: '/wp-json/wptbp/v1/bookings'
  });

  // Step 5: Branding 
  const [branding, setBranding] = useState({ name: 'ResoAdmin', description: 'Management Center', logoUrl: '' });

  const handleNext = async () => {
    setError('');
    
    if (step === 1) {
      setStep(2);
    } 
    else if (step === 2) {
      setStep(3);
    }
    else if (step === 3) {
      setLoading(true);
      try {
        if (!adminPassword || adminPassword.length < 6) throw new Error("Password must be at least 6 characters");
        
        await apiRequest('setup', {
          db_host: dbConfig.host,
          db_name: dbConfig.name,
          db_user: dbConfig.user,
          db_pass: dbConfig.pass,
          admin_pass: adminPassword
        });

        // Automatically log in to get token
        const loginRes = await apiRequest('login', { email: 'highprofiled@gmail.com', password: adminPassword });
        window.localStorage.setItem('auth_token', loginRes.token);
        
        setStep(4);
      } catch (err: any) {
        setError(err.message || 'Failed to setup database and admin account. Bad credentials?');
      }
      setLoading(false);
    }
    else if (step === 4) {
      setLoading(true);
      try {
        await apiRequest('save_settings', { key: 'wp', value: wpConfig });
        setStep(5);
      } catch (err: any) {
        setError(err.message || 'Failed to save WP configuration.');
      }
      setLoading(false);
    }
    else if (step === 5) {
      setLoading(true);
      try {
        await apiRequest('save_settings', { key: 'app', value: branding });
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
                Welcome to ResoAdmin! Complete this one-time setup to connect to your shared hosting database, WordPress, and establish your Superadmin account.
              </p>
              
              <div className="bg-primary-soft/50 border border-primary/20 rounded-xl p-5 mb-8">
                <h3 className="font-semibold text-primary flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-5 h-5" /> Hosting Ready
                </h3>
                 <p className="text-sm text-text-muted">
                    Your code is packaged with a <code>.htaccess</code> and <code>api.php</code> file to ensure compatibility with shared hosting, cPanel, and Apache out of the box. Free of Firebase limits.
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
                <h2 className="text-2xl font-bold text-text-main">MySQL Configuration</h2>
              </div>
              <p className="text-text-muted mb-6 text-sm">
                Enter your shared hosting MySQL database credentials. We'll automatically set up the tables for you.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Database Host</label>
                  <input type="text" value={dbConfig.host} onChange={e => setDbConfig({...dbConfig, host: e.target.value})} placeholder="localhost" className="w-full bg-bg-base border border-border-subtle rounded-xl py-3 px-4 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Database Name</label>
                  <input type="text" value={dbConfig.name} onChange={e => setDbConfig({...dbConfig, name: e.target.value})} className="w-full bg-bg-base border border-border-subtle rounded-xl py-3 px-4 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Database User</label>
                  <input type="text" value={dbConfig.user} onChange={e => setDbConfig({...dbConfig, user: e.target.value})} className="w-full bg-bg-base border border-border-subtle rounded-xl py-3 px-4 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Database Password</label>
                  <input type="password" value={dbConfig.pass} onChange={e => setDbConfig({...dbConfig, pass: e.target.value})} className="w-full bg-bg-base border border-border-subtle rounded-xl py-3 px-4 outline-none" />
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button 
                  onClick={handleNext}
                  disabled={loading || !dbConfig.name || !dbConfig.user}
                  className="bg-primary text-white px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary-hover shadow-lg shadow-primary/30 transition-all disabled:opacity-50"
                >
                  Continue <ArrowRight className="w-5 h-5" />
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
                Set a password to create your account and install tables in the database.
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
                  {loading ? 'Installing into DB...' : 'Install & Setup'} <ArrowRight className="w-5 h-5" />
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

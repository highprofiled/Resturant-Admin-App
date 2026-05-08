import React, { useState } from 'react';
import { WPServices, WPConfig } from '../lib/wp-api';
import { Settings, Save, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';

export function Installer({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [wpConfig, setWpConfig] = useState<WPConfig>({
    url: '',
    apiKey: '',
    endpoint: '/wp-json/wptbp/v1/bookings'
  });

  const handleNext = async () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      setLoading(true);
      await WPServices.saveConfig(wpConfig);
      setLoading(false);
      setStep(3);
    } else {
      onComplete();
    }
  };

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-6 text-text-main">
      <div className="w-full max-w-xl bg-bg-surface border border-border-subtle shadow-xl rounded-2xl overflow-hidden">
        {/* Progress Bar */}
        <div className="flex w-full h-2 bg-bg-base">
          <div className="h-full bg-primary transition-all duration-500" style={{ width: `${(step / 3) * 100}%` }}></div>
        </div>

        <div className="p-8 md:p-10">
          {step === 1 && (
            <div className="animate-in slide-in-from-right-4 fade-in duration-500">
              <div className="w-16 h-16 bg-primary-soft text-primary rounded-2xl flex items-center justify-center mb-6">
                <Zap className="w-8 h-8" />
              </div>
              <h1 className="text-3xl font-black text-text-main mb-3 tracking-tight">System Installer</h1>
              <p className="text-text-muted text-lg mb-8 leading-relaxed">
                Welcome to ResoAdmin! Let's get your dashboard connected to your WordPress plugin in just a few clicks. First time setup takes less than a minute.
              </p>
              
              <div className="bg-primary-soft/50 border border-primary/20 rounded-xl p-5 mb-8">
                <h3 className="font-semibold text-primary mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" /> Shared Hosting Ready
                </h3>
                 <p className="text-sm text-text-muted">
                    We've automatically added a <code>.htaccess</code> file to this instance to ensure perfect compatibility with Apache, cPanel, and general shared hosting environments out of the box!
                 </p>
              </div>

              <button 
                onClick={handleNext}
                className="w-full sm:w-auto bg-primary text-white px-8 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary-hover shadow-lg shadow-primary/30 transition-all active:scale-95"
              >
                Start Setup <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in slide-in-from-right-4 fade-in duration-500">
              <h2 className="text-2xl font-bold text-text-main mb-2">WordPress Plugin Link</h2>
              <p className="text-text-muted mb-8">
                Grab these details from your WordPress Booking plugin settings underneath <strong>Developer / API Integration</strong>.
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
                  <p className="text-xs text-text-muted mt-2">
                    Click <strong>"Generate a secure random key"</strong> in WP and paste it here.
                  </p>
                </div>
                <div className="bg-bg-base border border-border-subtle rounded-xl p-4">
                  <label className="block text-sm font-semibold mb-2">3. REST API Endpoint Path</label>
                  <input
                    type="text"
                    value={wpConfig.endpoint}
                    onChange={(e) => setWpConfig({...wpConfig, endpoint: e.target.value})}
                    className="w-full bg-bg-surface border border-border-subtle rounded-lg py-2.5 px-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all font-mono text-text-muted"
                  />
                  <p className="text-xs text-text-muted mt-2">
                    Usually <code>/wp-json/wptbp/v1/bookings</code>. Don't change unless your documentation says otherwise.
                  </p>
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

          {step === 3 && (
            <div className="animate-in slide-in-from-right-4 fade-in duration-500 text-center py-6">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-bold text-text-main mb-3">All Set!</h2>
              <p className="text-text-muted mb-8 max-w-sm mx-auto">
                Your dashboard is fully connected and ready. You don't need to configure Webhook URLs for frontend connections.
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

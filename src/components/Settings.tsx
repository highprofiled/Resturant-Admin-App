import React, { useState, useEffect } from 'react';
import { Check, Save, Image as ImageIcon } from 'lucide-react';
import { useTheme } from '../lib/ThemeContext';
import { WPServices, WPConfig } from '../lib/wp-api';
import { UserManagement } from './UserManagement';
import { apiRequest } from '../lib/api';

const THEMES = [
  { id: 'default', name: 'Ocean Blueprint', color: 'bg-[#2563eb]' },
  { id: 'midnight', name: 'Midnight', color: 'bg-[#6366f1]' },
  { id: 'nature', name: 'Nature', color: 'bg-[#059669]' },
  { id: 'sunset', name: 'Sunset', color: 'bg-[#ea580c]' },
  { id: 'royal', name: 'Royal', color: 'bg-[#7e22ce]' },
  { id: 'rose', name: 'Rose', color: 'bg-[#e11d48]' },
  { id: 'cyber', name: 'Cyber', color: 'bg-[#0891b2]' },
] as const;

export function Settings({ role, email, appSettings }: { role: string; email: string; appSettings: any }) {
  const { theme, setTheme } = useTheme();
  const [reservationsEnabled, setReservationsEnabled] = useState(true);
  
  // App Branding State
  const [branding, setBranding] = useState({ name: '', description: '', logoUrl: '' });
  const [brandingSaveStatus, setBrandingSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // WP Config State
  const [wpConfig, setWpConfig] = useState<WPConfig>({
    url: '',
    apiKey: '',
    endpoint: '/wp-json/wptbp/v1/bookings'
  });
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  useEffect(() => {
    WPServices.getConfig().then(savedConfig => {
      if (savedConfig) setWpConfig(savedConfig);
    });

    const savedEnabled = localStorage.getItem('reservations-enabled');
    if (savedEnabled !== null) setReservationsEnabled(savedEnabled === 'true');
    
    if (appSettings) {
      setBranding({
        name: appSettings.name || 'ResoAdmin',
        description: appSettings.description || 'Management Center',
        logoUrl: appSettings.logoUrl || ''
      });
    }
  }, [appSettings]);

  const handleSaveWP = async () => {
    setSaveStatus('saving');
    await WPServices.saveConfig(wpConfig);
    setTimeout(() => setSaveStatus('saved'), 600);
    setTimeout(() => setSaveStatus('idle'), 2500);
  };
  
  const handleSaveBranding = async () => {
    if (role !== 'superadmin') return;
    setBrandingSaveStatus('saving');
    try {
      await apiRequest('save_settings', { key: 'app', value: branding });
      setBrandingSaveStatus('saved');
      setTimeout(() => setBrandingSaveStatus('idle'), 2500);
    } catch (err) {
      console.error('Failed to save branding:', err);
      setBrandingSaveStatus('idle');
    }
  };

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-10 animate-in fade-in duration-500 max-w-4xl">
      
      <UserManagement role={role} email={email} />

      {/* App Branding - Superadmin Only */}
      {role === 'superadmin' && (
        <section className="bg-bg-surface p-6 md:p-8 rounded-2xl border border-border-subtle shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4 pl-4">
            <div>
              <h2 className="text-xl font-bold text-text-main flex items-center gap-2">
                <span>App Branding</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 tracking-wider">SUPERADMIN ONLY</span>
              </h2>
              <p className="text-text-muted text-sm mt-1">
                Customize the name, description, and logo of this dashboard.
              </p>
            </div>
            <button 
              onClick={handleSaveBranding}
              disabled={brandingSaveStatus === 'saving'}
              className="inline-flex items-center justify-center gap-2 bg-text-main text-bg-surface px-5 py-2.5 rounded-lg font-medium text-sm transition-all hover:opacity-90 disabled:opacity-70 shadow-sm"
            >
              {brandingSaveStatus === 'saved' ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {brandingSaveStatus === 'saving' ? 'Saving...' : brandingSaveStatus === 'saved' ? 'Saved' : 'Save Branding'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-4">
            <div>
              <label className="block text-sm font-semibold text-text-main mb-2">Platform Name</label>
              <input
                type="text"
                value={branding.name}
                onChange={(e) => setBranding({...branding, name: e.target.value})}
                placeholder="ResoAdmin"
                className="w-full bg-bg-base border border-border-subtle rounded-lg py-2.5 px-4 text-text-main shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-text-main mb-2">Tagline / Description</label>
              <input
                type="text"
                value={branding.description}
                onChange={(e) => setBranding({...branding, description: e.target.value})}
                placeholder="Management Center"
                className="w-full bg-bg-base border border-border-subtle rounded-lg py-2.5 px-4 text-text-main shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-text-main mb-2">Logo URL</label>
              <div className="flex gap-4 items-start">
                {branding.logoUrl ? (
                  <div className="w-16 h-16 rounded-xl border border-border-subtle overflow-hidden shrink-0 bg-white">
                    <img src={branding.logoUrl} alt="Logo Preview" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-xl border border-border-subtle border-dashed flex items-center justify-center text-text-muted shrink-0 bg-bg-base">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                )}
                <div className="flex-1">
                  <input
                    type="url"
                    value={branding.logoUrl}
                    onChange={(e) => setBranding({...branding, logoUrl: e.target.value})}
                    placeholder="https://example.com/logo.png"
                    className="w-full bg-bg-base border border-border-subtle rounded-lg py-2.5 px-4 text-text-main shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                  <p className="text-xs text-text-muted mt-2">Paste a direct image URL (PNG, JPG, SVG) for your custom logo.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* WordPress Integration - Superadmin Only */}
      {role === 'superadmin' && (
        <section className="bg-bg-surface p-6 md:p-8 rounded-2xl border border-border-subtle shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4 pl-4">
            <div>
              <h2 className="text-xl font-bold text-text-main flex items-center gap-2">
                <span>WordPress Integration</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 tracking-wider">SUPERADMIN ONLY</span>
              </h2>
              <p className="text-text-muted text-sm mt-1">
                Connect via REST API to sync and manage your WordPress plugin bookings.
              </p>
            </div>
            <button 
              onClick={handleSaveWP}
              disabled={saveStatus === 'saving'}
              className="inline-flex items-center justify-center gap-2 bg-primary text-white px-5 py-2.5 rounded-lg font-medium text-sm transition-all hover:bg-primary-hover disabled:opacity-70 shadow-sm"
            >
              {saveStatus === 'saved' ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : 'Save Connection'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-text-main mb-2">WordPress Site URL</label>
              <input
                type="text"
                value={wpConfig.url}
                onChange={(e) => setWpConfig({...wpConfig, url: e.target.value})}
                placeholder="https://your-website.com"
                className="w-full bg-bg-base border border-border-subtle rounded-lg py-2.5 px-4 text-text-main shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-text-muted/50"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-text-main mb-2">REST API Key</label>
              <input
                type="password"
                value={wpConfig.apiKey}
                onChange={(e) => setWpConfig({...wpConfig, apiKey: e.target.value})}
                placeholder="Paste your generated secure random key here..."
                className="w-full bg-bg-base border border-border-subtle rounded-lg py-2.5 px-4 text-text-main shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-text-muted/50 font-mono"
              />
              <p className="text-xs text-text-muted mt-2">Generate this in your WordPress plugin settings and copy it here. It will be sent as the <code>X-WPTBP-API-Key</code> header.</p>
            </div>
            <div className="md:col-span-2 bg-primary-soft border border-primary/20 rounded-lg p-4">
              <label className="block text-sm font-semibold text-primary mb-2">REST API Endpoint Path</label>
              <input
                type="text"
                value={wpConfig.endpoint}
                onChange={(e) => setWpConfig({...wpConfig, endpoint: e.target.value})}
                placeholder="/wp-json/wptbp/v1/bookings"
                className="w-full bg-bg-surface border border-primary/30 rounded-lg py-2.5 px-4 text-text-main shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/40 outline-none transition-all font-mono text-sm"
              />
              <p className="text-xs text-primary/80 mt-2">
                Check your plugin documentation for the exact GET and POST endpoint path for retrieving/updating bookings.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* UI Themes */}
      <section className="bg-bg-surface p-6 md:p-8 rounded-2xl border border-border-subtle shadow-sm">
        <h2 className="text-xl font-bold text-text-main mb-1">Visual Theme</h2>
        <p className="text-text-muted text-sm mb-6">
          Personalize the dashboard appearance. Applies to your browser only.
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id as any)}
              className={`relative flex flex-col items-start p-4 rounded-xl border-2 transition-all duration-200 ${
                theme === t.id 
                  ? 'border-primary ring-4 ring-primary-soft bg-primary-soft/50' 
                  : 'border-border-subtle hover:border-primary/50 hover:bg-bg-base text-text-muted'
              }`}
            >
              <div className={`w-8 h-8 rounded-full mb-3 ${t.color} shadow-sm ring-1 ring-black/10`} />
              <span className={`text-sm font-semibold ${theme === t.id ? 'text-primary' : 'text-text-main'}`}>
                {t.name}
              </span>
              {theme === t.id && (
                <div className="absolute top-4 right-4 text-primary">
                  <Check className="w-5 h-5" />
                </div>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* General Configuration */}
      <section className="bg-bg-surface p-6 md:p-8 rounded-2xl border border-border-subtle shadow-sm">
        <h2 className="text-xl font-bold text-text-main mb-6">General Configuration</h2>
        
        <label className="flex items-start gap-4 cursor-pointer group">
          <div className="relative flex items-center justify-center mt-0.5">
            <input
              type="checkbox"
              checked={reservationsEnabled}
              onChange={(e) => {
                setReservationsEnabled(e.target.checked);
                localStorage.setItem('reservations-enabled', String(e.target.checked));
              }}
              className="sr-only"
            />
            <div className={`w-12 h-6 md:w-14 md:h-7 rounded-full transition-colors duration-200 ease-in-out ${reservationsEnabled ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}>
              <div className={`absolute top-1 left-1 bg-white w-4 h-4 md:w-5 md:h-5 rounded-full transition-transform duration-200 ease-in-out shadow-sm ${reservationsEnabled ? 'translate-x-6 md:translate-x-7' : 'translate-x-0'}`} />
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-text-main group-hover:text-primary transition-colors">Enable Reservations</p>
            <p className="text-sm text-text-muted mt-1 leading-relaxed max-w-lg">
              Toggle this off to completely disable new reservations on the frontend. A generic message will be displayed to guests.
            </p>
          </div>
        </label>
      </section>

      {/* Operating Hours */}
      <section className="bg-bg-surface p-6 md:p-8 rounded-2xl border border-border-subtle shadow-sm">
        <h2 className="text-xl font-bold text-text-main mb-1">
          Operating Hours & Rules
        </h2>
        <p className="text-text-muted text-sm mb-6">
          Restrict the times and days available for booking on the frontend form.
        </p>

        <div className="space-y-6 max-w-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-text-main mb-2">
                Opening Time
              </label>
              <div className="relative">
                <input
                  type="time"
                  defaultValue="09:00"
                  className="w-full bg-bg-base border border-border-subtle rounded-lg py-2.5 px-4 text-text-main shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-text-main mb-2">
                Closing Time
              </label>
              <div className="relative">
                <input
                  type="time"
                  defaultValue="22:00"
                  className="w-full bg-bg-base border border-border-subtle rounded-lg py-2.5 px-4 text-text-main shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-text-main mb-3">
              Days Closed
            </label>
            <div className="flex flex-wrap gap-3">
              {days.map((day) => (
                <label key={day} className="relative flex cursor-pointer has-[:checked]:ring-2 has-[:checked]:ring-primary/50 has-[:checked]:bg-primary-soft rounded-lg border border-border-subtle px-4 py-2 hover:bg-bg-base transition-colors">
                  <input
                    type="checkbox"
                    className="auto-hidden absolute opacity-0"
                  />
                  <span className="text-sm font-medium text-text-main select-none">{day}</span>
                </label>
              ))}
            </div>
            <p className="text-sm text-text-muted mt-3">
              Select the days your restaurant is completely closed.
            </p>
          </div>
        </div>
      </section>

      {/* Reservation Limits */}
      <section className="bg-bg-surface p-6 md:p-8 rounded-2xl border border-border-subtle shadow-sm mb-8">
        <h2 className="text-xl font-bold text-text-main mb-6">
          Reservation Limits
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
          <div>
            <label className="block text-sm font-semibold text-text-main mb-2">
              Max Guests per Reservation
            </label>
            <input
              type="number"
              defaultValue="8"
              className="w-full bg-bg-base border border-border-subtle rounded-lg py-2.5 px-4 text-text-main shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
            <p className="text-xs text-text-muted mt-2">
              Standard reservations will be capped at this number online.
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-text-main mb-2">
              Booking Buffer (Hours)
            </label>
            <input
              type="number"
              defaultValue="4"
              className="w-full bg-bg-base border border-border-subtle rounded-lg py-2.5 px-4 text-text-main shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
            <p className="text-xs text-text-muted mt-2">
              Minimum hours in advance a booking must be made.
            </p>
          </div>
        </div>
      </section>
      
    </div>
  );
}

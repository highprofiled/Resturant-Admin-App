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

  // Plugin Configuration State
  const [pluginSettings, setPluginSettings] = useState({
    reservationsEnabled: true,
    openingTime: '09:00',
    closingTime: '22:00',
    daysClosed: [] as string[],
    maxGuests: 8,
    bookingBuffer: 4
  });
  const [pluginSettingsStatus, setPluginSettingsStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Password State
  const [newPassword, setNewPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

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
    
    // Load plugin settings from API
    apiRequest('get_settings').then(data => {
      if (data.settings && data.settings.plugin_config) {
        setPluginSettings(prev => ({...prev, ...data.settings.plugin_config}));
      }
    }).catch(console.error);
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
      window.dispatchEvent(new Event('app-branding-updated'));
      setTimeout(() => setBrandingSaveStatus('idle'), 2500);
    } catch (err) {
      console.error('Failed to save branding:', err);
      setBrandingSaveStatus('idle');
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBranding({ ...branding, logoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSavePluginSettings = async () => {
    setPluginSettingsStatus('saving');
    try {
      // Save locally
      await apiRequest('save_settings', { key: 'plugin_config', value: pluginSettings });
      
      // Attempt to save to WP backend (if configured)
      try {
        await WPServices.updatePluginSettings(pluginSettings);
      } catch (err: any) {
        alert(err.message || "Could not push settings to WordPress, but they were saved locally.");
      }

      setPluginSettingsStatus('saved');
      setTimeout(() => setPluginSettingsStatus('idle'), 2500);
    } catch (err) {
      console.error('Failed to save plugin settings:', err);
      setPluginSettingsStatus('idle');
      alert("Failed to save settings locally.");
    }
  };

  const handleChangePassword = async () => {
    setPasswordStatus('saving');
    try {
      await apiRequest('set_password', { password: newPassword });
      setPasswordStatus('saved');
      setNewPassword('');
      setTimeout(() => setPasswordStatus('idle'), 2500);
    } catch (err: any) {
      console.error('Failed to update password:', err);
      setPasswordStatus('idle');
      alert(err.message || "Failed to update password");
    }
  };

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-10 animate-in fade-in duration-500 max-w-4xl">
      
      <UserManagement role={role} email={email} />

      {/* Account Settings */}
      <section className="bg-bg-surface p-6 md:p-8 rounded-2xl border border-border-subtle shadow-sm relative overflow-hidden">
        <h2 className="text-xl font-bold text-text-main mb-6">Account Settings</h2>
        <div className="space-y-4 max-w-sm">
          <div>
            <label className="block text-sm font-semibold mb-2">New Password</label>
            <input
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-bg-base border border-border-subtle rounded-lg py-2.5 px-4 text-text-main shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          </div>
          <button 
            onClick={handleChangePassword}
            disabled={passwordStatus === 'saving' || !newPassword}
            className="w-full bg-primary text-white py-2.5 rounded-lg px-4 font-medium hover:bg-primary-hover transition-colors disabled:opacity-50"
          >
            {passwordStatus === 'saving' ? 'Updating...' : passwordStatus === 'saved' ? 'Updated!' : 'Update Password'}
          </button>
        </div>
      </section>

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
                  <div className="flex flex-col gap-2">
                    <input
                      type="url"
                      value={branding.logoUrl}
                      onChange={(e) => setBranding({...branding, logoUrl: e.target.value})}
                      placeholder="https://example.com/logo.png"
                      className="w-full bg-bg-base border border-border-subtle rounded-lg py-2.5 px-4 text-text-main shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                    <div className="relative">
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleLogoUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <button type="button" className="text-sm bg-bg-base border border-border-subtle px-3 py-2 rounded-lg hover:bg-bg-surface font-semibold w-full text-center transition-colors">
                        Upload Image Directly
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-text-muted mt-2">Upload a file or paste a direct URL for your custom logo.</p>
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
                Check your plugin documentation for the exact GET and POST endpoint path for retrieving/updating bookings. We will automatically use <code>/settings</code> instead of <code>/bookings</code> to sync your plugin config.
              </p>
            </div>
            
            <div className="md:col-span-2 border-t border-border-subtle pt-6 mt-4">
              <h3 className="text-sm font-semibold text-text-main mb-3">Incoming Webhooks (Optional)</h3>
              <p className="text-xs text-text-muted mb-4">If your WordPress plugin requires a "Webhook URL" to notify this dashboard of new bookings, copy the URL below and paste it into your plugin settings:</p>
              <div className="flex relative">
                <input
                  type="text"
                  readOnly
                  value={typeof window !== 'undefined' ? `${window.location.origin}/api.php?action=webhook` : ''}
                  className="w-full bg-bg-base/50 text-text-muted border border-border-subtle rounded-lg py-2 px-3 text-sm focus:outline-none"
                />
              </div>
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

      {/* Plugin Configuration */}
      <section className="bg-bg-surface p-6 md:p-8 rounded-2xl border border-border-subtle shadow-sm relative pt-8 md:pt-8 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-4 border-b border-border-subtle gap-4">
          <div>
            <h2 className="text-xl font-bold text-text-main">Plugin Configuration</h2>
            <p className="text-sm text-text-muted mt-1">Manage standard booking preferences synced with your website.</p>
          </div>
          <button 
            onClick={handleSavePluginSettings}
            disabled={pluginSettingsStatus === 'saving'}
            className="inline-flex items-center justify-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all hover:bg-primary-hover disabled:opacity-70 shadow-sm w-full md:w-auto"
          >
            {pluginSettingsStatus === 'saved' ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {pluginSettingsStatus === 'saving' ? 'Saving...' : pluginSettingsStatus === 'saved' ? 'Saved Successfully!' : 'Save Configuration'}
          </button>
        </div>
        
        <div className="space-y-10">
          {/* General */}
          <div>
            <h3 className="text-lg font-semibold text-text-main mb-4">General Settings</h3>
            <label className="flex items-start gap-4 cursor-pointer group">
              <div className="relative flex items-center justify-center mt-0.5">
                <input
                  type="checkbox"
                  checked={pluginSettings.reservationsEnabled}
                  onChange={(e) => {
                    setPluginSettings({...pluginSettings, reservationsEnabled: e.target.checked});
                    localStorage.setItem('reservations-enabled', String(e.target.checked));
                  }}
                  className="sr-only"
                />
                <div className={`w-12 h-6 md:w-14 md:h-7 rounded-full transition-colors duration-200 ease-in-out ${pluginSettings.reservationsEnabled ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}>
                  <div className={`absolute top-1 left-1 bg-white w-4 h-4 md:w-5 md:h-5 rounded-full transition-transform duration-200 ease-in-out shadow-sm ${pluginSettings.reservationsEnabled ? 'translate-x-6 md:translate-x-7' : 'translate-x-0'}`} />
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-text-main group-hover:text-primary transition-colors">Enable Reservations</p>
                <p className="text-sm text-text-muted mt-1 leading-relaxed max-w-lg">
                  Toggle this off to completely disable new reservations on the frontend. A generic message will be displayed to guests.
                </p>
              </div>
            </label>
          </div>

          <hr className="border-border-subtle" />

          {/* Operating Hours */}
          <div>
            <h3 className="text-lg font-semibold text-text-main mb-1">Operating Hours & Rules</h3>
            <p className="text-text-muted text-sm mb-6">Restrict the times and days available for booking on the frontend form.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 max-w-2xl">
              <div>
                <label className="block text-sm font-semibold text-text-main mb-2">Opening Time</label>
                <div className="relative">
                  <input
                    type="time"
                    value={pluginSettings.openingTime}
                    onChange={(e) => setPluginSettings({...pluginSettings, openingTime: e.target.value})}
                    className="w-full bg-bg-base border border-border-subtle rounded-lg py-2.5 px-4 text-text-main shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-text-main mb-2">Closing Time</label>
                <div className="relative">
                  <input
                    type="time"
                    value={pluginSettings.closingTime}
                    onChange={(e) => setPluginSettings({...pluginSettings, closingTime: e.target.value})}
                    className="w-full bg-bg-base border border-border-subtle rounded-lg py-2.5 px-4 text-text-main shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-text-main mb-3">Days Closed</label>
              <div className="flex flex-wrap gap-2 md:gap-3 max-w-2xl">
                {days.map(day => (
                  <label key={day} className="relative flex cursor-pointer has-[:checked]:ring-2 has-[:checked]:ring-primary/50 has-[:checked]:bg-primary-soft rounded-lg border border-border-subtle px-4 py-2 hover:bg-bg-base transition-colors">
                    <input
                      type="checkbox"
                      checked={pluginSettings.daysClosed.includes(day)}
                      onChange={(e) => {
                        if (e.target.checked) setPluginSettings({...pluginSettings, daysClosed: [...pluginSettings.daysClosed, day]});
                        else setPluginSettings({...pluginSettings, daysClosed: pluginSettings.daysClosed.filter(d => d !== day)});
                      }}
                      className="auto-hidden absolute opacity-0"
                    />
                    <span className="text-sm font-medium text-text-main select-none">{day}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-text-muted mt-3">Select the days your restaurant is completely closed.</p>
            </div>
          </div>

          <hr className="border-border-subtle" />

          {/* Limits */}
          <div>
            <h3 className="text-lg font-semibold text-text-main mb-6">Reservation Limits</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-2xl">
              <div>
                <label className="block text-sm font-semibold text-text-main mb-2">Max Guests per Reservation</label>
                <input
                  type="number"
                  value={pluginSettings.maxGuests}
                  onChange={(e) => setPluginSettings({...pluginSettings, maxGuests: parseInt(e.target.value || '1', 10)})}
                  className="w-full bg-bg-base border border-border-subtle rounded-lg py-2.5 px-4 text-text-main shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
                <p className="text-xs text-text-muted mt-2">Standard reservations will be capped at this number online.</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-text-main mb-2">Booking Buffer (Hours)</label>
                <input
                  type="number"
                  value={pluginSettings.bookingBuffer}
                  onChange={(e) => setPluginSettings({...pluginSettings, bookingBuffer: parseInt(e.target.value || '0', 10)})}
                  className="w-full bg-bg-base border border-border-subtle rounded-lg py-2.5 px-4 text-text-main shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
                <p className="text-xs text-text-muted mt-2">Minimum hours in advance a booking must be made.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Users, Settings as SettingsIcon, UtensilsCrossed, LogOut, Loader2 } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { TableManagement } from './components/TableManagement';
import { Settings } from './components/Settings';
import { ThemeProvider } from './lib/ThemeContext';
import { Login } from './components/Login';
import { Installer } from './components/Installer';
import { apiRequest } from './lib/api';

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'tables', label: 'Tables', icon: Users },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
];

function MainLayout({ role, email }: { role: string; email: string }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [appSettings, setAppSettings] = useState({ name: 'ResoAdmin', description: 'Management Center', logoUrl: '' });

  useEffect(() => {
    const fetchSettings = () => {
      apiRequest('get_settings').then((data) => {
        if (data.settings && data.settings.app) {
          setAppSettings(prev => ({ ...prev, ...data.settings.app }));
        }
      }).catch(console.error);
    };

    fetchSettings();
    
    // Listen for branding updates from the Settings component
    window.addEventListener('app-branding-updated', fetchSettings);
    return () => window.removeEventListener('app-branding-updated', fetchSettings);
  }, [role]);

  const handleLogout = () => {
    window.localStorage.removeItem('auth_token');
    window.location.reload();
  };

  return (
    <div className="flex h-screen bg-bg-base text-text-main font-sans overflow-hidden selection:bg-primary-soft selection:text-primary">
      {/* Sidebar */}
      <aside className="w-72 bg-bg-surface border-r border-border-subtle flex flex-col hidden md:flex z-10 transition-colors shadow-sm">
        <div className="p-8 pb-6 flex flex-col items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center text-white shadow-md shadow-primary/20 overflow-hidden shrink-0">
            {appSettings.logoUrl ? (
              <img src={appSettings.logoUrl} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <UtensilsCrossed className="w-7 h-7" />
            )}
          </div>
          <div>
            <h1 className="font-bold tracking-tight text-text-main text-xl leading-tight line-clamp-1">{appSettings.name || 'ResoAdmin'}</h1>
            <p className="text-sm text-text-muted font-medium line-clamp-1 mt-1">{appSettings.description || 'Management Center'}</p>
          </div>
        </div>
        <nav className="flex-1 px-4 space-y-1.5 mt-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-primary text-white shadow-md shadow-primary/20 scale-[1.02]'
                    : 'text-text-muted hover:bg-primary-soft hover:text-primary'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-text-muted group-hover:text-primary'}`} />
                {tab.label}
              </button>
            );
          })}
        </nav>
        
        {/* User Profile */}
        <div className="p-6 border-t border-border-subtle mt-auto">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary-soft text-primary flex items-center justify-center font-bold text-sm shrink-0">
                {email.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-text-main capitalize">{role}</span>
                <span className="text-[10px] text-text-muted truncate max-w-[150px]">{email}</span>
              </div>
            </div>
            <button
               onClick={handleLogout}
               className="flex items-center gap-2 text-xs font-semibold text-text-muted hover:text-red-500 transition-colors w-full p-2 rounded-md hover:bg-red-50"
             >
               <LogOut className="w-4 h-4" />
               Sign Out
             </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full relative overflow-y-auto w-full transition-colors">
        {/* Mobile Header */}
        <header className="md:hidden bg-bg-surface border-b border-border-subtle p-4 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white overflow-hidden">
               {appSettings.logoUrl ? (
                <img src={appSettings.logoUrl} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <UtensilsCrossed className="w-4 h-4" />
              )}
            </div>
            <span className="font-bold text-text-main leading-none truncate max-w-[100px]">{appSettings.name || 'ResoAdmin'}</span>
          </div>
          <div className="flex items-center gap-2">
             <button onClick={handleLogout} className="text-text-muted hover:text-red-500">
               <LogOut className="w-5 h-5"/>
             </button>
            <select 
              value={activeTab} 
              onChange={(e) => setActiveTab(e.target.value)}
              className="bg-bg-base border border-border-subtle text-text-main rounded-md text-sm py-1.5 px-2 outline-none focus:ring-2 focus:ring-primary/50"
            >
              {tabs.map(tab => (
                <option key={tab.id} value={tab.id}>{tab.label}</option>
              ))}
            </select>
          </div>
        </header>

        <div className="p-6 md:p-10 lg:p-12 max-w-7xl mx-auto w-full flex-1">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-text-main tracking-tight">
              {tabs.find((t) => t.id === activeTab)?.label}
            </h2>
            <p className="text-text-muted mt-1 text-sm">
              {activeTab === 'dashboard' && 'Overview and manage your daily bookings.'}
              {activeTab === 'tables' && 'Configure dining areas and table capacities.'}
              {activeTab === 'settings' && 'Manage connections, themes, and operating hours.'}
            </p>
          </div>
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'tables' && <TableManagement />}
          {activeTab === 'settings' && <Settings role={role} email={email} appSettings={appSettings} />}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  const [appState, setAppState] = useState<'loading' | 'install' | 'login' | 'app'>('loading');
  const [role, setRole] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    async function checkAuth() {
      // Handle magic link login
      const params = new URLSearchParams(window.location.search);
      const magicToken = params.get('magic_token');
      if (magicToken) {
        try {
          const res = await apiRequest('login_with_token', { token: magicToken });
          window.localStorage.setItem('auth_token', res.token);
          setRole(res.user.role);
          setEmail(res.user.email);
          // Remove token from url
          window.history.replaceState({}, document.title, "/");
          setAppState('app');
          return;
        } catch(e) {
          console.error("Magic link failed", e);
        }
      }

      try {
        const authCheck = await apiRequest('get_me');
        if (authCheck.user) {
          setRole(authCheck.user.role);
          setEmail(authCheck.user.email);
          setAppState('app');
        } else {
          setAppState('login');
        }
      } catch (e) {
        setAppState('login');
      }
    }

    async function checkSetup() {
      try {
        const setupRes = await apiRequest('check_setup');
        if (!setupRes.setup) {
          setAppState('install');
          return;
        }
        await checkAuth();
      } catch (e: any) {
        console.error("Setup check error:", e);
        setAppState('install');
      }
    }

    checkSetup();
  }, []);

  if (appState === 'loading') {
    return <div className="min-h-screen flex items-center justify-center bg-bg-base text-primary"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  if (appState === 'install') {
    return (
      <ThemeProvider>
        <Installer onComplete={() => window.location.reload()} />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      {appState === 'app' && role && email ? <MainLayout role={role} email={email} /> : <Login onLogin={() => window.location.reload()} />}
    </ThemeProvider>
  );
}

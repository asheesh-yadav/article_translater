import { useEffect, useState } from 'react';
import NavigationSidebar from './components/Sidebar';
import TranslateTextTab from './components/TranslateTextTab';
import ArticleTranslatorTab from './components/ArticleTranslatorTab';
import EditingToolsSidebar from './components/EditingToolsSidebar';
import SupportButton from './components/SupportButton';
import ApiAccessTab from './components/ApiAccessTab';
import PricingTab from './components/PricingTab';
import HomePage from './components/HomePage';
import SettingsTab from './components/SettingsTab';
import HelpSupport from './components/HelpSupport';
import AuthTab, { AuthUser } from './components/AuthTab';
import AdminDashboard from './components/AdminDashboard';
import ContactPage from './components/ContactPage';
import { Toaster } from 'react-hot-toast';
import { supabase } from './supabaseClient'
import Navbar from './components/Navbar';

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [showEditingSidebar, setShowEditingSidebar] = useState(true);
  const [formality, setFormality] = useState<'default' | 'formal' | 'informal'>(() => {
    try {
      const v = localStorage.getItem('omni.pref.formality');
      if (v === 'formal' || v === 'informal' || v === 'default') return v as 'default' | 'formal' | 'informal';
    } catch {}
    return 'default';
  });
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    const raw = localStorage.getItem('omni.auth.user');
    try {
      return raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch {
      return null;
    }
  });
  // Add a tick to force re-render when admin updates policy or users
  const [policyTick, setPolicyTick] = useState(0);
  const [appTheme, setAppTheme] = useState<'system' | 'light' | 'dark'>(() => {
    try {
      const t = localStorage.getItem('omni.ui.theme') || 'system';
      return (t === 'light' || t === 'dark') ? (t as any) : 'system';
    } catch { return 'system'; }
  });
  useEffect(() => {
    const handleUpdate = () => setPolicyTick((t) => t + 1);
    window.addEventListener('omni:policy-updated', handleUpdate as EventListener);
    window.addEventListener('omni:users-updated', handleUpdate as EventListener);
    return () => {
      window.removeEventListener('omni:policy-updated', handleUpdate as EventListener);
      window.removeEventListener('omni:users-updated', handleUpdate as EventListener);
    };
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user
      if (u) {
        const authUser: AuthUser = { role: 'user', name: (u.user_metadata as any)?.name, email: u.email || '' }
        setCurrentUser(authUser)
        localStorage.setItem('omni.auth.user', JSON.stringify(authUser))
      }
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user
      if (u) {
        const authUser: AuthUser = { role: 'user', name: (u.user_metadata as any)?.name, email: u.email || '' }
        setCurrentUser(authUser)
        localStorage.setItem('omni.auth.user', JSON.stringify(authUser))
        try {
          const rawUsers = localStorage.getItem('omni.users');
          const users: Array<{ email: string; name?: string; role: 'user' | 'admin' | 'demo'; lastLogin?: string }> = rawUsers ? JSON.parse(rawUsers) : [];
          if (authUser.email) {
            const idx = users.findIndex((x) => x.email === authUser.email);
            const entry = { email: authUser.email, name: authUser.name, role: 'user' as const, lastLogin: new Date().toISOString() };
            if (idx >= 0) { users[idx] = { ...users[idx], ...entry }; } else { users.push(entry); }
            localStorage.setItem('omni.users', JSON.stringify(users));
            window.dispatchEvent(new Event('omni:users-updated'));
          }
        } catch {}
      } else {
        setCurrentUser(null)
        localStorage.removeItem('omni.auth.user')
      }
    })
    return () => { sub.subscription.unsubscribe() }
  }, [])

  useEffect(() => {
    const apply = (t: 'system' | 'light' | 'dark') => {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const effective = t === 'system' ? (prefersDark ? 'dark' : 'light') : t;
      const clsDark = 'theme-dark';
      const clsLight = 'theme-light';
      document.body.classList.remove(clsDark, clsLight);
      document.body.classList.add(effective === 'dark' ? clsDark : clsLight);
    };
    apply(appTheme);
    const onThemeChange = () => {
      try {
        const t = localStorage.getItem('omni.ui.theme') || 'system';
        setAppTheme((t === 'light' || t === 'dark') ? (t as any) : 'system');
      } catch {}
    };
    const mq = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
    const mqListener = () => { if (appTheme === 'system') apply('system'); };
    window.addEventListener('omni:theme-changed', onThemeChange as EventListener);
    mq && mq.addEventListener && mq.addEventListener('change', mqListener);
    return () => {
      window.removeEventListener('omni:theme-changed', onThemeChange as EventListener);
      mq && mq.removeEventListener && mq.removeEventListener('change', mqListener);
    };
  }, [appTheme]);

  const role = currentUser?.role;
  const canAccessTab = (role: 'user' | 'admin' | 'demo' | undefined, id: string) => {
    if (id === 'home' || id === 'account' || id === 'pricing' || id=== 'contact') return true;
    if (!role) return false;
    if (role === 'admin') return true;
    // Per-user overrides
    const overridesRaw = localStorage.getItem('omni.access.userOverrides');
    let overrides: Record<string, { blocked: boolean; roleOverride?: 'user' | 'demo'; features?: Record<string, boolean> }> = {};
    try {
      overrides = overridesRaw ? JSON.parse(overridesRaw) : {};
    } catch {
      overrides = {};
    }
    const email = currentUser?.email || '';
    const userOv = email ? overrides[email] : undefined;
    if (userOv?.blocked) {
      // Blocked users cannot access any non-public tabs
      return false;
    }
    // Effective role may be overridden to user or demo
    const effectiveRole: 'user' | 'demo' | 'admin' = (userOv?.roleOverride as any) || role;
    // Feature-specific per-user override takes precedence if defined
    if (userOv?.features && Object.prototype.hasOwnProperty.call(userOv.features, id)) {
      return !!userOv.features[id];
    }
    // Subscription-based gating for certain tabs
    try {
      const rawSubs = localStorage.getItem('omni.subscriptions');
      const subs: Record<string, { plan: 'free' | 'pro' | 'enterprise'; status: 'active' | 'canceled' | 'past_due' }> = rawSubs ? JSON.parse(rawSubs) : {};
      const sub = email ? subs[email] || { plan: 'free', status: 'active' } : { plan: 'free', status: 'active' };
      if (id === 'api') {
        // API requires Pro or Enterprise plan with active status
        const hasPlan = sub.plan === 'pro' || sub.plan === 'enterprise';
        const isActive = sub.status === 'active';
        if (!hasPlan || !isActive) return false;
      }
    } catch {}
    // Role-based policy from admin-managed feature access
    const raw = localStorage.getItem('omni.access.features');
    let p: Record<string, { user: boolean; admin: boolean; demo: boolean }> = {
      translate: { user: true, admin: true, demo: true },
      article: { user: true, admin: true, demo: false },
      api: { user: false, admin: true, demo: false },
      settings: { user: true, admin: true, demo: true },
      help: { user: true, admin: true, demo: true },
    };
    try {
      const parsed = raw ? JSON.parse(raw) : null;
      if (parsed) p = parsed;
    } catch {}
    return !!p[id]?.[effectiveRole as 'user' | 'admin' | 'demo'];
  };

  const handleLogin = (user: AuthUser) => {
    setCurrentUser(user);
    localStorage.setItem('omni.auth.user', JSON.stringify(user));
    // Persist or update known users registry for admin management
    try {
      const rawUsers = localStorage.getItem('omni.users');
      const users: Array<{ email: string; name?: string; role: 'user' | 'admin' | 'demo'; lastLogin?: string }> = rawUsers ? JSON.parse(rawUsers) : [];
      if (user.email) {
        const idx = users.findIndex((u) => u.email === user.email);
        const entry = { email: user.email, name: user.name, role: user.role, lastLogin: new Date().toISOString() };
        if (idx >= 0) {
          users[idx] = { ...users[idx], ...entry };
        } else {
          users.push(entry);
        }
        localStorage.setItem('omni.users', JSON.stringify(users));
        window.dispatchEvent(new Event('omni:users-updated'));
      }
    } catch {}
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('omni.auth.user');
  };

  useEffect(() => {
    // Redirect unauthenticated users away from non-public tabs
    if (!currentUser && activeTab !== 'account' && activeTab !== 'home') {
      setActiveTab('account');
    }
  }, [currentUser]);

  useEffect(() => {
    // If logged in but lacking permission for a tab, redirect to Account
    if (currentUser && !canAccessTab(role, activeTab)) {
      setActiveTab('account');
    }
  }, [currentUser, role, activeTab, policyTick]);

  return (
    <>
       <Toaster position="top-right" reverseOrder={false} />
    <div className="h-screen flex bg-white">

{['home', 'contact'].includes(activeTab) && (
  <Navbar onNavigate={setActiveTab} />
)}

      {!['home', 'contact'].includes(activeTab) && (
  <NavigationSidebar
    activeTab={activeTab}
    onTabChange={setActiveTab}
    currentUser={currentUser}
  />
)}


      {/* Enable vertical scrolling for main content */}
      <div className="flex-1 flex overflow-y-auto">
        {activeTab === 'translate' && (
          !currentUser ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-md px-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Login required</h1>
                <p className="text-gray-600 mb-4">Please sign in to use the translator.</p>
                <button onClick={() => setActiveTab('account')} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">Go to Account</button>
              </div>
            </div>
          ) : canAccessTab(role, 'translate') ? (
            <TranslateTextTab
              onToggleSidebar={() => setShowEditingSidebar(!showEditingSidebar)}
              formality={formality}
              onFormalityChange={setFormality}
              onDetectedLanguageChange={setDetectedLanguage}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-md px-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Access restricted</h1>
                <p className="text-gray-600 mb-4">This feature has been disabled for your role by the admin.</p>
                <button onClick={() => setActiveTab('home')} className="px-4 py-2 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-900">Go to Home</button>
              </div>
            </div>
          )
        )}

        {activeTab === 'article' && (
          !currentUser ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-md px-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Login required</h1>
                <p className="text-gray-600 mb-4">Please sign in to use the article translator.</p>
                <button onClick={() => setActiveTab('account')} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">Go to Account</button>
              </div>
            </div>
          ) : canAccessTab(role, 'article') ? (
            <ArticleTranslatorTab />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-md px-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Access restricted</h1>
                <p className="text-gray-600 mb-4">This feature has been disabled for your role by the admin.</p>
                <button onClick={() => setActiveTab('home')} className="px-4 py-2 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-900">Go to Home</button>
              </div>
            </div>
          )
        )}

        {activeTab === 'home' && (
          <HomePage onNavigate={setActiveTab} />
        )}
       {activeTab === 'contact' && (
  <div className="flex-1 flex justify-center overflow-y-auto">
    <ContactPage />
  </div>
)}

        {activeTab === 'api' && (
          !currentUser ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-md px-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Login required</h1>
                <p className="text-gray-600 mb-4">Please sign in to view API information.</p>
                <button onClick={() => setActiveTab('account')} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">Go to Account</button>
              </div>
            </div>
          ) : canAccessTab(role, 'api') ? (
            <ApiAccessTab />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-md px-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Access restricted</h1>
                <p className="text-gray-600 mb-4">This tab requires an active Pro or Enterprise subscription for your account.</p>
                <button onClick={() => setActiveTab('home')} className="px-4 py-2 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-900">Go to Home</button>
              </div>
            </div>
          )
        )}

        {activeTab === 'pricing' && (
          <PricingTab currentUser={currentUser} />
        )}

        {activeTab === 'settings' && (
          !currentUser ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-md px-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Login required</h1>
                <p className="text-gray-600 mb-4">Please sign in to access Settings.</p>
                <button onClick={() => setActiveTab('account')} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">Go to Account</button>
              </div>
            </div>
          ) : canAccessTab(role, 'settings') ? (
            <SettingsTab
              formality={formality}
              onFormalityChange={setFormality}
              showEditingSidebar={showEditingSidebar}
              onToggleEditingSidebar={() => setShowEditingSidebar(!showEditingSidebar)}
              currentUser={currentUser}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-md px-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Access restricted</h1>
                <p className="text-gray-600 mb-4">This feature has been disabled for your role by the admin.</p>
                <button onClick={() => setActiveTab('home')} className="px-4 py-2 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-900">Go to Home</button>
              </div>
            </div>
          )
        )}

        {activeTab === 'help' && (
          !currentUser ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-md px-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Login required</h1>
                <p className="text-gray-600 mb-4">Please sign in to view Help & Support.</p>
                <button onClick={() => setActiveTab('account')} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">Go to Account</button>
              </div>
            </div>
          ) : canAccessTab(role, 'help') ? (
            <HelpSupport />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-md px-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Access restricted</h1>
                <p className="text-gray-600 mb-4">This feature has been disabled for your role by the admin.</p>
                <button onClick={() => setActiveTab('home')} className="px-4 py-2 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-900">Go to Home</button>
              </div>
            </div>
          )
        )}

        {activeTab === 'admin' && (
          !currentUser ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-md px-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Login required</h1>
                <p className="text-gray-600 mb-4">Please sign in to access the Admin dashboard.</p>
                <button onClick={() => setActiveTab('account')} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">Go to Account</button>
              </div>
            </div>
          ) : currentUser.role === 'admin' ? (
            <AdminDashboard />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-md px-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Access restricted</h1>
                <p className="text-gray-600 mb-4">Only admins can access the Admin dashboard.</p>
                <button onClick={() => setActiveTab('home')} className="px-4 py-2 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-900">Go to Home</button>
              </div>
            </div>
          )
        )}

        {activeTab === 'account' && (
          <AuthTab currentUser={currentUser} onLogin={handleLogin} onLogout={handleLogout} />
        )}

        {activeTab === 'translate' && showEditingSidebar && currentUser && (
          <EditingToolsSidebar
            formality={formality}
            onFormalityChange={setFormality}
            detectedLanguage={detectedLanguage}
          />
        )}
      </div>

      <SupportButton />
    </div>
    </>
  );
}

export default App;

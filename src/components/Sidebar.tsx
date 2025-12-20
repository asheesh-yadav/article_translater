
interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  currentUser?: { role: 'user' | 'admin' | 'demo'; name?: string; email?: string } | null;
}

export default function Sidebar({ activeTab, onTabChange, currentUser }: SidebarProps) {
  const loggedIn = !!currentUser;
  const role = currentUser?.role;

  const canAccessTab = (role: 'user' | 'admin' | 'demo' | undefined, id: string) => {
    if (id === 'home' || id === 'account' || id === 'pricing') return true;
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
    if (userOv?.blocked) return false;
    const effectiveRole: 'user' | 'demo' | 'admin' = (userOv?.roleOverride as any) || role;
    if (userOv?.features && Object.prototype.hasOwnProperty.call(userOv.features, id)) {
      return !!userOv.features[id];
    }
    // Role-based policy
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

  const menuItems = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'translate', label: 'Translate', icon: '🈯' },
    { id: 'article', label: 'Article translator', icon: '📰' },
    { id: 'api', label: 'API', icon: '🔌' },
    { id: 'pricing', label: 'Plans', icon: '💳' },
  ];
  const bottomItems = [
    { id: 'admin', label: 'Admin', icon: '🛡️' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
    { id: 'help', label: 'Help', icon: '❓' },
    { id: 'account', label: 'Account', icon: '👤' },
  ];

  const handleClick = (id: string) => {
    if (!loggedIn && id !== 'home' && id !== 'account' && id !== 'pricing') {
      onTabChange('account');
      return;
    }
    if (loggedIn && !canAccessTab(role, id)) {
      onTabChange('account');
      return;
    }
    onTabChange(id);
  };

  const buttonClass = (id: string) => `flex items-center gap-2 w-full px-4 py-3 rounded OmMenuItem ${activeTab === id ? 'bg-slate-800 text-white' : 'hover:bg-slate-100 text-slate-800'} ${(!loggedIn && id !== 'home' && id !== 'account' && id !== 'pricing') || (loggedIn && !canAccessTab(role, id)) ? 'opacity-50 cursor-not-allowed' : ''}`;

  const buttonTitle = (id: string, label: string) => {
    if (!loggedIn && id !== 'home' && id !== 'account' && id !== 'pricing') {
      return `${label} (login required)`;
    }
    if (loggedIn && !canAccessTab(role, id)) {
      if (id === 'api') {
        return `${label} (requires active Pro or Enterprise subscription)`;
      }
      return `${label} (disabled by admin for your role or account)`;
    }
    return label;
  };

  return (
    <div className="flex flex-col h-full justify-between border-r border-slate-200 bg-white">
      <div>
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={buttonClass(item.id)}
            onClick={() => handleClick(item.id)}
            title={buttonTitle(item.id, item.label)}
            disabled={(!loggedIn && item.id !== 'home' && item.id !== 'account' && item.id !== 'pricing') || (loggedIn && !canAccessTab(role, item.id))}
            style={{color:"grey"}}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>
      <div className="border-t border-slate-200">
        {bottomItems.map((item) => (
          <button
            key={item.id}
            className={buttonClass(item.id)}
            onClick={() => handleClick(item.id)}
            title={buttonTitle(item.id, item.label)}
            disabled={(!loggedIn && item.id !== 'home' && item.id !== 'account' && item.id !== 'pricing') || (loggedIn && !canAccessTab(role, item.id))}
            style={{color:"grey"}}
         >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

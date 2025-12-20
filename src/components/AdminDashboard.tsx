import { useEffect, useMemo, useState } from 'react';
import { Download, Upload, RefreshCcw, Search as SearchIcon, Users as UsersIcon, Ban, ChevronLeft, ChevronRight, Plus, Shield, Globe } from 'lucide-react'

type Role = 'user' | 'admin' | 'demo';

type AdminUser = { email: string; name?: string; role: Role; lastLogin?: string };

type UserOverride = { blocked: boolean; roleOverride?: 'user' | 'demo'; features?: Record<string, boolean> };

type SubscriptionPlan = 'free' | 'pro' | 'enterprise';

type SubscriptionStatus = 'active' | 'canceled' | 'past_due';

type Subscription = { plan: SubscriptionPlan; status: SubscriptionStatus; renewDate?: string };

export default function AdminDashboard() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [overrides, setOverrides] = useState<Record<string, UserOverride>>({});
  const [subs, setSubs] = useState<Record<string, Subscription>>({});
  const [featureAccess, setFeatureAccess] = useState<Record<string, { user: boolean; admin: boolean; demo: boolean }>>({
    translate: { user: true, admin: true, demo: true },
    article: { user: true, admin: true, demo: false },
    api: { user: false, admin: true, demo: false },
    help: { user: true, admin: true, demo: true },
    settings: { user: true, admin: true, demo: true },
  });
  const [newUser, setNewUser] = useState<{ name: string; email: string; role: Role }>({ name: '', email: '', role: 'user' });

  const currentAdminEmail = useMemo(() => {
    try {
      const raw = localStorage.getItem('omni.auth.user');
      const u = raw ? JSON.parse(raw) : null;
      return u?.email || '';
    } catch {
      return '';
    }
  }, []);

  useEffect(() => {
    try {
      const rawUsers = localStorage.getItem('omni.users');
      setUsers(rawUsers ? JSON.parse(rawUsers) : []);
    } catch {
      setUsers([]);
    }
    try {
      const rawOverrides = localStorage.getItem('omni.access.userOverrides');
      setOverrides(rawOverrides ? JSON.parse(rawOverrides) : {});
    } catch {
      setOverrides({});
    }
    try {
      const rawSubs = localStorage.getItem('omni.subscriptions');
      setSubs(rawSubs ? JSON.parse(rawSubs) : {});
    } catch {
      setSubs({});
    }
    try {
      const rawFeat = localStorage.getItem('omni.access.features');
      const parsed = rawFeat ? JSON.parse(rawFeat) : null;
      if (parsed) setFeatureAccess(parsed);
    } catch {}
  }, []);

  const persistUsers = (next: AdminUser[]) => {
    setUsers(next);
    localStorage.setItem('omni.users', JSON.stringify(next));
    window.dispatchEvent(new Event('omni:users-updated'));
  };

  const persistOverrides = (next: Record<string, UserOverride>) => {
    setOverrides(next);
    localStorage.setItem('omni.access.userOverrides', JSON.stringify(next));
    window.dispatchEvent(new Event('omni:policy-updated'));
  };

  const persistSubs = (next: Record<string, Subscription>) => {
    setSubs(next);
    localStorage.setItem('omni.subscriptions', JSON.stringify(next));
    window.dispatchEvent(new Event('omni:users-updated'));
  };

  const persistFeatures = (next: Record<string, { user: boolean; admin: boolean; demo: boolean }>) => {
    setFeatureAccess(next);
    localStorage.setItem('omni.access.features', JSON.stringify(next));
    window.dispatchEvent(new Event('omni:policy-updated'));
    showToast('Saved feature access', 'success');
  };

  const setRole = (email: string, role: Role) => {
    if (confirm(`Are you sure you want to change ${email}'s role to ${role}? This will reset any custom feature overrides for this user.`)) {
      const nextUsers = users.map((u) => (u.email === email ? { ...u, role } : u));
      persistUsers(nextUsers);
      // Reset user overrides when role is changed to prevent conflicts
      const { [email]: _, ...restOverrides } = overrides;
      persistOverrides(restOverrides);
      showToast(`Changed ${email}'s role to ${role}`, 'success');
    }
  };

  const toggleBlocked = (email: string) => {
    const curr = overrides[email] || { blocked: false };
    const nextOverrides = { ...overrides, [email]: { ...curr, blocked: !curr.blocked } };
    // Prevent blocking self
    if (email === currentAdminEmail && !curr.blocked) {
      alert("You can't block your own admin account.");
      return;
    }
    persistOverrides(nextOverrides);
  };

  const removeUser = (email: string) => {
    if (!confirm(`Remove user ${email} from registry?`)) return;
    const nextUsers = users.filter((u) => u.email !== email);
    const { [email]: _, ...restOverrides } = overrides;
    const { [email]: __, ...restSubs } = subs;
    persistUsers(nextUsers);
    persistOverrides(restOverrides);
    persistSubs(restSubs);
  };

  const setSubscription = (email: string, sub: Subscription) => {
    const next = { ...subs, [email]: sub };
    persistSubs(next);
  };

  const cancelSubscription = (email: string) => {
    const curr = subs[email] || { plan: 'free', status: 'active' };
    setSubscription(email, { ...curr, status: 'canceled' });
  };

  const reactivateSubscription = (email: string) => {
    const curr = subs[email] || { plan: 'free', status: 'canceled' };
    setSubscription(email, { ...curr, status: 'active' });
  };

  const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const anonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';
  const envReady = !!supabaseUrl && !!anonKey;

  const summary = useMemo(() => {
    const total = users.length;
    const blocked = Object.values(overrides).filter((o) => o.blocked).length;
    const planCounts: Record<SubscriptionPlan, number> = { free: 0, pro: 0, enterprise: 0 };
    Object.values(subs).forEach((s) => { planCounts[s.plan] = (planCounts[s.plan] || 0) + 1; });
    return { total, blocked, planCounts };
  }, [users, overrides, subs]);

  // Advanced UI state
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | Role>('all');
  const [filterPlan, setFilterPlan] = useState<'all' | SubscriptionPlan>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | SubscriptionStatus>('all');
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'role' | 'plan' | 'status' | 'lastLogin'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2200);
  };

  const exportData = () => {
    try {
      const data = { users, overrides, subs };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'omni-admin-data.json';
      a.click();
      URL.revokeObjectURL(url);
      showToast('Exported admin data', 'success');
    } catch (e) {
      showToast('Export failed', 'error');
    }
  };

  const addUser = () => {
    const email = newUser.email.trim().toLowerCase();
    const name = newUser.name.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showToast('Enter a valid email', 'error'); return; }
    if (users.some((u) => u.email.toLowerCase() === email)) { showToast('User already exists', 'error'); return; }
    const next = [...users, { email, name, role: newUser.role, lastLogin: new Date().toISOString() }];
    persistUsers(next);
    showToast('User added', 'success');
    setNewUser({ name: '', email: '', role: 'user' });
  };

  const onImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!parsed || typeof parsed !== 'object') throw new Error('Invalid file');
        if (!Array.isArray(parsed.users) || !parsed.overrides || !parsed.subs) throw new Error('Missing keys');
        setUsers(parsed.users);
        setOverrides(parsed.overrides);
        setSubs(parsed.subs);
        localStorage.setItem('omni.users', JSON.stringify(parsed.users));
        localStorage.setItem('omni.access.userOverrides', JSON.stringify(parsed.overrides));
        localStorage.setItem('omni.subscriptions', JSON.stringify(parsed.subs));
        window.dispatchEvent(new Event('omni:users-updated'));
        window.dispatchEvent(new Event('omni:policy-updated'));
        showToast('Import will replace current admin data', 'success');
      } catch {
        showToast('Import failed', 'error');
      } finally {
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  const refreshData = () => {
    try {
      const rawUsers = localStorage.getItem('omni.users');
      const rawOverrides = localStorage.getItem('omni.access.userOverrides');
      const rawSubs = localStorage.getItem('omni.subscriptions');
      const rawFeat = localStorage.getItem('omni.access.features');
      setUsers(rawUsers ? JSON.parse(rawUsers) : []);
      setOverrides(rawOverrides ? JSON.parse(rawOverrides) : {});
      setSubs(rawSubs ? JSON.parse(rawSubs) : {});
      try {
        const parsed = rawFeat ? JSON.parse(rawFeat) : null;
        if (parsed) setFeatureAccess(parsed);
      } catch {}
      showToast('Data refreshed', 'success');
    } catch {
      showToast('Refresh failed', 'error');
    }
  };

  // Derived collections
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const sub = subs[u.email] || { plan: 'free', status: 'active' };
      const matchesSearch = (u.name || u.email).toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = filterRole === 'all' || u.role === filterRole;
      const matchesPlan = filterPlan === 'all' || sub.plan === filterPlan;
      const matchesStatus = filterStatus === 'all' || sub.status === filterStatus;
      return matchesSearch && matchesRole && matchesPlan && matchesStatus;
    });
  }, [users, subs, searchQuery, filterRole, filterPlan, filterStatus]);

  const sortedUsers = useMemo(() => {
    const list = [...filteredUsers];
    list.sort((a, b) => {
      const sa = subs[a.email] || { plan: 'free', status: 'active' };
      const sb = subs[b.email] || { plan: 'free', status: 'active' };
      const va = sortBy === 'name' ? (a.name || a.email).toLowerCase() : sortBy === 'email' ? a.email.toLowerCase() : sortBy === 'role' ? a.role : sortBy === 'plan' ? sa.plan : sortBy === 'status' ? sa.status : (a.lastLogin || '');
      const vb = sortBy === 'name' ? (b.name || b.email).toLowerCase() : sortBy === 'email' ? b.email.toLowerCase() : sortBy === 'role' ? b.role : sortBy === 'plan' ? sb.plan : sortBy === 'status' ? sb.status : (b.lastLogin || '');
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [filteredUsers, sortBy, sortDir, subs]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(sortedUsers.length / pageSize)), [sortedUsers, pageSize]);
  const pagedUsers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedUsers.slice(start, start + pageSize);
  }, [sortedUsers, page, pageSize]);

  return (
    <div className="flex-1 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-slate-50 border border-slate-200 text-slate-700 text-sm">
              <UsersIcon className="w-4 h-4" /> Admin Dashboard
            </div>
            <h1 className="mt-3 text-3xl font-bold text-gray-900">Administration</h1>
            <p className="text-gray-600">Manage users, policies, and subscriptions</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-2 rounded bg-slate-800 text-white hover:bg-slate-900 flex items-center gap-2" onClick={exportData}>
              <Download className="w-4 h-4" /> Export
            </button>
            <label className="px-3 py-2 rounded border hover:bg-slate-50 cursor-pointer flex items-center gap-2">
              <Upload className="w-4 h-4" /> Import
              <input type="file" accept="application/json" className="hidden" onChange={onImportFile} />
            </label>
            <button className="px-3 py-2 rounded border hover:bg-slate-50 flex items-center gap-2" onClick={refreshData}>
              <RefreshCcw className="w-4 h-4" /> Refresh
            </button>
          </div>
        </div>
        {toast && (
          <div className={`mb-4 rounded border px-3 py-2 ${toast.type === 'success' ? 'bg-green-50 border-green-300 text-green-800' : 'bg-red-50 border-red-300 text-red-800'}`}>{toast.message}</div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="border rounded-lg p-4 bg-white shadow-sm">
            <div className="text-sm text-gray-500 flex items-center gap-2"><UsersIcon className="w-4 h-4" /> Total users</div>
            <div className="text-2xl font-semibold">{summary.total}</div>
          </div>
          <div className="border rounded-lg p-4 bg-white shadow-sm">
            <div className="text-sm text-gray-500 flex items-center gap-2"><Ban className="w-4 h-4" /> Blocked users</div>
            <div className="text-2xl font-semibold">{summary.blocked}</div>
          </div>
          <div className="border rounded-lg p-4 bg-white shadow-sm">
            <div className="text-sm text-gray-500">Plans (free/pro/enterprise)</div>
            <div className="text-2xl font-semibold">{summary.planCounts.free}/{summary.planCounts.pro}/{summary.planCounts.enterprise}</div>
          </div>
          <div className="border rounded-lg p-4 bg-white shadow-sm">
            <div className="text-sm text-gray-500 flex items-center gap-2"><Globe className="w-4 h-4" /> Supabase env</div>
            <div className={`text-xs inline-flex items-center px-2 py-1 rounded border mt-1 ${envReady ? 'bg-green-50 text-green-700 border-green-300' : 'bg-red-50 text-red-700 border-red-300'}`}>{envReady ? 'Configured' : 'Missing'}</div>
            <div className="text-[11px] text-gray-500 mt-1 break-all">{supabaseUrl ? supabaseUrl : 'VITE_SUPABASE_URL not set'}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="border rounded-lg bg-white shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2"><Plus className="w-4 h-4" /> Add user</h2>
            <div className="space-y-3">
              <input value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} placeholder="Name" className="w-full px-3 py-2 border rounded" />
              <input value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} placeholder="Email" className="w-full px-3 py-2 border rounded" />
              <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value as Role })} className="w-full px-3 py-2 border rounded">
                <option value="user">User</option>
                <option value="demo">Demo</option>
                <option value="admin">Admin</option>
              </select>
              <button onClick={addUser} className="w-full px-3 py-2 rounded bg-slate-800 text-white hover:bg-slate-900">Create</button>
            </div>
          </div>
          <div className="lg:col-span-2 border rounded-lg bg-white shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2"><Shield className="w-4 h-4" /> Feature access</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600">
                    <th className="py-2">Feature</th>
                    <th className="py-2">User</th>
                    <th className="py-2">Admin</th>
                    <th className="py-2">Demo</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(featureAccess).map((f) => (
                    <tr key={f} className="border-t">
                      <td className="py-2 capitalize">{f}</td>
                      {(['user','admin','demo'] as const).map((r) => (
                        <td key={r} className="py-2">
                          <input type="checkbox" checked={!!featureAccess[f][r]} onChange={(e) => persistFeatures({ ...featureAccess, [f]: { ...featureAccess[f], [r]: e.target.checked } })} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="border rounded-lg bg-white overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <h2 className="text-lg font-semibold">Users</h2>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <SearchIcon className="w-4 h-4 absolute left-2 top-2.5 text-gray-400" />
                <input
                  value={searchQuery}
                  onChange={(e) => { setPage(1); setSearchQuery(e.target.value) }}
                  className="pl-8 pr-3 py-2 border rounded w-56"
                  placeholder="Search users by name or email"
                />
              </div>
              <select className="border rounded px-2 py-2" value={filterRole} onChange={(e) => { setPage(1); setFilterRole(e.target.value as any) }}>
                <option value="all">All roles</option>
                <option value="user">User</option>
                <option value="demo">Demo</option>
                <option value="admin">Admin</option>
              </select>
              <select className="border rounded px-2 py-2" value={filterPlan} onChange={(e) => { setPage(1); setFilterPlan(e.target.value as any) }}>
                <option value="all">All plans</option>
                <option value="free">Free</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
              <select className="border rounded px-2 py-2" value={filterStatus} onChange={(e) => { setPage(1); setFilterStatus(e.target.value as any) }}>
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="canceled">Canceled</option>
                <option value="past_due">Past due</option>
              </select>
              <select className="border rounded px-2 py-2" value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
                <option value="name">Sort: Name</option>
                <option value="email">Sort: Email</option>
                <option value="role">Sort: Role</option>
                <option value="plan">Sort: Plan</option>
                <option value="status">Sort: Status</option>
                <option value="lastLogin">Sort: Last login</option>
              </select>
              <select className="border rounded px-2 py-2" value={sortDir} onChange={(e) => setSortDir(e.target.value as any)}>
                <option value="asc">Asc</option>
                <option value="desc">Desc</option>
              </select>
              <select className="border rounded px-2 py-2" value={pageSize} onChange={(e) => { setPage(1); setPageSize(Number(e.target.value)) }}>
                <option value={5}>5 / page</option>
                <option value={10}>10 / page</option>
                <option value={20}>20 / page</option>
              </select>
            </div>
          </div>
          <div className="divide-y">
            {pagedUsers.length === 0 && (
              <div className="p-6 text-gray-600">No users match your filters.</div>
            )}
            {pagedUsers.map((u) => {
              const ov = overrides[u.email] || { blocked: false }
              const sub = subs[u.email] || { plan: 'free', status: 'active' }
              const roleBadge = u.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-300' : u.role === 'demo' ? 'bg-blue-50 text-blue-700 border-blue-300' : 'bg-gray-50 text-gray-700 border-gray-300'
              const statusBadge = sub.status === 'active' ? 'bg-green-50 text-green-700 border-green-300' : sub.status === 'past_due' ? 'bg-yellow-50 text-yellow-700 border-yellow-300' : 'bg-red-50 text-red-700 border-red-300'
              return (
                <div key={u.email} className="p-4">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className={`text-xs px-2 py-1 rounded border ${roleBadge}`}>{u.role}</div>
                        {ov.blocked && <div className="text-xs px-2 py-1 rounded border bg-red-50 text-red-700 border-red-300 flex items-center gap-1"><Ban className="w-3 h-3" /> Blocked</div>}
                        <div className={`text-xs px-2 py-1 rounded border ${statusBadge}`}>{sub.plan} · {sub.status}</div>
                      </div>
                      <div className="font-medium text-gray-900 mt-1">{u.name || u.email}</div>
                      <div className="text-sm text-gray-500">{u.email}</div>
                      {u.lastLogin && (
                        <div className="text-xs text-gray-400 mt-1">Last login: {new Date(u.lastLogin).toLocaleString()}</div>
                      )}
                    </div>
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                        <select
                          className="w-full border rounded px-3 py-2"
                          value={u.role}
                          onChange={(e) => setRole(u.email, e.target.value as Role)}
                        >
                          <option value="user">User</option>
                          <option value="demo">Demo</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Blocked</label>
                        <button
                          className={`w-full px-3 py-2 rounded border ${ov.blocked ? 'bg-red-50 border-red-300 text-red-700' : 'bg-green-50 border-green-300 text-green-700'}`}
                          onClick={() => toggleBlocked(u.email)}
                          disabled={u.email === currentAdminEmail && !ov.blocked}
                          title={u.email === currentAdminEmail ? "You can't block yourself" : ''}
                        >
                          {ov.blocked ? 'Blocked' : 'Active'}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
                      <select
                        className="w-full border rounded px-3 py-2"
                        value={sub.plan}
                        onChange={(e) => setSubscription(u.email, { ...sub, plan: e.target.value as SubscriptionPlan })}
                      >
                        <option value="free">Free</option>
                        <option value="pro">Pro</option>
                        <option value="enterprise">Enterprise</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select
                        className="w-full border rounded px-3 py-2"
                        value={sub.status}
                        onChange={(e) => setSubscription(u.email, { ...sub, status: e.target.value as SubscriptionStatus })}
                      >
                        <option value="active">Active</option>
                        <option value="canceled">Canceled</option>
                        <option value="past_due">Past due</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Renewal date</label>
                      <input
                        type="date"
                        className="w-full border rounded px-3 py-2"
                        value={sub.renewDate || ''}
                        onChange={(e) => setSubscription(u.email, { ...sub, renewDate: e.target.value })}
                      />
                    </div>
                    <div className="flex items-end gap-2">
                      <button className="px-3 py-2 rounded bg-slate-800 text-white hover:bg-slate-900" onClick={() => setSubscription(u.email, sub)}>Save</button>
                      <button className="px-3 py-2 rounded border hover:bg-slate-50" onClick={() => cancelSubscription(u.email)}>Cancel</button>
                      <button className="px-3 py-2 rounded border hover:bg-slate-50" onClick={() => reactivateSubscription(u.email)}>Reactivate</button>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="text-sm font-medium text-gray-700 mb-2">Per-user feature overrides</div>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {Object.keys(featureAccess).map((f) => {
                        const defaults = featureAccess[f];
                        const userOv = overrides[u.email] || { blocked: false };
                        const val = userOv.features && Object.prototype.hasOwnProperty.call(userOv.features, f) ? !!userOv.features![f] : defaults[u.role];
                        return (
                          <label key={f} className="flex items-center gap-2 text-xs border rounded px-2 py-1">
                            <input
                              type="checkbox"
                              checked={val}
                              onChange={(e) => {
                                const base = overrides[u.email] || { blocked: false };
                                const nextFeatures = { ...(base.features || {}), [f]: e.target.checked };
                                persistOverrides({ ...overrides, [u.email]: { ...base, features: nextFeatures } });
                              }}
                            />
                            <span className="capitalize">{f}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-4">
                    <button className="text-sm text-red-600 hover:text-red-700" onClick={() => removeUser(u.email)}>Remove user</button>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="px-4 py-3 border-t flex items-center justify-between">
            <div className="text-sm text-gray-600">Page {page} of {totalPages}</div>
            <div className="flex items-center gap-2">
              <button className="px-2 py-1 border rounded hover:bg-slate-50 flex items-center gap-1" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                <ChevronLeft className="w-4 h-4" /> Prev
              </button>
              <button className="px-2 py-1 border rounded hover:bg-slate-50 flex items-center gap-1" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

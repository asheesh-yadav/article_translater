import React, { useMemo, useState } from 'react';
import { User, ShieldCheck, BadgeCheck, Eye, EyeOff, RefreshCcw } from 'lucide-react';
import { supabase } from '../supabaseClient'

export type AuthUser = {
  role: 'user' | 'admin' | 'demo';
  name?: string;
  email?: string;
};

interface AuthTabProps {
  currentUser: AuthUser | null;
  onLogin: (user: AuthUser) => void;
  onLogout: () => void;
}

export default function AuthTab({ currentUser, onLogin, onLogout }: AuthTabProps) {
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userName, setUserName] = useState('');
  const [userMode, setUserMode] = useState<'login' | 'register' | 'reset'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminCodeInput, setAdminCodeInput] = useState('');
  const [demoName, setDemoName] = useState('');
  const [demoEmail, setDemoEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const adminCode = (import.meta as any).env?.VITE_ADMIN_ACCESS_CODE || 'ADMIN';
  const demoMode = useMemo(() => {
    const viaEnv = ((import.meta as any).env?.VITE_DEMO_MODE === 'true');
    let viaPref = false;
    try { viaPref = localStorage.getItem('omni.debug') === 'true'; } catch {}
    return viaEnv || viaPref;
  }, []);

  const isValidEmail = (email: string) => /.+@.+\..+/.test(email);
  const passwordStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return Math.min(score, 4);
  };

  const strengthLabel = useMemo(() => {
    const s = passwordStrength(userPassword);
    return s >= 4 ? 'Strong' : s === 3 ? 'Good' : s === 2 ? 'Weak' : 'Very weak';
  }, [userPassword]);

  const readRegistry = (): Record<string, { name?: string; role: 'user' }> => {
    try {
      const raw = localStorage.getItem('omni.auth.registry');
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  };
  const writeRegistry = (reg: Record<string, { name?: string; role: 'user' }>) => {
    localStorage.setItem('omni.auth.registry', JSON.stringify(reg));
  };

  const handleUserLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const email = userEmail.trim();
    if (!email || !isValidEmail(email)) { setError('Enter a valid email.'); return; }
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password: userPassword });
    if (err) { setError(err.message); return; }
    const u = data.user;
    onLogin({ role: 'user', name: (u?.user_metadata as any)?.name, email: u?.email || email });
    setSuccess('Logged in as User');
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!adminEmail.trim()) {
      setError('Please enter admin email.');
      return;
    }
    if (adminCodeInput.trim() !== String(adminCode)) {
      setError('Invalid admin access code.');
      return;
    }
    onLogin({ role: 'admin', email: adminEmail.trim() });
    setSuccess('Logged in as Admin');
  };

  const handleDemoRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!demoEmail.trim()) {
      setError('Please enter an email to create demo account.');
      return;
    }
    onLogin({ role: 'demo', name: demoName.trim() || 'Demo User', email: demoEmail.trim() });
    setSuccess('Demo account created');
  };

  const handleUserRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const email = userEmail.trim();
    const name = userName.trim();
    if (!email || !isValidEmail(email)) { setError('Enter a valid email.'); return; }
    if (passwordStrength(userPassword) < 3) { setError('Use a stronger password (8+ chars, mix cases, numbers).'); return; }
    if (userPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (!acceptTerms) { setError('Please accept the Terms.'); return; }
    const { data, error: err } = await supabase.auth.signUp({ email, password: userPassword, options: { emailRedirectTo: window.location.origin, data: { name } } });
    if (err) { setError(err.message); return; }
    const u = data.user;
    if (u) {
      writeRegistry({ ...readRegistry(), [email]: { name, role: 'user' } });
      setSuccess('Verification email sent. Please check your inbox.');
      setUserMode('login');
    } else {
      setSuccess('Verification email sent.');
    }
  };

  const requestPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const email = userEmail.trim();
    if (!email || !isValidEmail(email)) { setError('Enter a valid email.'); return; }
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
    if (err) { setError(err.message); return; }
    setSuccess('Password reset email sent.');
    setUserMode('reset');
  };

  const performPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (passwordStrength(newPassword) < 3) { setError('Use a stronger new password.'); return; }
    const { error: err } = await supabase.auth.updateUser({ password: newPassword });
    if (err) { setError(err.message); return; }
    setSuccess('Password updated. You can login now.');
    setUserMode('login');
  };

  const sendMagicLink = async () => {
    setError(null);
    setSuccess(null);
    const email = userEmail.trim();
    if (!email || !isValidEmail(email)) { setError('Enter a valid email.'); return; }
    const { error: err } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true, emailRedirectTo: window.location.origin } });
    if (err) { setError(err.message); return; }
    setSuccess('Magic link sent to email.');
  };

  const socialLogin = async (provider: 'google' | 'github') => {
    setError(null);
    setSuccess(null);
    const { error: err } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: window.location.origin } });
    if (err) { setError(err.message); return; }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto py-12 px-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-sm">
            <User className="w-4 h-4" />
            Account
          </div>
          <h1 className="mt-4 text-3xl font-bold text-gray-900">Login & Registration</h1>
          <p className="text-gray-600 mt-2">Create an account or sign in. Admin and demo options included.</p>
          {error && (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
              {success}
            </div>
          )}
        </div>

        {currentUser ? (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              {currentUser.role === 'admin' ? (
                <ShieldCheck className="w-5 h-5 text-blue-600" />
              ) : currentUser.role === 'demo' ? (
                <BadgeCheck className="w-5 h-5 text-green-600" />
              ) : (
                <User className="w-5 h-5 text-gray-700" />
              )}
              <h3 className="text-lg font-semibold text-gray-900">Signed in</h3>
            </div>
            <div className="space-y-1 text-sm text-gray-700">
              <p><span className="font-medium">Role:</span> {currentUser.role}</p>
              {currentUser.name && <p><span className="font-medium">Name:</span> {currentUser.name}</p>}
              {currentUser.email && <p><span className="font-medium">Email:</span> {currentUser.email}</p>}
            </div>
            <div className="mt-4">
              <button
                onClick={onLogout}
                className="px-4 py-2 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg text-sm font-medium text-gray-700"
              >
                Logout
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* User login/register/reset */}
            <form onSubmit={userMode === 'login' ? handleUserLogin : userMode === 'register' ? handleUserRegister : performPasswordReset} className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <button type="button" onClick={() => setUserMode('login')} className={`px-3 py-1.5 rounded-lg text-sm border ${userMode === 'login' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>Login</button>
                <button type="button" onClick={() => setUserMode('register')} className={`px-3 py-1.5 rounded-lg text-sm border ${userMode === 'register' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>Register</button>
                <button type="button" onClick={() => setUserMode('reset')} className={`px-3 py-1.5 rounded-lg text-sm border ${userMode === 'reset' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>Reset</button>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{userMode === 'login' ? 'User Login' : userMode === 'register' ? 'Create account' : 'Reset password'}</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name (optional)</label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    style={{color:"black"}}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                     style={{color:"black"}}
                  />
                </div>
                {userMode !== 'reset' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <div className="flex items-center gap-2">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={userPassword}
                        onChange={(e) => setUserPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                         style={{color:"black"}}
                      />
                      <button type="button" onClick={() => setShowPassword((v) => !v)} className="px-2 py-2 rounded border border-gray-300 bg-white text-gray-700">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Strength: {strengthLabel}</div>
                  </div>
                )}
                {userMode === 'register' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                       style={{color:"black"}}
                    />
                  </div>
                )}
                {userMode === 'reset' && (
                  <>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={(e) => requestPasswordReset(e as any)} className="px-3 py-2 rounded-lg text-sm border bg-white text-gray-700 border-gray-300 hover:bg-gray-50">
                        Generate reset code
                      </button>
                      <RefreshCcw className="w-4 h-4 text-gray-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Enter code</label>
                      <input
                        type="text"
                        value={resetCode}
                        onChange={(e) => setResetCode(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </>
                )}
                {userMode === 'register' && (
                  <div className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} />
                    <span className="text-gray-700">I accept the Terms of Service and Privacy Policy</span>
                  </div>
                )}
              </div>
              <button type="submit" className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">{userMode === 'login' ? 'Login' : userMode === 'register' ? 'Create account' : 'Reset password'}</button>
              {userMode === 'login' && demoMode && <p className="mt-2 text-xs text-gray-500">Accounts created here are stored locally for demo.</p>}
              {userMode === 'login' && (
                <div className="mt-3 flex items-center gap-2">
                  <button type="button" onClick={sendMagicLink} className="px-3 py-2 rounded-lg text-sm border bg-white text-gray-700 border-gray-300 hover:bg-gray-50">Send magic link</button>
                  <button type="button" onClick={() => socialLogin('google')} className="px-3 py-2 rounded-lg text-sm border bg-white text-gray-700 border-gray-300 hover:bg-gray-50">Login with Google</button>
                  <button type="button" onClick={() => socialLogin('github')} className="px-3 py-2 rounded-lg text-sm border bg-white text-gray-700 border-gray-300 hover:bg-gray-50">Login with GitHub</button>
                </div>
              )}
            </form>

            {/* Admin login */}
            <form onSubmit={handleAdminLogin} className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Admin Login</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Admin Email</label>
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    style={{color:'black'}}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Access Code</label>
                  <input
                    type="password"
                    value={adminCodeInput}
                    onChange={(e) => setAdminCodeInput(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    style={{color:'black'}}
                  />
                  <p className="mt-1 text-xs text-gray-500">Use the configured admin access code.</p>
                </div>
              </div>
              <button type="submit" className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700">Login as Admin</button>
            </form>

            {/* Demo registration */}
            <form onSubmit={handleDemoRegister} className="bg-white border border-gray-200 rounded-xl p-6 md:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Demo Account</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={demoName}
                    onChange={(e) => setDemoName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={demoEmail}
                    onChange={(e) => setDemoEmail(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              <button type="submit" className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700">Create Demo</button>
              <p className="mt-2 text-xs text-gray-500">Demo accounts are local-only and intended for quick trials.</p>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react'
import { Settings, Sliders, Check, Eye, EyeOff } from 'lucide-react'
import LanguageSelector from './LanguageSelector'
import type { AuthUser } from './AuthTab'

interface SettingsTabProps {
  formality: 'default' | 'formal' | 'informal'
  onFormalityChange: (f: 'default' | 'formal' | 'informal') => void
  showEditingSidebar: boolean
  onToggleEditingSidebar: () => void
  currentUser?: AuthUser | null
}

// Feature access policy (admin-configurable)
type FeatureAccess = {
  translate: { user: boolean; admin: boolean; demo: boolean }
  article: { user: boolean; admin: boolean; demo: boolean }
  api: { user: boolean; admin: boolean; demo: boolean }
  help: { user: boolean; admin: boolean; demo: boolean }
  settings: { user: boolean; admin: boolean; demo: boolean }
}
const defaultFeatureAccess: FeatureAccess = {
  translate: { user: true, admin: true, demo: true },
  article: { user: true, admin: true, demo: false },
  api: { user: false, admin: true, demo: false },
  help: { user: true, admin: true, demo: true },
  settings: { user: true, admin: true, demo: true },
}

const readPref = (key: string, fallback: string) => {
  try {
    const v = localStorage.getItem(key)
    return v ?? fallback
  } catch {
    return fallback
  }
}

export default function SettingsTab({ formality, onFormalityChange, showEditingSidebar, onToggleEditingSidebar, currentUser }: SettingsTabProps) {
  const [defaultSource, setDefaultSource] = useState<string>(() => readPref('omni.pref.sourceLang', 'Detect language'))
  const [defaultTarget, setDefaultTarget] = useState<string>(() => readPref('omni.pref.targetLang', 'English'))
  const [savedIndicator, setSavedIndicator] = useState<string>('')
  // Omnitrix Write options
  const [writeDefaultMode, setWriteDefaultMode] = useState<'default' | 'formal' | 'informal' | 'concise' | 'expand' | 'simplify' | 'polish' | 'academic' | 'friendly' | 'persuasive' | 'clarify'>(() => (readPref('omni.write.defaultMode', 'default') as any))
  const [writeMaxSuggestions, setWriteMaxSuggestions] = useState<number>(() => {
    const v = parseInt(readPref('omni.write.maxSuggestions', '9'), 10)
    return isNaN(v) ? 9 : Math.min(9, Math.max(8, v))
  })
  const [showWriteStyleTips, setShowWriteStyleTips] = useState<boolean>(() => readPref('omni.write.showStyleTips', 'true') === 'true')
  const [debugMode, setDebugMode] = useState<boolean>(() => readPref('omni.debug', 'false') === 'true')
  const [engineMode, setEngineMode] = useState<'ai' | 'local'>(() => (readPref('omni.engine.mode', 'ai') as any))
  const [writeVariationLevel, setWriteVariationLevel] = useState<1 | 2 | 3>(() => {
    const v = parseInt(readPref('omni.write.variationLevel', '2'), 10)
    return (v === 1 || v === 3) ? (v as 1 | 3) : 2
  })
  const [theme, setTheme] = useState<'system' | 'light' | 'dark'>(() => (readPref('omni.ui.theme', 'system') as any))
  const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || ''
  const anonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || ''
  const [apiStatus, setApiStatus] = useState<'idle' | 'ok' | 'error'>('idle')

  // Admin-configurable feature access state
  const [featureAccess, setFeatureAccess] = useState<FeatureAccess>(() => {
    try {
      const raw = localStorage.getItem('omni.access.features')
      return raw ? JSON.parse(raw) : defaultFeatureAccess
    } catch {
      return defaultFeatureAccess
    }
  })
  const updateFeatureAccess = (feature: keyof FeatureAccess, role: 'user' | 'admin' | 'demo', allowed: boolean) => {
    setFeatureAccess(prev => ({
      ...prev,
      [feature]: { ...prev[feature], [role]: allowed },
    }))
  }

  const saveWithIndicator = (msg: string) => setSavedIndicator(msg)

  useEffect(() => {
    try {
      localStorage.setItem('omni.pref.sourceLang', defaultSource)
      saveWithIndicator('Saved source language')
    } catch {}
  }, [defaultSource])
  useEffect(() => {
    try {
      localStorage.setItem('omni.pref.targetLang', defaultTarget)
      saveWithIndicator('Saved target language')
    } catch {}
  }, [defaultTarget])
  useEffect(() => {
    try {
      localStorage.setItem('omni.pref.formality', formality)
      saveWithIndicator('Saved formality')
    } catch {}
  }, [formality])
  // Persist Omnitrix Write options
  useEffect(() => {
    try {
      localStorage.setItem('omni.write.defaultMode', writeDefaultMode)
      saveWithIndicator('Saved default Ask AI action')
    } catch {}
  }, [writeDefaultMode])
  useEffect(() => {
    try {
      localStorage.setItem('omni.write.maxSuggestions', String(writeMaxSuggestions))
      saveWithIndicator('Saved max suggestions')
    } catch {}
  }, [writeMaxSuggestions])
  useEffect(() => {
    try {
      localStorage.setItem('omni.write.showStyleTips', showWriteStyleTips ? 'true' : 'false')
      saveWithIndicator('Saved style tips visibility')
    } catch {}
  }, [showWriteStyleTips])
  useEffect(() => {
    try {
      localStorage.setItem('omni.debug', debugMode ? 'true' : 'false')
      saveWithIndicator('Saved admin debug mode')
    } catch {}
  }, [debugMode])
  useEffect(() => {
    try {
      localStorage.setItem('omni.engine.mode', engineMode)
      saveWithIndicator('Saved engine mode')
    } catch {}
  }, [engineMode])
  useEffect(() => {
    try {
      localStorage.setItem('omni.write.variationLevel', String(writeVariationLevel))
      saveWithIndicator('Saved variation level')
    } catch {}
  }, [writeVariationLevel])
  useEffect(() => {
    try {
      localStorage.setItem('omni.ui.theme', theme)
      saveWithIndicator('Saved theme')
      window.dispatchEvent(new Event('omni:theme-changed'))
    } catch {}
  }, [theme])

  // Persist feature access toggles
  useEffect(() => {
    try {
      localStorage.setItem('omni.access.features', JSON.stringify(featureAccess))
      saveWithIndicator('Saved feature access')
    } catch {}
  }, [featureAccess])

  const handleReset = () => {
    try {
      localStorage.removeItem('omni.pref.sourceLang')
      localStorage.removeItem('omni.pref.targetLang')
      localStorage.removeItem('omni.pref.formality')
      localStorage.removeItem('omni.write.defaultMode')
      localStorage.removeItem('omni.write.maxSuggestions')
      localStorage.removeItem('omni.write.showStyleTips')
      localStorage.removeItem('omni.engine.mode')
      localStorage.removeItem('omni.write.variationLevel')
      localStorage.removeItem('omni.ui.theme')
    } catch {}
    setDefaultSource('Detect language')
    setDefaultTarget('English')
    onFormalityChange('default')
    setWriteDefaultMode('default')
    setWriteMaxSuggestions(9)
    setShowWriteStyleTips(true)
    setEngineMode('ai')
    setWriteVariationLevel(2)
    setTheme('system')
    if (!showEditingSidebar) onToggleEditingSidebar()
    saveWithIndicator('Preferences reset')
  }

  const resetAllAppData = () => {
    if (currentUser?.role !== 'admin') return
    try {
      localStorage.clear()
    } catch {}
    setDefaultSource('Detect language')
    setDefaultTarget('English')
    onFormalityChange('default')
    setWriteDefaultMode('default')
    setWriteMaxSuggestions(9)
    setShowWriteStyleTips(true)
    setDebugMode(false)
    saveWithIndicator('Admin: All app data cleared')
  }

  return (
    <div className="flex-1 flex overflow-y-auto">
      <div className="flex-1 max-w-5xl mx-auto py-12 px-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-sm">
            <Settings className="w-4 h-4" />
            Settings
          </div>
          <h1 className="mt-4 text-3xl font-bold text-gray-900">Configure your preferences</h1>
          <p className="text-gray-600 mt-2">Defaults you set here will be used across text and file translation.</p>
          {savedIndicator && (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
              <Check className="w-4 h-4" /> {savedIndicator}
            </div>
          )}
          {currentUser?.role === 'admin' && (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-purple-50 border border-purple-200 text-purple-700 rounded-lg text-sm">
              Admin mode enabled
            </div>
          )}
          {currentUser?.role === 'demo' && (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
              Demo mode: some features may be limited
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-gray-700" /> Translation defaults
            </h3>
            <div className="space-y-4">
              <LanguageSelector
                value={defaultSource}
                onChange={setDefaultSource}
                label="Default source language"
                showDetect={true}
              />
              <LanguageSelector
                value={defaultTarget}
                onChange={setDefaultTarget}
                label="Default target language"
                showDetect={false}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Default writing style</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onFormalityChange('default')}
                    className={`px-3 py-1.5 rounded-lg text-sm border ${formality === 'default' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                  >
                    Fluent
                  </button>
                  <button
                    onClick={() => onFormalityChange('formal')}
                    className={`px-3 py-1.5 rounded-lg text-sm border ${formality === 'formal' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                  >
                    Formal
                  </button>
                  <button
                    onClick={() => onFormalityChange('informal')}
                    className={`px-3 py-1.5 rounded-lg text-sm border ${formality === 'informal' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                  >
                    Informal
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Interface</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between border rounded-lg p-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">Show Editing tools sidebar</p>
                  <p className="text-xs text-gray-600">Useful for quick tweaks and AI suggestions while translating.</p>
                </div>
                <button
                  onClick={onToggleEditingSidebar}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm border ${showEditingSidebar ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                >
                  {showEditingSidebar ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  {showEditingSidebar ? 'Visible' : 'Hidden'}
                </button>
              </div>
              <div className="flex items-center justify-between border rounded-lg p-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">Theme</p>
                  <p className="text-xs text-gray-600">Choose light, dark, or follow system.</p>
                </div>
                <div className="flex items-center gap-2">
                  {(['system','light','dark'] as const).map(t => (
                    <button key={t} onClick={() => setTheme(t)} className={`px-3 py-1.5 rounded-lg text-sm border ${theme === t ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>{t}</button>
                  ))}
                </div>
              </div>
              <div className="border rounded-lg p-4">
                <div className="text-sm font-medium text-gray-900 mb-2">Environment</div>
                <div className="text-xs text-gray-600 mb-2">Supabase configuration status and quick test.</div>
                <div className="flex items-center gap-2 text-xs mb-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded border ${supabaseUrl && anonKey ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>{supabaseUrl && anonKey ? 'Configured' : 'Missing'}</span>
                  <span className="break-all text-gray-500">{supabaseUrl || 'VITE_SUPABASE_URL not set'}</span>
                </div>
                <button
                  onClick={async () => {
                    try {
                      if (!supabaseUrl || !anonKey) { setApiStatus('error'); return; }
                      const r = await fetch(`${supabaseUrl}/functions/v1/improve-writing`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${anonKey}` },
                        body: JSON.stringify({ text: 'Ping', language: 'English', mode: 'default', variant: 0 })
                      });
                      setApiStatus(r.ok ? 'ok' : 'error');
                    } catch { setApiStatus('error'); }
                  }}
                  className={`px-3 py-2 rounded-lg text-sm border ${apiStatus === 'ok' ? 'bg-green-50 text-green-700 border-green-200' : apiStatus === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                >
                  {apiStatus === 'idle' ? 'Test API' : apiStatus === 'ok' ? 'API OK' : 'API Error'}
                </button>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg text-sm font-medium text-gray-700"
              >
                Reset to defaults
              </button>
            </div>
          </div>
        </div>

        {/* Omnitrix Write options */}
        <div className="mt-6 bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">LexiMorph Write options</h3>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Default Ask AI action</label>
              <div className="flex items-center gap-2">
                {(['default','formal','informal','concise','expand','simplify','polish','academic','friendly','persuasive','clarify'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setWriteDefaultMode(mode)}
                    className={`px-3 py-1.5 rounded-lg text-sm border ${writeDefaultMode === mode ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                  >
                    {mode === 'default' ? 'Fluent' : mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Engine mode</label>
              <div className="flex items-center gap-2">
                {(['ai','local'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => setEngineMode(m)}
                    className={`px-3 py-1.5 rounded-lg text-sm border ${engineMode === m ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                  >
                    {m === 'ai' ? 'AI + Local' : 'Local only'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Variation strength</label>
              <div className="flex items-center gap-2">
                {[1,2,3].map(n => (
                  <button
                    key={n}
                    onClick={() => setWriteVariationLevel(n as 1 | 2 | 3)}
                    className={`px-3 py-1.5 rounded-lg text-sm border ${writeVariationLevel === n ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                  >
                    {n === 1 ? 'Subtle' : n === 2 ? 'Medium' : 'Strong'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Max suggestions</label>
              <div className="flex items-center gap-2">
                {[1,2,3,4,5,6,7,8,9].map(n => (
                  <button
                    key={n}
                    onClick={() => setWriteMaxSuggestions(n)}
                    className={`px-3 py-1.5 rounded-lg text-sm border ${writeMaxSuggestions === n ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between border rounded-lg p-4">
              <div>
                <p className="text-sm font-medium text-gray-900">Show writing style tips</p>
                <p className="text-xs text-gray-600">Surface guidance to improve clarity and tone.</p>
              </div>
              <button
                onClick={() => setShowWriteStyleTips((v) => !v)}
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm border ${showWriteStyleTips ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
              >
                {showWriteStyleTips ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                {showWriteStyleTips ? 'Visible' : 'Hidden'}
              </button>
            </div>
          </div>
        </div>

        {/* Admin-only controls */}
        {currentUser?.role === 'admin' && (
          <div className="mt-6 bg-white border border-purple-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Admin controls</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between border rounded-lg p-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">Debug mode</p>
                  <p className="text-xs text-gray-600">Stores a flag in local preferences for troubleshooting.</p>
                </div>
                <button
                  onClick={() => setDebugMode((v) => !v)}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm border ${debugMode ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                >
                  {debugMode ? 'On' : 'Off'}
                </button>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={resetAllAppData}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
                >
                  Reset all app data (admin)
                </button>
                <p className="text-xs text-gray-500">Clears local preferences and session.</p>
              </div>

              {/* Feature access policy */}
              <div className="border rounded-lg p-4">
                <p className="text-sm font-medium text-gray-900 mb-2">Feature access (admin)</p>
                <p className="text-xs text-gray-600 mb-4">Grant or revoke access to features for each role. Admin always has access.</p>
                {(['translate','article','api','help','settings'] as Array<keyof FeatureAccess>).map((feat) => (
                  <div key={String(feat)} className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-800 capitalize">{String(feat)}</span>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 text-xs text-gray-700">
                        <input
                          type="checkbox"
                          checked={featureAccess[feat].user}
                          onChange={(e) => updateFeatureAccess(feat, 'user', e.target.checked)}
                        />
                        User
                      </label>
                      <label className="flex items-center gap-2 text-xs text-gray-500">
                        <input
                          type="checkbox"
                          checked={true}
                          disabled
                        />
                        Admin (always allowed)
                      </label>
                      <label className="flex items-center gap-2 text-xs text-gray-700">
                        <input
                          type="checkbox"
                          checked={featureAccess[feat].demo}
                          onChange={(e) => updateFeatureAccess(feat, 'demo', e.target.checked)}
                        />
                        Demo
                      </label>
                    </div>
                  </div>
                ))}
                <div className="mt-3">
                  <button
                    onClick={() => setFeatureAccess(defaultFeatureAccess)}
                    className="px-3 py-2 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg text-xs font-medium text-gray-700"
                  >
                    Restore defaults
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 text-xs text-gray-500">
          Changes save automatically. Defaults apply when you open Translate or Article tabs.
        </div>
      </div>
    </div>
  )
}

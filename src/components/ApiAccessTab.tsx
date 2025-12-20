import { useState } from 'react'
import LanguageSelector from './LanguageSelector'
import { Code, Globe, Shield } from 'lucide-react'

export default function ApiAccessTab() {
  const [text, setText] = useState('')
  const [language, setLanguage] = useState('English')
  const [mode, setMode] = useState<'default' | 'formal' | 'informal' | 'concise' | 'expand' | 'simplify' | 'polish' | 'academic' | 'friendly' | 'persuasive' | 'clarify'>('default')
  const [variant, setVariant] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [response, setResponse] = useState<any>(null)

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
  const ready = !!supabaseUrl && !!anonKey

  const handleInvoke = async () => {
    if (!text.trim()) {
      setError('Enter text to test the API')
      return
    }
    setLoading(true)
    setError(null)
    setResponse(null)
    try {
      const apiUrl = `${supabaseUrl}/functions/v1/improve-writing`
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${anonKey}`,
        },
        body: JSON.stringify({ text, language, mode, variant })
      })
      if (!res.ok) {
        const t = await res.text()
        setError(`API error ${res.status}: ${t}`)
        return
      }
      const data = await res.json()
      setResponse(data)
    } catch (e: any) {
      setError('Network error while calling API')
    } finally {
      setLoading(false)
    }
  }

  const curl = `curl -X POST \n  '${supabaseUrl}/functions/v1/improve-writing' \n  -H 'Authorization: Bearer ${anonKey ? '[REDACTED]' : '<SUPABASE_ANON_KEY>'}' \n  -H 'Content-Type: application/json' \n  -d '{"text":"${text.replace(/"/g, '\\"')}","language":"${language}","mode":"${mode}","variant":${variant}}'`

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-5xl mx-auto py-12 px-8">
        <div className="mb-8">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-sm">
            <Code className="w-4 h-4" />
            API Access
          </div>
          <h1 className="mt-4 text-3xl font-bold text-gray-900">Edge Functions Explorer</h1>
          <p className="text-gray-600 mt-2">Invoke the `improve-writing` function directly and inspect the response.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <Globe className="w-4 h-4 text-blue-600" />
              <div className="text-sm font-semibold text-gray-900">Supabase URL</div>
            </div>
            <div className="text-xs text-gray-600 break-all">{supabaseUrl || 'Not configured'}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-green-600" />
              <div className="text-sm font-semibold text-gray-900">Anon Key</div>
            </div>
            <div className="text-xs text-gray-600">{anonKey ? 'Configured' : 'Not configured'}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="text-sm font-semibold text-gray-900 mb-2">Status</div>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs ${ready ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>{ready ? 'Ready' : 'Missing configuration'}</div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Text</label>
              <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Enter text to improve" className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:outline-none" />
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                  <LanguageSelector value={language} onChange={setLanguage} label="Select language" showDetect={false} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mode</label>
                  <select value={mode} onChange={(e) => setMode(e.target.value as any)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    <option value="default">Default</option>
                    <option value="formal">Formal</option>
                    <option value="informal">Informal</option>
                    <option value="concise">Concise</option>
                    <option value="expand">Expand</option>
                    <option value="simplify">Simplify</option>
                    <option value="polish">Polish</option>
                    <option value="academic">Academic</option>
                    <option value="friendly">Friendly</option>
                    <option value="persuasive">Persuasive</option>
                    <option value="clarify">Clarify</option>
                  </select>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Variant</label>
                  <input type="number" value={variant} onChange={(e) => setVariant(parseInt(e.target.value || '0', 10))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div className="flex items-end">
                  <button onClick={handleInvoke} disabled={!ready || loading} className={`w-full px-4 py-2 rounded-lg text-sm font-medium ${loading ? 'bg-gray-400 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>{loading ? 'Calling...' : 'Call API'}</button>
                </div>
              </div>
              {error && <div className="mt-3 px-3 py-2 bg-red-50 border border-red-200 text-red-700 rounded text-sm">{error}</div>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sample cURL</label>
              <pre className="bg-gray-900 text-gray-100 text-xs rounded-lg p-4 overflow-auto whitespace-pre-wrap">{curl}</pre>
            </div>
          </div>
        </div>

        {response && (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="text-sm font-semibold text-gray-900 mb-2">Response</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="text-xs font-medium text-gray-700 mb-1">Improved Text</div>
                <div className="p-3 border border-gray-200 rounded-lg text-sm text-gray-900 whitespace-pre-wrap">{response.improvedText || ''}</div>
              </div>
              <div>
                <div className="text-xs font-medium text-gray-700 mb-1">Suggestions</div>
                <div className="space-y-2">
                  {(response.suggestions || []).slice(0, 9).map((s: any, i: number) => (
                    <div key={i} className="p-3 border border-gray-200 rounded-lg text-sm">
                      <div className="text-gray-900 whitespace-pre-wrap">{s.text}</div>
                      <div className="text-xs text-gray-500 mt-1">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


export default function HelpSupport() {
  const handleWhatsApp = () => {
    window.open('https://wa.me/919560010759', '_blank');
  };
  const handleEmail = () => {
    window.location.href = 'mailto:info@omnitrix.in';
  };
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-6xl mx-auto py-12 px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Help &amp; Support</h1>
        <p className="text-gray-600 mb-6">
          Get help with using LexiMorph Translator and contact our support team.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 text-left">
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Getting Started</h2>
            <p className="text-slate-600">Quick steps for each feature.</p>
            <ul className="mt-3 list-disc list-inside text-slate-600 space-y-1">
              <li>Translate text: paste text, choose source/target, view result.</li>
              <li>Translate files: upload DOCX/PPTX/XLSX/TXT and select target.</li>
              <li>Article translator: paste a URL, Extract, then Preview Translation.</li>
              <li>LexiMorph Write: type text, choose a style, click Ask AI.</li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 text-left">
            <h2 className="text-xl font-semibold text-slate-900 mb-2">FAQ</h2>
            <div className="space-y-3">
              <details className="group">
                <summary className="cursor-pointer font-medium text-slate-800 group-open:text-blue-600">How do I change default languages?</summary>
                <p className="mt-2 text-slate-600">Open Settings from the sidebar and set your preferred source and target language. The app will remember your choices.</p>
              </details>
              <details className="group">
                <summary className="cursor-pointer font-medium text-slate-800 group-open:text-blue-600">How does Ask AI decide what to do?</summary>
                <p className="mt-2 text-slate-600">In Settings, set the Default "Ask AI" action for LexiMorph Write. Options include Fluent, Formal, Casual, Expand, Shorten, Simplify, Clarify, Polish, Academic, Friendly, and Persuasive.</p>
              </details>
              <details className="group">
                <summary className="cursor-pointer font-medium text-slate-800 group-open:text-blue-600">Can I limit suggestions?</summary>
                <p className="mt-2 text-slate-600">Yes. In Settings, set Max suggestions for LexiMorph Write. The UI shows up to 9 suggestions and keeps at least 8 distinct options.</p>
              </details>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 text-left">
            <h2 className="text-xl font-semibold text-slate-900 mb-2">LexiMorph Write Tips</h2>
            <ul className="text-slate-600 space-y-2">
              <li>Use the chips to pick styles like Formal, Casual, Concise, Expand, Simplify, Clarify, Polish, Academic, Friendly, Persuasive.</li>
              <li>Engine mode: select <span className="font-semibold">AI + Local</span> to merge server and local suggestions, or <span className="font-semibold">Local only</span> to work offline.</li>
              <li>Max suggestions: set in Settings. The app shows 8–9 unique suggestions for variety.</li>
              <li>Variation strength: choose Subtle, Medium, or Strong in Settings for more diversity.</li>
              <li>Shortcut: press <span className="font-semibold">Ctrl+D</span> to trigger Ask AI while typing.</li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 text-left">
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Article Translator Tips</h2>
            <ul className="text-slate-600 space-y-2">
              <li>Paste the article URL and click Extract to load content.</li>
              <li>Set source language to Detect language to auto-detect the headline.</li>
              <li>Use Preview Translation to see original vs translated side-by-side.</li>
              <li>Keywords to Highlight accepts a comma-separated list to emphasize terms.</li>
              <li>If site messages appear, re-extract or try a direct article URL; filters remove most cookie/legal/e‑commerce text.</li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 text-left">
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Troubleshooting</h2>
            <ul className="text-slate-600 space-y-2">
              <li>Check Settings → Environment and click Test API to verify Supabase.</li>
              <li>If API is missing, switch Engine mode to Local only in Settings.</li>
              <li>Ensure <span className="font-mono">VITE_SUPABASE_URL</span> and <span className="font-mono">VITE_SUPABASE_ANON_KEY</span> are set.</li>
              <li>Use Regenerate in AI Suggestions for a fresh set of variants.</li>
            </ul>
          </div>

          {/* Contact Support */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 text-left">
            <h2 className="text-xl font-semibold text-slate-900 mb-3">Contact Support</h2>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleWhatsApp}
                className="flex-1 flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                <span className="inline-flex items-center justify-center w-8 h-8 bg-white/20 rounded-lg">
                  {/* WhatsApp icon simplified */}
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                </span>
                <span>WhatsApp</span>
              </button>
              <button
                onClick={handleEmail}
                className="flex-1 flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                <span className="inline-flex items-center justify-center w-8 h-8 bg-white/20 rounded-lg">
                  {/* Mail icon */}
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 4h16v16H4z"/><path d="M22 6l-10 7L2 6"/></svg>
                </span>
                <span>Email</span>
              </button>
            </div>
            <p className="mt-3 text-xs text-slate-500">Available 24/7</p>
          </div>
        </div>
      </div>
    </div>
  );
}

import { Menu, X, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';

interface NavbarProps {
  onNavigate: (tab: string) => void;
}

export default function Navbar({ onNavigate }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-500
      ${
        scrolled
          ? 'bg-slate-950/60 backdrop-blur-2xl border-b border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.5)]'
          : 'bg-slate-950/30 backdrop-blur-xl'
      }`}
    >
      {/* glow line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />

      <div className="relative max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">

        {/* Logo */}
        <div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => onNavigate('home')}
        >
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500/30 blur-xl opacity-0 group-hover:opacity-100 transition" />
            <img src="/omnitrix-logo.svg" alt="Omnitrix" className="h-14 relative z-10" />
          </div>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-10 text-lg font-semibold">
          {[
            { label: 'Translate', key: 'translate' },
            { label: 'Write', key: 'write' },
            { label: 'Documents', key: 'documents' },
              { label: 'Contact', key: 'contact' }, 
            { label: 'Help', key: 'help' },
            
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className="relative text-slate-300 hover:text-white transition group"
            >
              {item.label}
              <span className="absolute -bottom-2 left-1/2 w-0 h-[2px] bg-gradient-to-r from-blue-400 to-purple-400 group-hover:w-full group-hover:left-0 transition-all duration-300 rounded-full" />
            </button>
          ))}
        </nav>

        {/* Actions */}
        <div className="hidden md:flex items-center gap-4">
          <button
            onClick={() => onNavigate('account')}
            className="text-lg text-slate-200 hover:text-white transition"
          >
            Login
          </button>

          <button
            onClick={() => onNavigate('translate')}
            className="relative px-6 py-3 rounded-2xl text-lg font-bold text-white
            bg-gradient-to-r from-blue-600 to-purple-600
            shadow-[0_10px_30px_rgba(99,102,241,0.4)]
            hover:shadow-[0_15px_40px_rgba(168,85,247,0.6)]
            hover:scale-105 transition-all"
          >
            <span className="relative z-10 flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Get Started
            </span>
          </button>
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden text-white"
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden bg-slate-950/90 backdrop-blur-2xl border-t border-white/10 px-6 py-8 space-y-6 text-lg">
          {[
            { label: 'Translate', key: 'translate' },
            { label: 'Write', key: 'write' },
            { label: 'Documents', key: 'documents' },
             { label: 'Contact', key: 'contact' }, 
            { label: 'Help', key: 'help' },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              
              className="block w-full text-left text-slate-300 hover:text-white transition"
            >
              {item.label}
            </button>
          ))}

          <div className="pt-6 border-t border-white/10 flex gap-4">
            <button
              onClick={() => onNavigate('account')}
              className="flex-1 py-3 rounded-xl border border-white/20 text-white"
            >
              Login
            </button>
            <button
              onClick={() => onNavigate('translate')}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold"
            >
              Get Started
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

import { Globe, FileText, Wand2, Languages, Zap, Shield, ArrowRight, Sparkles, TrendingUp, Lock, Quote, Star } from 'lucide-react';
import { useState, useEffect } from 'react';
import Navbar from './Navbar';

interface HomePageProps {
  onNavigate: (tab: string) => void;
}

export default function HomePage({ onNavigate }: HomePageProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const features = [
    {
      icon: Languages,
      title: 'Text Translation',
      description: 'Translate text between multiple languages instantly with AI-powered accuracy and context awareness.',
      gradient: 'from-blue-500 via-cyan-500 to-teal-500',
      color: 'blue'
    },
    {
      icon: FileText,
      title: 'Document Translation',
      description: 'Upload and translate entire documents while preserving formatting. Supports Word, PDF, and more.',
      gradient: 'from-purple-500 via-pink-500 to-rose-500',
      color: 'purple'
    },
    {
      icon: Wand2,
      title: 'AI Writing Assistant',
      description: 'Improve your writing with multiple AI-powered suggestions. Rewrite, formalize, or make content more engaging.',
      gradient: 'from-orange-500 via-red-500 to-pink-500',
      color: 'orange'
    },
    {
      icon: Globe,
      title: 'Web Article Translation',
      description: 'Translate entire web articles by simply pasting a URL. Get clean, formatted translations instantly.',
      gradient: 'from-green-500 via-emerald-500 to-teal-500',
      color: 'green'
    },
    {
      icon: Zap,
      title: 'Real-time Processing',
      description: 'Experience lightning-fast translations and suggestions as you type with our optimized AI engine.',
      gradient: 'from-yellow-500 via-orange-500 to-red-500',
      color: 'yellow'
    },
    {
      icon: Shield,
      title: 'Privacy Focused',
      description: 'Your data is secure and private. We never store your translations or share your content.',
      gradient: 'from-blue-500 via-indigo-500 to-purple-500',
      color: 'indigo'
    }
  ];

  const stats = [
    { value: '100+', label: 'Languages Supported', icon: Languages },
    { value: '1M+', label: 'Translations Daily', icon: TrendingUp },
    { value: '99.9%', label: 'Accuracy Rate', icon: Sparkles },
    { value: '<1s', label: 'Average Speed', icon: Zap }
  ];

  // Modern homepage additions
  const brands = [
    { name: 'WaveAI', className: 'from-blue-400 to-cyan-400' },
    { name: 'OmniCorp', className: 'from-purple-400 to-pink-400' },
    { name: 'TransLab', className: 'from-emerald-400 to-teal-400' },
    { name: 'Polyglot', className: 'from-orange-400 to-amber-400' },
    { name: 'NovaTech', className: 'from-indigo-400 to-violet-400' },
    { name: 'Zenify', className: 'from-rose-400 to-fuchsia-400' },
    { name: 'Quanta', className: 'from-sky-400 to-blue-500' },
  ];

  const testimonials = [
    {
      quote: 'LexiMorph has transformed our localization workflow—fast, accurate, and a joy to use.',
      name: 'Ava Johnson',
      role: 'Localization Lead, WaveAI',
    },
    {
      quote: 'The AI writing assistant is incredible. Our content quality and speed skyrocketed.',
      name: 'Rahul Mehta',
      role: 'Content Director, OmniCorp',
    },
    {
      quote: 'Document translation preserves layout perfectly. Huge time saver for our team.',
      name: 'Sofia Martínez',
      role: 'Project Manager, TransLab',
    },
  ];

  return (
    <>
      <Navbar onNavigate={onNavigate} />
    <div className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent"></div>

      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(59, 130, 246, 0.15), transparent 40%)`
        }}
      ></div>

      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12 relative z-10">
        <div className="text-center mb-20">
          <div className="flex items-center justify-start mb-8 animate-float">
            {/* <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur-2xl opacity-50 animate-pulse"></div>
              <img
                src="/omnitrix-logo.svg"
                alt="Omnitrix Logo"
                className="h-20 w-auto relative z-10 drop-shadow-2xl"
              />
            </div> */}
          </div>

          <div className="inline-flex items-center gap-2 px-4 mt-8 py-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-xl border border-blue-500/20 rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-blue-300">Powered by Advanced AI</span>
          </div>

          <h1 className="text-6xl md:text-7xl lg:text-8xl font-black text-white mb-6 leading-tight">
            Welcome to{' '}
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient">
               LexiMorph
              </span>
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 blur-2xl opacity-20 -z-10"></div>
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-slate-300 max-w-4xl mx-auto mb-10 leading-relaxed">
            Your all-in-one AI-powered translation and writing platform. Translate text, documents, and web articles while improving your writing with intelligent suggestions.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => onNavigate('translate')}
              className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold text-lg shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative flex items-center gap-2">
                Get Started Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>

            <button
              onClick={() => onNavigate('account')}
              className="px-8 py-4 bg-white/5 backdrop-blur-xl border border-white/10 text-white rounded-2xl font-semibold text-lg hover:bg-white/10 hover:border-white/20 transition-all duration-300"
            >
              Login
            </button>

            <button
              onClick={() => onNavigate('demo')}
              className="px-8 py-4 bg-white/5 backdrop-blur-xl border border-white/10 text-white rounded-2xl font-semibold text-lg hover:bg-white/10 hover:border-white/20 transition-all duration-300"
            >
              Watch Demo
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="group relative bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-2xl border border-white/10 rounded-2xl p-6 hover:border-blue-500/50 transition-all duration-300 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/5 group-hover:to-purple-500/5 transition-all duration-300"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <Icon className="w-8 h-8 text-blue-400" />
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  </div>
                  <div className="text-4xl font-black bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
                    {stat.value}
                  </div>
                  <div className="text-slate-400 text-sm font-medium">{stat.label}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Trusted by logos */}
        <div className="relative mb-20">
          <div className="relative bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-xl">
            <div className="flex items-center justify-center mb-6">
              <span className="text-slate-300 font-semibold">Trusted by teams at</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-4">
              {brands.map((brand, i) => (
                <div key={i} className="group h-16 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center hover:border-blue-400/40 transition-all">
                  <span className={`text-sm sm:text-base font-bold bg-gradient-to-r ${brand.className} bg-clip-text text-transparent`}>
                    {brand.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Testimonials */}
        <div className="mb-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">Loved by teams</h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">Real stories from people using LexiMorph every day</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, idx) => (
              <div key={idx} className="group relative bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-2xl border border-white/10 rounded-3xl p-8 hover:border-blue-500/40 transition-all overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/5 group-hover:to-purple-500/5 blur-2xl"></div>
                <div className="relative">
                  <div className="flex items-center gap-2 mb-4 text-amber-300">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4" />
                    ))}
                  </div>
                  <p className="text-slate-300 leading-relaxed mb-6">
                    <span className="inline-flex items-center gap-2 text-blue-300">
                      <Quote className="w-5 h-5" />
                      <span className="sr-only">Quote</span>
                    </span>
                    {t.quote}
                  </p>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white font-semibold">{t.name}</div>
                      <div className="text-slate-400 text-sm">{t.role}</div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-lg">
                      {t.name.split(' ').map(w => w[0]).slice(0,2).join('')}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              Powerful Features
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Everything you need for translation and writing in one comprehensive platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  onMouseEnter={() => setHoveredCard(index)}
                  onMouseLeave={() => setHoveredCard(null)}
                  className="group relative bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-2xl border border-white/10 rounded-3xl p-8 hover:border-white/20 transition-all duration-500 overflow-hidden"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500 blur-2xl`}></div>

                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>

                  <div className="relative">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-xl`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>

                    <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-purple-400 group-hover:bg-clip-text transition-all duration-300">
                      {feature.title}
                    </h3>

                    <p className="text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors duration-300">
                      {feature.description}
                    </p>

                    <div className={`mt-6 flex items-center gap-2 text-blue-400 opacity-0 group-hover:opacity-100 transition-all duration-300 ${hoveredCard === index ? 'translate-x-2' : ''}`}>
                      <span className="text-sm font-semibold">Learn more</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="relative mb-20">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl blur-3xl opacity-20"></div>
          <div className="relative bg-gradient-to-r from-blue-600/90 to-purple-600/90 backdrop-blur-xl rounded-3xl p-12 md:p-16 text-center border border-white/10 overflow-hidden">
            <div className="absolute top-0 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full mb-6">
                <Lock className="w-4 h-4 text-white" />
                <span className="text-sm font-medium text-white">No Credit Card Required</span>
              </div>

              <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
                Ready to Transform Your Workflow?
              </h2>
              <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
                Join thousands of users who trust LexiMorph for their translation and writing needs
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={() => onNavigate('translate')}
                  className="group px-10 py-5 bg-white text-blue-600 rounded-2xl font-bold text-lg shadow-2xl hover:shadow-white/20 hover:scale-105 transition-all duration-300"
                >
                  <span className="flex items-center gap-2">
                    Start Translating Now
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>

                <button
                  onClick={() => onNavigate('help')}
                  className="px-10 py-5 bg-white/10 backdrop-blur-xl border border-white/20 text-white rounded-2xl font-bold text-lg hover:bg-white/20 transition-all duration-300"
                >
                  Contact Sales
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <div className="inline-flex items-center gap-3 text-slate-500 text-sm">
            <Sparkles className="w-4 h-4" />
            <span>Powered by advanced AI technology</span>
            <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
            <span>Trusted by professionals worldwide</span>
            <Sparkles className="w-4 h-4" />
          </div>
        </div>
      </div>


 {/* footer */}
 <footer
  data-reveal
  className="mt-24 border-t border-white/10 bg-black/40 backdrop-blur-xl"
>
  <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-8 text-slate-400">

    <div>
      <img src="/omnitrix-logo.png" alt="LexiMorph" className="h-10 mb-4" />
      <p className="text-sm leading-relaxed">
        LexiMorph is an AI-powered translation & writing platform trusted by teams worldwide.
      </p>
    </div>

    <div>
      <h4 className="text-white font-semibold mb-3">Product</h4>
      <ul className="space-y-2 text-sm">
        <li className="hover:text-white cursor-pointer">Translation</li>
        <li className="hover:text-white cursor-pointer">Writing Assistant</li>
        <li className="hover:text-white cursor-pointer">Document AI</li>
      </ul>
    </div>

    <div>
      <h4 className="text-white font-semibold mb-3">Company</h4>
      <ul className="space-y-2 text-sm">
        <li className="hover:text-white cursor-pointer">About</li>
        <li className="hover:text-white cursor-pointer">Careers</li>
        <li className="hover:text-white cursor-pointer">Contact</li>
      </ul>
    </div>

    <div>
      <h4 className="text-white font-semibold mb-3">Legal</h4>
      <ul className="space-y-2 text-sm">
        <li className="hover:text-white cursor-pointer">Privacy Policy</li>
        <li className="hover:text-white cursor-pointer">Terms of Service</li>
      </ul>
    </div>
  </div>

  <div className="border-t border-white/10 text-center py-6 text-xs text-slate-500">
    © {new Date().getFullYear()} LexiMorph. All rights reserved.
  </div>
</footer>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }

        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }

        .delay-1000 {
          animation-delay: 1s;
        }

        /* New subtle shimmer for cards */
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .animate-shimmer {
          background-image: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0) 100%);
          background-size: 200% 100%;
          animation: shimmer 2s linear infinite;
        }
      `}</style>
    </div>
    </>
  );
}

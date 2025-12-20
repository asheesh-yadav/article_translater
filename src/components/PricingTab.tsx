import { useEffect, useMemo, useState } from 'react'
import type { AuthUser } from './AuthTab'
import { Check, Zap, Shield } from 'lucide-react'

interface PricingTabProps {
  currentUser?: AuthUser | null
}

type Plan = 'free' | 'pro' | 'enterprise'

export default function PricingTab({ currentUser }: PricingTabProps) {
  const email = currentUser?.email || ''
  const [currentPlan, setCurrentPlan] = useState<Plan>(() => {
    try {
      const raw = localStorage.getItem('omni.subscriptions')
      const subs = raw ? JSON.parse(raw) as Record<string, { plan: Plan; status: 'active' | 'canceled' | 'past_due' }> : {}
      const sub = email ? subs[email] : undefined
      return (sub?.plan || 'free') as Plan
    } catch { return 'free' }
  })

  useEffect(() => {
    try {
      const raw = localStorage.getItem('omni.subscriptions')
      const subs = raw ? JSON.parse(raw) as Record<string, { plan: Plan; status: 'active' | 'canceled' | 'past_due' }> : {}
      const sub = email ? subs[email] : undefined
      setCurrentPlan(((sub?.plan || 'free') as Plan))
    } catch {}
  }, [email])

  const selectPlan = async (plan: Plan) => {
    if (!email) return
    try {
      const raw = localStorage.getItem('omni.subscriptions')
      const subs = raw ? JSON.parse(raw) as Record<string, { plan: Plan; status: 'active' | 'canceled' | 'past_due' }> : {}
      subs[email] = { plan, status: 'active' }
      localStorage.setItem('omni.subscriptions', JSON.stringify(subs))
      setCurrentPlan(plan)
    } catch {}
  }

  const plans = useMemo(() => ([
    {
      id: 'free' as Plan,
      name: 'Free',
      price: '$0',
      period: 'forever',
      features: [
        'Text translation',
        'AI writing assistant (limited)',
        'Web article translation (limited)',
        'No API access',
      ],
      badge: 'Start here',
    },
    {
      id: 'pro' as Plan,
      name: 'Pro',
      price: '$12',
      period: 'per month',
      features: [
        'Faster, higher quality translation',
        'AI writing with more suggestions',
        'Web article translation unlocked',
        'API access for integrations',
      ],
      badge: 'Popular',
    },
    {
      id: 'enterprise' as Plan,
      name: 'Enterprise',
      price: 'Custom',
      period: 'annual',
      features: [
        'Tailored workflows and controls',
        'Priority support and SLAs',
        'Admin features and audit logs',
        'Bulk usage and pricing',
      ],
      badge: 'Best value',
    },
  ]), [])

  return (
    <div className="flex-1 flex overflow-y-auto">
      <div className="flex-1 max-w-6xl mx-auto py-12 px-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-sm">
            <Shield className="w-4 h-4" />
            Plans
          </div>
          <h1 className="mt-4 text-3xl font-bold text-gray-900">Choose the plan that fits you</h1>
          <p className="text-gray-600 mt-2">Compare features across Free, Pro, and Enterprise.</p>
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border bg-white text-gray-700 border-gray-300">
            {email ? (
              <span>Current plan: <span className="font-semibold capitalize">{currentPlan}</span></span>
            ) : (
              <span>Login to select a plan</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((p) => (
            <div key={p.id} className={`rounded-xl border shadow-sm p-6 bg-white ${p.id === 'pro' ? 'ring-2 ring-blue-200' : ''}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{p.name}</h3>
                <span className={`text-xs px-2 py-1 rounded border ${p.id === 'pro' ? 'bg-blue-50 text-blue-700 border-blue-200' : p.id === 'enterprise' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-green-50 text-green-700 border-green-200'}`}>{p.badge}</span>
              </div>
              <div className="mb-4">
                <div className="text-3xl font-bold text-gray-900">{p.price}</div>
                <div className="text-xs text-gray-600">{p.period}</div>
              </div>
              <ul className="space-y-2 mb-6">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-800">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => selectPlan(p.id)}
                disabled={!email}
                className={`w-full px-4 py-2 rounded-lg text-sm font-medium border ${!email ? 'opacity-50 cursor-not-allowed bg-white text-gray-400 border-gray-300' : currentPlan === p.id ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
              >
                {email ? (currentPlan === p.id ? 'Selected' : 'Choose plan') : 'Login to choose'}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm border bg-white text-gray-700 border-gray-300">
            <Zap className="w-4 h-4" />
            Pro and Enterprise unlock API access for integrations.
          </div>
        </div>
      </div>
    </div>
  )
}


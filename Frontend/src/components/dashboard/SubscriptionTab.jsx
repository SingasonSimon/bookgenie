import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Star, Crown, Zap, Check, ArrowUp } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import PageHeader from '../PageHeader'
import Spinner from '../Spinner'

export default function SubscriptionTab() {
  const { user } = useAuth()
  const [requestedLevel, setRequestedLevel] = useState('basic')
  const [loading, setLoading] = useState(false)

  const handleRequest = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('bookgenie_token')
      const response = await fetch('http://localhost:5000/api/user/subscription/request', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ subscription_level: requestedLevel })
      })
      const data = await response.json()
      if (data.success) {
        alert('Subscription upgrade requested successfully!')
      }
    } catch (error) {
      console.error('Subscription request error:', error)
    } finally {
      setLoading(false)
    }
  }

  const plans = [
    {
      name: 'Free',
      icon: Star,
      features: ['Access to free books', 'Basic search', 'Reading progress'],
      current: (user?.subscriptionLevel || 'free') === 'free',
    },
    {
      name: 'Basic',
      icon: Zap,
      features: ['All free features', 'Access to basic books', 'Enhanced recommendations'],
      current: user?.subscriptionLevel === 'basic',
    },
    {
      name: 'Premium',
      icon: Crown,
      features: ['All basic features', 'Access to premium books', 'Priority support', 'Advanced analytics'],
      current: user?.subscriptionLevel === 'premium',
    },
  ]

  return (
    <div>
      <PageHeader
        icon={Star}
        title="Subscription"
        description="Manage your subscription plan"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        {plans.map((plan, idx) => {
          const Icon = plan.icon
          return (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`card relative ${plan.current ? 'ring-2 ring-primary-500 shadow-lg' : ''}`}
            >
              {plan.current && (
                <div className="absolute top-4 right-4 px-3 py-1 bg-primary-600 text-white text-xs font-semibold rounded-full">
                  Current
                </div>
              )}
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  plan.name === 'Free' ? 'bg-gray-100' :
                  plan.name === 'Basic' ? 'bg-blue-100' : 'bg-amber-100'
                }`}>
                  <Icon className={`w-6 h-6 ${
                    plan.name === 'Free' ? 'text-gray-600' :
                    plan.name === 'Basic' ? 'text-blue-600' : 'text-amber-600'
                  }`} />
                </div>
                <h3 className="text-xl font-display font-bold text-gray-900">{plan.name}</h3>
              </div>
              <ul className="space-y-2 mb-6">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </motion.div>
          )
        })}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="card max-w-2xl"
      >
        <h2 className="text-xl font-display font-bold mb-6 flex items-center gap-2">
          <ArrowUp className="w-5 h-5 text-primary-600" />
          Upgrade Plan
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block mb-2 font-medium text-gray-700">Select Plan:</label>
            <select
              value={requestedLevel}
              onChange={(e) => setRequestedLevel(e.target.value)}
              className="input-field"
            >
              <option value="basic">Basic</option>
              <option value="premium">Premium</option>
            </select>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleRequest}
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 text-sm"
          >
            {loading ? (
              <>
                <Spinner size="sm" />
                Requesting...
              </>
            ) : (
              <>
                <ArrowUp className="w-5 h-5" />
                Request Upgrade
              </>
            )}
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}


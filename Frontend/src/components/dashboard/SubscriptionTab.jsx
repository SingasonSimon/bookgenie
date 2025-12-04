import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Star, Crown, Zap, Check, ArrowUp, AlertCircle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import PageHeader from '../PageHeader'
import Spinner from '../Spinner'
import Notification from '../Notification'
import { BookGenieAPI } from '../../services/api'

export default function SubscriptionTab() {
  const { user, checkAuth } = useAuth()
  const [requestedLevel, setRequestedLevel] = useState('basic')
  const [loading, setLoading] = useState(false)
  const [notification, setNotification] = useState(null)
  const [requestHistory, setRequestHistory] = useState([])
  const api = new BookGenieAPI()

  useEffect(() => {
    loadSubscriptionInfo()
  }, [])

  const loadSubscriptionInfo = async () => {
    try {
      const token = localStorage.getItem('bookgenie_token')
      const response = await fetch('http://localhost:5000/api/user/subscription', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      })
      if (response.ok) {
        const data = await response.json()
        setRequestHistory(data.requestHistory || [])
      }
    } catch (error) {
      console.error('Failed to load subscription info:', error)
    }
  }

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 4000)
  }

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
      
      if (response.ok && data.success) {
        showNotification('Subscription upgrade requested successfully! An admin will review your request.', 'success')
        await loadSubscriptionInfo()
        // Refresh user data to get updated subscription status
        await checkAuth()
      } else {
        showNotification(data.error || 'Failed to submit subscription request', 'error')
      }
    } catch (error) {
      console.error('Subscription request error:', error)
      showNotification('Network error. Please try again.', 'error')
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

  const currentLevel = user?.subscriptionLevel || 'free'
  const hasPendingRequest = requestHistory.some(r => r.status === 'pending')

  return (
    <div>
      <PageHeader
        icon={Star}
        title="Subscription"
        description="Manage your subscription plan"
      />

      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      {hasPendingRequest && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card bg-blue-50 border border-blue-200 mb-6"
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-blue-900">Subscription Request Pending</p>
              <p className="text-sm text-blue-700">Your upgrade request is being reviewed by an administrator.</p>
            </div>
          </div>
        </motion.div>
      )}

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
              disabled={hasPendingRequest || currentLevel === 'premium'}
            >
              {currentLevel === 'free' && <option value="basic">Basic</option>}
              {currentLevel !== 'premium' && <option value="premium">Premium</option>}
            </select>
            {currentLevel === 'premium' && (
              <p className="text-sm text-gray-600 mt-2">You already have the highest tier subscription.</p>
            )}
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleRequest}
            disabled={loading || hasPendingRequest || currentLevel === 'premium'}
            className="btn-primary w-full flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Spinner size="sm" />
                Requesting...
              </>
            ) : hasPendingRequest ? (
              <>
                <AlertCircle className="w-5 h-5" />
                Request Pending
              </>
            ) : currentLevel === 'premium' ? (
              'Already Premium'
            ) : (
              <>
                <ArrowUp className="w-5 h-5" />
                Request Upgrade
              </>
            )}
          </motion.button>
        </div>
      </motion.div>

      {requestHistory.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card max-w-2xl"
        >
          <h2 className="text-xl font-display font-bold mb-4">Request History</h2>
          <div className="space-y-2">
            {requestHistory.map((request, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900 capitalize">
                    {request.requestedLevel} Subscription
                  </p>
                  <p className="text-sm text-gray-600">
                    Requested on {new Date(request.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  request.status === 'approved' ? 'bg-green-100 text-green-700' :
                  request.status === 'rejected' ? 'bg-red-100 text-red-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {request.status}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}


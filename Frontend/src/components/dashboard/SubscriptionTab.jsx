import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Star, Crown, Zap, Check, ArrowUp, AlertCircle, Clock } from 'lucide-react'
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {plans.map((plan, idx) => {
          const Icon = plan.icon
          const isFree = plan.name === 'Free'
          const isBasic = plan.name === 'Basic'
          const isPremium = plan.name === 'Premium'
          
          return (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className={`card relative flex flex-col h-full transition-all ${
                plan.current 
                  ? 'ring-2 ring-primary-500 shadow-xl bg-gradient-to-br from-primary-50 to-white' 
                  : 'hover:shadow-lg'
              }`}
            >
              {/* Current Badge */}
              {plan.current && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-3 right-4 px-4 py-1.5 bg-primary-600 text-white text-xs font-bold rounded-full shadow-lg z-10"
                >
                  Current Plan
                </motion.div>
              )}

              {/* Header */}
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md transition-all ${
                  isFree ? 'bg-gradient-to-br from-gray-100 to-gray-200' :
                  isBasic ? 'bg-gradient-to-br from-blue-100 to-blue-200' : 
                  'bg-gradient-to-br from-amber-100 to-yellow-200'
                }`}>
                  <Icon className={`w-8 h-8 ${
                    isFree ? 'text-gray-700' :
                    isBasic ? 'text-blue-700' : 'text-amber-700'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-2xl font-display font-bold text-gray-900 mb-1">
                    {plan.name}
                  </h3>
                  {isPremium && (
                    <div className="flex items-center gap-1">
                      <Crown className="w-4 h-4 text-amber-600" />
                      <span className="text-xs font-semibold text-amber-600 uppercase tracking-wide">
                        Most Popular
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Features List */}
              <div className="flex-1 mb-6">
                <ul className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 + i * 0.05 }}
                      className="flex items-start gap-3"
                    >
                      <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3.5 h-3.5 text-green-600" />
                      </div>
                      <span className="text-sm text-gray-700 leading-relaxed">{feature}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>

              {/* Footer - Status Indicator */}
              <div className="pt-4 border-t border-gray-200">
                {plan.current ? (
                  <div className="flex items-center justify-center gap-2 py-2 px-4 bg-primary-50 rounded-lg">
                    <Check className="w-4 h-4 text-primary-600" />
                    <span className="text-sm font-semibold text-primary-700">Active Plan</span>
                  </div>
                ) : (
                  <div className="text-center py-2">
                    <span className="text-xs text-gray-500 font-medium">
                      {isFree ? 'Default Plan' : 'Upgrade Available'}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      <div className={`grid gap-6 ${requestHistory.length > 0 ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 max-w-2xl'}`}>
        {/* Upgrade Request Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
              <ArrowUp className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold text-gray-900">Upgrade Plan</h2>
              <p className="text-sm text-gray-600 mt-0.5">Request a subscription upgrade</p>
            </div>
          </div>
          <div className="space-y-5">
            <div>
              <label className="block mb-2 font-semibold text-gray-700 text-sm">
                Select Plan to Upgrade To:
              </label>
              <select
                value={requestedLevel}
                onChange={(e) => setRequestedLevel(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none bg-white"
                disabled={hasPendingRequest || currentLevel === 'premium'}
              >
                {currentLevel === 'free' && <option value="basic">Basic Plan</option>}
                {currentLevel !== 'premium' && <option value="premium">Premium Plan</option>}
              </select>
              {currentLevel === 'premium' && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800 font-medium">
                    ✓ You already have the highest tier subscription.
                  </p>
                </div>
              )}
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleRequest}
              disabled={loading || hasPendingRequest || currentLevel === 'premium'}
              className="w-full px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary-600"
            >
              {loading ? (
                <>
                  <Spinner size="sm" />
                  <span>Requesting...</span>
                </>
              ) : hasPendingRequest ? (
                <>
                  <AlertCircle className="w-5 h-5" />
                  <span>Request Pending</span>
                </>
              ) : currentLevel === 'premium' ? (
                <>
                  <Crown className="w-5 h-5" />
                  <span>Already Premium</span>
                </>
              ) : (
                <>
                  <ArrowUp className="w-5 h-5" />
                  <span>Request Upgrade</span>
                </>
              )}
            </motion.button>
          </div>
        </motion.div>

        {/* Request History Card */}
        {requestHistory.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="card"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-display font-bold text-gray-900">Request History</h2>
                <p className="text-sm text-gray-600 mt-0.5">Your subscription requests</p>
              </div>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
              {requestHistory.map((request, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + idx * 0.05 }}
                  className="p-4 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 capitalize">
                        {request.requestedLevel}
                      </span>
                      <span className="text-gray-500">Subscription</span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      request.status === 'approved' ? 'bg-green-100 text-green-700' :
                      request.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {request.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Requested on {new Date(request.createdAt).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                  {request.rejectionMessage && (
                    <p className="text-sm text-red-600 mt-2 italic">
                      Note: {request.rejectionMessage}
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

    </div>
  )
}


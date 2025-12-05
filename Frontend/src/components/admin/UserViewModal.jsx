import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, User, Mail, Search, BookOpen, Clock, TrendingUp, Shield, Star } from 'lucide-react'
import { BookGenieAPI } from '../../services/api'
import { getAvatarUrl } from '../../utils/avatar'

export default function UserViewModal({ user, onClose, onEdit }) {
  const [userDetails, setUserDetails] = useState(null)
  const [trafficData, setTrafficData] = useState(null)
  const [loading, setLoading] = useState(true)
  const api = new BookGenieAPI()

  useEffect(() => {
    if (user) {
      loadUserDetails()
    }
  }, [user])

  const loadUserDetails = async () => {
    try {
      const token = localStorage.getItem('bookgenie_token')
      const [details, traffic] = await Promise.all([
        api.getUserDetails(user.id, token),
        api.getUserTraffic(user.id, token).catch(() => null)
      ])
      setUserDetails(details)
      setTrafficData(traffic)
    } catch (error) {
      console.error('Error loading user details:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  const modalContent = (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl relative flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 text-white flex items-center justify-center font-semibold text-lg overflow-hidden">
                {(() => {
                  const avatarUrl = getAvatarUrl(user)
                  return avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={user.firstName || user.email}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none'
                        const parent = e.target.parentElement
                        const span = document.createElement('span')
                        span.textContent = user.firstName?.[0] || user.email?.[0] || 'U'
                        parent.appendChild(span)
                      }}
                    />
                  ) : (
                    <span>{user.firstName?.[0] || user.email?.[0] || 'U'}</span>
                  )
                })()}
              </div>
              <div>
                <h2 className="text-2xl font-display font-bold text-gray-900">
                  {user.firstName || user.email?.split('@')[0] || 'User'}
                </h2>
                <p className="text-gray-600 text-sm">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit()
                }}
                className="btn-secondary text-sm"
              >
                Edit
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto flex-1 p-6 space-y-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                <p className="text-gray-600 mt-4">Loading user details...</p>
              </div>
            ) : (
              <>
                {/* User Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="card">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <User className="w-5 h-5 text-primary-600" />
                      User Information
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm text-gray-600">Name:</span>
                        <p className="font-medium text-gray-900">
                          {userDetails?.firstName || ''} {userDetails?.lastName || ''}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Email:</span>
                        <p className="font-medium text-gray-900">{userDetails?.email}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Academic Level:</span>
                        <p className="font-medium text-gray-900 capitalize">{userDetails?.academicLevel || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Department:</span>
                        <p className="font-medium text-gray-900">{userDetails?.department || 'N/A'}</p>
                      </div>
                      <div className="flex gap-2">
                        <span className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 ${
                          userDetails?.role === 'admin' 
                            ? 'bg-red-50 text-red-600' 
                            : 'bg-blue-50 text-blue-600'
                        }`}>
                          <Shield className="w-3 h-3" />
                          {userDetails?.role || 'student'}
                        </span>
                        <span className="px-3 py-1 bg-purple-50 text-purple-600 rounded-lg text-xs font-semibold capitalize">
                          <Star className="w-3 h-3 inline mr-1" />
                          {userDetails?.subscriptionLevel || 'free'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Statistics */}
                  <div className="card">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary-600" />
                      Statistics
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Search className="w-4 h-4 text-gray-600" />
                          <span className="text-sm text-gray-600">Searches:</span>
                        </div>
                        <span className="font-bold text-gray-900">{userDetails?.stats?.searchCount || 0}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-gray-600" />
                          <span className="text-sm text-gray-600">Reading Sessions:</span>
                        </div>
                        <span className="font-bold text-gray-900">{userDetails?.stats?.readingCount || 0}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-gray-600" />
                          <span className="text-sm text-gray-600">Books Read:</span>
                        </div>
                        <span className="font-bold text-gray-900">{userDetails?.stats?.booksRead || 0}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-600" />
                          <span className="text-sm text-gray-600">Total Reading Time:</span>
                        </div>
                        <span className="font-bold text-gray-900">
                          {userDetails?.stats?.totalReadingMinutes 
                            ? `${Math.floor(userDetails.stats.totalReadingMinutes / 60)}h ${userDetails.stats.totalReadingMinutes % 60}m`
                            : '0m'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reading History */}
                {userDetails?.readingHistory && userDetails.readingHistory.length > 0 && (
                  <div className="card">
                    <h3 className="font-semibold text-gray-900 mb-4">Recent Reading History</h3>
                    <div className="space-y-2">
                      {userDetails.readingHistory.slice(0, 5).map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">{item.title}</p>
                            <p className="text-sm text-gray-600">{item.author}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">{item.duration} min</p>
                            <p className="text-xs text-gray-500">{new Date(item.date).toLocaleDateString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )

  return typeof window !== 'undefined' ? createPortal(modalContent, document.body) : null
}


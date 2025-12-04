import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, Users, BookOpen, Search, MessageSquare, TrendingUp, UserPlus, Clock, AlertCircle } from 'lucide-react'
import PageHeader from '../PageHeader'
import { StatCardSkeleton } from '../LoadingSkeleton'
import { BookGenieAPI } from '../../services/api'

export default function AnalyticsTab() {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const api = new BookGenieAPI()

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    try {
      const token = localStorage.getItem('bookgenie_token')
      const analyticsData = await api.getAnalytics(token)
      setAnalytics(analyticsData)
    } catch (error) {
      console.error('Analytics error:', error)
    } finally {
      setLoading(false)
    }
  }

  const dailyStats = [
    {
      icon: UserPlus,
      value: analytics?.dailyStats?.newUsers || 0,
      label: 'New Users Today',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      icon: Search,
      value: analytics?.dailyStats?.searches || 0,
      label: 'Searches Today',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      icon: Clock,
      value: analytics?.dailyStats?.readingSessions || 0,
      label: 'Reading Sessions Today',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      icon: AlertCircle,
      value: analytics?.dailyStats?.pendingRequests || 0,
      label: 'Pending Requests',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
    },
  ]

  const subscriptionStats = analytics?.subscriptionStats || {}
  const totalSubscriptions = Object.values(subscriptionStats).reduce((sum, count) => sum + count, 0)

  return (
    <div className="space-y-8">
      <PageHeader
        icon={BarChart3}
        title="Analytics"
        description="System performance and insights"
      />

      {/* Total Stats */}
      {!loading && analytics?.totalStats && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Users, value: analytics.totalStats.totalUsers, label: 'Total Users', color: 'text-blue-600', bgColor: 'bg-blue-50' },
              { icon: BookOpen, value: analytics.totalStats.totalBooks, label: 'Total Books', color: 'text-purple-600', bgColor: 'bg-purple-50' },
              { icon: Search, value: analytics.totalStats.totalSearches, label: 'Total Searches', color: 'text-green-600', bgColor: 'bg-green-50' },
              { icon: Clock, value: analytics.totalStats.totalReadingSessions, label: 'Total Reading Sessions', color: 'text-amber-600', bgColor: 'bg-amber-50' },
            ].map((stat, idx) => {
              const Icon = stat.icon
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  whileHover={{ y: -2 }}
                  className="card"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                      <div className="text-gray-600 text-sm font-medium">{stat.label}</div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}

      {/* Daily Stats */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Today's Activity</h2>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {dailyStats.map((stat, idx) => {
              const Icon = stat.icon
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  whileHover={{ y: -2 }}
                  className="card"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                      <div className="text-gray-600 text-sm font-medium">{stat.label}</div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Subscription Statistics */}
      {!loading && analytics?.subscriptionStats && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Subscription Distribution</h2>
          <div className="card">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(subscriptionStats).map(([level, count]) => {
                const percentage = totalSubscriptions > 0 ? ((count / totalSubscriptions) * 100).toFixed(1) : 0
                return (
                  <div key={level} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600 capitalize">{level || 'Free'}</span>
                      <span className="text-lg font-bold text-gray-900">{count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{percentage}%</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Popular Searches */}
      {!loading && analytics?.popularSearches && analytics.popularSearches.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Popular Searches (Last 7 Days)</h2>
          <div className="card">
            <div className="space-y-2">
              {analytics.popularSearches.map((search, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-sm">
                      {idx + 1}
                    </div>
                    <span className="text-gray-900 font-medium truncate">{search.query}</span>
                  </div>
                  <span className="text-gray-600 font-semibold ml-4">{search.count} searches</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Active Users */}
      {!loading && analytics?.activeUsers && analytics.activeUsers.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Most Active Users (This Week)</h2>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">User</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Searches</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Reading Sessions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {analytics.activeUsers.map((user, idx) => (
                    <motion.tr
                      key={idx}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-900 font-medium">{user.searchCount || 0}</td>
                      <td className="px-4 py-3 text-gray-900 font-medium">{user.readingCount || 0}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {!loading && (!analytics || (analytics.popularSearches?.length === 0 && analytics.activeUsers?.length === 0)) && (
        <div className="card text-center py-12">
          <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-600">No analytics data available yet</p>
        </div>
      )}
    </div>
  )
}


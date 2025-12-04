import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, Users, BookOpen, Search, MessageSquare, TrendingUp, UserPlus, Clock, AlertCircle, BookMarked, Activity, Eye, Zap, RefreshCw, Star, GraduationCap } from 'lucide-react'
import PageHeader from '../PageHeader'
import { StatCardSkeleton } from '../LoadingSkeleton'
import { BookGenieAPI } from '../../services/api'
import LineChart from '../charts/LineChart'
import BarChart from '../charts/BarChart'
import PieChart from '../charts/PieChart'

export default function AnalyticsTab() {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const api = new BookGenieAPI()

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('bookgenie_token')
      const analyticsData = await api.getAnalytics(token)
      console.log('Analytics Data:', analyticsData)
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
        description="Comprehensive system analytics and insights"
        action={
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => loadAnalytics()}
            disabled={loading}
            className="btn-secondary flex items-center gap-2 text-sm"
            title="Refresh analytics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </motion.button>
        }
      />

      {/* Total Stats - Expanded */}
      {!loading && analytics?.totalStats && (
        <div className="mb-8">
          <h2 className="text-xl font-display font-bold text-gray-900 mb-4">Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {[
              { icon: Users, value: analytics.totalStats.totalUsers, label: 'Total Users', color: 'text-blue-600', bgColor: 'bg-blue-50', trend: analytics?.dailyStats?.newUsers || 0, trendLabel: 'new today' },
              { icon: BookOpen, value: analytics.totalStats.totalBooks, label: 'Total Books', color: 'text-purple-600', bgColor: 'bg-purple-50' },
              { icon: Search, value: analytics.totalStats.totalSearches, label: 'Total Searches', color: 'text-indigo-600', bgColor: 'bg-indigo-50', trend: analytics?.dailyStats?.searches || 0, trendLabel: 'today' },
              { icon: BookMarked, value: analytics.totalStats.totalReadingSessions, label: 'Reading Sessions', color: 'text-green-600', bgColor: 'bg-green-50', trend: analytics?.dailyStats?.readingSessions || 0, trendLabel: 'today' },
              { icon: UserPlus, value: analytics?.dailyStats?.newUsers || 0, label: 'New Users Today', color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
              { icon: AlertCircle, value: analytics?.dailyStats?.pendingRequests || 0, label: 'Pending Requests', color: 'text-amber-600', bgColor: 'bg-amber-50' },
            ].map((stat, idx) => {
              const Icon = stat.icon
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  whileHover={{ y: -2, scale: 1.02 }}
                  className="card"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg ${stat.bgColor} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${stat.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xl sm:text-2xl font-bold text-gray-900">{stat.value}</div>
                      <div className="text-gray-600 text-xs sm:text-sm font-medium truncate">{stat.label}</div>
                      {stat.trend !== undefined && stat.trend > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          <TrendingUp className="w-3 h-3 text-green-600" />
                          <span className="text-xs text-green-600 font-semibold">{stat.trend} {stat.trendLabel}</span>
                        </div>
                      )}
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

      {/* Subscription Distribution - Enhanced */}
      {!loading && analytics?.subscriptionStats && Object.keys(analytics.subscriptionStats).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <div className="flex items-center gap-3 mb-6">
            <BarChart3 className="w-5 h-5 text-primary-600" />
            <h2 className="text-xl font-display font-bold text-gray-900">Subscription Distribution</h2>
          </div>
          <div className="space-y-4">
            {Object.entries(subscriptionStats).map(([level, count]) => {
              const total = Object.values(subscriptionStats).reduce((sum, c) => sum + c, 0)
              const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0
              const colors = {
                premium: { bg: 'bg-yellow-500', text: 'text-yellow-700', label: 'Premium' },
                basic: { bg: 'bg-blue-500', text: 'text-blue-700', label: 'Basic' },
                free: { bg: 'bg-gray-500', text: 'text-gray-700', label: 'Free' }
              }
              const color = colors[level] || colors.free
              
              return (
                <div key={level} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Star className={`w-4 h-4 ${color.text}`} />
                      <span className="font-medium text-gray-900 capitalize">{color.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">{count}</span>
                      <span className="text-xs text-gray-500">({percentage}%)</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.8, delay: 0.3 }}
                      className={`h-full ${color.bg} rounded-full`}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>
      )}


      {/* Two Column Layout for Popular Searches and Active Users */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular Searches */}
        {!loading && analytics?.popularSearches && analytics.popularSearches.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card"
          >
            <div className="flex items-center gap-3 mb-6">
              <Search className="w-5 h-5 text-primary-600" />
              <h2 className="text-xl font-display font-bold text-gray-900">Popular Searches</h2>
              <span className="text-xs text-gray-500 ml-auto">Last 7 days</span>
            </div>
            <div className="space-y-3">
              {analytics.popularSearches.slice(0, 8).map((search, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + idx * 0.05 }}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {idx + 1}
                    </div>
                    <span className="text-sm font-medium text-gray-900 truncate">{search.query}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Eye className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-semibold text-gray-700">{search.count}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Active Users */}
        {!loading && analytics?.activeUsers && analytics.activeUsers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="card"
          >
            <div className="flex items-center gap-3 mb-6">
              <Activity className="w-5 h-5 text-primary-600" />
              <h2 className="text-xl font-display font-bold text-gray-900">Most Active Users</h2>
              <span className="text-xs text-gray-500 ml-auto">This week</span>
            </div>
            <div className="space-y-3">
              {analytics.activeUsers.slice(0, 8).map((user, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + idx * 0.05 }}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 text-white flex items-center justify-center font-semibold text-sm flex-shrink-0">
                      {user.name?.[0] || user.email?.[0] || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{user.name || user.email}</div>
                      <div className="text-xs text-gray-500 truncate">{user.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <div className="text-xs text-gray-500">Searches</div>
                      <div className="text-sm font-semibold text-gray-900">{user.searchCount || 0}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">Reads</div>
                      <div className="text-sm font-semibold text-gray-900">{user.readingCount || 0}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Quick Stats Grid */}
      {!loading && analytics && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-900">{analytics.dailyStats?.searches || 0}</div>
                <div className="text-sm font-medium text-blue-700 mt-1">Searches Today</div>
              </div>
              <Search className="w-10 h-10 text-blue-600 opacity-50" />
            </div>
          </div>
          <div className="card bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-900">{analytics.dailyStats?.readingSessions || 0}</div>
                <div className="text-sm font-medium text-green-700 mt-1">Reading Sessions Today</div>
              </div>
              <BookMarked className="w-10 h-10 text-green-600 opacity-50" />
            </div>
          </div>
          <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-purple-900">
                  {analytics.totalStats?.totalBooks > 0 
                    ? ((analytics.totalStats?.totalReadingSessions / analytics.totalStats?.totalBooks) || 0).toFixed(1)
                    : 0}
                </div>
                <div className="text-sm font-medium text-purple-700 mt-1">Avg Sessions per Book</div>
              </div>
              <Zap className="w-10 h-10 text-purple-600 opacity-50" />
            </div>
          </div>
        </motion.div>
      )}

      {/* Charts Section */}
      {!loading && analytics?.timeSeries && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Growth Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="card"
          >
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-5 h-5 text-primary-600" />
              <h2 className="text-xl font-display font-bold text-gray-900">User Growth (30 Days)</h2>
            </div>
            {analytics.timeSeries?.userGrowth && analytics.timeSeries.userGrowth.length > 0 ? (
              <LineChart 
                data={analytics.timeSeries.userGrowth} 
                dataKey="count" 
                name="New Users"
                color="#3b82f6"
              />
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                <p>No data available for the last 30 days</p>
              </div>
            )}
          </motion.div>

          {/* Search Trends Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="card"
          >
            <div className="flex items-center gap-3 mb-4">
              <Search className="w-5 h-5 text-primary-600" />
              <h2 className="text-xl font-display font-bold text-gray-900">Search Trends (30 Days)</h2>
            </div>
            {analytics.timeSeries?.searchTrends && analytics.timeSeries.searchTrends.length > 0 ? (
              <LineChart 
                data={analytics.timeSeries.searchTrends} 
                dataKey="count" 
                name="Searches"
                color="#10b981"
              />
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                <p>No data available for the last 30 days</p>
              </div>
            )}
          </motion.div>

          {/* Reading Trends Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="card"
          >
            <div className="flex items-center gap-3 mb-4">
              <BookMarked className="w-5 h-5 text-primary-600" />
              <h2 className="text-xl font-display font-bold text-gray-900">Reading Trends (30 Days)</h2>
            </div>
            {analytics.timeSeries?.readingTrends && analytics.timeSeries.readingTrends.length > 0 ? (
              <LineChart 
                data={analytics.timeSeries.readingTrends} 
                dataKey="count" 
                name="Reading Sessions"
                color="#8b5cf6"
              />
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                <p>No data available for the last 30 days</p>
              </div>
            )}
          </motion.div>

          {/* Genre Distribution Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="card"
          >
            <div className="flex items-center gap-3 mb-4">
              <BookOpen className="w-5 h-5 text-primary-600" />
              <h2 className="text-xl font-display font-bold text-gray-900">Genre Distribution</h2>
            </div>
            {analytics.distributions?.genres && analytics.distributions.genres.length > 0 ? (
              <BarChart 
                data={analytics.distributions.genres} 
                dataKey="genre" 
                name="count"
                color="#8b5cf6"
              />
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                <p>No genre data available</p>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Academic Level Distribution */}
      {!loading && analytics?.distributions?.academicLevels && analytics.distributions.academicLevels.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="card"
        >
          <div className="flex items-center gap-3 mb-4">
            <GraduationCap className="w-5 h-5 text-primary-600" />
            <h2 className="text-xl font-display font-bold text-gray-900">Academic Level Distribution</h2>
          </div>
          {analytics.distributions.academicLevels.length > 0 ? (
            <PieChart 
              data={analytics.distributions.academicLevels} 
              dataKey="count" 
              nameKey="level"
              name="Books by Academic Level"
            />
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              <p>No academic level data available</p>
            </div>
          )}
        </motion.div>
      )}

      {/* Top Books */}
      {!loading && analytics?.topBooks && analytics.topBooks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="card"
        >
          <div className="flex items-center gap-3 mb-6">
            <Star className="w-5 h-5 text-primary-600" />
            <h2 className="text-xl font-display font-bold text-gray-900">Most Downloaded Books</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Rank</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Title</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Author</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Downloads</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {analytics.topBooks.map((book, idx) => (
                  <motion.tr
                    key={book.id || idx}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 + idx * 0.05 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-4 py-3">
                      <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-sm">
                        {idx + 1}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{book.title}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{book.author}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <BookMarked className="w-4 h-4 text-gray-400" />
                        <span className="font-semibold text-gray-900">{book.downloadCount || 0}</span>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
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


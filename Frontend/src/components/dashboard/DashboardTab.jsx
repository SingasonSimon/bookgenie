import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Search, BookMarked, Star, Sparkles, Users, AlertCircle, UserPlus, TrendingUp, Clock, MessageSquare, BarChart3, Activity, Zap, Eye, RefreshCw } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import BookCard from '../BookCard'
import BookDetailsModal from '../BookDetailsModal'
import PageHeader from '../PageHeader'
import { StatCardSkeleton, GridSkeleton } from '../LoadingSkeleton'
import { BookGenieAPI } from '../../services/api'
import LineChart from '../charts/LineChart'
import BarChart from '../charts/BarChart'
import PieChart from '../charts/PieChart'

export default function DashboardTab({ onNavigateToTab }) {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [recommendedBooks, setRecommendedBooks] = useState([])
  const [favoriteGenres, setFavoriteGenres] = useState([])
  const [recentlyRead, setRecentlyRead] = useState([])
  const [premiumAnalytics, setPremiumAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedBook, setSelectedBook] = useState(null)
  const api = new BookGenieAPI()
  const isAdmin = user?.role === 'admin'
  const isPremium = user?.subscriptionLevel === 'premium'

  useEffect(() => {
    loadDashboard()
  }, [])

  // Refresh dashboard when window regains focus (user might have downloaded/viewed books in another tab)
  useEffect(() => {
    const handleFocus = () => {
      loadDashboard()
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  const loadDashboard = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('bookgenie_token')
      
      if (isAdmin) {
        // Load admin analytics (add cache-busting timestamp)
        const analyticsData = await api.getAnalytics(token)
        setAnalytics(analyticsData)
      } else {
        // Load student dashboard (add cache-busting timestamp)
        const response = await fetch(`http://localhost:5000/api/student/dashboard?t=${Date.now()}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        })
        
        if (!response.ok) {
          throw new Error(`Failed to load dashboard: ${response.status}`)
        }
        
        const data = await response.json()
        
        setStats(data.stats)
        setRecommendedBooks(data.recommended_books || [])
        setFavoriteGenres(data.favorite_genres || [])
        setRecentlyRead(data.recently_read || [])
        setPremiumAnalytics(data.premium_analytics || null)
      }
    } catch (error) {
      console.error('Dashboard error:', error)
    } finally {
      setLoading(false)
    }
  }

  // Admin stat cards - Expanded
  const adminStatCards = [
    {
      icon: Users,
      value: analytics?.totalStats?.totalUsers || 0,
      label: 'Total Users',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      trend: analytics?.dailyStats?.newUsers || 0,
      trendLabel: 'new today',
    },
    {
      icon: BookOpen,
      value: analytics?.totalStats?.totalBooks || 0,
      label: 'Total Books',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      icon: Search,
      value: analytics?.totalStats?.totalSearches || 0,
      label: 'Total Searches',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      trend: analytics?.dailyStats?.searches || 0,
      trendLabel: 'today',
    },
    {
      icon: BookMarked,
      value: analytics?.totalStats?.totalReadingSessions || 0,
      label: 'Reading Sessions',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      trend: analytics?.dailyStats?.readingSessions || 0,
      trendLabel: 'today',
    },
    {
      icon: UserPlus,
      value: analytics?.dailyStats?.newUsers || 0,
      label: 'New Users Today',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      icon: AlertCircle,
      value: analytics?.dailyStats?.pendingRequests || 0,
      label: 'Pending Requests',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      clickable: true,
    },
  ]

  // Student stat cards - Expanded
  const studentStatCards = [
    {
      icon: BookOpen,
      value: stats?.books_read || 0,
      label: 'Books Read',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      icon: Search,
      value: stats?.total_searches || 0,
      label: 'Total Searches',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      trend: stats?.searches_this_week || 0,
      trendLabel: 'this week',
    },
    {
      icon: BookMarked,
      value: stats?.total_reading || 0,
      label: 'Reading Sessions',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      trend: stats?.reading_this_week || 0,
      trendLabel: 'this week',
    },
    {
      icon: Clock,
      value: stats?.reading_today || 0,
      label: 'Sessions Today',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      icon: Eye,
      value: stats?.searches_today || 0,
      label: 'Searches Today',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
    {
      icon: Star,
      value: stats?.subscription_level || 'Free',
      label: 'Subscription',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      capitalize: true,
    },
  ]

  const statCards = isAdmin ? adminStatCards : studentStatCards

  return (
    <div>
      <PageHeader
        icon={BookOpen}
        title={isAdmin ? "Admin Dashboard" : "Your Reading Dashboard"}
        description={
          isAdmin 
            ? "System overview and key metrics" 
            : `Welcome back, ${user?.firstName || user?.email?.split('@')[0] || 'User'}!${isPremium ? ' (Premium Member)' : ''}`
        }
        action={
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => loadDashboard()}
            disabled={loading}
            className="btn-secondary flex items-center gap-2 text-sm"
            title="Refresh dashboard"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </motion.button>
        }
      />
      
      {/* Priority Support Badge for Premium Users */}
      {!isAdmin && isPremium && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 mb-6"
        >
          <div className="flex items-center gap-3">
            <Star className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-amber-900">Priority Support Active</p>
              <p className="text-sm text-amber-700">As a Premium member, you have access to priority support and advanced analytics.</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Stats Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 ${isAdmin ? 'xl:grid-cols-6' : 'xl:grid-cols-6'} gap-4 mb-8`}>
          {statCards.map((stat, idx) => {
            const Icon = stat.icon
            const isPendingRequests = isAdmin && stat.clickable && stat.value > 0
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ y: -2, scale: isPendingRequests ? 1.02 : 1 }}
                onClick={() => {
                  if (isPendingRequests && onNavigateToTab) {
                    onNavigateToTab('users')
                  }
                }}
                className={`card ${isPendingRequests ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg ${stat.bgColor} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${stat.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-xl sm:text-2xl font-bold text-gray-900 ${stat.capitalize ? 'capitalize' : ''}`}>
                      {stat.value}
                    </div>
                    <div className="text-gray-600 text-xs sm:text-sm font-medium truncate">
                      {stat.label}
                    </div>
                    {stat.trend !== undefined && stat.trend > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <TrendingUp className="w-3 h-3 text-green-600" />
                        <span className="text-xs text-green-600 font-semibold">{stat.trend} {stat.trendLabel}</span>
                      </div>
                    )}
                    {isPendingRequests && (
                      <div className="text-xs text-amber-600 font-semibold mt-1">
                        Click to view
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Admin Dashboard Content */}
      {isAdmin && !loading && analytics && (
        <div className="space-y-6">
          {/* Subscription Distribution */}
          {analytics.subscriptionStats && Object.keys(analytics.subscriptionStats).length > 0 && (
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
                {Object.entries(analytics.subscriptionStats).map(([level, count]) => {
                  const total = Object.values(analytics.subscriptionStats).reduce((sum, c) => sum + c, 0)
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
            {analytics.popularSearches && analytics.popularSearches.length > 0 && (
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
            {analytics.activeUsers && analytics.activeUsers.length > 0 && (
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

          {/* Charts Section */}
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
                  color="#f59e0b"
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
        </div>
      )}

      {/* Student Dashboard Content */}
      {!isAdmin && !loading && stats && (
        <div className="space-y-6">
          {/* Quick Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-blue-900">{stats.searches_today || 0}</div>
                  <div className="text-sm font-medium text-blue-700 mt-1">Searches Today</div>
                </div>
                <Search className="w-10 h-10 text-blue-600 opacity-50" />
              </div>
            </div>
            <div className="card bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-green-900">{stats.reading_today || 0}</div>
                  <div className="text-sm font-medium text-green-700 mt-1">Reading Sessions Today</div>
                </div>
                <BookMarked className="w-10 h-10 text-green-600 opacity-50" />
              </div>
            </div>
            <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-purple-900">
                    {stats.books_read > 0 
                      ? ((stats.total_reading / stats.books_read) || 0).toFixed(1)
                      : 0}
                  </div>
                  <div className="text-sm font-medium text-purple-700 mt-1">Avg Sessions per Book</div>
                </div>
                <Zap className="w-10 h-10 text-purple-600 opacity-50" />
              </div>
            </div>
          </motion.div>

          {/* Premium Analytics Charts */}
          {isPremium && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Reading Timeline */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="card"
              >
                <div className="flex items-center gap-3 mb-4">
                  <BookMarked className="w-5 h-5 text-primary-600" />
                  <h2 className="text-xl font-display font-bold text-gray-900">Reading Activity (30 Days)</h2>
                </div>
                {premiumAnalytics?.readingTimeline && premiumAnalytics.readingTimeline.length > 0 ? (
                  <LineChart 
                    data={premiumAnalytics.readingTimeline} 
                    dataKey="count" 
                    name="Reading Sessions"
                    color="#10b981"
                  />
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-400">
                    <p>No reading data available for the last 30 days</p>
                  </div>
                )}
              </motion.div>

              {/* Search Timeline */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="card"
              >
                <div className="flex items-center gap-3 mb-4">
                  <Search className="w-5 h-5 text-primary-600" />
                  <h2 className="text-xl font-display font-bold text-gray-900">Search Activity (30 Days)</h2>
                </div>
                {premiumAnalytics?.searchTimeline && premiumAnalytics.searchTimeline.length > 0 ? (
                  <LineChart 
                    data={premiumAnalytics.searchTimeline} 
                    dataKey="count" 
                    name="Searches"
                    color="#3b82f6"
                  />
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-400">
                    <p>No search data available for the last 30 days</p>
                  </div>
                )}
              </motion.div>
            </div>
          )}

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Favorite Genres */}
            {favoriteGenres && favoriteGenres.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="card overflow-hidden"
              >
                <div className="flex items-center gap-3 mb-6">
                  <Star className="w-5 h-5 text-primary-600" />
                  <h2 className="text-xl font-display font-bold text-gray-900">Favorite Genres</h2>
                </div>
                <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                  {favoriteGenres.map((genre, idx) => {
                    const total = favoriteGenres.reduce((sum, g) => sum + g.count, 0)
                    const percentage = total > 0 ? ((genre.count / total) * 100).toFixed(0) : 0
                    return (
                      <motion.div
                        key={genre.genre}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + idx * 0.05 }}
                        className="space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <BookOpen className="w-4 h-4 text-primary-600 flex-shrink-0" />
                            <span className="font-medium text-gray-900 truncate">{genre.genre}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                            <span className="text-sm font-semibold text-gray-900">{genre.count}</span>
                            <span className="text-xs text-gray-500">({percentage}%)</span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 0.8, delay: 0.5 + idx * 0.1 }}
                            className="h-full bg-primary-500 rounded-full"
                          />
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </motion.div>
            )}

            {/* Recently Read */}
            {recentlyRead && recentlyRead.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="card overflow-hidden"
              >
                <div className="flex items-center gap-3 mb-6">
                  <Clock className="w-5 h-5 text-primary-600" />
                  <h2 className="text-xl font-display font-bold text-gray-900">Recently Read</h2>
                </div>
                <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                  {recentlyRead.map((book, idx) => (
                    <motion.div
                      key={book.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + idx * 0.05 }}
                      onClick={() => setSelectedBook(book)}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <div className="w-12 h-16 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">{book.title}</div>
                        <div className="text-sm text-gray-600 truncate">{book.author}</div>
                        {book.genre && (
                          <div className="text-xs text-primary-600 mt-1 truncate">{book.genre}</div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Recommended Books */}
          {recommendedBooks.length > 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="w-full"
            >
              <div className="flex items-center gap-3 mb-6">
                <Sparkles className="w-5 h-5 text-primary-600" />
                <h2 className="text-2xl font-display font-bold text-gray-900">
                  Recommended for You
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
                {recommendedBooks.map((item, idx) => {
                  const book = item.book || item
                  return (
                    <motion.div
                      key={book.id || idx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 + idx * 0.1 }}
                      className="w-full"
                    >
                      <BookCard
                        book={book}
                        relevance={item.relevance_percentage || item.similarity_score}
                        user={user}
                        onView={async () => {
                          try {
                            const token = localStorage.getItem('bookgenie_token')
                            if (token && book.id) {
                              const bookData = await api.getBook(book.id, token)
                              setSelectedBook(bookData)
                            } else {
                              setSelectedBook(book)
                            }
                          } catch (error) {
                            console.error('Error fetching book details:', error)
                            setSelectedBook(book)
                          }
                        }}
                        onDownload={async () => {
                          try {
                            const token = localStorage.getItem('bookgenie_token')
                            if (token && book.file_url) {
                              await api.downloadBook(book.file_url, token)
                            }
                          } catch (error) {
                            console.error('Download error:', error)
                          }
                        }}
                      />
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          ) : !loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="card text-center py-12"
            >
              <Sparkles className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-600">No recommendations yet. Start reading to get personalized suggestions!</p>
            </motion.div>
          )}
        </div>
      )}

      {/* Loading state for student dashboard */}
      {!isAdmin && loading && (
        <>
          <div className="h-8 w-48 skeleton rounded mb-6"></div>
          <GridSkeleton count={3} />
        </>
      )}

      {selectedBook && (
        <BookDetailsModal
          book={selectedBook}
          user={user}
          onClose={() => {
            setSelectedBook(null)
            // Refresh dashboard to show updated stats
            loadDashboard()
          }}
          onDownload={async () => {
            try {
              const token = localStorage.getItem('bookgenie_token')
              if (token && selectedBook && selectedBook.file_url) {
                await api.downloadBook(selectedBook.file_url, token)
                // Record reading session
                try {
                  await api.recordReading(selectedBook.id, 5, token)
                } catch (err) {
                  console.error('Error recording reading session:', err)
                }
                // Record download interaction
                try {
                  await api.recordInteraction(selectedBook.id, 'download', 1.0, token)
                } catch (err) {
                  console.error('Error recording interaction:', err)
                }
                // Refresh dashboard after download
                setTimeout(() => loadDashboard(), 1000)
              }
            } catch (error) {
              console.error('Download error:', error)
            }
          }}
        />
      )}
    </div>
  )
}


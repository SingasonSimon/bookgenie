import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Search, BookMarked, Star, Sparkles, Users, AlertCircle, UserPlus } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import BookCard from '../BookCard'
import BookDetailsModal from '../BookDetailsModal'
import PageHeader from '../PageHeader'
import { StatCardSkeleton, GridSkeleton } from '../LoadingSkeleton'
import { BookGenieAPI } from '../../services/api'

export default function DashboardTab() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [recommendedBooks, setRecommendedBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedBook, setSelectedBook] = useState(null)
  const api = new BookGenieAPI()
  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('bookgenie_token')
      
      if (isAdmin) {
        // Load admin analytics
        const analyticsData = await api.getAnalytics(token)
        setAnalytics(analyticsData)
      } else {
        // Load student dashboard
        const response = await fetch('http://localhost:5000/api/student/dashboard', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        })
        const data = await response.json()
        setStats(data.stats)
        setRecommendedBooks(data.recommended_books || [])
      }
    } catch (error) {
      console.error('Dashboard error:', error)
    } finally {
      setLoading(false)
    }
  }

  // Admin stat cards
  const adminStatCards = [
    {
      icon: Users,
      value: analytics?.totalStats?.totalUsers || 0,
      label: 'Total Users',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      icon: BookOpen,
      value: analytics?.totalStats?.totalBooks || 0,
      label: 'Total Books',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      icon: UserPlus,
      value: analytics?.dailyStats?.newUsers || 0,
      label: 'New Users Today',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      icon: AlertCircle,
      value: analytics?.dailyStats?.pendingRequests || 0,
      label: 'Pending Requests',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
    },
  ]

  // Student stat cards
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
    },
    {
      icon: BookMarked,
      value: stats?.total_reading || 0,
      label: 'Reading Sessions',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
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
        description={isAdmin ? "System overview and key metrics" : `Welcome back, ${user?.firstName || user?.email?.split('@')[0] || 'User'}!`}
      />

      {/* Stats Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((stat, idx) => {
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
                    <div className={`text-2xl font-bold text-gray-900 ${stat.capitalize ? 'capitalize' : ''}`}>
                      {stat.value}
                    </div>
                    <div className="text-gray-600 text-sm font-medium">{stat.label}</div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Recommended Books - Only for students */}
      {!isAdmin && (
        <>
          {loading ? (
            <div>
              <div className="h-8 w-48 skeleton rounded mb-6"></div>
              <GridSkeleton count={3} />
            </div>
          ) : recommendedBooks.length > 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <Sparkles className="w-5 h-5 text-primary-600" />
                <h2 className="text-2xl font-display font-bold text-gray-900">
                  Recommended for You
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recommendedBooks.map((item, idx) => {
                  const book = item.book || item
                  return (
                    <motion.div
                      key={book.id || idx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + idx * 0.1 }}
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
                        onDownload={() => {
                          if (book.file_url) {
                            window.open(`http://localhost:5000${book.file_url}`, '_blank')
                          }
                        }}
                      />
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="card text-center py-12"
            >
              <Sparkles className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-600">No recommendations yet. Start reading to get personalized suggestions!</p>
            </motion.div>
          )}
        </>
      )}

      {selectedBook && (
        <BookDetailsModal
          book={selectedBook}
          user={user}
          onClose={() => setSelectedBook(null)}
          onDownload={() => {
            if (selectedBook && selectedBook.file_url) {
              window.open(`http://localhost:5000${selectedBook.file_url}`, '_blank')
            }
          }}
        />
      )}
    </div>
  )
}


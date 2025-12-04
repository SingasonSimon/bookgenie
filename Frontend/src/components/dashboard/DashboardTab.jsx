import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Search, BookMarked, Star, Sparkles } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import BookCard from '../BookCard'
import { StatCardSkeleton, GridSkeleton } from '../LoadingSkeleton'

export default function DashboardTab() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [recommendedBooks, setRecommendedBooks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('bookgenie_token')
      const response = await fetch('http://localhost:5000/api/student/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      })
      const data = await response.json()
      setStats(data.stats)
      setRecommendedBooks(data.recommended_books || [])
    } catch (error) {
      console.error('Dashboard error:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      icon: BookOpen,
      value: stats?.books_read || 0,
      label: 'Books Read',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      icon: Search,
      value: stats?.total_searches || 0,
      label: 'Total Searches',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      icon: BookMarked,
      value: stats?.total_reading || 0,
      label: 'Reading Sessions',
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
    },
    {
      icon: Star,
      value: stats?.subscription_level || 'Free',
      label: 'Subscription',
      color: 'from-amber-500 to-amber-600',
      bgColor: 'bg-amber-50',
      capitalize: true,
    },
  ]

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl sm:text-4xl font-display font-bold text-gray-900 mb-2">
          Your Reading Dashboard
        </h1>
        <p className="text-gray-600">
          Welcome back, <span className="font-semibold text-gray-900">{user?.firstName || user?.email}</span>!
        </p>
      </motion.div>

      {/* Stats Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, idx) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -4 }}
                className="card-hover relative overflow-hidden group"
              >
                <div className={`absolute top-0 right-0 w-24 h-24 ${stat.bgColor} rounded-full -mr-12 -mt-12 opacity-50 group-hover:opacity-70 transition-opacity`}></div>
                <div className="relative flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <div className={`text-3xl font-display font-bold ${stat.capitalize ? 'capitalize' : ''}`}>
                      {stat.value}
                    </div>
                    <div className="text-gray-600 font-medium text-sm mt-1">{stat.label}</div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Recommended Books */}
      {loading ? (
        <div>
          <div className="h-8 w-48 skeleton rounded mb-6"></div>
          <GridSkeleton count={3} />
        </div>
      ) : recommendedBooks.length > 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <Sparkles className="w-6 h-6 text-primary-500" />
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-gray-900">
              Recommended for You
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                    onView={() => {
                      alert(`Book: ${book.title}\nAuthor: ${book.author}\n\n${book.abstract || 'No abstract available'}`)
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
          <Sparkles className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-600">No recommendations yet. Start reading to get personalized suggestions!</p>
        </motion.div>
      )}
    </div>
  )
}


import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, Users, BookOpen, Search, MessageSquare, TrendingUp } from 'lucide-react'
import PageHeader from '../PageHeader'
import { StatCardSkeleton } from '../LoadingSkeleton'

export default function AnalyticsTab() {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    try {
      const token = localStorage.getItem('bookgenie_token')
      const response = await fetch('http://localhost:5000/api/admin/analytics', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      })
      const data = await response.json()
      setAnalytics(data)
    } catch (error) {
      console.error('Analytics error:', error)
    } finally {
      setLoading(false)
    }
  }

  const stats = [
    {
      icon: Users,
      value: analytics?.total_users || 0,
      label: 'Total Users',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      icon: BookOpen,
      value: analytics?.total_books || 0,
      label: 'Total Books',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      icon: Search,
      value: analytics?.total_searches || 0,
      label: 'Total Searches',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      icon: MessageSquare,
      value: analytics?.total_feedback || 0,
      label: 'Total Feedback',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
    },
  ]

  return (
    <div>
      <PageHeader
        icon={BarChart3}
        title="Analytics"
        description="System performance and insights"
      />

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, idx) => {
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
  )
}


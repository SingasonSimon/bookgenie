import React from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Download, Eye, Lock, Star, Crown, Zap } from 'lucide-react'

export default function BookCard({ book, relevance, user, onView, onDownload }) {
  const coverImage = book.cover_image && book.cover_image.startsWith('/api/files/')
    ? `http://localhost:5000${book.cover_image}`
    : null

  const isAdmin = user?.role === 'admin'
  const subscriptionLevel = book.subscription_level || 'free'
  
  const getSubscriptionBadge = (level) => {
    const badges = {
      premium: { icon: Crown, bg: 'bg-gradient-to-r from-yellow-400 to-amber-500', text: 'text-yellow-900', label: 'Premium' },
      basic: { icon: Zap, bg: 'bg-gradient-to-r from-blue-400 to-blue-600', text: 'text-blue-900', label: 'Basic' },
      free: { icon: Star, bg: 'bg-gradient-to-r from-gray-400 to-gray-600', text: 'text-gray-900', label: 'Free' }
    }
    return badges[level] || badges.free
  }

  const subscriptionBadge = getSubscriptionBadge(subscriptionLevel)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.01 }}
      className="card-hover relative overflow-hidden"
    >
      {/* Subscription Badge for Admin */}
      {isAdmin && (
        <div className={`absolute top-2 left-2 z-10 ${subscriptionBadge.bg} ${subscriptionBadge.text} px-2.5 py-1 rounded-lg shadow-lg flex items-center gap-1.5 text-xs font-bold`}>
          {React.createElement(subscriptionBadge.icon, { className: "w-3.5 h-3.5" })}
          <span>{subscriptionBadge.label}</span>
        </div>
      )}

      <div className="flex gap-4 mb-4">
        {coverImage ? (
          <img
            src={coverImage}
            alt={book.title}
            className="w-20 h-28 object-cover rounded-lg flex-shrink-0 shadow-md"
          />
        ) : (
          <div className="w-20 h-28 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0 shadow-md">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold mb-1 text-gray-900 line-clamp-2">
            {book.title}
          </h3>
          <p className="text-gray-600 text-sm mb-3">by {book.author}</p>
          <div className="flex gap-2 flex-wrap">
            {book.genre && (
              <span className="bg-primary-50 text-primary-700 px-2.5 py-1 rounded-md text-xs font-medium">
                {book.genre}
              </span>
            )}
            {book.academic_level && (
              <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md text-xs font-medium capitalize">
                {book.academic_level}
              </span>
            )}
            {relevance && (
              <span className="bg-green-50 text-green-700 px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                {relevance.toFixed(1)}% match
              </span>
            )}
          </div>
        </div>
      </div>

      {book.abstract && (
        <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed">
          {book.abstract.substring(0, 150)}...
        </p>
      )}

      {book.tags && book.tags.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-4">
          {book.tags.slice(0, 3).map((tag, idx) => (
            <span key={idx} className="bg-gray-50 text-gray-600 px-2 py-0.5 rounded text-xs font-medium">
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        {user ? (
          <>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onView}
              className="btn-primary flex-1 text-sm py-2.5 flex items-center justify-center gap-2"
            >
              <Eye className="w-4 h-4" />
              View
            </motion.button>
            {book.file_url && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onDownload}
                className="btn-secondary text-sm py-2.5 flex items-center justify-center gap-2 min-w-[100px]"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Download</span>
              </motion.button>
            )}
          </>
        ) : (
          <div className="w-full py-2.5 px-4 bg-gray-50 rounded-lg flex items-center justify-center gap-2 text-gray-600 text-sm font-medium border border-gray-200">
            <Lock className="w-4 h-4" />
            Login to access
          </div>
        )}
      </div>
    </motion.div>
  )
}


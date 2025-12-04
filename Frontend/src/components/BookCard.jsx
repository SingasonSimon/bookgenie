import React from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Download, Eye, Lock } from 'lucide-react'

export default function BookCard({ book, relevance, user, onView, onDownload }) {
  const coverImage = book.cover_image && book.cover_image.startsWith('/api/files/')
    ? `http://localhost:5000${book.cover_image}`
    : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="card-hover group"
    >
      <div className="flex gap-4 mb-4">
        {coverImage ? (
          <img
            src={coverImage}
            alt={book.title}
            className="w-16 h-20 object-cover rounded-lg flex-shrink-0 shadow-md"
          />
        ) : (
          <div className="w-16 h-20 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center flex-shrink-0 shadow-md group-hover:shadow-lg transition-shadow">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold mb-1 text-gray-900 line-clamp-2 group-hover:text-primary-600 transition-colors">
            {book.title}
          </h3>
          <p className="text-gray-600 text-sm mb-3">by {book.author}</p>
          <div className="flex gap-2 flex-wrap">
            {book.genre && (
              <span className="bg-primary-50 text-primary-600 px-2.5 py-1 rounded-lg text-xs font-semibold uppercase">
                {book.genre}
              </span>
            )}
            {book.academic_level && (
              <span className="bg-purple-50 text-purple-600 px-2.5 py-1 rounded-lg text-xs font-semibold uppercase">
                {book.academic_level}
              </span>
            )}
            {relevance && (
              <span className="bg-green-50 text-green-600 px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1">
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
            <span key={idx} className="bg-gray-50 text-gray-700 px-2.5 py-1 rounded-lg text-xs font-medium">
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-3">
        {user ? (
          <>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onView}
              className="btn-primary flex-1 text-sm py-2.5 flex items-center justify-center gap-2"
            >
              <Eye className="w-4 h-4" />
              View
            </motion.button>
            {book.file_url && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onDownload}
                className="btn-secondary text-sm py-2.5 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Download</span>
              </motion.button>
            )}
          </>
        ) : (
          <div className="w-full py-3 px-4 bg-gray-50 rounded-lg flex items-center justify-center gap-2 text-gray-500 text-sm">
            <Lock className="w-4 h-4" />
            Login to access books
          </div>
        )}
      </div>
    </motion.div>
  )
}


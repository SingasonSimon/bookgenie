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
      className="card-hover group relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-100/50 to-purple-100/50 rounded-full -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      <div className="flex gap-4 mb-4 relative z-10">
        {coverImage ? (
          <motion.img
            whileHover={{ scale: 1.05 }}
            src={coverImage}
            alt={book.title}
            className="w-20 h-28 object-cover rounded-xl flex-shrink-0 shadow-lg group-hover:shadow-xl transition-shadow"
          />
        ) : (
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="w-20 h-28 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center flex-shrink-0 shadow-lg group-hover:shadow-xl transition-shadow"
          >
            <BookOpen className="w-10 h-10 text-white" />
          </motion.div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold mb-1.5 text-gray-900 line-clamp-2 group-hover:text-primary-600 transition-colors">
            {book.title}
          </h3>
          <p className="text-gray-600 text-sm mb-3 font-medium">by {book.author}</p>
          <div className="flex gap-2 flex-wrap">
            {book.genre && (
              <span className="bg-gradient-to-r from-primary-50 to-primary-100 text-primary-700 px-3 py-1 rounded-lg text-xs font-bold uppercase border border-primary-200">
                {book.genre}
              </span>
            )}
            {book.academic_level && (
              <span className="bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 px-3 py-1 rounded-lg text-xs font-bold uppercase border border-purple-200">
                {book.academic_level}
              </span>
            )}
            {relevance && (
              <span className="bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-green-200">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                {relevance.toFixed(1)}% match
              </span>
            )}
          </div>
        </div>
      </div>

      {book.abstract && (
        <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed relative z-10">
          {book.abstract.substring(0, 150)}...
        </p>
      )}

      {book.tags && book.tags.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-4 relative z-10">
          {book.tags.slice(0, 3).map((tag, idx) => (
            <span key={idx} className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg text-xs font-medium border border-gray-200">
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-3 relative z-10">
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
                className="btn-secondary text-sm py-2.5 flex items-center justify-center gap-2 min-w-[100px]"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Download</span>
              </motion.button>
            )}
          </>
        ) : (
          <div className="w-full py-3 px-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl flex items-center justify-center gap-2 text-gray-600 text-sm font-medium border border-gray-200">
            <Lock className="w-4 h-4" />
            Login to access books
          </div>
        )}
      </div>
    </motion.div>
  )
}


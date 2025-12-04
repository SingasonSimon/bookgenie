import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, BookOpen, User, Tag, GraduationCap, Star, FileText } from 'lucide-react'

export default function BookDetailsModal({ book, onClose, onDownload, user }) {
  if (!book) return null

  const coverImage = book.cover_image && book.cover_image.startsWith('/api/files/')
    ? `http://localhost:5000${book.cover_image}`
    : null

  const tags = book.tags ? (typeof book.tags === 'string' ? book.tags.split(',').filter(Boolean) : book.tags) : []

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl relative flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-gray-400 hover:text-gray-600 shadow-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </motion.button>

          {/* Content */}
          <div className="overflow-y-auto flex-1">
            {/* Header Section with Cover */}
            <div className="bg-gradient-to-br from-primary-50 to-purple-50 p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row gap-6">
                {/* Cover Image */}
                <div className="flex-shrink-0">
                  {coverImage ? (
                    <motion.img
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                      src={coverImage}
                      alt={book.title}
                      className="w-32 h-48 sm:w-40 sm:h-60 object-cover rounded-lg shadow-xl mx-auto sm:mx-0"
                    />
                  ) : (
                    <div className="w-32 h-48 sm:w-40 sm:h-60 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-xl mx-auto sm:mx-0">
                      <BookOpen className="w-16 h-16 sm:w-20 sm:h-20 text-white" />
                    </div>
                  )}
                </div>

                {/* Title and Author */}
                <div className="flex-1 text-center sm:text-left">
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-gray-900 mb-3">
                    {book.title}
                  </h2>
                  <div className="flex items-center justify-center sm:justify-start gap-2 text-gray-600 mb-4">
                    <User className="w-5 h-5" />
                    <span className="text-lg font-medium">{book.author}</span>
                  </div>

                  {/* Metadata Tags */}
                  <div className="flex flex-wrap gap-2 justify-center sm:justify-start mb-4">
                    {book.genre && (
                      <span className="bg-primary-100 text-primary-700 px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5">
                        <Tag className="w-4 h-4" />
                        {book.genre}
                      </span>
                    )}
                    {book.academic_level && (
                      <span className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-semibold capitalize flex items-center gap-1.5">
                        <GraduationCap className="w-4 h-4" />
                        {book.academic_level}
                      </span>
                    )}
                    {book.subscription_level && (
                      <span className="bg-amber-100 text-amber-700 px-3 py-1.5 rounded-lg text-sm font-semibold capitalize flex items-center gap-1.5">
                        <Star className="w-4 h-4" />
                        {book.subscription_level}
                      </span>
                    )}
                    {book.pages && (
                      <span className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5">
                        <FileText className="w-4 h-4" />
                        {book.pages} pages
                      </span>
                    )}
                  </div>

                  {/* Tags */}
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                      {tags.map((tag, idx) => (
                        <span key={idx} className="bg-gray-50 text-gray-600 px-2.5 py-1 rounded-md text-xs font-medium border border-gray-200">
                          #{tag.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Abstract Section */}
            <div className="p-6 sm:p-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary-600" />
                About This Book
              </h3>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {book.abstract || 'No abstract available for this book.'}
              </p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="border-t border-gray-200 p-4 sm:p-6 bg-gray-50">
            <div className="flex flex-col sm:flex-row gap-3">
              {user && book.file_url ? (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onDownload}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Download Book
                </motion.button>
              ) : (
                <div className="flex-1 py-3 px-4 bg-gray-100 rounded-lg text-center text-gray-600 text-sm font-medium">
                  {!user ? 'Login to download this book' : 'Download not available'}
                </div>
              )}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className="btn-secondary flex-1 sm:flex-initial sm:min-w-[120px]"
              >
                Close
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}


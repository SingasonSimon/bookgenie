import React from 'react'
import { motion } from 'framer-motion'
import BookCard from './BookCard'
import { BookOpen, Search } from 'lucide-react'

export default function BooksGrid({ books, searchResults, user, onViewBook, onDownloadBook, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="card animate-pulse">
            <div className="flex gap-4 mb-4">
              <div className="w-20 h-28 skeleton rounded-xl"></div>
              <div className="flex-1">
                <div className="h-5 skeleton rounded mb-2"></div>
                <div className="h-4 skeleton rounded w-2/3 mb-3"></div>
                <div className="h-6 skeleton rounded w-16"></div>
              </div>
            </div>
            <div className="h-4 skeleton rounded mb-2"></div>
            <div className="h-4 skeleton rounded w-5/6 mb-4"></div>
            <div className="h-10 skeleton rounded-xl"></div>
          </div>
        ))}
      </div>
    )
  }

  if (!books || books.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card text-center py-20"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary-100 to-purple-100 flex items-center justify-center"
        >
          {user ? (
            <BookOpen className="w-10 h-10 text-primary-600" />
          ) : (
            <Search className="w-10 h-10 text-primary-600" />
          )}
        </motion.div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          {user ? 'No books found' : 'Please login to view books'}
        </h3>
        <p className="text-gray-600 text-base mb-1">
          {user ? 'Try adjusting your filters or search query.' : 'Login to access the full library'}
        </p>
        {!user && (
          <p className="text-gray-500 text-sm mt-2">Create an account to get started</p>
        )}
      </motion.div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {books.map((book, index) => {
        const result = searchResults?.find(r => (r.book?.id || r.id) === book.id)
        const relevance = result?.relevance_percentage || result?.similarity_score
        return (
          <motion.div
            key={book.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03, duration: 0.3 }}
          >
            <BookCard
              book={book}
              relevance={relevance}
              user={user}
              onView={() => onViewBook(book.id)}
              onDownload={() => onDownloadBook(book.id)}
            />
          </motion.div>
        )
      })}
    </div>
  )
}


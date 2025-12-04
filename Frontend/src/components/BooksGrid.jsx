import React from 'react'
import { motion } from 'framer-motion'
import BookCard from './BookCard'
import { BookOpen, Search } from 'lucide-react'

export default function BooksGrid({ books, searchResults, user, onViewBook, onDownloadBook, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card animate-pulse">
            <div className="flex gap-4 mb-4">
              <div className="w-16 h-20 bg-gray-200 rounded-lg"></div>
              <div className="flex-1">
                <div className="h-5 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        ))}
      </div>
    )
  }

  if (!books || books.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="card text-center py-16"
      >
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
          {user ? (
            <BookOpen className="w-8 h-8 text-gray-400" />
          ) : (
            <Search className="w-8 h-8 text-gray-400" />
          )}
        </div>
        <p className="text-gray-600 text-lg font-medium">
          {user ? 'No books available.' : 'Please login to view books.'}
        </p>
        {!user && (
          <p className="text-gray-500 text-sm mt-2">Login to access the full library</p>
        )}
      </motion.div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {books.map((book, index) => {
        const result = searchResults?.[index]
        const relevance = result?.relevance_percentage || result?.similarity_score
        return (
          <motion.div
            key={book.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
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


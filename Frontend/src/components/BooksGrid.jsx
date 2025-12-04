import React from 'react'
import { motion } from 'framer-motion'
import BookCard from './BookCard'
import { BookOpen, Search } from 'lucide-react'

export default function BooksGrid({ books, searchResults, user, onViewBook, onDownloadBook, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="card">
            <div className="flex gap-4 mb-4">
              <div className="w-20 h-28 skeleton rounded-lg"></div>
              <div className="flex-1">
                <div className="h-5 skeleton rounded mb-2"></div>
                <div className="h-4 skeleton rounded w-2/3 mb-3"></div>
                <div className="h-6 skeleton rounded w-16"></div>
              </div>
            </div>
            <div className="h-4 skeleton rounded mb-2"></div>
            <div className="h-4 skeleton rounded w-5/6 mb-4"></div>
            <div className="h-10 skeleton rounded-lg"></div>
          </div>
        ))}
      </div>
    )
  }

  if (!books || books.length === 0) {
    return (
      <div className="card text-center py-16">
        <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-primary-50 flex items-center justify-center">
          {user ? (
            <BookOpen className="w-8 h-8 text-primary-600" />
          ) : (
            <Search className="w-8 h-8 text-primary-600" />
          )}
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {user ? 'No books found' : 'Please login to view books'}
        </h3>
        <p className="text-gray-600 text-sm">
          {user ? 'Try adjusting your filters or search query.' : 'Login to access the full library'}
        </p>
        {!user && (
          <p className="text-gray-500 text-xs mt-2">Create an account to get started</p>
        )}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {books.map((book, index) => {
        const result = searchResults?.find(r => (r.book?.id || r.id) === book.id)
        const relevance = result?.relevance_percentage || result?.similarity_score
        return (
          <motion.div
            key={book.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.02, duration: 0.2 }}
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


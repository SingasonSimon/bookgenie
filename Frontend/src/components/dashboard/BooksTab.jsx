import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookText, Plus, X } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import BookCard from '../BookCard'
import BookDetailsModal from '../BookDetailsModal'
import PageHeader from '../PageHeader'
import { GridSkeleton } from '../LoadingSkeleton'
import { BookGenieAPI } from '../../services/api'

export default function BooksTab() {
  const { user } = useAuth()
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedBook, setSelectedBook] = useState(null)
  const api = new BookGenieAPI()

  useEffect(() => {
    loadBooks()
  }, [])

  const loadBooks = async () => {
    try {
      const token = localStorage.getItem('bookgenie_token')
      const response = await fetch('http://localhost:5000/api/books', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      })
      const data = await response.json()
      setBooks(data)
    } catch (error) {
      console.error('Books error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader
        icon={BookText}
        title="Manage Books"
        description="Add, edit, and manage library content"
        action={
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add New Book
        </motion.button>
        }
      />

      {loading ? (
        <GridSkeleton count={6} />
      ) : books.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="card text-center py-16"
        >
          <BookText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-600 mb-4">No books in the library</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAddModal(true)}
            className="btn-primary"
          >
            Add Your First Book
          </motion.button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {books.map((book, idx) => (
            <motion.div
              key={book.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <BookCard
                book={book}
                user={{ role: 'admin' }}
                onView={async () => {
                  try {
                    const token = localStorage.getItem('bookgenie_token')
                    if (token) {
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
          ))}
        </div>
      )}

      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAddModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </motion.button>
              <h2 className="text-2xl font-display font-bold mb-4">Add New Book</h2>
              <p className="text-gray-600 mb-6">Book management form coming soon...</p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowAddModal(false)}
                className="btn-secondary w-full"
              >
                Close
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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


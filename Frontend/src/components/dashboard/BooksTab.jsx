import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookText, Plus, X, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import BookCard from '../BookCard'
import BookDetailsModal from '../BookDetailsModal'
import BookFormModal from '../admin/BookFormModal'
import DeleteConfirmModal from '../admin/DeleteConfirmModal'
import PageHeader from '../PageHeader'
import Notification from '../Notification'
import { GridSkeleton } from '../LoadingSkeleton'
import { BookGenieAPI } from '../../services/api'

export default function BooksTab() {
  const { user } = useAuth()
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedBook, setSelectedBook] = useState(null)
  const [bookToDelete, setBookToDelete] = useState(null)
  const [notification, setNotification] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState(null)
  const perPage = 12
  const api = new BookGenieAPI()

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  useEffect(() => {
    loadBooks(currentPage)
  }, [currentPage])

  const loadBooks = async (page = 1) => {
    try {
      setLoading(true)
      const token = localStorage.getItem('bookgenie_token')
      const result = await api.getBooks(token, { page, per_page: perPage })
      setBooks(result.books || [])
      setPagination(result.pagination)
    } catch (error) {
      console.error('Books error:', error)
      showNotification('Failed to load books', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveBook = async (bookData) => {
    const token = localStorage.getItem('bookgenie_token')
    if (selectedBook && selectedBook.id) {
      // Update existing book
      await api.updateBook(selectedBook.id, bookData, token)
      showNotification('Book updated successfully', 'success')
      await loadBooks(currentPage)
      setShowEditModal(false)
      setSelectedBook(null)
      return { id: selectedBook.id }
    } else {
      // Create new book
      const result = await api.createBook(bookData, token)
      showNotification('Book created successfully', 'success')
      await loadBooks(1) // Go to first page to see new book
      setCurrentPage(1)
      setShowAddModal(false)
      return result
    }
  }

  const handleDeleteBook = async () => {
    if (!bookToDelete) return
    
    try {
      const token = localStorage.getItem('bookgenie_token')
      await api.deleteBook(bookToDelete.id, token)
      showNotification('Book deleted successfully', 'success')
      // If current page becomes empty, go to previous page
      if (books.length === 1 && currentPage > 1) {
        const newPage = currentPage - 1
        setCurrentPage(newPage)
        await loadBooks(newPage)
      } else {
        await loadBooks(currentPage)
      }
      setShowDeleteModal(false)
      setBookToDelete(null)
    } catch (error) {
      console.error('Delete error:', error)
      showNotification(error.message || 'Failed to delete book', 'error')
    }
  }

  const handleUploadFile = async (bookId, file) => {
    const token = localStorage.getItem('bookgenie_token')
    return api.uploadBookFile(bookId, file, token)
  }

  const handleUploadCover = async (bookId, file) => {
    const token = localStorage.getItem('bookgenie_token')
    return api.uploadBookCover(bookId, file, token)
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
              className="relative group"
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
                      setShowViewModal(true)
                    } else {
                      setSelectedBook(book)
                      setShowViewModal(true)
                    }
                  } catch (error) {
                    console.error('Error fetching book details:', error)
                    setSelectedBook(book)
                    setShowViewModal(true)
                  }
                }}
                onDownload={async () => {
                  try {
                    const token = localStorage.getItem('bookgenie_token')
                    if (token && book.file_url) {
                      await api.downloadBook(book.file_url, token)
                    }
                  } catch (error) {
                    console.error('Download error:', error)
                  }
                }}
              />
              {/* Admin Actions Overlay */}
              <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={async () => {
                    try {
                      const token = localStorage.getItem('bookgenie_token')
                      if (token) {
                        const bookData = await api.getBook(book.id, token)
                        setSelectedBook(bookData)
                      } else {
                        setSelectedBook(book)
                      }
                      setShowEditModal(true)
                    } catch (error) {
                      console.error('Error fetching book details:', error)
                      setSelectedBook(book)
                      setShowEditModal(true)
                    }
                  }}
                  className="w-8 h-8 rounded-lg bg-blue-500 text-white flex items-center justify-center shadow-lg"
                >
                  <Edit className="w-4 h-4" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    setBookToDelete(book)
                    setShowDeleteModal(true)
                  }}
                  className="w-8 h-8 rounded-lg bg-red-500 text-white flex items-center justify-center shadow-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.total_pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (currentPage > 1) {
                setCurrentPage(currentPage - 1)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }
            }}
            disabled={currentPage === 1}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              currentPage === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-primary-600 text-white hover:bg-primary-700'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
            Previous
          </motion.button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
              let pageNum
              if (pagination.total_pages <= 5) {
                pageNum = i + 1
              } else if (currentPage <= 3) {
                pageNum = i + 1
              } else if (currentPage >= pagination.total_pages - 2) {
                pageNum = pagination.total_pages - 4 + i
              } else {
                pageNum = currentPage - 2 + i
              }
              
              return (
                <motion.button
                  key={pageNum}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    setCurrentPage(pageNum)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  className={`w-10 h-10 rounded-lg ${
                    currentPage === pageNum
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {pageNum}
                </motion.button>
              )
            })}
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (currentPage < pagination.total_pages) {
                setCurrentPage(currentPage + 1)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }
            }}
            disabled={currentPage === pagination.total_pages}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              currentPage === pagination.total_pages
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-primary-600 text-white hover:bg-primary-700'
            }`}
          >
            Next
            <ChevronRight className="w-5 h-5" />
          </motion.button>
          
          <span className="text-sm text-gray-600 ml-4">
            Page {currentPage} of {pagination.total_pages} ({pagination.total} total)
          </span>
        </div>
      )}

      {showAddModal && (
        <BookFormModal
          onClose={() => {
            setShowAddModal(false)
            setSelectedBook(null)
          }}
          onSave={handleSaveBook}
          onUploadFile={handleUploadFile}
          onUploadCover={handleUploadCover}
        />
      )}

      {showEditModal && selectedBook && !showViewModal && (
        <BookFormModal
          book={selectedBook}
          onClose={() => {
            setShowEditModal(false)
            setSelectedBook(null)
          }}
          onSave={handleSaveBook}
          onUploadFile={handleUploadFile}
          onUploadCover={handleUploadCover}
        />
      )}

      {showDeleteModal && bookToDelete && (
        <DeleteConfirmModal
          title="Delete Book"
          message={`Are you sure you want to delete "${bookToDelete.title}"? This action cannot be undone.`}
          itemName={bookToDelete.title}
          onConfirm={handleDeleteBook}
          onCancel={() => {
            setShowDeleteModal(false)
            setBookToDelete(null)
          }}
        />
      )}

      {showViewModal && selectedBook && !showEditModal && (
        <BookDetailsModal
          book={selectedBook}
          user={user}
          onClose={() => {
            setShowViewModal(false)
            setSelectedBook(null)
          }}
          onDownload={async () => {
            try {
              const token = localStorage.getItem('bookgenie_token')
              if (token && selectedBook && selectedBook.file_url) {
                await api.downloadBook(selectedBook.file_url, token)
              }
            } catch (error) {
              console.error('Download error:', error)
            }
          }}
        />
      )}

      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  )
}


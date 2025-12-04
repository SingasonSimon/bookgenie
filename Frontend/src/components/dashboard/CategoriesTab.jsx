import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, Plus, Edit, Trash2, ArrowLeft, ChevronRight, BookText, X } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import PageHeader from '../PageHeader'
import { GridSkeleton } from '../LoadingSkeleton'
import CategoryFormModal from '../admin/CategoryFormModal'
import DeleteConfirmModal from '../admin/DeleteConfirmModal'
import Notification from '../Notification'
import BookCard from '../BookCard'
import BookDetailsModal from '../BookDetailsModal'
import { BookGenieAPI } from '../../services/api'

export default function CategoriesTab() {
  const { user } = useAuth()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [categoryToDelete, setCategoryToDelete] = useState(null)
  const [notification, setNotification] = useState(null)
  const [viewingCategory, setViewingCategory] = useState(null)
  const [categoryBooks, setCategoryBooks] = useState([])
  const [loadingBooks, setLoadingBooks] = useState(false)
  const [selectedBook, setSelectedBook] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState(null)
  const api = new BookGenieAPI()
  const isAdmin = user?.role === 'admin'

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/categories')
      const data = await response.json()
      setCategories(data)
    } catch (error) {
      console.error('Categories error:', error)
      showNotification('Failed to load categories', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveCategory = async (categoryData) => {
    try {
      const token = localStorage.getItem('bookgenie_token')
      if (selectedCategory && selectedCategory.id) {
        // Update existing category
        await api.updateCategory(selectedCategory.id, categoryData, token)
        showNotification('Category updated successfully', 'success')
        await loadCategories()
        setShowEditModal(false)
        setSelectedCategory(null)
      } else {
        // Create new category
        await api.createCategory(categoryData, token)
        showNotification('Category created successfully', 'success')
        await loadCategories()
        setShowAddModal(false)
      }
    } catch (error) {
      console.error('Save category error:', error)
      showNotification(error.message || 'Failed to save category', 'error')
    }
  }

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return
    
    try {
      const token = localStorage.getItem('bookgenie_token')
      await api.deleteCategory(categoryToDelete.id, token)
      showNotification('Category deleted successfully', 'success')
      await loadCategories()
      setShowDeleteModal(false)
      setCategoryToDelete(null)
    } catch (error) {
      console.error('Delete error:', error)
      showNotification(error.message || 'Failed to delete category', 'error')
    }
  }

  const handleCategoryClick = async (category) => {
    if (isAdmin) return // Admins use edit/delete buttons
    
    setViewingCategory(category)
    setCurrentPage(1)
    await loadCategoryBooks(category.name, 1)
  }

  const loadCategoryBooks = async (categoryName, page = 1) => {
    try {
      setLoadingBooks(true)
      const token = localStorage.getItem('bookgenie_token')
      const data = await api.getBooksByCategory(categoryName, token, page, 12)
      setCategoryBooks(data.books || [])
      setPagination(data.pagination)
    } catch (error) {
      console.error('Error loading category books:', error)
      showNotification('Failed to load books', 'error')
      setCategoryBooks([])
    } finally {
      setLoadingBooks(false)
    }
  }

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage)
    loadCategoryBooks(viewingCategory.name, newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div>
      <PageHeader
        icon={BookOpen}
        title="Categories"
        description={isAdmin ? "Manage book categories" : "Browse by subject area"}
        action={isAdmin ? (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setSelectedCategory(null)
              setShowAddModal(true)
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Category
          </motion.button>
        ) : null}
      />

      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6 mt-2"></div>
            </div>
          ))}
        </div>
      ) : categories.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="card text-center py-16"
        >
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-600">No categories available</p>
          {isAdmin && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setSelectedCategory(null)
                setShowAddModal(true)
              }}
              className="btn-primary mt-4 flex items-center gap-2 mx-auto"
            >
              <Plus className="w-5 h-5" />
              Create First Category
            </motion.button>
          )}
        </motion.div>
      ) : viewingCategory ? (
        // Category Books View
        <div>
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setViewingCategory(null)
              setCategoryBooks([])
              setCurrentPage(1)
            }}
            className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Categories</span>
          </motion.button>

          <div className="mb-6">
            <div 
              className="inline-flex items-center gap-3 px-4 py-3 rounded-lg mb-4"
              style={{ backgroundColor: `${viewingCategory.color}15` }}
            >
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: viewingCategory.color || '#667eea' }}
              >
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-display font-bold text-gray-900">{viewingCategory.name}</h2>
                <p className="text-sm text-gray-600">{viewingCategory.description || 'Browse books in this category'}</p>
              </div>
            </div>
          </div>

          {loadingBooks ? (
            <GridSkeleton count={6} />
          ) : categoryBooks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="card text-center py-16"
            >
              <BookText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-600">No books available in this category</p>
            </motion.div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {categoryBooks.map((book, idx) => (
                  <motion.div
                    key={book.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <BookCard
                      book={book}
                      user={user}
                      onView={async () => {
                        try {
                          const token = localStorage.getItem('bookgenie_token')
                          if (token && book.id) {
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
                      onDownload={async () => {
                        try {
                          const token = localStorage.getItem('bookgenie_token')
                          if (token && book.file_url) {
                            await api.downloadBook(book.file_url, token)
                            await api.recordReading(book.id, 5, token).catch(() => {})
                            await api.recordInteraction(book.id, 'download', 1.0, token).catch(() => {})
                          }
                        } catch (error) {
                          console.error('Download error:', error)
                        }
                      }}
                    />
                  </motion.div>
                ))}
              </div>

              {/* Pagination */}
              {pagination && pagination.total_pages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                      currentPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-primary-600 text-white hover:bg-primary-700'
                    }`}
                  >
                    <ArrowLeft className="w-5 h-5" />
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
                          onClick={() => handlePageChange(pageNum)}
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
                    onClick={() => handlePageChange(currentPage + 1)}
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
                    Page {currentPage} of {pagination.total_pages} ({pagination.total} books)
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category, idx) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ y: -4, scale: 1.02 }}
              onClick={() => !isAdmin && handleCategoryClick(category)}
              className={`card relative overflow-hidden cursor-pointer transition-all ${
                !isAdmin ? 'hover:shadow-lg' : ''
              }`}
            >
              {isAdmin && (
                <div className="absolute top-4 right-4 flex gap-2 z-10">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedCategory(category)
                      setShowEditModal(true)
                    }}
                    className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center hover:bg-blue-200 transition-colors shadow-sm"
                  >
                    <Edit className="w-4 h-4" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation()
                      setCategoryToDelete(category)
                      setShowDeleteModal(true)
                    }}
                    className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-200 transition-colors shadow-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                  </motion.button>
                </div>
              )}
              
              <div className="relative">
                {/* Gradient Background */}
                <div 
                  className="absolute inset-0 opacity-10 rounded-lg"
                  style={{ background: `linear-gradient(135deg, ${category.color || '#667eea'} 0%, ${category.color || '#667eea'}80 100%)` }}
                />
                
                <div className="relative p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div 
                      className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg"
                      style={{ backgroundColor: category.color || '#667eea' }}
                    >
                      <BookOpen 
                        className="w-7 h-7 text-white" 
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-display font-bold mb-1 text-gray-900 truncate">{category.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <BookText className="w-4 h-4" />
                        <span className="font-semibold">{category.book_count || 0} {category.book_count === 1 ? 'book' : 'books'}</span>
                      </div>
                    </div>
                    {!isAdmin && (
                      <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    )}
                  </div>
                  
                  {category.description && (
                    <p className="text-gray-600 text-sm leading-relaxed line-clamp-2 mb-4">
                      {category.description}
                    </p>
                  )}
                  
                  {!isAdmin && category.book_count > 0 && (
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <span className="text-xs font-medium text-gray-500">Click to browse</span>
                      <motion.div
                        whileHover={{ x: 4 }}
                        className="text-primary-600"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </motion.div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {showAddModal && (
        <CategoryFormModal
          category={null}
          onClose={() => setShowAddModal(false)}
          onSave={handleSaveCategory}
        />
      )}

      {showEditModal && selectedCategory && (
        <CategoryFormModal
          category={selectedCategory}
          onClose={() => {
            setShowEditModal(false)
            setSelectedCategory(null)
          }}
          onSave={handleSaveCategory}
        />
      )}

      {showDeleteModal && categoryToDelete && (
        <DeleteConfirmModal
          title="Delete Category"
          message={`Are you sure you want to delete "${categoryToDelete.name}"? This action cannot be undone.`}
          itemName={categoryToDelete.name}
          onConfirm={handleDeleteCategory}
          onCancel={() => {
            setShowDeleteModal(false)
            setCategoryToDelete(null)
          }}
          loading={false}
        />
      )}

      {selectedBook && (
        <BookDetailsModal
          book={selectedBook}
          user={user}
          onClose={() => setSelectedBook(null)}
          onDownload={async () => {
            try {
              const token = localStorage.getItem('bookgenie_token')
              if (token && selectedBook && selectedBook.file_url) {
                await api.downloadBook(selectedBook.file_url, token)
                await api.recordReading(selectedBook.id, 5, token).catch(() => {})
                await api.recordInteraction(selectedBook.id, 'download', 1.0, token).catch(() => {})
              }
            } catch (error) {
              console.error('Download error:', error)
            }
          }}
        />
      )}
    </div>
  )
}


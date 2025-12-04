import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Plus, Edit, Trash2 } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import PageHeader from '../PageHeader'
import { GridSkeleton } from '../LoadingSkeleton'
import CategoryFormModal from '../admin/CategoryFormModal'
import DeleteConfirmModal from '../admin/DeleteConfirmModal'
import Notification from '../Notification'
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category, idx) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ y: -2 }}
              className="card relative"
            >
              {isAdmin && (
                <div className="absolute top-4 right-4 flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      setSelectedCategory(category)
                      setShowEditModal(true)
                    }}
                    className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center hover:bg-blue-200 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      setCategoryToDelete(category)
                      setShowDeleteModal(true)
                    }}
                    className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-200 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </motion.button>
                </div>
              )}
              <div className="flex items-start gap-4">
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: category.color || '#667eea', opacity: 0.2 }}
                >
                  <BookOpen 
                    className="w-6 h-6" 
                    style={{ color: category.color || '#667eea' }}
                  />
                </div>
                <div className="flex-1 pr-12">
                  <h3 className="text-lg font-semibold mb-2 text-gray-900">{category.name}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {category.description || 'No description available'}
                  </p>
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
    </div>
  )
}


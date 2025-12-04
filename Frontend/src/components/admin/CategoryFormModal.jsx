import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Palette } from 'lucide-react'
import Spinner from '../Spinner'

const COLOR_PRESETS = [
  '#667eea', '#4caf50', '#ff9800', '#9c27b0', '#f44336',
  '#2196f3', '#00bcd4', '#ffc107', '#795548', '#607d8b'
]

export default function CategoryFormModal({ category, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#667eea',
    icon: 'BookOpen',
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        description: category.description || '',
        color: category.color || '#667eea',
        icon: category.icon || 'BookOpen',
      })
    }
  }, [category])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      await onSave(formData)
    } catch (error) {
      console.error('Error saving category:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const modalContent = (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="bg-white rounded-xl max-w-md w-full shadow-2xl relative"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-display font-bold text-gray-900">
              {category ? 'Edit Category' : 'Add Category'}
            </h2>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div>
              <label className="block mb-2 text-gray-700 font-medium text-sm">Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="input-field"
                placeholder="Category name"
              />
            </div>

            <div>
              <label className="block mb-2 text-gray-700 font-medium text-sm">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="input-field resize-none"
                placeholder="Category description"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block mb-2 text-gray-700 font-medium text-sm flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Color
                </label>
                <div className="space-y-3">
                  <div className="flex gap-2 flex-wrap">
                    {COLOR_PRESETS.map((color) => (
                      <motion.button
                        key={color}
                        type="button"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setFormData(prev => ({ ...prev, color }))}
                        className={`w-10 h-10 rounded-lg border-2 transition-all ${
                          formData.color === color ? 'border-gray-900 scale-110' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    className="w-full h-12 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-2 text-gray-700 font-medium text-sm flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  Icon
                </label>
                <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto p-2 border border-gray-200 rounded-lg">
                  {ICON_OPTIONS.map((iconOption) => {
                    const IconComponent = iconOption.component
                    const isSelected = formData.icon === iconOption.name
                    return (
                      <motion.button
                        key={iconOption.name}
                        type="button"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setFormData(prev => ({ ...prev, icon: iconOption.name }))}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                          isSelected 
                            ? 'bg-primary-600 text-white shadow-lg scale-110' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                        title={iconOption.name}
                      >
                        <IconComponent className="w-5 h-5" />
                      </motion.button>
                    )
                  })}
                </div>
                <p className="text-xs text-gray-500 mt-2">Selected: {formData.icon}</p>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={onClose}
                className="btn-secondary flex-1"
                disabled={loading}
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="btn-primary flex-1 flex items-center justify-center gap-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Spinner size="sm" />
                    Saving...
                  </>
                ) : (
                  category ? 'Update' : 'Create'
                )}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )

  return typeof window !== 'undefined' ? createPortal(modalContent, document.body) : null
}


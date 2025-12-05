import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  Palette, 
  Star, 
  BookOpen, 
  GraduationCap, 
  BookText, 
  Tag, 
  Search, 
  FileText, 
  Library, 
  School, 
  Award, 
  Trophy, 
  Lightbulb, 
  Target, 
  Zap, 
  Sparkles, 
  Brain, 
  Microscope, 
  Calculator, 
  Globe, 
  Music, 
  Paintbrush, 
  Code, 
  Heart, 
  Flame, 
  Leaf, 
  Mountain, 
  Atom 
} from 'lucide-react'
import Spinner from '../Spinner'

const COLOR_PRESETS = [
  '#667eea', '#4caf50', '#ff9800', '#9c27b0', '#f44336',
  '#2196f3', '#00bcd4', '#ffc107', '#795548', '#607d8b'
]

const ICON_OPTIONS = [
  { name: 'BookOpen', component: BookOpen },
  { name: 'Star', component: Star },
  { name: 'GraduationCap', component: GraduationCap },
  { name: 'BookText', component: BookText },
  { name: 'Tag', component: Tag },
  { name: 'Search', component: Search },
  { name: 'FileText', component: FileText },
  { name: 'Library', component: Library },
  { name: 'School', component: School },
  { name: 'Award', component: Award },
  { name: 'Trophy', component: Trophy },
  { name: 'Lightbulb', component: Lightbulb },
  { name: 'Target', component: Target },
  { name: 'Zap', component: Zap },
  { name: 'Sparkles', component: Sparkles },
  { name: 'Brain', component: Brain },
  { name: 'Microscope', component: Microscope },
  { name: 'Calculator', component: Calculator },
  { name: 'Globe', component: Globe },
  { name: 'Music', component: Music },
  { name: 'Paintbrush', component: Paintbrush },
  { name: 'Code', component: Code },
  { name: 'Heart', component: Heart },
  { name: 'Flame', component: Flame },
  { name: 'Leaf', component: Leaf },
  { name: 'Mountain', component: Mountain },
  { name: 'Atom', component: Atom },
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

  // Get the selected icon component
  const SelectedIcon = ICON_OPTIONS.find(opt => opt.name === formData.icon)?.component || BookOpen

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
          className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl relative flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center gap-3">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md"
                style={{ backgroundColor: formData.color }}
              >
                <SelectedIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-display font-bold text-gray-900">
                  {category ? 'Edit Category' : 'Create Category'}
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {category ? 'Update category details' : 'Add a new category to organize books'}
                </p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all"
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 space-y-6">
            {/* Preview Section */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 border border-gray-200">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Preview</p>
              <div className="flex items-center gap-4">
                <div 
                  className="w-16 h-16 rounded-xl flex items-center justify-center shadow-lg transition-all"
                  style={{ backgroundColor: formData.color }}
                >
                  <SelectedIcon className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-display font-bold text-gray-900 mb-1">
                    {formData.name || 'Category Name'}
                  </h3>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {formData.description || 'Category description will appear here...'}
                  </p>
                </div>
              </div>
            </div>

            {/* Name Field */}
            <div>
              <label className="block mb-2 text-gray-700 font-semibold text-sm">
                Category Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
                placeholder="e.g., Mathematics, Science, Literature"
              />
            </div>

            {/* Description Field */}
            <div>
              <label className="block mb-2 text-gray-700 font-semibold text-sm">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none resize-none"
                placeholder="Brief description of this category..."
              />
            </div>

            {/* Color and Icon Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Color Picker */}
              <div>
                <label className="block mb-3 text-gray-700 font-semibold text-sm flex items-center gap-2">
                  <Palette className="w-4 h-4 text-primary-600" />
                  Category Color
                </label>
                <div className="space-y-4">
                  <div className="flex gap-2.5 flex-wrap">
                    {COLOR_PRESETS.map((color) => (
                      <motion.button
                        key={color}
                        type="button"
                        whileHover={{ scale: 1.15, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setFormData(prev => ({ ...prev, color }))}
                        className={`w-11 h-11 rounded-xl border-2 transition-all shadow-md hover:shadow-lg ${
                          formData.color === color 
                            ? 'border-gray-900 scale-110 ring-2 ring-offset-2 ring-gray-900/20' 
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                  <div className="relative">
                    <label className="block text-xs text-gray-600 mb-2">Custom Color</label>
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                      className="w-full h-12 rounded-lg cursor-pointer border-2 border-gray-300 hover:border-gray-400 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Icon Picker */}
              <div>
                <label className="block mb-3 text-gray-700 font-semibold text-sm flex items-center gap-2">
                  <Star className="w-4 h-4 text-primary-600" />
                  Category Icon
                </label>
                <div className="relative">
                  <div className="grid grid-cols-5 gap-2.5 max-h-64 overflow-y-auto p-3 border-2 border-gray-200 rounded-xl bg-gray-50/50 custom-scrollbar">
                    {ICON_OPTIONS.map((iconOption) => {
                      const IconComponent = iconOption.component
                      const isSelected = formData.icon === iconOption.name
                      return (
                        <motion.button
                          key={iconOption.name}
                          type="button"
                          whileHover={{ scale: 1.1, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setFormData(prev => ({ ...prev, icon: iconOption.name }))}
                          className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all relative ${
                            isSelected 
                              ? 'bg-primary-600 text-white shadow-lg scale-105 ring-2 ring-offset-2 ring-primary-600/30' 
                              : 'bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900 border-2 border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md'
                          }`}
                          title={iconOption.name}
                        >
                          <IconComponent className="w-5 h-5" />
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute -top-1 -right-1 w-4 h-4 bg-primary-600 rounded-full border-2 border-white flex items-center justify-center"
                            >
                              <div className="w-2 h-2 bg-white rounded-full" />
                            </motion.div>
                          )}
                        </motion.button>
                      )
                    })}
                  </div>
                  <p className="text-xs text-gray-500 mt-3 flex items-center gap-2">
                    <span className="font-medium">Selected:</span>
                    <span className="px-2 py-1 bg-primary-50 text-primary-700 rounded-md font-semibold">
                      {formData.icon}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors"
                disabled={loading}
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="flex-1 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                disabled={loading}
                style={{ backgroundColor: loading ? '#9ca3af' : formData.color }}
              >
                {loading ? (
                  <>
                    <Spinner size="sm" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    {category ? 'Update Category' : 'Create Category'}
                  </>
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


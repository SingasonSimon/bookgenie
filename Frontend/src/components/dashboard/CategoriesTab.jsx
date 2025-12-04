import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Loader2 } from 'lucide-react'
import PageHeader from '../PageHeader'
import { GridSkeleton } from '../LoadingSkeleton'

export default function CategoriesTab() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

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
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader
        icon={BookOpen}
        title="Categories"
        description="Browse by subject area"
      />

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
              className="card"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-6 h-6 text-primary-600" />
                </div>
                <div className="flex-1">
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
    </div>
  )
}


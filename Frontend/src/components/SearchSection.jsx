import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Filter, X } from 'lucide-react'

export default function SearchSection({ onSearch, onQuickSearch, filters, onFilterChange, onClearFilters }) {
  const [query, setQuery] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    onSearch(query)
  }

  const quickSearches = ['machine learning', 'climate change', 'quantum physics']
  const hasFilters = filters.genre || filters.academic_level

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="card"
    >
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask a question like: 'How does climate change affect agriculture in Africa?'"
              className="input-field pl-12 pr-4 text-base"
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="btn-primary whitespace-nowrap flex items-center gap-2 px-6"
          >
            <Search className="w-5 h-5" />
            <span className="hidden sm:inline">Search</span>
          </motion.button>
        </div>
        </form>

      <div className="space-y-4">
        <div className="flex gap-2 items-center flex-wrap">
          <span className="text-gray-600 font-medium text-sm">Quick searches:</span>
          {quickSearches.map((search, idx) => (
            <motion.button
              key={search}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 + idx * 0.05 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setQuery(search)
                onQuickSearch(search)
              }}
              className="bg-gray-50 text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-primary-50 hover:text-primary-700 hover:border-primary-300 transition-colors"
            >
              {search}
            </motion.button>
          ))}
        </div>

        <div className="flex gap-3 items-center flex-wrap pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-gray-600 font-medium text-sm">Filters:</span>
          </div>
            <select
              value={filters.genre}
              onChange={(e) => onFilterChange('genre', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all text-sm bg-white font-medium text-gray-700"
            >
              <option value="">All Genres</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Physics">Physics</option>
              <option value="Biology">Biology</option>
              <option value="Chemistry">Chemistry</option>
              <option value="Literature">Literature</option>
            </select>
            <select
              value={filters.academic_level}
              onChange={(e) => onFilterChange('academic_level', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all text-sm bg-white font-medium text-gray-700"
            >
              <option value="">All Levels</option>
              <option value="undergraduate">Undergraduate</option>
              <option value="graduate">Graduate</option>
              <option value="postgraduate">Postgraduate</option>
            </select>
          {hasFilters && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClearFilters}
              className="btn-secondary flex items-center gap-2 text-sm px-4 bg-red-50 border-red-200 text-red-600 hover:bg-red-100 hover:border-red-300"
            >
              <X className="w-4 h-4" />
              Clear
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  )
}


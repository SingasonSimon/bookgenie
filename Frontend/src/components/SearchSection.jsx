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
      <form onSubmit={handleSubmit} className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask a question like: 'How does climate change affect agriculture in Africa?'"
              className="input-field pl-10 sm:pl-12 pr-4 text-sm sm:text-base w-full"
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="btn-primary whitespace-nowrap flex items-center justify-center gap-2 px-4 sm:px-6 w-full sm:w-auto"
          >
            <Search className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Search</span>
          </motion.button>
        </div>
        </form>

      <div className="space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-2 items-start sm:items-center">
          <span className="text-gray-600 font-medium text-xs sm:text-sm whitespace-nowrap">Quick searches:</span>
          <div className="flex flex-wrap gap-2">
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
                className="bg-gray-50 text-gray-700 border border-gray-200 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium hover:bg-primary-50 hover:text-primary-700 hover:border-primary-300 transition-colors"
              >
                {search}
              </motion.button>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-start sm:items-center pt-3 sm:pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2 flex-shrink-0">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-gray-600 font-medium text-xs sm:text-sm">Filters:</span>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
            <select
              value={filters.genre}
              onChange={(e) => onFilterChange('genre', e.target.value)}
              className="px-2.5 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all text-xs sm:text-sm bg-white font-medium text-gray-700 flex-1 sm:flex-initial min-w-[120px]"
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
              className="px-2.5 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all text-xs sm:text-sm bg-white font-medium text-gray-700 flex-1 sm:flex-initial min-w-[120px]"
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
                className="btn-secondary flex items-center gap-2 text-xs sm:text-sm px-3 sm:px-4 bg-red-50 border-red-200 text-red-600 hover:bg-red-100 hover:border-red-300 w-full sm:w-auto justify-center"
              >
                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Clear
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}


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
      transition={{ delay: 0.2 }}
      className="card mb-8 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary-100/30 to-purple-100/30 rounded-full -mr-32 -mt-32"></div>
      
      <div className="relative z-10">
        <form onSubmit={handleSubmit} className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask a question like: 'How does climate change affect agriculture in Africa?'"
              className="input-field pl-12 pr-4 text-base"
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            className="btn-primary whitespace-nowrap flex items-center gap-2 px-6"
          >
            <Search className="w-5 h-5" />
            <span className="hidden sm:inline">Search</span>
          </motion.button>
        </form>

        <div className="flex gap-3 items-center flex-wrap mb-6">
          <span className="text-gray-700 font-semibold text-sm">Quick searches:</span>
          {quickSearches.map((search, idx) => (
            <motion.button
              key={search}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + idx * 0.1 }}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setQuery(search)
                onQuickSearch(search)
              }}
              className="bg-gradient-to-r from-primary-50 to-purple-50 text-primary-700 border border-primary-200 px-4 py-2 rounded-full text-sm font-semibold hover:from-primary-500 hover:to-primary-600 hover:text-white hover:border-primary-500 hover:shadow-lg transition-all duration-300"
            >
              {search}
            </motion.button>
          ))}
        </div>

        <div className="flex gap-4 items-center flex-wrap">
          <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl border border-gray-200">
            <Filter className="w-4 h-4 text-primary-600" />
            <label className="text-gray-700 font-semibold text-sm">Genre:</label>
            <select
              value={filters.genre}
              onChange={(e) => onFilterChange('genre', e.target.value)}
              className="px-3 py-1.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all text-sm bg-white font-medium"
            >
              <option value="">All Genres</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Physics">Physics</option>
              <option value="Biology">Biology</option>
              <option value="Chemistry">Chemistry</option>
              <option value="Literature">Literature</option>
            </select>
          </div>
          <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl border border-gray-200">
            <label className="text-gray-700 font-semibold text-sm">Level:</label>
            <select
              value={filters.academic_level}
              onChange={(e) => onFilterChange('academic_level', e.target.value)}
              className="px-3 py-1.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all text-sm bg-white font-medium"
            >
              <option value="">All Levels</option>
              <option value="undergraduate">Undergraduate</option>
              <option value="graduate">Graduate</option>
              <option value="postgraduate">Postgraduate</option>
            </select>
          </div>
          {hasFilters && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClearFilters}
              className="btn-secondary flex items-center gap-2 text-sm px-4 bg-red-50 border-red-200 text-red-600 hover:bg-red-100 hover:border-red-300"
            >
              <X className="w-4 h-4" />
              Clear Filters
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  )
}


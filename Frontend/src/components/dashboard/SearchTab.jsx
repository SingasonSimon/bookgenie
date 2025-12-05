import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Sparkles, Filter, X, Clock, TrendingUp, ArrowUpDown, BookOpen, Star } from 'lucide-react'
import { BookGenieAPI } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import BooksGrid from '../BooksGrid'
import BookDetailsModal from '../BookDetailsModal'
import PageHeader from '../PageHeader'
import LoadingIndicator from '../LoadingIndicator'
import Spinner from '../Spinner'
import Notification from '../Notification'

export default function SearchTab() {
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedBook, setSelectedBook] = useState(null)
  const [searchHistory, setSearchHistory] = useState([])
  const [filters, setFilters] = useState({ genre: '', academic_level: '' })
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState('relevance') // relevance, title, author
  const [notification, setNotification] = useState(null)
  const api = new BookGenieAPI()

  const quickSearches = [
    'machine learning',
    'climate change',
    'quantum physics',
    'artificial intelligence',
    'sustainable energy'
  ]

  useEffect(() => {
    loadSearchHistory()
  }, [])

  const loadSearchHistory = async () => {
    try {
      const token = localStorage.getItem('bookgenie_token')
      if (token) {
        const data = await api.getSearchHistory(token, 8)
        setSearchHistory(data.history || [])
      }
    } catch (error) {
      console.error('Error loading search history:', error)
    }
  }

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  const handleSearch = async (searchQuery = query) => {
    if (!searchQuery.trim()) {
      showNotification('Please enter a search query', 'info')
      return
    }

    try {
      setLoading(true)
      const token = localStorage.getItem('bookgenie_token')
      const response = await api.search(searchQuery, token)
      
      // Handle response format: { results: [] } or just array
      const searchResults = Array.isArray(response) ? response : (response?.results || [])
      
      // Filter out negative matches
      let filteredResults = searchResults.filter(result => {
        const similarity = result.similarity_score ?? result.relevance_percentage / 100
        const relevance = result.relevance_percentage ?? (result.similarity_score * 100)
        return (similarity > 0 && relevance > 0) || 
               (similarity !== undefined && similarity > 0) ||
               (relevance !== undefined && relevance > 0)
      })

      // Apply filters
      if (filters.genre) {
        filteredResults = filteredResults.filter(r => {
          const book = r.book || r
          return book.genre === filters.genre
        })
      }
      if (filters.academic_level) {
        filteredResults = filteredResults.filter(r => {
          const book = r.book || r
          return book.academic_level === filters.academic_level
        })
      }

      // Sort results
      filteredResults = sortResults(filteredResults, sortBy)
      
      setResults(filteredResults)
      setQuery(searchQuery)
      
      // Reload search history after search
      await loadSearchHistory()
      
      if (filteredResults.length === 0) {
        showNotification('No results found. Try a different search query.', 'info')
      }
    } catch (error) {
      console.error('Search error:', error)
      showNotification('Search failed. Please try again.', 'error')
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const sortResults = (results, sortType) => {
    const sorted = [...results]
    
    switch (sortType) {
      case 'relevance':
        return sorted.sort((a, b) => {
          const scoreA = a.similarity_score ?? a.relevance_percentage / 100 ?? 0
          const scoreB = b.similarity_score ?? b.relevance_percentage / 100 ?? 0
          return scoreB - scoreA
        })
      case 'title':
        return sorted.sort((a, b) => {
          const titleA = (a.book || a).title || ''
          const titleB = (b.book || b).title || ''
          return titleA.localeCompare(titleB)
        })
      case 'author':
        return sorted.sort((a, b) => {
          const authorA = (a.book || a).author || ''
          const authorB = (b.book || b).author || ''
          return authorA.localeCompare(authorB)
        })
      default:
        return sorted
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({ genre: '', academic_level: '' })
    if (results.length > 0) {
      handleSearch(query)
    }
  }

  const handleQuickSearch = (searchQuery) => {
    setQuery(searchQuery)
    handleSearch(searchQuery)
  }

  const handleHistoryClick = (historyQuery) => {
    setQuery(historyQuery)
    handleSearch(historyQuery)
  }

  const hasFilters = filters.genre || filters.academic_level

  return (
    <div>
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      <PageHeader
        icon={Search}
        title="Search Books"
        description="Find exactly what you're looking for with AI-powered semantic search"
      />

      {/* Search Bar */}
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        onSubmit={(e) => {
          e.preventDefault()
          handleSearch()
        }}
        className="mb-6"
      >
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for books, topics, or ask a question..."
              className="input-field pl-12 text-base w-full"
            />
          </div>
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`btn-secondary flex items-center gap-2 ${showFilters ? 'bg-primary-100 border-primary-300' : ''}`}
            >
              <Filter className="w-5 h-5" />
              <span className="hidden sm:inline">Filters</span>
              {hasFilters && (
                <span className="bg-primary-600 text-white text-xs px-2 py-0.5 rounded-full">
                  {[filters.genre, filters.academic_level].filter(Boolean).length}
                </span>
              )}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center gap-2 whitespace-nowrap"
            >
              {loading ? (
                <>
                  <Spinner size="sm" />
                  <span className="hidden sm:inline">Searching...</span>
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  <span className="hidden sm:inline">Search</span>
                </>
              )}
            </motion.button>
          </div>
        </div>
      </motion.form>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="card mb-6 overflow-hidden"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-primary-600" />
                <h3 className="font-semibold text-gray-900">Filter Results</h3>
              </div>
              {hasFilters && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={clearFilters}
                  className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
                >
                  <X className="w-4 h-4" />
                  Clear All
                </motion.button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Genre</label>
                <select
                  value={filters.genre}
                  onChange={(e) => handleFilterChange('genre', e.target.value)}
                  className="input-field w-full"
                >
                  <option value="">All Genres</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Physics">Physics</option>
                  <option value="Biology">Biology</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="Environmental Science">Environmental Science</option>
                  <option value="Economics">Economics</option>
                  <option value="Social Sciences">Social Sciences</option>
                  <option value="Literature">Literature</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Academic Level</label>
                <select
                  value={filters.academic_level}
                  onChange={(e) => handleFilterChange('academic_level', e.target.value)}
                  className="input-field w-full"
                >
                  <option value="">All Levels</option>
                  <option value="undergraduate">Undergraduate</option>
                  <option value="graduate">Graduate</option>
                  <option value="postgraduate">Postgraduate</option>
                </select>
              </div>
            </div>
            {hasFilters && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSearch(query)}
                className="btn-primary mt-4 w-full"
              >
                Apply Filters
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Searches & Recent Searches */}
      {!loading && results.length === 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Quick Searches */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card"
          >
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-primary-600" />
              <h3 className="font-semibold text-gray-900">Quick Searches</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {quickSearches.map((search, idx) => (
                <motion.button
                  key={search}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 + idx * 0.05 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleQuickSearch(search)}
                  className="bg-gray-50 text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-primary-50 hover:text-primary-700 hover:border-primary-300 transition-colors"
                >
                  {search}
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Recent Searches */}
          {searchHistory.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="card"
            >
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-primary-600" />
                <h3 className="font-semibold text-gray-900">Recent Searches</h3>
              </div>
              <div className="space-y-2">
                {searchHistory.map((item, idx) => (
                  <motion.button
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + idx * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleHistoryClick(item.query)}
                    className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-primary-50 transition-colors flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Clock className="w-4 h-4 text-gray-400 group-hover:text-primary-600 flex-shrink-0" />
                      <span className="text-sm font-medium text-gray-900 truncate">{item.query}</span>
                    </div>
                    {item.search_count > 1 && (
                      <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
                        {item.search_count}x
                      </span>
                    )}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Results Header */}
      {!loading && results.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-2 text-gray-600">
            <Sparkles className="w-5 h-5 text-primary-500" />
            <span className="font-medium">
              Found {results.length} result{results.length !== 1 ? 's' : ''}
              {query && ` for "${query}"`}
            </span>
          </div>
          
          {/* Sort Options */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value)
                const sorted = sortResults(results, e.target.value)
                setResults(sorted)
              }}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 bg-white"
            >
              <option value="relevance">Sort by Relevance</option>
              <option value="title">Sort by Title</option>
              <option value="author">Sort by Author</option>
            </select>
          </div>
        </motion.div>
      )}

      {/* Loading State */}
      {loading && <LoadingIndicator message="Searching through our collection..." />}

      {/* Results */}
      {!loading && (
        <BooksGrid
          books={results.map(r => r.book || r)}
          searchResults={results}
          user={user}
          loading={loading}
          onViewBook={async (bookId) => {
            try {
              const token = localStorage.getItem('bookgenie_token')
              if (token) {
                const bookData = await api.getBook(bookId, token)
                setSelectedBook(bookData)
              } else {
                const book = results.find(r => (r.book || r).id === bookId)
                if (book) {
                  setSelectedBook(book.book || book)
                }
              }
            } catch (error) {
              console.error('Error fetching book details:', error)
              const book = results.find(r => (r.book || r).id === bookId)
              if (book) {
                setSelectedBook(book.book || book)
              }
            }
          }}
          onDownloadBook={async (bookId) => {
            const book = results.find(r => (r.book || r).id === bookId)
            if (book && (book.book || book).file_url) {
              try {
                const token = localStorage.getItem('bookgenie_token')
                const bookData = book.book || book
                if (token && bookData && bookData.file_url) {
                  await api.downloadBook(bookData.file_url, token)
                  
                  // Record reading session
                  try {
                    await api.recordReading(bookId, 5, token)
                    console.log('Reading session recorded for book:', bookId)
                  } catch (err) {
                    console.error('Error recording reading session:', err)
                  }
                  
                  // Record download interaction
                  try {
                    await api.recordInteraction(bookId, 'download', 1.0, token)
                    console.log('Download interaction recorded for book:', bookId)
                  } catch (err) {
                    console.error('Error recording interaction:', err)
                  }
                  
                  showNotification('Download started', 'success')
                }
              } catch (error) {
                console.error('Download error:', error)
                showNotification('Download failed', 'error')
              }
            }
          }}
        />
      )}

      {/* Empty State */}
      {!loading && results.length === 0 && query && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="card text-center py-16"
        >
          <Search className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No results found</h3>
          <p className="text-gray-600 mb-4">
            We couldn't find any books matching "{query}"
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setQuery('')
                setResults([])
                clearFilters()
              }}
              className="btn-secondary"
            >
              Clear Search
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowFilters(true)}
              className="btn-primary"
            >
              Try Filters
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Book Details Modal */}
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
                showNotification('Download started', 'success')
              }
            } catch (error) {
              console.error('Download error:', error)
              showNotification('Download failed', 'error')
            }
          }}
        />
      )}
    </div>
  )
}

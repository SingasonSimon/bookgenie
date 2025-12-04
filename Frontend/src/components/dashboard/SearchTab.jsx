import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Sparkles } from 'lucide-react'
import { BookGenieAPI } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import BooksGrid from '../BooksGrid'
import BookDetailsModal from '../BookDetailsModal'
import PageHeader from '../PageHeader'
import LoadingIndicator from '../LoadingIndicator'
import Spinner from '../Spinner'

export default function SearchTab() {
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedBook, setSelectedBook] = useState(null)
  const api = new BookGenieAPI()

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!query.trim()) return

    try {
      setLoading(true)
      const token = localStorage.getItem('bookgenie_token')
      const searchResults = await api.search(query, token)
      setResults(searchResults)
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader
        icon={Search}
        title="Search Books"
        description="Find exactly what you're looking for"
      />

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        onSubmit={handleSearch}
        className="mb-6"
      >
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for books, topics, or ask a question..."
              className="input-field pl-12 text-base"
            />
          </div>
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
      </motion.form>

      {loading && <LoadingIndicator message="Searching through our collection..." />}
      {!loading && results.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-4 flex items-center gap-2 text-gray-600"
        >
          <Sparkles className="w-5 h-5 text-primary-500" />
          <span className="font-medium">Found {results.length} result{results.length !== 1 ? 's' : ''}</span>
        </motion.div>
      )}
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
          onDownloadBook={(bookId) => {
            const book = results.find(r => (r.book || r).id === bookId)
            if (book && (book.book || book).file_url) {
              window.open(`http://localhost:5000${(book.book || book).file_url}`, '_blank')
            }
          }}
        />
      )}

      {selectedBook && (
        <BookDetailsModal
          book={selectedBook}
          user={user}
          onClose={() => setSelectedBook(null)}
          onDownload={() => {
            if (selectedBook && selectedBook.file_url) {
              window.open(`http://localhost:5000${selectedBook.file_url}`, '_blank')
            }
          }}
        />
      )}
    </div>
  )
}


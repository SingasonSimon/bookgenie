import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import StatsCard from '../components/StatsCard'
import SearchSection from '../components/SearchSection'
import BooksGrid from '../components/BooksGrid'
import LoginModal from '../components/LoginModal'
import RegisterModal from '../components/RegisterModal'
import Notification from '../components/Notification'
import LoadingIndicator from '../components/LoadingIndicator'
import { useAuth } from '../contexts/AuthContext'
import { BookGenieAPI } from '../services/api'

export default function HomePage() {
  const { user, login, register } = useAuth()
  const navigate = useNavigate()
  const [books, setBooks] = useState([])
  const [searchResults, setSearchResults] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const [notification, setNotification] = useState(null)
  const [filters, setFilters] = useState({ genre: '', academic_level: '' })

  const api = new BookGenieAPI()

  useEffect(() => {
    if (user) {
      loadBooks()
    }
  }, [user, filters])

  const loadBooks = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('bookgenie_token')
      if (!token) {
        setBooks([])
        return
      }
      const booksData = await api.getBooks(token, filters)
      if (Array.isArray(booksData)) {
        setBooks(booksData)
        setSearchResults([])
        if (booksData.length === 0) {
          showNotification('No books found. Try adjusting your filters.', 'info')
        }
      } else {
        setBooks([])
        showNotification('Unexpected response format from server.', 'error')
      }
    } catch (error) {
      console.error('Error loading books:', error)
      const errorMessage = error.message || 'Failed to load books. Please try again.'
      showNotification(errorMessage, 'error')
      setBooks([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogin = async (email, password) => {
    const result = await login(email, password)
    if (result.success) {
      setShowLoginModal(false)
      showNotification('Login successful!', 'success')
      await loadBooks()
    } else {
      showNotification(result.error || 'Login failed', 'error')
    }
  }

  const handleRegister = async (formData) => {
    const result = await register(formData)
    if (result.success) {
      setShowRegisterModal(false)
      showNotification('Registration successful!', 'success')
      await loadBooks()
    } else {
      showNotification(result.error || 'Registration failed', 'error')
    }
  }

  const handleSearch = async (query) => {
    if (!query.trim()) {
      showNotification('Please enter a search query', 'info')
      return
    }

    try {
      setIsLoading(true)
      const token = localStorage.getItem('bookgenie_token')
      const results = await api.search(query, token)
      if (Array.isArray(results)) {
        setSearchResults(results)
        setBooks([])
        if (results.length === 0) {
          showNotification('No results found. Try a different search query.', 'info')
        }
      } else {
        setSearchResults([])
        showNotification('Unexpected response format from server.', 'error')
      }
    } catch (error) {
      console.error('Search error:', error)
      const errorMessage = error.message || 'Search failed. Please check your connection and try again.'
      showNotification(errorMessage, 'error')
      setSearchResults([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickSearch = (query) => {
    handleSearch(query)
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({ genre: '', academic_level: '' })
  }

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  const displayBooks = searchResults.length > 0 ? searchResults.map(r => r.book || r) : books

  return (
    <div className="min-h-screen blob-bg p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <Navbar
          user={user}
          onLoginClick={() => setShowLoginModal(true)}
          onLogout={() => {
            localStorage.removeItem('bookgenie_token')
            window.location.reload()
          }}
          onAdminClick={() => navigate('/dashboard')}
        />

        <StatsCard totalBooks={books.length} />

        <SearchSection
          onSearch={handleSearch}
          onQuickSearch={handleQuickSearch}
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={clearFilters}
        />

        {isLoading && <LoadingIndicator />}

        {!isLoading && (
          <BooksGrid
            books={displayBooks}
            searchResults={searchResults}
            user={user}
            loading={isLoading}
            onViewBook={(bookId) => {
              const book = displayBooks.find(b => b.id === bookId)
              if (book) {
                alert(`Book: ${book.title}\nAuthor: ${book.author}\n\n${book.abstract || 'No abstract available'}`)
              }
            }}
            onDownloadBook={async (bookId) => {
              if (!user) {
                showNotification('Please login to download books', 'error')
                return
              }
              const book = displayBooks.find(b => b.id === bookId)
              if (book && book.file_url) {
                window.open(`http://localhost:5000${book.file_url}`, '_blank')
              } else {
                showNotification('Book file not available', 'error')
              }
            }}
          />
        )}

        {showLoginModal && (
          <LoginModal
            onClose={() => setShowLoginModal(false)}
            onLogin={handleLogin}
            onSwitchToRegister={() => {
              setShowLoginModal(false)
              setShowRegisterModal(true)
            }}
          />
        )}

        {showRegisterModal && (
          <RegisterModal
            onClose={() => setShowRegisterModal(false)}
            onRegister={handleRegister}
            onSwitchToLogin={() => {
              setShowRegisterModal(false)
              setShowLoginModal(true)
            }}
          />
        )}

        {notification && (
          <Notification
            message={notification.message}
            type={notification.type}
            onClose={() => setNotification(null)}
          />
        )}
      </div>
    </div>
  )
}


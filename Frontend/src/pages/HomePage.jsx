import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import StatsCard from '../components/StatsCard'
import SearchSection from '../components/SearchSection'
import BooksGrid from '../components/BooksGrid'
import LoginModal from '../components/LoginModal'
import RegisterModal from '../components/RegisterModal'
import BookDetailsModal from '../components/BookDetailsModal'
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
  const [selectedBook, setSelectedBook] = useState(null)
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
      const response = await api.getBooks(token, filters)
      // Handle both old format (array) and new format (object with books property)
      const booksArray = Array.isArray(response) ? response : (response?.books || [])
      setBooks(booksArray)
      setSearchResults([])
      if (booksArray.length === 0 && user) {
        // Only show notification if user is logged in
        showNotification('No books found. Try adjusting your filters.', 'info')
      }
    } catch (error) {
      console.error('Error loading books:', error)
      // Don't show error notification on page load if user is not logged in
      if (user) {
        const errorMessage = error.message || 'Failed to load books. Please try again.'
        showNotification(errorMessage, 'error')
      }
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
      const response = await api.search(query, token)
      // Handle response format: { results: [] } or just array
      const allResults = Array.isArray(response) ? response : (response?.results || [])
      
      // Filter out negative matches - only show results with positive similarity/relevance
      const results = allResults.filter(result => {
        const similarity = result.similarity_score ?? result.relevance_percentage / 100
        const relevance = result.relevance_percentage ?? (result.similarity_score * 100)
        
        // Only include results with positive similarity score and relevance
        return (similarity > 0 && relevance > 0) || 
               (similarity !== undefined && similarity > 0) ||
               (relevance !== undefined && relevance > 0)
      })
      
      setSearchResults(results)
      setBooks([])
      if (results.length === 0) {
        if (allResults.length > 0) {
          showNotification('No relevant results found. Try a different search query.', 'info')
        } else {
          showNotification('No results found. Try a different search query.', 'info')
        }
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
    <div className="min-h-screen blob-bg p-2 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 md:space-y-8">
        <Navbar
          user={user}
          onLoginClick={() => setShowLoginModal(true)}
          onLogout={() => {
            localStorage.removeItem('bookgenie_token')
            window.location.reload()
          }}
          onAdminClick={() => navigate('/dashboard')}
        />

        {/* Hero Section - Search First */}
        <section className="space-y-4 sm:space-y-6">
          <div className="text-center space-y-2 sm:space-y-3 max-w-3xl mx-auto px-2 sm:px-4">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold text-gray-900 leading-tight">
              Discover Your Next
              <span className="text-gradient"> Academic Book</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-600">
              AI-powered search to find exactly what you need
            </p>
          </div>

        <SearchSection
          onSearch={handleSearch}
          onQuickSearch={handleQuickSearch}
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={clearFilters}
        />
        </section>

        {/* Stats Section */}
        <section>
          <StatsCard totalBooks={books.length} />
        </section>

        {/* Books Section */}
        <section>
        {isLoading && <LoadingIndicator />}

        {!isLoading && (
          <BooksGrid
            books={displayBooks}
            searchResults={searchResults}
            user={user}
            loading={isLoading}
            onViewBook={async (bookId) => {
              try {
                const token = localStorage.getItem('bookgenie_token')
                if (!token) {
                  showNotification('Please login to view book details', 'error')
                  return
                }
                const bookData = await api.getBook(bookId, token)
                setSelectedBook(bookData)
              } catch (error) {
                console.error('Error fetching book details:', error)
                // Fallback to using book from list if API fails
                const book = displayBooks.find(b => b.id === bookId)
                if (book) {
                  setSelectedBook(book)
                } else {
                  showNotification('Failed to load book details', 'error')
                }
              }
            }}
            onDownloadBook={async (bookId) => {
              if (!user) {
                showNotification('Please login to download books', 'error')
                return
              }
              try {
                const token = localStorage.getItem('bookgenie_token')
                if (!token) {
                  showNotification('Please login to download books', 'error')
                  return
                }
                const book = displayBooks.find(b => b.id === bookId) || selectedBook
                if (book && book.file_url) {
                  await api.downloadBook(book.file_url, token)
                  showNotification('Download started', 'success')
                } else {
                  showNotification('Book file not available', 'error')
                }
              } catch (error) {
                console.error('Download error:', error)
                showNotification(error.message || 'Failed to download book', 'error')
              }
            }}
          />
        )}
        </section>

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

        {selectedBook && (
          <BookDetailsModal
            book={selectedBook}
            user={user}
            onClose={() => setSelectedBook(null)}
            onDownload={async () => {
              if (!user) {
                showNotification('Please login to download books', 'error')
                return
              }
              try {
                const token = localStorage.getItem('bookgenie_token')
                if (!token) {
                  showNotification('Please login to download books', 'error')
                  return
                }
                if (selectedBook && selectedBook.file_url) {
                  await api.downloadBook(selectedBook.file_url, token)
                  
                  // Record reading session
                  try {
                    await api.recordReading(selectedBook.id, 5, token)
                    console.log('Reading session recorded for book:', selectedBook.id)
                  } catch (err) {
                    console.error('Error recording reading session:', err)
                  }
                  
                  // Record download interaction
                  try {
                    await api.recordInteraction(selectedBook.id, 'download', 1.0, token)
                    console.log('Download interaction recorded for book:', selectedBook.id)
                  } catch (err) {
                    console.error('Error recording interaction:', err)
                  }
                  
                  showNotification('Download started', 'success')
                } else {
                  showNotification('Book file not available', 'error')
                }
              } catch (error) {
                console.error('Download error:', error)
                showNotification(error.message || 'Failed to download book', 'error')
              }
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


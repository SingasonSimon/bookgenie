const API_BASE = 'http://localhost:5000/api'

export class BookGenieAPI {
  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
      mode: 'cors',
      credentials: 'include',
    }

    try {
      const response = await fetch(url, config)
      
      // Try to parse JSON response regardless of status
      let data
      try {
        data = await response.json()
      } catch (e) {
        // If JSON parsing fails, create a simple error object
        data = { error: `HTTP ${response.status}: ${response.statusText}` }
      }
      
      // If response is not ok, throw error with message from backend
      if (!response.ok) {
        const errorMessage = data.error || data.message || `HTTP ${response.status}`
        const error = new Error(errorMessage)
        error.status = response.status
        error.data = data
        throw error
      }

      return data
    } catch (error) {
      // If it's already our custom error, re-throw it
      if (error.status && error.data) {
        throw error
      }
      // Otherwise, it's a network error
      console.error('API request failed:', error)
      throw new Error(error.message || 'Network error. Please check if the backend is running.')
    }
  }

  async login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  }

  async register(formData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: formData.email,
        password: formData.password,
        first_name: formData.firstName,
        last_name: formData.lastName,
        academic_level: formData.academicLevel,
      }),
    })
  }

  async verifyAuth(token) {
    try {
      const data = await this.request('/auth/verify', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      return data.user || null
    } catch (error) {
      return null
    }
  }

  async getBooks(token, filters = {}) {
    const params = new URLSearchParams()
    if (filters.genre) params.append('genre', filters.genre)
    if (filters.academic_level) params.append('academic_level', filters.academic_level)
    if (filters.page) params.append('page', filters.page)
    if (filters.per_page) params.append('per_page', filters.per_page)

    try {
      const data = await this.request(`/books?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      // Handle both old format (array) and new format (object with books and pagination)
      if (Array.isArray(data)) {
        return { books: data, pagination: null }
      }
      return {
        books: data.books || [],
        pagination: data.pagination || null
      }
    } catch (error) {
      console.error('Failed to fetch books:', error)
      // Return empty array on error instead of throwing
      return { books: [], pagination: null }
    }
  }

  async search(query, token = null) {
    const headers = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const data = await this.request('/search', {
      method: 'POST',
      headers,
      body: JSON.stringify({ query, top_k: 10 }),
    })

    return data.results || []
  }

  async downloadBook(fileUrl, token) {
    try {
      const url = fileUrl.startsWith('http') ? fileUrl : `http://localhost:5000${fileUrl}`
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Download failed' }))
        throw new Error(error.error || 'Download failed')
      }

      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = fileUrl.split('/').pop() || 'book.pdf'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
      
      return { success: true }
    } catch (error) {
      console.error('Download error:', error)
      throw error
    }
  }

  async getBook(bookId, token) {
    try {
      const data = await this.request(`/books/${bookId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      return data
    } catch (error) {
      console.error('Failed to fetch book:', error)
      throw error
    }
  }

  async promoteToAdmin(email) {
    return this.request('/setup/promote-to-admin', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  }

  // Admin - Users
  async getUsers(token, filters = {}) {
    const params = new URLSearchParams()
    if (filters.page) params.append('page', filters.page)
    if (filters.per_page) params.append('per_page', filters.per_page)

    const data = await this.request(`/admin/users?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
    
    // Handle both old format (array) and new format (object with users and pagination)
    if (Array.isArray(data)) {
      return { users: data, pagination: null }
    }
    return {
      users: data.users || [],
      pagination: data.pagination || null
    }
  }

  async getUserDetails(userId, token) {
    return this.request(`/admin/users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
  }

  async updateUser(userId, data, token) {
    return this.request(`/admin/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    })
  }

  async deleteUser(userId, token) {
    return this.request(`/admin/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
  }

  async updateUserSubscription(userId, subscriptionLevel, token) {
    return this.request(`/admin/users/${userId}/subscription`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ subscription_level: subscriptionLevel }),
    })
  }

  async getUserTraffic(userId, token) {
    return this.request(`/admin/users/${userId}/traffic`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
  }

  // Admin - Books
  async createBook(data, token) {
    return this.request('/books', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    })
  }

  async updateBook(bookId, data, token) {
    return this.request(`/admin/books/${bookId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    })
  }

  async deleteBook(bookId, token) {
    return this.request(`/admin/books/${bookId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
  }

  async uploadBookFile(bookId, file, token) {
    const formData = new FormData()
    formData.append('file', file)
    
    return fetch(`${API_BASE}/books/${bookId}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    }).then(res => res.json())
  }

  async uploadBookCover(bookId, file, token) {
    const formData = new FormData()
    formData.append('file', file)
    
    return fetch(`${API_BASE}/books/${bookId}/upload-cover`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    }).then(res => res.json())
  }

  // Admin - Analytics
  async getAnalytics(token) {
    return this.request('/admin/analytics', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
  }

  // Admin - Subscription Requests
  async getSubscriptionRequests(token) {
    return this.request('/admin/subscription-requests', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
  }

  async approveSubscriptionRequest(requestId, token) {
    return this.request(`/admin/subscription-requests/${requestId}/approve`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
  }

  async rejectSubscriptionRequest(requestId, rejectionMessage, token) {
    return this.request(`/admin/subscription-requests/${requestId}/reject`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ rejection_message: rejectionMessage }),
    })
  }

  // Admin - Categories
  async createCategory(data, token) {
    return this.request('/admin/categories', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    })
  }

  async updateCategory(categoryId, data, token) {
    return this.request(`/admin/categories/${categoryId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    })
  }

  async deleteCategory(categoryId, token) {
    return this.request(`/admin/categories/${categoryId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
  }

  // Book Reviews
  async getBookReviews(bookId, token = null) {
    const headers = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    return this.request(`/books/${bookId}/reviews`, {
      headers,
    })
  }

  async createBookReview(bookId, rating, comment, token) {
    return this.request(`/books/${bookId}/reviews`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ rating, comment }),
    })
  }

  // Book Likes
  async getBookLikes(bookId, token = null) {
    const headers = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    return this.request(`/books/${bookId}/likes`, {
      headers,
    })
  }

  async likeBook(bookId, token) {
    return this.request(`/books/${bookId}/likes`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
  }

  async unlikeBook(bookId, token) {
    return this.request(`/books/${bookId}/likes`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
  }

  // Record reading session
  async recordReading(bookId, durationMinutes = 5, token) {
    return this.request(`/books/${bookId}/read`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ duration_minutes: durationMinutes }),
    })
  }

  // Record book interaction (view, download, etc.)
  async recordInteraction(bookId, type = 'view', value = 1.0, token) {
    return this.request(`/books/${bookId}/interact`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ type, value }),
    })
  }

  // Get books by category
  async getBooksByCategory(categoryName, token, page = 1, perPage = 12) {
    return this.request(`/categories/${encodeURIComponent(categoryName)}/books?page=${page}&per_page=${perPage}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
  }

  // Get search history
  async getSearchHistory(token, limit = 10) {
    return this.request(`/search/history?limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
  }

  // Profile Management
  async getProfile(token) {
    return this.request('/user/profile', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
  }

  async updateProfile(data, token) {
    return this.request('/user/profile', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
  }

  async uploadAvatar(file, token) {
    const formData = new FormData()
    formData.append('file', file)
    
    const url = `${API_BASE}/user/profile/avatar`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Don't set Content-Type for FormData, browser will set it with boundary
      },
      body: formData,
    })
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }))
      throw new Error(error.error || 'Upload failed')
    }
    
    return response.json()
  }

  async deleteAvatar(token) {
    return this.request('/user/profile/avatar', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
  }
}


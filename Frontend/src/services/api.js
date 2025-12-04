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

    try {
      const data = await this.request(`/books?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      // Ensure we return an array
      return Array.isArray(data) ? data : []
    } catch (error) {
      console.error('Failed to fetch books:', error)
      // Return empty array on error instead of throwing
      return []
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
}


// Enhanced JavaScript with backend integration
class BookGenieApp {
    constructor() {
        this.apiBase = 'http://localhost:5000/api';
        this.currentUser = null;
        this.currentBooks = [];
        this.init();
    }

    async init() {
        await this.checkAuth();
        this.setupEventListeners();
        await this.loadBooks();
        this.updateStats();
    }

    async checkAuth() {
        try {
            const response = await fetch(`${this.apiBase}/user`, {
                credentials: 'include'
            });
            const data = await response.json();
            
            if (data.user) {
                this.currentUser = data.user;
                this.updateAuthUI();
            }
        } catch (error) {
            console.log('Not authenticated');
        }
    }

    async login(email, password) {
        try {
            const response = await fetch(`${this.apiBase}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.currentUser = data.user;
                this.updateAuthUI();
                this.hideModal('loginModal');
                this.showNotification('Login successful!', 'success');
                return true;
            } else {
                this.showNotification(data.error, 'error');
                return false;
            }
        } catch (error) {
            this.showNotification('Login failed. Please check backend.', 'error');
            return false;
        }
    }

    async signup(email, password, academicLevel) {
        try {
            const response = await fetch(`${this.apiBase}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email, password, academic_level: academicLevel })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.currentUser = data.user;
                this.updateAuthUI();
                this.hideModal('loginModal');
                this.showNotification('Account created successfully!', 'success');
                return true;
            } else {
                this.showNotification(data.error, 'error');
                return false;
            }
        } catch (error) {
            this.showNotification('Signup failed. Please check backend.', 'error');
            return false;
        }
    }

    async logout() {
        try {
            await fetch(`${this.apiBase}/logout`, {
                method: 'POST',
                credentials: 'include'
            });
            
            this.currentUser = null;
            this.updateAuthUI();
            this.showNotification('Logged out successfully', 'success');
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    updateAuthUI() {
        const userGreeting = document.getElementById('userGreeting');
        const loginBtn = document.getElementById('loginBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        const adminBtn = document.getElementById('adminBtn');

        if (this.currentUser) {
            userGreeting.textContent = `Welcome, ${this.currentUser.email}`;
            loginBtn.style.display = 'none';
            logoutBtn.style.display = 'block';
            
            if (this.currentUser.role === 'admin') {
                adminBtn.style.display = 'block';
            }
        } else {
            userGreeting.textContent = 'Welcome, Guest';
            loginBtn.style.display = 'block';
            logoutBtn.style.display = 'none';
            adminBtn.style.display = 'none';
        }
    }

    async loadBooks(filters = {}) {
        try {
            const params = new URLSearchParams();
            if (filters.genre) params.append('genre', filters.genre);
            if (filters.academic_level) params.append('academic_level', filters.academic_level);

            const response = await fetch(`${this.apiBase}/books?${params}`);
            this.currentBooks = await response.json();
            this.displayBooks(this.currentBooks);
            this.updateStats();
        } catch (error) {
            console.error('Error loading books:', error);
            this.showNotification('Failed to load books. Check if backend is running.', 'error');
        }
    }

    async handleSearch(query) {
        if (!query.trim()) return;

        this.showLoading();

        try {
            const response = await fetch(`${this.apiBase}/search`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ query, top_k: 10 })
            });

            const data = await response.json();
            this.displaySearchResults(data.results, query);
        } catch (error) {
            console.error('Search error:', error);
            this.showNotification('Search failed. Check backend connection.', 'error');
        }
    }

    async submitFeedback(bookId, isHelpful, query = '') {
        if (!this.currentUser) {
            this.showNotification('Please login to provide feedback', 'error');
            return;
        }

        try {
            await fetch(`${this.apiBase}/feedback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ book_id: bookId, is_helpful: isHelpful, query })
            });

            this.showNotification('Feedback submitted!', 'success');
        } catch (error) {
            console.error('Feedback error:', error);
        }
    }

    // ... rest of your existing methods (displayBooks, createBookCard, etc.)
    // ... modal methods, UI helpers, etc.

    setupEventListeners() {
        // Auth events
        document.getElementById('loginBtn').addEventListener('click', () => {
            this.showModal('loginModal');
        });

        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });

        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            await this.login(email, password);
        });

        document.getElementById('signupForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('signupEmail').value;
            const password = document.getElementById('signupPassword').value;
            const academicLevel = document.getElementById('academicLevel').value;
            await this.signup(email, password, academicLevel);
        });

        // Search and filter events (from previous implementation)
        document.getElementById('searchForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const query = document.getElementById('searchInput').value;
            this.handleSearch(query);
        });

        // ... other event listeners
    }

    showNotification(message, type = 'info') {
        // Your existing notification implementation
        console.log(`${type}: ${message}`);
        alert(`${type.toUpperCase()}: ${message}`); // Simple fallback
    }
}

// Initialize app
const app = new BookGenieApp();
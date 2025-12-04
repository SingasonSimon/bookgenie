// BookGenie Frontend Application
class BookGenieApp {
    constructor() {
        this.apiBase = 'http://localhost:5000/api';
        this.token = localStorage.getItem('bookgenie_token');
        this.currentUser = null;
        this.currentBooks = [];
        this.searchResults = [];
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.checkAuth();
        await this.loadBooks();
        this.updateStats();
    }

    // Authentication
    async checkAuth() {
        if (!this.token) {
            this.updateAuthUI();
            return;
        }

        try {
            const response = await fetch(`${this.apiBase}/auth/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                mode: 'cors'
            });

            const data = await response.json();
            if (data.user) {
                this.currentUser = data.user;
                this.updateAuthUI();
            } else {
                localStorage.removeItem('bookgenie_token');
                this.token = null;
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            localStorage.removeItem('bookgenie_token');
            this.token = null;
            this.updateAuthUI();
        }
    }

    async login(email, password) {
        try {
            const response = await fetch(`${this.apiBase}/auth/login`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                mode: 'cors',
                credentials: 'omit',
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            
            if (data.success && data.token) {
                this.token = data.token;
                this.currentUser = data.user;
                localStorage.setItem('bookgenie_token', this.token);
                this.updateAuthUI();
                this.hideModal('loginModal');
                this.showNotification('Login successful!', 'success');
                await this.loadBooks();
                return true;
            } else {
                this.showNotification(data.error || 'Login failed', 'error');
                return false;
            }
        } catch (error) {
            console.error('Login error:', error);
            let errorMsg = 'Login failed. ';
            if (error.message.includes('Failed to fetch')) {
                errorMsg += 'Cannot connect to backend. Make sure backend is running on http://localhost:5000';
            } else {
                errorMsg += error.message;
            }
            this.showNotification(errorMsg, 'error');
            return false;
        }
    }

    async register(email, password, firstName, lastName, academicLevel) {
        try {
            const response = await fetch(`${this.apiBase}/auth/register`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                mode: 'cors',
                body: JSON.stringify({
                    email,
                    password,
                    first_name: firstName,
                    last_name: lastName,
                    academic_level: academicLevel
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Network error' }));
                throw new Error(errorData.error || `HTTP ${response.status}`);
            }

            const data = await response.json();
            
            if (data.success && data.token) {
                this.token = data.token;
                this.currentUser = data.user;
                localStorage.setItem('bookgenie_token', this.token);
                this.updateAuthUI();
                this.hideModal('registerModal');
                this.showNotification('Registration successful!', 'success');
                await this.loadBooks();
                return true;
            } else {
                this.showNotification(data.error || 'Registration failed', 'error');
                return false;
            }
        } catch (error) {
            console.error('Register error:', error);
            this.showNotification('Registration failed. Check if backend is running on port 5000.', 'error');
            return false;
        }
    }

    logout() {
        this.token = null;
        this.currentUser = null;
        localStorage.removeItem('bookgenie_token');
        this.updateAuthUI();
        this.showNotification('Logged out successfully', 'success');
        this.loadBooks();
    }

    updateAuthUI() {
        const userGreeting = document.getElementById('userGreeting');
        const loginBtn = document.getElementById('loginBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        const adminBtn = document.getElementById('adminBtn');

        if (this.currentUser) {
            const name = this.currentUser.firstName || this.currentUser.email;
            userGreeting.textContent = `Welcome, ${name}`;
            loginBtn.style.display = 'none';
            logoutBtn.style.display = 'inline-block';
            
            if (this.currentUser.role === 'admin') {
                adminBtn.style.display = 'inline-block';
            } else {
                adminBtn.style.display = 'none';
            }
        } else {
            userGreeting.textContent = 'Welcome, Guest';
            loginBtn.style.display = 'inline-block';
            logoutBtn.style.display = 'none';
            adminBtn.style.display = 'none';
        }
    }

    // Books Loading
    async loadBooks(filters = {}) {
        if (!this.token) {
            this.showNotification('Please login to view books', 'info');
            return;
        }

        try {
            const params = new URLSearchParams();
            if (filters.genre) params.append('genre', filters.genre);
            if (filters.academic_level) params.append('academic_level', filters.academic_level);

            const response = await fetch(`${this.apiBase}/books?${params}`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Accept': 'application/json'
                },
                mode: 'cors'
            });

            if (response.ok) {
                this.currentBooks = await response.json();
                this.displayBooks(this.currentBooks);
                this.updateStats();
            } else {
                throw new Error('Failed to load books');
            }
        } catch (error) {
            console.error('Error loading books:', error);
            this.showNotification('Failed to load books. Please login first.', 'error');
        }
    }

    // Search
    async handleSearch(query) {
        if (!query.trim()) {
            this.showNotification('Please enter a search query', 'info');
            return;
        }

        this.showLoading();

        try {
            const headers = {
                'Content-Type': 'application/json'
            };
            if (this.token) {
                headers['Authorization'] = `Bearer ${this.token}`;
            }

            const headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            };
            if (this.token) {
                headers['Authorization'] = `Bearer ${this.token}`;
            }

            const response = await fetch(`${this.apiBase}/search`, {
                method: 'POST',
                headers: headers,
                mode: 'cors',
                body: JSON.stringify({ query, top_k: 10 })
            });

            const data = await response.json();
            
            if (data.results && data.results.length > 0) {
                this.searchResults = data.results;
                this.displaySearchResults(data.results, query);
            } else {
                this.showNotification('No results found', 'info');
                this.hideLoading();
            }
        } catch (error) {
            console.error('Search error:', error);
            this.showNotification('Search failed. Check backend connection.', 'error');
            this.hideLoading();
        }
    }

    // Display Functions
    displayBooks(books) {
        const grid = document.getElementById('booksGrid');
        grid.innerHTML = '';

        if (!books || books.length === 0) {
            grid.innerHTML = '<p class="no-results">No books available. Please login to view books.</p>';
            return;
        }

        books.forEach(book => {
            const card = this.createBookCard(book);
            grid.appendChild(card);
        });
    }

    displaySearchResults(results, query) {
        const grid = document.getElementById('booksGrid');
        grid.innerHTML = '';

        if (!results || results.length === 0) {
            grid.innerHTML = '<p class="no-results">No results found for your query.</p>';
            this.hideLoading();
            return;
        }

        results.forEach((result, index) => {
            const book = result.book || result;
            const card = this.createBookCard(book, result.relevance_percentage || result.similarity_score);
            grid.appendChild(card);
        });

        this.hideLoading();
    }

    createBookCard(book, relevance = null) {
        const card = document.createElement('div');
        card.className = 'book-card';
        
        const coverImage = book.cover_image && book.cover_image.startsWith('/api/files/') 
            ? `http://localhost:5000${book.cover_image}` 
            : '📚';

        card.innerHTML = `
            <div class="book-header">
                <div class="book-cover">${coverImage}</div>
                <div class="book-info">
                    <h3 class="book-title">${this.escapeHtml(book.title)}</h3>
                    <p class="book-author">by ${this.escapeHtml(book.author)}</p>
                    <div class="book-badges">
                        ${book.genre ? `<span class="badge genre">${this.escapeHtml(book.genre)}</span>` : ''}
                        ${book.academic_level ? `<span class="badge level">${this.escapeHtml(book.academic_level)}</span>` : ''}
                        ${relevance ? `<span class="badge relevance">${relevance.toFixed(1)}% match</span>` : ''}
                    </div>
                </div>
            </div>
            ${book.abstract ? `<p class="book-abstract">${this.escapeHtml(book.abstract.substring(0, 150))}...</p>` : ''}
            ${book.tags && book.tags.length > 0 ? `
                <div class="book-tags">
                    ${book.tags.slice(0, 3).map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('')}
                </div>
            ` : ''}
            <div class="book-actions">
                ${this.token ? `
                    <button class="btn-primary" onclick="app.viewBook(${book.id})">View Details</button>
                    ${book.file_url ? `<button class="btn-secondary" onclick="app.downloadBook(${book.id})">Download</button>` : ''}
                ` : '<p class="login-prompt">Login to access books</p>'}
            </div>
        `;

        return card;
    }

    // Book Actions
    async viewBook(bookId) {
        if (!this.token) {
            this.showNotification('Please login to view book details', 'error');
            return;
        }

        const book = [...this.currentBooks, ...this.searchResults.map(r => r.book || r)].find(b => b.id === bookId);
        if (!book) return;

        alert(`Book: ${book.title}\nAuthor: ${book.author}\n\n${book.abstract || 'No abstract available'}`);
    }

    async downloadBook(bookId) {
        if (!this.token) {
            this.showNotification('Please login to download books', 'error');
            return;
        }

        try {
            const book = [...this.currentBooks, ...this.searchResults.map(r => r.book || r)].find(b => b.id === bookId);
            if (!book || !book.file_url) {
                this.showNotification('Book file not available', 'error');
                return;
            }

            const url = `http://localhost:5000${book.file_url}`;
            window.open(url, '_blank');
        } catch (error) {
            console.error('Download error:', error);
            this.showNotification('Download failed', 'error');
        }
    }

    // UI Helpers
    updateStats() {
        const totalBooks = document.getElementById('totalBooks');
        totalBooks.textContent = this.currentBooks.length || 0;
    }

    showLoading() {
        document.getElementById('loadingIndicator').style.display = 'flex';
    }

    hideLoading() {
        document.getElementById('loadingIndicator').style.display = 'none';
    }

    showModal(modalId) {
        document.getElementById(modalId).style.display = 'block';
    }

    hideModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }

    showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        notification.textContent = message;
        notification.className = `notification ${type} show`;
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Event Listeners Setup
    setupEventListeners() {
        // Auth buttons
        document.getElementById('loginBtn').addEventListener('click', () => {
            this.showModal('loginModal');
        });

        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });

        document.getElementById('adminBtn').addEventListener('click', () => {
            window.location.href = 'dashboard.html';
        });

        // Login form
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            await this.login(email, password);
        });

        // Register form
        document.getElementById('registerForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;
            const firstName = document.getElementById('registerFirstName').value;
            const lastName = document.getElementById('registerLastName').value;
            const academicLevel = document.getElementById('registerAcademicLevel').value;
            await this.register(email, password, firstName, lastName, academicLevel);
        });

        // Modal switches
        document.getElementById('showRegister').addEventListener('click', (e) => {
            e.preventDefault();
            this.hideModal('loginModal');
            this.showModal('registerModal');
        });

        document.getElementById('showLogin').addEventListener('click', (e) => {
            e.preventDefault();
            this.hideModal('registerModal');
            this.showModal('loginModal');
        });

        // Modal close buttons
        document.querySelectorAll('.close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                modal.style.display = 'none';
            });
        });

        // Close modal on outside click
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });

        // Search form
        document.getElementById('searchForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const query = document.getElementById('searchInput').value;
            this.handleSearch(query);
        });

        // Quick search buttons
        document.querySelectorAll('.quick-search').forEach(btn => {
            btn.addEventListener('click', () => {
                const query = btn.getAttribute('data-query');
                document.getElementById('searchInput').value = query;
                this.handleSearch(query);
            });
        });

        // Filters
        document.getElementById('filterGenre').addEventListener('change', () => {
            this.applyFilters();
        });

        document.getElementById('filterLevel').addEventListener('change', () => {
            this.applyFilters();
        });

        document.getElementById('clearFilters').addEventListener('click', () => {
            document.getElementById('filterGenre').value = '';
            document.getElementById('filterLevel').value = '';
            this.loadBooks();
        });
    }

    applyFilters() {
        const genre = document.getElementById('filterGenre').value;
        const level = document.getElementById('filterLevel').value;
        this.loadBooks({ genre, academic_level: level });
    }
}

// Initialize app
const app = new BookGenieApp();

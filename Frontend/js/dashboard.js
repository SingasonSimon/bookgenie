/**
 * BookGenie Dashboard JavaScript
 * Complete admin and user dashboard functionality
 */

const API_BASE = 'http://localhost:5000/api';
let currentUser = null;
let currentTab = 'dashboard';
let editingUserId = null;
let editingBookId = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();
    await loadDashboard();
    setupEventListeners();
});

// Authentication
async function checkAuth() {
    const token = localStorage.getItem('bookgenie_token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/auth/verify`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        if (data.success) {
            currentUser = data.user;
            updateUI();
        } else {
            localStorage.removeItem('bookgenie_token');
            localStorage.removeItem('bookgenie_user');
            window.location.href = 'login.html';
        }
    } catch (error) {
        console.error('Auth error:', error);
        showMessage('Authentication failed. Please login again.', 'error');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
    }
}

function updateUI() {
    if (!currentUser) return;

    // Update user info
    document.getElementById('userName').textContent = 
        `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || currentUser.email;
    document.getElementById('profileName').textContent = 
        `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || currentUser.email;
    document.getElementById('profileEmail').textContent = currentUser.email;
    document.getElementById('profileRole').textContent = currentUser.role === 'admin' ? 'Administrator' : 'Student';
    document.getElementById('profileSubscription').textContent = 
        currentUser.subscriptionLevel ? currentUser.subscriptionLevel.charAt(0).toUpperCase() + currentUser.subscriptionLevel.slice(1) : 'Free';
    document.getElementById('profileDepartment').textContent = currentUser.department || 'N/A';
    
    // Show admin tabs if admin
    if (currentUser.role === 'admin') {
        document.getElementById('adminNav').style.display = 'flex';
        document.getElementById('usersTabBtn').style.display = 'inline-block';
        document.getElementById('analyticsTabBtn').style.display = 'inline-block';
        document.getElementById('booksTabBtn').style.display = 'inline-block';
    } else {
        document.getElementById('subscriptionTab').style.display = 'inline-block';
        document.getElementById('subscriptionTabBtn').style.display = 'inline-block';
    }
}

// Tab switching
function switchTab(tabName) {
    currentTab = tabName;
    
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    document.querySelectorAll('.tab').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    const tabElement = document.getElementById(`${tabName}Tab`);
    if (tabElement) {
        tabElement.classList.add('active');
    }
    
    // Update nav
    const navLink = Array.from(document.querySelectorAll('.nav-link')).find(
        link => link.textContent.trim().toLowerCase().includes(tabName.toLowerCase())
    );
    if (navLink) navLink.classList.add('active');
    
    const tabBtn = Array.from(document.querySelectorAll('.tab')).find(
        btn => btn.textContent.trim().toLowerCase().includes(tabName.toLowerCase())
    );
    if (tabBtn) tabBtn.classList.add('active');
    
    // Load tab content
    switch(tabName) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'users':
            if (currentUser.role === 'admin') loadUsers();
            break;
        case 'analytics':
            if (currentUser.role === 'admin') loadAnalytics();
            break;
        case 'books':
            if (currentUser.role === 'admin') loadAdminBooks();
            break;
        case 'subscription':
            loadSubscription();
            break;
        case 'search':
            loadSearch();
            break;
        case 'categories':
            loadCategories();
            break;
    }
}

// Dashboard loading
async function loadDashboard() {
    try {
        const response = await fetch(`${API_BASE}/student/dashboard`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('bookgenie_token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) throw new Error('Failed to load dashboard');

        const data = await response.json();
        displayDashboard(data);
    } catch (error) {
        console.error('Dashboard error:', error);
        showMessage('Failed to load dashboard', 'error');
    }
}

function displayDashboard(data) {
    const statsGrid = document.getElementById('userStats');
    if (!statsGrid) return;

    statsGrid.innerHTML = `
        <div class="stat-card">
            <div class="stat-icon">📚</div>
            <div class="stat-info">
                <div class="stat-value">${data.stats.books_read || 0}</div>
                <div class="stat-label">Books Read</div>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">🔍</div>
            <div class="stat-info">
                <div class="stat-value">${data.stats.total_searches || 0}</div>
                <div class="stat-label">Total Searches</div>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">📖</div>
            <div class="stat-info">
                <div class="stat-value">${data.stats.total_reading || 0}</div>
                <div class="stat-label">Reading Sessions</div>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">⭐</div>
            <div class="stat-info">
                <div class="stat-value">${data.stats.subscription_level ? data.stats.subscription_level.charAt(0).toUpperCase() + data.stats.subscription_level.slice(1) : 'Free'}</div>
                <div class="stat-label">Subscription</div>
            </div>
        </div>
    `;

    // Display recommended books
    const recommendedSection = document.getElementById('recommendedBooksSection');
    if (recommendedSection && data.recommended_books && data.recommended_books.length > 0) {
        recommendedSection.innerHTML = `
            <h3 style="margin-top: 2rem; margin-bottom: 1rem;">Recommended for You</h3>
            <div class="results-grid">
                ${data.recommended_books.map(book => createBookCard(book.book || book)).join('')}
            </div>
        `;
    }
}

// User Management (Admin)
async function loadUsers() {
    try {
        const response = await fetch(`${API_BASE}/admin/users`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('bookgenie_token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) throw new Error('Failed to load users');

        const users = await response.json();
        displayUsers(users);
    } catch (error) {
        console.error('Users error:', error);
        showMessage('Failed to load users', 'error');
    }
}

function displayUsers(users) {
    const usersGrid = document.getElementById('usersGrid');
    const totalUsersCount = document.getElementById('totalUsersCount');
    
    if (totalUsersCount) {
        totalUsersCount.textContent = `${users.length} Users`;
    }

    if (!usersGrid) return;

    if (users.length === 0) {
        usersGrid.innerHTML = '<p>No users found.</p>';
        return;
    }

    usersGrid.innerHTML = users.map(user => `
        <div class="user-card">
            <div class="user-header">
                <div class="user-avatar">${user.firstName ? user.firstName.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}</div>
                <div class="user-info">
                    <h4>${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email}</h4>
                    <p>${user.email}</p>
                </div>
            </div>
            <div class="user-stats">
                <span class="badge">${user.role}</span>
                <span class="badge">${user.subscriptionLevel || 'free'}</span>
            </div>
            <div class="user-actions">
                <button class="btn btn-sm" onclick="viewUserProfile(${user.id})">View</button>
                <button class="btn btn-sm" onclick="editUser(${user.id})">Edit</button>
                <button class="btn btn-sm" onclick="viewUserTraffic(${user.id})">Traffic</button>
            </div>
        </div>
    `).join('');
}

async function viewUserProfile(userId) {
    try {
        const response = await fetch(`${API_BASE}/admin/users/${userId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('bookgenie_token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) throw new Error('Failed to load user');

        const user = await response.json();
        displayUserProfileModal(user);
    } catch (error) {
        console.error('User profile error:', error);
        showMessage('Failed to load user profile', 'error');
    }
}

function displayUserProfileModal(user) {
    const modal = document.getElementById('userProfileModal');
    const content = document.getElementById('userProfileContent');
    
    if (!modal || !content) return;

    content.innerHTML = `
        <div class="user-profile-details">
            <div class="profile-section">
                <h4>Personal Information</h4>
                <div class="detail-row">
                    <span class="label">Name:</span>
                    <span class="value">${user.firstName || ''} ${user.lastName || ''}`.trim() || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Email:</span>
                    <span class="value">${user.email}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Role:</span>
                    <span class="value">${user.role}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Department:</span>
                    <span class="value">${user.department || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Academic Level:</span>
                    <span class="value">${user.academicLevel || 'N/A'}</span>
                </div>
            </div>
            <div class="profile-section">
                <h4>Statistics</h4>
                <div class="detail-row">
                    <span class="label">Searches:</span>
                    <span class="value">${user.stats?.searchCount || 0}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Reading Sessions:</span>
                    <span class="value">${user.stats?.readingCount || 0}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Books Read:</span>
                    <span class="value">${user.stats?.booksRead || 0}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Total Reading Time:</span>
                    <span class="value">${user.stats?.totalReadingMinutes || 0} minutes</span>
                </div>
            </div>
            ${user.readingHistory && user.readingHistory.length > 0 ? `
            <div class="profile-section">
                <h4>Recent Reading History</h4>
                <div class="reading-history">
                    ${user.readingHistory.map(item => `
                        <div class="history-item">
                            <strong>${item.title}</strong> by ${item.author}
                            <span class="history-meta">${item.duration} min - ${new Date(item.date).toLocaleDateString()}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}
        </div>
    `;

    modal.style.display = 'block';
}

function closeUserProfile() {
    document.getElementById('userProfileModal').style.display = 'none';
}

async function viewUserTraffic(userId) {
    try {
        const response = await fetch(`${API_BASE}/admin/users/${userId}/traffic`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('bookgenie_token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) throw new Error('Failed to load traffic');

        const traffic = await response.json();
        displayUserTrafficModal(traffic);
    } catch (error) {
        console.error('Traffic error:', error);
        showMessage('Failed to load user traffic', 'error');
    }
}

function displayUserTrafficModal(traffic) {
    const modal = document.getElementById('userTrafficModal');
    const content = document.getElementById('userTrafficContent');
    
    if (!modal || !content) return;

    content.innerHTML = `
        <div class="traffic-analytics">
            <div class="traffic-section">
                <h4>Popular Searches</h4>
                <ul class="traffic-list">
                    ${traffic.popular_searches && traffic.popular_searches.length > 0 ? 
                        traffic.popular_searches.map(item => `
                            <li><strong>${item.query}</strong> - ${item.count} times</li>
                        `).join('') : 
                        '<li>No searches yet</li>'
                    }
                </ul>
            </div>
            <div class="traffic-section">
                <h4>Popular Books</h4>
                <ul class="traffic-list">
                    ${traffic.popular_books && traffic.popular_books.length > 0 ? 
                        traffic.popular_books.map(item => `
                            <li><strong>${item.title}</strong> - Read ${item.read_count} times</li>
                        `).join('') : 
                        '<li>No reading history yet</li>'
                    }
                </ul>
            </div>
            <div class="traffic-section">
                <h4>Traffic Data (Last 30 Days)</h4>
                <div class="traffic-chart">
                    ${traffic.traffic_data && traffic.traffic_data.length > 0 ? 
                        traffic.traffic_data.map(item => `
                            <div class="traffic-bar">
                                <div class="traffic-date">${new Date(item.date).toLocaleDateString()}</div>
                                <div class="traffic-metrics">
                                    <span>Searches: ${item.searches}</span>
                                    <span>Readings: ${item.readings}</span>
                                </div>
                            </div>
                        `).join('') : 
                        '<p>No traffic data available</p>'
                    }
                </div>
            </div>
        </div>
    `;

    modal.style.display = 'block';
}

function closeUserTraffic() {
    document.getElementById('userTrafficModal').style.display = 'none';
}

async function editUser(userId) {
    editingUserId = userId;
    try {
        const response = await fetch(`${API_BASE}/admin/users/${userId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('bookgenie_token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) throw new Error('Failed to load user');

        const user = await response.json();
        
        // Populate form
        document.getElementById('editFirstName').value = user.firstName || '';
        document.getElementById('editLastName').value = user.lastName || '';
        document.getElementById('editEmail').value = user.email || '';
        document.getElementById('editAcademicLevel').value = user.academicLevel || '';
        document.getElementById('editDepartment').value = user.department || '';
        document.getElementById('editRole').value = user.role || 'student';
        document.getElementById('editSubscriptionLevel').value = user.subscriptionLevel || 'free';
        
        document.getElementById('editUserModal').style.display = 'block';
    } catch (error) {
        console.error('Edit user error:', error);
        showMessage('Failed to load user for editing', 'error');
    }
}

function closeEditUserModal() {
    document.getElementById('editUserModal').style.display = 'none';
    editingUserId = null;
}

async function updateUser(event) {
    event.preventDefault();
    if (!editingUserId) return;

    const formData = {
        firstName: document.getElementById('editFirstName').value,
        lastName: document.getElementById('editLastName').value,
        email: document.getElementById('editEmail').value,
        academicLevel: document.getElementById('editAcademicLevel').value,
        department: document.getElementById('editDepartment').value,
        role: document.getElementById('editRole').value,
        subscriptionLevel: document.getElementById('editSubscriptionLevel').value
    };

    try {
        const response = await fetch(`${API_BASE}/admin/users/${editingUserId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('bookgenie_token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) throw new Error('Failed to update user');

        const data = await response.json();
        showMessage('User updated successfully', 'success');
        closeEditUserModal();
        loadUsers();
    } catch (error) {
        console.error('Update user error:', error);
        showMessage('Failed to update user', 'error');
    }
}

// Analytics (Admin)
async function loadAnalytics() {
    try {
        const response = await fetch(`${API_BASE}/admin/analytics`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('bookgenie_token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) throw new Error('Failed to load analytics');

        const analytics = await response.json();
        displayAnalytics(analytics);
    } catch (error) {
        console.error('Analytics error:', error);
        showMessage('Failed to load analytics', 'error');
    }
}

function displayAnalytics(analytics) {
    const content = document.getElementById('analyticsContent');
    if (!content) return;

    content.innerHTML = `
        <div class="analytics-grid">
            <div class="analytics-card">
                <h3>Daily Statistics</h3>
                <div class="stat-item">
                    <span class="stat-label">New Users:</span>
                    <span class="stat-value">${analytics.dailyStats?.newUsers || 0}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Searches:</span>
                    <span class="stat-value">${analytics.dailyStats?.searches || 0}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Reading Sessions:</span>
                    <span class="stat-value">${analytics.dailyStats?.readingSessions || 0}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Pending Requests:</span>
                    <span class="stat-value">${analytics.dailyStats?.pendingRequests || 0}</span>
                </div>
            </div>
            <div class="analytics-card">
                <h3>Subscription Distribution</h3>
                <div class="subscription-stats">
                    ${Object.entries(analytics.subscriptionStats || {}).map(([level, count]) => `
                        <div class="subscription-stat">
                            <span class="subscription-level">${level.charAt(0).toUpperCase() + level.slice(1)}</span>
                            <span class="subscription-count">${count} users</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="analytics-card">
                <h3>Popular Searches (Last 7 Days)</h3>
                <ul class="popular-list">
                    ${analytics.popularSearches && analytics.popularSearches.length > 0 ? 
                        analytics.popularSearches.map(item => `
                            <li><strong>${item.query}</strong> - ${item.count} searches</li>
                        `).join('') : 
                        '<li>No searches yet</li>'
                    }
                </ul>
            </div>
            <div class="analytics-card">
                <h3>Active Users (This Week)</h3>
                <ul class="active-users-list">
                    ${analytics.activeUsers && analytics.activeUsers.length > 0 ? 
                        analytics.activeUsers.map(user => `
                            <li>
                                <strong>${user.name || user.email}</strong>
                                <span class="user-activity">${user.searchCount || 0} searches, ${user.readingCount || 0} readings</span>
                            </li>
                        `).join('') : 
                        '<li>No active users this week</li>'
                    }
                </ul>
            </div>
        </div>
    `;
}

// Book Management (Admin)
let allAdminBooks = [];

async function loadAdminBooks() {
    try {
        const response = await fetch(`${API_BASE}/books`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('bookgenie_token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) throw new Error('Failed to load books');

        const books = await response.json();
        allAdminBooks = books;
        displayAdminBooks(books);
    } catch (error) {
        console.error('Books error:', error);
        showMessage('Failed to load books', 'error');
    }
}

function displayAdminBooks(books) {
    const booksGrid = document.getElementById('booksGrid');
    if (!booksGrid) return;

    if (books.length === 0) {
        booksGrid.innerHTML = '<p>No books found. Add your first book!</p>';
        return;
    }

    booksGrid.innerHTML = books.map(book => `
        <div class="book-card-admin" data-book-id="${book.id}">
            <div class="book-cover-admin">${book.cover_image || '📚'}</div>
            <div class="book-info-admin">
                <h4>${book.title}</h4>
                <p class="book-author">${book.author}</p>
                <p class="book-abstract-admin">${book.abstract ? (book.abstract.substring(0, 100) + '...') : 'No abstract'}</p>
                <div class="book-meta">
                    <span class="badge">${book.genre}</span>
                    <span class="badge">${book.subscription_level || 'free'}</span>
                    <span class="badge">${book.academic_level}</span>
                    ${book.pages ? `<span class="badge">${book.pages} pages</span>` : ''}
                </div>
                ${book.file_url ? `<div style="margin-top: 0.5rem; font-size: 0.85rem; color: var(--success);">✓ File uploaded</div>` : '<div style="margin-top: 0.5rem; font-size: 0.85rem; color: var(--warning);">⚠ No file</div>'}
            </div>
            <div class="book-actions-admin">
                <button class="btn btn-sm" onclick="editBook(${book.id})">Edit</button>
                <button class="btn btn-sm" onclick="uploadBookFile(${book.id})">Upload File</button>
                <button class="btn btn-sm" onclick="uploadBookCover(${book.id})">Upload Cover</button>
                <button class="btn btn-sm btn-danger" onclick="deleteBook(${book.id})">Delete</button>
            </div>
        </div>
    `).join('');
}

function filterAdminBooks() {
    const searchTerm = document.getElementById('bookSearchInput')?.value.toLowerCase() || '';
    if (!searchTerm) {
        displayAdminBooks(allAdminBooks);
        return;
    }

    const filtered = allAdminBooks.filter(book => 
        book.title.toLowerCase().includes(searchTerm) ||
        book.author.toLowerCase().includes(searchTerm) ||
        (book.abstract && book.abstract.toLowerCase().includes(searchTerm)) ||
        (book.genre && book.genre.toLowerCase().includes(searchTerm)) ||
        (book.tags && Array.isArray(book.tags) && book.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
    );
    
    displayAdminBooks(filtered);
}

function showAddBookModal() {
    document.getElementById('addBookModal').style.display = 'block';
}

function closeAddBookModal() {
    document.getElementById('addBookModal').style.display = 'none';
    document.getElementById('addBookForm').reset();
}

async function addNewBook(event) {
    event.preventDefault();

    const formData = {
        title: document.getElementById('bookTitle').value,
        author: document.getElementById('bookAuthor').value,
        abstract: document.getElementById('bookAbstract').value,
        genre: document.getElementById('bookGenre').value,
        academic_level: document.getElementById('bookAcademicLevel').value,
        subscription_level: document.getElementById('bookSubscriptionLevel').value,
        pages: parseInt(document.getElementById('bookPages').value) || 0,
        tags: document.getElementById('bookTags').value.split(',').map(t => t.trim()).filter(t => t)
    };

    try {
        const response = await fetch(`${API_BASE}/books`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('bookgenie_token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to add book');
        }

        const data = await response.json();
        showMessage('Book added successfully!', 'success');
        closeAddBookModal();
        loadAdminBooks();
    } catch (error) {
        console.error('Add book error:', error);
        showMessage(error.message || 'Failed to add book', 'error');
    }
}

async function editBook(bookId) {
    editingBookId = bookId;
    try {
        const response = await fetch(`${API_BASE}/books`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('bookgenie_token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) throw new Error('Failed to load books');

        const books = await response.json();
        const book = books.find(b => b.id === bookId);
        
        if (!book) {
            showMessage('Book not found', 'error');
            return;
        }

        // Populate edit form
        document.getElementById('editBookId').value = book.id;
        document.getElementById('editBookTitle').value = book.title;
        document.getElementById('editBookAuthor').value = book.author;
        document.getElementById('editBookAbstract').value = book.abstract || '';
        document.getElementById('editBookGenre').value = book.genre || '';
        document.getElementById('editBookAcademicLevel').value = book.academic_level || '';
        document.getElementById('editBookSubscriptionLevel').value = book.subscription_level || 'free';
        document.getElementById('editBookPages').value = book.pages || 0;
        document.getElementById('editBookTags').value = Array.isArray(book.tags) ? book.tags.join(', ') : (book.tags || '');
        
        document.getElementById('editBookModal').style.display = 'block';
    } catch (error) {
        console.error('Edit book error:', error);
        showMessage('Failed to load book for editing', 'error');
    }
}

function closeEditBookModal() {
    document.getElementById('editBookModal').style.display = 'none';
    editingBookId = null;
}

async function updateBook(event) {
    event.preventDefault();
    if (!editingBookId) return;

    const formData = {
        title: document.getElementById('editBookTitle').value,
        author: document.getElementById('editBookAuthor').value,
        abstract: document.getElementById('editBookAbstract').value,
        genre: document.getElementById('editBookGenre').value,
        academic_level: document.getElementById('editBookAcademicLevel').value,
        subscription_level: document.getElementById('editBookSubscriptionLevel').value,
        pages: parseInt(document.getElementById('editBookPages').value) || 0,
        tags: document.getElementById('editBookTags').value.split(',').map(t => t.trim()).filter(t => t)
    };

    try {
        const response = await fetch(`${API_BASE}/admin/books/${editingBookId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('bookgenie_token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update book');
        }

        showMessage('Book updated successfully!', 'success');
        closeEditBookModal();
        loadAdminBooks();
    } catch (error) {
        console.error('Update book error:', error);
        showMessage(error.message || 'Failed to update book', 'error');
    }
}

async function deleteBook(bookId) {
    if (!confirm('Are you sure you want to delete this book? This action cannot be undone.')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/admin/books/${bookId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('bookgenie_token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete book');
        }

        showMessage('Book deleted successfully!', 'success');
        loadAdminBooks();
    } catch (error) {
        console.error('Delete book error:', error);
        showMessage(error.message || 'Failed to delete book', 'error');
    }
}

async function uploadBookFile(bookId) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.epub,.txt,.doc,.docx';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(`${API_BASE}/books/${bookId}/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('bookgenie_token')}`
                },
                body: formData
            });

            if (!response.ok) throw new Error('Failed to upload file');

            const data = await response.json();
            showMessage('File uploaded successfully!', 'success');
            loadAdminBooks();
        } catch (error) {
            console.error('Upload error:', error);
            showMessage('Failed to upload file', 'error');
        }
    };
    input.click();
}

async function uploadBookCover(bookId) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(`${API_BASE}/books/${bookId}/upload-cover`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('bookgenie_token')}`
                },
                body: formData
            });

            if (!response.ok) throw new Error('Failed to upload cover');

            const data = await response.json();
            showMessage('Cover uploaded successfully!', 'success');
            loadAdminBooks();
        } catch (error) {
            console.error('Upload error:', error);
            showMessage('Failed to upload cover', 'error');
        }
    };
    input.click();
}

// Subscription Management
async function loadSubscription() {
    try {
        const response = await fetch(`${API_BASE}/user/subscription`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('bookgenie_token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) throw new Error('Failed to load subscription');

        const data = await response.json();
        displaySubscription(data);
    } catch (error) {
        console.error('Subscription error:', error);
        showMessage('Failed to load subscription info', 'error');
    }
}

function displaySubscription(data) {
    const badge = document.getElementById('currentSubscriptionBadge');
    if (badge) {
        badge.textContent = data.subscriptionLevel ? 
            data.subscriptionLevel.charAt(0).toUpperCase() + data.subscriptionLevel.slice(1) : 'Free';
    }

    const plansContainer = document.getElementById('subscriptionPlansContainer');
    if (plansContainer) {
        plansContainer.innerHTML = `
            <div class="subscription-plan">
                <h3>Free</h3>
                <div class="plan-price">$0/month</div>
                <ul class="plan-features">
                    <li>Access to free books</li>
                    <li>Basic search</li>
                    <li>Reading history</li>
                </ul>
                <button class="btn ${data.subscriptionLevel === 'free' ? 'btn-disabled' : ''}" 
                        ${data.subscriptionLevel === 'free' ? 'disabled' : ''}
                        onclick="requestSubscription('free')">Current Plan</button>
            </div>
            <div class="subscription-plan">
                <h3>Basic</h3>
                <div class="plan-price">$9.99/month</div>
                <ul class="plan-features">
                    <li>Everything in Free</li>
                    <li>Access to basic books</li>
                    <li>Advanced search</li>
                    <li>Priority support</li>
                </ul>
                <button class="btn ${data.subscriptionLevel === 'basic' ? 'btn-disabled' : ''}" 
                        ${data.subscriptionLevel === 'basic' ? 'disabled' : ''}
                        onclick="requestSubscription('basic')">${data.subscriptionLevel === 'basic' ? 'Current Plan' : 'Upgrade'}</button>
            </div>
            <div class="subscription-plan featured">
                <h3>Premium</h3>
                <div class="plan-price">$19.99/month</div>
                <ul class="plan-features">
                    <li>Everything in Basic</li>
                    <li>Access to all books</li>
                    <li>Premium recommendations</li>
                    <li>24/7 support</li>
                </ul>
                <button class="btn btn-primary ${data.subscriptionLevel === 'premium' ? 'btn-disabled' : ''}" 
                        ${data.subscriptionLevel === 'premium' ? 'disabled' : ''}
                        onclick="requestSubscription('premium')">${data.subscriptionLevel === 'premium' ? 'Current Plan' : 'Upgrade'}</button>
            </div>
        `;
    }

    const historyContainer = document.getElementById('subscriptionHistory');
    if (historyContainer && data.requestHistory) {
        historyContainer.innerHTML = data.requestHistory.length > 0 ? 
            data.requestHistory.map(req => `
                <div class="subscription-history-item">
                    <div class="history-info">
                        <strong>${req.requestedLevel}</strong> (from ${req.currentLevel})
                        <span class="history-status ${req.status}">${req.status}</span>
                    </div>
                    <div class="history-date">${new Date(req.createdAt).toLocaleDateString()}</div>
                </div>
            `).join('') : 
            '<p>No subscription history</p>';
    }
}

async function requestSubscription(level) {
    try {
        const response = await fetch(`${API_BASE}/user/subscription/request`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('bookgenie_token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ subscription_level: level })
        });

        if (!response.ok) throw new Error('Failed to request subscription');

        const data = await response.json();
        showMessage('Subscription upgrade requested successfully!', 'success');
        loadSubscription();
    } catch (error) {
        console.error('Subscription request error:', error);
        showMessage('Failed to request subscription upgrade', 'error');
    }
}

// Subscription Requests (Admin)
async function loadSubscriptionRequests() {
    try {
        const response = await fetch(`${API_BASE}/admin/subscription-requests`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('bookgenie_token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) throw new Error('Failed to load requests');

        const requests = await response.json();
        displaySubscriptionRequests(requests);
    } catch (error) {
        console.error('Subscription requests error:', error);
        showMessage('Failed to load subscription requests', 'error');
    }
}

function displaySubscriptionRequests(requests) {
    const content = document.getElementById('subscriptionRequestsContent');
    if (!content) return;

    if (requests.length === 0) {
        content.innerHTML = '<p>No pending subscription requests.</p>';
        return;
    }

    content.innerHTML = requests.map(req => `
        <div class="subscription-request-item">
            <div class="request-info">
                <h4>${req.userName || req.userEmail}</h4>
                <p>Requesting: <strong>${req.requestedLevel}</strong> (Current: ${req.currentLevel})</p>
                <small>Requested: ${new Date(req.createdAt).toLocaleDateString()}</small>
            </div>
            <div class="request-actions">
                <button class="btn btn-sm btn-primary" onclick="approveSubscriptionRequest(${req.userId}, '${req.requestedLevel}')">Approve</button>
                <button class="btn btn-sm" onclick="rejectSubscriptionRequest(${req.id})">Reject</button>
            </div>
        </div>
    `).join('');
}

function showSubscriptionRequestsModal() {
    loadSubscriptionRequests();
    document.getElementById('subscriptionRequestsModal').style.display = 'block';
}

function closeSubscriptionRequestsModal() {
    document.getElementById('subscriptionRequestsModal').style.display = 'none';
}

async function approveSubscriptionRequest(userId, level) {
    try {
        const response = await fetch(`${API_BASE}/admin/users/${userId}/subscription`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('bookgenie_token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ subscription_level: level })
        });

        if (!response.ok) throw new Error('Failed to approve request');

        showMessage('Subscription approved successfully!', 'success');
        loadSubscriptionRequests();
    } catch (error) {
        console.error('Approve error:', error);
        showMessage('Failed to approve subscription request', 'error');
    }
}

async function rejectSubscriptionRequest(requestId) {
    // TODO: Implement reject endpoint
    showMessage('Reject functionality coming soon', 'info');
}

// Search functionality
async function loadSearch() {
    // Search tab content
}

async function loadCategories() {
    try {
        const response = await fetch(`${API_BASE}/categories`);
        const categories = await response.json();
        // Display categories
    } catch (error) {
        console.error('Categories error:', error);
    }
}

// Book card helper
function createBookCard(book) {
    return `
        <div class="book-card" onclick="viewBook(${book.id})">
            <div class="book-cover">${book.cover_image || '📚'}</div>
            <div class="book-info">
                <h4>${book.title}</h4>
                <p class="book-author">${book.author}</p>
                <p class="book-abstract">${book.abstract ? book.abstract.substring(0, 100) + '...' : ''}</p>
                <div class="book-meta">
                    <span class="badge">${book.genre}</span>
                    <span class="badge">${book.academic_level}</span>
                </div>
            </div>
        </div>
    `;
}

function viewBook(bookId) {
    // TODO: Implement book view
    showMessage('Book view coming soon', 'info');
}

// Feedback
function showFeedbackModal() {
    document.getElementById('feedbackModal').style.display = 'block';
}

function closeFeedbackModal() {
    document.getElementById('feedbackModal').style.display = 'none';
    document.getElementById('feedbackForm').reset();
    document.querySelectorAll('.star').forEach(star => star.classList.remove('active'));
}

let currentRating = 0;
function setRating(rating) {
    currentRating = rating;
    document.querySelectorAll('.star').forEach((star, index) => {
        if (index < rating) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
}

async function submitFeedback(event) {
    event.preventDefault();
    
    const formData = {
        message: document.getElementById('feedbackMessage').value,
        type: document.getElementById('feedbackType').value,
        rating: currentRating
    };

    try {
        const response = await fetch(`${API_BASE}/feedback`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('bookgenie_token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) throw new Error('Failed to submit feedback');

        showMessage('Feedback submitted successfully!', 'success');
        closeFeedbackModal();
    } catch (error) {
        console.error('Feedback error:', error);
        showMessage('Failed to submit feedback', 'error');
    }
}

// Profile dropdown
function toggleProfileDropdown() {
    const dropdown = document.getElementById('userProfileDropdown');
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
}

// Logout
function logout() {
    localStorage.removeItem('bookgenie_token');
    localStorage.removeItem('bookgenie_user');
    window.location.href = 'login.html';
}

// Message display
function showMessage(message, type = 'info') {
    const messageEl = document.getElementById('message');
    if (!messageEl) return;

    messageEl.textContent = message;
    messageEl.className = `message message-${type}`;
    messageEl.style.display = 'block';

    setTimeout(() => {
        messageEl.style.display = 'none';
    }, 5000);
}

// Event listeners
function setupEventListeners() {
    // Close modals on outside click
    window.onclick = function(event) {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    };
}

// Make functions globally available
window.switchTab = switchTab;
window.viewUserProfile = viewUserProfile;
window.closeUserProfile = closeUserProfile;
window.viewUserTraffic = viewUserTraffic;
window.closeUserTraffic = closeUserTraffic;
window.editUser = editUser;
window.closeEditUserModal = closeEditUserModal;
window.updateUser = updateUser;
window.showAddBookModal = showAddBookModal;
window.closeAddBookModal = closeAddBookModal;
window.addNewBook = addNewBook;
window.editBook = editBook;
window.closeEditBookModal = closeEditBookModal;
window.updateBook = updateBook;
window.deleteBook = deleteBook;
window.uploadBookFile = uploadBookFile;
window.uploadBookCover = uploadBookCover;
window.requestSubscription = requestSubscription;
window.showSubscriptionRequestsModal = showSubscriptionRequestsModal;
window.closeSubscriptionRequestsModal = closeSubscriptionRequestsModal;
window.approveSubscriptionRequest = approveSubscriptionRequest;
window.rejectSubscriptionRequest = rejectSubscriptionRequest;
window.showFeedbackModal = showFeedbackModal;
window.closeFeedbackModal = closeFeedbackModal;
window.setRating = setRating;
window.submitFeedback = submitFeedback;
window.toggleProfileDropdown = toggleProfileDropdown;
window.logout = logout;
window.viewBook = viewBook;
window.filterAdminBooks = filterAdminBooks;


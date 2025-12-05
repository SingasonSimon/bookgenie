from sentence_transformers import SentenceTransformer
from flask import Flask, request, jsonify, session, send_from_directory
from flask_cors import CORS
import sqlite3
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import jwt
import datetime
from functools import wraps, lru_cache
import hashlib
import os
from werkzeug.utils import secure_filename
from werkzeug.exceptions import RequestEntityTooLarge
import time
import threading

# Helper function to safely get values from sqlite3.Row objects
def row_get(row, key, default=None):
    """Safely get a value from a sqlite3.Row object with a default value"""
    try:
        return row[key] if key in row.keys() else default
    except (KeyError, TypeError):
        return default

# Elasticsearch imports (optional)
try:
    from elasticsearch import Elasticsearch
    from elasticsearch.exceptions import ConnectionError, NotFoundError
    ELASTICSEARCH_AVAILABLE = True
except ImportError:
    ELASTICSEARCH_AVAILABLE = False
    print("Elasticsearch not available. Install with: pip install elasticsearch")

app = Flask(__name__)
app.secret_key = 'bookgenie-local-secret-key-2024'
CORS(app, 
     supports_credentials=True,
     origins=[
         "http://localhost:8000", "http://127.0.0.1:8000", "http://0.0.0.0:8000",
         "http://localhost:5173", "http://127.0.0.1:5173",
         "http://localhost:3000", "http://127.0.0.1:3000",
         "http://localhost:5174", "http://127.0.0.1:5174"
     ],
     allow_headers=["Content-Type", "Authorization", "Accept"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     expose_headers=["Content-Type"])

# Global error handler to ensure CORS headers are always present
@app.errorhandler(Exception)
def handle_exception(e):
    """Handle all exceptions and ensure CORS headers are present"""
    import traceback
    print(f"Error: {e}")
    print(traceback.format_exc())
    response = jsonify({'error': str(e)})
    response.status_code = 500
    return response

# Note: CORS headers are handled by flask_cors, no need for manual after_request handler

# File upload configuration
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
BOOKS_FOLDER = os.path.join(UPLOAD_FOLDER, 'books')
COVERS_FOLDER = os.path.join(UPLOAD_FOLDER, 'covers')
ALLOWED_EXTENSIONS = {'pdf', 'epub', 'txt', 'doc', 'docx'}
ALLOWED_COVER_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB max file size

# Elasticsearch configuration (optional)
ELASTICSEARCH_ENABLED = os.getenv('ELASTICSEARCH_ENABLED', 'false').lower() == 'true'
ELASTICSEARCH_HOST = os.getenv('ELASTICSEARCH_HOST', 'localhost:9200')
ELASTICSEARCH_INDEX = os.getenv('ELASTICSEARCH_INDEX', 'bookgenie_books')

# Creates upload directories if they don't exist
os.makedirs(BOOKS_FOLDER, exist_ok=True)
os.makedirs(COVERS_FOLDER, exist_ok=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE

# JWT Configuration
JWT_SECRET = 'bookgenie-jwt-secret-key-2024'
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24

# Initialize AI Model
print("Loading AI model...")
ai_model = SentenceTransformer('all-MiniLM-L6-v2')
print("AI model loaded successfully!")

# Database connection with optimizations
_db_lock = threading.Lock()

def get_db():
    """Get database connection with optimizations enabled"""
    conn = sqlite3.connect('bookgenie.db', check_same_thread=False)
    conn.row_factory = sqlite3.Row
    
    # Enable WAL mode for better concurrency
    conn.execute('PRAGMA journal_mode=WAL')
    
    # Optimize for performance
    conn.execute('PRAGMA synchronous=NORMAL')  # Faster than FULL, still safe
    conn.execute('PRAGMA cache_size=-64000')  # 64MB cache
    conn.execute('PRAGMA temp_store=MEMORY')  # Store temp tables in memory
    conn.execute('PRAGMA mmap_size=268435456')  # 256MB memory-mapped I/O
    
    return conn

# Simple in-memory cache for frequently accessed data
_cache = {}
_cache_timestamps = {}
CACHE_TTL = 300  # 5 minutes cache TTL

def get_cached(key):
    """Get value from cache if not expired"""
    if key in _cache:
        if time.time() - _cache_timestamps[key] < CACHE_TTL:
            return _cache[key]
        else:
            # Expired, remove it
            del _cache[key]
            del _cache_timestamps[key]
    return None

def set_cached(key, value):
    """Set value in cache"""
    _cache[key] = value
    _cache_timestamps[key] = time.time()

def clear_cache(pattern=None):
    """Clear cache entries matching pattern or all if None"""
    if pattern is None:
        _cache.clear()
        _cache_timestamps.clear()
    else:
        keys_to_remove = [k for k in _cache.keys() if pattern in k]
        for k in keys_to_remove:
            del _cache[k]
            del _cache_timestamps[k]

# JWT Helper Functions
def generate_token(user_id, email, role):
    payload = {
        'user_id': user_id,
        'email': email,
        'role': role,
        'exp': datetime.datetime.now(datetime.UTC) + datetime.timedelta(hours=JWT_EXPIRATION_HOURS),
        'iat': datetime.datetime.now(datetime.UTC)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_token(token):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def require_auth(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            token = None
            auth_header = request.headers.get('Authorization')
            
            if auth_header:
                try:
                    token = auth_header.split(' ')[1]  # Bearer <token>
                except IndexError:
                    response = jsonify({'error': 'Invalid token format'})
                    return response, 401
            
            if not token:
                response = jsonify({'error': 'Authentication required'})
                return response, 401
            
            payload = verify_token(token)
            if not payload:
                response = jsonify({'error': 'Invalid or expired token'})
                return response, 401
            
            request.current_user = payload
            return f(*args, **kwargs)
        except Exception as e:
            # Ensure CORS headers are present even on errors
            response = jsonify({'error': str(e)})
            return response, 500
    return decorated_function

def require_admin(f):
    @wraps(f)
    @require_auth
    def decorated_function(*args, **kwargs):
        if request.current_user.get('role') != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        return f(*args, **kwargs)
    return decorated_function

# Database setup with migration support
def init_db():
    conn = get_db()
    c = conn.cursor()
    
    # Users table - Updated schema
    c.execute('''CREATE TABLE IF NOT EXISTS users
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  email TEXT UNIQUE NOT NULL,
                  password TEXT NOT NULL,
                  first_name TEXT,
                  last_name TEXT,
                  avatar TEXT DEFAULT 'user',
                  academic_level TEXT,
                  department TEXT,
                  role TEXT DEFAULT 'student',
                  subscription_level TEXT DEFAULT 'free',
                  last_login TIMESTAMP,
                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)''')
    
    # Add new columns if they don't exist (migration)
    try:
        c.execute('ALTER TABLE users ADD COLUMN first_name TEXT')
    except sqlite3.OperationalError:
        pass
    try:
        c.execute('ALTER TABLE users ADD COLUMN last_name TEXT')
    except sqlite3.OperationalError:
        pass
    try:
        c.execute('ALTER TABLE users ADD COLUMN avatar TEXT DEFAULT "user"')
    except sqlite3.OperationalError:
        pass
    try:
        c.execute('ALTER TABLE users ADD COLUMN department TEXT')
    except sqlite3.OperationalError:
        pass
    try:
        c.execute('ALTER TABLE users ADD COLUMN subscription_level TEXT DEFAULT "free"')
    except sqlite3.OperationalError:
        pass
    try:
        c.execute('ALTER TABLE users ADD COLUMN last_login TIMESTAMP')
    except sqlite3.OperationalError:
        pass
    
    # Books table - Updated schema
    c.execute('''CREATE TABLE IF NOT EXISTS books
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  title TEXT NOT NULL,
                  author TEXT NOT NULL,
                  abstract TEXT,
                  genre TEXT,
                  academic_level TEXT,
                  tags TEXT,
                  file_url TEXT,
                  cover_image TEXT DEFAULT 'book',
                  subscription_level TEXT DEFAULT 'free',
                  pages INTEGER DEFAULT 0,
                  uploaded_by INTEGER,
                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)''')
    
    # Add new columns if they don't exist (migration)
    try:
        c.execute('ALTER TABLE books ADD COLUMN cover_image TEXT DEFAULT "book"')
    except sqlite3.OperationalError:
        pass
    try:
        c.execute('ALTER TABLE books ADD COLUMN subscription_level TEXT DEFAULT "free"')
    except sqlite3.OperationalError:
        pass
    try:
        c.execute('ALTER TABLE books ADD COLUMN pages INTEGER DEFAULT 0')
    except sqlite3.OperationalError:
        pass
    
    # Search history table
    c.execute('''CREATE TABLE IF NOT EXISTS search_history
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  user_id INTEGER,
                  query TEXT,
                  results_count INTEGER,
                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)''')
    
    # Feedback table - Enhanced
    c.execute('''CREATE TABLE IF NOT EXISTS feedback
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  user_id INTEGER,
                  book_id INTEGER,
                  is_helpful BOOLEAN,
                  query TEXT,
                  type TEXT DEFAULT 'general',
                  message TEXT,
                  rating INTEGER,
                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)''')
    
    # Recommendation feedback table (for AI learning loop)
    c.execute('''CREATE TABLE IF NOT EXISTS recommendation_feedback
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  user_id INTEGER,
                  recommendation_id TEXT,
                  recommendation_type TEXT,
                  book_id INTEGER,
                  position INTEGER,
                  clicked BOOLEAN DEFAULT 0,
                  rating INTEGER,
                  feedback_type TEXT,
                  query_context TEXT,
                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)''')
    
    # Recommendation performance metrics table
    c.execute('''CREATE TABLE IF NOT EXISTS recommendation_metrics
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  recommendation_type TEXT,
                  date DATE,
                  total_shown INTEGER DEFAULT 0,
                  total_clicked INTEGER DEFAULT 0,
                  total_rated INTEGER DEFAULT 0,
                  avg_rating REAL,
                  click_through_rate REAL,
                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)''')
    
    # Add indexes for recommendation feedback
    try:
        c.execute('CREATE INDEX IF NOT EXISTS idx_rec_feedback_user ON recommendation_feedback(user_id)')
        c.execute('CREATE INDEX IF NOT EXISTS idx_rec_feedback_type ON recommendation_feedback(recommendation_type)')
        c.execute('CREATE INDEX IF NOT EXISTS idx_rec_feedback_date ON recommendation_feedback(created_at DESC)')
        c.execute('CREATE INDEX IF NOT EXISTS idx_rec_metrics_type_date ON recommendation_metrics(recommendation_type, date)')
    except sqlite3.OperationalError as e:
        print(f"Note: Some recommendation indexes may already exist: {e}")
    
    # Reading history table
    c.execute('''CREATE TABLE IF NOT EXISTS reading_history
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  user_id INTEGER,
                  book_id INTEGER,
                  duration_minutes INTEGER,
                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)''')
    
    # User-book interactions table (for collaborative filtering)
    c.execute('''CREATE TABLE IF NOT EXISTS user_book_interactions
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  user_id INTEGER,
                  book_id INTEGER,
                  interaction_type TEXT,
                  interaction_value REAL DEFAULT 1.0,
                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)''')
    
    # Recommendation feedback table (for AI learning loop)
    c.execute('''CREATE TABLE IF NOT EXISTS recommendation_feedback
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  user_id INTEGER,
                  recommendation_id TEXT,
                  recommendation_type TEXT,
                  book_id INTEGER,
                  position INTEGER,
                  clicked BOOLEAN DEFAULT 0,
                  rating INTEGER,
                  feedback_type TEXT,
                  query_context TEXT,
                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)''')
    
    # Recommendation performance metrics table
    c.execute('''CREATE TABLE IF NOT EXISTS recommendation_metrics
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  recommendation_type TEXT,
                  date DATE,
                  total_shown INTEGER DEFAULT 0,
                  total_clicked INTEGER DEFAULT 0,
                  total_rated INTEGER DEFAULT 0,
                  avg_rating REAL,
                  click_through_rate REAL,
                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)''')
    
    # Add indexes for faster lookups
    try:
        c.execute('CREATE INDEX IF NOT EXISTS idx_interactions_user_book ON user_book_interactions(user_id, book_id)')
        c.execute('CREATE INDEX IF NOT EXISTS idx_interactions_type ON user_book_interactions(interaction_type)')
        c.execute('CREATE INDEX IF NOT EXISTS idx_rec_feedback_user ON recommendation_feedback(user_id)')
        c.execute('CREATE INDEX IF NOT EXISTS idx_rec_feedback_type ON recommendation_feedback(recommendation_type)')
        c.execute('CREATE INDEX IF NOT EXISTS idx_rec_feedback_date ON recommendation_feedback(created_at DESC)')
        c.execute('CREATE INDEX IF NOT EXISTS idx_rec_metrics_type_date ON recommendation_metrics(recommendation_type, date)')
    except sqlite3.OperationalError:
        pass
    
    # Subscription requests table
    c.execute('''CREATE TABLE IF NOT EXISTS subscription_requests
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  user_id INTEGER,
                  requested_level TEXT,
                  current_level TEXT,
                  status TEXT DEFAULT 'pending',
                  rejection_message TEXT,
                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                  approved_at TIMESTAMP)''')
    
    # Add current_level column if it doesn't exist (migration)
    try:
        c.execute('ALTER TABLE subscription_requests ADD COLUMN current_level TEXT')
    except sqlite3.OperationalError:
        pass
    
    # Add rejection_message column if it doesn't exist (migration)
    try:
        c.execute('ALTER TABLE subscription_requests ADD COLUMN rejection_message TEXT')
    except sqlite3.OperationalError:
        pass
    
    # Book reviews table
    c.execute('''CREATE TABLE IF NOT EXISTS book_reviews
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  user_id INTEGER,
                  book_id INTEGER,
                  rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
                  comment TEXT,
                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                  UNIQUE(user_id, book_id))''')
    
    # Book likes table
    c.execute('''CREATE TABLE IF NOT EXISTS book_likes
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  user_id INTEGER,
                  book_id INTEGER,
                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                  UNIQUE(user_id, book_id))''')
    
    # Categories table
    c.execute('''CREATE TABLE IF NOT EXISTS categories
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  name TEXT UNIQUE NOT NULL,
                  description TEXT,
                  color TEXT DEFAULT '#667eea',
                  icon TEXT DEFAULT 'BookOpen',
                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)''')
    
    # Add icon column if it doesn't exist (migration)
    try:
        c.execute('ALTER TABLE categories ADD COLUMN icon TEXT DEFAULT "BookOpen"')
    except sqlite3.OperationalError:
        pass
    
    # Create indexes for better query performance
    print("Creating database indexes...")
    
    # Users table indexes
    try:
        c.execute('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)')
        c.execute('CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)')
        c.execute('CREATE INDEX IF NOT EXISTS idx_users_subscription ON users(subscription_level)')
    except sqlite3.OperationalError as e:
        print(f"Note: Some user indexes may already exist: {e}")
    
    # Books table indexes
    try:
        c.execute('CREATE INDEX IF NOT EXISTS idx_books_genre ON books(genre)')
        c.execute('CREATE INDEX IF NOT EXISTS idx_books_academic_level ON books(academic_level)')
        c.execute('CREATE INDEX IF NOT EXISTS idx_books_subscription ON books(subscription_level)')
        c.execute('CREATE INDEX IF NOT EXISTS idx_books_created_at ON books(created_at DESC)')
        c.execute('CREATE INDEX IF NOT EXISTS idx_books_uploaded_by ON books(uploaded_by)')
        # Composite index for common filter combinations
        c.execute('CREATE INDEX IF NOT EXISTS idx_books_genre_level ON books(genre, academic_level)')
    except sqlite3.OperationalError as e:
        print(f"Note: Some book indexes may already exist: {e}")
    
    # Search history indexes
    try:
        c.execute('CREATE INDEX IF NOT EXISTS idx_search_history_user ON search_history(user_id)')
        c.execute('CREATE INDEX IF NOT EXISTS idx_search_history_created ON search_history(created_at DESC)')
        c.execute('CREATE INDEX IF NOT EXISTS idx_search_history_user_date ON search_history(user_id, created_at DESC)')
    except sqlite3.OperationalError as e:
        print(f"Note: Some search history indexes may already exist: {e}")
    
    # Reading history indexes
    try:
        c.execute('CREATE INDEX IF NOT EXISTS idx_reading_history_user ON reading_history(user_id)')
        c.execute('CREATE INDEX IF NOT EXISTS idx_reading_history_book ON reading_history(book_id)')
        c.execute('CREATE INDEX IF NOT EXISTS idx_reading_history_user_book ON reading_history(user_id, book_id)')
        c.execute('CREATE INDEX IF NOT EXISTS idx_reading_history_created ON reading_history(created_at DESC)')
    except sqlite3.OperationalError as e:
        print(f"Note: Some reading history indexes may already exist: {e}")
    
    # Feedback indexes
    try:
        c.execute('CREATE INDEX IF NOT EXISTS idx_feedback_user ON feedback(user_id)')
        c.execute('CREATE INDEX IF NOT EXISTS idx_feedback_book ON feedback(book_id)')
        
        # Book reviews and likes indexes
        c.execute('CREATE INDEX IF NOT EXISTS idx_reviews_book ON book_reviews(book_id)')
        c.execute('CREATE INDEX IF NOT EXISTS idx_reviews_user ON book_reviews(user_id)')
        c.execute('CREATE INDEX IF NOT EXISTS idx_reviews_book_rating ON book_reviews(book_id, rating)')
        c.execute('CREATE INDEX IF NOT EXISTS idx_likes_book ON book_likes(book_id)')
        c.execute('CREATE INDEX IF NOT EXISTS idx_likes_user ON book_likes(user_id)')
        c.execute('CREATE INDEX IF NOT EXISTS idx_feedback_helpful ON feedback(is_helpful)')
    except sqlite3.OperationalError as e:
        print(f"Note: Some feedback indexes may already exist: {e}")
    
    # Subscription requests indexes
    try:
        c.execute('CREATE INDEX IF NOT EXISTS idx_subscription_requests_user ON subscription_requests(user_id)')
        c.execute('CREATE INDEX IF NOT EXISTS idx_subscription_requests_status ON subscription_requests(status)')
        c.execute('CREATE INDEX IF NOT EXISTS idx_subscription_requests_user_status ON subscription_requests(user_id, status)')
    except sqlite3.OperationalError as e:
        print(f"Note: Some subscription request indexes may already exist: {e}")
    
    # Analyze tables for query optimizer
    c.execute('ANALYZE')
    
    conn.commit()
    conn.close()
    print("Database initialized with indexes!")

# Load sample data
def load_sample_data():
    conn = get_db()
    c = conn.cursor()
    
    # Check if books already exist
    c.execute("SELECT COUNT(*) FROM books")
    count = c.fetchone()[0]
    
    if count == 0:
        sample_books = [
            {
                'title': 'Introduction to Machine Learning',
                'author': 'Ethan Smith',
                'abstract': 'Comprehensive guide to machine learning algorithms, covering supervised and unsupervised learning, neural networks, and practical applications in various industries.',
                'genre': 'Computer Science',
                'academic_level': 'undergraduate',
                'tags': 'machine learning,artificial intelligence,algorithms,data science,neural networks',
                'file_url': '/sample/ml-book.pdf',
                'cover_image': 'book',
                'subscription_level': 'free',
                'pages': 350
            },
            {
                'title': 'Climate Change and Agricultural Impacts',
                'author': 'Maria Garcia',
                'abstract': 'Detailed analysis of how climate change affects global food production systems, with case studies from different geographical regions and mitigation strategies.',
                'genre': 'Environmental Science', 
                'academic_level': 'postgraduate',
                'tags': 'climate change,agriculture,sustainability,environment,food security',
                'file_url': '/sample/climate-book.pdf',
                'cover_image': 'book',
                'subscription_level': 'free',
                'pages': 420
            },
            {
                'title': 'Principles of Microeconomics',
                'author': 'David Chen',
                'abstract': 'Fundamental concepts of microeconomic theory including supply and demand, market structures, consumer behavior, and price determination mechanisms.',
                'genre': 'Economics',
                'academic_level': 'undergraduate', 
                'tags': 'economics,markets,supply demand,microeconomics,consumer behavior',
                'file_url': '/sample/economics-book.pdf',
                'cover_image': 'book',
                'subscription_level': 'free',
                'pages': 280
            },
            {
                'title': 'Advanced Quantum Mechanics',
                'author': 'Dr. Sarah Johnson',
                'abstract': 'Advanced treatment of quantum mechanical principles including wave functions, operators, perturbation theory, and applications in modern physics research.',
                'genre': 'Physics',
                'academic_level': 'phd',
                'tags': 'quantum physics,mechanics,theoretical physics,advanced,research',
                'file_url': '/sample/physics-book.pdf',
                'cover_image': 'book',
                'subscription_level': 'premium',
                'pages': 550
            },
            {
                'title': 'Research Methods in Social Sciences',
                'author': 'Professor Robert Kim', 
                'abstract': 'Comprehensive guide to research methodologies, data collection techniques, statistical analysis, and ethical considerations in social science research.',
                'genre': 'Social Sciences',
                'academic_level': 'postgraduate',
                'tags': 'research methods,social sciences,methodology,data analysis,statistics',
                'file_url': '/sample/research-book.pdf',
                'cover_image': 'book',
                'subscription_level': 'basic',
                'pages': 380
            }
        ]
        
        for book in sample_books:
            c.execute('''INSERT INTO books 
                        (title, author, abstract, genre, academic_level, tags, uploaded_by, file_url, cover_image, subscription_level, pages)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
                     (book['title'], book['author'], book['abstract'], book['genre'],
                      book['academic_level'], book['tags'], 1, book['file_url'], 
                      book['cover_image'], book['subscription_level'], book['pages']))
        print("Sample books loaded!")
    
    # Create admin user
    c.execute("SELECT COUNT(*) FROM users WHERE email=?", ('admin@bookgenie.edu',))
    if c.fetchone()[0] == 0:
        admin_password_hash = hashlib.sha256('admin123'.encode()).hexdigest()
        c.execute('''INSERT INTO users (email, password, first_name, last_name, avatar, academic_level, role, subscription_level, department)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)''',
                 ('admin@bookgenie.edu', admin_password_hash, 'Admin', 'User', 'admin', 'faculty', 'admin', 'premium', 'Administration'))
        print("Admin user created!")
    
    # Create sample student user
    c.execute("SELECT COUNT(*) FROM users WHERE email=?", ('student@university.edu',))
    if c.fetchone()[0] == 0:
        student_password_hash = hashlib.sha256('student123'.encode()).hexdigest()
        c.execute('''INSERT INTO users (email, password, first_name, last_name, avatar, academic_level, role, subscription_level, department)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)''',
                 ('student@university.edu', student_password_hash, 'Student', 'User', 'student', 'undergraduate', 'student', 'free', 'Computer Science'))
        print("Sample student user created!")
    
    # Load categories
    c.execute("SELECT COUNT(*) FROM categories")
    if c.fetchone()[0] == 0:
        categories = [
            ('Computer Science', 'Programming, algorithms, and computer systems', '#667eea'),
            ('Environmental Science', 'Climate, ecology, and sustainability', '#4caf50'),
            ('Economics', 'Markets, finance, and economic theory', '#ff9800'),
            ('Physics', 'Quantum mechanics, relativity, and theoretical physics', '#9c27b0'),
            ('Social Sciences', 'Sociology, psychology, and research methods', '#f44336')
        ]
        c.executemany('''INSERT INTO categories (name, description, color) VALUES (?, ?, ?)''', categories)
        print("Categories loaded!")
    
    conn.commit()
    conn.close()

# Collaborative Filtering Engine
class CollaborativeFiltering:
    def __init__(self):
        self.user_item_matrix = None
        self.user_similarities = {}
        
    def build_user_item_matrix(self, conn):
        """Build user-item interaction matrix from database"""
        c = conn.cursor()
        
        # Get all users and books
        c.execute('SELECT id FROM users')
        users = [row['id'] for row in c.fetchall()]
        
        c.execute('SELECT id FROM books')
        books = [row['id'] for row in c.fetchall()]
        
        if not users or not books:
            return None
        
        # Initialize matrix: users x books
        matrix = {}
        for user_id in users:
            matrix[user_id] = {}
            for book_id in books:
                matrix[user_id][book_id] = 0.0
        
        # Weight 1: Reading history (implicit positive signal)
        c.execute('SELECT user_id, book_id, COUNT(*) as count, SUM(duration_minutes) as total_duration FROM reading_history GROUP BY user_id, book_id')
        for row in c.fetchall():
            user_id = row['user_id']
            book_id = row['book_id']
            if user_id in matrix and book_id in matrix[user_id]:
                # Weight based on reading count and duration
                count_weight = min(row['count'] * 0.3, 1.0)  # Max 1.0 for multiple reads
                duration_weight = min(row['total_duration'] / 60.0, 1.0)  # 1 hour = 1.0
                matrix[user_id][book_id] += (count_weight + duration_weight) / 2
        
        # Weight 2: Positive feedback (explicit positive signal)
        c.execute('SELECT user_id, book_id, AVG(rating) as avg_rating, COUNT(*) as count FROM feedback WHERE is_helpful = 1 AND rating > 0 GROUP BY user_id, book_id')
        for row in c.fetchall():
            user_id = row['user_id']
            book_id = row['book_id']
            if user_id in matrix and book_id in matrix[user_id]:
                # Rating normalized to 0-1 scale (assuming 1-5 rating)
                rating_weight = (row['avg_rating'] / 5.0) * 0.8  # Max 0.8
                matrix[user_id][book_id] += rating_weight
        
        # Weight 3: User-book interactions (explicit interactions)
        c.execute('''SELECT user_id, book_id, interaction_type, AVG(interaction_value) as avg_value, COUNT(*) as count
                     FROM user_book_interactions
                     GROUP BY user_id, book_id, interaction_type''')
        for row in c.fetchall():
            user_id = row['user_id']
            book_id = row['book_id']
            interaction_type = row['interaction_type']
            avg_value = row['avg_value'] or 1.0
            count = row['count']
            
            if user_id in matrix and book_id in matrix[user_id]:
                # Different weights for different interaction types
                if interaction_type == 'view':
                    weight = 0.1 * min(count, 5)  # Max 0.5 for multiple views
                elif interaction_type == 'download':
                    weight = 0.6
                elif interaction_type == 'bookmark':
                    weight = 0.5
                elif interaction_type == 'share':
                    weight = 0.4
                else:
                    weight = avg_value * 0.3
                
                matrix[user_id][book_id] += weight
        
        self.user_item_matrix = matrix
        return matrix
    
    def calculate_user_similarity(self, user1_id, user2_id):
        """Calculate cosine similarity between two users"""
        if not self.user_item_matrix:
            return 0.0
        
        if user1_id not in self.user_item_matrix or user2_id not in self.user_item_matrix:
            return 0.0
        
        user1_vector = list(self.user_item_matrix[user1_id].values())
        user2_vector = list(self.user_item_matrix[user2_id].values())
        
        # Calculate cosine similarity
        dot_product = sum(a * b for a, b in zip(user1_vector, user2_vector))
        magnitude1 = sum(a * a for a in user1_vector) ** 0.5
        magnitude2 = sum(b * b for b in user2_vector) ** 0.5
        
        if magnitude1 == 0 or magnitude2 == 0:
            return 0.0
        
        similarity = dot_product / (magnitude1 * magnitude2)
        return similarity
    
    def find_similar_users(self, user_id, top_k=10):
        """Find top K most similar users"""
        if not self.user_item_matrix or user_id not in self.user_item_matrix:
            return []
        
        similarities = []
        for other_user_id in self.user_item_matrix.keys():
            if other_user_id != user_id:
                similarity = self.calculate_user_similarity(user_id, other_user_id)
                if similarity > 0:  # Only include positive similarities
                    similarities.append({
                        'user_id': other_user_id,
                        'similarity': similarity
                    })
        
        # Sort by similarity and return top K
        similarities.sort(key=lambda x: x['similarity'], reverse=True)
        return similarities[:top_k]
    
    def get_collaborative_recommendations(self, user_id, top_k=10, min_similarity=0.1):
        """Get recommendations based on similar users' preferences"""
        if not self.user_item_matrix or user_id not in self.user_item_matrix:
            return []
        
        # Check if user has any interactions (cold start problem)
        user_interactions = set()
        user_total_score = 0.0
        for book_id, score in self.user_item_matrix[user_id].items():
            if score > 0:
                user_interactions.add(book_id)
                user_total_score += score
        
        # If user has very few interactions, use popularity-based fallback
        if len(user_interactions) < 3:
            # Return most popular books (by total interaction score across all users)
            book_popularity = {}
            for other_user_id, interactions in self.user_item_matrix.items():
                if other_user_id != user_id:
                    for book_id, score in interactions.items():
                        if book_id not in user_interactions and score > 0:
                            if book_id not in book_popularity:
                                book_popularity[book_id] = 0.0
                            book_popularity[book_id] += score
            
            recommendations = sorted(book_popularity.items(), key=lambda x: x[1], reverse=True)[:top_k]
            return [{'book_id': book_id, 'score': score, 'method': 'popularity'} 
                   for book_id, score in recommendations]
        
        # Find similar users
        similar_users = self.find_similar_users(user_id, top_k=20)
        
        if not similar_users:
            # Fallback to popularity if no similar users
            book_popularity = {}
            for other_user_id, interactions in self.user_item_matrix.items():
                if other_user_id != user_id:
                    for book_id, score in interactions.items():
                        if book_id not in user_interactions and score > 0:
                            if book_id not in book_popularity:
                                book_popularity[book_id] = 0.0
                            book_popularity[book_id] += score
            
            recommendations = sorted(book_popularity.items(), key=lambda x: x[1], reverse=True)[:top_k]
            return [{'book_id': book_id, 'score': score, 'method': 'popularity'} 
                   for book_id, score in recommendations]
        
        # Calculate recommendation scores using collaborative filtering
        book_scores = {}
        total_similarity = sum(su['similarity'] for su in similar_users)
        
        for similar_user in similar_users:
            similarity = similar_user['similarity']
            if similarity < min_similarity:
                continue
            
            other_user_id = similar_user['user_id']
            # Normalize similarity to sum to 1 (weighted average)
            weight = similarity / total_similarity if total_similarity > 0 else 0
            
            for book_id, score in self.user_item_matrix[other_user_id].items():
                if book_id not in user_interactions and score > 0:
                    if book_id not in book_scores:
                        book_scores[book_id] = 0.0
                    # Weighted score: normalized_similarity * interaction_score
                    book_scores[book_id] += weight * score
        
        # Sort by score and return top K
        recommendations = sorted(book_scores.items(), key=lambda x: x[1], reverse=True)[:top_k]
        return [{'book_id': book_id, 'score': score, 'method': 'collaborative'} 
               for book_id, score in recommendations]

collaborative_engine = CollaborativeFiltering()

# AI Learning Loop Engine
class AILearningLoop:
    def __init__(self):
        self.feedback_threshold = 10  # Minimum feedback before retraining
        self.retrain_interval_hours = 24  # Retrain every 24 hours
        
    def record_recommendation_shown(self, conn, user_id, recommendation_type, book_id, position, query_context=None, recommendation_id=None):
        """Record that a recommendation was shown to a user"""
        c = conn.cursor()
        
        if recommendation_id is None:
            recommendation_id = f"{user_id}_{recommendation_type}_{book_id}_{int(time.time())}"
        
        try:
            c.execute('''INSERT INTO recommendation_feedback
                         (user_id, recommendation_id, recommendation_type, book_id, position, query_context)
                         VALUES (?, ?, ?, ?, ?, ?)''',
                     (user_id, recommendation_id, recommendation_type, book_id, position, query_context))
            conn.commit()
            return recommendation_id
        except Exception as e:
            print(f"Error recording recommendation shown: {e}")
            conn.rollback()
            return None
    
    def record_recommendation_feedback(self, conn, recommendation_id, clicked=False, rating=None, feedback_type='click'):
        """Record user feedback on a recommendation"""
        c = conn.cursor()
        
        try:
            c.execute('''UPDATE recommendation_feedback
                         SET clicked=?, rating=?, feedback_type=?
                         WHERE recommendation_id=?''',
                     (1 if clicked else 0, rating, feedback_type, recommendation_id))
            conn.commit()
            
            # Update metrics
            self._update_metrics(conn, recommendation_id)
            return True
        except Exception as e:
            print(f"Error recording recommendation feedback: {e}")
            conn.rollback()
            return False
    
    def _update_metrics(self, conn, recommendation_id):
        """Update recommendation performance metrics"""
        c = conn.cursor()
        
        # Get recommendation details
        c.execute('''SELECT recommendation_type, DATE(created_at) as date, clicked, rating
                     FROM recommendation_feedback
                     WHERE recommendation_id=?''', (recommendation_id,))
        rec = c.fetchone()
        
        if not rec:
            return
        
        rec_type = rec['recommendation_type']
        date = rec['date']
        
        # Get or create metrics record
        c.execute('''SELECT * FROM recommendation_metrics
                     WHERE recommendation_type=? AND date=?''', (rec_type, date))
        metrics = c.fetchone()
        
        if metrics:
            # Update existing metrics
            new_total_shown = metrics['total_shown'] + 1
            new_total_clicked = metrics['total_clicked'] + (1 if rec['clicked'] else 0)
            new_total_rated = metrics['total_rated'] + (1 if rec['rating'] else 0)
            
            # Calculate new average rating
            if rec['rating']:
                if metrics['avg_rating']:
                    new_avg_rating = ((metrics['avg_rating'] * metrics['total_rated']) + rec['rating']) / new_total_rated
                else:
                    new_avg_rating = rec['rating']
            else:
                new_avg_rating = metrics['avg_rating']
            
            new_ctr = (new_total_clicked / new_total_shown) * 100 if new_total_shown > 0 else 0
            
            c.execute('''UPDATE recommendation_metrics
                         SET total_shown=?, total_clicked=?, total_rated=?, avg_rating=?, 
                             click_through_rate=?, updated_at=CURRENT_TIMESTAMP
                         WHERE recommendation_type=? AND date=?''',
                     (new_total_shown, new_total_clicked, new_total_rated, new_avg_rating, new_ctr, rec_type, date))
        else:
            # Create new metrics record
            total_shown = 1
            total_clicked = 1 if rec['clicked'] else 0
            total_rated = 1 if rec['rating'] else 0
            avg_rating = rec['rating'] if rec['rating'] else None
            ctr = (total_clicked / total_shown) * 100 if total_shown > 0 else 0
            
            c.execute('''INSERT INTO recommendation_metrics
                         (recommendation_type, date, total_shown, total_clicked, total_rated, avg_rating, click_through_rate)
                         VALUES (?, ?, ?, ?, ?, ?, ?)''',
                     (rec_type, date, total_shown, total_clicked, total_rated, avg_rating, ctr))
        
        conn.commit()
    
    def get_recommendation_performance(self, conn, recommendation_type=None, days=30):
        """Get recommendation performance metrics"""
        c = conn.cursor()
        
        query = '''SELECT recommendation_type, date, total_shown, total_clicked, total_rated, 
                          avg_rating, click_through_rate
                   FROM recommendation_metrics
                   WHERE date >= DATE('now', '-' || ? || ' days')'''
        params = [days]
        
        if recommendation_type:
            query += ' AND recommendation_type = ?'
            params.append(recommendation_type)
        
        query += ' ORDER BY date DESC, recommendation_type'
        
        c.execute(query, params)
        
        metrics = []
        for row in c.fetchall():
            metrics.append({
                'recommendation_type': row['recommendation_type'],
                'date': row['date'],
                'total_shown': row['total_shown'],
                'total_clicked': row['total_clicked'],
                'total_rated': row['total_rated'],
                'avg_rating': round(row['avg_rating'], 2) if row['avg_rating'] else None,
                'click_through_rate': round(row['click_through_rate'], 2) if row['click_through_rate'] else 0
            })
        
        return metrics
    
    def analyze_feedback_patterns(self, conn, recommendation_type=None):
        """Analyze feedback patterns to improve recommendations"""
        c = conn.cursor()
        
        # Get feedback statistics
        query = '''SELECT recommendation_type, 
                          COUNT(*) as total_feedback,
                          SUM(clicked) as total_clicks,
                          AVG(rating) as avg_rating,
                          COUNT(DISTINCT user_id) as unique_users
                   FROM recommendation_feedback
                   WHERE clicked = 1 OR rating IS NOT NULL'''
        
        params = []
        if recommendation_type:
            query += ' AND recommendation_type = ?'
            params.append(recommendation_type)
        
        query += ' GROUP BY recommendation_type'
        
        c.execute(query, params)
        
        patterns = []
        for row in c.fetchall():
            patterns.append({
                'recommendation_type': row['recommendation_type'],
                'total_feedback': row['total_feedback'],
                'total_clicks': row['total_clicks'],
                'avg_rating': round(row['avg_rating'], 2) if row['avg_rating'] else None,
                'unique_users': row['unique_users'],
                'click_rate': round((row['total_clicks'] / row['total_feedback']) * 100, 2) if row['total_feedback'] > 0 else 0
            })
        
        return patterns
    
    def get_user_feedback_summary(self, conn, user_id):
        """Get feedback summary for a specific user"""
        c = conn.cursor()
        
        c.execute('''SELECT recommendation_type,
                            COUNT(*) as total_recommendations,
                            SUM(clicked) as clicked_count,
                            AVG(rating) as avg_rating
                     FROM recommendation_feedback
                     WHERE user_id=?
                     GROUP BY recommendation_type''', (user_id,))
        
        summary = []
        for row in c.fetchall():
            summary.append({
                'recommendation_type': row['recommendation_type'],
                'total_recommendations': row['total_recommendations'],
                'clicked_count': row['clicked_count'],
                'avg_rating': round(row['avg_rating'], 2) if row['avg_rating'] else None
            })
        
        return summary
    
    def should_retrain(self, conn, recommendation_type):
        """Determine if model should be retrained based on feedback"""
        c = conn.cursor()
        
        # Check if enough feedback collected
        c.execute('''SELECT COUNT(*) as feedback_count
                     FROM recommendation_feedback
                     WHERE recommendation_type=? AND (clicked=1 OR rating IS NOT NULL)''',
                 (recommendation_type,))
        
        result = c.fetchone()
        feedback_count = result['feedback_count'] if result else 0
        
        return feedback_count >= self.feedback_threshold
    
    def get_improvement_suggestions(self, conn):
        """Get suggestions for improving recommendations based on feedback"""
        c = conn.cursor()
        
        suggestions = []
        
        # Check CTR by recommendation type
        c.execute('''SELECT recommendation_type,
                            AVG(click_through_rate) as avg_ctr,
                            COUNT(*) as days_tracked
                     FROM recommendation_metrics
                     WHERE date >= DATE('now', '-30 days')
                     GROUP BY recommendation_type
                     ORDER BY avg_ctr ASC''')
        
        for row in c.fetchall():
            if row['avg_ctr'] < 10:  # Less than 10% CTR
                suggestions.append({
                    'type': 'low_ctr',
                    'recommendation_type': row['recommendation_type'],
                    'current_ctr': round(row['avg_ctr'], 2),
                    'suggestion': f"Consider adjusting weights or improving content matching for {row['recommendation_type']} recommendations"
                })
        
        # Check rating trends
        c.execute('''SELECT recommendation_type,
                            AVG(avg_rating) as avg_rating,
                            COUNT(*) as days_tracked
                     FROM recommendation_metrics
                     WHERE date >= DATE('now', '-30 days') AND avg_rating IS NOT NULL
                     GROUP BY recommendation_type
                     HAVING avg_rating < 3.0
                     ORDER BY avg_rating ASC''')
        
        for row in c.fetchall():
            suggestions.append({
                'type': 'low_rating',
                'recommendation_type': row['recommendation_type'],
                'current_rating': round(row['avg_rating'], 2),
                'suggestion': f"User ratings are low for {row['recommendation_type']} recommendations. Consider improving relevance."
            })
        
        return suggestions

# Initialize AI Learning Loop
ai_learning_loop = AILearningLoop()

# Elasticsearch Service (optional)
class ElasticsearchService:
    def __init__(self):
        self.enabled = ELASTICSEARCH_ENABLED and ELASTICSEARCH_AVAILABLE
        self.client = None
        self.index_name = ELASTICSEARCH_INDEX
        
        if self.enabled:
            try:
                self.client = Elasticsearch([ELASTICSEARCH_HOST])
                # Test connection
                if self.client.ping():
                    print(f"Elasticsearch connected at {ELASTICSEARCH_HOST}")
                    self._create_index_if_not_exists()
                else:
                    print("Elasticsearch connection failed - falling back to SQLite")
                    self.enabled = False
            except Exception as e:
                print(f"Elasticsearch initialization failed: {e} - falling back to SQLite")
                self.enabled = False
    
    def _create_index_if_not_exists(self):
        """Create Elasticsearch index with proper mapping for semantic search"""
        if not self.client:
            return
        
        try:
            # Check if index exists
            if self.client.indices.exists(index=self.index_name):
                return
            
            # Create index with dense_vector mapping for embeddings
            mapping = {
                "mappings": {
                    "properties": {
                        "id": {"type": "integer"},
                        "title": {
                            "type": "text",
                            "analyzer": "standard",
                            "fields": {
                                "keyword": {"type": "keyword"}
                            }
                        },
                        "author": {
                            "type": "text",
                            "fields": {
                                "keyword": {"type": "keyword"}
                            }
                        },
                        "abstract": {"type": "text"},
                        "genre": {"type": "keyword"},
                        "academic_level": {"type": "keyword"},
                        "tags": {"type": "keyword"},
                        "subscription_level": {"type": "keyword"},
                        "cover_image": {"type": "keyword"},
                        "pages": {"type": "integer"},
                        "embedding": {
                            "type": "dense_vector",
                            "dims": 384  # all-MiniLM-L6-v2 produces 384-dimensional embeddings
                        },
                        "created_at": {"type": "date"}
                    }
                }
            }
            
            self.client.indices.create(index=self.index_name, body=mapping)
            print(f"Elasticsearch index '{self.index_name}' created successfully")
        except Exception as e:
            print(f"Error creating Elasticsearch index: {e}")
            self.enabled = False
    
    def index_book(self, book, embedding=None):
        """Index a book in Elasticsearch"""
        if not self.enabled or not self.client:
            return False
        
        try:
            # Generate embedding if not provided
            if embedding is None:
                text = f"{book.get('title', '')} {book.get('abstract', '')} {book.get('tags', '')}"
                embedding = ai_model.encode([text])[0].tolist()
            
            doc = {
                "id": book['id'],
                "title": book.get('title', ''),
                "author": book.get('author', ''),
                "abstract": book.get('abstract', '') or '',
                "genre": book.get('genre', ''),
                "academic_level": book.get('academic_level', ''),
                "tags": book.get('tags', []) if isinstance(book.get('tags'), list) else (book.get('tags', '').split(',') if book.get('tags') else []),
                "subscription_level": book.get('subscription_level', 'free'),
                "cover_image": book.get('cover_image', 'book'),
                "pages": book.get('pages', 0),
                "embedding": embedding,
                "created_at": book.get('created_at', datetime.datetime.now().isoformat())
            }
            
            self.client.index(index=self.index_name, id=book['id'], body=doc)
            return True
        except Exception as e:
            print(f"Error indexing book {book.get('id')}: {e}")
            return False
    
    def delete_book(self, book_id):
        """Delete a book from Elasticsearch"""
        if not self.enabled or not self.client:
            return False
        
        try:
            self.client.delete(index=self.index_name, id=book_id, ignore=[404])
            return True
        except Exception as e:
            print(f"Error deleting book {book_id} from Elasticsearch: {e}")
            return False
    
    def search(self, query, top_k=10, filters=None):
        """Perform semantic search using Elasticsearch"""
        if not self.enabled or not self.client:
            return None
        
        try:
            # Generate query embedding
            query_embedding = ai_model.encode([query])[0].tolist()
            
            # Build query
            must_clauses = []
            
            # Add filters if provided
            if filters:
                if filters.get('subscription_level'):
                    must_clauses.append({
                        "term": {"subscription_level": filters['subscription_level']}
                    })
                if filters.get('genre'):
                    must_clauses.append({
                        "term": {"genre": filters['genre']}
                    })
                if filters.get('academic_level'):
                    must_clauses.append({
                        "term": {"academic_level": filters['academic_level']}
                    })
            
            # Build the search query
            query_body = {
                "size": top_k,
                "query": {
                    "bool": {
                        "must": must_clauses if must_clauses else [{"match_all": {}}],
                        "should": [
                            {
                                "script_score": {
                                    "query": {"match_all": {}},
                                    "script": {
                                        "source": "cosineSimilarity(params.query_vector, 'embedding') + 1.0",
                                        "params": {"query_vector": query_embedding}
                                    }
                                }
                            },
                            {
                                "multi_match": {
                                    "query": query,
                                    "fields": ["title^3", "author^2", "abstract", "tags"],
                                    "type": "best_fields",
                                    "fuzziness": "AUTO"
                                }
                            }
                        ],
                        "minimum_should_match": 1
                    }
                },
                "_source": ["id", "title", "author", "abstract", "genre", "academic_level", "tags", "cover_image", "subscription_level", "pages"]
            }
            
            response = self.client.search(index=self.index_name, body=query_body)
            
            # Format results
            results = []
            for hit in response['hits']['hits']:
                score = hit['_score']
                source = hit['_source']
                
                # Normalize score (script_score adds 1.0, so subtract it)
                normalized_score = max(0, min(1, (score - 1.0) / 2.0))
                
                results.append({
                    'book': {
                        'id': source['id'],
                        'title': source['title'],
                        'author': source['author'],
                        'abstract': source.get('abstract', ''),
                        'genre': source.get('genre', ''),
                        'academic_level': source.get('academic_level', ''),
                        'tags': source.get('tags', []),
                        'cover_image': source.get('cover_image', 'book'),
                        'subscription_level': source.get('subscription_level', 'free'),
                        'pages': source.get('pages', 0)
                    },
                    'similarity_score': normalized_score,
                    'relevance_percentage': round(normalized_score * 100, 1)
                })
            
            return results
        except Exception as e:
            print(f"Error performing Elasticsearch search: {e}")
            return None
    
    def bulk_index_books(self, books):
        """Bulk index multiple books"""
        if not self.enabled or not self.client:
            return False
        
        try:
            actions = []
            for book in books:
                text = f"{book.get('title', '')} {book.get('abstract', '')} {book.get('tags', '')}"
                embedding = ai_model.encode([text])[0].tolist()
                
                doc = {
                    "id": book['id'],
                    "title": book.get('title', ''),
                    "author": book.get('author', ''),
                    "abstract": book.get('abstract', '') or '',
                    "genre": book.get('genre', ''),
                    "academic_level": book.get('academic_level', ''),
                    "tags": book.get('tags', []) if isinstance(book.get('tags'), list) else (book.get('tags', '').split(',') if book.get('tags') else []),
                    "subscription_level": book.get('subscription_level', 'free'),
                    "cover_image": book.get('cover_image', 'book'),
                    "pages": book.get('pages', 0),
                    "embedding": embedding,
                    "created_at": book.get('created_at', datetime.datetime.now().isoformat())
                }
                
                actions.append({
                    "_index": self.index_name,
                    "_id": book['id'],
                    "_source": doc
                })
            
            if actions:
                from elasticsearch.helpers import bulk
                bulk(self.client, actions)
                print(f"Bulk indexed {len(actions)} books to Elasticsearch")
            
            return True
        except Exception as e:
            print(f"Error bulk indexing books: {e}")
            return False
    
    def sync_all_books(self, conn):
        """Sync all books from SQLite to Elasticsearch"""
        if not self.enabled or not self.client:
            return False
        
        try:
            c = conn.cursor()
            c.execute("SELECT * FROM books")
            books = []
            for row in c.fetchall():
                books.append({
                    'id': row['id'],
                    'title': row['title'],
                    'author': row['author'],
                    'abstract': row['abstract'] if row['abstract'] else '',
                    'genre': row['genre'] if row['genre'] else '',
                    'academic_level': row['academic_level'] if row['academic_level'] else '',
                    'tags': row['tags'].split(',') if row['tags'] else [],
                    'subscription_level': row_get(row, 'subscription_level', 'free'),
                    'cover_image': row_get(row, 'cover_image', 'book'),
                    'pages': row_get(row, 'pages', 0),
                    'created_at': row_get(row, 'created_at', datetime.datetime.now(datetime.UTC).isoformat())
                })
            
            return self.bulk_index_books(books)
        except Exception as e:
            print(f"Error syncing books to Elasticsearch: {e}")
            return False

# Initialize Elasticsearch service
es_service = ElasticsearchService()

# Hybrid Recommendation Engine
class HybridRecommendationEngine:
    def __init__(self, ai_engine, collaborative_engine):
        self.ai_engine = ai_engine
        self.collaborative_engine = collaborative_engine
    
    def get_content_based_recommendations(self, user_id, conn, top_k=10):
        """Get content-based recommendations based on user's reading history"""
        c = conn.cursor()
        
        # Get user's recently read books
        c.execute('''SELECT DISTINCT book_id FROM reading_history 
                     WHERE user_id=? ORDER BY created_at DESC LIMIT 5''', (user_id,))
        recent_books = c.fetchall()
        
        if not recent_books:
            return []
        
        # Get details of recently read books
        book_ids = [row['book_id'] for row in recent_books]
        placeholders = ','.join(['?'] * len(book_ids))
        c.execute(f'SELECT * FROM books WHERE id IN ({placeholders})', book_ids)
        
        user_books = []
        for row in c.fetchall():
            user_books.append({
                'id': row['id'],
                'title': row['title'],
                'author': row['author'],
                'abstract': row['abstract'] if row['abstract'] else '',
                'genre': row['genre'] if row['genre'] else '',
                'academic_level': row['academic_level'] if row['academic_level'] else '',
                'tags': row['tags'].split(',') if row['tags'] else [],
                'cover_image': row_get(row, 'cover_image', 'book')
            })
        
        # Get all other books (excluding user's read books)
        c.execute(f'SELECT * FROM books WHERE id NOT IN ({placeholders})', book_ids)
        candidate_books = []
        for row in c.fetchall():
            candidate_books.append({
                'id': row['id'],
                'title': row['title'],
                'author': row['author'],
                'abstract': row['abstract'] if row['abstract'] else '',
                'genre': row['genre'] if row['genre'] else '',
                'academic_level': row['academic_level'] if row['academic_level'] else '',
                'tags': row['tags'].split(',') if row['tags'] else [],
                'cover_image': row_get(row, 'cover_image', 'book')
            })
        
        if not candidate_books:
            return []
        
        # Generate embeddings for user's books and candidates
        all_books = user_books + candidate_books
        self.ai_engine.generate_embeddings(all_books, use_cache=True)
        
        # Create a query from user's reading preferences
        # Combine titles, abstracts, and genres from user's books
        query_parts = []
        for book in user_books:
            query_parts.append(book['title'])
            if book['abstract']:
                query_parts.append(book['abstract'][:200])  # Limit abstract length
            if book['genre']:
                query_parts.append(book['genre'])
        
        query = ' '.join(query_parts[:500])  # Limit total query length
        
        # Perform semantic search
        results = self.ai_engine.semantic_search(query, candidate_books, top_k=top_k * 2)
        
        return results
    
    def get_hybrid_recommendations(self, user_id, conn, top_k=10, 
                                   content_weight=0.5, collaborative_weight=0.5):
        """
        Get hybrid recommendations combining content-based and collaborative filtering
        
        Args:
            user_id: User ID
            conn: Database connection
            top_k: Number of recommendations to return
            content_weight: Weight for content-based recommendations (0-1)
            collaborative_weight: Weight for collaborative recommendations (0-1)
        """
        # Normalize weights
        total_weight = content_weight + collaborative_weight
        if total_weight > 0:
            content_weight = content_weight / total_weight
            collaborative_weight = collaborative_weight / total_weight
        
        # Get content-based recommendations
        content_recs = self.get_content_based_recommendations(user_id, conn, top_k=top_k * 2)
        
        # Get collaborative recommendations
        matrix = self.collaborative_engine.build_user_item_matrix(conn)
        collaborative_recs = []
        if matrix:
            collaborative_recs_raw = self.collaborative_engine.get_collaborative_recommendations(
                user_id, top_k=top_k * 2
            )
            
            # Convert to same format as content-based
            book_ids = [rec['book_id'] for rec in collaborative_recs_raw]
            if book_ids:
                placeholders = ','.join(['?'] * len(book_ids))
                c = conn.cursor()
                c.execute(f'SELECT * FROM books WHERE id IN ({placeholders})', book_ids)
                
                books_dict = {}
                for row in c.fetchall():
                    books_dict[row['id']] = {
                        'id': row['id'],
                        'title': row['title'],
                        'author': row['author'],
                        'abstract': row['abstract'] if row['abstract'] else '',
                        'genre': row['genre'] if row['genre'] else '',
                        'academic_level': row['academic_level'] if row['academic_level'] else '',
                        'tags': row['tags'].split(',') if row['tags'] else [],
                        'cover_image': row_get(row, 'cover_image', 'book')
                    }
                
                for rec in collaborative_recs_raw:
                    book_id = rec['book_id']
                    if book_id in books_dict:
                        collaborative_recs.append({
                            'book': books_dict[book_id],
                            'similarity_score': rec['score'],
                            'relevance_percentage': min(rec['score'] * 100, 100)
                        })
        
        # Combine recommendations
        book_scores = {}
        
        # Add content-based scores
        for rec in content_recs:
            book_id = rec['book']['id']
            if book_id not in book_scores:
                book_scores[book_id] = {
                    'book': rec['book'],
                    'content_score': 0.0,
                    'collaborative_score': 0.0,
                    'hybrid_score': 0.0,
                    'content_percentage': 0.0,
                    'collaborative_percentage': 0.0
                }
            book_scores[book_id]['content_score'] = rec['similarity_score']
            book_scores[book_id]['content_percentage'] = rec['relevance_percentage']
        
        # Add collaborative scores
        for rec in collaborative_recs:
            book_id = rec['book']['id']
            if book_id not in book_scores:
                book_scores[book_id] = {
                    'book': rec['book'],
                    'content_score': 0.0,
                    'collaborative_score': 0.0,
                    'hybrid_score': 0.0,
                    'content_percentage': 0.0,
                    'collaborative_percentage': 0.0
                }
            book_scores[book_id]['collaborative_score'] = rec['similarity_score']
            book_scores[book_id]['collaborative_percentage'] = rec['relevance_percentage']
        
        # Calculate hybrid scores
        for book_id, scores in book_scores.items():
            # Normalize scores to 0-1 range if needed
            content_norm = min(scores['content_score'], 1.0) if scores['content_score'] > 0 else 0.0
            collab_norm = min(scores['collaborative_score'], 1.0) if scores['collaborative_score'] > 0 else 0.0
            
            # Calculate weighted hybrid score
            hybrid_score = (content_norm * content_weight) + (collab_norm * collaborative_weight)
            scores['hybrid_score'] = hybrid_score
        
        # Sort by hybrid score and return top K
        sorted_recs = sorted(book_scores.values(), 
                           key=lambda x: x['hybrid_score'], 
                           reverse=True)[:top_k]
        
        # Format results
        recommendations = []
        for rec in sorted_recs:
            recommendations.append({
                'book': rec['book'],
                'hybrid_score': round(rec['hybrid_score'], 4),
                'confidence_percentage': round(rec['hybrid_score'] * 100, 1),
                'content_score': round(rec['content_score'], 4),
                'content_percentage': round(rec['content_percentage'], 1),
                'collaborative_score': round(rec['collaborative_score'], 4),
                'collaborative_percentage': round(rec['collaborative_percentage'], 1),
                'has_content': rec['content_score'] > 0,
                'has_collaborative': rec['collaborative_score'] > 0
            })
        
        return recommendations

# Initialize hybrid engine (will be initialized after ai_engine)
hybrid_engine = None

# AI Recommendation Engine with caching
class BookGenieAI:
    def __init__(self):
        self.model = ai_model
        self.book_embeddings = {}
        self.embedding_cache = {}  # Persistent cache for book embeddings
        
    def get_book_embedding(self, book_id, book_text):
        """Get book embedding from cache or generate new one"""
        cache_key = f"embedding_{book_id}_{hashlib.md5(book_text.encode()).hexdigest()}"
        
        # Check cache first
        cached = get_cached(cache_key)
        if cached is not None:
            return cached
        
        # Generate new embedding
        embedding = self.model.encode([book_text])[0]
        
        # Cache it
        set_cached(cache_key, embedding)
        return embedding
    
    def generate_embeddings(self, books, use_cache=True):
        """Generate embeddings for all books with caching"""
        if not books:
            return
        
        print(f"Generating embeddings for {len(books)} books (caching: {use_cache})...")
        new_count = 0
        cached_count = 0
        
        for book in books:
            book_id = book['id']
            text = f"{book['title']} {book['abstract']} {book.get('tags', '')}"
            
            if use_cache:
                cache_key = f"embedding_{book_id}_{hashlib.md5(text.encode()).hexdigest()}"
                embedding = get_cached(cache_key)
                
                if embedding is None:
                    # Generate new embedding
                    embedding = self.model.encode([text])[0]
                    set_cached(cache_key, embedding)
                    new_count += 1
                else:
                    cached_count += 1
            else:
                embedding = self.model.encode([text])[0]
                new_count += 1
            
            self.book_embeddings[book_id] = embedding
        
        if use_cache:
            print(f"Embeddings: {new_count} new, {cached_count} from cache")
        else:
            print("Embeddings generated!")
    
    def semantic_search(self, query, books, top_k=10):
        """Perform semantic search on books"""
        if not books:
            return []
        
        # Check cache for query embedding
        query_cache_key = f"query_embedding_{hashlib.md5(query.encode()).hexdigest()}"
        query_embedding = get_cached(query_cache_key)
        
        if query_embedding is None:
            query_embedding = self.model.encode([query])
            set_cached(query_cache_key, query_embedding)
        
        # Calculate similarities
        similarities = []
        for book in books:
            book_id = book['id']
            if book_id in self.book_embeddings:
                book_embedding = self.book_embeddings[book_id]
                similarity = cosine_similarity([query_embedding[0]], [book_embedding])[0][0]
                # Only include positive similarity scores (related content)
                if float(similarity) > 0:
                    similarities.append({
                        'book': book,
                        'similarity_score': float(similarity),
                        'relevance_percentage': round(float(similarity) * 100, 1)
                    })
        
        # Sort by similarity and return top results
        results = sorted(similarities, key=lambda x: x['similarity_score'], reverse=True)[:top_k]
        return results

ai_engine = BookGenieAI()

# Initialize hybrid engine after ai_engine is created
hybrid_engine = HybridRecommendationEngine(ai_engine, collaborative_engine)

# Initialize hybrid engine after ai_engine is created
hybrid_engine = HybridRecommendationEngine(ai_engine, collaborative_engine)

# ============================================
# JWT AUTHENTICATION ENDPOINTS
# ============================================

@app.route('/api/auth/register', methods=['POST'])
def auth_register():
    data = request.json
    conn = get_db()
    c = conn.cursor()
    
    try:
        # Hash password (simple hash for demo - use bcrypt in production)
        password_hash = hashlib.sha256(data['password'].encode()).hexdigest()
        
        c.execute('''INSERT INTO users 
                     (email, password, first_name, last_name, avatar, academic_level, role, department, subscription_level)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)''',
                 (data['email'], 
                  password_hash,
                  data.get('firstName', ''),
                  data.get('lastName', ''),
                  data.get('avatar', 'user'),
                  data.get('academicLevel', 'undergraduate'),
                  data.get('role', 'student'),
                  data.get('department', ''),
                  'free'))
        user_id = c.lastrowid
        conn.commit()
        
        # Generate token
        token = generate_token(user_id, data['email'], data.get('role', 'student'))
        
        # Get user data
        c.execute('''SELECT id, email, first_name, last_name, avatar, academic_level, role, 
                     subscription_level, department, created_at FROM users WHERE id=?''', (user_id,))
        user_row = c.fetchone()
        
        user = {
            'id': user_row['id'],
            'email': user_row['email'],
            'firstName': user_row['first_name'] or '',
            'lastName': user_row['last_name'] or '',
            'avatar': user_row['avatar'] or 'user',
            'academicLevel': user_row['academic_level'],
            'role': user_row['role'],
            'subscriptionLevel': user_row['subscription_level'] or 'free',
            'department': user_row['department'] or '',
            'createdAt': user_row['created_at']
        }
        
        conn.close()
        
        return jsonify({
            'success': True,
            'token': token,
            'user': user
        })
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({'success': False, 'error': 'Email already exists'}), 400
    except Exception as e:
        conn.close()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/auth/login', methods=['POST'])
def auth_login():
    try:
        data = request.json
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        if 'email' not in data or 'password' not in data:
            return jsonify({'success': False, 'error': 'Email and password required'}), 400
        
        conn = get_db()
        c = conn.cursor()
        
        password_hash = hashlib.sha256(data['password'].encode()).hexdigest()
        
        # Use LOWER() for case-insensitive email matching
        c.execute('''SELECT id, email, first_name, last_name, avatar, academic_level, role, 
                     subscription_level, department, created_at FROM users 
                     WHERE LOWER(email)=LOWER(?) AND password=?''',
                  (data['email'], password_hash))
        user_row = c.fetchone()
        
        if user_row:
            # Ensure admins always have premium subscription
            if user_row['role'] == 'admin' and (user_row['subscription_level'] or 'free') != 'premium':
                c.execute('UPDATE users SET subscription_level = ? WHERE id=?', ('premium', user_row['id']))
                conn.commit()
                subscription_level = 'premium'
            else:
                subscription_level = user_row['subscription_level'] or 'free'
            
            # Update last login
            c.execute('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id=?', (user_row['id'],))
            conn.commit()
            
            # Generate token
            token = generate_token(user_row['id'], user_row['email'], user_row['role'])
            
            user = {
                'id': user_row['id'],
                'email': user_row['email'],
                'firstName': user_row['first_name'] or '',
                'lastName': user_row['last_name'] or '',
                'avatar': user_row['avatar'] or 'user',
                'academicLevel': user_row['academic_level'],
                'role': user_row['role'],
                'subscriptionLevel': subscription_level,
                'department': user_row['department'] or '',
                'createdAt': user_row['created_at']
            }
            
            conn.close()
            
            return jsonify({
                'success': True,
                'token': token,
                'user': user
            })
        else:
            conn.close()
            return jsonify({'success': False, 'error': 'Invalid credentials'}), 401
    except Exception as e:
        if 'conn' in locals():
            conn.close()
        return jsonify({'success': False, 'error': f'Login failed: {str(e)}'}), 500

@app.route('/api/auth/verify', methods=['POST'])
def auth_verify():
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({'success': False, 'error': 'No token provided'}), 401
    
    try:
        token = auth_header.split(' ')[1]
    except IndexError:
        return jsonify({'success': False, 'error': 'Invalid token format'}), 401
    
    payload = verify_token(token)
    if not payload:
        return jsonify({'success': False, 'error': 'Invalid or expired token'}), 401
    
    # Get user data
    conn = get_db()
    c = conn.cursor()
    c.execute('''SELECT id, email, first_name, last_name, avatar, academic_level, role, 
                 subscription_level, department, created_at FROM users WHERE id=?''', 
              (payload['user_id'],))
    user_row = c.fetchone()
    
    if not user_row:
        conn.close()
        return jsonify({'success': False, 'error': 'User not found'}), 404
    
    # Ensure admins always have premium subscription
    if user_row['role'] == 'admin' and (user_row['subscription_level'] or 'free') != 'premium':
        c.execute('UPDATE users SET subscription_level = ? WHERE id=?', ('premium', user_row['id']))
        conn.commit()
        subscription_level = 'premium'
    else:
        subscription_level = user_row['subscription_level'] or 'free'
    
    user = {
        'id': user_row['id'],
        'email': user_row['email'],
        'firstName': user_row['first_name'] or '',
        'lastName': user_row['last_name'] or '',
        'avatar': user_row['avatar'] or 'user',
        'academicLevel': user_row['academic_level'],
        'role': user_row['role'],
        'subscriptionLevel': subscription_level,
        'department': user_row['department'] or '',
        'createdAt': user_row['created_at']
    }
    
    conn.close()
    return jsonify({'success': True, 'user': user})

@app.route('/api/auth/logout', methods=['POST'])
def auth_logout():
    # With JWT, logout is handled client-side by removing the token
    # But we can log the logout event if needed
    return jsonify({'success': True, 'message': 'Logged out successfully'})

# Legacy endpoints (for backward compatibility)
@app.route('/api/register', methods=['POST'])
def register():
    return auth_register()

@app.route('/api/login', methods=['POST'])
def login():
    return auth_login()

@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'success': True})

@app.route('/api/user')
def get_user():
    if 'user_id' in session:
        return jsonify({
            'id': session['user_id'],
            'email': session['user_email'],
            'role': session['user_role']
        })
    return jsonify({'user': None})

# ============================================
# BOOK ROUTES
# ============================================

@app.route('/api/books', methods=['GET', 'POST'])
@require_auth
def books():
    try:
        if request.method == 'GET':
            # Check cache first
            genre = request.args.get('genre')
            level = request.args.get('academic_level')
            user_id = request.current_user['user_id']
            
            # Get user subscription from database (not from token)
            conn = get_db()
            c = conn.cursor()
            c.execute('SELECT subscription_level FROM users WHERE id=?', (user_id,))
            user_row = c.fetchone()
            user_subscription = user_row['subscription_level'] or 'free' if user_row else 'free'
            
            # Build cache key
            cache_key = f"books_{user_subscription}_{genre or 'all'}_{level or 'all'}"
            cached_books = get_cached(cache_key)
            
            if cached_books is not None:
                conn.close()
                return jsonify(cached_books)
            
            # Optimized query using indexes
            if user_subscription == 'free':
                base_query = "SELECT * FROM books WHERE subscription_level = 'free'"
                params = []
            elif user_subscription == 'basic':
                base_query = "SELECT * FROM books WHERE subscription_level IN ('free', 'basic')"
                params = []
            else:
                base_query = "SELECT * FROM books WHERE 1=1"
                params = []
            
            # Add filters (these use indexes)
            if genre:
                base_query += " AND genre = ?"
                params.append(genre)
            if level:
                base_query += " AND academic_level = ?"
                params.append(level)
            
            # Get pagination parameters
            page = int(request.args.get('page', 1))
            per_page = int(request.args.get('per_page', 12))
            offset = (page - 1) * per_page
            
            # Get total count for pagination
            count_query = base_query.replace("SELECT *", "SELECT COUNT(*)")
            c.execute(count_query, params)
            total_count = c.fetchone()[0]
            
            # Use index on created_at DESC with pagination
            base_query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
            params.extend([per_page, offset])
            
            c.execute(base_query, params)
            books = []
            for row in c.fetchall():
                books.append({
                    'id': row['id'],
                    'title': row['title'],
                    'author': row['author'],
                    'abstract': row['abstract'] if row['abstract'] else '',
                    'genre': row['genre'] if row['genre'] else '',
                    'academic_level': row['academic_level'] if row['academic_level'] else '',
                    'tags': row['tags'].split(',') if row['tags'] else [],
                    'file_url': row['file_url'] if row['file_url'] else '',
                    'cover_image': row_get(row, 'cover_image', 'book'),
                    'subscription_level': row_get(row, 'subscription_level', 'free'),
                    'pages': row_get(row, 'pages', 0)
                })
            
            conn.close()
            
            # Calculate pagination metadata
            total_pages = (total_count + per_page - 1) // per_page
            
            # Cache the results (only cache first page for performance)
            if page == 1:
                set_cached(cache_key, books)
            
            # Generate embeddings (cached) - wrap in try-except to prevent errors
            try:
                ai_engine.generate_embeddings(books, use_cache=True)
            except Exception as e:
                print(f"Warning: Failed to generate embeddings: {e}")
                # Continue without embeddings
            
            return jsonify({
                'books': books,
                'pagination': {
                    'page': page,
                    'per_page': per_page,
                    'total': total_count,
                    'total_pages': total_pages
                }
            })
    except Exception as e:
        import traceback
        print(f"Error in books endpoint: {e}")
        print(traceback.format_exc())
        if 'conn' in locals():
            conn.close()
        return jsonify({'error': str(e)}), 500
    
    else:  # POST - Add new book (admin only)
        if request.current_user.get('role') != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        data = request.json
        conn = get_db()
        c = conn.cursor()
        
        try:
            c.execute('''INSERT INTO books 
                        (title, author, abstract, genre, academic_level, tags, uploaded_by, 
                         file_url, cover_image, subscription_level, pages)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
                     (data['title'], data['author'], data['abstract'], data['genre'],
                      data['academic_level'], ','.join(data.get('tags', [])), 
                      request.current_user['user_id'], data.get('file_url', ''),
                      data.get('cover_image', 'book'), data.get('subscription_level', 'free'),
                      data.get('pages', 0)))
            book_id = c.lastrowid
            conn.commit()
            
            # Index in Elasticsearch if enabled
            if es_service.enabled:
                book_data = {
                    'id': book_id,
                    'title': data['title'],
                    'author': data['author'],
                    'abstract': data.get('abstract', ''),
                    'genre': data.get('genre', ''),
                    'academic_level': data.get('academic_level', ''),
                    'tags': data.get('tags', []),
                    'subscription_level': data.get('subscription_level', 'free'),
                    'cover_image': data.get('cover_image', 'book'),
                    'pages': data.get('pages', 0)
                }
                es_service.index_book(book_data)
            
            conn.close()
            
            # Clear books cache when new book is added
            clear_cache('books_')
            
            return jsonify({'success': True, 'id': book_id}), 201
        except Exception as e:
            conn.close()
            return jsonify({'error': str(e)}), 500

@app.route('/api/books/<int:book_id>', methods=['GET'])
@require_auth
def get_book(book_id):
    """Get a single book by ID"""
    try:
        conn = get_db()
        c = conn.cursor()
        
        # Get user subscription to check access
        user_id = request.current_user['user_id']
        c.execute('SELECT subscription_level FROM users WHERE id=?', (user_id,))
        user_row = c.fetchone()
        user_subscription = user_row['subscription_level'] or 'free' if user_row else 'free'
        
        # Get book
        c.execute('SELECT * FROM books WHERE id=?', (book_id,))
        row = c.fetchone()
        
        if not row:
            conn.close()
            return jsonify({'error': 'Book not found'}), 404
        
        # Check subscription access
        book_subscription = row_get(row, 'subscription_level', 'free')
        if book_subscription == 'premium' and user_subscription != 'premium':
            conn.close()
            return jsonify({'error': 'Premium subscription required'}), 403
        elif book_subscription == 'basic' and user_subscription == 'free':
            conn.close()
            return jsonify({'error': 'Basic subscription required'}), 403
        
        book = {
            'id': row['id'],
            'title': row['title'],
            'author': row['author'],
            'abstract': row['abstract'] if row['abstract'] else '',
            'genre': row['genre'] if row['genre'] else '',
            'academic_level': row['academic_level'] if row['academic_level'] else '',
            'tags': row['tags'].split(',') if row['tags'] else [],
            'file_url': row['file_url'] if row['file_url'] else '',
            'cover_image': row_get(row, 'cover_image', 'book'),
            'subscription_level': row_get(row, 'subscription_level', 'free'),
            'pages': row_get(row, 'pages', 0),
            'created_at': row['created_at'] if 'created_at' in row.keys() else None
        }
        
        conn.close()
        return jsonify(book)
    except Exception as e:
        if 'conn' in locals():
            conn.close()
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/books/<int:book_id>', methods=['PUT', 'DELETE'])
@require_admin
def admin_book_management(book_id):
    conn = get_db()
    c = conn.cursor()
    
    # Verify book exists
    c.execute('SELECT id FROM books WHERE id=?', (book_id,))
    if not c.fetchone():
        conn.close()
        return jsonify({'error': 'Book not found'}), 404
    
    if request.method == 'PUT':
        # Update book
        data = request.json
        updates = []
        params = []
        
        if 'title' in data:
            updates.append('title = ?')
            params.append(data['title'])
        if 'author' in data:
            updates.append('author = ?')
            params.append(data['author'])
        if 'abstract' in data:
            updates.append('abstract = ?')
            params.append(data['abstract'])
        if 'genre' in data:
            updates.append('genre = ?')
            params.append(data['genre'])
        if 'academic_level' in data:
            updates.append('academic_level = ?')
            params.append(data['academic_level'])
        if 'subscription_level' in data:
            updates.append('subscription_level = ?')
            params.append(data['subscription_level'])
        if 'pages' in data:
            updates.append('pages = ?')
            params.append(data['pages'])
        if 'tags' in data:
            updates.append('tags = ?')
            params.append(','.join(data['tags']) if isinstance(data['tags'], list) else data['tags'])
        
        if not updates:
            conn.close()
            return jsonify({'error': 'No fields to update'}), 400
        
        params.append(book_id)
        query = f"UPDATE books SET {', '.join(updates)} WHERE id=?"
        c.execute(query, params)
        conn.commit()
        
        # Update Elasticsearch index if enabled
        if es_service.enabled:
            c.execute('SELECT * FROM books WHERE id=?', (book_id,))
            book_row = c.fetchone()
            if book_row:
                book_data = {
                    'id': book_row['id'],
                    'title': book_row['title'],
                    'author': book_row['author'],
                    'abstract': book_row['abstract'] if book_row['abstract'] else '',
                    'genre': book_row['genre'] if book_row['genre'] else '',
                    'academic_level': book_row['academic_level'] if book_row['academic_level'] else '',
                    'tags': book_row['tags'].split(',') if book_row['tags'] else [],
                    'subscription_level': row_get(book_row, 'subscription_level', 'free'),
                    'cover_image': row_get(book_row, 'cover_image', 'book'),
                    'pages': row_get(book_row, 'pages', 0)
                }
                es_service.index_book(book_data)
        
        conn.close()
        
        # Clear cache
        clear_cache('books_')
        
        return jsonify({'success': True, 'message': 'Book updated successfully'})
    
    else:  # DELETE
        # Delete book file if exists
        c.execute('SELECT file_url FROM books WHERE id=?', (book_id,))
        book_row = c.fetchone()
        if book_row and book_row['file_url']:
            filename = book_row['file_url'].split('/')[-1]
            file_path = os.path.join(BOOKS_FOLDER, filename)
            if os.path.exists(file_path):
                try:
                    os.remove(file_path)
                except:
                    pass  # Continue even if file deletion fails
        
        # Delete book cover if exists
        c.execute('SELECT cover_image FROM books WHERE id=?', (book_id,))
        cover_row = c.fetchone()
        if cover_row and cover_row['cover_image'] and cover_row['cover_image'].startswith('/api/files/covers/'):
            filename = cover_row['cover_image'].split('/')[-1]
            cover_path = os.path.join(COVERS_FOLDER, filename)
            if os.path.exists(cover_path):
                try:
                    os.remove(cover_path)
                except:
                    pass
        
        # Delete book
        c.execute('DELETE FROM books WHERE id=?', (book_id,))
        conn.commit()
        conn.close()
        
        # Delete from Elasticsearch if enabled
        if es_service.enabled:
            es_service.delete_book(book_id)
        
        # Clear cache
        clear_cache('books_')
        
        return jsonify({'success': True, 'message': 'Book deleted successfully'})

@app.route('/api/books/<int:book_id>/read', methods=['POST'])
@require_auth
def record_reading(book_id):
    data = request.json
    duration = data.get('duration_minutes', 5)
    user_id = request.current_user['user_id']
    
    conn = get_db()
    c = conn.cursor()
    
    # Record reading history
    c.execute('''INSERT INTO reading_history (user_id, book_id, duration_minutes)
                 VALUES (?, ?, ?)''',
              (user_id, book_id, duration))
    
    # Also record as interaction for collaborative filtering
    c.execute('''INSERT INTO user_book_interactions (user_id, book_id, interaction_type, interaction_value)
                 VALUES (?, ?, ?, ?)''',
              (user_id, book_id, 'read', min(duration / 60.0, 1.0)))  # Normalize duration
    
    conn.commit()
    conn.close()
    
    # Clear collaborative filtering cache when user interactions change
    clear_cache('collab_rec_')
    clear_cache('dashboard_')
    
    return jsonify({'success': True, 'message': 'Reading session recorded'})

@app.route('/api/books/<int:book_id>/interact', methods=['POST'])
@require_auth
def record_interaction(book_id):
    """Record user interaction with a book (view, download, bookmark, etc.)"""
    data = request.json
    interaction_type = data.get('type', 'view')  # view, download, bookmark, share
    interaction_value = data.get('value', 1.0)
    user_id = request.current_user['user_id']
    
    conn = get_db()
    c = conn.cursor()
    
    # Record interaction
    c.execute('''INSERT INTO user_book_interactions (user_id, book_id, interaction_type, interaction_value)
                 VALUES (?, ?, ?, ?)''',
              (user_id, book_id, interaction_type, interaction_value))
    
    conn.commit()
    conn.close()
    
    # Clear cache
    clear_cache('collab_rec_')
    clear_cache('dashboard_')
    
    return jsonify({'success': True, 'message': f'{interaction_type} interaction recorded'})

@app.route('/api/books/<int:book_id>/recommendations')
def get_recommendations(book_id):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM books WHERE id != ?", (book_id,))
    other_books = []
    for row in c.fetchall():
        other_books.append({
            'id': row['id'],
            'title': row['title'],
            'author': row['author'],
            'abstract': row['abstract'] if row['abstract'] else '',
            'genre': row['genre'] if row['genre'] else '',
            'academic_level': row['academic_level'] if row['academic_level'] else '',
            'tags': row['tags'].split(',') if row['tags'] else [],
            'cover_image': row_get(row, 'cover_image', 'book')
        })
    
    c.execute("SELECT * FROM books WHERE id = ?", (book_id,))
    target_book_row = c.fetchone()
    conn.close()
    
    if not target_book_row:
        return jsonify({'error': 'Book not found'}), 404
    
    target_book = {
        'id': target_book_row['id'],
        'title': target_book_row['title'],
        'author': target_book_row['author'],
        'abstract': target_book_row['abstract']
    }
    
    all_books = other_books + [target_book]
    ai_engine.generate_embeddings(all_books)
    
    results = ai_engine.semantic_search(
        f"{target_book['title']} {target_book['abstract']}",
        other_books,
        6
    )
    
    return jsonify(results)

@app.route('/api/search', methods=['POST'])
def search():
    data = request.json
    query = data.get('query', '')
    top_k = data.get('top_k', 10)
    use_elasticsearch = data.get('use_elasticsearch', True)  # Default to True if available
    
    # Get user subscription level if authenticated
    user_subscription = 'free'
    auth_header = request.headers.get('Authorization')
    if auth_header:
        try:
            token = auth_header.split(' ')[1]
            payload = verify_token(token)
            if payload:
                conn = get_db()
                c = conn.cursor()
                c.execute('SELECT subscription_level FROM users WHERE id=?', (payload['user_id'],))
                user_row = c.fetchone()
                if user_row:
                    user_subscription = user_row['subscription_level'] or 'free'
                conn.close()
        except:
            pass
    
    # Try Elasticsearch first if enabled and requested
    if use_elasticsearch and es_service.enabled:
        filters = {}
        if user_subscription == 'free':
            filters['subscription_level'] = 'free'
        elif user_subscription == 'basic':
            # Elasticsearch doesn't support IN directly, so we'll filter in Python
            filters['subscription_level'] = ['free', 'basic']
        
        all_results = es_service.search(query, top_k=top_k * 2, filters=filters if user_subscription != 'premium' else None)
        
        if all_results is not None:
            # Filter by subscription if needed (for basic users)
            if user_subscription == 'basic':
                all_results = [r for r in all_results if r['book'].get('subscription_level') in ['free', 'basic']]
            
            # Filter out negative matches - only return results with positive similarity/relevance
            results = [r for r in all_results 
                      if (r.get('similarity_score', 0) > 0 or r.get('relevance_percentage', 0) > 0)][:top_k]
            
            # Log search history if user is authenticated
            user_id = None
            if auth_header:
                try:
                    token = auth_header.split(' ')[1]
                    payload = verify_token(token)
                    if payload:
                        user_id = payload['user_id']
                        conn = get_db()
                        c = conn.cursor()
                        c.execute('''INSERT INTO search_history (user_id, query, results_count)
                                     VALUES (?, ?, ?)''',
                                 (user_id, query, len(results)))
                        conn.commit()
                        conn.close()
                except:
                    pass
            
            return jsonify({
                'query': query,
                'results': results,
                'total_count': len(results),
                'message': f'Found {len(results)} results',
                'search_engine': 'elasticsearch'
            })
    
    # Fallback to SQLite + SentenceTransformers
    conn = get_db()
    c = conn.cursor()
    
    # Filter books by subscription
    if user_subscription == 'free':
        c.execute("SELECT * FROM books WHERE subscription_level = 'free'")
    elif user_subscription == 'basic':
        c.execute("SELECT * FROM books WHERE subscription_level IN ('free', 'basic')")
    else:
        c.execute("SELECT * FROM books")
    
    books = []
    for row in c.fetchall():
        books.append({
            'id': row['id'],
            'title': row['title'],
            'author': row['author'],
            'abstract': row['abstract'] if row['abstract'] else '',
            'genre': row['genre'] if row['genre'] else '',
            'academic_level': row['academic_level'] if row['academic_level'] else '',
            'tags': row['tags'].split(',') if row['tags'] else [],
            'cover_image': row_get(row, 'cover_image', 'book')
        })
    
    # Log search history if user is authenticated
    user_id = None
    if auth_header:
        try:
            token = auth_header.split(' ')[1]
            payload = verify_token(token)
            if payload:
                user_id = payload['user_id']
        except:
            pass
    
    ai_engine.generate_embeddings(books)
    all_results = ai_engine.semantic_search(query, books, top_k * 2)  # Get more results to filter
    
    # Filter out negative matches - only return results with positive similarity
    results = [r for r in all_results if r.get('similarity_score', 0) > 0][:top_k]
    
    if user_id:
        c.execute('''INSERT INTO search_history (user_id, query, results_count)
                     VALUES (?, ?, ?)''',
                 (user_id, query, len(results)))
        conn.commit()
    
    conn.close()
    
    return jsonify({
        'query': query,
        'results': results,
        'total_count': len(results),
        'message': f'Found {len(results)} results',
        'search_engine': 'sqlite'
    })

@app.route('/api/search/history', methods=['GET'])
@require_auth
def get_search_history():
    """Get recent search history for the current user"""
    user_id = request.current_user['user_id']
    limit = int(request.args.get('limit', 10))
    
    conn = get_db()
    c = conn.cursor()
    
    c.execute('''SELECT DISTINCT query, MAX(created_at) as last_searched, COUNT(*) as search_count
                 FROM search_history
                 WHERE user_id = ?
                 GROUP BY query
                 ORDER BY last_searched DESC
                 LIMIT ?''', (user_id, limit))
    
    history = []
    for row in c.fetchall():
        history.append({
            'query': row['query'],
            'last_searched': row['last_searched'],
            'search_count': row['search_count']
        })
    
    conn.close()
    return jsonify({'history': history})

# ============================================
# HYBRID RECOMMENDATIONS
# ============================================

@app.route('/api/recommendations/hybrid', methods=['GET'])
@require_auth
def get_hybrid_recommendations():
    """Get hybrid recommendations combining content-based and collaborative filtering (Basic/Premium only)"""
    user_id = request.current_user['user_id']
    
    # Check user subscription level - enhanced recommendations are for Basic/Premium only
    conn = get_db()
    c = conn.cursor()
    c.execute('SELECT subscription_level FROM users WHERE id=?', (user_id,))
    user_row = c.fetchone()
    user_subscription = user_row['subscription_level'] or 'free' if user_row else 'free'
    conn.close()
    
    if user_subscription == 'free':
        return jsonify({
            'error': 'Enhanced recommendations require Basic or Premium subscription',
            'message': 'Upgrade to Basic or Premium to access enhanced recommendations'
        }), 403
    
    top_k = request.args.get('top_k', 10, type=int)
    content_weight = request.args.get('content_weight', 0.5, type=float)
    collaborative_weight = request.args.get('collaborative_weight', 0.5, type=float)
    
    # Validate weights
    if content_weight < 0 or collaborative_weight < 0:
        return jsonify({'error': 'Weights must be non-negative'}), 400
    
    # Check cache
    cache_key = f"hybrid_rec_{user_id}_{top_k}_{content_weight}_{collaborative_weight}"
    cached_recs = get_cached(cache_key)
    if cached_recs is not None:
        return jsonify(cached_recs)
    
    conn = get_db()
    
    try:
        # Get hybrid recommendations
        recommendations = hybrid_engine.get_hybrid_recommendations(
            user_id, 
            conn, 
            top_k=top_k,
            content_weight=content_weight,
            collaborative_weight=collaborative_weight
        )
        
        if not recommendations:
            conn.close()
            return jsonify({
                'recommendations': [],
                'message': 'No recommendations available. Try reading some books first!',
                'type': 'hybrid'
            })
        
        result = {
            'recommendations': recommendations,
            'type': 'hybrid',
            'total_count': len(recommendations),
            'weights': {
                'content': content_weight,
                'collaborative': collaborative_weight
            },
            'stats': {
                'with_content_only': sum(1 for r in recommendations if r['has_content'] and not r['has_collaborative']),
                'with_collaborative_only': sum(1 for r in recommendations if r['has_collaborative'] and not r['has_content']),
                'with_both': sum(1 for r in recommendations if r['has_content'] and r['has_collaborative'])
            }
        }
        
        # Cache for 10 minutes
        set_cached(cache_key, result)
        
        conn.close()
        return jsonify(result)
    
    except Exception as e:
        conn.close()
        return jsonify({
            'error': 'Failed to generate hybrid recommendations',
            'message': str(e)
        }), 500

# ============================================
# STUDENT DASHBOARD
# ============================================

@app.route('/api/student/dashboard', methods=['GET'])
@require_auth
def student_dashboard():
    # Only allow students to access student dashboard
    if request.current_user.get('role') == 'admin':
        return jsonify({'error': 'This endpoint is for students only. Admins should use /api/admin/analytics'}), 403
    
    user_id = request.current_user['user_id']
    
    # Check cache (but allow cache bypass with query parameter)
    cache_key = f"dashboard_{user_id}"
    bypass_cache = request.args.get('t')  # Timestamp parameter bypasses cache
    if not bypass_cache:
        cached_dashboard = get_cached(cache_key)
        if cached_dashboard is not None:
            return jsonify(cached_dashboard)
    
    conn = get_db()
    c = conn.cursor()
    
    # Optimized: Single query for user subscription
    c.execute('SELECT subscription_level FROM users WHERE id=?', (user_id,))
    user_row = c.fetchone()
    subscription_level = user_row['subscription_level'] or 'free' if user_row else 'free'
    
    # Optimized: Use indexes for counts
    c.execute('SELECT COUNT(*) FROM search_history WHERE user_id=?', (user_id,))
    total_searches = c.fetchone()[0]
    
    c.execute('SELECT COUNT(*) FROM reading_history WHERE user_id=?', (user_id,))
    total_reading = c.fetchone()[0]
    
    c.execute('SELECT COUNT(DISTINCT book_id) FROM reading_history WHERE user_id=?', (user_id,))
    books_read = c.fetchone()[0]
    
    # Daily activity
    c.execute('''SELECT COUNT(*) FROM search_history 
                 WHERE user_id=? AND DATE(created_at) = DATE('now')''', (user_id,))
    searches_today = c.fetchone()[0]
    
    c.execute('''SELECT COUNT(*) FROM reading_history 
                 WHERE user_id=? AND DATE(created_at) = DATE('now')''', (user_id,))
    reading_today = c.fetchone()[0]
    
    # Recent activity (last 7 days)
    c.execute('''SELECT COUNT(*) FROM reading_history 
                 WHERE user_id=? AND created_at >= datetime('now', '-7 days')''', (user_id,))
    reading_this_week = c.fetchone()[0]
    
    c.execute('''SELECT COUNT(*) FROM search_history 
                 WHERE user_id=? AND created_at >= datetime('now', '-7 days')''', (user_id,))
    searches_this_week = c.fetchone()[0]
    
    # Favorite genres (from books read)
    c.execute('''SELECT b.genre, COUNT(*) as count
                 FROM reading_history rh
                 JOIN books b ON rh.book_id = b.id
                 WHERE rh.user_id = ?
                 GROUP BY b.genre
                 ORDER BY count DESC
                 LIMIT 5''', (user_id,))
    favorite_genres = [{'genre': row['genre'] or 'Unknown', 'count': row['count']} for row in c.fetchall()]
    
    # Recently read books (last 5)
    c.execute('''SELECT DISTINCT b.id, b.title, b.author, b.genre, b.cover_image, b.subscription_level
                 FROM reading_history rh
                 JOIN books b ON rh.book_id = b.id
                 WHERE rh.user_id = ?
                 ORDER BY rh.created_at DESC
                 LIMIT 5''', (user_id,))
    recently_read = []
    for row in c.fetchall():
        recently_read.append({
            'id': row['id'],
            'title': row['title'],
            'author': row['author'],
            'genre': row['genre'] or '',
            'cover_image': row_get(row, 'cover_image', 'book'),
            'subscription_level': row_get(row, 'subscription_level', 'free')
        })
    
    # Get recommended books - enhanced recommendations for Basic/Premium, basic for Free
    recommended_books = []
    if subscription_level in ['basic', 'premium']:
        # Enhanced recommendations (hybrid) for Basic/Premium users
        try:
            hybrid_recs = hybrid_engine.get_hybrid_recommendations(user_id, conn, top_k=6)
            if hybrid_recs:
                recommended_books = [rec['book'] for rec in hybrid_recs[:6]]
        except:
            # Fallback to content-based recommendations
            c.execute('''SELECT DISTINCT book_id FROM reading_history 
                         WHERE user_id=? ORDER BY created_at DESC LIMIT 1''', (user_id,))
            recent_book = c.fetchone()
            
            if recent_book:
                # Get content-based recommendations for recently read book
                recommendations = get_recommendations(recent_book['book_id'])
                if isinstance(recommendations, tuple):
                    recommended_books = recommendations[0].json if hasattr(recommendations[0], 'json') else []
                else:
                    recommended_books = recommendations.json if hasattr(recommendations, 'json') else []
    else:
        # Basic recommendations for Free users (content-based only)
        c.execute('''SELECT DISTINCT book_id FROM reading_history 
                     WHERE user_id=? ORDER BY created_at DESC LIMIT 1''', (user_id,))
        recent_book = c.fetchone()
        
        if recent_book:
            # Get content-based recommendations for recently read book
            recommendations = get_recommendations(recent_book['book_id'])
            if isinstance(recommendations, tuple):
                recommended_books = recommendations[0].json if hasattr(recommendations[0], 'json') else []
            else:
                recommended_books = recommendations.json if hasattr(recommendations, 'json') else []
    
    # Premium analytics (only for premium users) - BEFORE closing connection
    premium_analytics = None
    if subscription_level == 'premium':
        try:
            # Time-series data for charts (last 30 days)
            c.execute('''SELECT DATE(created_at) as date, COUNT(*) as count
                         FROM reading_history
                         WHERE user_id = ? AND created_at >= datetime('now', '-30 days')
                         GROUP BY DATE(created_at)
                         ORDER BY date''', (user_id,))
            reading_timeline = [{'date': row['date'], 'count': row['count']} for row in c.fetchall()]
            
            c.execute('''SELECT DATE(created_at) as date, COUNT(*) as count
                         FROM search_history
                         WHERE user_id = ? AND created_at >= datetime('now', '-30 days')
                         GROUP BY DATE(created_at)
                         ORDER BY date''', (user_id,))
            search_timeline = [{'date': row['date'], 'count': row['count']} for row in c.fetchall()]
            
            # Reading patterns by day of week
            c.execute('''SELECT strftime('%w', created_at) as day_of_week, COUNT(*) as count
                         FROM reading_history
                         WHERE user_id = ? AND created_at >= datetime('now', '-30 days')
                         GROUP BY strftime('%w', created_at)
                         ORDER BY day_of_week''', (user_id,))
            day_patterns = [{'day': row['day_of_week'], 'count': row['count']} for row in c.fetchall()]
            
            # Most read genres with percentages
            genre_total = sum(g['count'] for g in favorite_genres) if favorite_genres else 0
            genre_breakdown = [{
                'genre': g['genre'],
                'count': g['count'],
                'percentage': round((g['count'] / genre_total * 100), 1) if genre_total > 0 else 0
            } for g in favorite_genres] if favorite_genres else []
            
            premium_analytics = {
                'readingTimeline': reading_timeline,
                'searchTimeline': search_timeline,
                'dayPatterns': day_patterns,
                'genreBreakdown': genre_breakdown
            }
        except Exception as e:
            print(f"Error generating premium analytics: {e}")
            import traceback
            traceback.print_exc()
            premium_analytics = None
    
    conn.close()
    
    dashboard_data = {
        'stats': {
            'total_searches': total_searches,
            'total_reading': total_reading,
            'books_read': books_read,
            'subscription_level': subscription_level,
            'searches_today': searches_today,
            'reading_today': reading_today,
            'reading_this_week': reading_this_week,
            'searches_this_week': searches_this_week
        },
        'favorite_genres': favorite_genres,
        'recently_read': recently_read,
        'recommended_books': recommended_books[:6] if recommended_books else [],
        'premium_analytics': premium_analytics
    }
    
    # Cache for shorter time (1 minute) since user activity changes frequently
    set_cached(cache_key, dashboard_data)
    
    return jsonify(dashboard_data)

# ============================================
# ELASTICSEARCH SYNC
# ============================================

@app.route('/api/admin/elasticsearch/sync', methods=['POST'])
@require_admin
def sync_elasticsearch():
    """Sync all books from SQLite to Elasticsearch"""
    if not es_service.enabled:
        return jsonify({
            'success': False,
            'message': 'Elasticsearch is not enabled or not available'
        }), 400
    
    try:
        conn = get_db()
        success = es_service.sync_all_books(conn)
        conn.close()
        
        if success:
            return jsonify({
                'success': True,
                'message': 'All books synced to Elasticsearch successfully'
            })
        else:
            return jsonify({
                'success': False,
                'message': 'Failed to sync books to Elasticsearch'
            }), 500
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error syncing to Elasticsearch: {str(e)}'
        }), 500

@app.route('/api/admin/elasticsearch/status', methods=['GET'])
@require_admin
def elasticsearch_status():
    """Get Elasticsearch connection status"""
    is_connected = False
    if es_service.enabled and es_service.client:
        try:
            is_connected = es_service.client.ping()
        except:
            pass
    
    return jsonify({
        'enabled': es_service.enabled,
        'available': ELASTICSEARCH_AVAILABLE,
        'host': ELASTICSEARCH_HOST,
        'index': ELASTICSEARCH_INDEX,
        'connected': is_connected
    })

@app.route('/api/recommendations/collaborative', methods=['GET'])
@require_auth
def get_collaborative_recommendations():
    """Get collaborative filtering recommendations based on similar users"""
    user_id = request.current_user['user_id']
    top_k = request.args.get('top_k', 10, type=int)
    
    # Check cache
    cache_key = f"collab_rec_{user_id}_{top_k}"
    cached_recs = get_cached(cache_key)
    if cached_recs is not None:
        return jsonify(cached_recs)
    
    conn = get_db()
    
    # Build user-item matrix
    matrix = collaborative_engine.build_user_item_matrix(conn)
    
    if not matrix:
        conn.close()
        return jsonify({
            'recommendations': [],
            'message': 'Not enough data for collaborative filtering'
        })
    
    # Get collaborative recommendations
    recs = collaborative_engine.get_collaborative_recommendations(user_id, top_k=top_k)
    
    if not recs:
        conn.close()
        return jsonify({
            'recommendations': [],
            'message': 'No recommendations found based on similar users'
        })
    
    # Get book details for recommendations
    book_ids = [rec['book_id'] for rec in recs]
    placeholders = ','.join(['?'] * len(book_ids))
    
    c = conn.cursor()
    c.execute(f'SELECT * FROM books WHERE id IN ({placeholders})', book_ids)
    
    books_dict = {}
    for row in c.fetchall():
        books_dict[row['id']] = {
            'id': row['id'],
            'title': row['title'],
            'author': row['author'],
            'abstract': row['abstract'] if row['abstract'] else '',
            'genre': row['genre'] if row['genre'] else '',
            'academic_level': row['academic_level'] if row['academic_level'] else '',
            'tags': row['tags'].split(',') if row['tags'] else [],
            'cover_image': row_get(row, 'cover_image', 'book'),
            'subscription_level': row_get(row, 'subscription_level', 'free'),
            'pages': row_get(row, 'pages', 0)
        }
    
    conn.close()
    
    # Combine recommendations with book details
    recommendations = []
    recommendation_method = 'collaborative'
    for rec in recs:
        book_id = rec['book_id']
        if book_id in books_dict:
            method = rec.get('method', 'collaborative')
            if method != 'collaborative':
                recommendation_method = method
            recommendations.append({
                'book': books_dict[book_id],
                'collaborative_score': round(rec['score'], 4),
                'confidence_percentage': round(min(rec['score'] * 100, 100), 1),
                'method': method
            })
    
    result = {
        'recommendations': recommendations,
        'type': recommendation_method,
        'total_count': len(recommendations)
    }
    
    # Cache for 10 minutes (collaborative filtering is more stable)
    set_cached(cache_key, result)
    
    return jsonify(result)

@app.route('/api/recommendations/similar-users', methods=['GET'])
@require_auth
def get_similar_users():
    """Get users similar to current user (for analytics/debugging)"""
    user_id = request.current_user['user_id']
    top_k = request.args.get('top_k', 5, type=int)
    
    conn = get_db()
    
    # Build user-item matrix
    matrix = collaborative_engine.build_user_item_matrix(conn)
    
    if not matrix:
        conn.close()
        return jsonify({'similar_users': [], 'message': 'Not enough data'})
    
    # Find similar users
    similar_users = collaborative_engine.find_similar_users(user_id, top_k=top_k)
    
    if not similar_users:
        conn.close()
        return jsonify({'similar_users': [], 'message': 'No similar users found'})
    
    # Get user details
    user_ids = [su['user_id'] for su in similar_users]
    placeholders = ','.join(['?'] * len(user_ids))
    
    c = conn.cursor()
    c.execute(f'''SELECT id, email, first_name, last_name, role, academic_level, department 
                 FROM users WHERE id IN ({placeholders})''', user_ids)
    
    users_dict = {}
    for row in c.fetchall():
        users_dict[row['id']] = {
            'id': row['id'],
            'email': row['email'],
            'name': f"{row['first_name'] or ''} {row['last_name'] or ''}".strip() or row['email'],
            'role': row['role'],
            'academic_level': row['academic_level'],
            'department': row['department']
        }
    
    conn.close()
    
    # Combine with similarity scores
    result = []
    for su in similar_users:
        user_id_sim = su['user_id']
        if user_id_sim in users_dict:
            result.append({
                'user': users_dict[user_id_sim],
                'similarity_score': round(su['similarity'], 4),
                'similarity_percentage': round(su['similarity'] * 100, 1)
            })
    
    return jsonify({
        'similar_users': result,
        'total_count': len(result)
    })

# ============================================
# ADMIN ENDPOINTS
# ============================================

@app.route('/api/admin/users', methods=['GET'])
@require_admin
def admin_users():
    # Get pagination parameters
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 12))
    offset = (page - 1) * per_page
    conn = get_db()
    c = conn.cursor()
    
    # Get total count
    c.execute('''SELECT COUNT(DISTINCT u.id) as total
                 FROM users u''')
    total_count = c.fetchone()[0]
    
    # Get paginated users
    c.execute('''SELECT u.id, u.email, u.first_name, u.last_name, u.avatar, u.role, 
                 u.subscription_level, u.created_at,
                 COUNT(DISTINCT sh.id) as search_count,
                 COUNT(DISTINCT rh.id) as reading_count,
                 COUNT(DISTINCT sr.id) as pending_requests
                 FROM users u
                 LEFT JOIN search_history sh ON u.id = sh.user_id
                 LEFT JOIN reading_history rh ON u.id = rh.user_id
                 LEFT JOIN subscription_requests sr ON u.id = sr.user_id AND sr.status = 'pending'
                 GROUP BY u.id
                 ORDER BY u.created_at DESC
                 LIMIT ? OFFSET ?''', (per_page, offset))
    
    users = []
    for row in c.fetchall():
        users.append({
            'id': row['id'],
            'email': row['email'],
            'firstName': row['first_name'] or '',
            'lastName': row['last_name'] or '',
            'avatar': row['avatar'] or 'user',
            'role': row['role'],
            'subscriptionLevel': row['subscription_level'] or 'free',
            'createdAt': row['created_at'],
            'searchCount': row['search_count'] or 0,
            'readingCount': row['reading_count'] or 0,
            'pendingRequests': row['pending_requests'] or 0
        })
    
    total_pages = (total_count + per_page - 1) // per_page
    
    conn.close()
    return jsonify({
        'users': users,
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': total_count,
            'total_pages': total_pages
        }
    })

@app.route('/api/setup/promote-to-admin', methods=['POST'])
def promote_to_admin():
    """One-time setup endpoint to promote a user to admin (only works if no admins exist)"""
    try:
        data = request.json
        if not data or 'email' not in data:
            return jsonify({'error': 'Email required'}), 400
        
        conn = get_db()
        c = conn.cursor()
        
        # Check if any admin exists
        c.execute("SELECT COUNT(*) FROM users WHERE role = 'admin'")
        admin_count = c.fetchone()[0]
        
        if admin_count > 0:
            conn.close()
            return jsonify({'error': 'Admin users already exist. Use admin account to promote users.'}), 403
        
        # Find user by email (case-insensitive)
        c.execute("SELECT id, email FROM users WHERE LOWER(email) = LOWER(?)", (data['email'],))
        user_row = c.fetchone()
        
        if not user_row:
            conn.close()
            return jsonify({'error': 'User not found'}), 404
        
        # Promote to admin
        c.execute("UPDATE users SET role = 'admin', subscription_level = 'premium' WHERE id = ?", (user_row['id'],))
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': f'User {user_row["email"]} has been promoted to admin'
        })
    except Exception as e:
        if 'conn' in locals():
            conn.close()
        return jsonify({'error': str(e)}), 500

@app.route('/api/setup/reset-admin-password', methods=['POST'])
def reset_admin_password():
    """Reset admin password - only works if admin exists but can't login"""
    try:
        data = request.json
        if not data or 'email' not in data or 'new_password' not in data:
            return jsonify({'error': 'Email and new_password required'}), 400
        
        conn = get_db()
        c = conn.cursor()
        
        # Find admin user by email (case-insensitive)
        c.execute("SELECT id, email, role FROM users WHERE LOWER(email) = LOWER(?) AND role = 'admin'", (data['email'],))
        user_row = c.fetchone()
        
        if not user_row:
            conn.close()
            return jsonify({'error': 'Admin user not found with that email'}), 404
        
        # Hash new password
        import hashlib
        new_password_hash = hashlib.sha256(data['new_password'].encode()).hexdigest()
        
        # Update password
        c.execute("UPDATE users SET password = ? WHERE id = ?", (new_password_hash, user_row['id']))
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': f'Password reset for admin {user_row["email"]}. You can now login with the new password.'
        })
    except Exception as e:
        if 'conn' in locals():
            conn.close()
        return jsonify({'error': str(e)}), 500

@app.route('/api/setup/list-admins', methods=['GET'])
def list_admins():
    """List all admin users (for troubleshooting)"""
    try:
        conn = get_db()
        c = conn.cursor()
        
        c.execute("SELECT id, email, role, subscription_level, created_at FROM users WHERE role = 'admin'")
        admins = []
        for row in c.fetchall():
            admins.append({
                'id': row['id'],
                'email': row['email'],
                'role': row['role'],
                'subscriptionLevel': row['subscription_level'] or 'free',
                'createdAt': row['created_at']
            })
        
        conn.close()
        return jsonify({'admins': admins, 'count': len(admins)})
    except Exception as e:
        if 'conn' in locals():
            conn.close()
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/users/<int:user_id>', methods=['GET', 'PUT'])
@require_admin
def admin_user_detail(user_id):
    conn = get_db()
    c = conn.cursor()
    
    if request.method == 'GET':
        c.execute('''SELECT * FROM users WHERE id=?''', (user_id,))
        user_row = c.fetchone()
        
        if not user_row:
            conn.close()
            return jsonify({'error': 'User not found'}), 404
        
        # Get stats
        c.execute('SELECT COUNT(*) FROM search_history WHERE user_id=?', (user_id,))
        search_count = c.fetchone()[0]
        
        c.execute('SELECT COUNT(*) FROM reading_history WHERE user_id=?', (user_id,))
        reading_count = c.fetchone()[0]
        
        c.execute('SELECT COUNT(DISTINCT book_id) FROM reading_history WHERE user_id=?', (user_id,))
        books_read = c.fetchone()[0]
        
        c.execute('SELECT SUM(duration_minutes) FROM reading_history WHERE user_id=?', (user_id,))
        total_minutes = c.fetchone()[0] or 0
        
        # Get reading history
        c.execute('''SELECT rh.*, b.title, b.author 
                     FROM reading_history rh
                     JOIN books b ON rh.book_id = b.id
                     WHERE rh.user_id=?
                     ORDER BY rh.created_at DESC LIMIT 10''', (user_id,))
        
        reading_history = []
        for row in c.fetchall():
            reading_history.append({
                'title': row['title'],
                'author': row['author'],
                'duration': row['duration_minutes'],
                'date': row['created_at']
            })
        
        user = {
            'id': user_row['id'],
            'email': user_row['email'],
            'firstName': user_row['first_name'] or '',
            'lastName': user_row['last_name'] or '',
            'avatar': user_row['avatar'] or 'user',
            'academicLevel': user_row['academic_level'],
            'role': user_row['role'],
            'subscriptionLevel': user_row['subscription_level'] or 'free',
            'department': user_row['department'] or '',
            'createdAt': user_row['created_at'],
            'lastLogin': row_get(user_row, 'last_login'),
            'stats': {
                'searchCount': search_count,
                'readingCount': reading_count,
                'booksRead': books_read,
                'totalReadingMinutes': total_minutes
            },
            'readingHistory': reading_history
        }
        
        conn.close()
        return jsonify(user)
    
    else:  # PUT - Update user
        data = request.json
        updates = []
        params = []
        
        if 'firstName' in data:
            updates.append('first_name = ?')
            params.append(data['firstName'])
        if 'lastName' in data:
            updates.append('last_name = ?')
            params.append(data['lastName'])
        if 'email' in data:
            updates.append('email = ?')
            params.append(data['email'])
        if 'academicLevel' in data:
            updates.append('academic_level = ?')
            params.append(data['academicLevel'])
        if 'department' in data:
            updates.append('department = ?')
            params.append(data['department'])
        if 'role' in data:
            updates.append('role = ?')
            params.append(data['role'])
            # Automatically set premium subscription for admins
            if data['role'] == 'admin':
                updates.append('subscription_level = ?')
                params.append('premium')
        if 'subscriptionLevel' in data:
            # Only allow subscription updates if not setting role to admin
            if 'role' not in data or data.get('role') != 'admin':
                updates.append('subscription_level = ?')
                params.append(data['subscriptionLevel'])
        
        if not updates:
            conn.close()
            return jsonify({'error': 'No fields to update'}), 400
        
        params.append(user_id)
        query = f"UPDATE users SET {', '.join(updates)} WHERE id=?"
        c.execute(query, params)
        conn.commit()
        conn.close()
        
        return jsonify({'success': True, 'message': 'User updated successfully'})

@app.route('/api/admin/users/<int:user_id>', methods=['DELETE'])
@require_admin
def admin_delete_user(user_id):
    """Delete a user (admin only)"""
    conn = get_db()
    c = conn.cursor()
    
    # Prevent deleting yourself
    if user_id == request.current_user['user_id']:
        conn.close()
        return jsonify({'error': 'Cannot delete your own account'}), 400
    
    # Check if user exists
    c.execute('SELECT id, email, role FROM users WHERE id=?', (user_id,))
    user_row = c.fetchone()
    
    if not user_row:
        conn.close()
        return jsonify({'error': 'User not found'}), 404
    
    # Prevent deleting the last admin
    if user_row['role'] == 'admin':
        c.execute("SELECT COUNT(*) FROM users WHERE role = 'admin'")
        admin_count = c.fetchone()[0]
        if admin_count <= 1:
            conn.close()
            return jsonify({'error': 'Cannot delete the last admin user'}), 400
    
    # Delete user (cascade will handle related records if foreign keys are set up)
    c.execute('DELETE FROM users WHERE id=?', (user_id,))
    conn.commit()
    conn.close()
    
    return jsonify({'success': True, 'message': 'User deleted successfully'})

@app.route('/api/admin/users/<int:user_id>/subscription', methods=['PUT'])
@require_admin
def admin_update_subscription(user_id):
    data = request.json
    subscription_level = data.get('subscription_level')
    
    if not subscription_level:
        return jsonify({'error': 'subscription_level required'}), 400
    
    conn = get_db()
    c = conn.cursor()
    
    c.execute('UPDATE users SET subscription_level = ? WHERE id=?', 
              (subscription_level, user_id))
    
    # Update any pending requests
    c.execute('''UPDATE subscription_requests 
                 SET status = 'approved', approved_at = CURRENT_TIMESTAMP
                 WHERE user_id = ? AND status = 'pending' AND requested_level = ?''',
              (user_id, subscription_level))
    
    conn.commit()
    conn.close()
    
    return jsonify({'success': True, 'message': 'Subscription updated'})

@app.route('/api/admin/users/<int:user_id>/traffic', methods=['GET'])
@require_admin
def admin_user_traffic(user_id):
    conn = get_db()
    c = conn.cursor()
    
    # Get traffic data for last 30 days
    c.execute('''SELECT DATE(created_at) as date, COUNT(*) as searches
                 FROM search_history
                 WHERE user_id = ? AND created_at >= datetime('now', '-30 days')
                 GROUP BY DATE(created_at)''', (user_id,))
    
    traffic_data = []
    for row in c.fetchall():
        c.execute('''SELECT COUNT(*) FROM reading_history 
                     WHERE user_id = ? AND DATE(created_at) = ?''', 
                  (user_id, row['date']))
        readings = c.fetchone()[0]
        traffic_data.append({
            'date': row['date'],
            'searches': row['searches'],
            'readings': readings
        })
    
    # Get popular searches
    c.execute('''SELECT query, COUNT(*) as count
                 FROM search_history
                 WHERE user_id = ?
                 GROUP BY query
                 ORDER BY count DESC
                 LIMIT 10''', (user_id,))
    
    popular_searches = [{'query': row['query'], 'count': row['count']} 
                        for row in c.fetchall()]
    
    # Get popular books
    c.execute('''SELECT b.title, COUNT(*) as read_count
                 FROM reading_history rh
                 JOIN books b ON rh.book_id = b.id
                 WHERE rh.user_id = ?
                 GROUP BY b.id
                 ORDER BY read_count DESC
                 LIMIT 10''', (user_id,))
    
    popular_books = [{'title': row['title'], 'read_count': row['read_count']} 
                     for row in c.fetchall()]
    
    conn.close()
    
    return jsonify({
        'traffic_data': traffic_data,
        'popular_searches': popular_searches,
        'popular_books': popular_books
    })

@app.route('/api/admin/analytics', methods=['GET'])
@require_admin
def admin_analytics():
    conn = get_db()
    c = conn.cursor()
    
    # Total counts
    c.execute('SELECT COUNT(*) FROM users')
    total_users = c.fetchone()[0]
    
    c.execute('SELECT COUNT(*) FROM books')
    total_books = c.fetchone()[0]
    
    c.execute('SELECT COUNT(*) FROM search_history')
    total_searches = c.fetchone()[0]
    
    c.execute('SELECT COUNT(*) FROM reading_history')
    total_reading_sessions = c.fetchone()[0]
    
    # Daily stats
    c.execute('''SELECT COUNT(*) FROM users 
                 WHERE DATE(created_at) = DATE('now')''')
    new_users = c.fetchone()[0]
    
    c.execute('''SELECT COUNT(*) FROM search_history 
                 WHERE DATE(created_at) = DATE('now')''')
    searches = c.fetchone()[0]
    
    c.execute('''SELECT COUNT(*) FROM reading_history 
                 WHERE DATE(created_at) = DATE('now')''')
    reading_sessions = c.fetchone()[0]
    
    c.execute('''SELECT COUNT(*) FROM subscription_requests 
                 WHERE status = 'pending' ''')
    pending_requests = c.fetchone()[0]
    
    # Subscription stats
    c.execute('''SELECT subscription_level, COUNT(*) as count
                 FROM users
                 GROUP BY subscription_level''')
    
    subscription_stats = {}
    for row in c.fetchall():
        subscription_stats[row['subscription_level'] or 'free'] = row['count']
    
    # Popular searches (last 7 days)
    c.execute('''SELECT query, COUNT(*) as count
                 FROM search_history
                 WHERE created_at >= datetime('now', '-7 days')
                 GROUP BY query
                 ORDER BY count DESC
                 LIMIT 10''')
    
    popular_searches = [{'query': row['query'], 'count': row['count']} 
                        for row in c.fetchall()]
    
    # Active users this week
    c.execute('''SELECT u.id, u.first_name || ' ' || u.last_name as name, u.email,
                 COUNT(DISTINCT sh.id) as search_count,
                 COUNT(DISTINCT rh.id) as reading_count
                 FROM users u
                 LEFT JOIN search_history sh ON u.id = sh.user_id AND sh.created_at >= datetime('now', '-7 days')
                 LEFT JOIN reading_history rh ON u.id = rh.user_id AND rh.created_at >= datetime('now', '-7 days')
                 WHERE sh.id IS NOT NULL OR rh.id IS NOT NULL
                 GROUP BY u.id
                 ORDER BY search_count DESC, reading_count DESC
                 LIMIT 10''')
    
    active_users = []
    for row in c.fetchall():
        active_users.append({
            'name': row['name'] or row['email'],
            'email': row['email'],
            'searchCount': row['search_count'] or 0,
            'readingCount': row['reading_count'] or 0
        })
    
    # Time-series data for charts (last 30 days)
    c.execute('''SELECT DATE(created_at) as date, COUNT(*) as count
                 FROM users
                 WHERE created_at >= datetime('now', '-30 days')
                 GROUP BY DATE(created_at)
                 ORDER BY date''')
    user_growth = [{'date': row['date'], 'count': row['count']} for row in c.fetchall()]
    
    c.execute('''SELECT DATE(created_at) as date, COUNT(*) as count
                 FROM search_history
                 WHERE created_at >= datetime('now', '-30 days')
                 GROUP BY DATE(created_at)
                 ORDER BY date''')
    search_trends = [{'date': row['date'], 'count': row['count']} for row in c.fetchall()]
    
    c.execute('''SELECT DATE(created_at) as date, COUNT(*) as count
                 FROM reading_history
                 WHERE created_at >= datetime('now', '-30 days')
                 GROUP BY DATE(created_at)
                 ORDER BY date''')
    reading_trends = [{'date': row['date'], 'count': row['count']} for row in c.fetchall()]
    
    # Genre distribution
    c.execute('''SELECT genre, COUNT(*) as count
                 FROM books
                 WHERE genre IS NOT NULL AND genre != ''
                 GROUP BY genre
                 ORDER BY count DESC
                 LIMIT 10''')
    genre_distribution = [{'genre': row['genre'], 'count': row['count']} for row in c.fetchall()]
    
    # Academic level distribution
    c.execute('''SELECT academic_level, COUNT(*) as count
                 FROM books
                 WHERE academic_level IS NOT NULL AND academic_level != ''
                 GROUP BY academic_level
                 ORDER BY count DESC''')
    academic_distribution = [{'level': row['academic_level'], 'count': row['count']} for row in c.fetchall()]
    
    # Subscription level distribution over time (last 7 days)
    c.execute('''SELECT DATE(created_at) as date, subscription_level, COUNT(*) as count
                 FROM users
                 WHERE created_at >= datetime('now', '-7 days')
                 GROUP BY DATE(created_at), subscription_level
                 ORDER BY date, subscription_level''')
    subscription_trends = {}
    for row in c.fetchall():
        date = row['date']
        level = row['subscription_level'] or 'free'
        if date not in subscription_trends:
            subscription_trends[date] = {}
        subscription_trends[date][level] = row['count']
    
    # Most downloaded books
    c.execute('''SELECT b.id, b.title, b.author, COUNT(rh.id) as download_count
                 FROM books b
                 LEFT JOIN reading_history rh ON b.id = rh.book_id
                 GROUP BY b.id
                 ORDER BY download_count DESC
                 LIMIT 10''')
    top_books = [{
        'id': row['id'],
        'title': row['title'],
        'author': row['author'],
        'downloadCount': row['download_count'] or 0
    } for row in c.fetchall()]
    
    conn.close()
    
    return jsonify({
        'totalStats': {
            'totalUsers': total_users,
            'totalBooks': total_books,
            'totalSearches': total_searches,
            'totalReadingSessions': total_reading_sessions
        },
        'dailyStats': {
            'newUsers': new_users,
            'searches': searches,
            'readingSessions': reading_sessions,
            'pendingRequests': pending_requests
        },
        'subscriptionStats': subscription_stats,
        'popularSearches': popular_searches,
        'activeUsers': active_users,
        'timeSeries': {
            'userGrowth': user_growth,
            'searchTrends': search_trends,
            'readingTrends': reading_trends,
            'subscriptionTrends': subscription_trends
        },
        'distributions': {
            'genres': genre_distribution,
            'academicLevels': academic_distribution
        },
        'topBooks': top_books
    })

@app.route('/api/admin/subscription-requests', methods=['GET'])
@require_admin
def admin_subscription_requests():
    conn = get_db()
    c = conn.cursor()
    
    c.execute('''SELECT sr.*, u.first_name || ' ' || u.last_name as user_name, u.email as user_email
                 FROM subscription_requests sr
                 JOIN users u ON sr.user_id = u.id
                 WHERE sr.status = 'pending'
                 ORDER BY sr.created_at DESC''')
    
    requests = []
    for row in c.fetchall():
        requests.append({
            'id': row['id'],
            'userId': row['user_id'],
            'userName': row['user_name'] or row['user_email'],
            'userEmail': row['user_email'],
            'requestedLevel': row['requested_level'],
            'currentLevel': row_get(row, 'current_level') or 'free',
            'status': row['status'],
            'rejectionMessage': row_get(row, 'rejection_message'),
            'createdAt': row['created_at']
        })
    
    conn.close()
    return jsonify(requests)

@app.route('/api/admin/subscription-requests/<int:request_id>/approve', methods=['POST'])
@require_admin
def approve_subscription_request(request_id):
    """Approve a subscription request"""
    conn = get_db()
    c = conn.cursor()
    
    # Get request details
    c.execute('''SELECT sr.*, u.id as user_id 
                 FROM subscription_requests sr
                 JOIN users u ON sr.user_id = u.id
                 WHERE sr.id = ? AND sr.status = "pending"''', (request_id,))
    request_row = c.fetchone()
    
    if not request_row:
        conn.close()
        return jsonify({'error': 'Request not found or already processed'}), 404
    
    # Update user subscription
    c.execute('UPDATE users SET subscription_level = ? WHERE id = ?', 
              (request_row['requested_level'], request_row['user_id']))
    
    # Update request status
    c.execute('''UPDATE subscription_requests 
                 SET status = 'approved', approved_at = CURRENT_TIMESTAMP
                 WHERE id = ?''', (request_id,))
    
    conn.commit()
    conn.close()
    
    return jsonify({'success': True, 'message': 'Subscription request approved'})

@app.route('/api/admin/subscription-requests/<int:request_id>/reject', methods=['POST'])
@require_admin
def reject_subscription_request(request_id):
    """Reject a subscription request"""
    data = request.json or {}
    rejection_message = data.get('rejection_message', '').strip()
    
    if not rejection_message:
        return jsonify({'error': 'Rejection message is required'}), 400
    
    conn = get_db()
    c = conn.cursor()
    
    # Get request details
    c.execute('SELECT * FROM subscription_requests WHERE id = ? AND status = "pending"', (request_id,))
    request_row = c.fetchone()
    
    if not request_row:
        conn.close()
        return jsonify({'error': 'Request not found or already processed'}), 404
    
    # Update request status with rejection message
    c.execute('''UPDATE subscription_requests 
                 SET status = 'rejected', approved_at = CURRENT_TIMESTAMP, rejection_message = ?
                 WHERE id = ?''', (rejection_message, request_id))
    
    conn.commit()
    conn.close()
    
    return jsonify({'success': True, 'message': 'Subscription request rejected'})

# ============================================
# SUBSCRIPTION MANAGEMENT
# ============================================

@app.route('/api/user/subscription', methods=['GET'])
@require_auth
def user_subscription():
    user_id = request.current_user['user_id']
    conn = get_db()
    c = conn.cursor()
    
    c.execute('SELECT subscription_level FROM users WHERE id=?', (user_id,))
    subscription_level = c.fetchone()[0] or 'free'
    
    c.execute('''SELECT * FROM subscription_requests
                 WHERE user_id = ?
                 ORDER BY created_at DESC''', (user_id,))
    
    request_history = []
    for row in c.fetchall():
        request_history.append({
            'requestedLevel': row['requested_level'],
            'currentLevel': row_get(row, 'current_level') or 'free',
            'status': row['status'],
            'createdAt': row['created_at'],
            'approvedAt': row_get(row, 'approved_at')
        })
    
    conn.close()
    
    return jsonify({
        'subscriptionLevel': subscription_level,
        'requestHistory': request_history
    })

@app.route('/api/user/subscription/request', methods=['POST'])
@require_auth
def request_subscription_upgrade():
    user_id = request.current_user['user_id']
    data = request.json
    requested_level = data.get('subscription_level')
    
    if not requested_level:
        return jsonify({'error': 'subscription_level required'}), 400
    
    conn = get_db()
    c = conn.cursor()
    
    # Get current subscription
    c.execute('SELECT subscription_level FROM users WHERE id=?', (user_id,))
    current_level = c.fetchone()[0] or 'free'
    
    # Create request
    c.execute('''INSERT INTO subscription_requests 
                 (user_id, requested_level, current_level, status)
                 VALUES (?, ?, ?, 'pending')''',
              (user_id, requested_level, current_level))
    
    conn.commit()
    conn.close()
    
    return jsonify({'success': True, 'message': 'Subscription upgrade requested'})

# ============================================
# BOOK REVIEWS AND LIKES
# ============================================

@app.route('/api/books/<int:book_id>/reviews', methods=['GET'])
def get_book_reviews(book_id):
    """Get all reviews for a book"""
    conn = get_db()
    c = conn.cursor()
    
    c.execute('''SELECT r.*, u.first_name || ' ' || u.last_name as user_name, u.email as user_email
                 FROM book_reviews r
                 JOIN users u ON r.user_id = u.id
                 WHERE r.book_id = ?
                 ORDER BY r.created_at DESC''', (book_id,))
    
    reviews = []
    for row in c.fetchall():
        reviews.append({
            'id': row['id'],
            'userId': row['user_id'],
            'userName': row['user_name'] or row['user_email'] or 'Anonymous',
            'userEmail': row['user_email'],
            'rating': row['rating'],
            'comment': row['comment'] or '',
            'createdAt': row['created_at'],
            'updatedAt': row_get(row, 'updated_at')
        })
    
    # Get average rating and total count
    c.execute('''SELECT AVG(rating) as avg_rating, COUNT(*) as total_reviews
                 FROM book_reviews WHERE book_id = ?''', (book_id,))
    stats = c.fetchone()
    
    conn.close()
    return jsonify({
        'reviews': reviews,
        'averageRating': round(stats['avg_rating'] or 0, 1) if stats else 0,
        'totalReviews': stats['total_reviews'] or 0 if stats else 0
    })

@app.route('/api/books/<int:book_id>/reviews', methods=['POST'])
@require_auth
def create_book_review(book_id):
    """Create or update a review for a book"""
    user_id = request.current_user['user_id']
    data = request.json
    rating = data.get('rating')
    comment = data.get('comment', '').strip()
    
    if not rating or rating < 1 or rating > 5:
        return jsonify({'error': 'Rating must be between 1 and 5'}), 400
    
    conn = get_db()
    c = conn.cursor()
    
    # Check if review already exists
    c.execute('SELECT id FROM book_reviews WHERE user_id=? AND book_id=?', (user_id, book_id))
    existing = c.fetchone()
    
    if existing:
        # Update existing review
        c.execute('''UPDATE book_reviews 
                     SET rating=?, comment=?, updated_at=CURRENT_TIMESTAMP
                     WHERE id=?''', (rating, comment, existing['id']))
    else:
        # Create new review
        c.execute('''INSERT INTO book_reviews (user_id, book_id, rating, comment)
                     VALUES (?, ?, ?, ?)''', (user_id, book_id, rating, comment))
    
    conn.commit()
    conn.close()
    
    return jsonify({'success': True, 'message': 'Review saved successfully'})

@app.route('/api/books/<int:book_id>/likes', methods=['GET'])
def get_book_likes(book_id):
    """Get like count and check if current user liked the book"""
    conn = get_db()
    c = conn.cursor()
    
    # Get total likes
    c.execute('SELECT COUNT(*) FROM book_likes WHERE book_id=?', (book_id,))
    total_likes = c.fetchone()[0]
    
    # Check if current user liked it
    user_liked = False
    auth_header = request.headers.get('Authorization')
    if auth_header:
        try:
            token = auth_header.split(' ')[1]
            payload = verify_token(token)
            if payload:
                c.execute('SELECT id FROM book_likes WHERE user_id=? AND book_id=?', 
                         (payload['user_id'], book_id))
                user_liked = c.fetchone() is not None
        except:
            pass
    
    conn.close()
    return jsonify({
        'totalLikes': total_likes,
        'userLiked': user_liked
    })

@app.route('/api/books/<int:book_id>/likes', methods=['POST', 'DELETE'])
@require_auth
def toggle_book_like(book_id):
    """Like or unlike a book"""
    user_id = request.current_user['user_id']
    conn = get_db()
    c = conn.cursor()
    
    if request.method == 'POST':
        # Like the book
        try:
            c.execute('''INSERT INTO book_likes (user_id, book_id)
                         VALUES (?, ?)''', (user_id, book_id))
            conn.commit()
            action = 'liked'
        except sqlite3.IntegrityError:
            # Already liked
            conn.close()
            return jsonify({'success': True, 'message': 'Already liked', 'action': 'liked'})
    else:
        # Unlike the book
        c.execute('DELETE FROM book_likes WHERE user_id=? AND book_id=?', (user_id, book_id))
        conn.commit()
        action = 'unliked'
    
    # Get updated count
    c.execute('SELECT COUNT(*) FROM book_likes WHERE book_id=?', (book_id,))
    total_likes = c.fetchone()[0]
    
    conn.close()
    return jsonify({
        'success': True,
        'action': action,
        'totalLikes': total_likes
    })

# ============================================
# CATEGORIES
# ============================================

@app.route('/api/categories', methods=['GET'])
def categories():
    conn = get_db()
    c = conn.cursor()
    
    c.execute('SELECT * FROM categories ORDER BY name')
    categories = []
    for row in c.fetchall():
        category_name = row['name']
        
        # Get book count for this category (matching genre field)
        c.execute('SELECT COUNT(*) FROM books WHERE genre = ?', (category_name,))
        book_count = c.fetchone()[0]
        
        categories.append({
            'id': row['id'],
            'name': category_name,
            'description': row['description'] or '',
            'color': row['color'] or '#667eea',
            'icon': row_get(row, 'icon') or 'BookOpen',
            'book_count': book_count
        })
    
    conn.close()
    return jsonify(categories)

@app.route('/api/categories/<category_name>/books', methods=['GET'])
@require_auth
def get_books_by_category(category_name):
    """Get books by category name (genre match)"""
    user_id = request.current_user['user_id']
    
    # Get user subscription
    conn = get_db()
    c = conn.cursor()
    c.execute('SELECT subscription_level FROM users WHERE id=?', (user_id,))
    user_row = c.fetchone()
    user_subscription = user_row['subscription_level'] or 'free' if user_row else 'free'
    
    # Build query with subscription filter
    if user_subscription == 'free':
        base_query = "SELECT * FROM books WHERE genre = ? AND subscription_level = 'free'"
        params = [category_name]
    elif user_subscription == 'basic':
        base_query = "SELECT * FROM books WHERE genre = ? AND subscription_level IN ('free', 'basic')"
        params = [category_name]
    else:
        base_query = "SELECT * FROM books WHERE genre = ?"
        params = [category_name]
    
    # Get pagination
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 12))
    offset = (page - 1) * per_page
    
    # Get total count
    count_query = base_query.replace('SELECT *', 'SELECT COUNT(*)')
    c.execute(count_query, params)
    total_count = c.fetchone()[0]
    
    # Get books with pagination
    query = f"{base_query} ORDER BY created_at DESC LIMIT ? OFFSET ?"
    c.execute(query, params + [per_page, offset])
    
    books = []
    for row in c.fetchall():
        books.append({
            'id': row['id'],
            'title': row['title'],
            'author': row['author'],
            'abstract': row['abstract'] if row['abstract'] else '',
            'genre': row['genre'] if row['genre'] else '',
            'academic_level': row['academic_level'] if row['academic_level'] else '',
            'tags': row['tags'].split(',') if row['tags'] else [],
            'cover_image': row_get(row, 'cover_image', 'book'),
            'subscription_level': row_get(row, 'subscription_level', 'free'),
            'pages': row_get(row, 'pages', 0),
            'file_url': row_get(row, 'file_url', '')
        })
    
    conn.close()
    
    total_pages = (total_count + per_page - 1) // per_page
    
    return jsonify({
        'books': books,
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': total_count,
            'total_pages': total_pages
        },
        'category': category_name
    })

@app.route('/api/admin/categories', methods=['POST'])
@require_admin
def admin_create_category():
    """Create a new category (admin only)"""
    data = request.json
    name = data.get('name')
    description = data.get('description', '')
    color = data.get('color', '#667eea')
    
    if not name:
        return jsonify({'error': 'Category name is required'}), 400
    
    conn = get_db()
    c = conn.cursor()
    
    try:
        c.execute('''INSERT INTO categories (name, description, color)
                     VALUES (?, ?, ?)''', (name, description, color))
        conn.commit()
        category_id = c.lastrowid
        
        c.execute('SELECT * FROM categories WHERE id=?', (category_id,))
        row = c.fetchone()
        conn.close()
        
        return jsonify({
            'id': row['id'],
            'name': row['name'],
            'description': row['description'] or '',
            'color': row['color'] or '#667eea',
            'icon': row['icon'] or 'BookOpen'
        }), 201
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({'error': 'Category with this name already exists'}), 400
    except Exception as e:
        conn.close()
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/categories/<int:category_id>', methods=['PUT', 'DELETE'])
@require_admin
def admin_manage_category(category_id):
    """Update or delete a category (admin only)"""
    conn = get_db()
    c = conn.cursor()
    
    # Verify category exists
    c.execute('SELECT * FROM categories WHERE id=?', (category_id,))
    category = c.fetchone()
    
    if not category:
        conn.close()
        return jsonify({'error': 'Category not found'}), 404
    
    if request.method == 'PUT':
        # Update category
        data = request.json
        updates = []
        params = []
        
        if 'name' in data:
            updates.append('name = ?')
            params.append(data['name'])
        if 'description' in data:
            updates.append('description = ?')
            params.append(data['description'])
        if 'color' in data:
            updates.append('color = ?')
            params.append(data['color'])
        if 'icon' in data:
            updates.append('icon = ?')
            params.append(data['icon'])
        
        if not updates:
            conn.close()
            return jsonify({'error': 'No fields to update'}), 400
        
        params.append(category_id)
        try:
            query = f"UPDATE categories SET {', '.join(updates)} WHERE id=?"
            c.execute(query, params)
            conn.commit()
            
            c.execute('SELECT * FROM categories WHERE id=?', (category_id,))
            row = c.fetchone()
            conn.close()
            
            return jsonify({
                'id': row['id'],
                'name': row['name'],
                'description': row['description'] or '',
                'color': row['color'] or '#667eea',
                'icon': row['icon'] or 'BookOpen'
            })
        except sqlite3.IntegrityError:
            conn.close()
            return jsonify({'error': 'Category with this name already exists'}), 400
        except Exception as e:
            conn.close()
            return jsonify({'error': str(e)}), 500
    
    elif request.method == 'DELETE':
        # Delete category
        try:
            c.execute('DELETE FROM categories WHERE id=?', (category_id,))
            conn.commit()
            conn.close()
            return jsonify({'success': True, 'message': 'Category deleted successfully'})
        except Exception as e:
            conn.close()
            return jsonify({'error': str(e)}), 500

# ============================================
# PROFILE MANAGEMENT
# ============================================

@app.route('/api/user/profile', methods=['GET', 'PUT'])
@require_auth
def user_profile():
    """Get or update current user's profile"""
    user_id = request.current_user['user_id']
    conn = get_db()
    c = conn.cursor()
    
    if request.method == 'GET':
        # Get user profile
        c.execute('''SELECT id, email, first_name, last_name, avatar, academic_level, 
                     department, role, subscription_level, created_at, last_login
                     FROM users WHERE id=?''', (user_id,))
        user_row = c.fetchone()
        
        if not user_row:
            conn.close()
            return jsonify({'error': 'User not found'}), 404
        
        # Get user stats
        c.execute('SELECT COUNT(*) FROM search_history WHERE user_id=?', (user_id,))
        search_count = c.fetchone()[0]
        
        c.execute('SELECT COUNT(*) FROM reading_history WHERE user_id=?', (user_id,))
        reading_count = c.fetchone()[0]
        
        c.execute('SELECT COUNT(DISTINCT book_id) FROM reading_history WHERE user_id=?', (user_id,))
        books_read = c.fetchone()[0]
        
        profile = {
            'id': user_row['id'],
            'email': user_row['email'],
            'firstName': user_row['first_name'] or '',
            'lastName': user_row['last_name'] or '',
            'avatar': user_row['avatar'] or 'user',
            'academicLevel': user_row['academic_level'] or '',
            'department': user_row['department'] or '',
            'role': user_row['role'],
            'subscriptionLevel': user_row['subscription_level'] or 'free',
            'createdAt': user_row['created_at'],
            'lastLogin': row_get(user_row, 'last_login'),
            'stats': {
                'searchCount': search_count,
                'readingCount': reading_count,
                'booksRead': books_read
            }
        }
        
        conn.close()
        return jsonify(profile)
    
    elif request.method == 'PUT':
        # Update user profile
        data = request.json
        updates = []
        params = []
        
        if 'firstName' in data:
            updates.append('first_name = ?')
            params.append(data['firstName'])
        if 'lastName' in data:
            updates.append('last_name = ?')
            params.append(data['lastName'])
        if 'email' in data:
            # Check if email is already taken by another user
            c.execute('SELECT id FROM users WHERE email = ? AND id != ?', (data['email'], user_id))
            if c.fetchone():
                conn.close()
                return jsonify({'error': 'Email already in use'}), 400
            updates.append('email = ?')
            params.append(data['email'])
        if 'academicLevel' in data:
            updates.append('academic_level = ?')
            params.append(data['academicLevel'])
        if 'department' in data:
            updates.append('department = ?')
            params.append(data['department'])
        
        if not updates:
            conn.close()
            return jsonify({'error': 'No fields to update'}), 400
        
        params.append(user_id)
        try:
            query = f"UPDATE users SET {', '.join(updates)} WHERE id=?"
            c.execute(query, params)
            conn.commit()
            
            # Get updated user data
            c.execute('''SELECT id, email, first_name, last_name, avatar, academic_level, 
                         department, role, subscription_level FROM users WHERE id=?''', (user_id,))
            user_row = c.fetchone()
            
            updated_profile = {
                'id': user_row['id'],
                'email': user_row['email'],
                'firstName': user_row['first_name'] or '',
                'lastName': user_row['last_name'] or '',
                'avatar': user_row['avatar'] or 'user',
                'academicLevel': user_row['academic_level'] or '',
                'department': user_row['department'] or '',
                'role': user_row['role'],
                'subscriptionLevel': user_row['subscription_level'] or 'free'
            }
            
            conn.close()
            return jsonify({'success': True, 'message': 'Profile updated successfully', 'user': updated_profile})
        except Exception as e:
            conn.close()
            return jsonify({'error': str(e)}), 500

@app.route('/api/user/profile/avatar', methods=['POST', 'DELETE'])
@require_auth
def user_profile_avatar():
    """Upload or delete user profile avatar"""
    user_id = request.current_user['user_id']
    
    if request.method == 'POST':
        # Upload avatar
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename, ALLOWED_COVER_EXTENSIONS):
            return jsonify({'error': f'Image type not allowed. Allowed types: {", ".join(ALLOWED_COVER_EXTENSIONS)}'}), 400
        
        try:
            # Create avatars directory if it doesn't exist
            avatars_dir = os.path.join(UPLOAD_FOLDER, 'avatars')
            os.makedirs(avatars_dir, exist_ok=True)
            
            # Generate unique filename
            file_ext = file.filename.rsplit('.', 1)[1].lower()
            filename = f"avatar_{user_id}_{int(time.time())}.{file_ext}"
            file_path = os.path.join(avatars_dir, filename)
            
            # Save file
            file.save(file_path)
            
            # Update user avatar in database
            avatar_url = f'/api/files/avatars/{filename}'
            conn = get_db()
            c = conn.cursor()
            
            # Get old avatar to delete it later
            c.execute('SELECT avatar FROM users WHERE id=?', (user_id,))
            old_avatar = c.fetchone()['avatar'] or 'user'
            
            c.execute('UPDATE users SET avatar = ? WHERE id=?', (avatar_url, user_id))
            conn.commit()
            
            # Get updated avatar value before closing connection
            c.execute('SELECT avatar FROM users WHERE id=?', (user_id,))
            updated_avatar = c.fetchone()['avatar']
            conn.close()
            
            # Delete old avatar file if it's not the default 'user'
            if old_avatar and old_avatar != 'user' and old_avatar.startswith('/api/files/avatars/'):
                old_file_path = os.path.join(UPLOAD_FOLDER, 'avatars', os.path.basename(old_avatar))
                if os.path.exists(old_file_path):
                    try:
                        os.remove(old_file_path)
                    except:
                        pass  # Ignore errors when deleting old file
            
            return jsonify({
                'success': True,
                'message': 'Avatar uploaded successfully',
                'avatar_url': avatar_url,
                'avatar': updated_avatar
            }), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    elif request.method == 'DELETE':
        # Delete avatar (reset to default)
        try:
            conn = get_db()
            c = conn.cursor()
            
            # Get current avatar
            c.execute('SELECT avatar FROM users WHERE id=?', (user_id,))
            current_avatar = c.fetchone()['avatar'] or 'user'
            
            # Reset to default
            c.execute('UPDATE users SET avatar = ? WHERE id=?', ('user', user_id))
            conn.commit()
            conn.close()
            
            # Delete avatar file if it exists
            if current_avatar and current_avatar != 'user' and current_avatar.startswith('/api/files/avatars/'):
                file_path = os.path.join(UPLOAD_FOLDER, 'avatars', os.path.basename(current_avatar))
                if os.path.exists(file_path):
                    try:
                        os.remove(file_path)
                    except:
                        pass  # Ignore errors when deleting file
            
            return jsonify({
                'success': True,
                'message': 'Avatar removed successfully'
            }), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500

@app.route('/api/files/avatars/<filename>')
def serve_avatar(filename):
    """Serve avatar images"""
    try:
        avatars_dir = os.path.join(UPLOAD_FOLDER, 'avatars')
        file_path = os.path.join(avatars_dir, filename)
        
        if not os.path.exists(file_path):
            return jsonify({'error': 'Avatar not found'}), 404
        
        # Determine content type based on file extension
        mimetype = None
        if filename.lower().endswith('.png'):
            mimetype = 'image/png'
        elif filename.lower().endswith(('.jpg', '.jpeg')):
            mimetype = 'image/jpeg'
        elif filename.lower().endswith('.gif'):
            mimetype = 'image/gif'
        elif filename.lower().endswith('.webp'):
            mimetype = 'image/webp'
        
        # Use send_from_directory like other file endpoints
        response = send_from_directory(avatars_dir, filename, mimetype=mimetype)
        
        # Add cache control headers but allow revalidation
        response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        response.headers['Pragma'] = 'no-cache'
        response.headers['Expires'] = '0'
        
        return response
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============================================
# FILE HANDLING HELPERS
# ============================================

def allowed_file(filename, allowed_set):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_set

def get_file_path(book_id, filename, folder_type='book'):
    """Generate secure file path for uploaded files"""
    folder = BOOKS_FOLDER if folder_type == 'book' else COVERS_FOLDER
    # Use book_id and secure filename to prevent conflicts
    name, ext = os.path.splitext(secure_filename(filename))
    safe_filename = f"{book_id}_{name}{ext}"
    return os.path.join(folder, safe_filename)

# ============================================
# FILE UPLOAD & DOWNLOAD ENDPOINTS
# ============================================

@app.route('/api/books/<int:book_id>/upload', methods=['POST'])
@require_admin
def upload_book_file(book_id):
    """Upload book file (PDF, EPUB, etc.)"""
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if not allowed_file(file.filename, ALLOWED_EXTENSIONS):
        return jsonify({'error': f'File type not allowed. Allowed types: {", ".join(ALLOWED_EXTENSIONS)}'}), 400
    
    try:
        # Verify book exists
        conn = get_db()
        c = conn.cursor()
        c.execute('SELECT id FROM books WHERE id=?', (book_id,))
        if not c.fetchone():
            conn.close()
            return jsonify({'error': 'Book not found'}), 404
        
        # Save file
        file_path = get_file_path(book_id, file.filename, 'book')
        file.save(file_path)
        
        # Update book record with file URL
        file_url = f'/api/files/books/{os.path.basename(file_path)}'
        c.execute('UPDATE books SET file_url=? WHERE id=?', (file_url, book_id))
        conn.commit()
        conn.close()
        
        # Clear cache for this book
        clear_cache('books_')
        
        return jsonify({
            'success': True,
            'message': 'File uploaded successfully',
            'file_url': file_url
        }), 200
    except RequestEntityTooLarge:
        return jsonify({'error': 'File too large. Maximum size is 100MB'}), 413
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/books/<int:book_id>/upload-cover', methods=['POST'])
@require_admin
def upload_book_cover(book_id):
    """Upload book cover image"""
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if not allowed_file(file.filename, ALLOWED_COVER_EXTENSIONS):
        return jsonify({'error': f'Image type not allowed. Allowed types: {", ".join(ALLOWED_COVER_EXTENSIONS)}'}), 400
    
    try:
        # Verify book exists
        conn = get_db()
        c = conn.cursor()
        c.execute('SELECT id FROM books WHERE id=?', (book_id,))
        if not c.fetchone():
            conn.close()
            return jsonify({'error': 'Book not found'}), 404
        
        # Save cover image
        file_path = get_file_path(book_id, file.filename, 'cover')
        file.save(file_path)
        
        # Update book record with cover image URL
        cover_url = f'/api/files/covers/{os.path.basename(file_path)}'
        c.execute('UPDATE books SET cover_image=? WHERE id=?', (cover_url, book_id))
        conn.commit()
        conn.close()
        
        # Clear cache for this book
        clear_cache('books_')
        
        return jsonify({
            'success': True,
            'message': 'Cover uploaded successfully',
            'cover_url': cover_url
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/files/books/<filename>')
@require_auth
def download_book_file(filename):
    """Download book file with access control"""
    try:
        # Extract book_id from filename (format: book_id_filename.ext)
        book_id = int(filename.split('_')[0])
        
        # Check user subscription level and book access
        conn = get_db()
        c = conn.cursor()
        
        # Get book subscription level
        c.execute('SELECT subscription_level FROM books WHERE id=?', (book_id,))
        book_row = c.fetchone()
        if not book_row:
            conn.close()
            return jsonify({'error': 'Book not found'}), 404
        
        book_subscription = book_row['subscription_level'] or 'free'
        
        # Get user subscription level from database
        user_id = request.current_user['user_id']
        c.execute('SELECT subscription_level FROM users WHERE id=?', (user_id,))
        user_row = c.fetchone()
        user_subscription = user_row['subscription_level'] or 'free' if user_row else 'free'
        
        # Check access rights
        if book_subscription == 'premium' and user_subscription != 'premium':
            conn.close()
            return jsonify({'error': 'Premium subscription required'}), 403
        elif book_subscription == 'basic' and user_subscription not in ['basic', 'premium']:
            conn.close()
            return jsonify({'error': 'Basic subscription required'}), 403
        
        conn.close()
        
        # Serve file
        return send_from_directory(BOOKS_FOLDER, filename, as_attachment=True)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/files/covers/<filename>')
def get_book_cover(filename):
    """Get book cover image (public access)"""
    try:
        return send_from_directory(COVERS_FOLDER, filename)
    except Exception as e:
        return jsonify({'error': 'Cover not found'}), 404

@app.route('/api/files/preview/<int:book_id>')
@require_auth
def preview_book(book_id):
    """Preview book file (if PDF)"""
    try:
        conn = get_db()
        c = conn.cursor()
        c.execute('SELECT file_url, subscription_level FROM books WHERE id=?', (book_id,))
        book_row = c.fetchone()
        
        if not book_row or not book_row['file_url']:
            conn.close()
            return jsonify({'error': 'Book file not found'}), 404
        
        # Check access rights
        book_subscription = book_row['subscription_level'] or 'free'
        
        # Get user subscription level from database
        user_id = request.current_user['user_id']
        c.execute('SELECT subscription_level FROM users WHERE id=?', (user_id,))
        user_row = c.fetchone()
        user_subscription = user_row['subscription_level'] or 'free' if user_row else 'free'
        
        if book_subscription == 'premium' and user_subscription != 'premium':
            conn.close()
            return jsonify({'error': 'Premium subscription required'}), 403
        elif book_subscription == 'basic' and user_subscription not in ['basic', 'premium']:
            conn.close()
            return jsonify({'error': 'Basic subscription required'}), 403
        
        conn.close()
        
        # Extract filename from URL
        filename = book_row['file_url'].split('/')[-1]
        
        # For PDF preview, return file with inline disposition
        if filename.lower().endswith('.pdf'):
            return send_from_directory(BOOKS_FOLDER, filename, mimetype='application/pdf')
        else:
            # For other file types, return download
            return send_from_directory(BOOKS_FOLDER, filename, as_attachment=True)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============================================
# FEEDBACK (Enhanced)
# ============================================

@app.route('/api/feedback', methods=['POST'])
@require_auth
def submit_feedback():
    data = request.json
    conn = get_db()
    c = conn.cursor()
    
    c.execute('''INSERT INTO feedback 
                 (user_id, book_id, is_helpful, query, type, message, rating)
                 VALUES (?, ?, ?, ?, ?, ?, ?)''',
              (request.current_user['user_id'],
               data.get('book_id'),
               data.get('is_helpful', True),
               data.get('query', ''),
               data.get('type', 'general'),
               data.get('message', ''),
               data.get('rating', 0)))
    
    conn.commit()
    conn.close()
    
    # Clear collaborative filtering cache when feedback changes
    clear_cache('collab_rec_')
    clear_cache('dashboard_')
    
    return jsonify({'success': True, 'message': 'Feedback submitted successfully'})

# ============================================
# AI LEARNING LOOP - RECOMMENDATION TRACKING
# ============================================

@app.route('/api/recommendations/<recommendation_id>/feedback', methods=['POST'])
@require_auth
def submit_recommendation_feedback(recommendation_id):
    """Submit feedback on a specific recommendation"""
    data = request.json
    clicked = data.get('clicked', False)
    rating = data.get('rating')
    feedback_type = data.get('feedback_type', 'click')
    
    conn = get_db()
    
    try:
        success = ai_learning_loop.record_recommendation_feedback(
            conn, recommendation_id, clicked=clicked, rating=rating, feedback_type=feedback_type
        )
        conn.close()
        
        if success:
            return jsonify({'success': True, 'message': 'Recommendation feedback recorded'})
        else:
            return jsonify({'error': 'Failed to record feedback'}), 500
    except Exception as e:
        conn.close()
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/recommendations/performance', methods=['GET'])
@require_admin
def get_recommendation_performance():
    """Get recommendation performance metrics"""
    recommendation_type = request.args.get('type')
    days = request.args.get('days', 30, type=int)
    
    conn = get_db()
    metrics = ai_learning_loop.get_recommendation_performance(conn, recommendation_type, days)
    conn.close()
    
    return jsonify({
        'metrics': metrics,
        'period_days': days,
        'recommendation_type': recommendation_type or 'all'
    })

@app.route('/api/admin/recommendations/patterns', methods=['GET'])
@require_admin
def get_feedback_patterns():
    """Analyze feedback patterns"""
    recommendation_type = request.args.get('type')
    
    conn = get_db()
    patterns = ai_learning_loop.analyze_feedback_patterns(conn, recommendation_type)
    suggestions = ai_learning_loop.get_improvement_suggestions(conn)
    conn.close()
    
    return jsonify({
        'patterns': patterns,
        'suggestions': suggestions,
        'recommendation_type': recommendation_type or 'all'
    })

@app.route('/api/user/recommendations/feedback-summary', methods=['GET'])
@require_auth
def get_user_feedback_summary():
    """Get feedback summary for current user"""
    user_id = request.current_user['user_id']
    
    conn = get_db()
    summary = ai_learning_loop.get_user_feedback_summary(conn, user_id)
    conn.close()
    
    return jsonify({
        'summary': summary,
        'user_id': user_id
    })

# ============================================
# HEALTH CHECK
# ============================================

@app.route('/api/health')
def health_check():
    return jsonify({'status': 'OK', 'service': 'BookGenie Backend'})

# ============================================
# MAIN
# ============================================

if __name__ == '__main__':
    print("Starting BookGenie Backend...")
    init_db()
    load_sample_data()
    print("Database initialized with sample data")
    print("Sample books loaded")
    print("Pre-created users:")
    print("   Admin: admin@bookgenie.edu / admin123")
    print("   Student: student@university.edu / student123")
    print("Server will run at: http://localhost:5000")
    print("API endpoints available at: http://localhost:5000/api/*")
    print("\nStarting server...")
    app.run(debug=True, host='0.0.0.0', port=5000)


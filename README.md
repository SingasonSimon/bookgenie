# BookGenie - AI-Powered Academic Library Assistant

[![Status](https://img.shields.io/badge/Status-Active-success)](https://github.com)
[![Python](https://img.shields.io/badge/Backend-Flask-blue)](https://flask.palletsprojects.com/)
[![Frontend](https://img.shields.io/badge/Frontend-HTML%2FJS-orange)](https://developer.mozilla.org/)
[![AI](https://img.shields.io/badge/AI-SentenceTransformers-yellow)](https://www.sbert.net/)

BookGenie is an intelligent, AI-powered academic library assistant designed to revolutionize how students and researchers discover and access study materials. Unlike traditional keyword-based search engines, BookGenie leverages **semantic search** technology to understand the meaning and context of queries, delivering highly relevant results even when exact keywords don't match.

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Development](#development)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

## Overview

BookGenie provides a comprehensive academic library management system with AI-powered semantic search capabilities. The platform enables users to search for academic resources using natural language queries, receive personalized recommendations, and manage their reading history. Administrators can manage users, books, and analyze system usage through an intuitive dashboard interface.

### Core Capabilities

- **Semantic Search**: Natural language queries that understand context and meaning
- **Intelligent Recommendations**: AI-powered book suggestions based on reading history and preferences
- **User Management**: Role-based access control with student and administrator roles
- **Subscription Management**: Tiered access levels (Free, Basic, Premium)
- **Reading Analytics**: Track reading sessions, search history, and user engagement
- **Admin Dashboard**: Comprehensive analytics and user management tools

## Key Features

### For Students

- **Semantic Search**: Find books by asking natural language questions (e.g., "How does climate change affect agriculture?")
- **Intelligent Recommendations**: Discover similar books based on content similarity using vector embeddings
- **Reading History**: Track reading sessions and access history
- **Personalized Dashboard**: View statistics, recommendations, and recent activity
- **Subscription Management**: Request subscription upgrades and view subscription history

### For Administrators

- **User Management**: View, edit, and manage all user accounts
- **Book Management**: Add, edit, and manage book catalog
- **Analytics Dashboard**: View system-wide statistics, popular searches, and user activity
- **Subscription Requests**: Approve or deny subscription upgrade requests
- **Traffic Analytics**: Monitor individual user activity and engagement metrics

## Architecture

### Backend (Python Flask)

- **Framework**: Flask 2.3.3 (RESTful API)
- **Database**: SQLite with automatic schema migrations
- **AI Engine**: SentenceTransformers (Hugging Face)
  - Model: `all-MiniLM-L6-v2` (384-dimensional embeddings)
  - Technique: Cosine similarity for relevance ranking
- **Authentication**: JWT (JSON Web Tokens) with token-based authorization
- **CORS**: Enabled for cross-origin requests

### Frontend (Vanilla Web Technologies)

- **Structure**: Modular HTML/CSS/JavaScript architecture
- **Styling**: Professional CSS with CSS custom properties (variables)
- **JavaScript**: ES6+ with organized, modular code structure
- **Communication**: Asynchronous fetch API calls to Flask backend
- **Responsive Design**: Mobile-first approach with media queries

## Technology Stack

### Backend Dependencies

```
flask==2.3.3
flask-cors==4.0.0
PyJWT==2.8.0
numpy==1.26.4
scikit-learn==1.3.2
sentence-transformers==2.2.2
```

### Frontend Technologies

- HTML5
- CSS3 (with CSS Grid and Flexbox)
- JavaScript (ES6+)
- No external frameworks (vanilla JavaScript)

## Installation

### Prerequisites

- Python 3.10 - 3.12
- pip (Python package manager)
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Quick Start

#### Option 1: Automated Setup (Windows)

1. Open PowerShell in the project root directory
2. Run the startup script:
   ```powershell
   .\start_bookgenie.ps1
   ```
   This script will:
   - Verify Python environment
   - Launch backend server on port 5000
   - Launch frontend server on port 8000
   - Open browser automatically

#### Option 2: Manual Setup

**Backend Setup:**

```bash
cd Backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the server
python app.py
```

The backend will start on `http://localhost:5000`

**Frontend Setup:**

Open a new terminal:

```bash
cd Frontend

# Start HTTP server
python -m http.server 8000
# Or: python3 -m http.server 8000
```

The frontend will be available at `http://localhost:8000`

## Configuration

### Environment Variables

Currently, the application uses default configuration. For production deployment, consider setting:

- `JWT_SECRET`: Secret key for JWT token signing
- `DATABASE_URL`: Database connection string
- `FLASK_ENV`: Environment (development/production)
- `CORS_ORIGINS`: Allowed CORS origins

### Database

The application uses SQLite by default (`Backend/bookgenie.db`). The database is automatically initialized and migrated on first run. For production, consider migrating to PostgreSQL or MySQL.

### Default Users

The system pre-populates with these test accounts:

- **Admin**: `admin@bookgenie.edu` / `admin123`
- **Student**: `student@university.edu` / `student123`

**Note**: Change these passwords in production environments.

## Usage

### Accessing the Application

1. Start the backend server (see Installation)
2. Start the frontend server (see Installation)
3. Open browser to `http://localhost:8000`
4. Navigate to login page or register a new account

### Basic Workflow

1. **Registration/Login**: Create an account or login with existing credentials
2. **Search**: Use the search bar to find books using natural language queries
3. **Browse**: Explore books by category or view recommendations
4. **Read**: Click on books to view details and access reading features
5. **Dashboard**: View personal statistics and reading history

### Admin Features

1. Login with admin account
2. Access admin dashboard from navigation
3. Manage users, books, and view analytics
4. Approve subscription requests

## API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and receive JWT token
- `POST /api/auth/verify` - Verify JWT token validity
- `POST /api/auth/logout` - Logout (client-side token removal)

### Book Endpoints

- `GET /api/books` - Get all books (filtered by subscription level)
- `POST /api/books` - Add new book (admin only)
- `GET /api/books/<id>/recommendations` - Get book recommendations
- `POST /api/books/<id>/read` - Record reading session

### Search Endpoints

- `POST /api/search` - Semantic search with natural language queries

### Student Endpoints

- `GET /api/student/dashboard` - Get student dashboard data

### Admin Endpoints

- `GET /api/admin/users` - List all users
- `GET /api/admin/users/<id>` - Get user details
- `PUT /api/admin/users/<id>` - Update user
- `PUT /api/admin/users/<id>/subscription` - Update user subscription
- `GET /api/admin/users/<id>/traffic` - Get user traffic analytics
- `GET /api/admin/analytics` - Get admin analytics
- `GET /api/admin/subscription-requests` - Get pending requests

### Subscription Endpoints

- `GET /api/user/subscription` - Get user subscription info
- `POST /api/user/subscription/request` - Request subscription upgrade

### Other Endpoints

- `GET /api/categories` - Get all categories
- `POST /api/feedback` - Submit feedback
- `GET /api/health` - Health check

### Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Project Structure

```
bookgenie/
├── Backend/                    # Server-side application
│   ├── app.py                  # Main Flask application (1,288 lines)
│   ├── app_old.py              # Backup of original version
│   ├── requirements.txt        # Python dependencies
│   ├── bookgenie.db            # SQLite database (auto-generated)
│   └── venv/                   # Python virtual environment
│
├── Frontend/                   # Client-side application
│   ├── index.html              # Main landing/search page
│   ├── dashboard.html          # User dashboard (424 lines)
│   ├── login.html              # Login page
│   ├── register.html           # Registration page
│   ├── css/
│   │   └── dashboard.css       # Dashboard stylesheet (1,232 lines)
│   ├── js/
│   │   └── dashboard.js        # Dashboard JavaScript (1,429 lines)
│   ├── styles.css              # Global styles
│   └── app.js                  # Utility JavaScript
│
├── .gitignore                  # Git ignore rules
├── README.md                   # This file
├── PROJECT_ANALYSIS.md         # Project analysis document
├── IMPLEMENTATION_COMPLETE.md  # Implementation status
├── NEXT_STEPS.md               # Next steps guide
└── start_bookgenie.ps1         # Windows startup script
```

## Development

### Code Organization

- **Backend**: Modular Flask application with clear separation of concerns
- **Frontend**: Separated HTML, CSS, and JavaScript files
- **Database**: SQLite with automatic migrations
- **Authentication**: JWT-based with decorators for route protection

### Adding New Features

1. **Backend**: Add routes to `Backend/app.py`
2. **Frontend**: Update relevant HTML/JS files
3. **Database**: Add migrations in `init_db()` function
4. **Testing**: Test endpoints and frontend integration

### Code Style

- Follow PEP 8 for Python code
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions focused and modular

## Testing

### Testing Semantic Search

Try these natural language queries to test the AI search:

1. **Query**: "Global warming food security"
   - **Expected**: Should find "Climate Change and Agricultural Impacts"

2. **Query**: "Basics of money and markets"
   - **Expected**: Should find "Principles of Microeconomics"

3. **Query**: "Teaching computers to learn"
   - **Expected**: Should find "Introduction to Machine Learning"

### Testing Authentication

1. Register a new user via `/api/auth/register`
2. Login via `/api/auth/login` and verify token is received
3. Use token to access protected endpoints
4. Verify token expiration handling

### Testing Admin Features

1. Login with admin account
2. Access admin dashboard
3. Test user management features
4. Verify analytics display correctly

## Security Considerations

### Current Implementation

- JWT token-based authentication
- SHA256 password hashing (upgrade to bcrypt for production)
- CORS enabled for development
- SQL injection protection via parameterized queries

### Production Recommendations

- Use environment variables for secrets
- Implement bcrypt for password hashing
- Add rate limiting for API endpoints
- Enable HTTPS/TLS
- Implement proper CORS policy
- Add input validation and sanitization
- Use prepared statements for all database queries
- Implement session management and token refresh
- Add logging and monitoring

## Troubleshooting

### Common Issues

**Backend won't start:**
- Verify Python version (3.10+)
- Check if port 5000 is available
- Ensure all dependencies are installed
- Check database file permissions

**Frontend can't connect to backend:**
- Verify backend is running on port 5000
- Check CORS configuration
- Verify API base URL in JavaScript files

**Database errors:**
- Delete `Backend/bookgenie.db` to reset database
- Check database file permissions
- Verify SQLite is installed

**Authentication issues:**
- Check JWT token in browser localStorage
- Verify token hasn't expired
- Check Authorization header format

## Contributing

We welcome contributions! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Make your changes
4. Test thoroughly
5. Commit with clear messages (`git commit -m 'Add some AmazingFeature'`)
6. Push to your branch (`git push origin feature/AmazingFeature`)
7. Open a Pull Request

### Contribution Guidelines

- Follow existing code style
- Add comments for complex logic
- Update documentation as needed
- Test all changes thoroughly
- Ensure backward compatibility when possible

## Performance Considerations

- **AI Model Loading**: The SentenceTransformer model loads on server startup (~2-3 seconds)
- **Embedding Generation**: Book embeddings are generated on-demand and cached
- **Database**: SQLite is suitable for development; consider PostgreSQL for production
- **Frontend**: Optimized CSS and JavaScript for fast loading

## Future Enhancements

- [ ] Advanced search filters (date range, author, etc.)
- [ ] Book rating and review system
- [ ] Reading progress tracking
- [ ] Export reading history
- [ ] Email notifications
- [ ] Social features (sharing, comments)
- [ ] Mobile app development
- [ ] Advanced analytics and reporting
- [ ] Multi-language support
- [ ] PDF viewer integration

## License

Distributed under the MIT License. See `LICENSE` file for more information.

## Support

For issues, questions, or contributions, please open an issue on the repository or contact the development team.

## Acknowledgments

- SentenceTransformers by Hugging Face for semantic search capabilities
- Flask framework for the robust backend API
- All contributors and testers

---

**Version**: 1.0.0  
**Last Updated**: 2024  
**Status**: Active Development
# bookgenie

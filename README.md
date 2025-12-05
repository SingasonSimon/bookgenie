# BookGenie - AI-Powered Academic Library Assistant

[![Status](https://img.shields.io/badge/Status-Active-success)](https://github.com)
[![Python](https://img.shields.io/badge/Backend-Flask-blue)](https://flask.palletsprojects.com/)
[![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61dafb)](https://reactjs.org/)
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

BookGenie provides a comprehensive academic library management system with AI-powered semantic search capabilities. The platform enables users to search for academic resources using natural language queries, receive personalized recommendations, and manage their reading history. Administrators can manage users, books, categories, and analyze system usage through an intuitive dashboard interface.

### Core Capabilities

- **Semantic Search**: Natural language queries that understand context and meaning
- **Intelligent Recommendations**: AI-powered book suggestions based on reading history and preferences
- **User Management**: Role-based access control with student and administrator roles
- **Subscription Management**: Tiered access levels (Free, Basic, Premium)
- **Category Management**: Organize books by custom categories with icons and colors
- **Reading Analytics**: Track reading sessions, search history, and user engagement
- **Admin Dashboard**: Comprehensive analytics and user management tools
- **Modern UI**: Beautiful, responsive React interface with animations

## Key Features

### For Students

- **Semantic Search**: Find books by asking natural language questions (e.g., "How does climate change affect agriculture?")
- **Intelligent Recommendations**: Discover similar books based on content similarity using vector embeddings
- **Category Browsing**: Browse books organized by custom categories
- **Reading History**: Track reading sessions and access history
- **Personalized Dashboard**: View statistics, recommendations, and recent activity
- **Subscription Management**: Request subscription upgrades and view subscription history
- **Book Reviews & Ratings**: Rate and review books, see community feedback
- **Book Likes**: Like favorite books and see popular titles

### For Administrators

- **User Management**: View, edit, and manage all user accounts
- **Book Management**: Add, edit, and manage book catalog with file uploads
- **Category Management**: Create and manage custom categories with icons and colors
- **Analytics Dashboard**: View system-wide statistics, popular searches, and user activity
- **Subscription Requests**: Approve or deny subscription upgrade requests
- **Traffic Analytics**: Monitor individual user activity and engagement metrics
- **Charts & Visualizations**: Interactive charts for data analysis

## Architecture

### Backend (Python Flask)

- **Framework**: Flask 2.3.3 (RESTful API)
- **Database**: SQLite with automatic schema migrations
- **AI Engine**: SentenceTransformers (Hugging Face)
  - Model: `all-MiniLM-L6-v2` (384-dimensional embeddings)
  - Technique: Cosine similarity for relevance ranking
- **Authentication**: JWT (JSON Web Tokens) with token-based authorization
- **CORS**: Enabled for cross-origin requests
- **File Upload**: Support for PDF books and cover images

### Frontend (React + Vite)

- **Framework**: React 18 with modern hooks and context API
- **Build Tool**: Vite 5.0 for fast development and optimized builds
- **Styling**: Tailwind CSS 3.4 with custom design system
- **Animations**: Framer Motion for smooth UI transitions
- **Icons**: Lucide React for consistent iconography
- **Charts**: Recharts for data visualization
- **Routing**: React Router DOM for client-side navigation
- **State Management**: React Context API for global state
- **Responsive Design**: Mobile-first approach with breakpoints

## Technology Stack

### Backend Dependencies

```
flask==2.3.3
flask-cors==4.0.0
flask-sqlalchemy==3.0.5
werkzeug==2.3.7
PyJWT==2.8.0
numpy==1.26.4
scikit-learn==1.3.2
sentence-transformers==2.2.2
huggingface-hub==0.20.0
transformers==4.40.2
tokenizers==0.19.1
```

### Frontend Dependencies

```
react==18.2.0
react-dom==18.2.0
react-router-dom==6.20.0
framer-motion==10.18.0
lucide-react==0.303.0
recharts==3.5.1
tailwindcss==3.4.0
vite==5.0.0
```

## Installation

### Prerequisites

- **Python**: 3.10 - 3.12
- **Node.js**: 18.x or higher
- **npm** or **yarn**: Package manager
- **Modern web browser**: Chrome, Firefox, Safari, Edge (latest versions)

### Quick Start

#### Backend Setup

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

**Note**: The first run will download the AI model (~90MB), which may take a few minutes.

#### Frontend Setup

Open a new terminal:

```bash
cd Frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:8000` (or the next available port)

### Production Build

To build the frontend for production:

```bash
cd Frontend
npm run build
```

The optimized build will be in the `Frontend/dist` directory.

## Configuration

### Environment Variables

Currently, the application uses default configuration. For production deployment, consider setting:

- `JWT_SECRET`: Secret key for JWT token signing
- `DATABASE_URL`: Database connection string
- `FLASK_ENV`: Environment (development/production)
- `CORS_ORIGINS`: Allowed CORS origins
- `UPLOAD_FOLDER`: Path for file uploads (default: `Backend/uploads/`)

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
2. Start the frontend development server (see Installation)
3. Open browser to `http://localhost:8000`
4. Navigate to login page or register a new account

### Basic Workflow

1. **Registration/Login**: Create an account or login with existing credentials
2. **Search**: Use the search bar to find books using natural language queries
3. **Browse**: Explore books by category or view recommendations
4. **Read**: Click on books to view details, reviews, and download
5. **Dashboard**: View personal statistics and reading history

### Admin Features

1. Login with admin account
2. Access admin dashboard from navigation
3. Manage users, books, and categories
4. View analytics and approve subscription requests

## API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and receive JWT token
- `POST /api/auth/verify` - Verify JWT token validity
- `POST /api/auth/logout` - Logout (client-side token removal)

### Book Endpoints

- `GET /api/books` - Get all books (filtered by subscription level)
- `GET /api/books/<id>` - Get book details
- `POST /api/books` - Add new book (admin only)
- `PUT /api/books/<id>` - Update book (admin only)
- `DELETE /api/books/<id>` - Delete book (admin only)
- `GET /api/books/<id>/recommendations` - Get book recommendations
- `POST /api/books/<id>/read` - Record reading session
- `POST /api/books/<id>/download` - Download book file
- `POST /api/books/<id>/interaction` - Record user interaction

### Search Endpoints

- `POST /api/search` - Semantic search with natural language queries

### Category Endpoints

- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create category (admin only)
- `PUT /api/categories/<id>` - Update category (admin only)
- `DELETE /api/categories/<id>` - Delete category (admin only)
- `GET /api/categories/<name>/books` - Get books by category

### Review & Like Endpoints

- `GET /api/books/<id>/reviews` - Get book reviews
- `POST /api/books/<id>/reviews` - Submit review
- `POST /api/books/<id>/likes` - Like/unlike book
- `GET /api/books/<id>/likes` - Get like count

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
- `PUT /api/admin/subscription-requests/<id>` - Approve/deny request

### Subscription Endpoints

- `GET /api/user/subscription` - Get user subscription info
- `POST /api/user/subscription/request` - Request subscription upgrade

### Other Endpoints

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
│   ├── app.py                  # Main Flask application
│   ├── requirements.txt        # Python dependencies
│   ├── bookgenie.db            # SQLite database (auto-generated)
│   ├── uploads/                # Uploaded files
│   │   ├── books/              # PDF book files
│   │   ├── covers/             # Book cover images
│   │   └── avatars/            # User avatar images
│   └── venv/                   # Python virtual environment
│
├── Frontend/                   # Client-side React application
│   ├── src/
│   │   ├── components/         # React components
│   │   │   ├── admin/          # Admin components
│   │   │   ├── dashboard/      # Dashboard components
│   │   │   ├── charts/         # Chart components
│   │   │   └── ...             # Shared components
│   │   ├── pages/              # Page components
│   │   │   ├── HomePage.jsx    # Landing/search page
│   │   │   └── DashboardPage.jsx # User dashboard
│   │   ├── contexts/           # React contexts
│   │   │   └── AuthContext.jsx # Authentication context
│   │   ├── services/           # API services
│   │   │   └── api.js          # API client
│   │   ├── utils/              # Utility functions
│   │   ├── App.jsx             # Main app component
│   │   ├── main.jsx            # Entry point
│   │   └── index.css           # Global styles
│   ├── package.json            # Node dependencies
│   ├── vite.config.js          # Vite configuration
│   ├── tailwind.config.js      # Tailwind configuration
│   └── README.md               # Frontend documentation
│
├── .gitignore                  # Git ignore rules
├── README.md                   # This file
└── start_bookgenie.ps1         # Windows startup script (optional)
```

## Development

### Code Organization

- **Backend**: Modular Flask application with clear separation of concerns
- **Frontend**: Component-based React architecture with hooks and context
- **Database**: SQLite with automatic migrations
- **Authentication**: JWT-based with decorators for route protection
- **Styling**: Tailwind CSS with custom design system

### Adding New Features

1. **Backend**: Add routes to `Backend/app.py`
2. **Frontend**: Create components in `Frontend/src/components/`
3. **Database**: Add migrations in `init_db()` function
4. **Testing**: Test endpoints and frontend integration

### Code Style

- **Python**: Follow PEP 8
- **JavaScript/React**: Use ES6+ features, functional components with hooks
- **CSS**: Use Tailwind utility classes, custom classes in `index.css`
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions focused and modular

### Development Scripts

**Frontend:**
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

## Testing

### Testing Semantic Search

Try these natural language queries to test the AI search:

1. **Query**: "Global warming food security"
   - **Expected**: Should find "Climate Change and Agricultural Impacts"

2. **Query**: "Basics of money and markets"
   - **Expected**: Should find "Principles of Microeconomics"

3. **Query**: "Quantum physics advanced concepts"
   - **Expected**: Should find "Advanced Quantum Mechanics"

### Testing Authentication

1. Register a new user via `/api/auth/register`
2. Login via `/api/auth/login` and verify token is received
3. Use token to access protected endpoints
4. Verify token expiration handling

### Testing Admin Features

1. Login with admin account
2. Access admin dashboard
3. Test user management features
4. Test book and category management
5. Verify analytics display correctly

## Security Considerations

### Current Implementation

- JWT token-based authentication
- SHA256 password hashing (upgrade to bcrypt for production)
- CORS enabled for development
- SQL injection protection via parameterized queries
- File upload validation

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
- Validate file uploads (type, size, content)

## Troubleshooting

### Common Issues

**Backend won't start:**
- Verify Python version (3.10+)
- Check if port 5000 is available
- Ensure all dependencies are installed
- Check database file permissions
- Verify AI model download completed

**Frontend won't start:**
- Verify Node.js version (18+)
- Delete `node_modules` and run `npm install` again
- Check if port 8000 is available
- Clear npm cache: `npm cache clean --force`

**Frontend can't connect to backend:**
- Verify backend is running on port 5000
- Check CORS configuration
- Verify API base URL in `Frontend/src/services/api.js`
- Check browser console for errors

**Database errors:**
- Delete `Backend/bookgenie.db` to reset database
- Check database file permissions
- Verify SQLite is installed

**Authentication issues:**
- Check JWT token in browser localStorage
- Verify token hasn't expired
- Check Authorization header format
- Clear browser cache and localStorage

**Build errors:**
- Ensure all dependencies are installed
- Check for TypeScript/ESLint errors
- Verify Node.js and npm versions

## Performance Considerations

- **AI Model Loading**: The SentenceTransformer model loads on server startup (~2-3 seconds)
- **Embedding Generation**: Book embeddings are generated on-demand and cached
- **Database**: SQLite is suitable for development; consider PostgreSQL for production
- **Frontend**: Vite provides fast HMR and optimized production builds
- **Bundle Size**: React app is optimized with code splitting and tree shaking

## Future Enhancements

- [ ] Advanced search filters (date range, author, etc.)
- [ ] Reading progress tracking per book
- [ ] Export reading history and statistics
- [ ] Email notifications for new books and recommendations
- [ ] Social features (sharing, comments, book clubs)
- [ ] Mobile app development (React Native)
- [ ] Advanced analytics and reporting
- [ ] Multi-language support
- [ ] PDF viewer integration
- [ ] Offline reading capabilities
- [ ] Book collections and reading lists
- [ ] Advanced recommendation algorithms

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
- Write meaningful commit messages

## License

Distributed under the MIT License. See `LICENSE` file for more information.

## Support

For issues, questions, or contributions, please open an issue on the repository or contact the development team.

## Acknowledgments

- SentenceTransformers by Hugging Face for semantic search capabilities
- Flask framework for the robust backend API
- React team for the excellent frontend framework
- Tailwind CSS for the utility-first CSS framework
- All contributors and testers

---

**Version**: 2.0.0  
**Last Updated**: 2025  
**Status**: Active Development

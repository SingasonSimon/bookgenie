# BookGenie Frontend - React + Vite + Tailwind CSS

Modern, responsive React.js frontend for BookGenie AI-Powered Academic Library. Built with React 18, Vite, Tailwind CSS, and Framer Motion for a smooth, beautiful user experience.

## 🚀 Quick Start

### Prerequisites

- **Node.js**: 18.x or higher
- **npm** or **yarn**: Package manager

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

The app will be available at `http://localhost:8000` (or the next available port)

### Build for Production

```bash
npm run build
```

The optimized build will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## 📦 Tech Stack

- **React 18** - Modern UI framework with hooks and context API
- **Vite 5.0** - Fast build tool with HMR (Hot Module Replacement)
- **Tailwind CSS 3.4** - Utility-first CSS framework
- **Framer Motion 10** - Animation library for smooth transitions
- **React Router DOM 6** - Client-side routing
- **Lucide React** - Beautiful icon library
- **Recharts 3** - Chart library for data visualization

## 🎨 Features

### User Interface

- **Modern Design**: Clean, professional UI with gradient backgrounds
- **Responsive Layout**: Mobile-first design that works on all devices
- **Smooth Animations**: Framer Motion animations for better UX
- **Dark Mode Ready**: CSS variables support for theme switching
- **Accessible**: Semantic HTML and ARIA labels

### Core Features

- ✅ **Authentication**: Login/Register with JWT token management
- ✅ **Semantic Search**: AI-powered natural language book search
- ✅ **Book Browsing**: Grid and list views with filtering
- ✅ **Category Management**: Browse books by custom categories
- ✅ **Book Details**: Detailed book view with reviews and ratings
- ✅ **Dashboard**: Personalized dashboard with statistics
- ✅ **Admin Panel**: Full admin interface for managing users, books, and categories
- ✅ **Analytics**: Interactive charts and data visualizations
- ✅ **Notifications**: Toast notifications for user feedback
- ✅ **Loading States**: Skeleton loaders and spinners
- ✅ **Error Handling**: Graceful error handling with user-friendly messages

### Admin Features

- User management (view, edit, delete)
- Book management (add, edit, delete with file uploads)
- Category management (create, edit, delete with custom icons and colors)
- Analytics dashboard with charts
- Subscription request management
- Traffic analytics per user

### Student Features

- Personalized dashboard
- Book recommendations
- Reading history
- Category browsing
- Book reviews and ratings
- Subscription management
- Search history

## 📁 Project Structure

```
Frontend/
├── src/
│   ├── components/          # React components
│   │   ├── admin/          # Admin-specific components
│   │   │   ├── BookFormModal.jsx
│   │   │   ├── CategoryFormModal.jsx
│   │   │   ├── DeleteConfirmModal.jsx
│   │   │   ├── SubscriptionRequestModal.jsx
│   │   │   ├── UserEditModal.jsx
│   │   │   └── UserViewModal.jsx
│   │   ├── dashboard/      # Dashboard components
│   │   │   ├── AnalyticsTab.jsx
│   │   │   ├── BooksTab.jsx
│   │   │   ├── CategoriesTab.jsx
│   │   │   ├── DashboardLayout.jsx
│   │   │   ├── DashboardTab.jsx
│   │   │   ├── ProfileTab.jsx
│   │   │   ├── SearchTab.jsx
│   │   │   ├── SubscriptionTab.jsx
│   │   │   └── UsersTab.jsx
│   │   ├── charts/         # Chart components
│   │   │   ├── BarChart.jsx
│   │   │   ├── LineChart.jsx
│   │   │   └── PieChart.jsx
│   │   ├── BookCard.jsx
│   │   ├── BookDetailsModal.jsx
│   │   ├── BooksGrid.jsx
│   │   ├── LoadingIndicator.jsx
│   │   ├── LoadingSkeleton.jsx
│   │   ├── LoginModal.jsx
│   │   ├── Navbar.jsx
│   │   ├── Notification.jsx
│   │   ├── PageHeader.jsx
│   │   ├── ProtectedRoute.jsx
│   │   ├── RegisterModal.jsx
│   │   ├── SearchSection.jsx
│   │   ├── Spinner.jsx
│   │   └── StatsCard.jsx
│   ├── contexts/           # React contexts
│   │   └── AuthContext.jsx # Authentication context
│   ├── pages/              # Page components
│   │   ├── DashboardPage.jsx
│   │   └── HomePage.jsx
│   ├── services/           # API services
│   │   └── api.js          # API client with BookGenieAPI class
│   ├── utils/              # Utility functions
│   │   └── avatar.js       # Avatar URL generation
│   ├── App.jsx             # Main app component with routing
│   ├── main.jsx            # Entry point
│   └── index.css           # Global styles and Tailwind directives
├── index.html              # HTML template
├── package.json            # Dependencies and scripts
├── vite.config.js          # Vite configuration
├── tailwind.config.js      # Tailwind CSS configuration
├── postcss.config.js       # PostCSS configuration
└── README.md               # This file
```

## 🎯 Key Components

### Pages

- **HomePage**: Landing page with search functionality and book browsing
- **DashboardPage**: Main dashboard with tabbed interface for different sections

### Contexts

- **AuthContext**: Manages authentication state, login, logout, and user data

### Services

- **BookGenieAPI**: Centralized API client for all backend communication

### Admin Components

- **BookFormModal**: Add/edit books with file uploads
- **CategoryFormModal**: Create/edit categories with icon and color pickers
- **UserEditModal**: Edit user information and subscription
- **UserViewModal**: View detailed user information
- **SubscriptionRequestModal**: Approve/deny subscription requests
- **DeleteConfirmModal**: Confirmation dialog for deletions

### Dashboard Components

- **DashboardTab**: Main dashboard with stats and recommendations
- **SearchTab**: Advanced search interface
- **CategoriesTab**: Browse books by category
- **BooksTab**: Admin book management
- **UsersTab**: Admin user management
- **AnalyticsTab**: Admin analytics with charts
- **SubscriptionTab**: Student subscription management
- **ProfileTab**: User profile management

## 🎨 Styling

### Tailwind CSS

The project uses Tailwind CSS with a custom design system defined in `tailwind.config.js`:

- **Primary Colors**: Indigo-based color palette
- **Fonts**: Inter (sans) and Poppins (display)
- **Custom Animations**: fade-in, slide-up, slide-down, scale-in, shimmer

### Custom CSS Classes

Defined in `src/index.css`:

- `.btn-primary` - Primary button style
- `.btn-secondary` - Secondary button style
- `.card` - Card container
- `.card-hover` - Card with hover effects
- `.input-field` - Form input styling
- `.blob-bg` - Gradient background with blob effects
- `.text-gradient` - Gradient text effect
- `.custom-scrollbar` - Custom scrollbar styling

## 🔧 Configuration

### Vite Configuration

Located in `vite.config.js`:
- React plugin configuration
- Build optimization settings
- Development server settings

### Tailwind Configuration

Located in `tailwind.config.js`:
- Content paths for purging
- Custom theme extensions
- Color palette
- Font families
- Animations

### API Configuration

API base URL is configured in `src/services/api.js`. Default is `http://localhost:5000`.

## 🚦 Development Workflow

1. **Start Backend**: Ensure Flask backend is running on port 5000
2. **Start Frontend**: Run `npm run dev`
3. **Open Browser**: Navigate to `http://localhost:8000`
4. **Hot Reload**: Changes automatically reload in the browser

## 📝 Code Style

### React Components

- Use functional components with hooks
- Use `useState` for local state
- Use `useEffect` for side effects
- Use `useContext` for global state
- Keep components focused and reusable

### Naming Conventions

- Components: PascalCase (e.g., `BookCard.jsx`)
- Files: Match component name
- Functions: camelCase (e.g., `handleSubmit`)
- Constants: UPPER_SNAKE_CASE (e.g., `API_BASE_URL`)

### File Organization

- One component per file
- Related components in the same directory
- Shared utilities in `utils/`
- API calls in `services/`

## 🧪 Testing

### Manual Testing Checklist

- [ ] Login/Register functionality
- [ ] Book search and filtering
- [ ] Category browsing
- [ ] Book details modal
- [ ] Dashboard statistics
- [ ] Admin features (if admin user)
- [ ] Responsive design on mobile
- [ ] Error handling
- [ ] Loading states

## 🐛 Troubleshooting

### Common Issues

**Port already in use:**
```bash
# Kill process on port 8000 (Linux/Mac)
lsof -ti:8000 | xargs kill

# Or change port in vite.config.js
```

**Module not found errors:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Build errors:**
- Check Node.js version (18+)
- Clear npm cache: `npm cache clean --force`
- Delete `dist` folder and rebuild

**Styling issues:**
- Ensure Tailwind is properly configured
- Check `tailwind.config.js` content paths
- Verify PostCSS configuration

**API connection errors:**
- Verify backend is running on port 5000
- Check CORS configuration in backend
- Verify API base URL in `src/services/api.js`

## 📚 Additional Resources

- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [Framer Motion Documentation](https://www.framer.com/motion/)
- [React Router Documentation](https://reactrouter.com/)

## 🤝 Contributing

When contributing to the frontend:

1. Follow the existing code style
2. Use functional components and hooks
3. Add proper error handling
4. Include loading states
5. Test on multiple browsers
6. Ensure responsive design
7. Update documentation as needed

## 📄 License

Distributed under the MIT License. See root `README.md` for more information.

---

**Version**: 2.0.0  
**Last Updated**: 2025  
**Status**: Active Development

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LayoutDashboard, Search, BookOpen, Star, Users, BarChart3, BookText, Home, LogOut, User, Shield, ChevronDown, Menu, X } from 'lucide-react'
import { getAvatarUrl } from '../../utils/avatar'

export default function DashboardLayout({ user, activeTab, onTabChange, onLogout, onHomeClick, children }) {
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(null)
  const dropdownRef = useRef(null)

  // Update avatar URL when user changes
  useEffect(() => {
    if (user) {
      const url = getAvatarUrl(user)
      setAvatarUrl(url)
    } else {
      setAvatarUrl(null)
    }
  }, [user])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false)
      }
    }

    if (showProfileDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [showProfileDropdown])

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'categories', label: 'Categories', icon: BookOpen },
  ]

  if (user?.role !== 'admin') {
    tabs.push({ id: 'subscription', label: 'Subscription', icon: Star })
  }

  if (user?.role === 'admin') {
    tabs.push(
      { id: 'users', label: 'Users', icon: Users },
      { id: 'analytics', label: 'Analytics', icon: BarChart3 },
      { id: 'books', label: 'Books', icon: BookText }
    )
  }

  // Profile tab is handled separately via dropdown menu, not in navigation tabs

  return (
    <div className="min-h-screen blob-bg p-2 sm:p-4 md:p-6 lg:p-8">
      {/* Header */}
      <header className="sticky top-2 sm:top-4 z-30 mb-4 sm:mb-6">
        <nav className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8">
          <div className="glass-effect rounded-xl p-3 sm:p-4 md:p-5">
            <div className="flex items-center justify-between gap-2 sm:gap-4">
              {/* Left Section: Logo */}
              <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-shrink-0">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onHomeClick}
                  className="flex items-center gap-2 sm:gap-3 cursor-pointer group"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-gradient leading-tight truncate">
                      BookGenie
                    </span>
                    <span className="text-gray-600 text-xs sm:text-sm font-medium hidden sm:block mt-0.5">AI-Powered Academic Library</span>
                  </div>
                </motion.button>
              </div>

              {/* Center Section: Desktop Navigation Tabs */}
              <div className="hidden lg:flex items-center gap-1 flex-1 justify-center">
                {tabs.map(tab => {
                  const Icon = tab.icon
                  return (
                    <motion.button
                      key={tab.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onTabChange(tab.id)}
                      className={`px-3 xl:px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 text-sm xl:text-base ${
                        activeTab === tab.id
                          ? 'bg-primary-600 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="hidden xl:inline">{tab.label}</span>
                    </motion.button>
                  )
                })}
              </div>

              {/* Right Section: Hamburger (Mobile) + Profile (Desktop) */}
              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                {/* Hamburger Menu - Mobile Only */}
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden p-2.5 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors flex items-center justify-center"
                  aria-label="Toggle menu"
                >
                  {sidebarOpen ? (
                    <X className="w-6 h-6 text-gray-700" />
                  ) : (
                    <Menu className="w-6 h-6 text-gray-700" />
                  )}
                </button>

                {/* Profile - Desktop Only */}
                <div className="hidden lg:block relative" ref={dropdownRef}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                    className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 text-white flex items-center justify-center font-semibold shadow-md text-sm sm:text-base flex-shrink-0 overflow-hidden">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt="Profile"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none'
                            const parent = e.target.parentElement
                            const span = document.createElement('span')
                            span.textContent = user?.firstName?.[0] || user?.email?.[0] || 'U'
                            parent.appendChild(span)
                          }}
                        />
                      ) : (
                        <span>{user?.firstName?.[0] || user?.email?.[0] || 'U'}</span>
                      )}
                    </div>
                    <span className="font-medium text-gray-700 text-sm lg:text-base">
                      {user?.firstName || user?.email?.split('@')[0] || 'User'}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform flex-shrink-0 ${showProfileDropdown ? 'rotate-180' : ''}`} />
                  </motion.button>
                  <AnimatePresence>
                    {showProfileDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 mt-2 w-64 sm:w-72 bg-white rounded-xl shadow-xl border border-gray-200 p-4 z-50"
                      >
                        <div className="mb-4 pb-4 border-b border-gray-200">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 text-white flex items-center justify-center font-semibold shadow-md flex-shrink-0 overflow-hidden">
                              {avatarUrl ? (
                                <img
                                  src={avatarUrl}
                                  alt="Profile"
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.style.display = 'none'
                                    const parent = e.target.parentElement
                                    const span = document.createElement('span')
                                    span.textContent = user?.firstName?.[0] || user?.email?.[0] || 'U'
                                    parent.appendChild(span)
                                  }}
                                />
                              ) : (
                                <span>{user?.firstName?.[0] || user?.email?.[0] || 'U'}</span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-gray-900 truncate text-sm sm:text-base">
                                {user?.firstName || user?.email}
                              </div>
                              <div className="text-xs sm:text-sm text-gray-500 truncate">{user?.email}</div>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <span className="px-2.5 py-1 bg-primary-50 text-primary-600 rounded-lg text-xs font-semibold flex items-center gap-1">
                              {user?.role === 'admin' ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                              {user?.role === 'admin' ? 'Admin' : 'Student'}
                            </span>
                            <span className="px-2.5 py-1 bg-purple-50 text-purple-600 rounded-lg text-xs font-semibold capitalize">
                              {user?.subscriptionLevel || 'Free'}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              setShowProfileDropdown(false)
                              onTabChange('profile')
                            }}
                            className="w-full px-4 py-2.5 bg-primary-50 text-primary-600 rounded-lg font-medium hover:bg-primary-100 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                          >
                            <User className="w-4 h-4" />
                            Profile Settings
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              setShowProfileDropdown(false)
                              onLogout()
                            }}
                            className="w-full px-4 py-2.5 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                          >
                            <LogOut className="w-4 h-4" />
                            Logout
                          </motion.button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile Sidebar - Only for mobile */}
      <>
        {/* Mobile Overlay */}
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />
        )}
        
        {/* Mobile Sidebar */}
        <aside className={`${sidebarOpen ? 'fixed' : 'hidden'} lg:hidden left-0 top-0 h-full w-72 sm:w-80 z-50`}>
          <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            className="glass-effect h-full p-4 sm:p-6 overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="font-semibold text-gray-900 text-lg sm:text-xl">Menu</h3>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              {tabs.map(tab => {
                const Icon = tab.icon
                return (
                  <motion.button
                    key={tab.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      onTabChange(tab.id)
                      setSidebarOpen(false)
                    }}
                    className={`w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg transition-colors flex items-center gap-3 font-medium text-sm sm:text-base ${
                      activeTab === tab.id
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span>{tab.label}</span>
                  </motion.button>
                )
              })}
            </div>

            {/* Profile Section in Mobile Menu */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 text-white flex items-center justify-center font-semibold shadow-md flex-shrink-0 overflow-hidden">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Profile"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none'
                        const parent = e.target.parentElement
                        const span = document.createElement('span')
                        span.textContent = user?.firstName?.[0] || user?.email?.[0] || 'U'
                        parent.appendChild(span)
                      }}
                    />
                  ) : (
                    <span>{user?.firstName?.[0] || user?.email?.[0] || 'U'}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 truncate text-sm sm:text-base">
                    {user?.firstName || user?.email}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-500 truncate">{user?.email}</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-2.5 py-1 bg-primary-50 text-primary-600 rounded-lg text-xs font-semibold flex items-center gap-1">
                  {user?.role === 'admin' ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                  {user?.role === 'admin' ? 'Admin' : 'Student'}
                </span>
                <span className="px-2.5 py-1 bg-purple-50 text-purple-600 rounded-lg text-xs font-semibold capitalize">
                  {user?.subscriptionLevel || 'Free'}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setSidebarOpen(false)
                    onTabChange('profile')
                  }}
                  className="w-full px-4 py-2.5 bg-primary-50 text-primary-600 rounded-lg font-medium hover:bg-primary-100 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  <User className="w-4 h-4" />
                  Profile Settings
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setSidebarOpen(false)
                    onLogout()
                  }}
                  className="w-full px-4 py-2.5 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </motion.button>
              </div>
            </div>
          </motion.div>
        </aside>
      </>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 lg:py-10">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-4 sm:space-y-6"
        >
          {children}
        </motion.div>
      </main>
    </div>
  )
}


import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LayoutDashboard, Search, BookOpen, Star, Users, BarChart3, BookText, Home, LogOut, User, Shield, ChevronDown } from 'lucide-react'

export default function DashboardLayout({ user, activeTab, onTabChange, onLogout, onHomeClick, children }) {
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)

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

  return (
    <div className="min-h-screen blob-bg p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <header className="sticky top-4 z-40 mb-6">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass-effect rounded-2xl shadow-2xl p-5 sm:p-6 border border-white/50">
            <div className="flex justify-between items-center h-18 sm:h-20">
            <div className="flex items-center gap-6 sm:gap-8">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                onClick={onHomeClick}
                className="flex items-center gap-4 cursor-pointer group"
              >
                <motion.div
                  whileHover={{ rotate: 5 }}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center shadow-xl group-hover:shadow-primary-500/50 transition-shadow"
                >
                  <BookOpen className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                </motion.div>
                <div>
                  <span className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-gradient leading-tight">
                    BookGenie
                  </span>
                  <span className="text-gray-600 text-sm sm:text-base font-medium hidden sm:inline block">AI-Powered Academic Library</span>
                </div>
              </motion.button>
              <div className="hidden md:flex gap-1">
                {tabs.map(tab => {
                  const Icon = tab.icon
                  return (
                    <motion.button
                      key={tab.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onTabChange(tab.id)}
                      className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${
                        activeTab === tab.id
                          ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </motion.button>
                  )
                })}
              </div>
            </div>
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 text-white flex items-center justify-center font-semibold shadow-md">
                  {user?.firstName?.[0] || user?.email?.[0] || 'U'}
                </div>
                <span className="font-medium text-gray-700 hidden sm:inline">
                  {user?.firstName || user?.email?.split('@')[0] || 'User'}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showProfileDropdown ? 'rotate-180' : ''}`} />
              </motion.button>
              <AnimatePresence>
                {showProfileDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-200 p-4 z-50"
                  >
                    <div className="mb-4 pb-4 border-b border-gray-200">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 text-white flex items-center justify-center font-semibold shadow-md">
                          {user?.firstName?.[0] || user?.email?.[0] || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 truncate">
                            {user?.firstName || user?.email}
                          </div>
                          <div className="text-sm text-gray-500 truncate">{user?.email}</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <span className="px-2.5 py-1 bg-primary-50 text-primary-600 rounded-lg text-xs font-semibold flex items-center gap-1">
                          {user?.role === 'admin' ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                          {user?.role === 'admin' ? 'Admin' : 'Student'}
                        </span>
                        <span className="px-2.5 py-1 bg-purple-50 text-purple-600 rounded-lg text-xs font-semibold capitalize">
                          {user?.subscriptionLevel || 'Free'}
                        </span>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setShowProfileDropdown(false)
                        onLogout()
                      }}
                      className="w-full px-4 py-2.5 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          </div>
        </nav>
      </header>

      {/* Mobile Tabs */}
      <div className="md:hidden glass-effect rounded-2xl shadow-lg mb-6 px-4 py-3 overflow-x-auto sticky top-24 z-30 max-w-7xl mx-auto">
        <div className="flex gap-2">
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <motion.button
                key={tab.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => onTabChange(tab.id)}
                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap flex items-center gap-2 transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md'
                    : 'text-gray-700 bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 sm:py-10 lg:py-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
        {/* Sidebar - Left */}
        <aside className="hidden lg:block lg:col-span-2">
          <div className="glass-effect rounded-2xl shadow-lg p-6 lg:p-7 sticky top-32 h-fit">
            <div className="space-y-3">
              <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wider mb-5 text-gray-500">Quick Actions</h3>
              <motion.button
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onTabChange('search')}
                className="w-full text-left px-5 py-3.5 rounded-xl hover:bg-primary-50 transition-colors flex items-center gap-3 text-gray-700 hover:text-primary-600 font-medium"
              >
                <Search className="w-5 h-5" />
                <span>Search</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onTabChange('categories')}
                className="w-full text-left px-5 py-3.5 rounded-xl hover:bg-primary-50 transition-colors flex items-center gap-3 text-gray-700 hover:text-primary-600 font-medium"
              >
                <BookOpen className="w-5 h-5" />
                <span>Categories</span>
              </motion.button>
              {user?.role === 'admin' && (
                <>
                  <motion.button
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onTabChange('books')}
                    className="w-full text-left px-5 py-3.5 rounded-xl hover:bg-primary-50 transition-colors flex items-center gap-3 text-gray-700 hover:text-primary-600 font-medium"
                  >
                    <BookText className="w-5 h-5" />
                    <span>Manage Books</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onTabChange('analytics')}
                    className="w-full text-left px-5 py-3.5 rounded-xl hover:bg-primary-50 transition-colors flex items-center gap-3 text-gray-700 hover:text-primary-600 font-medium"
                  >
                    <BarChart3 className="w-5 h-5" />
                    <span>Analytics</span>
                  </motion.button>
                </>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="lg:col-span-8">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {children}
          </motion.div>
        </div>

        {/* Sidebar - Right */}
        <aside className="hidden lg:block lg:col-span-2">
          <div className="glass-effect rounded-2xl shadow-lg p-6 lg:p-7 sticky top-32 h-fit">
            <div className="space-y-5">
              <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wider mb-6 text-gray-500">Your Stats</h3>
              <div className="space-y-4">
                <div className="p-5 bg-gradient-to-br from-primary-50 to-purple-50 rounded-xl border border-primary-100">
                  <div className="text-3xl font-bold text-primary-600 mb-2">0</div>
                  <div className="text-sm text-gray-600 font-medium">Books Read</div>
                </div>
                <div className="p-5 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                  <div className="text-3xl font-bold text-purple-600 mb-2">0</div>
                  <div className="text-sm text-gray-600 font-medium">Searches</div>
                </div>
                <div className="p-5 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
                  <div className="text-3xl font-bold text-green-600 mb-2 capitalize">{user?.subscriptionLevel || 'Free'}</div>
                  <div className="text-sm text-gray-600 font-medium">Subscription</div>
                </div>
              </div>
              {user?.role !== 'admin' && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onTabChange('subscription')}
                  className="w-full mt-4 btn-primary text-sm py-2.5"
                >
                  <Star className="w-4 h-4 inline mr-2" />
                  Upgrade Plan
                </motion.button>
              )}
            </div>
          </div>
        </aside>
      </main>
    </div>
  )
}


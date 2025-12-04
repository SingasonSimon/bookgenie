import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LayoutDashboard, Search, BookOpen, Star, Users, BarChart3, BookText, Home, LogOut, User, Shield, ChevronDown, Menu, X } from 'lucide-react'

export default function DashboardLayout({ user, activeTab, onTabChange, onLogout, onHomeClick, children }) {
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

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
          <div className="glass-effect rounded-xl p-4 sm:p-5">
            <div className="flex justify-between items-center h-18 sm:h-20">
            <div className="flex items-center gap-6 sm:gap-8">
              <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                onClick={onHomeClick}
                  className="flex items-center gap-3 cursor-pointer group"
              >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-2xl sm:text-3xl font-display font-bold text-gradient leading-tight">
                    BookGenie
                  </span>
                    <span className="text-gray-600 text-sm font-medium hidden sm:block mt-0.5">AI-Powered Academic Library</span>
                </div>
              </motion.button>
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </div>
              <div className="hidden lg:flex gap-1">
                {tabs.map(tab => {
                  const Icon = tab.icon
                  return (
                    <motion.button
                      key={tab.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onTabChange(tab.id)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                        activeTab === tab.id
                          ? 'bg-primary-600 text-white'
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
      <div className="lg:hidden glass-effect rounded-xl mb-6 px-4 py-3 overflow-x-auto sticky top-20 z-30 max-w-7xl mx-auto">
        <div className="flex gap-2">
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <motion.button
                key={tab.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => onTabChange(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap flex items-center gap-2 transition-all ${
                  activeTab === tab.id
                    ? 'bg-primary-600 text-white'
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
      <main className="max-w-7xl mx-auto py-6 sm:py-8 lg:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sidebar - Collapsible */}
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
            
            {/* Sidebar */}
            <aside className={`lg:col-span-3 ${sidebarOpen ? 'fixed' : 'hidden'} lg:block lg:sticky top-24 lg:top-32 h-[calc(100vh-6rem)] lg:h-fit z-50 lg:z-auto`}>
              <motion.div
                initial={sidebarOpen ? { x: -300, opacity: 0 } : false}
                animate={{ x: 0, opacity: 1 }}
                className="glass-effect rounded-xl p-6 h-full lg:h-fit overflow-y-auto lg:overflow-visible"
              >
                <div className="flex items-center justify-between mb-6 lg:hidden">
                  <h3 className="font-semibold text-gray-900">Menu</h3>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="p-1 rounded-lg hover:bg-gray-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-2">
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
                        className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3 font-medium ${
                          activeTab === tab.id
                            ? 'bg-primary-50 text-primary-700'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                  >
                        <Icon className="w-5 h-5" />
                        <span>{tab.label}</span>
                  </motion.button>
                    )
                  })}
            </div>
              </motion.div>
        </aside>
          </>

        {/* Main Content Area */}
          <div className="lg:col-span-9">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {children}
          </motion.div>
            </div>
          </div>
      </main>
    </div>
  )
}


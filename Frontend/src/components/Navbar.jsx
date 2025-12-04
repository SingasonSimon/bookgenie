import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, User, LogOut, LayoutDashboard, Shield, ChevronDown } from 'lucide-react'

export default function Navbar({ user, onLoginClick, onLogout, onAdminClick }) {
  const navigate = useNavigate()
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-4 z-40 mb-6"
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-effect rounded-2xl shadow-2xl p-5 sm:p-6 border border-white/50">
          <div className="flex justify-between items-center h-18 sm:h-20">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="flex items-center gap-4 cursor-pointer group"
            onClick={() => navigate('/')}
          >
            <motion.div
              whileHover={{ rotate: 5 }}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center shadow-xl group-hover:shadow-primary-500/50 transition-shadow"
            >
              <BookOpen className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
            </motion.div>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-gradient leading-tight">
                BookGenie
              </h1>
              <span className="text-gray-600 text-sm sm:text-base font-medium hidden sm:inline">AI-Powered Academic Library</span>
            </div>
          </motion.div>
          
          <div className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/dashboard')}
                  className="btn-secondary flex items-center gap-2 text-sm px-4 hidden sm:flex"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </motion.button>
                <div className="relative">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 text-white flex items-center justify-center font-semibold shadow-lg text-base sm:text-lg">
                      {user?.firstName?.[0] || user?.email?.[0] || 'U'}
                    </div>
                    <span className="font-semibold text-gray-700 text-base hidden sm:inline">
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
                        <div className="flex flex-col gap-2">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              setShowProfileDropdown(false)
                              navigate('/dashboard')
                            }}
                            className="w-full px-4 py-2.5 bg-primary-50 text-primary-600 rounded-lg font-medium hover:bg-primary-100 transition-colors flex items-center justify-center gap-2"
                          >
                            <LayoutDashboard className="w-4 h-4" />
                            Go to Dashboard
                          </motion.button>
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
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onLoginClick}
                className="btn-primary flex items-center gap-2 px-6"
              >
                <User className="w-4 h-4" />
                <span>Login</span>
              </motion.button>
            )}
          </div>
        </div>
        </div>
      </nav>
    </motion.header>
  )
}


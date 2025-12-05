import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, User, LogOut, LayoutDashboard, Shield, ChevronDown } from 'lucide-react'
import { getAvatarUrl } from '../utils/avatar'

export default function Navbar({ user, onLoginClick, onLogout, onAdminClick }) {
  const navigate = useNavigate()
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
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

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-2 sm:top-4 z-30 mb-4 sm:mb-6"
    >
      <nav className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8">
        <div className="glass-effect rounded-xl sm:rounded-2xl shadow-2xl p-3 sm:p-4 md:p-5 lg:p-6 border border-white/50">
          <div className="flex justify-between items-center gap-2 sm:gap-4">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="flex items-center gap-2 sm:gap-3 md:gap-4 cursor-pointer group flex-1 min-w-0"
            onClick={() => navigate('/')}
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-gradient leading-tight truncate">
                BookGenie
              </h1>
              <span className="text-gray-600 text-xs sm:text-sm font-medium hidden sm:inline block mt-0.5">AI-Powered Academic Library</span>
            </div>
          </motion.div>
          
          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 flex-shrink-0">
            {user ? (
              <>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/dashboard')}
                  className="btn-secondary flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 md:px-4 hidden md:flex"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden lg:inline">Dashboard</span>
                </motion.button>
                <div className="relative" ref={dropdownRef}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                    className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 text-white flex items-center justify-center font-semibold text-sm sm:text-base flex-shrink-0 overflow-hidden">
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
                    <span className="font-semibold text-gray-700 text-sm sm:text-base hidden lg:inline">
                      {user?.firstName || user?.email?.split('@')[0] || 'User'}
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500 transition-transform flex-shrink-0 ${showProfileDropdown ? 'rotate-180' : ''}`} />
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
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 text-white flex items-center justify-center font-semibold shadow-md overflow-hidden">
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
                className="btn-primary flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 md:px-6 text-sm sm:text-base"
              >
                <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
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


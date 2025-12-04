import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookOpen, User, LogOut, LayoutDashboard, Shield } from 'lucide-react'

export default function Navbar({ user, onLoginClick, onLogout, onAdminClick }) {
  const navigate = useNavigate()

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="glass-effect rounded-2xl p-6 mb-8 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
    >
      <motion.div
        whileHover={{ scale: 1.02 }}
        className="flex items-center gap-3 cursor-pointer"
        onClick={() => navigate('/')}
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
          <BookOpen className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold bg-gradient-to-r from-primary-500 to-primary-600 bg-clip-text text-transparent">
            BookGenie
          </h1>
          <span className="text-gray-600 text-xs sm:text-sm">AI-Powered Academic Library</span>
        </div>
      </motion.div>
      
      <div className="flex items-center gap-3 flex-wrap">
        {user ? (
          <>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg"
            >
              <User className="w-4 h-4 text-gray-600" />
              <span className="text-gray-700 font-medium text-sm sm:text-base">
                {user.firstName || user.email?.split('@')[0]}
              </span>
            </motion.div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/dashboard')}
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </motion.button>
            {user.role === 'admin' && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/dashboard')}
                className="btn-secondary flex items-center gap-2 text-sm"
              >
                <Shield className="w-4 h-4" />
                <span className="hidden sm:inline">Admin</span>
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onLogout}
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </motion.button>
          </>
        ) : (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onLoginClick}
            className="btn-primary flex items-center gap-2"
          >
            <User className="w-4 h-4" />
            Login
          </motion.button>
        )}
      </div>
    </motion.nav>
  )
}


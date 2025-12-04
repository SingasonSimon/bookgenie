import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Mail, Lock, User, GraduationCap, UserPlus } from 'lucide-react'
import Spinner from './Spinner'

export default function RegisterModal({ onClose, onRegister, onSwitchToLogin }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    academicLevel: 'undergraduate',
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    await onRegister(formData)
    setIsLoading(false)
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 pt-24"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto relative"
          onClick={(e) => e.stopPropagation()}
        >
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </motion.button>

          <div className="mb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-display font-bold mb-2 text-center text-gray-900">Create Account</h2>
            <p className="text-gray-600 text-center text-sm">Join BookGenie today</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-2 text-gray-700 font-medium text-sm">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="input-field pl-12"
                  placeholder="your@email.com"
                />
              </div>
            </div>
            <div>
              <label className="block mb-2 text-gray-700 font-medium text-sm">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  className="input-field pl-12"
                  placeholder="Minimum 6 characters"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 text-gray-700 font-medium text-sm">First Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="input-field pl-12"
                    placeholder="Optional"
                  />
                </div>
              </div>
              <div>
                <label className="block mb-2 text-gray-700 font-medium text-sm">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Optional"
                />
              </div>
            </div>
            <div>
              <label className="block mb-2 text-gray-700 font-medium text-sm">Academic Level</label>
              <div className="relative">
                <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  name="academicLevel"
                  value={formData.academicLevel}
                  onChange={handleChange}
                  className="input-field pl-12"
                >
                  <option value="undergraduate">Undergraduate</option>
                  <option value="graduate">Graduate</option>
                  <option value="postgraduate">Postgraduate</option>
                </select>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Spinner size="sm" />
                  Registering...
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  Register
                </>
              )}
            </motion.button>
          </form>

          <p className="text-center mt-6 text-gray-600 text-sm">
            Already have an account?{' '}
            <button
              onClick={onSwitchToLogin}
              className="text-primary-600 font-semibold hover:text-primary-700 hover:underline transition-colors"
            >
              Login
            </button>
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}


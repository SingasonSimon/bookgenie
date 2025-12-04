import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, User, Mail, GraduationCap, Building, Shield, Star } from 'lucide-react'
import Spinner from '../Spinner'

export default function UserEditModal({ user, onClose, onSave, loading }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    academicLevel: '',
    department: '',
    role: 'student',
    subscriptionLevel: 'free',
  })

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        academicLevel: user.academicLevel || '',
        department: user.department || '',
        role: user.role || 'student',
        subscriptionLevel: user.subscriptionLevel || 'free',
      })
    }
  }, [user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    await onSave(formData)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const modalContent = (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl relative flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-display font-bold text-gray-900">Edit User</h2>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block mb-2 text-gray-700 font-medium text-sm flex items-center gap-2">
                  <User className="w-4 h-4" />
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="First name"
                />
              </div>

              <div>
                <label className="block mb-2 text-gray-700 font-medium text-sm">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Last name"
                />
              </div>
            </div>

            <div>
              <label className="block mb-2 text-gray-700 font-medium text-sm flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="input-field"
                placeholder="user@example.com"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block mb-2 text-gray-700 font-medium text-sm flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" />
                  Academic Level
                </label>
                <select
                  name="academicLevel"
                  value={formData.academicLevel}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="">Select Level</option>
                  <option value="undergraduate">Undergraduate</option>
                  <option value="graduate">Graduate</option>
                  <option value="postgraduate">Postgraduate</option>
                  <option value="faculty">Faculty</option>
                </select>
              </div>

              <div>
                <label className="block mb-2 text-gray-700 font-medium text-sm flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  Department
                </label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Department"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block mb-2 text-gray-700 font-medium text-sm flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Role
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="student">Student</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block mb-2 text-gray-700 font-medium text-sm flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  Subscription Level
                </label>
                <select
                  name="subscriptionLevel"
                  value={formData.subscriptionLevel}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="free">Free</option>
                  <option value="basic">Basic</option>
                  <option value="premium">Premium</option>
                </select>
              </div>
            </div>
          </form>

          {/* Footer */}
          <div className="border-t border-gray-200 p-6 bg-gray-50 flex justify-end gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="btn-secondary"
              disabled={loading}
            >
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              onClick={handleSubmit}
              className="btn-primary flex items-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner size="sm" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )

  return typeof window !== 'undefined' ? createPortal(modalContent, document.body) : null
}


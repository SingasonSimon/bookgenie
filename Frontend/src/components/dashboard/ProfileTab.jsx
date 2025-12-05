import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { User, Mail, GraduationCap, Building, Camera, X, Save, Trash2, Shield, Star, Clock, BookOpen, Search, BookMarked } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import PageHeader from '../PageHeader'
import Spinner from '../Spinner'
import Notification from '../Notification'
import { BookGenieAPI } from '../../services/api'

export default function ProfileTab() {
  const { user, checkAuth } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [notification, setNotification] = useState(null)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    academicLevel: '',
    department: '',
  })
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [pendingAvatarFile, setPendingAvatarFile] = useState(null)
  const [avatarUrl, setAvatarUrl] = useState(null)
  const api = new BookGenieAPI()

  useEffect(() => {
    loadProfile()
  }, [])

  useEffect(() => {
    if (profile && profile.avatar) {
      updateAvatarPreview(profile.avatar)
    }
  }, [profile?.avatar])

  const loadProfile = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('bookgenie_token')
      const data = await api.getProfile(token)
      setProfile(data)
      setFormData({
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        email: data.email || '',
        academicLevel: data.academicLevel || '',
        department: data.department || '',
      })
      
      updateAvatarPreview(data.avatar)
    } catch (error) {
      console.error('Error loading profile:', error)
      showNotification('Failed to load profile', 'error')
    } finally {
      setLoading(false)
    }
  }

  const updateAvatarPreview = (avatar) => {
    if (avatar && avatar !== 'user') {
      let url = null
      
      if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
        url = avatar.includes('?t=') ? avatar : `${avatar}?t=${Date.now()}`
      } else if (avatar.startsWith('/api/files/avatars/')) {
        url = `http://localhost:5000${avatar}?t=${Date.now()}`
      } else if (avatar.includes('.')) {
        url = `http://localhost:5000/api/files/avatars/${avatar}?t=${Date.now()}`
      }
      
      if (url) {
        setAvatarUrl(url)
        setAvatarPreview(url)
      } else {
        setAvatarUrl(null)
        setAvatarPreview(null)
      }
    } else {
      setAvatarUrl(null)
      setAvatarPreview(null)
    }
  }

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setSaving(true)
      const token = localStorage.getItem('bookgenie_token')
      const response = await api.updateProfile(formData, token)
      
      if (response.success) {
        showNotification('Profile updated successfully', 'success')
        await loadProfile()
        await checkAuth() // Refresh auth context
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      showNotification(error.message || 'Failed to update profile', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      showNotification('Invalid file type. Please upload an image (PNG, JPG, GIF, or WEBP)', 'error')
      e.target.value = ''
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      showNotification('File size too large. Maximum size is 5MB', 'error')
      e.target.value = ''
      return
    }

    // Store file for upload
    setPendingAvatarFile(file)

    // Show preview immediately
    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatarPreview(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const handleUploadAvatar = async () => {
    if (!pendingAvatarFile) return

    try {
      setUploading(true)
      const token = localStorage.getItem('bookgenie_token')
      const response = await api.uploadAvatar(pendingAvatarFile, token)
      
      if (response.success) {
        showNotification('Avatar uploaded successfully', 'success')
        setPendingAvatarFile(null)
        
        const avatarToUse = response.avatar || response.avatar_url
        
        if (avatarToUse) {
          let avatarUrl = avatarToUse
          if (avatarToUse.startsWith('/api/files/avatars/')) {
            avatarUrl = `http://localhost:5000${avatarToUse}?t=${Date.now()}`
          } else if (!avatarToUse.startsWith('http')) {
            avatarUrl = `http://localhost:5000/api/files/avatars/${avatarToUse}?t=${Date.now()}`
          }
          
          setAvatarUrl(avatarUrl)
          setAvatarPreview(avatarUrl)
          setProfile(prev => prev ? { ...prev, avatar: avatarToUse } : prev)
          
          setTimeout(async () => {
            await loadProfile()
          }, 500)
        } else {
          await loadProfile()
        }
        
        await checkAuth()
      }
    } catch (error) {
      console.error('Error uploading avatar:', error)
      showNotification(error.message || 'Failed to upload avatar', 'error')
    } finally {
      setUploading(false)
    }
  }

  const handleCancelAvatarUpload = () => {
    setPendingAvatarFile(null)
    if (profile) {
      updateAvatarPreview(profile.avatar)
    } else {
      setAvatarPreview(null)
    }
  }

  const handleDeleteAvatar = async () => {
    if (!window.confirm('Are you sure you want to remove your profile picture?')) {
      return
    }

    try {
      setUploading(true)
      const token = localStorage.getItem('bookgenie_token')
      const response = await api.deleteAvatar(token)
      
      if (response.success) {
        showNotification('Avatar removed successfully', 'success')
        setAvatarPreview(null)
        setAvatarUrl(null)
        setPendingAvatarFile(null)
        await loadProfile()
        await checkAuth() // Refresh auth context
      }
    } catch (error) {
      console.error('Error deleting avatar:', error)
      showNotification(error.message || 'Failed to remove avatar', 'error')
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="card text-center py-16">
        <User className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <p className="text-gray-600">Failed to load profile</p>
      </div>
    )
  }

  return (
    <div>
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      <PageHeader
        icon={User}
        title="My Profile"
        description="Manage your profile information and settings"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-1"
        >
          <div className="card">
            {/* Avatar Section */}
            <div className="text-center mb-6">
              <div className="relative inline-block">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-4xl font-bold shadow-lg mx-auto mb-4 relative">
                  {avatarPreview ? (
                    <img
                      key={avatarUrl || avatarPreview}
                      src={avatarPreview}
                      alt="Profile"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none'
                        const parent = e.target.parentElement
                        const existingSpan = parent.querySelector('span')
                        if (existingSpan) {
                          existingSpan.remove()
                        }
                        const span = document.createElement('span')
                        span.textContent = profile.firstName?.[0] || profile.email?.[0] || 'U'
                        parent.appendChild(span)
                        setAvatarPreview(null)
                        setAvatarUrl(null)
                      }}
                    />
                  ) : (
                    <span>{profile.firstName?.[0] || profile.email?.[0] || 'U'}</span>
                  )}
                  {uploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
                      <Spinner size="sm" />
                    </div>
                  )}
                </div>
                <label className="absolute bottom-0 right-0 bg-primary-600 text-white p-2 rounded-full cursor-pointer hover:bg-primary-700 transition-colors shadow-lg z-10">
                  <Camera className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                    onChange={handleAvatarChange}
                    className="hidden"
                    disabled={uploading || !!pendingAvatarFile}
                  />
                </label>
                {(avatarPreview || (profile.avatar && profile.avatar !== 'user')) && !pendingAvatarFile && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleDeleteAvatar}
                    disabled={uploading}
                    className="absolute top-0 right-0 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors shadow-lg z-10"
                    title="Remove avatar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </motion.button>
                )}
              </div>
              
              {/* Upload/Cancel buttons when preview is pending */}
              {pendingAvatarFile && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-center gap-2 mt-4"
                >
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleUploadAvatar}
                    disabled={uploading}
                    className="btn-primary text-sm px-4 py-2 flex items-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <Spinner size="sm" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Avatar
                      </>
                    )}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCancelAvatarUpload}
                    disabled={uploading}
                    className="btn-secondary text-sm px-4 py-2"
                  >
                    Cancel
                  </motion.button>
                </motion.div>
              )}
              
              <h2 className="text-2xl font-display font-bold text-gray-900">
                {profile.firstName && profile.lastName
                  ? `${profile.firstName} ${profile.lastName}`
                  : profile.firstName || profile.email?.split('@')[0] || 'User'}
              </h2>
              <p className="text-gray-600 mt-1">{profile.email}</p>
              
              {/* Badges */}
              <div className="flex items-center justify-center gap-2 mt-4">
                <span className="px-3 py-1 bg-primary-50 text-primary-600 rounded-lg text-xs font-semibold flex items-center gap-1">
                  {profile.role === 'admin' ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                  {profile.role === 'admin' ? 'Admin' : 'Student'}
                </span>
                <span className="px-3 py-1 bg-purple-50 text-purple-600 rounded-lg text-xs font-semibold capitalize">
                  {profile.subscriptionLevel || 'Free'}
                </span>
              </div>
            </div>

            {/* Stats */}
            <div className="space-y-3 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-600">
                  <Search className="w-4 h-4" />
                  <span className="text-sm">Searches</span>
                </div>
                <span className="font-semibold text-gray-900">{profile.stats?.searchCount || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-600">
                  <BookMarked className="w-4 h-4" />
                  <span className="text-sm">Reading Sessions</span>
                </div>
                <span className="font-semibold text-gray-900">{profile.stats?.readingCount || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-600">
                  <BookOpen className="w-4 h-4" />
                  <span className="text-sm">Books Read</span>
                </div>
                <span className="font-semibold text-gray-900">{profile.stats?.booksRead || 0}</span>
              </div>
            </div>

            {/* Account Info */}
            <div className="pt-6 border-t border-gray-200 mt-6">
              <div className="text-xs text-gray-500 space-y-1">
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  <span>Joined {new Date(profile.createdAt).toLocaleDateString()}</span>
                </div>
                {profile.lastLogin && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    <span>Last login {new Date(profile.lastLogin).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Profile Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2"
        >
          <div className="card">
            <h3 className="text-xl font-display font-bold text-gray-900 mb-6">Profile Information</h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    placeholder="Enter your first name"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-gray-700 font-medium text-sm flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Enter your last name"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-2 text-gray-700 font-medium text-sm flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="input-field"
                  placeholder="Enter your email"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    <option value="">Select academic level</option>
                    <option value="undergraduate">Undergraduate</option>
                    <option value="graduate">Graduate</option>
                    <option value="postgraduate">Postgraduate</option>
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
                    placeholder="Enter your department"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={saving}
                  className="btn-primary flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <Spinner size="sm" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Save Changes
                    </>
                  )}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => {
                    setFormData({
                      firstName: profile.firstName || '',
                      lastName: profile.lastName || '',
                      email: profile.email || '',
                      academicLevel: profile.academicLevel || '',
                      department: profile.department || '',
                    })
                  }}
                  className="btn-secondary"
                >
                  Reset
                </motion.button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  )
}


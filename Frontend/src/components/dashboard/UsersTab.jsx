import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, User, Shield, Mail, Eye, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import PageHeader from '../PageHeader'
import UserEditModal from '../admin/UserEditModal'
import UserViewModal from '../admin/UserViewModal'
import DeleteConfirmModal from '../admin/DeleteConfirmModal'
import SubscriptionRequestModal from '../admin/SubscriptionRequestModal'
import Notification from '../Notification'
import { GridSkeleton } from '../LoadingSkeleton'
import { BookGenieAPI } from '../../services/api'
import { getAvatarUrl } from '../../utils/avatar'

export default function UsersTab() {
  const [users, setUsers] = useState([])
  const [subscriptionRequests, setSubscriptionRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingRequests, setLoadingRequests] = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [userToDelete, setUserToDelete] = useState(null)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [saving, setSaving] = useState(false)
  const [processingRequest, setProcessingRequest] = useState(null)
  const [notification, setNotification] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState(null)
  const perPage = 12
  const api = new BookGenieAPI()

  useEffect(() => {
    loadUsers(currentPage)
    loadSubscriptionRequests()
  }, [currentPage])

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  const loadUsers = async (page = 1) => {
    try {
      setLoading(true)
      const token = localStorage.getItem('bookgenie_token')
      const result = await api.getUsers(token, { page, per_page: perPage })
      setUsers(result.users || [])
      setPagination(result.pagination)
    } catch (error) {
      console.error('Users error:', error)
      showNotification('Failed to load users', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveUser = async (formData) => {
    if (!selectedUser) return
    
    setSaving(true)
    try {
      const token = localStorage.getItem('bookgenie_token')
      await api.updateUser(selectedUser.id, formData, token)
      showNotification('User updated successfully', 'success')
      await loadUsers(currentPage)
      setShowEditModal(false)
      setSelectedUser(null)
    } catch (error) {
      console.error('Update error:', error)
      showNotification(error.message || 'Failed to update user', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!userToDelete) return
    
    try {
      const token = localStorage.getItem('bookgenie_token')
      await api.deleteUser(userToDelete.id, token)
      showNotification('User deleted successfully', 'success')
      // If current page becomes empty, go to previous page
      if (users.length === 1 && currentPage > 1) {
        const newPage = currentPage - 1
        setCurrentPage(newPage)
        await loadUsers(newPage)
      } else {
        await loadUsers(currentPage)
      }
      setShowDeleteModal(false)
      setUserToDelete(null)
    } catch (error) {
      console.error('Delete error:', error)
      showNotification(error.message || 'Failed to delete user', 'error')
    }
  }

  const loadSubscriptionRequests = async () => {
    try {
      const token = localStorage.getItem('bookgenie_token')
      const requests = await api.getSubscriptionRequests(token)
      setSubscriptionRequests(requests)
    } catch (error) {
      console.error('Subscription requests error:', error)
    } finally {
      setLoadingRequests(false)
    }
  }

  const handleApproveRequest = async () => {
    if (!selectedRequest) return
    
    setProcessingRequest(selectedRequest.id)
    try {
      const token = localStorage.getItem('bookgenie_token')
      await api.approveSubscriptionRequest(selectedRequest.id, token)
      showNotification('Subscription request approved', 'success')
      await loadSubscriptionRequests()
      await loadUsers(currentPage)
      setShowRequestModal(false)
      setSelectedRequest(null)
    } catch (error) {
      console.error('Approve error:', error)
      showNotification(error.message || 'Failed to approve request', 'error')
    } finally {
      setProcessingRequest(null)
    }
  }

  const handleRejectRequest = async (rejectionMessage) => {
    if (!selectedRequest) return
    
    setProcessingRequest(selectedRequest.id)
    try {
      const token = localStorage.getItem('bookgenie_token')
      await api.rejectSubscriptionRequest(selectedRequest.id, rejectionMessage, token)
      showNotification('Subscription request rejected', 'success')
      await loadSubscriptionRequests()
      setShowRequestModal(false)
      setSelectedRequest(null)
    } catch (error) {
      console.error('Reject error:', error)
      showNotification(error.message || 'Failed to reject request', 'error')
    } finally {
      setProcessingRequest(null)
    }
  }

  return (
    <div>
      <PageHeader
        icon={Users}
        title="Manage Users"
        description="View and manage all users"
        action={
          <div className="px-4 py-2 bg-primary-50 rounded-lg">
            <span className="text-primary-600 font-semibold">{users.length} Users</span>
          </div>
        }
      />

      {loading ? (
        <GridSkeleton count={6} />
      ) : users.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="card text-center py-16"
        >
          <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-600">No users found</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user, idx) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ y: -4 }}
              className="card-hover"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 text-white flex items-center justify-center font-semibold text-lg shadow-md overflow-hidden">
                  {(() => {
                    const avatarUrl = getAvatarUrl(user)
                    return avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={user.firstName || user.email}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none'
                          const parent = e.target.parentElement
                          const span = document.createElement('span')
                          span.textContent = user.firstName?.[0] || user.email?.[0] || 'U'
                          parent.appendChild(span)
                        }}
                      />
                    ) : (
                      <span>{user.firstName?.[0] || user.email?.[0] || 'U'}</span>
                    )
                  })()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {user.firstName || user.email?.split('@')[0]}
                  </h3>
                  <div className="flex items-center gap-1 text-sm text-gray-600 truncate">
                    <Mail className="w-3 h-3" />
                    <span className="truncate">{user.email}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mb-4 flex-wrap">
                <span className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 ${
                  user.role === 'admin' 
                    ? 'bg-red-50 text-red-600' 
                    : 'bg-blue-50 text-blue-600'
                }`}>
                  {user.role === 'admin' ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                  {user.role}
                </span>
                <span className="px-3 py-1 bg-purple-50 text-purple-600 rounded-lg text-xs font-semibold capitalize">
                  {user.subscriptionLevel || 'free'}
                </span>
              </div>
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setSelectedUser(user)
                    setShowViewModal(true)
                  }}
                  className="btn-secondary text-sm flex-1 flex items-center justify-center gap-1"
                >
                  <Eye className="w-4 h-4" />
                  View
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setSelectedUser(user)
                    setShowEditModal(true)
                  }}
                  className="btn-secondary text-sm flex-1 flex items-center justify-center gap-1"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setUserToDelete(user)
                    setShowDeleteModal(true)
                  }}
                  className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 text-sm px-3 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center"
                >
                  <Trash2 className="w-4 h-4" />
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.total_pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (currentPage > 1) {
                setCurrentPage(currentPage - 1)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }
            }}
            disabled={currentPage === 1}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              currentPage === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-primary-600 text-white hover:bg-primary-700'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
            Previous
          </motion.button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
              let pageNum
              if (pagination.total_pages <= 5) {
                pageNum = i + 1
              } else if (currentPage <= 3) {
                pageNum = i + 1
              } else if (currentPage >= pagination.total_pages - 2) {
                pageNum = pagination.total_pages - 4 + i
              } else {
                pageNum = currentPage - 2 + i
              }
              
              return (
                <motion.button
                  key={pageNum}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    setCurrentPage(pageNum)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  className={`w-10 h-10 rounded-lg ${
                    currentPage === pageNum
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {pageNum}
                </motion.button>
              )
            })}
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (currentPage < pagination.total_pages) {
                setCurrentPage(currentPage + 1)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }
            }}
            disabled={currentPage === pagination.total_pages}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              currentPage === pagination.total_pages
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-primary-600 text-white hover:bg-primary-700'
            }`}
          >
            Next
            <ChevronRight className="w-5 h-5" />
          </motion.button>
          
          <span className="text-sm text-gray-600 ml-4">
            Page {currentPage} of {pagination.total_pages} ({pagination.total} total)
          </span>
        </div>
      )}

      {/* Subscription Requests Section */}
      {subscriptionRequests.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Pending Subscription Requests</h2>
          <div className="card">
            <div className="space-y-3">
              {subscriptionRequests.map((request) => (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  onClick={() => {
                    setSelectedRequest(request)
                    setShowRequestModal(true)
                  }}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:border-primary-300 hover:shadow-md transition-all"
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{request.userName}</div>
                    <div className="text-sm text-gray-600">{request.userEmail}</div>
                    <div className="flex gap-2 mt-2">
                      <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs font-medium capitalize">
                        Current: {request.currentLevel || 'free'}
                      </span>
                      <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded text-xs font-medium capitalize">
                        Requested: {request.requestedLevel}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    Click to manage
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showViewModal && selectedUser && !showEditModal && (
        <UserViewModal
          user={selectedUser}
          onClose={() => {
            setShowViewModal(false)
            setSelectedUser(null)
          }}
          onEdit={() => {
            setShowViewModal(false)
            // Small delay to ensure view modal closes before edit opens
            setTimeout(() => {
              setShowEditModal(true)
            }, 100)
          }}
        />
      )}

      {showEditModal && selectedUser && (
        <UserEditModal
          user={selectedUser}
          loading={saving}
          onClose={() => {
            setShowEditModal(false)
            setSelectedUser(null)
          }}
          onSave={handleSaveUser}
        />
      )}

      {showDeleteModal && userToDelete && (
        <DeleteConfirmModal
          title="Delete User"
          message={`Are you sure you want to delete user "${userToDelete.firstName || userToDelete.email}"? This action cannot be undone.`}
          itemName={userToDelete.firstName || userToDelete.email}
          onConfirm={handleDeleteUser}
          onCancel={() => {
            setShowDeleteModal(false)
            setUserToDelete(null)
          }}
        />
      )}

      {showRequestModal && selectedRequest && (
        <SubscriptionRequestModal
          request={selectedRequest}
          onClose={() => {
            setShowRequestModal(false)
            setSelectedRequest(null)
          }}
          onApprove={handleApproveRequest}
          onReject={handleRejectRequest}
          loading={processingRequest === selectedRequest.id}
        />
      )}

      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  )
}


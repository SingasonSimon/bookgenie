import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, User, Mail, CheckCircle, XCircle, ArrowUp, Clock } from 'lucide-react'
import Spinner from '../Spinner'

export default function SubscriptionRequestModal({ request, onClose, onApprove, onReject, loading }) {
  const [rejectionMessage, setRejectionMessage] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)

  if (!request) return null

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
            <div>
              <h2 className="text-2xl font-display font-bold text-gray-900">Subscription Request</h2>
              <p className="text-sm text-gray-600 mt-1">Review and manage subscription upgrade request</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto flex-1 p-6 space-y-6">
            {/* User Info */}
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-primary-600" />
                User Information
              </h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-600">Name:</span>
                  <p className="font-medium text-gray-900">{request.userName}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Email:</span>
                  <p className="font-medium text-gray-900">{request.userEmail}</p>
                </div>
              </div>
            </div>

            {/* Request Details */}
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <ArrowUp className="w-5 h-5 text-primary-600" />
                Request Details
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Current Subscription:</span>
                  <span className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold capitalize">
                    {request.currentLevel || 'free'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-primary-50 rounded-lg">
                  <span className="text-sm text-gray-600">Requested Subscription:</span>
                  <span className="px-3 py-1 bg-primary-600 text-white rounded-lg text-sm font-semibold capitalize">
                    {request.requestedLevel}
                  </span>
                </div>
                {request.createdAt && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>Requested on {new Date(request.createdAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Rejection Form */}
            {showRejectForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="card border-2 border-red-200 bg-red-50"
              >
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-600" />
                  Rejection Reason (Required)
                </h3>
                <textarea
                  value={rejectionMessage}
                  onChange={(e) => setRejectionMessage(e.target.value)}
                  placeholder="Please provide a reason for rejecting this subscription request..."
                  rows={4}
                  className="input-field resize-none w-full"
                  required
                />
                <p className="text-xs text-gray-600 mt-2">This message will be visible to the user.</p>
              </motion.div>
            )}
          </div>

          {/* Footer Actions */}
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
            {!showRejectForm ? (
              <>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowRejectForm(true)}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  disabled={loading}
                >
                  <XCircle className="w-5 h-5" />
                  Reject
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onApprove}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Spinner size="sm" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Approve
                    </>
                  )}
                </motion.button>
              </>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  if (!rejectionMessage.trim()) {
                    alert('Please provide a rejection reason')
                    return
                  }
                  onReject(rejectionMessage)
                }}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                disabled={loading || !rejectionMessage.trim()}
              >
                {loading ? (
                  <>
                    <Spinner size="sm" />
                    Processing...
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5" />
                    Confirm Rejection
                  </>
                )}
              </motion.button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )

  return typeof window !== 'undefined' ? createPortal(modalContent, document.body) : null
}


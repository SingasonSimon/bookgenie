import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, BookOpen, User, Tag, GraduationCap, Star, FileText, Heart, MessageSquare, ThumbsUp } from 'lucide-react'
import { BookGenieAPI } from '../services/api'
import Spinner from './Spinner'
import Notification from './Notification'
import { useAuth } from '../contexts/AuthContext'

export default function BookDetailsModal({ book, onClose, onDownload, user }) {
  const { user: authUser } = useAuth()
  const [reviews, setReviews] = useState([])
  const [averageRating, setAverageRating] = useState(0)
  const [totalReviews, setTotalReviews] = useState(0)
  const [totalLikes, setTotalLikes] = useState(0)
  const [userLiked, setUserLiked] = useState(false)
  const [userReview, setUserReview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submittingReview, setSubmittingReview] = useState(false)
  const [liking, setLiking] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [notification, setNotification] = useState(null)
  const api = new BookGenieAPI()
  
  const currentUser = user || authUser

  useEffect(() => {
    if (book) {
      loadReviewsAndLikes()
      
      // Record view interaction when modal opens (if user is logged in)
      if (currentUser && book.id) {
        const token = localStorage.getItem('bookgenie_token')
        if (token) {
          // Record view interaction (non-blocking)
          api.recordInteraction(book.id, 'view', 0.5, token).catch(err => {
            console.error('Error recording view interaction:', err)
          })
        }
      }
    }
  }, [book])

  const loadReviewsAndLikes = async () => {
    if (!book) return
    setLoading(true)
    try {
      const token = user ? localStorage.getItem('bookgenie_token') : null
      
      // Load reviews
      const reviewsData = await api.getBookReviews(book.id, token)
      setReviews(reviewsData.reviews || [])
      setAverageRating(reviewsData.averageRating || 0)
      setTotalReviews(reviewsData.totalReviews || 0)
      
      // Find user's review
      if (user) {
        const myReview = reviewsData.reviews?.find(r => r.userId === user.id)
        setUserReview(myReview || null)
        if (myReview) {
          setReviewRating(myReview.rating)
          setReviewComment(myReview.comment || '')
        }
      }
      
      // Load likes
      const likesData = await api.getBookLikes(book.id, token)
      setTotalLikes(likesData.totalLikes || 0)
      setUserLiked(likesData.userLiked || false)
    } catch (error) {
      console.error('Error loading reviews and likes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async () => {
    if (!user) {
      showNotification('Please login to like books', 'error')
      return
    }
    
    setLiking(true)
    try {
      const token = localStorage.getItem('bookgenie_token')
      const result = userLiked 
        ? await api.unlikeBook(book.id, token)
        : await api.likeBook(book.id, token)
      
      setTotalLikes(result.totalLikes)
      setUserLiked(!userLiked)
    } catch (error) {
      console.error('Error toggling like:', error)
      showNotification('Failed to update like', 'error')
    } finally {
      setLiking(false)
    }
  }

  const handleSubmitReview = async (e) => {
    e.preventDefault()
    if (!user) {
      showNotification('Please login to submit reviews', 'error')
      return
    }
    
    setSubmittingReview(true)
    try {
      const token = localStorage.getItem('bookgenie_token')
      const result = await api.createBookReview(book.id, reviewRating, reviewComment, token)
      
      // Record review interaction
      try {
        await api.recordInteraction(book.id, 'review', reviewRating / 5.0, token)
      } catch (err) {
        console.error('Error recording review interaction:', err)
      }
      
      showNotification('Review submitted successfully!', 'success')
      setShowReviewForm(false)
      await loadReviewsAndLikes()
    } catch (error) {
      console.error('Error submitting review:', error)
      showNotification(error.message || 'Failed to submit review', 'error')
    } finally {
      setSubmittingReview(false)
    }
  }

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  const handleDownload = async () => {
    if (!currentUser) {
      showNotification('Please login to download books', 'error')
      return
    }
    
    if (!book.file_url) {
      showNotification('Book file not available', 'error')
      return
    }

    setDownloading(true)
    try {
      const token = localStorage.getItem('bookgenie_token')
      if (!token) {
        showNotification('Please login to download books', 'error')
        return
      }
      
      // Download the book
      await api.downloadBook(book.file_url, token)
      
      // Record reading session (default 5 minutes, user can adjust later)
      try {
        const readingResult = await api.recordReading(book.id, 5, token)
      } catch (err) {
        console.error('Error recording reading session:', err)
        // Don't fail the download if recording fails
      }
      
      // Also record download interaction
      try {
        const interactionResult = await api.recordInteraction(book.id, 'download', 1.0, token)
      } catch (err) {
        console.error('Error recording interaction:', err)
      }
      
      showNotification('Download started', 'success')
      if (onDownload) {
        onDownload()
      }
      
      // Refresh parent component if it has a refresh function
      // This will be handled by the onClose callback
    } catch (error) {
      console.error('Download error:', error)
      showNotification(error.message || 'Failed to download book', 'error')
    } finally {
      setDownloading(false)
    }
  }

  if (!book) return null

  const coverImage = book.cover_image && book.cover_image.startsWith('/api/files/')
    ? `http://localhost:5000${book.cover_image}`
    : null

  const tags = book.tags ? (typeof book.tags === 'string' ? book.tags.split(',').filter(Boolean) : book.tags) : []

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
          className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl relative flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-gray-400 hover:text-gray-600 shadow-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </motion.button>

          {/* Content */}
          <div className="overflow-y-auto flex-1">
            {/* Header Section with Cover */}
            <div className="bg-gradient-to-br from-primary-50 to-purple-50 p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row gap-6">
                {/* Cover Image */}
                <div className="flex-shrink-0">
                  {coverImage ? (
                    <motion.img
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                      src={coverImage}
                      alt={book.title}
                      className="w-32 h-48 sm:w-40 sm:h-60 object-cover rounded-lg shadow-xl mx-auto sm:mx-0"
                    />
                  ) : (
                    <div className="w-32 h-48 sm:w-40 sm:h-60 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-xl mx-auto sm:mx-0">
                      <BookOpen className="w-16 h-16 sm:w-20 sm:h-20 text-white" />
                    </div>
                  )}
                </div>

                {/* Title and Author */}
                <div className="flex-1 text-center sm:text-left">
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-gray-900 mb-3">
                    {book.title}
                  </h2>
                  <div className="flex items-center justify-center sm:justify-start gap-2 text-gray-600 mb-4">
                    <User className="w-5 h-5" />
                    <span className="text-lg font-medium">{book.author}</span>
                  </div>

                  {/* Rating and Likes */}
                  <div className="flex items-center justify-center sm:justify-start gap-4 mb-4">
                    {averageRating > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                        <span className="text-lg font-semibold text-gray-900">{averageRating}</span>
                        <span className="text-sm text-gray-600">({totalReviews})</span>
                      </div>
                    )}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleLike}
                      disabled={liking || !user}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                        userLiked 
                          ? 'bg-red-100 text-red-700' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      } ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <Heart className={`w-5 h-5 ${userLiked ? 'fill-red-500 text-red-500' : ''}`} />
                      <span className="font-medium">{totalLikes}</span>
                    </motion.button>
                  </div>

                  {/* Metadata Tags */}
                  <div className="flex flex-wrap gap-2 justify-center sm:justify-start mb-4">
                    {book.genre && (
                      <span className="bg-primary-100 text-primary-700 px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5">
                        <Tag className="w-4 h-4" />
                        {book.genre}
                      </span>
                    )}
                    {book.academic_level && (
                      <span className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-semibold capitalize flex items-center gap-1.5">
                        <GraduationCap className="w-4 h-4" />
                        {book.academic_level}
                      </span>
                    )}
                    {book.subscription_level && (
                      <span className="bg-amber-100 text-amber-700 px-3 py-1.5 rounded-lg text-sm font-semibold capitalize flex items-center gap-1.5">
                        <Star className="w-4 h-4" />
                        {book.subscription_level}
                      </span>
                    )}
                    {book.pages && (
                      <span className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5">
                        <FileText className="w-4 h-4" />
                        {book.pages} pages
                      </span>
                    )}
                  </div>

                  {/* Tags */}
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                      {tags.map((tag, idx) => (
                        <span key={idx} className="bg-gray-50 text-gray-600 px-2.5 py-1 rounded-md text-xs font-medium border border-gray-200">
                          #{tag.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Abstract Section */}
            <div className="p-6 sm:p-8 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary-600" />
                About This Book
              </h3>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {book.abstract || 'No abstract available for this book.'}
              </p>
            </div>

            {/* Reviews Section */}
            <div className="p-6 sm:p-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary-600" />
                  Reviews ({totalReviews})
                </h3>
                {user && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowReviewForm(!showReviewForm)}
                    className="btn-primary text-sm py-2 px-4"
                  >
                    {userReview ? 'Edit Review' : 'Write Review'}
                  </motion.button>
                )}
              </div>

              {/* Review Form */}
              {showReviewForm && user && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <form onSubmit={handleSubmitReview} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <motion.button
                            key={rating}
                            type="button"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setReviewRating(rating)}
                            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                              reviewRating >= rating
                                ? 'bg-yellow-400 text-yellow-900'
                                : 'bg-gray-200 text-gray-400'
                            }`}
                          >
                            <Star className={`w-5 h-5 ${reviewRating >= rating ? 'fill-current' : ''}`} />
                          </motion.button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Comment</label>
                      <textarea
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Share your thoughts about this book..."
                      />
                    </div>
                    <div className="flex gap-2">
                      <motion.button
                        type="submit"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={submittingReview}
                        className="btn-primary text-sm py-2 px-4 flex items-center gap-2"
                      >
                        {submittingReview ? (
                          <>
                            <Spinner size="sm" />
                            Submitting...
                          </>
                        ) : (
                          'Submit Review'
                        )}
                      </motion.button>
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setShowReviewForm(false)
                          if (userReview) {
                            setReviewRating(userReview.rating)
                            setReviewComment(userReview.comment || '')
                          } else {
                            setReviewRating(5)
                            setReviewComment('')
                          }
                        }}
                        className="btn-secondary text-sm py-2 px-4"
                      >
                        Cancel
                      </motion.button>
                    </div>
                  </form>
                </motion.div>
              )}

              {/* Reviews List */}
              {loading ? (
                <div className="text-center py-8">
                  <Spinner size="md" />
                </div>
              ) : reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <motion.div
                      key={review.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-gray-900">{review.userName}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(review.createdAt).toLocaleDateString()}
                            {review.updatedAt && review.updatedAt !== review.createdAt && ' (edited)'}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <Star
                              key={rating}
                              className={`w-4 h-4 ${
                                rating <= review.rating
                                  ? 'text-yellow-500 fill-yellow-500'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-gray-700 text-sm leading-relaxed">{review.comment}</p>
                      )}
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>No reviews yet. Be the first to review this book!</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="border-t border-gray-200 p-4 sm:p-6 bg-gray-50">
            <div className="flex flex-col sm:flex-row gap-3">
              {currentUser && book.file_url ? (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDownload}
                  disabled={downloading}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {downloading ? (
                    <>
                      <Spinner size="sm" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      Download Book
                    </>
                  )}
                </motion.button>
              ) : (
                <div className="flex-1 py-3 px-4 bg-gray-100 rounded-lg text-center text-gray-600 text-sm font-medium">
                  {!currentUser ? 'Login to download this book' : 'Download not available'}
                </div>
              )}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className="btn-secondary flex-1 sm:flex-initial sm:min-w-[120px]"
              >
                Close
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )

  return (
    <>
      {typeof window !== 'undefined' ? createPortal(modalContent, document.body) : null}
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </>
  )
}

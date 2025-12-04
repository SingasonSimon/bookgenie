import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Upload, FileText, Image as ImageIcon } from 'lucide-react'
import Spinner from '../Spinner'

export default function BookFormModal({ book, onClose, onSave, onUploadFile, onUploadCover }) {
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    abstract: '',
    genre: '',
    academic_level: '',
    subscription_level: 'free',
    tags: '',
    pages: 0,
  })
  const [bookFile, setBookFile] = useState(null)
  const [coverFile, setCoverFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (book) {
      setFormData({
        title: book.title || '',
        author: book.author || '',
        abstract: book.abstract || '',
        genre: book.genre || '',
        academic_level: book.academic_level || '',
        subscription_level: book.subscription_level || 'free',
        tags: Array.isArray(book.tags) ? book.tags.join(', ') : (book.tags || ''),
        pages: book.pages || 0,
      })
    }
  }, [book])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
      const bookData = {
        ...formData,
        tags: tagsArray,
        pages: parseInt(formData.pages) || 0,
      }

      const savedBook = await onSave(bookData)
      
      // Upload files if provided
      if (savedBook && savedBook.id) {
        setUploading(true)
        const uploadPromises = []
        
        if (bookFile) {
          uploadPromises.push(onUploadFile(savedBook.id, bookFile))
        }
        if (coverFile) {
          uploadPromises.push(onUploadCover(savedBook.id, coverFile))
        }
        
        if (uploadPromises.length > 0) {
          await Promise.all(uploadPromises)
        }
        setUploading(false)
      }

      onClose()
    } catch (error) {
      console.error('Error saving book:', error)
      alert(error.message || 'Failed to save book')
    } finally {
      setLoading(false)
      setUploading(false)
    }
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
          className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl relative flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-display font-bold text-gray-900">
              {book ? 'Edit Book' : 'Add New Book'}
            </h2>
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
                <label className="block mb-2 text-gray-700 font-medium text-sm">Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="input-field"
                  placeholder="Book title"
                />
              </div>

              <div>
                <label className="block mb-2 text-gray-700 font-medium text-sm">Author *</label>
                <input
                  type="text"
                  name="author"
                  value={formData.author}
                  onChange={handleChange}
                  required
                  className="input-field"
                  placeholder="Author name"
                />
              </div>
            </div>

            <div>
              <label className="block mb-2 text-gray-700 font-medium text-sm">Abstract</label>
              <textarea
                name="abstract"
                value={formData.abstract}
                onChange={handleChange}
                rows={4}
                className="input-field resize-none"
                placeholder="Book description or abstract"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block mb-2 text-gray-700 font-medium text-sm">Genre</label>
                <select
                  name="genre"
                  value={formData.genre}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="">Select Genre</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Physics">Physics</option>
                  <option value="Biology">Biology</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="Literature">Literature</option>
                </select>
              </div>

              <div>
                <label className="block mb-2 text-gray-700 font-medium text-sm">Academic Level</label>
                <select
                  name="academic_level"
                  value={formData.academic_level}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="">Select Level</option>
                  <option value="undergraduate">Undergraduate</option>
                  <option value="graduate">Graduate</option>
                  <option value="postgraduate">Postgraduate</option>
                </select>
              </div>

              <div>
                <label className="block mb-2 text-gray-700 font-medium text-sm">Subscription Level</label>
                <select
                  name="subscription_level"
                  value={formData.subscription_level}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="free">Free</option>
                  <option value="basic">Basic</option>
                  <option value="premium">Premium</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block mb-2 text-gray-700 font-medium text-sm">Tags</label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Comma-separated tags (e.g., AI, Machine Learning)"
                />
              </div>

              <div>
                <label className="block mb-2 text-gray-700 font-medium text-sm">Pages</label>
                <input
                  type="number"
                  name="pages"
                  value={formData.pages}
                  onChange={handleChange}
                  min="0"
                  className="input-field"
                  placeholder="Number of pages"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block mb-2 text-gray-700 font-medium text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Book File (PDF, EPUB, etc.)
                </label>
                <div className="space-y-2">
                  <div className="relative">
                    <input
                      type="file"
                      accept=".pdf,.epub,.txt,.doc,.docx"
                      onChange={(e) => setBookFile(e.target.files[0])}
                      className="input-field file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                    />
                    {bookFile && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-600">
                        {bookFile.name}
                      </span>
                    )}
                  </div>
                  {book && book.file_url && !bookFile && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs text-blue-700 font-medium mb-1">Current File:</p>
                      <p className="text-sm text-blue-900 truncate" title={book.file_url}>
                        {book.file_url.split('/').pop() || book.file_url}
                      </p>
                      <p className="text-xs text-blue-600 mt-1">Select a new file to replace the current one</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block mb-2 text-gray-700 font-medium text-sm flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  Cover Image
                </label>
                <div className="space-y-2">
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setCoverFile(e.target.files[0])}
                      className="input-field file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                    />
                    {coverFile && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-600">
                        {coverFile.name}
                      </span>
                    )}
                  </div>
                  {book && book.cover_image && book.cover_image !== 'book' && !coverFile && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs text-blue-700 font-medium mb-1">Current Cover:</p>
                      <div className="flex items-center gap-2">
                        {book.cover_image && (
                          <img 
                            src={book.cover_image.startsWith('http') 
                              ? book.cover_image 
                              : `http://localhost:5000/api/files/covers/${book.cover_image}`}
                            alt="Current cover"
                            className="w-12 h-16 object-cover rounded border border-blue-300"
                            onError={(e) => {
                              e.target.style.display = 'none'
                            }}
                          />
                        )}
                        <p className="text-sm text-blue-900 truncate flex-1" title={book.cover_image}>
                          {book.cover_image.split('/').pop() || book.cover_image}
                        </p>
                      </div>
                      <p className="text-xs text-blue-600 mt-1">Select a new image to replace the current one</p>
                    </div>
                  )}
                </div>
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
              disabled={loading || uploading}
            >
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              onClick={handleSubmit}
              className="btn-primary flex items-center gap-2"
              disabled={loading || uploading}
            >
              {(loading || uploading) ? (
                <>
                  <Spinner size="sm" />
                  {uploading ? 'Uploading...' : 'Saving...'}
                </>
              ) : (
                book ? 'Update Book' : 'Create Book'
              )}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )

  return typeof window !== 'undefined' ? createPortal(modalContent, document.body) : null
}


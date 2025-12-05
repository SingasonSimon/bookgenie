import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Tag } from 'lucide-react'
import Spinner from '../Spinner'

export default function GenreRenameModal({ genre, onClose, onSave, loading }) {
  const [newGenre, setNewGenre] = useState(genre?.genre || '')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!newGenre.trim()) {
      return
    }
    if (newGenre.trim() === genre.genre) {
      onClose()
      return
    }
    await onSave(newGenre.trim())
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
          className="bg-white rounded-2xl max-w-md w-full shadow-2xl relative"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
                <Tag className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h2 className="text-2xl font-display font-bold text-gray-900">Rename Genre</h2>
                <p className="text-sm text-gray-500 mt-0.5">Update genre name across all books</p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all"
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-sm text-blue-800 font-medium mb-2">Current Genre:</p>
              <p className="text-lg font-semibold text-blue-900">{genre?.genre}</p>
              <p className="text-xs text-blue-600 mt-1">{genre?.count || 0} books will be updated</p>
            </div>

            <div>
              <label className="block mb-2 text-gray-700 font-semibold text-sm">
                New Genre Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newGenre}
                onChange={(e) => setNewGenre(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
                placeholder="Enter new genre name"
                autoFocus
              />
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors"
                disabled={loading}
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="flex-1 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                disabled={loading || !newGenre.trim() || newGenre.trim() === genre?.genre}
              >
                {loading ? (
                  <>
                    <Spinner size="sm" />
                    <span>Renaming...</span>
                  </>
                ) : (
                  'Rename Genre'
                )}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )

  return typeof window !== 'undefined' ? createPortal(modalContent, document.body) : null
}


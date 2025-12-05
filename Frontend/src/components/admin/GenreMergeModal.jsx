import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Merge, Tag } from 'lucide-react'
import Spinner from '../Spinner'

export default function GenreMergeModal({ selectedGenres, allGenres, onClose, onSave, loading }) {
  const [targetGenre, setTargetGenre] = useState('')
  const [customGenre, setCustomGenre] = useState('')

  const availableTargetGenres = allGenres
    .filter(g => !selectedGenres.includes(g.genre))
    .map(g => g.genre)

  const totalBooks = selectedGenres.reduce((sum, genre) => {
    const genreData = allGenres.find(g => g.genre === genre)
    return sum + (genreData?.count || 0)
  }, 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const finalTarget = targetGenre === 'custom' ? customGenre.trim() : targetGenre
    if (!finalTarget) {
      return
    }
    await onSave(selectedGenres, finalTarget)
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
          className="bg-white rounded-2xl max-w-lg w-full shadow-2xl relative max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <Merge className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-2xl font-display font-bold text-gray-900">Merge Genres</h2>
                <p className="text-sm text-gray-500 mt-0.5">Combine multiple genres into one</p>
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

          <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 space-y-5">
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
              <p className="text-sm text-purple-800 font-medium mb-2">Genres to Merge:</p>
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedGenres.map((genre) => {
                  const genreData = allGenres.find(g => g.genre === genre)
                  return (
                    <span
                      key={genre}
                      className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-sm font-semibold flex items-center gap-2"
                    >
                      <Tag className="w-3 h-3" />
                      {genre} ({genreData?.count || 0})
                    </span>
                  )
                })}
              </div>
              <p className="text-xs text-purple-600 mt-2">
                Total: {totalBooks} books will be updated
              </p>
            </div>

            <div>
              <label className="block mb-2 text-gray-700 font-semibold text-sm">
                Target Genre <span className="text-red-500">*</span>
              </label>
              <select
                value={targetGenre}
                onChange={(e) => setTargetGenre(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
                required
              >
                <option value="">Select target genre or create new</option>
                {availableTargetGenres.map((genre) => (
                  <option key={genre} value={genre}>
                    {genre}
                  </option>
                ))}
                <option value="custom">Create New Genre</option>
              </select>
            </div>

            {targetGenre === 'custom' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <label className="block mb-2 text-gray-700 font-semibold text-sm">
                  New Genre Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={customGenre}
                  onChange={(e) => setCustomGenre(e.target.value)}
                  required={targetGenre === 'custom'}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
                  placeholder="Enter new genre name"
                  autoFocus
                />
              </motion.div>
            )}

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
                className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                disabled={loading || !targetGenre || (targetGenre === 'custom' && !customGenre.trim())}
              >
                {loading ? (
                  <>
                    <Spinner size="sm" />
                    <span>Merging...</span>
                  </>
                ) : (
                  <>
                    <Merge className="w-5 h-5" />
                    Merge Genres
                  </>
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


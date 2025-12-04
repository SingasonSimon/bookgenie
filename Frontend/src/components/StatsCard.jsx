import React from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Sparkles } from 'lucide-react'

export default function StatsCard({ totalBooks }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card relative overflow-hidden group"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-200/40 to-primary-300/20 rounded-full -mr-16 -mt-16 opacity-50 group-hover:opacity-70 transition-opacity duration-500"></div>
        <div className="relative flex items-center gap-4 p-4">
          <motion.div
            whileHover={{ rotate: 5, scale: 1.05 }}
            className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center shadow-lg group-hover:shadow-primary-500/50 transition-shadow"
          >
            <BookOpen className="w-7 h-7 text-white" />
          </motion.div>
          <div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
              className="text-4xl font-display font-bold text-gradient mb-1"
            >
              {totalBooks}
            </motion.div>
            <div className="text-gray-600 font-medium text-sm">Total Books</div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card relative overflow-hidden group"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-200/40 to-purple-300/20 rounded-full -mr-16 -mt-16 opacity-50 group-hover:opacity-70 transition-opacity duration-500"></div>
        <div className="relative flex items-center gap-4 p-4">
          <motion.div
            whileHover={{ rotate: 5, scale: 1.05 }}
            className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center shadow-lg group-hover:shadow-purple-500/50 transition-shadow"
          >
            <Sparkles className="w-7 h-7 text-white" />
          </motion.div>
          <div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
              className="text-4xl font-display font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent mb-1"
            >
              95%
            </motion.div>
            <div className="text-gray-600 font-medium text-sm">AI Accuracy</div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}


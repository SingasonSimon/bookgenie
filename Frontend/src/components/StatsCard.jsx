import React from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Sparkles } from 'lucide-react'

export default function StatsCard({ totalBooks }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        whileHover={{ y: -2 }}
        className="card"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {totalBooks}
            </div>
            <div className="text-gray-600 text-sm font-medium">Total Books</div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        whileHover={{ y: -2 }}
        className="card"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">
              95%
            </div>
            <div className="text-gray-600 text-sm font-medium">AI Accuracy</div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}


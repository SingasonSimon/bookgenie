import React from 'react'
import { motion } from 'framer-motion'
import { Search } from 'lucide-react'
import Spinner from './Spinner'

export default function LoadingIndicator({ message = 'Searching...' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card mb-8 flex flex-col items-center justify-center py-16"
    >
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="mb-4"
      >
        <Search className="w-12 h-12 text-primary-500" />
      </motion.div>
      <Spinner size="md" className="mb-4" />
      <p className="text-gray-600 font-medium">{message}</p>
    </motion.div>
  )
}


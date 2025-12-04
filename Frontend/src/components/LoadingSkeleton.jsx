import React from 'react'
import { motion } from 'framer-motion'

export function BookCardSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="card"
    >
      <div className="flex gap-4 mb-4">
        <div className="w-16 h-16 skeleton rounded-lg flex-shrink-0"></div>
        <div className="flex-1">
          <div className="h-5 skeleton rounded mb-2 w-3/4"></div>
          <div className="h-4 skeleton rounded w-1/2"></div>
        </div>
      </div>
      <div className="h-4 skeleton rounded mb-2"></div>
      <div className="h-4 skeleton rounded w-5/6 mb-4"></div>
      <div className="flex gap-2 mb-4">
        <div className="h-6 skeleton rounded-full w-20"></div>
        <div className="h-6 skeleton rounded-full w-24"></div>
      </div>
      <div className="h-10 skeleton rounded-lg"></div>
    </motion.div>
  )
}

export function StatCardSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="card"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 skeleton rounded-lg"></div>
        <div className="flex-1">
          <div className="h-8 skeleton rounded w-20 mb-2"></div>
          <div className="h-4 skeleton rounded w-24"></div>
        </div>
      </div>
    </motion.div>
  )
}

export function GridSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <BookCardSkeleton key={i} />
      ))}
    </div>
  )
}


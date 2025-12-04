import React from 'react'
import { motion } from 'framer-motion'

export function BookCardSkeleton() {
  return (
    <div className="card">
      <div className="flex gap-4 mb-4">
        <div className="w-20 h-28 skeleton rounded-lg flex-shrink-0"></div>
        <div className="flex-1">
          <div className="h-5 skeleton rounded mb-2 w-3/4"></div>
          <div className="h-4 skeleton rounded w-1/2 mb-3"></div>
          <div className="flex gap-2">
            <div className="h-6 skeleton rounded w-20"></div>
            <div className="h-6 skeleton rounded w-24"></div>
          </div>
        </div>
      </div>
      <div className="h-4 skeleton rounded mb-2"></div>
      <div className="h-4 skeleton rounded w-5/6 mb-4"></div>
      <div className="h-10 skeleton rounded-lg"></div>
    </div>
  )
}

export function StatCardSkeleton() {
  return (
    <div className="card">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 skeleton rounded-lg"></div>
        <div className="flex-1">
          <div className="h-7 skeleton rounded w-16 mb-2"></div>
          <div className="h-4 skeleton rounded w-20"></div>
        </div>
      </div>
    </div>
  )
}

export function GridSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <BookCardSkeleton key={i} />
      ))}
    </div>
  )
}


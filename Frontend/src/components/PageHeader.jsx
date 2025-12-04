import React from 'react'
import { motion } from 'framer-motion'

export default function PageHeader({ icon: Icon, title, description, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center">
              <Icon className="w-6 h-6 text-primary-600" />
            </div>
          )}
          <div>
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-gray-900">
              {title}
            </h1>
            {description && (
              <p className="text-gray-600 mt-1">{description}</p>
            )}
          </div>
        </div>
        {action && <div>{action}</div>}
      </div>
    </motion.div>
  )
}


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
        <div className="flex items-center gap-4">
          {Icon && (
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg">
              <Icon className="w-6 h-6 text-white" />
            </div>
          )}
          <div>
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-gray-900">
              {title}
            </h1>
            {description && (
              <p className="text-gray-600 mt-1.5 text-sm sm:text-base">{description}</p>
            )}
          </div>
        </div>
        {action && <div className="flex items-center gap-2">{action}</div>}
      </div>
    </motion.div>
  )
}


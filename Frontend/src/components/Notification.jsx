import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, XCircle, Info, X } from 'lucide-react'

export default function Notification({ message, type = 'info', onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, 4000)
    return () => clearTimeout(timer)
  }, [onClose])

  const config = {
    success: {
      bg: 'bg-green-500',
      icon: CheckCircle2,
      border: 'border-green-600',
    },
    error: {
      bg: 'bg-red-500',
      icon: XCircle,
      border: 'border-red-600',
    },
    info: {
      bg: 'bg-blue-500',
      icon: Info,
      border: 'border-blue-600',
    },
  }

  const { bg, icon: Icon, border } = config[type]

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: 400, opacity: 0, scale: 0.9 }}
        animate={{ x: 0, opacity: 1, scale: 1 }}
        exit={{ x: 400, opacity: 0, scale: 0.9 }}
        className={`fixed top-5 right-5 ${bg} text-white px-6 py-4 rounded-xl shadow-2xl z-[10000] border-2 ${border} min-w-[300px] max-w-md backdrop-blur-sm`}
      >
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 flex-shrink-0" />
          <span className="font-medium flex-1">{message}</span>
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="text-white/90 hover:text-white transition-colors p-1 rounded-full hover:bg-white/20"
          >
            <X className="w-5 h-5" />
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}


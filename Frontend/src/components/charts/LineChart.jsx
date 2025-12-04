import React from 'react'
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function LineChart({ data, dataKey, name, color = '#3b82f6' }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsLineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis 
          dataKey="date" 
          stroke="#6b7280"
          style={{ fontSize: '12px' }}
          tickFormatter={(value) => {
            const date = new Date(value)
            return `${date.getMonth() + 1}/${date.getDate()}`
          }}
        />
        <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#fff', 
            border: '1px solid #e5e7eb', 
            borderRadius: '8px',
            fontSize: '12px'
          }}
          labelFormatter={(value) => {
            const date = new Date(value)
            return date.toLocaleDateString()
          }}
        />
        <Legend wrapperStyle={{ fontSize: '12px' }} />
        <Line 
          type="monotone" 
          dataKey={dataKey} 
          name={name}
          stroke={color} 
          strokeWidth={2}
          dot={{ fill: color, r: 4 }}
          activeDot={{ r: 6 }}
        />
      </RechartsLineChart>
    </ResponsiveContainer>
  )
}


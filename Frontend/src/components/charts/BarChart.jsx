import React from 'react'
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function BarChart({ data, dataKey, name, color = '#3b82f6' }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsBarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis 
          dataKey={dataKey}
          stroke="#6b7280"
          style={{ fontSize: '12px' }}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#fff', 
            border: '1px solid #e5e7eb', 
            borderRadius: '8px',
            fontSize: '12px'
          }}
        />
        <Legend wrapperStyle={{ fontSize: '12px' }} />
        <Bar dataKey={name} fill={color} radius={[8, 8, 0, 0]} />
      </RechartsBarChart>
    </ResponsiveContainer>
  )
}


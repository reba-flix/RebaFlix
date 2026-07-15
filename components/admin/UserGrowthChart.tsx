'use client'

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

interface ChartData {
  date: string
  users: number
}

export function UserGrowthChart({ data }: { data: ChartData[] }) {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <XAxis 
            dataKey="date" 
            stroke="#ffffff50" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
          />
          <YAxis 
            stroke="#ffffff50" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
            tickFormatter={(value: number | string) => `${value}`}
          />
          <Tooltip 
            cursor={{ fill: '#ffffff10' }}
            contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #ffffff10', borderRadius: '8px', color: '#fff' }}
          />
          <Bar 
            dataKey="users" 
            fill="#E50914" 
            radius={[4, 4, 0, 0]} 
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

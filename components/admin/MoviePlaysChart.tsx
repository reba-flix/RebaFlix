'use client'

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts'

interface MoviePlaysData {
  title: string
  plays: number
}

export function MoviePlaysChart({ data }: { data: MoviePlaysData[] }) {
  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
          <XAxis
            type="number"
            stroke="#ffffff30"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            type="category"
            dataKey="title"
            stroke="#ffffff50"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            width={120}
            tickFormatter={(v: string) => v.length > 16 ? v.slice(0, 16) + '…' : v}
          />
          <Tooltip
            cursor={{ fill: '#ffffff08' }}
            contentStyle={{
              backgroundColor: '#1a1a1a',
              border: '1px solid #ffffff15',
              borderRadius: '10px',
              color: '#fff',
              fontSize: '13px',
            }}
            formatter={(value: number) => [value.toLocaleString(), 'Plays']}
          />
          <Bar dataKey="plays" radius={[0, 4, 4, 0]} maxBarSize={28}>
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={index === 0 ? '#E50914' : index === 1 ? '#c0070f' : '#80050b'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

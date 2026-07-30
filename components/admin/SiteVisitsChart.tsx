'use client'

import { useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  LineChart,
  Line,
} from 'recharts'

type DayData = {
  date: string
  total: number
  newVisitors: number
  returning: number
  prevTotal: number
}

type Props = {
  data: DayData[]
}

const TOOLTIP_STYLE = {
  backgroundColor: '#111',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '10px',
  color: '#fff',
  fontSize: '12px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
}

const LABEL_STYLE = { fill: 'rgba(255,255,255,0.45)', fontSize: 11 }

function formatDate(iso: string) {
  const [, m, d] = iso.split('-')
  return `${d}/${m}`
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={TOOLTIP_STYLE} className="px-4 py-3 min-w-[160px]">
      <p className="text-white/50 text-[11px] mb-2 font-medium">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2 mb-1">
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: p.color }} />
          <span className="text-white/70 text-[12px]">{p.name}:</span>
          <span className="text-white font-semibold text-[12px] ml-auto">{p.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  )
}

type View = 'bar' | 'line'
type Range = 7 | 14 | 30

export function SiteVisitsChart({ data }: Props) {
  const [view, setView] = useState<View>('bar')
  const [range, setRange] = useState<Range>(30)

  const sliced = data.slice(-range)
  const chartData = sliced.map((d) => ({ ...d, date: formatDate(d.date) }))

  const avg = sliced.length ? Math.round(sliced.reduce((s, d) => s + d.total, 0) / sliced.length) : 0

  return (
    <div className="w-full space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Range selector */}
        <div className="flex items-center gap-1 bg-white/[0.04] rounded-lg p-1">
          {([7, 14, 30] as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                range === r
                  ? 'bg-[#E50914] text-white shadow shadow-[#E50914]/40'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              {r}d
            </button>
          ))}
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 bg-white/[0.04] rounded-lg p-1">
          {(['bar', 'line'] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all capitalize ${
                view === v
                  ? 'bg-white/10 text-white'
                  : 'text-white/40 hover:text-white'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs">
        <span className="flex items-center gap-1.5 text-white/60">
          <span className="w-3 h-3 rounded-sm bg-[#E50914]" /> Total visits
        </span>
        <span className="flex items-center gap-1.5 text-white/60">
          <span className="w-3 h-3 rounded-sm bg-emerald-500" /> New visitors
        </span>
        <span className="flex items-center gap-1.5 text-white/60">
          <span className="w-3 h-3 rounded-sm bg-blue-500/60" /> Returning
        </span>
        <span className="flex items-center gap-1.5 text-white/60">
          <span className="w-3 h-3 rounded-sm border border-dashed border-white/30" /> Prev. period
        </span>
      </div>

      {/* Chart */}
      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {view === 'bar' ? (
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="date" tick={LABEL_STYLE} tickLine={false} axisLine={false} interval={range === 30 ? 4 : range === 14 ? 1 : 0} />
              <YAxis tick={LABEL_STYLE} tickLine={false} axisLine={false} width={36} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <ReferenceLine y={avg} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 4" label={{ value: `avg ${avg}`, position: 'right', fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} />
              <Bar dataKey="newVisitors" name="New visitors" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} maxBarSize={32} />
              <Bar dataKey="returning" name="Returning" stackId="a" fill="rgba(59,130,246,0.55)" radius={[3, 3, 0, 0]} maxBarSize={32} />
              <Bar dataKey="prevTotal" name="Prev. period" fill="rgba(255,255,255,0.08)" radius={[3, 3, 0, 0]} maxBarSize={20} />
            </BarChart>
          ) : (
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="date" tick={LABEL_STYLE} tickLine={false} axisLine={false} interval={range === 30 ? 4 : 1} />
              <YAxis tick={LABEL_STYLE} tickLine={false} axisLine={false} width={36} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)' }} />
              <ReferenceLine y={avg} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 4" />
              <Line type="monotone" dataKey="total" name="Total visits" stroke="#E50914" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: '#E50914' }} />
              <Line type="monotone" dataKey="newVisitors" name="New visitors" stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              <Line type="monotone" dataKey="returning" name="Returning" stroke="rgba(99,165,255,0.8)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              <Line type="monotone" dataKey="prevTotal" name="Prev. period" stroke="rgba(255,255,255,0.25)" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  )
}

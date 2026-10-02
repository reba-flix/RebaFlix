'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Activity, ArrowDownToLine, ArrowUpRight, CheckCircle2, Clock3, Eye, Monitor, Search, Smartphone, Tablet, TrendingUp } from 'lucide-react'
import { Area, AreaChart, Bar, CartesianGrid, Cell, ComposedChart, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { MoviePlaysChart } from './MoviePlaysChart'
import type { AnalyticsReport, Performance } from '@/lib/analytics/report'

const number = (n: number) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n)
const hours = (n: number) => `${new Intl.NumberFormat('en-US', { maximumFractionDigits: n > 0 && n < 3600 ? 2 : 1 }).format(n / 3600)} hrs`
const duration = (n: number) => `${Math.floor(Math.round(n) / 60)}m ${Math.round(n) % 60}s`
const pct = (n: number) => `${n.toFixed(1)}%`
const panel = 'rounded-2xl border border-white/[0.08] bg-[#101012]'
const colors = ['#e50914', '#818cf8', '#34d399', '#71717a']
const tooltip = { background: '#18181b', border: '1px solid #3f3f46', borderRadius: 12, color: '#fafafa' }
const deviceNames: Record<string, string> = { mobile: 'Mobile', desktop: 'Desktop / laptop', tablet: 'Tablet', other: 'Other / unknown' }
const deviceIcons = { mobile: Smartphone, desktop: Monitor, tablet: Tablet, other: Activity }
const periods = [['today','Today'],['7d','Last 7 days'],['30d','Last 30 days'],['90d','Last 90 days'],['year','This year'],['all','All time']]

function Empty({ children = 'No data yet for this period.' }: { children?: React.ReactNode }) {
  return <div className="flex min-h-44 items-center justify-center rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-zinc-500">{children}</div>
}
function Poster({ item }: { item: Performance }) {
  return <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-lg bg-zinc-800">{item.posterUrl ? <Image src={item.posterUrl} alt="" fill sizes="56px" className="object-cover" /> : <div className="flex h-full items-center justify-center text-zinc-600"><Eye size={20} /></div>}</div>
}

export function AnalyticsDashboard() {
  const [range, setRange] = useState('30d')
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [type, setType] = useState('all')
  const [sort, setSort] = useState('views')
  const [direction, setDirection] = useState('desc')
  const [page, setPage] = useState(1)
  const [data, setData] = useState<AnalyticsReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  const [refreshTick, setRefreshTick] = useState(0)
  const requestInFlight = useRef(false)
  const requestSequence = useRef(0)
  useEffect(() => { const timer = setTimeout(() => { setQuery(search); setPage(1) }, 300); return () => clearTimeout(timer) }, [search])
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined
    const refresh = () => { if (document.visibilityState === 'visible' && !requestInFlight.current) setRefreshTick(value => value + 1) }
    const start = () => { if (timer) clearInterval(timer); timer = setInterval(refresh, 30_000) }
    const visibility = () => { if (document.visibilityState === 'visible') { refresh(); start() } else if (timer) { clearInterval(timer); timer = undefined } }
    start(); document.addEventListener('visibilitychange', visibility)
    return () => { if (timer) clearInterval(timer); document.removeEventListener('visibilitychange', visibility) }
  }, [])
  useEffect(() => {
    if (requestInFlight.current) return
    requestInFlight.current = true
    const requestId = ++requestSequence.current
    const abort = new AbortController()
    if (!data) setLoading(true)
    setError('')
    const params = new URLSearchParams({ range, search: query, type, sort, direction, page: String(page) })
    fetch(`/api/admin/analytics?${params}`, { signal: abort.signal, cache: 'no-store' }).then(async response => {
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || 'Unable to load analytics')
      setData(body)
    }).catch(err => { if (err.name !== 'AbortError') setError(err.message) }).finally(() => { if (requestSequence.current === requestId) { requestInFlight.current = false; if (!abort.signal.aborted) setLoading(false) } })
    return () => { abort.abort(); if (requestSequence.current === requestId) requestInFlight.current = false }
  }, [range, query, type, sort, direction, page, retry, refreshTick])
  const devices = ['mobile','desktop','tablet','other'].map(device => ({ device, name: deviceNames[device], count: data?.devices.find(item => item.device === device)?.count ?? 0 }))
  const topDevice = [...devices].sort((a,b) => b.count-a.count)[0]
  const t = data?.totals
  const changeType = (value: string) => { setType(value); setPage(1) }
  const kpis = t ? [
    { title: 'Total views', value: number(t.views), detail: range === 'all' ? 'Includes preserved historical lifetime counters' : 'Daily aggregate content views', icon: Eye },
    { title: 'Total watch time', value: hours(t.seconds), detail: `${number(t.seconds / 60)} minutes actually watched`, icon: Clock3 },
    { title: 'Downloads initiated', value: number(t.downloads), detail: 'Aggregate successful application redirects', icon: ArrowDownToLine },
    { title: 'Average watch time', value: t.plays ? duration(t.avgSeconds) : '—', detail: `${number(t.plays)} measured plays`, icon: Activity },
    { title: 'Completion rate', value: t.plays ? pct(t.completion) : '—', detail: `${number(t.completed)} watches reached 90% coverage`, icon: CheckCircle2 },
    { title: 'Daily playback starts', value: number(t.plays), detail: 'Aggregate playback starts in this period', icon: TrendingUp },
    { title: 'Most active device', value: topDevice?.count ? deviceNames[topDevice.device] : '—', detail: 'Coarse device category from content activity', icon: Monitor },
  ] : []
  return <main className="w-full min-w-0 space-y-7 pb-10 text-white">
    <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
      <div><p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-red-500"><span className="h-1.5 w-1.5 rounded-full bg-red-500" /> RebaaFlix intelligence</p><h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">View Analytics</h1><p className="mt-2 text-sm text-zinc-400">Content performance. Real viewing activity. Audience insights.</p></div>
      <label className="flex shrink-0 flex-col gap-2 text-xs text-zinc-500">Reporting period · UTC<select aria-label="Reporting period" value={range} onChange={e => { setRange(e.target.value); setPage(1) }} className="rounded-xl border border-white/15 bg-zinc-900 px-4 py-3 text-sm font-medium text-white">{periods.map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
    </header>
    <div className="rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3 text-xs leading-relaxed text-zinc-400">Historical lifetime counters remain unchanged. New reports use daily aggregate buckets and do not expose visitor identities. Watch metrics follow measured in-site video playback; external players and native apps cannot report watch time here.</div>
    {error && <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-5 text-sm">{error}<button className="ml-4 underline" onClick={() => setRetry(v => v+1)}>Retry</button></div>}
    {loading && !data && <div aria-label="Loading analytics" className="grid grid-cols-2 gap-4 lg:grid-cols-4">{Array.from({length:8},(_,i) => <div key={i} className={`${panel} h-36 animate-pulse`} />)}</div>}
    {data && t && !error && <div aria-busy={loading} className={`space-y-7 transition-opacity ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
      {!data.enabled && <p className="text-sm text-amber-300">New analytics collection is disabled. Existing recorded data remains available.</p>}
      <section aria-label="Analytics overview" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">{kpis.map(({title,value,detail,icon:Icon}) => <article key={title} className={`${panel} relative overflow-hidden p-5`}><div className="mb-5 flex items-center justify-between"><h2 className="text-xs font-medium text-zinc-400">{title}</h2><Icon className="h-4 w-4 text-red-500" /></div><p className="text-2xl font-semibold tracking-tight tabular-nums">{value}</p><p className="mt-2 text-[11px] leading-relaxed text-zinc-500">{detail}</p></article>)}</section>
      <section className={`${panel} p-5 md:p-6`}><div className="mb-6 flex justify-between"><div><h2 className="font-semibold">Watch Time Over Time</h2><p className="mt-1 text-xs text-zinc-500">Aggregate hours watched · grouped by {range === 'all' ? 'month' : 'day'}</p></div><Clock3 className="h-5 w-5 text-red-500" /></div>{data.trend.some(d => d.hours > 0) ? <div className="h-72"><ResponsiveContainer width="100%" height="100%"><AreaChart data={data.trend}><defs><linearGradient id="watchFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#e50914" stopOpacity={0.3}/><stop offset="100%" stopColor="#e50914" stopOpacity={0}/></linearGradient></defs><CartesianGrid stroke="#ffffff08" vertical={false}/><XAxis dataKey="date" stroke="#71717a" tick={{fontSize:11}} tickLine={false}/><YAxis stroke="#71717a" tick={{fontSize:11}} tickLine={false} width={45}/><Tooltip contentStyle={tooltip}/><Area type="monotone" dataKey="hours" name="Hours watched" stroke="#e50914" strokeWidth={2.5} fill="url(#watchFill)" /></AreaChart></ResponsiveContainer></div> : <Empty>Aggregate watch time will appear as viewers watch on this site.</Empty>}</section>
      <section aria-label="Top content" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{data.highlights.map(({label,item}) => <article key={label} className={`${panel} p-5`}><h2 className="mb-5 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-zinc-400">{label}<ArrowUpRight className="h-4 w-4 text-red-500" /></h2>{item ? <div className="flex gap-4"><Poster item={item}/><div className="min-w-0"><h3 className="line-clamp-2 text-sm font-semibold">{item.title}</h3><p className="mt-2 text-xs text-zinc-400">{number(item.views)} views · {hours(item.seconds)}</p><p className="mt-1 text-xs text-zinc-500">{number(item.downloads)} downloads{label.includes('Completion') ? ` · ${pct(item.completion)} of ${number(item.plays)} plays` : ''}</p></div></div> : <div className="py-6 text-sm text-zinc-500">No data yet</div>}</article>)}</section>
      <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <section className={`${panel} min-w-0 p-5 md:p-6`}><h2 className="font-semibold">Views vs Downloads</h2><p className="mb-6 mt-1 text-xs text-zinc-500">Dated events collected since analytics was enabled</p>{data.trend.some(d => d.views > 0 || d.downloads > 0) ? <div className="h-72"><ResponsiveContainer width="100%" height="100%"><ComposedChart data={data.trend}><CartesianGrid stroke="#ffffff08" vertical={false}/><XAxis dataKey="date" stroke="#71717a" tick={{fontSize:11}}/><YAxis stroke="#71717a" tick={{fontSize:11}} width={40}/><Tooltip contentStyle={tooltip}/><Legend wrapperStyle={{fontSize:12}}/><Bar dataKey="views" name="Views" fill="#e50914" radius={[3,3,0,0]}/><Bar dataKey="downloads" name="Downloads" fill="#818cf8" radius={[3,3,0,0]}/></ComposedChart></ResponsiveContainer></div> : <Empty/>}<div className="mt-5 grid grid-cols-3 gap-3 border-t border-white/5 pt-4">{[['Today',data.downloads.today],['This week',data.downloads.week],['This month',data.downloads.month]].map(([label,count]) => <div key={label}><p className="text-[11px] text-zinc-500">{label} · downloads</p><p className="mt-1 text-lg font-semibold">{number(Number(count))}</p></div>)}</div></section>
        <section className={`${panel} min-w-0 p-5 md:p-6`}><h2 className="font-semibold">Content Activity by Device</h2><p className="mt-1 text-xs text-zinc-500">Counts of views and downloads by broad device category</p>{devices.some(d => d.count > 0) ? <div className="relative h-52"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={devices} dataKey="count" nameKey="name" innerRadius={60} outerRadius={82} paddingAngle={4} stroke="none">{devices.map((d,i) => <Cell key={d.device} fill={colors[i]}/>)}</Pie><Tooltip contentStyle={tooltip}/></PieChart></ResponsiveContainer><div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><strong className="text-xl">{number(devices.reduce((sum,d)=>sum+d.count,0))}</strong><span className="text-[10px] uppercase tracking-wider text-zinc-500">Events</span></div></div> : <Empty>No device categories yet.</Empty>}<div className="space-y-3">{devices.map((device,i) => { const Icon = deviceIcons[device.device as keyof typeof deviceIcons]; const total = devices.reduce((sum,d)=>sum+d.count,0); return <div key={device.device} className="flex items-center gap-3 text-xs"><Icon size={15} style={{color:colors[i]}}/><span className="flex-1 text-zinc-400">{device.name}</span><span className="text-zinc-500">{number(device.count)}</span><span className="w-14 text-right font-medium">{pct(total ? 100*device.count/total : 0)}</span></div> })}</div></section>
      </div>
      <section className={`${panel} p-5 md:p-6`}><h2 className="font-semibold">Top Views Bar Chart</h2><p className="mb-5 mt-1 text-xs text-zinc-500">Highest viewed movies and series ranked together</p>{data.topViews.some(d => d.views>0) ? <MoviePlaysChart data={data.topViews.map(d => ({title:d.title,plays:d.views}))}/> : <Empty/>}</section>
      <section id="content-performance" className={`${panel} overflow-hidden`}>
        <div className="space-y-5 p-5 md:p-6"><div><h2 className="font-semibold">Content Performance</h2><p className="mt-1 text-xs text-zinc-500">{number(data.count)} results · Series and movies include their episodes and parts. Parent and child rows overlap.</p></div>
          <div className="flex flex-wrap items-center gap-3"><label className="relative min-w-48 flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-zinc-500"/><input aria-label="Search content by title" placeholder="Search content by title…" value={search} onChange={e => setSearch(e.target.value)} className="w-full rounded-lg border border-white/10 bg-black/20 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-red-500"/></label><select aria-label="Content type" value={type} onChange={e => changeType(e.target.value)} className="rounded-lg border border-white/10 bg-zinc-900 p-2.5 text-sm">{[['all','All content'],['movie','Movies'],['series','Series'],['episode','Episodes'],['part','Movie parts']].map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select><select aria-label="Sort metric" value={sort} onChange={e => {setSort(e.target.value);setPage(1)}} className="rounded-lg border border-white/10 bg-zinc-900 p-2.5 text-sm">{[['views','Views'],['seconds','Watch time'],['downloads','Downloads'],['completion','Completion rate']].map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select><button aria-label="Toggle sort direction" onClick={() => {setDirection(v=>v==='desc'?'asc':'desc');setPage(1)}} className="rounded-lg border border-white/10 px-3 py-2.5 text-sm">{direction==='desc'?'↓ Highest first':'↑ Lowest first'}</button></div>
        </div>
        <div className="overflow-x-auto"><table className="w-full whitespace-nowrap text-left text-xs"><thead className="border-y border-white/5 bg-white/[0.025] text-zinc-500"><tr>{['Content','Type','Views','Watch time','Avg watch','Completion','Downloads','Download rate'].map(h=><th key={h} className="px-4 py-4 font-medium">{h}</th>)}</tr></thead><tbody>{data.rows.map(item=><tr key={item.id} className="border-b border-white/5 hover:bg-white/[0.025]"><td className="max-w-64 truncate px-4 py-4 font-medium" title={item.title}>{item.title}</td><td className="px-4 py-4 capitalize text-zinc-500">{item.type}</td><td className="px-4 py-4 tabular-nums">{number(item.views)}</td><td className="px-4 py-4">{hours(item.seconds)}</td><td className="px-4 py-4 text-zinc-400">{item.plays?duration(item.avgSeconds):'—'}</td><td className="px-4 py-4"><span className="text-emerald-400">{item.plays?pct(item.completion):'—'}</span><span className="ml-2 text-zinc-600">{item.completed}/{item.plays}</span></td><td className="px-4 py-4">{number(item.downloads)}</td><td className="px-4 py-4 text-zinc-400">{item.downloadRate ? pct(item.downloadRate) : '—'}</td></tr>)}</tbody></table>{!data.rows.length && <Empty>No content matches your search.</Empty>}</div>
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 text-xs text-zinc-500"><span>Download rate = tracked downloads / tracked views; repeat downloads can exceed 100%.</span><div className="flex items-center gap-4"><button disabled={page<=1} onClick={()=>setPage(p=>p-1)} className="rounded border border-white/15 px-3 py-2 text-white disabled:opacity-30">Previous</button><span>{page} / {data.pages}</span><button disabled={page>=data.pages} onClick={()=>setPage(p=>p+1)} className="rounded border border-white/15 px-3 py-2 text-white disabled:opacity-30">Next</button></div></div>
      </section>
      <section className="grid gap-5 lg:grid-cols-2">{[['All Movies',data.movies,'movie'],['All Series',data.series,'series']].map(([heading,items,kind])=><article key={String(heading)} className={`${panel} overflow-hidden`}><div className="flex items-center justify-between border-b border-white/5 p-5"><h2 className="font-semibold">{String(heading)}</h2><a href="#content-performance" onClick={()=>changeType(String(kind))} className="text-xs text-zinc-400 hover:text-white">Browse all →</a></div><div className="max-h-96 space-y-1 overflow-y-auto p-3">{(items as Performance[]).length ? (items as Performance[]).map((item,index)=><div key={item.id} className="flex gap-3 rounded-lg p-3 hover:bg-white/[0.025]"><span className="w-6 pt-0.5 text-xs tabular-nums text-zinc-600">{String(index+1).padStart(2,'0')}</span><div className="min-w-0"><h3 className="truncate text-sm font-medium">{item.title}</h3><p className="mt-2 text-xs text-zinc-500">{number(item.views)} views <span className="mx-2 text-zinc-700">/</span>{hours(item.seconds)}<span className="mx-2 text-zinc-700">/</span>{number(item.downloads)} downloads</p></div></div>) : <Empty/>}</div>{(items as Performance[]).length===100 && <p className="p-4 text-xs text-zinc-500">First 100 titles shown. Browse all for paginated rankings.</p>}</article>)}</section>
      <p className="text-xs leading-relaxed text-zinc-600">Metrics use UTC. Exact unique viewers are not measured. Downloads count successful application redirects, not completed file transfers. Completion means at least 90% distinct video coverage during one measured playback. Series rows include their episode activity.</p>
    </div>}
  </main>
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, FileText, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

function parseCSV(text: string) {
  const result: string[][] = []
  let row: string[] = []
  let inQuotes = false
  let val = ''
  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    if (inQuotes) {
      if (char === '"') {
        if (i < text.length - 1 && text[i + 1] === '"') {
          val += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        val += char
      }
    } else {
      if (char === '"') inQuotes = true
      else if (char === ',') {
        row.push(val)
        val = ''
      }
      else if (char === '\n' || char === '\r') {
        if (char === '\r' && text[i + 1] === '\n') i++
        row.push(val)
        if (row.length > 0 && row.some(x => x)) result.push(row)
        row = []
        val = ''
      } else {
        val += char
      }
    }
  }
  if (val || row.length > 0) {
    row.push(val)
    if (row.some(x => x)) result.push(row)
  }
  return result
}

export default function BulkUploadPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [parsedData, setParsedData] = useState<any[]>([])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      try {
        const rows = parseCSV(text)
        if (rows.length < 2) {
          setError('CSV must contain a header row and at least one data row.')
          return
        }

        const headers = rows[0].map(h => h.trim().toLowerCase())
        const requiredHeaders = ['type', 'title']
        const missing = requiredHeaders.filter(h => !headers.includes(h))
        if (missing.length > 0) {
          setError(`Missing required headers: ${missing.join(', ')}`)
          return
        }

        const data = rows.slice(1).map(row => {
          const obj: any = {}
          headers.forEach((header, index) => {
            let val = row[index] ? row[index].trim() : ''
            if (header === 'releaseyear' && val) obj.releaseYear = parseInt(val, 10)
            else if (header === 'externalvideourl') obj.externalVideoUrl = val
            else if (header === 'posterurl') obj.posterUrl = val
            else obj[header] = val
          })
          return obj
        }).filter(item => item.title)

        setParsedData(data)
        setError(null)
      } catch (err: any) {
        setError('Failed to parse CSV: ' + err.message)
      }
    }
    reader.readAsText(file)
  }

  const handleSubmit = async () => {
    if (parsedData.length === 0) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/admin/movies/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ movies: parsedData })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')

      setSuccess(`Successfully uploaded ${data.count} items!`)
      setParsedData([])
      setTimeout(() => {
        router.push('/admin/movies')
      }, 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const downloadTemplate = () => {
    const template = 'type,title,description,releaseYear,posterUrl,externalVideoUrl\nmovie,Inception,A thief who steals corporate secrets...,2010,https://...,https://...\nseries,Breaking Bad,A high school chemistry teacher...,2008,https://...,'
    const blob = new Blob([template], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'bulk-upload-template.csv'
    a.click()
  }

  return (
    <main className="px-4 pb-16 pt-8 md:px-8 lg:px-12 w-full max-w-5xl mx-auto">
      <Link
        href="/admin/movies"
        className="inline-flex items-center gap-2 text-white/40 hover:text-white text-sm mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Movies
      </Link>

      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-white mb-2">Bulk Upload</h1>
        <p className="text-white/50 text-sm">Upload a CSV file to create multiple movies and series at once.</p>
      </div>

      <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-6 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h2 className="text-lg font-semibold text-white">Upload CSV File</h2>
            <p className="text-sm text-white/40">Requires headers: type, title, description, releaseYear, posterUrl, externalVideoUrl</p>
          </div>
          <Button variant="outline" onClick={downloadTemplate} className="shrink-0 bg-white/5 border-white/10">
            <FileText className="w-4 h-4 mr-2" /> Download Template
          </Button>
        </div>

        <div className="border-2 border-dashed border-white/20 rounded-xl p-10 text-center hover:bg-white/[0.02] transition-colors relative">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <Upload className="w-8 h-8 text-white/30 mx-auto mb-3" />
          <p className="text-white font-medium mb-1">Click or drag CSV file to upload</p>
          <p className="text-sm text-white/40">Only .csv files are supported</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-xl bg-red-500/10 border border-red-500/30 px-5 py-4 text-red-400 text-sm font-medium">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 flex items-center gap-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-5 py-4 text-emerald-400 text-sm font-medium">
          <CheckCircle className="w-5 h-5 shrink-0" />
          {success}
        </div>
      )}

      {parsedData.length > 0 && (
        <div className="bg-[#1a1a1a] rounded-xl border border-white/10 overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center">
            <h2 className="text-base font-semibold text-white">Preview ({parsedData.length} items)</h2>
            <Button onClick={handleSubmit} disabled={loading} className="bg-[#E50914] hover:bg-[#b80710]">
              {loading ? 'Uploading...' : 'Confirm Upload'}
            </Button>
          </div>
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-sm text-white/70">
              <thead className="sticky top-0 bg-[#1a1a1a] z-10">
                <tr className="bg-white/5 border-b border-white/5">
                  <th className="py-3 px-6 text-xs font-semibold text-white/50 uppercase">Type</th>
                  <th className="py-3 px-6 text-xs font-semibold text-white/50 uppercase">Title</th>
                  <th className="py-3 px-6 text-xs font-semibold text-white/50 uppercase">Year</th>
                  <th className="py-3 px-6 text-xs font-semibold text-white/50 uppercase">Video URL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {parsedData.map((item, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-6">
                      <span className="px-2 py-1 rounded bg-white/10 text-xs uppercase">{item.type || 'movie'}</span>
                    </td>
                    <td className="py-3 px-6 text-white font-medium">{item.title}</td>
                    <td className="py-3 px-6">{item.releaseYear || '—'}</td>
                    <td className="py-3 px-6 max-w-[200px] truncate">{item.externalVideoUrl || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  )
}

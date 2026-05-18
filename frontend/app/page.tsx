'use client'
import { useState } from 'react'
import Link from 'next/link'

type MediaMode = 'image' | 'video'

export default function Home() {
  const [activeTab, setActiveTab] = useState<'hoax' | 'deepfake'>('hoax')
  const [mediaMode, setMediaMode] = useState<MediaMode>('image')
  const [text, setText] = useState('')
  const [caption, setCaption] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  function resetDeepfake() {
    setFile(null)
    setPreviewUrl(null)
    setCaption('')
    setResult(null)
  }

  async function analyzeHoax() {
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('http://localhost:8000/api/hoax/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      setResult(await res.json())
    } catch {
      setResult({ error: 'Gagal konek ke server' })
    }
    setLoading(false)
  }

  async function analyzeDeepfake() {
    if (!file) return
    setLoading(true)
    setResult(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('caption', caption)
      const endpoint = mediaMode === 'video'
        ? 'http://localhost:8000/api/deepfake/analyze-video'
        : 'http://localhost:8000/api/deepfake/analyze'
      const res = await fetch(endpoint, { method: 'POST', body: formData })
      setResult(await res.json())
    } catch {
      setResult({ error: 'Gagal konek ke server' })
    }
    setLoading(false)
  }

  const threatColor = result?.threat_level === 'HIGH'
    ? 'text-red-500' : result?.threat_level === 'MEDIUM'
    ? 'text-yellow-400' : 'text-green-400'

  const verdictColor = (v: string) => {
    if (!v) return 'text-gray-400'
    if (v.includes('HOAKS') || v.includes('DEEPFAKE') || v.includes('SALAH')) return 'text-red-500'
    if (v.includes('MENCURIGAKAN') || v.includes('MENYESATKAN') || v.includes('TIDAK TERBUKTI')) return 'text-yellow-400'
    return 'text-green-400'
  }

  const statusBadge = (status: string) => {
    if (status === 'SALAH' || status === 'MENYESATKAN') return 'bg-red-900 text-red-300'
    if (status === 'TIDAK TERBUKTI') return 'bg-yellow-900 text-yellow-300'
    return 'bg-green-900 text-green-300'
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">

      {/* Navbar */}
      <nav className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <span className="text-red-500 font-bold">🛡️ Nusantara Defense AI</span>
          <div className="flex gap-4 text-sm">
            <Link href="/" className="text-white font-medium border-b border-red-500 pb-0.5">🔍 Detektor</Link>
            <Link href="/education" className="text-gray-400 hover:text-white transition">📚 Edukasi</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto p-6">

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-red-500 tracking-wide">🛡️ NUSANTARA DEFENSE AI</h1>
          <p className="text-gray-400 mt-2 text-sm">Platform Pertahanan Kognitif Digital Indonesia</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => { setActiveTab('hoax'); setResult(null) }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'hoax' ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
          >
            📰 Hoax Detector
          </button>
          <button
            onClick={() => { setActiveTab('deepfake'); resetDeepfake() }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'deepfake' ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
          >
            🎭 Deepfake + Verifikasi
          </button>
        </div>

        {/* Hoax Input */}
        {activeTab === 'hoax' && (
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <label className="text-sm text-gray-400 mb-2 block">Masukkan teks berita atau pesan:</label>
            <textarea
              className="w-full bg-gray-800 text-white rounded-lg p-4 text-sm resize-none border border-gray-700 focus:outline-none focus:border-red-500 h-36"
              placeholder="Contoh: VIRAL!! Pemerintah sembunyikan obat mujarab..."
              value={text}
              onChange={e => setText(e.target.value)}
            />
            <button
              onClick={analyzeHoax}
              disabled={loading || !text}
              className="mt-4 w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold py-3 rounded-lg transition"
            >
              {loading ? '⏳ Menganalisis...' : '🔍 Analisis Sekarang'}
            </button>
          </div>
        )}

        {/* Deepfake Input */}
        {activeTab === 'deepfake' && (
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 space-y-4">

            {/* Toggle Gambar / Video */}
            <div className="flex gap-2">
              <button
                onClick={() => { setMediaMode('image'); resetDeepfake() }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${mediaMode === 'image' ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
              >
                📷 Gambar
              </button>
              <button
                onClick={() => { setMediaMode('video'); resetDeepfake() }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${mediaMode === 'video' ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
              >
                🎬 Video
              </button>
            </div>

            {/* Upload Area */}
            <div>
              <label className="text-sm text-gray-400 mb-2 block">
                Upload {mediaMode === 'image' ? 'gambar' : 'video'}:
              </label>
              <div
                className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center hover:border-red-500 transition cursor-pointer"
                onClick={() => document.getElementById('fileInput')?.click()}
              >
                {previewUrl && mediaMode === 'image' && (
                  <img src={previewUrl} alt="preview" className="max-h-48 mx-auto rounded-lg object-contain" />
                )}
                {previewUrl && mediaMode === 'video' && (
                  <div className="text-center">
                    <p className="text-4xl mb-2">🎬</p>
                    <p className="text-gray-300 text-sm font-medium">{file?.name}</p>
                    <p className="text-gray-500 text-xs mt-1">{file ? (file.size / 1024 / 1024).toFixed(1) + ' MB' : ''}</p>
                    <p className="text-gray-600 text-xs mt-2">Klik untuk ganti video</p>
                  </div>
                )}
                {!previewUrl && (
                  <>
                    <p className="text-4xl mb-2">{mediaMode === 'image' ? '🖼️' : '🎬'}</p>
                    <p className="text-gray-400 text-sm">Klik untuk upload {mediaMode === 'image' ? 'gambar' : 'video'}</p>
                    <p className="text-gray-600 text-xs mt-1">
                      {mediaMode === 'image' ? 'JPG, PNG, WEBP' : 'MP4 (max 50MB) — AI akan sampel 5 frame'}
                    </p>
                  </>
                )}
              </div>
              <input
                id="fileInput"
                type="file"
                accept={mediaMode === 'image' ? 'image/*' : 'video/mp4'}
                className="hidden"
                onChange={e => {
                  const f = e.target.files?.[0]
                  if (f) {
                    setFile(f)
                    setPreviewUrl(mediaMode === 'image' ? URL.createObjectURL(f) : f.name)
                    setResult(null)
                  }
                }}
              />
            </div>

            {/* Caption Input */}
            <div>
              <label className="text-sm text-gray-400 mb-2 block">
                Judul / Caption: <span className="text-gray-600">(opsional tapi disarankan)</span>
              </label>
              <textarea
                className="w-full bg-gray-800 text-white rounded-lg p-4 text-sm resize-none border border-gray-700 focus:outline-none focus:border-red-500 h-24"
                placeholder={mediaMode === 'image'
                  ? 'Contoh: ISU KENAIKAN BBM YANG MEMBUAT MASYARAKAT RESAH'
                  : 'Contoh: VIDEO VIRAL PEJABAT KORUPSI TERTANGKAP KAMERA'}
                value={caption}
                onChange={e => setCaption(e.target.value)}
              />
            </div>

            <button
              onClick={analyzeDeepfake}
              disabled={loading || !file}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold py-3 rounded-lg transition"
            >
              {loading
                ? mediaMode === 'video' ? '⏳ Mengekstrak & Menganalisis Frame...' : '⏳ Menganalisis...'
                : mediaMode === 'video' ? '🎬 Analisis Video + Verifikasi' : '🔍 Analisis Gambar + Verifikasi'}
            </button>

            {mediaMode === 'video' && (
              <p className="text-xs text-gray-600 text-center">
                AI akan mengekstrak 5 frame dari video dan menganalisis setiap frame secara terpisah
              </p>
            )}
          </div>
        )}

        {/* Result */}
        {result && !result.error && (
          <div className="mt-6 bg-gray-900 rounded-xl p-6 border border-gray-800 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-200">📊 Hasil Analisis</h2>
              {result.media_type === 'video' && (
                <span className="text-xs bg-gray-700 text-gray-300 px-3 py-1 rounded-full">
                  🎬 {result.total_frames_analyzed} frame • {result.video_duration_seconds}s
                </span>
              )}
            </div>

            {/* Score Cards */}
            <div className="flex gap-3">
              <div className="flex-1 bg-gray-800 rounded-lg p-4 text-center">
                <p className="text-xs text-gray-400 mb-1">Verdict</p>
                <p className={`font-bold text-base ${verdictColor(result.verdict)}`}>{result.verdict}</p>
              </div>
              <div className="flex-1 bg-gray-800 rounded-lg p-4 text-center">
                <p className="text-xs text-gray-400 mb-1">{activeTab === 'deepfake' ? 'AI Probability' : 'Confidence'}</p>
                <p className={`font-bold text-2xl ${threatColor}`}>
                  {activeTab === 'deepfake' ? result.ai_manipulation_probability : result.confidence}%
                </p>
              </div>
              <div className="flex-1 bg-gray-800 rounded-lg p-4 text-center">
                <p className="text-xs text-gray-400 mb-1">Threat Level</p>
                <p className={`font-bold text-base ${threatColor}`}>{result.threat_level}</p>
              </div>
            </div>

            {/* Authenticity Bar */}
            {activeTab === 'deepfake' && result.authenticity_score !== undefined && (
              <div className="bg-gray-800 rounded-lg p-4">
                <p className="text-xs text-gray-400 mb-2">✅ Authenticity Score</p>
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all ${result.authenticity_score > 60 ? 'bg-green-500' : result.authenticity_score > 30 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${result.authenticity_score}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1 text-right">{result.authenticity_score}% asli</p>
              </div>
            )}

            {/* Frame Details */}
            {result.frame_details?.length > 0 && (
              <div className="bg-gray-800 rounded-lg p-4">
                <p className="text-xs text-gray-400 mb-3">🎞️ Detail per Frame:</p>
                <div className="space-y-2">
                  {result.frame_details.map((f: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Frame {i + 1} — detik {f.timestamp}s</span>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full ${f.manipulation_probability >= 70 ? 'bg-red-900 text-red-300' : f.manipulation_probability >= 40 ? 'bg-yellow-900 text-yellow-300' : 'bg-green-900 text-green-300'}`}>
                          {f.manipulation_probability}% AI
                        </span>
                        <span className={verdictColor(f.verdict)}>{f.verdict}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Analisis Caption */}
            {result.verdict_caption && result.verdict_caption !== 'TIDAK ADA CAPTION' && (
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-xs text-gray-400">📝 Analisis Caption:</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${verdictColor(result.verdict_caption)} bg-gray-700`}>
                    {result.verdict_caption}
                  </span>
                </div>
                <p className="text-sm text-gray-300">{result.analisis_caption}</p>
              </div>
            )}

            {/* Anomali Visual */}
            {result.anomali_visual?.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 mb-2">🔍 Anomali visual:</p>
                <div className="flex flex-wrap gap-2">
                  {result.anomali_visual.map((a: string) => (
                    <span key={a} className="bg-red-900 text-red-300 text-xs px-3 py-1 rounded-full">{a}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Hoax Keywords */}
            {result.suspicious_keywords?.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 mb-2">🚩 Kata mencurigakan:</p>
                <div className="flex flex-wrap gap-2">
                  {result.suspicious_keywords.map((kw: string) => (
                    <span key={kw} className="bg-red-900 text-red-300 text-xs px-3 py-1 rounded-full">{kw}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Hoax Patterns */}
            {result.suspicious_patterns?.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 mb-2">⚠️ Pola mencurigakan:</p>
                <div className="flex flex-wrap gap-2">
                  {result.suspicious_patterns.map((p: string) => (
                    <span key={p} className="bg-yellow-900 text-yellow-300 text-xs px-3 py-1 rounded-full">{p}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Sumber Verifikasi */}
            {result.sumber_verifikasi?.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 mb-3">🔎 Bukti Verifikasi:</p>
                <div className="space-y-3">
                  {result.sumber_verifikasi.map((s: any, i: number) => (
                    <div key={i} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="text-sm text-gray-200 font-medium">"{s.klaim}"</p>
                        <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap font-medium ${statusBadge(s.status)}`}>
                          {s.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">{s.penjelasan}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Alasan AI */}
            {result.alasan && (
              <div className="p-4 bg-gray-800 rounded-lg border-l-4 border-red-500">
                <p className="text-xs text-gray-400 mb-1">🤖 Analisis AI:</p>
                <p className="text-sm text-gray-200">{result.alasan}</p>
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {result?.error && (
          <div className="mt-6 bg-red-950 border border-red-800 rounded-xl p-4 text-red-400 text-sm">
            ❌ {result.error} — pastikan backend sudah jalan di port 8000
          </div>
        )}

      </div>
    </main>
  )
}
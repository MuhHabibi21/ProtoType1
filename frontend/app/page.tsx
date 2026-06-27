'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

type MediaMode = 'image' | 'video'
type ActiveTab = 'hoax' | 'deepfake' | 'scam'

// ─────────────────────────────────────────
// KOMPONEN: Risk Meter (Neo-Brutalist Edition)
// ─────────────────────────────────────────
function RiskMeter({ score }: { score: number }) {
  const [animated, setAnimated] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setAnimated(score), 100)
    return () => clearTimeout(t)
  }, [score])

  const color = score >= 70
    ? { bar: 'bg-neo-red', text: 'text-neo-red', label: 'BERBAHAYA' }
    : score >= 40
      ? { bar: 'bg-neo-yellow', text: 'text-amber-600', label: 'WASPADA' }
      : { bar: 'bg-neo-green', text: 'text-green-700', label: 'AMAN' }

  return (
    <div className="bg-white border-3 border-black p-5 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
      <div className="flex justify-between items-center mb-3">
        <p className="text-xs font-bold uppercase tracking-wider text-black">⚠️ Risk Meter</p>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-black uppercase px-2 py-0.5 border border-black bg-white shadow-[1px_1px_0px_rgba(0,0,0,1)] ${color.text}`}>
            {color.label}
          </span>
          <span className="text-2xl font-black text-black">{score}</span>
          <span className="text-xs text-gray-500 font-bold">/100</span>
        </div>
      </div>
      <div className="w-full bg-neutral-200 border-2 border-black h-6 overflow-hidden p-0.5">
        <div
          className={`h-full border-r border-black transition-all duration-700 ease-out ${color.bar}`}
          style={{ width: `${animated}%` }}
        />
      </div>
      <div className="flex justify-between mt-2 font-mono text-[10px] font-bold text-black uppercase">
        <span className="text-green-700">Aman (0)</span>
        <span className="text-amber-600">Waspada (40)</span>
        <span className="text-neo-red">Bahaya (70+)</span>
      </div>
    </div>
  )
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('hoax')
  const [mediaMode, setMediaMode] = useState<MediaMode>('image')

  // State terpisah untuk Hoax dan Scam
  const [hoaxText, setHoaxText] = useState('')
  const [scamText, setScamText] = useState('')
  const [detectedLinks, setDetectedLinks] = useState<string[]>([])

  // Deepfake state
  const [caption, setCaption] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // Shared
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  // Deteksi URL real-time dari scamText
  useEffect(() => {
    const urlRegex = /https?:\/\/[^\s/$.?#].[^\s]*/g
    const links = scamText.match(urlRegex) || []
    setDetectedLinks([...new Set(links)])
  }, [scamText])

  function resetDeepfake() {
    setFile(null)
    setPreviewUrl(null)
    setCaption('')
    setResult(null)
  }

  // ── Analyze Hoax ──
  async function analyzeHoax() {
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('http://localhost:8000/api/hoax/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: hoaxText }),
      })
      setResult(await res.json())
    } catch {
      setResult({ error: 'Gagal konek ke server' })
    }
    setLoading(false)
  }

  // ── Analyze Deepfake ──
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

  // ── Analyze Scam ──
  async function analyzeScam() {
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('http://localhost:8000/api/scam/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: scamText }),
      })
      setResult(await res.json())
    } catch {
      setResult({ error: 'Gagal konek ke server' })
    }
    setLoading(false)
  }

  // ── Warna helper ──
  const riskLevel = result?.risk_level ||
    (result?.risk_score >= 70 ? 'HIGH' : result?.risk_score >= 40 ? 'MEDIUM' : 'LOW')

  const threatBg = (level: string) =>
    level === 'HIGH' ? 'bg-neo-red' : level === 'MEDIUM' ? 'bg-neo-yellow' : 'bg-neo-green'

  const verdictColor = (v: string) => {
    if (!v) return 'text-black'
    if (v.includes('HOAKS') || v.includes('DEEPFAKE') || v.includes('SCAM') ||
      v.includes('PHISHING') || v.includes('TERDETEKSI') || v.includes('SALAH'))
      return 'text-neo-red font-black'
    if (v.includes('MENCURIGAKAN') || v.includes('MENYESATKAN') || v.includes('TIDAK TERBUKTI'))
      return 'text-amber-600 font-black'
    return 'text-green-700 font-black'
  }

  const statusBadge = (status: string) => {
    if (status === 'SALAH' || status === 'MENYESATKAN') return 'bg-neo-red text-white'
    if (status === 'TIDAK TERBUKTI') return 'bg-neo-yellow text-black'
    return 'bg-neo-green text-black'
  }

  const urlRiskBadge = (risk: string) =>
    risk === 'HIGH' ? 'bg-red-50 text-neo-red border-neo-red' :
      risk === 'MEDIUM' ? 'bg-amber-50 text-amber-800 border-amber-600' :
        'bg-green-50 text-green-800 border-green-600'

  return (
    <main className="min-h-screen text-black pb-12">

      {/* Navbar (Neo-Brutalist style) */}
      <nav className="border-b-4 border-black bg-white px-6 py-4 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <span className="bg-neo-red text-white border-2 border-black px-3 py-1 font-black text-sm uppercase tracking-wider transform -rotate-1 shadow-[2px_2px_0px_rgba(0,0,0,1)]">
            🛡️ Nusantara Defense AI
          </span>
          <div className="flex gap-4 text-xs font-black uppercase">
            <Link href="/" className="bg-neo-yellow text-black border-2 border-black px-3 py-1.5 shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all">
              🔍 Detektor
            </Link>
            <Link href="/education" className="bg-white text-black border-2 border-black px-3 py-1.5 shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all hover:bg-neutral-100">
              📚 Edukasi
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto p-6 mt-8">

        {/* Header */}
        <div className="mb-10 text-center">
          <div className="inline-block bg-neo-red border-4 border-black px-6 py-4 transform -rotate-1 shadow-[6px_6px_0px_rgba(0,0,0,1)]">
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-none uppercase">
              🛡️ Nusantara Defense AI
            </h1>
          </div>
          <div className="mt-4">
            <p className="bg-white border-2 border-black inline-block text-black font-extrabold uppercase px-4 py-1 text-xs tracking-wider shadow-[3px_3px_0px_rgba(0,0,0,1)]">
              Platform Pertahanan Kognitif Digital Indonesia
            </p>
          </div>
        </div>

        {/* Tabs (Sticker-style blocky buttons) */}
        <div className="flex gap-3 mb-6 flex-wrap justify-center">
          <button
            onClick={() => { setActiveTab('hoax'); setResult(null) }}
            className={`px-4 py-2.5 border-3 border-black text-xs font-black uppercase shadow-[3px_3px_0px_rgba(0,0,0,1)] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_rgba(0,0,0,1)] ${
              activeTab === 'hoax' ? 'bg-neo-yellow text-black' : 'bg-white hover:bg-neutral-100 text-black'
            }`}
          >
            📰 Hoax Detector
          </button>
          <button
            onClick={() => { setActiveTab('deepfake'); resetDeepfake() }}
            className={`px-4 py-2.5 border-3 border-black text-xs font-black uppercase shadow-[3px_3px_0px_rgba(0,0,0,1)] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_rgba(0,0,0,1)] ${
              activeTab === 'deepfake' ? 'bg-neo-purple text-white shadow-[3px_3px_0px_rgba(0,0,0,1)]' : 'bg-white hover:bg-neutral-100 text-black'
            }`}
          >
            🎭 Deepfake + Verifikasi
          </button>
          <button
            onClick={() => { setActiveTab('scam'); setResult(null) }}
            className={`px-4 py-2.5 border-3 border-black text-xs font-black uppercase shadow-[3px_3px_0px_rgba(0,0,0,1)] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_rgba(0,0,0,1)] ${
              activeTab === 'scam' ? 'bg-neo-blue text-white shadow-[3px_3px_0px_rgba(0,0,0,1)]' : 'bg-white hover:bg-neutral-100 text-black'
            }`}
          >
            🛡️ Scam/Phishing
          </button>
        </div>

        {/* ─── HOAX INPUT ─── */}
        {activeTab === 'hoax' && (
          <div className="bg-white border-4 border-black p-6 md:p-8 shadow-[8px_8px_0px_rgba(0,0,0,1)]">
            <label className="text-xs font-black uppercase tracking-wider text-black mb-2 block">
              Masukkan teks berita atau pesan:
            </label>
            <textarea
              className="w-full bg-white text-black border-3 border-black p-4 text-sm font-semibold resize-none focus:outline-none focus:bg-amber-50/20 h-40 shadow-[3px_3px_0px_rgba(0,0,0,1)] focus:shadow-[1px_1px_0px_rgba(0,0,0,1)] focus:translate-x-[2px] focus:translate-y-[2px] transition-all"
              placeholder="Contoh: VIRAL!! Pemerintah sembunyikan obat mujarab..."
              value={hoaxText}
              onChange={e => setHoaxText(e.target.value)}
            />
            <button
              onClick={analyzeHoax}
              disabled={loading || !hoaxText}
              className="mt-6 w-full bg-neo-red hover:bg-red-500 text-black font-black uppercase tracking-wider py-4 border-3 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_rgba(0,0,0,1)] disabled:bg-neutral-200 disabled:text-neutral-500 disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0 cursor-pointer"
            >
              {loading ? '⏳ Menganalisis...' : '🔍 Analisis Sekarang'}
            </button>
          </div>
        )}

        {/* ─── DEEPFAKE INPUT ─── */}
        {activeTab === 'deepfake' && (
          <div className="bg-white border-4 border-black p-6 md:p-8 shadow-[8px_8px_0px_rgba(0,0,0,1)] space-y-6">
            <div className="flex gap-3">
              <button
                onClick={() => { setMediaMode('image'); resetDeepfake() }}
                className={`flex-1 py-2.5 border-3 border-black text-xs font-black uppercase shadow-[3px_3px_0px_rgba(0,0,0,1)] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_rgba(0,0,0,1)] ${
                  mediaMode === 'image' ? 'bg-neo-purple text-white shadow-[3px_3px_0px_rgba(0,0,0,1)]' : 'bg-white hover:bg-neutral-100 text-black'
                }`}
              >
                📷 Gambar
              </button>
              <button
                onClick={() => { setMediaMode('video'); resetDeepfake() }}
                className={`flex-1 py-2.5 border-3 border-black text-xs font-black uppercase shadow-[3px_3px_0px_rgba(0,0,0,1)] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_rgba(0,0,0,1)] ${
                  mediaMode === 'video' ? 'bg-neo-purple text-white shadow-[3px_3px_0px_rgba(0,0,0,1)]' : 'bg-white hover:bg-neutral-100 text-black'
                }`}
              >
                🎬 Video
              </button>
            </div>
            <div>
              <label className="text-xs font-black uppercase tracking-wider text-black mb-2 block">
                Upload {mediaMode === 'image' ? 'gambar' : 'video'}:
              </label>
              <div
                className="border-3 border-dashed border-black bg-neutral-50 p-8 text-center hover:bg-amber-50/20 transition cursor-pointer shadow-[3px_3px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_rgba(0,0,0,1)]"
                onClick={() => document.getElementById('fileInput')?.click()}
              >
                {previewUrl && mediaMode === 'image' && (
                  <img src={previewUrl} alt="preview" className="max-h-48 mx-auto rounded-none border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,1)] object-contain" />
                )}
                {previewUrl && mediaMode === 'video' && (
                  <div className="text-center font-bold">
                    <p className="text-4xl mb-2">🎬</p>
                    <p className="text-black text-sm">{file?.name}</p>
                    <p className="text-neutral-500 text-xs mt-1">{file ? (file.size / 1024 / 1024).toFixed(1) + ' MB' : ''}</p>
                  </div>
                )}
                {!previewUrl && (
                  <>
                    <p className="text-4xl mb-2">{mediaMode === 'image' ? '🖼️' : '🎬'}</p>
                    <p className="text-black text-sm font-extrabold uppercase">Klik untuk upload {mediaMode === 'image' ? 'gambar' : 'video'}</p>
                    <p className="text-neutral-600 text-xs font-semibold mt-1">
                      {mediaMode === 'image' ? 'JPG, PNG, WEBP' : 'MP4 (max 50MB)'}
                    </p>
                  </>
                )}
              </div>
              <input id="fileInput" type="file" accept={mediaMode === 'image' ? 'image/*' : 'video/mp4'} className="hidden"
                onChange={e => {
                  const f = e.target.files?.[0]
                  if (f) { setFile(f); setPreviewUrl(mediaMode === 'image' ? URL.createObjectURL(f) : f.name); setResult(null) }
                }}
              />
            </div>
            <div>
              <label className="text-xs font-black uppercase tracking-wider text-black mb-2 block">
                Judul / Caption: <span className="text-neutral-500 font-bold">(opsional)</span>
              </label>
              <textarea
                className="w-full bg-white text-black border-3 border-black p-4 text-sm font-semibold resize-none focus:outline-none focus:bg-amber-50/20 h-24 shadow-[3px_3px_0px_rgba(0,0,0,1)] focus:shadow-[1px_1px_0px_rgba(0,0,0,1)] focus:translate-x-[2px] focus:translate-y-[2px] transition-all"
                placeholder="Contoh: ISU KENAIKAN BBM YANG MEMBUAT MASYARAKAT RESAH"
                value={caption}
                onChange={e => setCaption(e.target.value)}
              />
            </div>
            <button
              onClick={analyzeDeepfake}
              disabled={loading || !file}
              className="w-full bg-neo-red hover:bg-red-500 text-black font-black uppercase tracking-wider py-4 border-3 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_rgba(0,0,0,1)] disabled:bg-neutral-200 disabled:text-neutral-500 disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0 cursor-pointer"
            >
              {loading ? '⏳ Menganalisis...' : mediaMode === 'video' ? '🎬 Analisis Video' : '🔍 Analisis Gambar'}
            </button>
          </div>
        )}

        {/* ─── SCAM INPUT ─── */}
        {activeTab === 'scam' && (
          <div className="bg-white border-4 border-black p-6 md:p-8 shadow-[8px_8px_0px_rgba(0,0,0,1)] space-y-6">
            <div className="bg-neo-orange/20 border-3 border-black p-4 flex gap-3 shadow-[3px_3px_0px_rgba(0,0,0,1)]">
              <span className="text-xl">💡</span>
              <p className="text-xs text-black font-bold uppercase leading-relaxed">
                Tempel teks pesan mencurigakan, SMS, WhatsApp, email, atau URL. AI akan mendeteksi scam dan phishing.
              </p>
            </div>
            <div>
              <label className="text-xs font-black uppercase tracking-wider text-black mb-2 block">Teks pesan / URL mencurigakan:</label>
              <textarea
                className="w-full bg-white text-black border-3 border-black p-4 text-sm font-semibold resize-none focus:outline-none focus:bg-amber-50/20 h-40 shadow-[3px_3px_0px_rgba(0,0,0,1)] focus:shadow-[1px_1px_0px_rgba(0,0,0,1)] focus:translate-x-[2px] focus:translate-y-[2px] transition-all"
                placeholder={`Contoh:\n"Selamat! Anda memenangkan Rp 50jt. Klik bit.ly/hadiah123 SEGERA, berlaku 24 jam!"`}
                value={scamText}
                onChange={e => setScamText(e.target.value)}
              />

              {/* URL Indicator */}
              {detectedLinks.length > 0 && (
                <div className="mt-4 p-4 bg-neo-blue/10 rounded-none border-3 border-black shadow-[3px_3px_0px_rgba(0,0,0,1)]">
                  <p className="text-xs text-black font-black uppercase mb-2">
                    🔗 {detectedLinks.length} link terdeteksi — akan dianalisis secara khusus:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {detectedLinks.map((link, i) => (
                      <span key={i} className="bg-white text-black text-xs font-bold px-2 py-1 border-2 border-black shadow-[1.5px_1.5px_0px_rgba(0,0,0,1)] font-mono truncate max-w-xs" title={link}>
                        {link}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={analyzeScam}
              disabled={loading || !scamText.trim()}
              className="w-full bg-neo-red hover:bg-red-500 text-black font-black uppercase tracking-wider py-4 border-3 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_rgba(0,0,0,1)] disabled:bg-neutral-200 disabled:text-neutral-500 disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0 cursor-pointer"
            >
              {loading ? '⏳ Menganalisis ancaman...' : '🛡️ Periksa Scam & Phishing'}
            </button>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────── */}
        {/* HASIL ANALISIS                                                   */}
        {/* ─────────────────────────────────────────────────────────────── */}
        {result && !result.error && (
          <div className="mt-8 bg-white border-4 border-black p-6 shadow-[8px_8px_0px_rgba(0,0,0,1)] space-y-6">

            <div className="flex items-center justify-between border-b-2 border-black pb-4 flex-wrap gap-2">
              <h2 className="text-xl font-black uppercase tracking-tight text-black">📊 Hasil Analisis</h2>
              <div className="flex gap-2">
                {result.risk_level === 'HIGH' && (
                  <span className="text-xs bg-neo-red text-white border-2 border-black font-black uppercase px-3 py-1 shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                    ⛓️ Dicatat ke Blockchain
                  </span>
                )}
                {result.media_type === 'video' && (
                  <span className="text-xs bg-white text-black border-2 border-black font-black uppercase px-3 py-1 shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                    🎬 {result.total_frames_analyzed} frame • {result.video_duration_seconds}s
                  </span>
                )}
              </div>
            </div>

            {/* Score Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white border-3 border-black p-4 text-center shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                <p className="text-xs font-bold uppercase text-neutral-500 mb-1">Verdict</p>
                <p className={`font-black text-md leading-tight uppercase ${verdictColor(result.verdict)}`}>{result.verdict}</p>
              </div>
              <div className="bg-neo-yellow border-3 border-black p-4 text-center shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                <p className="text-xs font-bold uppercase text-black mb-1">
                  {activeTab === 'scam' ? 'Risk Score' : activeTab === 'deepfake' ? 'AI Probability' : 'Confidence'}
                </p>
                <p className="font-black text-3xl text-black">
                  {activeTab === 'scam'
                    ? result.risk_score
                    : activeTab === 'deepfake'
                      ? result.ai_manipulation_probability
                      : result.confidence}%
                </p>
              </div>
              <div className={`border-3 border-black p-4 text-center shadow-[4px_4px_0px_rgba(0,0,0,1)] ${threatBg(riskLevel)}`}>
                <p className="text-xs font-black uppercase text-black mb-1">Risk Level</p>
                <p className="font-black text-xl text-black uppercase">
                  {result.risk_level || result.threat_level}
                </p>
              </div>
            </div>

            {/* Risk Meter — khusus Scam */}
            {activeTab === 'scam' && result.risk_score !== undefined && (
              <RiskMeter score={result.risk_score} />
            )}

            {/* Scam Category */}
            {result.scam_category && (
              <div className="bg-neo-orange text-black border-3 border-black p-4 flex gap-3 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                <span className="text-md font-black uppercase tracking-wider bg-white px-2 py-0.5 border border-black shadow-[1px_1px_0px_rgba(0,0,0,1)]">🎯 Kategori:</span>
                <span className="text-md font-extrabold uppercase">{result.scam_category}</span>
              </div>
            )}

            {/* URL Analysis — Scam */}
            {result.url_analysis?.length > 0 && (
              <div className="bg-white border-3 border-black p-5 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                <p className="text-xs font-black uppercase tracking-wider text-black mb-3">🔗 Analisis URL:</p>
                <div className="space-y-3">
                  {result.url_analysis.map((u: any, i: number) => (
                    <div key={i} className={`flex items-start gap-3 p-3 border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,1)] text-xs font-semibold ${urlRiskBadge(u.risk)}`}>
                      <span className="text-lg">{u.risk === 'HIGH' ? '🔴' : u.risk === 'MEDIUM' ? '🟡' : '🟢'}</span>
                      <div className="min-w-0">
                        <p className="font-mono truncate font-extrabold text-black">{u.url}</p>
                        <p className="opacity-95 text-black mt-1">{u.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Red Flags — Scam */}
            {activeTab === 'scam' && result.red_flags?.length > 0 && (
              <div className="bg-white border-3 border-black p-5 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                <p className="text-xs font-black uppercase tracking-wider text-black mb-3">🚩 Red Flags ({result.red_flags.length}):</p>
                <div className="flex flex-wrap gap-2">
                  {result.red_flags.map((flag: string, i: number) => (
                    <span key={i} className="bg-neo-red text-white text-xs font-black uppercase px-3 py-1 border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                      {flag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendation — Scam */}
            {activeTab === 'scam' && result.recommendation && (
              <div className="p-5 bg-neo-blue/10 border-l-8 border-neo-blue border-y-3 border-r-3 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] text-black">
                <p className="text-xs font-black uppercase tracking-wider text-neo-blue mb-1">💬 Rekomendasi:</p>
                <p className="text-sm font-bold">{result.recommendation}</p>
              </div>
            )}

            {/* Authenticity Bar — Deepfake */}
            {activeTab === 'deepfake' && result.authenticity_score !== undefined && (
              <div className="bg-white border-3 border-black p-5 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                <p className="text-xs font-black uppercase tracking-wider text-black mb-2">✅ Authenticity Score</p>
                <div className="w-full bg-neutral-200 border-2 border-black h-6 p-0.5">
                  <div
                    className={`h-full border-r border-black transition-all ${result.authenticity_score > 60 ? 'bg-neo-green' : result.authenticity_score > 30 ? 'bg-neo-yellow' : 'bg-neo-red'}`}
                    style={{ width: `${result.authenticity_score}%` }}
                  />
                </div>
                <p className="text-xs font-black text-black mt-2 text-right">{result.authenticity_score}% ASLI</p>
              </div>
            )}

            {/* Frame Details — Video */}
            {result.frame_details?.length > 0 && (
              <div className="bg-white border-3 border-black p-5 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                <p className="text-xs font-black uppercase tracking-wider text-black mb-3">🎞️ Detail per Frame:</p>
                <div className="space-y-2">
                  {result.frame_details.map((f: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-xs border-b border-black/10 pb-2">
                      <span className="text-neutral-700 font-bold">Frame {i + 1} — detik {f.timestamp}s</span>
                      <span className={`px-2 py-0.5 border border-black font-black uppercase shadow-[1px_1px_0px_rgba(0,0,0,1)] ${
                        f.manipulation_probability >= 70 ? 'bg-neo-red text-white' : f.manipulation_probability >= 40 ? 'bg-neo-yellow text-black' : 'bg-neo-green text-black'
                      }`}>
                        {f.manipulation_probability}% AI
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Caption Analysis */}
            {result.verdict_caption && result.verdict_caption !== 'TIDAK ADA CAPTION' && (
              <div className="bg-white border-3 border-black p-5 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <p className="text-xs font-black uppercase tracking-wider text-black">📝 Analisis Caption:</p>
                  <span className={`text-xs px-2 py-0.5 border border-black shadow-[1.5px_1.5px_0px_rgba(0,0,0,1)] font-black uppercase ${verdictColor(result.verdict_caption)} bg-white`}>
                    {result.verdict_caption}
                  </span>
                </div>
                <p className="text-sm font-semibold text-neutral-800">{result.analisis_caption}</p>
              </div>
            )}

            {/* Anomali Visual */}
            {result.anomali_visual?.length > 0 && (
              <div className="bg-white border-3 border-black p-5 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                <p className="text-xs font-black uppercase tracking-wider text-black mb-2">🔍 Anomali visual:</p>
                <div className="flex flex-wrap gap-2">
                  {result.anomali_visual.map((a: string) => (
                    <span key={a} className="bg-neo-purple text-white text-xs font-black uppercase px-3 py-1 border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,1)]">{a}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Hoax Keywords */}
            {result.suspicious_keywords?.length > 0 && (
              <div className="bg-white border-3 border-black p-5 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                <p className="text-xs font-black uppercase tracking-wider text-black mb-2">🚩 Kata mencurigakan:</p>
                <div className="flex flex-wrap gap-2">
                  {result.suspicious_keywords.map((kw: string) => (
                    <span key={kw} className="bg-neo-red text-white text-xs font-black uppercase px-3 py-1 border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,1)]">{kw}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Hoax Patterns */}
            {result.suspicious_patterns?.length > 0 && (
              <div className="bg-white border-3 border-black p-5 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                <p className="text-xs font-black uppercase tracking-wider text-black mb-2">⚠️ Pola mencurigakan:</p>
                <div className="flex flex-wrap gap-2">
                  {result.suspicious_patterns.map((p: string) => (
                    <span key={p} className="bg-neo-yellow text-black text-xs font-black uppercase px-3 py-1 border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,1)]">{p}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Sumber Verifikasi */}
            {result.sumber_verifikasi?.length > 0 && (
              <div className="bg-white border-3 border-black p-5 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                <p className="text-xs font-black uppercase tracking-wider text-black mb-3">🔎 Bukti Verifikasi:</p>
                <div className="space-y-4">
                  {result.sumber_verifikasi.map((s: any, i: number) => (
                    <div key={i} className="bg-neutral-50 p-4 border-2 border-black shadow-[3px_3px_0px_rgba(0,0,0,1)]">
                      <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
                        <p className="text-sm text-black font-extrabold">"{s.klaim}"</p>
                        <span className={`text-xs px-2 py-0.5 border border-black font-black uppercase shadow-[1px_1px_0px_rgba(0,0,0,1)] ${statusBadge(s.status)}`}>
                          {s.status}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-neutral-600 mt-2 leading-relaxed">{s.penjelasan}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Alasan AI */}
            {result.alasan && (
              <div className="p-5 bg-neutral-100 border-l-8 border-black border-y-3 border-r-3 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] text-black">
                <p className="text-xs font-black uppercase tracking-wider text-neutral-500 mb-1">🤖 Analisis AI:</p>
                <p className="text-sm font-bold">{result.alasan}</p>
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {result?.error && (
          <div className="mt-8 bg-neo-red/10 border-3 border-neo-red p-5 shadow-[4px_4px_0px_rgba(0,0,0,1)] text-neo-red text-sm font-black uppercase tracking-wider">
            ❌ {result.error} — pastikan backend sudah jalan di port 8000
          </div>
        )}

      </div>
    </main>
  )
}
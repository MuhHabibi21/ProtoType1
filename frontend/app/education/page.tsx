'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

const QUICK_REPLIES = [
  { icon: '🔗', text: 'Cara tau link WA penipuan atau bukan?' },
  { icon: '🎭', text: 'Apa ciri-ciri video deepfake?' },
  { icon: '🔑', text: 'Cara bikin password aman tapi simpel' },
  { icon: '📱', text: 'Cara kenali SMS penipuan?' },
  { icon: '🤳', text: 'Foto viral, gimana cara cek kebenarannya?' },
  { icon: '🛡️', text: 'Apa itu phishing dan cara menghindarinya?' },
  { icon: '📧', text: 'Ciri-ciri email scam yang harus diwaspadai' },
  { icon: '🔍', text: 'Cara verifikasi berita sebelum dishare' },
]

const EDUCATION_CARDS = [
  {
    icon: '📰',
    title: 'Mengenali Hoaks',
    desc: 'Hoaks biasanya pakai judul sensasional, sumber tidak jelas, dan memancing emosi. Selalu cek sumber sebelum share!',
    color: 'border-red-800',
  },
  {
    icon: '🎭',
    title: 'Bahaya Deepfake',
    desc: 'Deepfake adalah video/foto palsu yang dibuat AI. Ciri-cirinya: gerakan tidak natural, tepi wajah blur, dan pencahayaan aneh.',
    color: 'border-purple-800',
  },
  {
    icon: '🔐',
    title: 'Keamanan Password',
    desc: 'Password kuat minimal 12 karakter, campuran huruf besar-kecil, angka, dan simbol. Jangan pakai tanggal lahir!',
    color: 'border-blue-800',
  },
  {
    icon: '🎣',
    title: 'Waspada Phishing',
    desc: 'Phishing adalah penipuan yang menyamar jadi instansi resmi. Cek URL dengan teliti — jangan klik link mencurigakan!',
    color: 'border-yellow-800',
  },
  {
    icon: '📱',
    title: 'Aman di Media Sosial',
    desc: 'Aktifkan 2FA, jangan share info pribadi sembarangan, dan waspada akun palsu yang meminta data sensitif.',
    color: 'border-green-800',
  },
  {
    icon: '💬',
    title: 'Scam via Chat',
    desc: 'Scammer sering pura-pura jadi orang dikenal. Waspada jika ada yang minta transfer uang atau kode OTP lewat chat!',
    color: 'border-orange-800',
  },
]

type Message = {
  role: 'user' | 'assistant'
  content: string
}

export default function EducationPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: '👋 Halo! Saya **Nusantara AI Guard**, asisten edukasi keamanan digitalmu.\n\nKamu bisa tanya apa saja seputar hoaks, deepfake, phishing, keamanan akun, atau literasi digital. Pilih topik di bawah atau ketik pertanyaanmu sendiri! 🛡️',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [quickRepliesUsed, setQuickRepliesUsed] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return
    setQuickRepliesUsed(true)

    const userMsg: Message = { role: 'user', content: text }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const history = newMessages.slice(1).map(m => ({
        role: m.role,
        content: m.content,
      }))
      const res = await fetch('http://localhost:8000/api/chatbot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '❌ Maaf, gagal konek ke server. Pastikan backend sudah jalan.'
      }])
    }
    setLoading(false)
  }

  function formatMessage(text: string) {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>')
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">

      {/* Navbar */}
      <nav className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-red-500 font-bold text-lg">
            🛡️ Nusantara Defense AI
          </Link>
          <div className="flex gap-4 text-sm">
            <Link href="/" className="text-gray-400 hover:text-white transition">🔍 Detektor</Link>
            <Link href="/education" className="text-white font-medium border-b border-red-500 pb-0.5">📚 Edukasi</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-white mb-2">📚 Education Hub</h1>
          <p className="text-gray-400 text-sm">Tingkatkan literasi digitalmu — kenali ancaman siber sebelum jadi korban</p>
        </div>

        {/* Education Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {EDUCATION_CARDS.map((card, i) => (
            <div key={i} className={`bg-gray-900 rounded-xl p-5 border ${card.color} hover:scale-105 transition-transform cursor-default`}>
              <p className="text-2xl mb-2">{card.icon}</p>
              <h3 className="font-semibold text-white mb-1">{card.title}</h3>
              <p className="text-gray-400 text-xs leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>

        {/* Chatbot Section */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">

          {/* Chat Header */}
          <div className="px-5 py-4 border-b border-gray-800 flex items-center gap-3">
            <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-sm">🤖</div>
            <div>
              <p className="font-medium text-sm">Nusantara AI Guard</p>
              <p className="text-xs text-green-400">● Online</p>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="h-96 overflow-y-auto p-5 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 bg-red-600 rounded-full flex items-center justify-center text-xs mr-2 mt-1 flex-shrink-0">🤖</div>
                )}
                <div
                  className={`max-w-xs md:max-w-md rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-red-600 text-white rounded-tr-sm'
                      : 'bg-gray-800 text-gray-200 rounded-tl-sm'
                  }`}
                  dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                />
              </div>
            ))}

            {/* Loading bubble */}
            {loading && (
              <div className="flex justify-start">
                <div className="w-7 h-7 bg-red-600 rounded-full flex items-center justify-center text-xs mr-2 mt-1">🤖</div>
                <div className="bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick Reply Buttons */}
          {!quickRepliesUsed && (
            <div className="px-5 py-3 border-t border-gray-800">
              <p className="text-xs text-gray-500 mb-3">Pilih topik atau ketik pertanyaanmu:</p>
              <div className="flex flex-wrap gap-2">
                {QUICK_REPLIES.map((qr, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(qr.text)}
                    className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-red-600 text-gray-300 text-xs px-3 py-2 rounded-full transition"
                  >
                    <span>{qr.icon}</span>
                    <span>{qr.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat Input */}
          <div className="px-5 py-4 border-t border-gray-800">
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 bg-gray-800 text-white text-sm rounded-xl px-4 py-3 border border-gray-700 focus:outline-none focus:border-red-500 placeholder-gray-500"
                placeholder="Ketik pertanyaanmu tentang keamanan digital..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
                disabled={loading}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={loading || !input.trim()}
                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:text-gray-500 text-white px-4 py-3 rounded-xl transition font-medium text-sm"
              >
                Kirim
              </button>
            </div>
            {quickRepliesUsed && (
              <button
                onClick={() => setQuickRepliesUsed(false)}
                className="mt-2 text-xs text-gray-600 hover:text-gray-400 transition"
              >
                Tampilkan pertanyaan populer lagi
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
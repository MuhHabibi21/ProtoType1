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
    bgColor: 'bg-neo-red/10',
    borderColor: 'border-neo-red',
  },
  {
    icon: '🎭',
    title: 'Bahaya Deepfake',
    desc: 'Deepfake adalah video/foto palsu yang dibuat AI. Ciri-cirinya: gerakan tidak natural, tepi wajah blur, dan pencahayaan aneh.',
    bgColor: 'bg-neo-purple/10',
    borderColor: 'border-neo-purple',
  },
  {
    icon: '🔐',
    title: 'Keamanan Password',
    desc: 'Password kuat minimal 12 karakter, campuran huruf besar-kecil, angka, dan simbol. Jangan pakai tanggal lahir!',
    bgColor: 'bg-neo-blue/10',
    borderColor: 'border-neo-blue',
  },
  {
    icon: '🎣',
    title: 'Waspada Phishing',
    desc: 'Phishing adalah penipuan yang menyamar jadi instansi resmi. Cek URL dengan teliti — jangan klik link mencurigakan!',
    bgColor: 'bg-neo-yellow/20',
    borderColor: 'border-neo-yellow',
  },
  {
    icon: '📱',
    title: 'Aman di Media Sosial',
    desc: 'Aktifkan 2FA, jangan share info pribadi sembarangan, dan waspada akun palsu yang meminta data sensitif.',
    bgColor: 'bg-neo-green/10',
    borderColor: 'border-neo-green',
  },
  {
    icon: '💬',
    title: 'Scam via Chat',
    desc: 'Scammer sering pura-pura jadi orang dikenal. Waspada jika ada yang minta transfer uang atau kode OTP lewat chat!',
    bgColor: 'bg-neo-orange/10',
    borderColor: 'border-neo-orange',
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
    <main className="min-h-screen text-black pb-12">

      {/* Navbar */}
      <nav className="border-b-4 border-black bg-white px-6 py-4 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="bg-neo-red text-white border-2 border-black px-3 py-1 font-black text-sm uppercase tracking-wider transform -rotate-1 shadow-[2px_2px_0px_rgba(0,0,0,1)]">
            🛡️ Nusantara Defense AI
          </Link>
          <div className="flex gap-4 text-xs font-black uppercase">
            <Link href="/" className="bg-white text-black border-2 border-black px-3 py-1.5 shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all hover:bg-neutral-100">
              🔍 Detektor
            </Link>
            <Link href="/education" className="bg-neo-yellow text-black border-2 border-black px-3 py-1.5 shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all">
              📚 Edukasi
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="mb-10 text-center">
          <div className="inline-block bg-neo-yellow border-4 border-black px-6 py-4 transform rotate-1 shadow-[6px_6px_0px_rgba(0,0,0,1)]">
            <h1 className="text-3xl md:text-4xl font-black text-black tracking-tight leading-none uppercase">
              📚 Education Hub
            </h1>
          </div>
          <div className="mt-4">
            <p className="bg-white border-2 border-black inline-block text-black font-extrabold uppercase px-4 py-1 text-xs tracking-wider shadow-[3px_3px_0px_rgba(0,0,0,1)]">
              Tingkatkan literasi digitalmu — kenali ancaman siber sebelum jadi korban
            </p>
          </div>
        </div>

        {/* Education Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {EDUCATION_CARDS.map((card, i) => (
            <div key={i} className={`${card.bgColor} border-3 border-black p-6 shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-1 duration-200 cursor-default`}>
              <p className="text-3xl mb-3">{card.icon}</p>
              <h3 className="font-black text-black uppercase text-sm mb-2">{card.title}</h3>
              <p className="text-neutral-700 font-bold text-[11px] leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>

        {/* Chatbot Section */}
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] overflow-hidden">

          {/* Chat Header */}
          <div className="px-5 py-4 border-b-4 border-black bg-neo-yellow flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-black text-white border-2 border-black rounded-none flex items-center justify-center font-black text-sm">🤖</div>
              <div>
                <p className="font-black text-sm uppercase text-black">Nusantara AI Guard</p>
                <p className="text-[10px] text-green-700 font-extrabold uppercase tracking-wider">● Online</p>
              </div>
            </div>
            <span className="bg-white text-black text-xs font-black uppercase px-2 py-0.5 border-2 border-black shadow-[1.5px_1.5px_0px_rgba(0,0,0,1)]">
              🛡️ Asisten Siber
            </span>
          </div>

          {/* Chat Messages */}
          <div className="h-96 overflow-y-auto p-5 space-y-4 bg-amber-50/5">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 bg-black text-white rounded-none flex items-center justify-center text-xs mr-2 mt-1 flex-shrink-0 font-bold border border-black shadow-[1px_1px_0px_rgba(0,0,0,1)]">🤖</div>
                )}
                <div
                  className={`max-w-xs md:max-w-md px-4 py-3 text-xs leading-relaxed border-2 border-black font-semibold shadow-[2px_2px_0px_rgba(0,0,0,1)] ${
                    msg.role === 'user'
                      ? 'bg-neo-red text-white'
                      : 'bg-white text-black'
                  }`}
                  dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                />
              </div>
            ))}

            {/* Loading bubble */}
            {loading && (
              <div className="flex justify-start">
                <div className="w-7 h-7 bg-black text-white rounded-none flex items-center justify-center text-xs mr-2 mt-1 font-bold border border-black">🤖</div>
                <div className="bg-white border-2 border-black px-4 py-3 shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                  <div className="flex gap-1.5 items-center">
                    <span className="w-2.5 h-2.5 bg-black rounded-none animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2.5 h-2.5 bg-black rounded-none animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2.5 h-2.5 bg-black rounded-none animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick Reply Buttons */}
          {!quickRepliesUsed && (
            <div className="px-5 py-4 border-t-3 border-black bg-neutral-50/50">
              <p className="text-[10px] font-black uppercase text-neutral-500 mb-3">Pilih topik cepat:</p>
              <div className="flex flex-wrap gap-2.5">
                {QUICK_REPLIES.map((qr, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(qr.text)}
                    className="flex items-center gap-1.5 bg-white hover:bg-neutral-100 border-2 border-black text-black font-bold text-xs px-3 py-2 shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3.5px_3.5px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
                  >
                    <span>{qr.icon}</span>
                    <span>{qr.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat Input */}
          <div className="px-5 py-4 border-t-4 border-black bg-white">
            <div className="flex gap-3">
              <textarea
                className="flex-1 bg-white text-black text-xs font-semibold px-4 py-3.5 border-2 border-black focus:outline-none focus:bg-amber-50/10 placeholder-neutral-500 resize-none min-h-[44px] max-h-[120px]"
                placeholder="Ketik pertanyaanmu tentang keamanan digital..."
                rows={1}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage(input)
                  }
                }}
                disabled={loading}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={loading || !input.trim()}
                className="bg-neo-green text-black border-2 border-black px-5 py-3 shadow-[3px_3px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4.5px_4.5px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_rgba(0,0,0,1)] transition-all font-black text-xs uppercase disabled:bg-neutral-200 disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0 disabled:text-neutral-500 cursor-pointer"
              >
                Kirim
              </button>
            </div>
            {quickRepliesUsed && (
              <button
                onClick={() => setQuickRepliesUsed(false)}
                className="mt-3 text-xs text-neutral-500 font-extrabold uppercase hover:text-black transition"
              >
                Tampilkan pertanyaan populer kembali
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
import React from 'react'

function BatteryIcon(){
  return (
    <svg width="26" height="14" viewBox="0 0 26 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="22" height="12" rx="2" stroke="white" opacity="0.9" />
      <rect x="3" y="3" width="18" height="8" rx="1" fill="white" opacity="0.9" />
      <rect x="23.5" y="4.5" width="2" height="5" rx="0.5" fill="white" opacity="0.9" />
    </svg>
  )
}

function SignalIcon(){
  return (
    <svg width="22" height="14" viewBox="0 0 22 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="9" width="3" height="4" fill="white" opacity="0.9"/>
      <rect x="6" y="7" width="3" height="6" fill="white" opacity="0.9"/>
      <rect x="11" y="5" width="3" height="8" fill="white" opacity="0.9"/>
      <rect x="16" y="3" width="3" height="10" fill="white" opacity="0.9"/>
    </svg>
  )
}

function BackArrow(){
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 6L9 12L15 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function GlowingRing({ size=280, stroke=10, progress=0.6, color="#20f0d0" }){
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - Math.max(0, Math.min(1, progress)))
  const center = size/2
  return (
    <svg width={size} height={size} style={{ display:'block' }}>
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <linearGradient id="tealgrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#2ffff0"/>
          <stop offset="100%" stopColor="#14b8a6"/>
        </linearGradient>
      </defs>
      <circle cx={center} cy={center} r={radius} fill="none" stroke="#0b1f1e" strokeWidth={stroke} opacity="0.25" />
      <circle cx={center} cy={center} r={radius} fill="none" stroke="url(#tealgrad)" strokeWidth={stroke}
        strokeDasharray={`${circumference} ${circumference}`} strokeDashoffset={dashOffset}
        transform={`rotate(-90 ${center} ${center})`} filter="url(#glow)" strokeLinecap="round"/>
    </svg>
  )
}

export default function ConceptObsidian(){
  return (
    <div className="min-h-screen relative overflow-hidden bg-black text-white">
      {/* subtle texture + glow */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -top-40 -left-20 w-[60vw] h-[60vw] rounded-full blur-[120px] opacity-30" style={{ background: 'radial-gradient(circle, rgba(20,184,166,0.35) 0%, rgba(0,0,0,0) 60%)' }} />
        <div className="absolute -bottom-40 -right-20 w-[70vw] h-[70vw] rounded-full blur-[120px] opacity-25" style={{ background: 'radial-gradient(circle, rgba(47,255,240,0.28) 0%, rgba(0,0,0,0) 60%)' }} />
        <div className="absolute inset-0 mix-blend-overlay opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(#0f172a 1px, transparent 1px)', backgroundSize: '3px 3px' }} />
      </div>

      {/* top bar */}
      <div className="relative z-10 flex items-center justify-between px-4 pt-6">
        <div className="flex items-center gap-2">
          <BackArrow />
        </div>
        <div className="text-sm tracking-widest uppercase opacity-90">Obsidian</div>
        <div className="flex items-center gap-3">
          <SignalIcon />
          <BatteryIcon />
        </div>
      </div>

      {/* center */}
      <div className="relative z-10 flex flex-col items-center justify-center" style={{ minHeight: 'calc(100vh - 200px)' }}>
        <div className="relative" style={{ width: 300, height: 300 }}>
          <GlowingRing size={300} stroke={12} progress={0.6} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-[88px] leading-none font-semibold tracking-tight">00:45</div>
            <div className="mt-2 text-sm tracking-widest opacity-90">ROUND 3/8</div>
          </div>
        </div>
      </div>

      {/* bottom button */}
      <div className="relative z-10 px-6 pb-10">
        <button className="w-full py-4 rounded-2xl text-lg font-semibold text-white"
          style={{
            background: 'linear-gradient(180deg, rgba(47,255,240,0.2) 0%, rgba(20,184,166,0.2) 100%)',
            boxShadow: '0 0 24px rgba(32,240,208,0.4), inset 0 0 10px rgba(32,240,208,0.3)',
            border: '1px solid rgba(47,255,240,0.35)'
          }}>
          PAUSE
        </button>
      </div>
    </div>
  )
}

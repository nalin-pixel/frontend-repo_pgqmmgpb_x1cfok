import React, { useEffect, useMemo, useRef, useState } from 'react'
import ProgressRing from './components/ProgressRing'
import { RoutinesPanel, EditPanel, LogsPanel, LegalPanel } from './components/Panels'

// Utilities
const pad2 = (n) => String(n).padStart(2, '0')
const fmtTime = (totalSec) => `${pad2(Math.floor(totalSec / 60))}:${pad2(totalSec % 60)}`

// Local storage helpers
const LS_KEYS = {
  routines: 'readygo:routines',
  selected: 'readygo:selectedRoutine',
  logs: 'readygo:logs',
}

const defaultRoutine = () => ({
  id: `r_${Date.now()}`,
  name: 'Default',
  workMin: 0,
  workSec: 30,
  restMin: 0,
  restSec: 20,
  rounds: 10,
  sound: true,
})

function loadRoutines() {
  try {
    const raw = localStorage.getItem(LS_KEYS.routines)
    if (raw) return JSON.parse(raw)
  } catch {}
  const d = [defaultRoutine()]
  localStorage.setItem(LS_KEYS.routines, JSON.stringify(d))
  localStorage.setItem(LS_KEYS.selected, d[0].id)
  return d
}
function saveRoutines(list){ localStorage.setItem(LS_KEYS.routines, JSON.stringify(list)) }
function loadSelected(){ return localStorage.getItem(LS_KEYS.selected) }
function saveSelected(id){ localStorage.setItem(LS_KEYS.selected, id) }
function loadLogs(){ try{ return JSON.parse(localStorage.getItem(LS_KEYS.logs)||'[]')}catch{return []} }
function saveLogs(list){ localStorage.setItem(LS_KEYS.logs, JSON.stringify(list)) }

// Sound generator (WebAudio beep) and haptics
function useCues(enabled){
  const ctxRef = useRef(null)
  useEffect(()=>{ if (!enabled && ctxRef.current){ try{ ctxRef.current.close() }catch{} ctxRef.current=null } },[enabled])

  const beep = (duration=0.12, freq=880) => {
    if (!enabled) return
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (!AudioCtx) return
      const ctx = ctxRef.current || new AudioCtx()
      ctxRef.current = ctx
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.type = 'sine'
      o.frequency.value = freq
      g.gain.value = 0.05
      o.connect(g).connect(ctx.destination)
      const t = ctx.currentTime
      o.start(t)
      o.stop(t + duration)
    } catch {}
  }

  const vibrate = (pattern=[80]) => {
    if (!enabled) return
    if ('vibrate' in navigator) {
      try { navigator.vibrate(pattern) } catch {}
    }
  }

  return { beep, vibrate }
}

function useWakeLock(active){
  const lockRef = useRef(null)
  useEffect(()=>{
    let cancelled = false
    async function req(){
      if (active && 'wakeLock' in navigator) {
        try {
          const lock = await navigator.wakeLock.request('screen')
          if (!cancelled) lockRef.current = lock
          lock.addEventListener('release', ()=>{})
        } catch {}
      }
    }
    req()
    return ()=>{
      cancelled = true
      try { lockRef.current && lockRef.current.release() } catch {}
      lockRef.current = null
    }
  },[active])
}

export default function App(){
  // Data
  const [routines, setRoutines] = useState(()=>loadRoutines())
  const [selectedId, setSelectedId] = useState(()=>loadSelected() || (routines[0]?.id))
  const selected = useMemo(()=> routines.find(r=>r.id===selectedId) || routines[0], [routines, selectedId])
  const [logs, setLogs] = useState(()=>loadLogs())

  // Panels
  const [showRoutines, setShowRoutines] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showLogs, setShowLogs] = useState(false)
  const [showLegal, setShowLegal] = useState(false)

  // Timer state
  const [mode, setMode] = useState('idle') // idle|getready|work|rest|paused|complete
  const [round, setRound] = useState(0)
  const [totalRounds, setTotalRounds] = useState(0)
  const [phaseDuration, setPhaseDuration] = useState(0) // seconds
  const [remainingMs, setRemainingMs] = useState(0)
  const endTsRef = useRef(0)
  const pausedSnapshotRef = useRef({ remainingMs: 0, mode: 'idle' })
  const playedTenRef = useRef(false)
  const cueFinalRef = useRef(false)

  const routineTotalSeconds = useMemo(()=>{
    if (!selected) return 0
    const work = selected.workMin*60 + selected.workSec
    const rest = selected.restMin*60 + selected.restSec
    return (work + rest) * selected.rounds
  },[selected])

  const { beep, vibrate } = useCues(selected?.sound ?? true)
  useWakeLock(mode==='work' || mode==='rest' || mode==='getready' || mode==='paused')

  // Primary ticker with drift-free math
  useEffect(()=>{
    if (mode==='idle' || mode==='complete') return
    const interval = setInterval(()=>{
      const now = Date.now()
      const ms = Math.max(0, endTsRef.current - now)
      setRemainingMs(ms)
    }, 100)
    return ()=>clearInterval(interval)
  },[mode])

  // Cue handling
  useEffect(()=>{
    if (!(mode==='work' || mode==='rest' || mode==='getready')) return
    const secLeft = Math.ceil(remainingMs/1000)
    if (secLeft===10 && !playedTenRef.current){
      playedTenRef.current = true
      beep(0.1, 800); vibrate([60])
    }
    if (secLeft>10) playedTenRef.current = false
    if (secLeft===0){
      // boundary cue happens on transition in onPhaseEnd to avoid double-fire
    }
  },[remainingMs, mode])

  // Start handlers
  const startGetReady = (routine) => {
    const duration = 3 // seconds
    setMode('getready')
    setRound(1)
    setTotalRounds(routine.rounds)
    setPhaseDuration(duration)
    endTsRef.current = Date.now() + duration*1000
    setRemainingMs(duration*1000)
    playedTenRef.current = false
    cueFinalRef.current = false
  }

  const startPhase = (nextMode, durationSec) => {
    setMode(nextMode)
    setPhaseDuration(durationSec)
    endTsRef.current = Date.now() + durationSec*1000
    setRemainingMs(durationSec*1000)
    playedTenRef.current = false
  }

  const onPhaseEnd = () => {
    const workSec = selected.workMin*60 + selected.workSec
    const restSec = selected.restMin*60 + selected.restSec

    // boundary cue
    beep(0.1, 1000); vibrate([60])

    if (mode==='getready'){
      startPhase('work', workSec)
      return
    }

    if (mode==='work'){
      if (restSec>0){
        startPhase('rest', restSec)
      } else {
        // no rest; advance round
        if (round>=totalRounds){
          onWorkoutComplete()
        } else {
          setRound(r=>r+1)
          startPhase('work', workSec)
        }
      }
      return
    }

    if (mode==='rest'){
      if (round>=totalRounds){
        onWorkoutComplete()
      } else {
        setRound(r=>r+1)
        startPhase('work', workSec)
      }
      return
    }
  }

  // Watch remaining to flip phases exactly on boundary without drift
  useEffect(()=>{
    if (mode==='idle' || mode==='paused' || mode==='complete') return
    if (remainingMs<=0){
      onPhaseEnd()
    }
  },[remainingMs, mode])

  const onStart = () => {
    if (!selected) return
    startGetReady(selected)
  }

  const onPause = () => {
    pausedSnapshotRef.current = { remainingMs, mode }
    setMode('paused')
  }
  const onResume = () => {
    const snap = pausedSnapshotRef.current
    const m = snap.mode
    setMode(m)
    setPhaseDuration(Math.ceil(snap.remainingMs/1000))
    endTsRef.current = Date.now() + snap.remainingMs
    setRemainingMs(snap.remainingMs)
  }

  const onResetConfirm = () => {
    // back to idle without logging
    setMode('idle')
    setRound(0)
    setPhaseDuration(0)
    setRemainingMs(0)
  }

  const onWorkoutComplete = () => {
    if (!cueFinalRef.current){
      cueFinalRef.current = true
      beep(0.2, 1200); vibrate([100])
    }
    // log
    const totalDone = routineTotalSeconds
    const entry = {
      name: selected.name,
      date: Date.now(),
      totalDisplay: fmtTime(totalDone),
      rounds: totalRounds,
    }
    const nextLogs = [entry, ...logs]
    setLogs(nextLogs)
    saveLogs(nextLogs)
    setMode('complete')
  }

  // UI derived values
  const secLeft = Math.ceil(remainingMs/1000)
  const workSec = selected ? selected.workMin*60 + selected.workSec : 0
  const restSec = selected ? selected.restMin*60 + selected.restSec : 0

  const totalRemaining = useMemo(()=>{
    if (mode==='idle') return routineTotalSeconds
    // compute remaining across current and future phases
    let rem = 0
    const perRound = workSec + restSec
    if (mode==='getready'){
      rem += secLeft + (totalRounds - 1 + 1 - 1) * perRound // but rounds init at 1 already
      // simpler: all rounds remaining
      rem = (totalRounds)*perRound
    } else if (mode==='work'){
      rem += secLeft + (totalRounds - round)*(perRound)
    } else if (mode==='rest'){
      rem += secLeft + (totalRounds - round)*(perRound)
    } else if (mode==='paused'){
      const snap = pausedSnapshotRef.current
      const leftNow = Math.ceil(snap.remainingMs/1000)
      rem += leftNow + (totalRounds - round)*(perRound)
    } else if (mode==='complete'){
      rem = 0
    }
    return rem
  },[mode, secLeft, totalRounds, round, workSec, restSec, routineTotalSeconds])

  const progress = useMemo(()=>{
    if (phaseDuration<=0) return 0
    return Math.max(0, Math.min(1, remainingMs / (phaseDuration*1000)))
  },[remainingMs, phaseDuration])

  // Background color per spec
  const bgClass = useMemo(()=>{
    if (mode==='work') return 'bg-black text-white'
    if (mode==='rest' || mode==='idle' || mode==='complete' || mode==='getready') return 'bg-white text-black'
    if (mode==='paused') return 'bg-neutral-300 text-black'
    return 'bg-white text-black'
  },[mode])

  // Editing routine state holder
  const [editDraft, setEditDraft] = useState(()=> selected || defaultRoutine())
  useEffect(()=>{ setEditDraft(selected || defaultRoutine()) },[selected])

  const saveEdit = () => {
    let list = routines
    const exists = list.find(r=>r.id===editDraft.id)
    let next
    if (exists){
      next = list.map(r=> r.id===editDraft.id ? { ...editDraft } : r)
    } else {
      next = [...list, { ...editDraft, id: `r_${Date.now()}` }]
    }
    setRoutines(next); saveRoutines(next)
    setSelectedId(editDraft.id || next[next.length-1].id); saveSelected(editDraft.id || next[next.length-1].id)
    setShowEdit(false)
  }

  const startFromEdit = () => {
    saveEdit()
    onStart()
    setShowEdit(false)
  }

  const selectRoutine = (r) => { setSelectedId(r.id); saveSelected(r.id) }

  const deleteLog = (idx) => {
    const next = logs.filter((_,i)=>i!==idx)
    setLogs(next); saveLogs(next)
  }

  // Layout
  return (
    <div className={`min-h-screen transition-colors duration-200 ${bgClass}`}>
      {/* Idle screen */}
      {mode==='idle' && (
        <div className="min-h-screen flex flex-col">
          <div className="flex items-center justify-between p-4">
            <div className="text-sm">{selected?.name || 'Ready Go'}</div>
            {/* top right total remaining in idle not required */}
          </div>
          <div className="flex-1 flex items-center justify-center">
            <button onClick={onStart} className="text-5xl font-semibold border border-current px-8 py-4">
              Start
            </button>
          </div>
          <div className="p-4 flex items-center justify-center gap-10 text-sm font-light">
            <button onClick={()=>setShowRoutines(true)} className="underline">Routines</button>
            <button onClick={()=>setShowEdit(true)} className="underline">Edit</button>
            <button onClick={()=>setShowLogs(true)} className="underline">Logs</button>
          </div>
        </div>
      )}

      {/* Active / get ready / paused / complete */}
      {mode!=='idle' && mode!=='complete' && (
        <div className="min-h-screen flex flex-col">
          <div className="flex items-center justify-between p-4">
            <div className="text-sm">{selected?.name}</div>
            {(mode==='work' || mode==='rest' || mode==='getready' || mode==='paused') && (
              <div className="text-sm">Total {fmtTime(totalRemaining)}</div>
            )}
          </div>

          <div className="flex-1 flex flex-col items-center justify-center select-none">
            {/* Timer with ring */}
            <div className="relative" style={{ width: 280, height: 280 }}>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-[96px] font-semibold leading-none tracking-tight tabular-nums" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {pad2(Math.floor(secLeft/60))}:{pad2(secLeft%60)}
                </div>
              </div>
              <ProgressRing size={280} stroke={12} progress={progress} color={(mode==='work')? '#fff' : '#000'} />
            </div>
            <div className="mt-3 text-xl">{round} / {totalRounds}</div>
          </div>

          {/* Controls */}
          {mode!=='paused' && (
            <div className="p-6">
              <button onClick={onPause} className="w-full text-xl border border-current py-4">Pause</button>
            </div>
          )}

          {mode==='paused' && (
            <div className="p-6 space-y-4">
              <button onClick={onResume} className="w-full text-xl border border-current py-4">Resume</button>
              <button onClick={()=>{ if (confirm('Reset workout?')) onResetConfirm() }} className="w-full text-base border border-current py-3">Reset</button>
            </div>
          )}
        </div>
      )}

      {mode==='complete' && (
        <div className="min-h-screen flex flex-col bg-white text-black transition-colors">
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="text-2xl mb-6">Workout complete</div>
            <button onClick={()=>{ setMode('idle'); onStart() }} className="text-xl border border-black px-6 py-3">Restart</button>
          </div>
          <div className="p-4 flex items-center justify-center gap-10 text-sm font-light">
            <button onClick={()=>setShowRoutines(true)} className="underline">Routines</button>
            <button onClick={()=>setShowEdit(true)} className="underline">Edit</button>
            <button onClick={()=>setShowLogs(true)} className="underline">Logs</button>
          </div>
        </div>
      )}

      {/* Panels */}
      <RoutinesPanel
        open={showRoutines}
        onClose={()=>setShowRoutines(false)}
        routines={routines}
        onSelect={(r)=>{ selectRoutine(r) }}
        onNew={()=>{ setEditDraft(defaultRoutine()); setShowRoutines(false); setShowEdit(true) }}
      />

      <EditPanel
        open={showEdit}
        onClose={()=>setShowEdit(false)}
        value={editDraft}
        onChange={setEditDraft}
        onSave={saveEdit}
        onStart={startFromEdit}
        onOpenLegal={()=>{ setShowLegal(true) }}
      />

      <LogsPanel
        open={showLogs}
        onClose={()=>setShowLogs(false)}
        logs={logs}
        onDelete={deleteLog}
      />

      <LegalPanel
        open={showLegal}
        onClose={()=>setShowLegal(false)}
        termsUrl={import.meta.env.VITE_TERMS_URL || 'https://example.com/terms'}
        privacyUrl={import.meta.env.VITE_PRIVACY_URL || 'https://example.com/privacy'}
      />
    </div>
  )
}

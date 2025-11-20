import React from 'react'

export function BottomSheet({ open, onClose, children }) {
  return (
    <div className={`fixed inset-0 z-50 ${open ? '' : 'pointer-events-none'}`}>
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      <div
        className={`absolute inset-x-0 bottom-0 bg-white text-black rounded-t-2xl max-h-[90vh] overflow-auto transition-transform duration-200 ${open ? 'translate-y-0' : 'translate-y-full'}`}
      >
        {children}
      </div>
    </div>
  )
}

export function RoutinesPanel({ open, onClose, routines, onSelect, onNew }) {
  return (
    <BottomSheet open={open} onClose={onClose}>
      <div className="p-6 space-y-4">
        <h2 className="text-lg font-semibold">Routines</h2>
        <div className="divide-y">
          {routines.map((r) => (
            <button
              key={r.id}
              onClick={() => { onSelect(r); onClose(); }}
              className="w-full text-left py-4">
              {r.name}
            </button>
          ))}
        </div>
        <div className="pt-4">
          <button onClick={() => { onNew(); }} className="underline">New Routine</button>
        </div>
      </div>
    </BottomSheet>
  )
}

export function EditPanel({ open, onClose, value, onChange, onSave, onStart, onOpenLegal }) {
  const v = value
  const set = (patch) => onChange({ ...v, ...patch })
  const fmt = (n) => String(n).padStart(2, '0')

  return (
    <BottomSheet open={open} onClose={onClose}>
      <div className="p-6 space-y-5">
        <h2 className="text-lg font-semibold">Edit Routine</h2>
        <div className="space-y-3">
          <label className="block text-sm">Routine name</label>
          <input value={v.name} onChange={(e)=>set({name:e.target.value})} className="w-full border border-black/20 px-3 py-2" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-sm mb-2">Work</div>
            <div className="flex items-center gap-2">
              <NumberPicker value={v.workMin} onChange={(n)=>set({workMin:n})} label="min" />
              <NumberPicker value={v.workSec} onChange={(n)=>set({workSec:n})} label="sec" />
            </div>
          </div>
          <div>
            <div className="text-sm mb-2">Rest</div>
            <div className="flex items-center gap-2">
              <NumberPicker value={v.restMin} onChange={(n)=>set({restMin:n})} label="min" />
              <NumberPicker value={v.restSec} onChange={(n)=>set({restSec:n})} label="sec" />
            </div>
          </div>
          <div>
            <div className="text-sm mb-2">Rounds</div>
            <NumberPicker value={v.rounds} onChange={(n)=>set({rounds:n})} label="" />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span>Sound</span>
          <button onClick={()=>set({sound: !v.sound})} className="border px-3 py-1">{v.sound? 'On':'Off'}</button>
        </div>
        <div className="text-sm">
          Work {fmt(v.workMin)}:{fmt(v.workSec)} / Rest {fmt(v.restMin)}:{fmt(v.restSec)} / {v.rounds} rounds / Total {fmt(totalMinutes(v))}:{fmt(totalSeconds(v))}
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={onSave} className="flex-1 border px-4 py-3">Save</button>
          <button onClick={onStart} className="flex-1 border px-4 py-3">Start</button>
        </div>
        <div>
          <button onClick={onOpenLegal} className="underline text-sm">Legal</button>
        </div>
      </div>
    </BottomSheet>
  )
}

function totalSeconds(v){
  const total = (v.workMin*60+v.workSec + v.restMin*60+v.restSec) * v.rounds
  return total % 60
}
function totalMinutes(v){
  const total = (v.workMin*60+v.workSec + v.restMin*60+v.restSec) * v.rounds
  return Math.floor(total / 60)
}

function NumberPicker({ value, onChange, label }){
  return (
    <div className="inline-flex flex-col items-center">
      <button className="border px-4 py-2" onClick={()=>onChange(value+1)}>+</button>
      <div className="py-2 min-w-[3ch] text-center">{String(value).padStart(2,'0')}</div>
      <button className="border px-4 py-2" onClick={()=>onChange(Math.max(0,value-1))}>-</button>
      {label && <div className="text-xs mt-1">{label}</div>}
    </div>
  )
}

export function LogsPanel({ open, onClose, logs, onDelete }){
  return (
    <BottomSheet open={open} onClose={onClose}>
      <div className="p-6 space-y-4">
        <h2 className="text-lg font-semibold">Logs</h2>
        <div className="divide-y">
          {logs.length === 0 && <div className="py-6 text-sm">No logs yet</div>}
          {logs.map((l, idx)=> (
            <div key={idx} className="py-4 flex items-center justify-between">
              <div>
                <div>{l.name}</div>
                <div className="text-sm text-black/60">{new Date(l.date).toLocaleString()}</div>
              </div>
              <div className="text-sm">{l.totalDisplay} • {l.rounds} rounds</div>
              <button onClick={()=>onDelete(idx)} className="underline text-sm">Delete</button>
            </div>
          ))}
        </div>
      </div>
    </BottomSheet>
  )
}

export function LegalPanel({ open, onClose, termsUrl, privacyUrl }){
  return (
    <BottomSheet open={open} onClose={onClose}>
      <div className="p-6 space-y-4">
        <h2 className="text-lg font-semibold">Legal</h2>
        <div className="divide-y">
          <a className="block py-4 underline" href={termsUrl} target="_blank" rel="noreferrer">Terms of Use</a>
          <a className="block py-4 underline" href={privacyUrl} target="_blank" rel="noreferrer">Privacy Policy</a>
        </div>
      </div>
    </BottomSheet>
  )
}

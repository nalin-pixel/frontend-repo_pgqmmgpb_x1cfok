import React from 'react'

function ProgressRing({ size = 260, stroke = 10, progress = 1, color = '#000' }) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const clamped = Math.max(0, Math.min(1, progress))
  const dashOffset = circumference * (1 - clamped)

  return (
    <svg width={size} height={size} style={{ display: 'block' }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="butt"
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={dashOffset}
        style={{ transition: 'none' }}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  )
}

export default ProgressRing

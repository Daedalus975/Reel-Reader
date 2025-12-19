import React, { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { Howl } from 'howler'

interface AudioVisualizerProps {
  isOpen: boolean
  onClose: () => void
  howlInstance?: Howl | null
}

type VisualizerType = 'bars' | 'waveform' | 'circular' | 'particles'

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  isOpen,
  onClose,
  howlInstance,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationIdRef = useRef<number>()
  const analyserRef = useRef<AnalyserNode | null>(null)
  const dataArrayRef = useRef<Uint8Array | null>(null)
  const [visualizerType, setVisualizerType] = useState<VisualizerType>('bars')

  useEffect(() => {
    if (!isOpen || !howlInstance || !canvasRef.current) return

    const canvas = canvasRef.current
    const canvasCtx = canvas.getContext('2d')
    if (!canvasCtx) return

    // Set canvas size
    const updateSize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio
      canvas.height = canvas.offsetHeight * window.devicePixelRatio
      canvasCtx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }
    updateSize()
    window.addEventListener('resize', updateSize)

    // Create audio context and analyser from Howler
    try {
      // Get Howler's internal audio node
      const audioCtx = (Howler as any).ctx as AudioContext
      if (!audioCtx) throw new Error('No audio context')

      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 256
      const bufferLength = analyser.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)

      // Connect Howler's master gain to analyser
      const masterGain = (Howler as any).masterGain as GainNode
      if (masterGain) {
        masterGain.connect(analyser)
      }

      analyserRef.current = analyser
      dataArrayRef.current = dataArray

      // Animation loop
      const draw = () => {
        if (!analyserRef.current || !dataArrayRef.current) return

        const frequencyData = new Uint8Array(dataArrayRef.current.length)
        analyserRef.current.getByteFrequencyData(frequencyData)
        // Copy back to our ref for use in draw functions
        dataArrayRef.current.set(frequencyData)

        const width = canvas.offsetWidth
        const height = canvas.offsetHeight

        // Clear canvas
        canvasCtx.fillStyle = 'rgb(13, 13, 13)'
        canvasCtx.fillRect(0, 0, width, height)

        switch (visualizerType) {
          case 'bars':
            drawBars(canvasCtx, dataArrayRef.current, width, height, bufferLength)
            break
          case 'waveform':
            drawWaveform(canvasCtx, dataArrayRef.current, width, height, bufferLength)
            break
          case 'circular':
            drawCircular(canvasCtx, dataArrayRef.current, width, height, bufferLength)
            break
          case 'particles':
            drawParticles(canvasCtx, dataArrayRef.current, width, height, bufferLength)
            break
        }

        animationIdRef.current = requestAnimationFrame(draw)
      }

      draw()
    } catch (error) {
      console.error('Failed to create audio visualizer:', error)
    }

    return () => {
      window.removeEventListener('resize', updateSize)
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }
      // Disconnect analyser
      if (analyserRef.current) {
        analyserRef.current.disconnect()
      }
    }
  }, [isOpen, howlInstance, visualizerType])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/95 flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-surface/30">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-bold text-light">Audio Visualizer</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setVisualizerType('bars')}
              className={`px-3 py-1 text-sm ${
                visualizerType === 'bars' ? 'bg-primary text-white' : 'bg-surface text-gray-400'
              }`}
            >
              Bars
            </button>
            <button
              onClick={() => setVisualizerType('waveform')}
              className={`px-3 py-1 text-sm ${
                visualizerType === 'waveform' ? 'bg-primary text-white' : 'bg-surface text-gray-400'
              }`}
            >
              Waveform
            </button>
            <button
              onClick={() => setVisualizerType('circular')}
              className={`px-3 py-1 text-sm ${
                visualizerType === 'circular' ? 'bg-primary text-white' : 'bg-surface text-gray-400'
              }`}
            >
              Circular
            </button>
            <button
              onClick={() => setVisualizerType('particles')}
              className={`px-3 py-1 text-sm ${
                visualizerType === 'particles' ? 'bg-primary text-white' : 'bg-surface text-gray-400'
              }`}
            >
              Particles
            </button>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-surface/50 text-gray-400 hover:text-light transition"
          aria-label="Close"
        >
          <X size={20} />
        </button>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      </div>

      {/* Info */}
      <div className="p-2 text-xs text-gray-500 text-center border-t border-surface/30">
        Press ESC to close
      </div>
    </div>
  )
}

// Visualizer drawing functions
function drawBars(ctx: CanvasRenderingContext2D, dataArray: Uint8Array, width: number, height: number, bufferLength: number) {
  const barWidth = (width / bufferLength) * 2.5
  let x = 0

  for (let i = 0; i < bufferLength; i++) {
    const barHeight = (dataArray[i] / 255) * height

    const hue = (i / bufferLength) * 360
    ctx.fillStyle = `hsl(${hue}, 70%, 50%)`
    ctx.fillRect(x, height - barHeight, barWidth, barHeight)

    x += barWidth + 1
  }
}

function drawWaveform(ctx: CanvasRenderingContext2D, dataArray: Uint8Array, width: number, height: number, bufferLength: number) {
  ctx.lineWidth = 2
  ctx.strokeStyle = 'rgb(232, 121, 78)' // Primary color
  ctx.beginPath()

  const sliceWidth = width / bufferLength
  let x = 0

  for (let i = 0; i < bufferLength; i++) {
    const v = dataArray[i] / 255.0
    const y = v * height

    if (i === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }

    x += sliceWidth
  }

  ctx.lineTo(width, height / 2)
  ctx.stroke()
}

function drawCircular(ctx: CanvasRenderingContext2D, dataArray: Uint8Array, width: number, height: number, bufferLength: number) {
  const centerX = width / 2
  const centerY = height / 2
  const radius = Math.min(width, height) / 3

  ctx.lineWidth = 2

  for (let i = 0; i < bufferLength; i++) {
    const barHeight = (dataArray[i] / 255) * radius
    const angle = (i / bufferLength) * Math.PI * 2

    const x1 = centerX + Math.cos(angle) * radius
    const y1 = centerY + Math.sin(angle) * radius
    const x2 = centerX + Math.cos(angle) * (radius + barHeight)
    const y2 = centerY + Math.sin(angle) * (radius + barHeight)

    const hue = (i / bufferLength) * 360
    ctx.strokeStyle = `hsl(${hue}, 70%, 50%)`
    
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()
  }
}

function drawParticles(ctx: CanvasRenderingContext2D, dataArray: Uint8Array, width: number, height: number, bufferLength: number) {
  for (let i = 0; i < bufferLength; i++) {
    const value = dataArray[i] / 255
    const x = (i / bufferLength) * width
    const particleCount = Math.floor(value * 10)

    for (let j = 0; j < particleCount; j++) {
      const y = (j / particleCount) * height * value
      const size = value * 5

      const hue = (i / bufferLength) * 360
      ctx.fillStyle = `hsla(${hue}, 70%, 50%, ${value})`
      ctx.beginPath()
      ctx.arc(x, y, size, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

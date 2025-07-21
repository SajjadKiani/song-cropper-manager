import { useState, useRef, useEffect, useCallback } from 'react'
import { Play, Pause, Square, Scissors, Save, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Alert, AlertDescription } from '@/components/ui/alert.jsx'
import WaveSurfer from 'wavesurfer.js'
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js'

const WaveformCropper = ({ song, onSegmentSave }) => {
  const waveformRef = useRef(null)
  const wavesurferRef = useRef(null)
  const regionsRef = useRef(null)
  
  const [isLoading, setIsLoading] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentRegion, setCurrentRegion] = useState(null)
  const [segmentName, setSegmentName] = useState('')
  const [previewMode, setPreviewMode] = useState(false)
  const [error, setError] = useState(null)

  // Format time display
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Initialize WaveSurfer
  useEffect(() => {
    if (!song || !waveformRef.current) return

    setIsLoading(true)
    setError(null)

    // Clean up previous instance
    if (wavesurferRef.current) {
      wavesurferRef.current.destroy()
    }

    try {
      // Create regions plugin
      const regions = RegionsPlugin.create()
      regionsRef.current = regions

      // Create WaveSurfer instance
      const wavesurfer = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: 'hsl(24.6 95% 53.1%)',
        progressColor: 'hsl(24.6 95% 53.1%)',
        cursorColor: 'hsl(24.6 95% 53.1%)',
        barWidth: 2,
        barRadius: 1,
        responsive: true,
        height: 80,
        normalize: true,
        plugins: [regions]
      })

      wavesurferRef.current = wavesurfer

      // Event listeners
      wavesurfer.on('ready', () => {
        setIsLoading(false)
        // Create initial region covering 10% to 30% of the track
        const duration = wavesurfer.getDuration()
        const startTime = duration * 0.1
        const endTime = duration * 0.3
        
        const region = regions.addRegion({
          start: startTime,
          end: endTime,
          color: 'hsla(var(--primary), 0.2)',
          drag: true,
          resize: true
        })
        
        setCurrentRegion(region)
        setSegmentName(`Segment ${Date.now()}`)
      })

      wavesurfer.on('play', () => setIsPlaying(true))
      wavesurfer.on('pause', () => setIsPlaying(false))
      
      wavesurfer.on('error', (err) => {
        console.error('WaveSurfer error:', err)
        setError('Failed to load audio waveform. Please try again.')
        setIsLoading(false)
      })

      // Region events
      regions.on('region-updated', (region) => {
        setCurrentRegion(region)
      })

      regions.on('region-clicked', (region, e) => {
        e.stopPropagation()
        setCurrentRegion(region)
      })

      // Load audio
      wavesurfer.load(song.url)

    } catch (err) {
      console.error('Failed to initialize WaveSurfer:', err)
      setError('Failed to initialize audio waveform. Please try again.')
      setIsLoading(false)
    }

    return () => {
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy()
      }
    }
  }, [song])

  // Play/Pause toggle
  const handlePlayPause = useCallback(() => {
    if (!wavesurferRef.current || isLoading) return

    if (previewMode && currentRegion) {
      // Play only the selected region
      if (isPlaying) {
        wavesurferRef.current.pause()
      } else {
        currentRegion.play()
      }
    } else {
      // Play the entire track
      wavesurferRef.current.playPause()
    }
  }, [isLoading, previewMode, currentRegion, isPlaying])

  // Stop playback
  const handleStop = useCallback(() => {
    if (!wavesurferRef.current) return
    wavesurferRef.current.stop()
  }, [])

  // Toggle preview mode
  const handlePreviewToggle = useCallback(() => {
    setPreviewMode(prev => !prev)
    if (isPlaying) {
      wavesurferRef.current?.pause()
    }
  }, [isPlaying])

  // Reset region to default
  const handleResetRegion = useCallback(() => {
    if (!wavesurferRef.current || !regionsRef.current || !currentRegion) return

    const duration = wavesurferRef.current.getDuration()
    const startTime = duration * 0.1
    const endTime = duration * 0.3

    currentRegion.setOptions({
      start: startTime,
      end: endTime
    })
  }, [currentRegion])

  // Save segment
  const handleSaveSegment = useCallback(() => {
    if (!currentRegion || !segmentName.trim()) {
      setError('Please provide a name for the segment.')
      return
    }

    const segment = {
      id: Date.now() + Math.random(),
      name: segmentName.trim(),
      startTime: currentRegion.start,
      endTime: currentRegion.end,
      duration: currentRegion.end - currentRegion.start,
      originalSong: song,
      createdAt: new Date().toISOString()
    }

    onSegmentSave(segment)
    
    // Reset for next segment
    setSegmentName(`Segment ${Date.now()}`)
    setError(null)
  }, [currentRegion, segmentName, song, onSegmentSave])

  if (!song) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No song selected for cropping</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Waveform Container */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Waveform</span>
            {isLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Loading waveform...
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            ref={waveformRef} 
            className="w-full bg-muted/30 rounded-lg"
            style={{ minHeight: '80px' }}
          />
          
          {/* Waveform Controls */}
          <div className="flex items-center justify-center gap-4 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleStop}
              disabled={isLoading}
            >
              <Square className="w-4 h-4" />
            </Button>

            <Button
              size="lg"
              onClick={handlePlayPause}
              disabled={isLoading}
              className="h-12 w-12 rounded-full"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" />
              )}
            </Button>

            <Button
              variant={previewMode ? "default" : "outline"}
              size="sm"
              onClick={handlePreviewToggle}
              disabled={isLoading || !currentRegion}
            >
              <Scissors className="w-4 h-4 mr-2" />
              {previewMode ? 'Preview Mode' : 'Full Track'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Region Controls */}
      {currentRegion && (
        <Card>
          <CardHeader>
            <CardTitle>Selection Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <Label className="text-muted-foreground">Start Time</Label>
                <p className="font-mono">{formatTime(currentRegion.start)}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">End Time</Label>
                <p className="font-mono">{formatTime(currentRegion.end)}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Duration</Label>
                <p className="font-mono">{formatTime(currentRegion.end - currentRegion.start)}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetRegion}
                className="flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reset Selection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save Segment */}
      <Card>
        <CardHeader>
          <CardTitle>Save Segment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="segment-name">Segment Name</Label>
            <Input
              id="segment-name"
              value={segmentName}
              onChange={(e) => setSegmentName(e.target.value)}
              placeholder="Enter a name for this segment"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveSegment()
              }}
            />
          </div>

          <Button
            onClick={handleSaveSegment}
            disabled={!currentRegion || !segmentName.trim() || isLoading}
            className="w-full flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Segment
          </Button>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Instructions */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-sm text-muted-foreground space-y-2">
            <h4 className="font-semibold text-foreground">How to use:</h4>
            <ul className="space-y-1 list-disc list-inside">
              <li>Drag the selection area on the waveform to choose your segment</li>
              <li>Resize the selection by dragging the edges</li>
              <li>Use "Preview Mode" to play only the selected segment</li>
              <li>Enter a name and click "Save Segment" to add it to your collection</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default WaveformCropper


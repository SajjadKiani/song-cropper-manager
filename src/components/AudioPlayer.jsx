import { useState, useRef, useEffect, useCallback } from 'react'
import { Play, Pause, Square, Volume2, VolumeX } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import { Slider } from '@/components/ui/slider.jsx'
import { Card, CardContent } from '@/components/ui/card.jsx'

const AudioPlayer = ({ song }) => {
  const audioRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.7)
  const [isMuted, setIsMuted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Format time display
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Initialize audio element when song changes
  useEffect(() => {
    if (!song || !audioRef.current) return

    const audio = audioRef.current
    setIsLoading(true)
    setIsPlaying(false)
    setCurrentTime(0)

    const handleLoadedMetadata = () => {
      setDuration(audio.duration)
      setIsLoading(false)
    }

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
    }

    const handleError = () => {
      setIsLoading(false)
      console.error('Audio loading error')
    }

    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('error', handleError)

    // Set initial volume
    audio.volume = volume

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('error', handleError)
    }
  }, [song, volume])

  // Play/Pause toggle
  const handlePlayPause = useCallback(() => {
    if (!audioRef.current || isLoading) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }, [isPlaying, isLoading])

  // Stop playback
  const handleStop = useCallback(() => {
    if (!audioRef.current) return

    audioRef.current.pause()
    audioRef.current.currentTime = 0
    setIsPlaying(false)
    setCurrentTime(0)
  }, [])

  // Seek to position
  const handleSeek = useCallback((value) => {
    if (!audioRef.current || isLoading) return

    const newTime = (value[0] / 100) * duration
    audioRef.current.currentTime = newTime
    setCurrentTime(newTime)
  }, [duration, isLoading])

  // Volume control
  const handleVolumeChange = useCallback((value) => {
    const newVolume = value[0] / 100
    setVolume(newVolume)
    if (audioRef.current) {
      audioRef.current.volume = newVolume
    }
    if (newVolume > 0 && isMuted) {
      setIsMuted(false)
    }
  }, [isMuted])

  // Mute toggle
  const handleMuteToggle = useCallback(() => {
    if (!audioRef.current) return

    if (isMuted) {
      audioRef.current.volume = volume
      setIsMuted(false)
    } else {
      audioRef.current.volume = 0
      setIsMuted(true)
    }
  }, [isMuted, volume])

  // Calculate progress percentage
  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0

  if (!song) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No song selected</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Hidden audio element */}
      <audio ref={audioRef} src={song.url} preload="metadata" />

      {/* Song Info */}
      <div className="text-center">
        <h3 className="text-lg font-semibold">{song.name}</h3>
        <p className="text-muted-foreground">
          {formatTime(currentTime)} / {formatTime(duration)}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <Slider
          value={[progressPercentage]}
          onValueChange={handleSeek}
          max={100}
          step={0.1}
          className="w-full"
          disabled={isLoading}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
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
      </div>

      {/* Volume Control */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleMuteToggle}
          className="h-8 w-8 p-0 flex-shrink-0"
        >
          {isMuted || volume === 0 ? (
            <VolumeX className="w-4 h-4" />
          ) : (
            <Volume2 className="w-4 h-4" />
          )}
        </Button>

        <div className="flex-1">
          <Slider
            value={[isMuted ? 0 : volume * 100]}
            onValueChange={handleVolumeChange}
            max={100}
            step={1}
            className="w-full"
          />
        </div>

        <span className="text-xs text-muted-foreground w-8 text-right">
          {Math.round(isMuted ? 0 : volume * 100)}%
        </span>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center text-sm text-muted-foreground">
          Loading audio...
        </div>
      )}
    </div>
  )
}

export default AudioPlayer


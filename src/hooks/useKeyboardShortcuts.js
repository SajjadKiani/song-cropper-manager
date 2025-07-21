import { useEffect } from 'react'

/**
 * Custom hook for keyboard shortcuts
 */
export const useKeyboardShortcuts = (shortcuts) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Don't trigger shortcuts when typing in input fields
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return
      }

      const key = event.key.toLowerCase()
      const ctrl = event.ctrlKey || event.metaKey
      const shift = event.shiftKey
      const alt = event.altKey

      // Create shortcut key combination
      let combination = ''
      if (ctrl) combination += 'ctrl+'
      if (shift) combination += 'shift+'
      if (alt) combination += 'alt+'
      combination += key

      // Execute matching shortcut
      if (shortcuts[combination]) {
        event.preventDefault()
        shortcuts[combination]()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts])
}

/**
 * Default keyboard shortcuts for the application
 */
export const createDefaultShortcuts = ({
  onPlayPause,
  onStop,
  onSave,
  onExport,
  onTabChange
}) => ({
  // Playback controls
  'space': onPlayPause,
  ' ': onPlayPause, // Alternative space key
  'escape': onStop,
  
  // Save and export
  'ctrl+s': onSave,
  'ctrl+e': onExport,
  
  // Tab navigation
  '1': () => onTabChange('upload'),
  '2': () => onTabChange('crop'),
  '3': () => onTabChange('manage'),
  '4': () => onTabChange('export'),
  
  // Quick actions
  'ctrl+shift+u': () => onTabChange('upload'),
  'ctrl+shift+c': () => onTabChange('crop'),
  'ctrl+shift+m': () => onTabChange('manage'),
  'ctrl+shift+x': () => onTabChange('export')
})

/**
 * Hook for audio player shortcuts
 */
export const useAudioPlayerShortcuts = (audioRef, isPlaying) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!audioRef.current || event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return
      }

      switch (event.key.toLowerCase()) {
        case ' ':
        case 'spacebar':
          event.preventDefault()
          if (isPlaying) {
            audioRef.current.pause()
          } else {
            audioRef.current.play()
          }
          break
          
        case 'escape':
          event.preventDefault()
          audioRef.current.pause()
          audioRef.current.currentTime = 0
          break
          
        case 'arrowleft':
          event.preventDefault()
          audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 5)
          break
          
        case 'arrowright':
          event.preventDefault()
          audioRef.current.currentTime = Math.min(
            audioRef.current.duration, 
            audioRef.current.currentTime + 5
          )
          break
          
        case 'arrowup':
          event.preventDefault()
          audioRef.current.volume = Math.min(1, audioRef.current.volume + 0.1)
          break
          
        case 'arrowdown':
          event.preventDefault()
          audioRef.current.volume = Math.max(0, audioRef.current.volume - 0.1)
          break
          
        case 'm':
          event.preventDefault()
          audioRef.current.muted = !audioRef.current.muted
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [audioRef, isPlaying])
}

/**
 * Hook for waveform shortcuts
 */
export const useWaveformShortcuts = (wavesurferRef, onSave) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!wavesurferRef.current || event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return
      }

      const ctrl = event.ctrlKey || event.metaKey

      switch (event.key.toLowerCase()) {
        case 'enter':
          if (ctrl && onSave) {
            event.preventDefault()
            onSave()
          }
          break
          
        case 'home':
          event.preventDefault()
          wavesurferRef.current.seekTo(0)
          break
          
        case 'end':
          event.preventDefault()
          wavesurferRef.current.seekTo(1)
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [wavesurferRef, onSave])
}


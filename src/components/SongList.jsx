import { useState } from 'react'
import { Play, Pause, Music, Clock, HardDrive } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent } from '@/components/ui/card.jsx'

const SongList = ({ songs, onSongSelect, selectedSong }) => {
  const [playingPreview, setPlayingPreview] = useState(null)
  const [audioElements, setAudioElements] = useState({})

  const formatDuration = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const handlePreviewToggle = (song) => {
    if (playingPreview === song.id) {
      // Stop current preview
      if (audioElements[song.id]) {
        audioElements[song.id].pause()
        audioElements[song.id].currentTime = 0
      }
      setPlayingPreview(null)
    } else {
      // Stop any currently playing preview
      if (playingPreview && audioElements[playingPreview]) {
        audioElements[playingPreview].pause()
        audioElements[playingPreview].currentTime = 0
      }

      // Start new preview
      let audio = audioElements[song.id]
      if (!audio) {
        audio = new Audio(song.url)
        audio.volume = 0.5
        audio.addEventListener('ended', () => {
          setPlayingPreview(null)
        })
        setAudioElements(prev => ({ ...prev, [song.id]: audio }))
      }

      audio.play()
      setPlayingPreview(song.id)
    }
  }

  const handleSongClick = (song) => {
    // Stop any playing preview
    if (playingPreview && audioElements[playingPreview]) {
      audioElements[playingPreview].pause()
      audioElements[playingPreview].currentTime = 0
      setPlayingPreview(null)
    }
    
    onSongSelect(song)
  }

  if (songs.length === 0) {
    return (
      <div className="text-center py-12">
        <Music className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Songs Uploaded</h3>
        <p className="text-muted-foreground">
          Upload some audio files to get started
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {songs.map((song) => (
        <Card 
          key={song.id}
          className={`
            transition-all duration-200 hover:shadow-md cursor-pointer
            ${selectedSong?.id === song.id 
              ? 'ring-2 ring-primary bg-primary/5' 
              : 'hover:bg-muted/50'
            }
          `}
          onClick={() => handleSongClick(song)}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              {/* Song Info */}
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg flex-shrink-0">
                  <Music className="w-6 h-6 text-primary" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-foreground truncate">
                    {song.name}
                  </h4>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDuration(song.duration)}
                    </div>
                    <div className="flex items-center gap-1">
                      <HardDrive className="w-3 h-3" />
                      {formatFileSize(song.size)}
                    </div>
                    <span className="text-xs bg-muted px-2 py-1 rounded">
                      {song.type.split('/')[1].toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handlePreviewToggle(song)
                  }}
                  className="h-8 w-8 p-0"
                >
                  {playingPreview === song.id ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </Button>

                <Button
                  variant={selectedSong?.id === song.id ? "default" : "outline"}
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleSongClick(song)
                  }}
                >
                  {selectedSong?.id === song.id ? 'Selected' : 'Select'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Summary */}
      <div className="text-sm text-muted-foreground text-center pt-4 border-t border-border">
        {songs.length} song{songs.length !== 1 ? 's' : ''} uploaded • 
        Total size: {formatFileSize(songs.reduce((total, song) => total + song.size, 0))}
      </div>
    </div>
  )
}

export default SongList


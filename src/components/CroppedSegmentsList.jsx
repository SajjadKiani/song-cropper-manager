import { useState } from 'react'
import { Play, Pause, Edit2, Trash2, Music, Clock, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent } from '@/components/ui/card.jsx'
import { Input } from '@/components/ui/input.jsx'
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog.jsx'

const CroppedSegmentsList = ({ segments, onSegmentDelete, onSegmentRename }) => {
  const [playingSegment, setPlayingSegment] = useState(null)
  const [editingSegment, setEditingSegment] = useState(null)
  const [editName, setEditName] = useState('')
  const [audioElements, setAudioElements] = useState({})

  const formatDuration = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handlePlayToggle = async (segment) => {
    if (playingSegment === segment.id) {
      // Stop current playback
      if (audioElements[segment.id]) {
        audioElements[segment.id].pause()
        audioElements[segment.id].currentTime = 0
      }
      setPlayingSegment(null)
    } else {
      // Stop any currently playing segment
      if (playingSegment && audioElements[playingSegment]) {
        audioElements[playingSegment].pause()
        audioElements[playingSegment].currentTime = 0
      }

      // Create or get audio element for this segment
      let audio = audioElements[segment.id]
      if (!audio) {
        // Create audio from the original song with time constraints
        audio = new Audio(segment.originalSong.url)
        audio.volume = 0.5
        
        audio.addEventListener('loadedmetadata', () => {
          audio.currentTime = segment.startTime
        })

        audio.addEventListener('timeupdate', () => {
          if (audio.currentTime >= segment.endTime) {
            audio.pause()
            audio.currentTime = segment.startTime
            setPlayingSegment(null)
          }
        })

        audio.addEventListener('ended', () => {
          setPlayingSegment(null)
        })

        setAudioElements(prev => ({ ...prev, [segment.id]: audio }))
      }

      // Set start time and play
      audio.currentTime = segment.startTime
      audio.play()
      setPlayingSegment(segment.id)
    }
  }

  const handleEditStart = (segment) => {
    setEditingSegment(segment.id)
    setEditName(segment.name)
  }

  const handleEditSave = () => {
    if (editName.trim() && editingSegment) {
      onSegmentRename(editingSegment, editName.trim())
    }
    setEditingSegment(null)
    setEditName('')
  }

  const handleEditCancel = () => {
    setEditingSegment(null)
    setEditName('')
  }

  const handleDelete = (segmentId) => {
    // Stop playback if this segment is playing
    if (playingSegment === segmentId && audioElements[segmentId]) {
      audioElements[segmentId].pause()
      setPlayingSegment(null)
    }
    
    // Clean up audio element
    if (audioElements[segmentId]) {
      audioElements[segmentId].src = ''
      setAudioElements(prev => {
        const newElements = { ...prev }
        delete newElements[segmentId]
        return newElements
      })
    }

    onSegmentDelete(segmentId)
  }

  if (segments.length === 0) {
    return (
      <div className="text-center py-12">
        <Music className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Cropped Segments</h3>
        <p className="text-muted-foreground">
          Create some cropped segments from your songs to see them here
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {segments.map((segment) => (
        <Card key={segment.id} className="transition-all duration-200 hover:shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              {/* Segment Info */}
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="flex items-center justify-center w-12 h-12 bg-secondary rounded-lg flex-shrink-0">
                  <Music className="w-6 h-6 text-secondary-foreground" />
                </div>
                
                <div className="flex-1 min-w-0">
                  {editingSegment === segment.id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="h-8"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleEditSave()
                          if (e.key === 'Escape') handleEditCancel()
                        }}
                        autoFocus
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleEditSave}
                        className="h-8 w-8 p-0"
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleEditCancel}
                        className="h-8 w-8 p-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <h4 className="font-semibold text-foreground truncate">
                        {segment.name}
                      </h4>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span>From: {segment.originalSong.name}</span>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDuration(segment.duration)}
                        </div>
                        <span className="text-xs">
                          {formatDuration(segment.startTime)} - {formatDuration(segment.endTime)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Actions */}
              {editingSegment !== segment.id && (
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePlayToggle(segment)}
                    className="h-8 w-8 p-0"
                  >
                    {playingSegment === segment.id ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditStart(segment)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Segment</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{segment.name}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(segment.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Summary */}
      <div className="text-sm text-muted-foreground text-center pt-4 border-t border-border">
        {segments.length} segment{segments.length !== 1 ? 's' : ''} saved • 
        Total duration: {formatDuration(segments.reduce((total, segment) => total + segment.duration, 0))}
      </div>
    </div>
  )
}

export default CroppedSegmentsList


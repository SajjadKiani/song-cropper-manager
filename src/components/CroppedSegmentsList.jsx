import { useState } from 'react'
import { Play, Pause, Edit2, Trash2, Music, Clock, Check, X, Tags, User, Disc } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent } from '@/components/ui/card.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.jsx'

const EMPTY_METADATA = { title: '', artist: '', album: '', year: '', genre: '' }

const CroppedSegmentsList = ({ segments, onSegmentDelete, onSegmentRename, onSegmentMetadataUpdate }) => {
  const [playingSegment, setPlayingSegment] = useState(null)
  const [editingSegment, setEditingSegment] = useState(null)
  const [editName, setEditName] = useState('')
  const [audioElements, setAudioElements] = useState({})
  const [metadataSegmentId, setMetadataSegmentId] = useState(null)
  const [metaForm, setMetaForm] = useState(EMPTY_METADATA)

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

  const handleMetadataOpen = (segment) => {
    setMetadataSegmentId(segment.id)
    setMetaForm({
      ...EMPTY_METADATA,
      ...(segment.metadata || {}),
      title: segment.metadata?.title?.trim() || segment.name,
    })
  }

  const handleMetadataFieldChange = (field, value) => {
    setMetaForm(prev => ({ ...prev, [field]: value }))
  }

  const handleMetadataSave = () => {
    if (metadataSegmentId == null) return
    onSegmentMetadataUpdate?.(metadataSegmentId, {
      title: metaForm.title.trim(),
      artist: metaForm.artist.trim(),
      album: metaForm.album.trim(),
      year: metaForm.year.trim(),
      genre: metaForm.genre.trim(),
    })
    setMetadataSegmentId(null)
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
                      <h4 className="font-semibold text-foreground truncate" dir="auto">
                        {segment.name}
                      </h4>
                      {(segment.metadata?.artist || segment.metadata?.album) && (
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-foreground/80 mt-1" dir="auto">
                          {segment.metadata?.artist && (
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {segment.metadata.artist}
                            </span>
                          )}
                          {segment.metadata?.album && (
                            <span className="flex items-center gap-1">
                              <Disc className="w-3 h-3" />
                              {segment.metadata.album}
                            </span>
                          )}
                        </div>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span dir="auto">From: {segment.originalSong.name}</span>
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
                    title="Rename"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMetadataOpen(segment)}
                    className="h-8 w-8 p-0"
                    title="Edit metadata"
                  >
                    <Tags className="w-4 h-4" />
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

      {/* Metadata Editor Dialog */}
      <Dialog open={metadataSegmentId != null} onOpenChange={(open) => !open && setMetadataSegmentId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Song Metadata</DialogTitle>
            <DialogDescription>
              These tags are written into the exported MP3 file. Persian and other
              non-Latin text is fully supported.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="meta-title">Title</Label>
              <Input
                id="meta-title"
                dir="auto"
                value={metaForm.title}
                onChange={(e) => handleMetadataFieldChange('title', e.target.value)}
                placeholder="عنوان آهنگ / Song title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="meta-artist">Artist</Label>
              <Input
                id="meta-artist"
                dir="auto"
                value={metaForm.artist}
                onChange={(e) => handleMetadataFieldChange('artist', e.target.value)}
                placeholder="خواننده / Artist"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="meta-album">Album</Label>
              <Input
                id="meta-album"
                dir="auto"
                value={metaForm.album}
                onChange={(e) => handleMetadataFieldChange('album', e.target.value)}
                placeholder="آلبوم / Album"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="meta-year">Year</Label>
                <Input
                  id="meta-year"
                  dir="auto"
                  value={metaForm.year}
                  onChange={(e) => handleMetadataFieldChange('year', e.target.value)}
                  placeholder="1403 / 2024"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="meta-genre">Genre</Label>
                <Input
                  id="meta-genre"
                  dir="auto"
                  value={metaForm.genre}
                  onChange={(e) => handleMetadataFieldChange('genre', e.target.value)}
                  placeholder="سبک / Genre"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setMetadataSegmentId(null)}>
              Cancel
            </Button>
            <Button onClick={handleMetadataSave}>
              <Check className="w-4 h-4 mr-2" />
              Save Metadata
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default CroppedSegmentsList


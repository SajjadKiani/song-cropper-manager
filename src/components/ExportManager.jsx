import { useState } from 'react'
import { Download, Package, CheckSquare, Square, Music, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent } from '@/components/ui/card.jsx'
import { Checkbox } from '@/components/ui/checkbox.jsx'
import { Alert, AlertDescription } from '@/components/ui/alert.jsx'
import { Progress } from '@/components/ui/progress.jsx'
import JSZip from 'jszip'
import { audioBufferToMp3Blob, cropAudioBuffer, generateSafeFilename } from '@/lib/audioUtils'

const MP3_BITRATE = 192

const ExportManager = ({ segments }) => {
  const [selectedSegments, setSelectedSegments] = useState([])
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [error, setError] = useState(null)

  const formatDuration = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleSegmentToggle = (segmentId) => {
    setSelectedSegments(prev => 
      prev.includes(segmentId)
        ? prev.filter(id => id !== segmentId)
        : [...prev, segmentId]
    )
  }

  const handleSelectAll = () => {
    if (selectedSegments.length === segments.length) {
      setSelectedSegments([])
    } else {
      setSelectedSegments(segments.map(seg => seg.id))
    }
  }

  const handleExport = async () => {
    if (selectedSegments.length === 0) {
      setError('Please select at least one segment to export.')
      return
    }

    setIsExporting(true)
    setExportProgress(0)
    setError(null)

    try {
      const zip = new JSZip()
      const audioContext = new AudioContext()
      const segmentsToExport = segments.filter(seg => selectedSegments.includes(seg.id))
      const usedNames = new Set()

      for (let i = 0; i < segmentsToExport.length; i++) {
        const segment = segmentsToExport[i]
        setExportProgress((i / segmentsToExport.length) * 90)

        try {
          // Fetch the original audio file
          const response = await fetch(segment.originalSong.url)
          const arrayBuffer = await response.arrayBuffer()

          // Decode audio data
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

          // Crop the audio buffer
          const croppedBuffer = cropAudioBuffer(
            audioBuffer,
            segment.startTime,
            segment.endTime,
            audioBuffer.sampleRate
          )

          // Build ID3 metadata (title falls back to the segment name)
          const metadata = {
            title: segment.metadata?.title?.trim() || segment.name,
            artist: segment.metadata?.artist,
            album: segment.metadata?.album,
            year: segment.metadata?.year,
            genre: segment.metadata?.genre,
          }

          // Encode to MP3 with embedded tags
          const mp3Blob = audioBufferToMp3Blob(croppedBuffer, metadata, MP3_BITRATE)

          // Add to ZIP with a Unicode-safe, unique filename (preserves Persian)
          let safeFilename = generateSafeFilename(segment.name)
          let candidate = safeFilename
          let counter = 1
          while (usedNames.has(candidate)) {
            candidate = `${safeFilename}_${counter++}`
          }
          usedNames.add(candidate)
          zip.file(`${candidate}.mp3`, mp3Blob)

        } catch (segmentError) {
          console.error(`Error processing segment ${segment.name}:`, segmentError)
          // Continue with other segments
        }
      }

      setExportProgress(95)

      // Generate ZIP file
      const zipBlob = await zip.generateAsync({ type: 'blob' })
      
      setExportProgress(100)

      // Download the ZIP file
      const url = URL.createObjectURL(zipBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `cropped_segments_${new Date().toISOString().split('T')[0]}.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      // Reset state
      setTimeout(() => {
        setIsExporting(false)
        setExportProgress(0)
      }, 1000)

    } catch (err) {
      console.error('Export error:', err)
      setError('Failed to export segments. Please try again.')
      setIsExporting(false)
      setExportProgress(0)
    }
  }

  if (segments.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Segments to Export</h3>
        <p className="text-muted-foreground">
          Create some cropped segments first to export them as a ZIP file
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Selection Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectAll}
            className="flex items-center gap-2"
          >
            {selectedSegments.length === segments.length ? (
              <CheckSquare className="w-4 h-4" />
            ) : (
              <Square className="w-4 h-4" />
            )}
            {selectedSegments.length === segments.length ? 'Deselect All' : 'Select All'}
          </Button>
          <span className="text-sm text-muted-foreground">
            {selectedSegments.length} of {segments.length} selected
          </span>
        </div>

        <Button
          onClick={handleExport}
          disabled={selectedSegments.length === 0 || isExporting}
          className="flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          {isExporting ? 'Exporting...' : 'Export MP3 ZIP'}
        </Button>
      </div>

      {/* Progress Bar */}
      {isExporting && (
        <div className="space-y-2">
          <Progress value={exportProgress} className="w-full" />
          <p className="text-sm text-muted-foreground text-center">
            Processing segments... {Math.round(exportProgress)}%
          </p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Segment List */}
      <div className="space-y-3">
        {segments.map((segment) => (
          <Card 
            key={segment.id}
            className={`
              transition-all duration-200 cursor-pointer
              ${selectedSegments.includes(segment.id) 
                ? 'ring-2 ring-primary bg-primary/5' 
                : 'hover:bg-muted/50'
              }
            `}
            onClick={() => handleSegmentToggle(segment.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Checkbox
                  checked={selectedSegments.includes(segment.id)}
                  onCheckedChange={() => handleSegmentToggle(segment.id)}
                  onClick={(e) => e.stopPropagation()}
                />

                <div className="flex items-center justify-center w-10 h-10 bg-secondary rounded-lg flex-shrink-0">
                  <Music className="w-5 h-5 text-secondary-foreground" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-foreground truncate" dir="auto">
                    {segment.metadata?.title?.trim() || segment.name}
                  </h4>
                  <div className="flex flex-wrap items-center gap-x-4 text-sm text-muted-foreground" dir="auto">
                    {segment.metadata?.artist && <span>{segment.metadata.artist}</span>}
                    <span>From: {segment.originalSong.name}</span>
                    <span>Duration: {formatDuration(segment.duration)}</span>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground truncate max-w-[40%]" dir="auto">
                  {generateSafeFilename(segment.name)}.mp3
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Export Info */}
      <div className="text-sm text-muted-foreground space-y-1 p-4 bg-muted/30 rounded-lg">
        <p><strong>Export Format:</strong> MP3 files ({MP3_BITRATE} kbps) in a ZIP archive</p>
        <p><strong>Metadata:</strong> Title, artist, album, year and genre are embedded as ID3 tags (UTF-16, Persian supported)</p>
        <p><strong>File Naming:</strong> Persian and other Unicode characters are preserved in file names</p>
        {selectedSegments.length > 0 && (
          <p><strong>Selected Duration:</strong> {formatDuration(
            segments
              .filter(seg => selectedSegments.includes(seg.id))
              .reduce((total, seg) => total + seg.duration, 0)
          )}</p>
        )}
      </div>
    </div>
  )
}

export default ExportManager


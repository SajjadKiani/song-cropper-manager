import { useState } from 'react'
import { Download, Package, CheckSquare, Square, Music, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent } from '@/components/ui/card.jsx'
import { Checkbox } from '@/components/ui/checkbox.jsx'
import { Alert, AlertDescription } from '@/components/ui/alert.jsx'
import { Progress } from '@/components/ui/progress.jsx'
import JSZip from 'jszip'

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

  const cropAudioBuffer = async (audioBuffer, startTime, endTime, sampleRate) => {
    const startSample = Math.floor(startTime * sampleRate)
    const endSample = Math.floor(endTime * sampleRate)
    const length = endSample - startSample
    
    const numberOfChannels = audioBuffer.numberOfChannels
    const croppedBuffer = new AudioContext().createBuffer(numberOfChannels, length, sampleRate)
    
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel)
      const croppedChannelData = croppedBuffer.getChannelData(channel)
      
      for (let i = 0; i < length; i++) {
        croppedChannelData[i] = channelData[startSample + i]
      }
    }
    
    return croppedBuffer
  }

  const audioBufferToWav = (audioBuffer) => {
    const numberOfChannels = audioBuffer.numberOfChannels
    const sampleRate = audioBuffer.sampleRate
    const length = audioBuffer.length
    
    const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2)
    const view = new DataView(arrayBuffer)
    
    // WAV header
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i))
      }
    }
    
    writeString(0, 'RIFF')
    view.setUint32(4, 36 + length * numberOfChannels * 2, true)
    writeString(8, 'WAVE')
    writeString(12, 'fmt ')
    view.setUint32(16, 16, true)
    view.setUint16(20, 1, true)
    view.setUint16(22, numberOfChannels, true)
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, sampleRate * numberOfChannels * 2, true)
    view.setUint16(32, numberOfChannels * 2, true)
    view.setUint16(34, 16, true)
    writeString(36, 'data')
    view.setUint32(40, length * numberOfChannels * 2, true)
    
    // Convert audio data
    let offset = 44
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, audioBuffer.getChannelData(channel)[i]))
        view.setInt16(offset, sample * 0x7FFF, true)
        offset += 2
      }
    }
    
    return arrayBuffer
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
          const croppedBuffer = await cropAudioBuffer(
            audioBuffer, 
            segment.startTime, 
            segment.endTime, 
            audioBuffer.sampleRate
          )
          
          // Convert to WAV
          const wavArrayBuffer = audioBufferToWav(croppedBuffer)
          
          // Add to ZIP with safe filename
          const safeFilename = segment.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()
          zip.file(`${safeFilename}.wav`, wavArrayBuffer)
          
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
          {isExporting ? 'Exporting...' : 'Export ZIP'}
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
                  <h4 className="font-semibold text-foreground truncate">
                    {segment.name}
                  </h4>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>From: {segment.originalSong.name}</span>
                    <span>Duration: {formatDuration(segment.duration)}</span>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
                  {segment.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.wav
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Export Info */}
      <div className="text-sm text-muted-foreground space-y-1 p-4 bg-muted/30 rounded-lg">
        <p><strong>Export Format:</strong> WAV files in ZIP archive</p>
        <p><strong>File Naming:</strong> Segment names will be sanitized for file system compatibility</p>
        <p><strong>Quality:</strong> Original audio quality preserved</p>
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


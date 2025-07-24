import { useState, useCallback, useRef } from 'react'
import { Upload, File, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import { Alert, AlertDescription } from '@/components/ui/alert.jsx'

const ACCEPTED_AUDIO_TYPES = [
  'audio/mpeg',
  'audio/wav',
  'audio/mp3',
  'audio/ogg',
  'audio/aac',
  'audio/m4a'
]

const MAX_FILE_SIZE = 50 * 1024 * 1024 * 20 // 50MB

const FileUpload = ({ onSongUpload }) => {
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)

  const validateFile = (file) => {
    if (!ACCEPTED_AUDIO_TYPES.includes(file.type)) {
      return `File type "${file.type}" is not supported. Please upload MP3, WAV, OGG, AAC, or M4A files.`
    }
    
    if (file.size > MAX_FILE_SIZE) {
      return `File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds the maximum limit of 1GB.`
    }
    
    return null
  }

  const processFiles = useCallback(async (files) => {
    setIsUploading(true)
    setError(null)
    
    const validFiles = []
    const errors = []

    for (const file of files) {
      const validationError = validateFile(file)
      if (validationError) {
        errors.push(`${file.name}: ${validationError}`)
      } else {
        validFiles.push(file)
      }
    }

    if (errors.length > 0) {
      setError(errors.join('\n'))
    }

    if (validFiles.length > 0) {
      try {
        const processedSongs = await Promise.all(
          validFiles.map(async (file) => {
            const url = URL.createObjectURL(file)
            
            // Create audio element to get duration
            const audio = new Audio()
            audio.src = url
            
            return new Promise((resolve) => {
              audio.addEventListener('loadedmetadata', () => {
                resolve({
                  id: Date.now() + Math.random(),
                  name: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
                  file: file,
                  url: url,
                  duration: audio.duration,
                  size: file.size,
                  type: file.type
                })
              })
              
              audio.addEventListener('error', () => {
                resolve({
                  id: Date.now() + Math.random(),
                  name: file.name.replace(/\.[^/.]+$/, ''),
                  file: file,
                  url: url,
                  duration: 0,
                  size: file.size,
                  type: file.type
                })
              })
            })
          })
        )

        onSongUpload(processedSongs)
      } catch (err) {
        setError('Failed to process audio files. Please try again.')
      }
    }

    setIsUploading(false)
  }, [onSongUpload])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      processFiles(files)
    }
  }, [processFiles])

  const handleFileSelect = useCallback((e) => {
    const files = Array.from(e.target.files)
    if (files.length > 0) {
      processFiles(files)
    }
    // Reset input value to allow selecting the same file again
    e.target.value = ''
  }, [processFiles])

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-4">
      {/* Drag and Drop Area */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${isDragOver 
            ? 'border-primary bg-primary/5' 
            : 'border-border hover:border-primary/50'
          }
          ${isUploading ? 'opacity-50 pointer-events-none' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center justify-center w-16 h-16 bg-muted rounded-full">
            <Upload className="w-8 h-8 text-muted-foreground" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">
              {isUploading ? 'Processing files...' : 'Drop your audio files here'}
            </h3>
            <p className="text-muted-foreground">
              or click the button below to browse files
            </p>
            <p className="text-sm text-muted-foreground">
              Supports MP3, WAV, OGG, AAC, M4A (max 1GB each)
            </p>
          </div>

          <Button 
            onClick={handleButtonClick}
            disabled={isUploading}
            className="mt-4"
          >
            <File className="w-4 h-4 mr-2" />
            {isUploading ? 'Processing...' : 'Browse Files'}
          </Button>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={ACCEPTED_AUDIO_TYPES.join(',')}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="whitespace-pre-line">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* File Type Info */}
      <div className="text-sm text-muted-foreground space-y-1">
        <p><strong>Supported formats:</strong> MP3, WAV, OGG, AAC, M4A</p>
        <p><strong>Maximum file size:</strong> 1GB per file</p>
        <p><strong>Multiple files:</strong> You can upload multiple files at once</p>
      </div>
    </div>
  )
}

export default FileUpload


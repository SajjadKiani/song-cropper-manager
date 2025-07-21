// Audio utility functions for performance optimization

/**
 * Debounce function to limit the rate of function calls
 */
export const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * Throttle function to limit function execution frequency
 */
export const throttle = (func, limit) => {
  let inThrottle
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

/**
 * Format file size in human readable format
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Format time duration in MM:SS format
 */
export const formatDuration = (seconds) => {
  if (!seconds || isNaN(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

/**
 * Validate audio file type and size
 */
export const validateAudioFile = (file, maxSize = 50 * 1024 * 1024) => {
  const acceptedTypes = [
    'audio/mpeg',
    'audio/wav', 
    'audio/mp3',
    'audio/ogg',
    'audio/aac',
    'audio/m4a'
  ]

  if (!acceptedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type "${file.type}" is not supported. Please upload MP3, WAV, OGG, AAC, or M4A files.`
    }
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size (${formatFileSize(file.size)}) exceeds the maximum limit of ${formatFileSize(maxSize)}.`
    }
  }

  return { valid: true }
}

/**
 * Create audio buffer from file with error handling
 */
export const createAudioBuffer = async (file) => {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
    return { audioBuffer, audioContext }
  } catch (error) {
    throw new Error(`Failed to decode audio file: ${error.message}`)
  }
}

/**
 * Crop audio buffer to specified time range
 */
export const cropAudioBuffer = (audioBuffer, startTime, endTime, sampleRate) => {
  const startSample = Math.floor(startTime * sampleRate)
  const endSample = Math.floor(endTime * sampleRate)
  const length = endSample - startSample
  
  if (length <= 0) {
    throw new Error('Invalid time range for cropping')
  }

  const numberOfChannels = audioBuffer.numberOfChannels
  const audioContext = new (window.AudioContext || window.webkitAudioContext)()
  const croppedBuffer = audioContext.createBuffer(numberOfChannels, length, sampleRate)
  
  for (let channel = 0; channel < numberOfChannels; channel++) {
    const channelData = audioBuffer.getChannelData(channel)
    const croppedChannelData = croppedBuffer.getChannelData(channel)
    
    for (let i = 0; i < length; i++) {
      croppedChannelData[i] = channelData[startSample + i] || 0
    }
  }
  
  return croppedBuffer
}

/**
 * Convert audio buffer to WAV format
 */
export const audioBufferToWav = (audioBuffer) => {
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

/**
 * Generate safe filename from string
 */
export const generateSafeFilename = (name) => {
  return name
    .replace(/[^a-z0-9\s-_]/gi, '') // Remove special characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .toLowerCase()
    .substring(0, 50) // Limit length
}

/**
 * Download blob as file
 */
export const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Memory cleanup for audio elements
 */
export const cleanupAudioElement = (audio) => {
  if (audio) {
    audio.pause()
    audio.src = ''
    audio.load()
  }
}

/**
 * Check if Web Audio API is supported
 */
export const isWebAudioSupported = () => {
  return !!(window.AudioContext || window.webkitAudioContext)
}

/**
 * Get audio file metadata
 */
export const getAudioMetadata = (file) => {
  return new Promise((resolve) => {
    const audio = new Audio()
    const url = URL.createObjectURL(file)
    
    audio.addEventListener('loadedmetadata', () => {
      resolve({
        duration: audio.duration,
        hasMetadata: true
      })
      URL.revokeObjectURL(url)
    })
    
    audio.addEventListener('error', () => {
      resolve({
        duration: 0,
        hasMetadata: false
      })
      URL.revokeObjectURL(url)
    })
    
    audio.src = url
  })
}


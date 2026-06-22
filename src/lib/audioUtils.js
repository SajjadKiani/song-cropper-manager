// Audio utility functions for performance optimization

import { Mp3Encoder } from '@breezystack/lamejs'

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
 * Convert a Float32 PCM channel to Int16 PCM (required by the MP3 encoder)
 */
const floatTo16BitPCM = (input) => {
  const output = new Int16Array(input.length)
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]))
    output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF
  }
  return output
}

/**
 * Encode an AudioBuffer to MP3. Returns an array of Uint8Array chunks.
 * Supports mono and stereo; extra channels are ignored.
 */
export const audioBufferToMp3 = (audioBuffer, bitRate = 192) => {
  const channels = Math.min(audioBuffer.numberOfChannels, 2)
  const sampleRate = audioBuffer.sampleRate
  const encoder = new Mp3Encoder(channels, sampleRate, bitRate)

  const left = floatTo16BitPCM(audioBuffer.getChannelData(0))
  const right = channels > 1 ? floatTo16BitPCM(audioBuffer.getChannelData(1)) : null

  const blockSize = 1152
  const mp3Data = []

  for (let i = 0; i < left.length; i += blockSize) {
    const leftChunk = left.subarray(i, i + blockSize)
    let mp3buf
    if (channels > 1) {
      const rightChunk = right.subarray(i, i + blockSize)
      mp3buf = encoder.encodeBuffer(leftChunk, rightChunk)
    } else {
      mp3buf = encoder.encodeBuffer(leftChunk)
    }
    if (mp3buf.length > 0) mp3Data.push(new Uint8Array(mp3buf))
  }

  const end = encoder.flush()
  if (end.length > 0) mp3Data.push(new Uint8Array(end))

  return mp3Data
}

/**
 * Encode a UTF-16LE byte sequence (with BOM) for an ID3 text frame.
 * UTF-16 is required so non-Latin scripts (e.g. Persian) survive intact.
 */
const encodeUtf16WithBom = (str) => {
  const bytes = [0xFF, 0xFE] // UTF-16LE byte order mark
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i)
    bytes.push(code & 0xFF, (code >> 8) & 0xFF)
  }
  return bytes
}

/**
 * Build a single ID3v2.3 text frame (encoding byte 0x01 = UTF-16 w/ BOM)
 */
const buildTextFrame = (id, text) => {
  const value = (text ?? '').toString().trim()
  if (!value) return []

  const data = [0x01, ...encodeUtf16WithBom(value)] // 0x01 = UTF-16 encoding
  const size = data.length
  const frame = []
  for (let i = 0; i < 4; i++) frame.push(id.charCodeAt(i))
  // Frame size: 32-bit big-endian (ID3v2.3 frame sizes are not synchsafe)
  frame.push((size >> 24) & 0xFF, (size >> 16) & 0xFF, (size >> 8) & 0xFF, size & 0xFF)
  frame.push(0x00, 0x00) // flags
  return frame.concat(data)
}

/**
 * Build an ID3v2.3 tag (Uint8Array) from metadata. Returns an empty array
 * when no metadata is present so nothing is prepended.
 * metadata: { title, artist, album, year, genre }
 */
export const buildId3v2Tag = (metadata = {}) => {
  const frames = [
    ...buildTextFrame('TIT2', metadata.title),
    ...buildTextFrame('TPE1', metadata.artist),
    ...buildTextFrame('TALB', metadata.album),
    ...buildTextFrame('TYER', metadata.year),
    ...buildTextFrame('TCON', metadata.genre),
  ]

  if (frames.length === 0) return new Uint8Array(0)

  const size = frames.length
  // Tag size is a synchsafe 28-bit integer (7 bits per byte)
  const synchsafe = [
    (size >> 21) & 0x7F,
    (size >> 14) & 0x7F,
    (size >> 7) & 0x7F,
    size & 0x7F,
  ]
  const header = [0x49, 0x44, 0x33, 0x03, 0x00, 0x00, ...synchsafe] // "ID3" v2.3, no flags
  return new Uint8Array([...header, ...frames])
}

/**
 * Encode an AudioBuffer to a tagged MP3 Blob.
 * metadata: { title, artist, album, year, genre }
 */
export const audioBufferToMp3Blob = (audioBuffer, metadata = {}, bitRate = 192) => {
  const tag = buildId3v2Tag(metadata)
  const mp3Data = audioBufferToMp3(audioBuffer, bitRate)
  const parts = tag.length > 0 ? [tag, ...mp3Data] : mp3Data
  return new Blob(parts, { type: 'audio/mpeg' })
}

/**
 * Generate safe filename from string. Preserves Unicode letters (e.g. Persian)
 * and only strips characters that are illegal in file systems.
 */
export const generateSafeFilename = (name) => {
  const cleaned = (name ?? '')
    .toString()
    .replace(/[/\\:*?"<>|]/g, '') // remove filesystem-illegal characters
    .replace(/[ -]/g, '') // remove control characters
    .replace(/\s+/g, '_') // collapse whitespace to underscores
    .replace(/_+/g, '_') // collapse repeated underscores
    .replace(/^[._]+|[._]+$/g, '') // trim leading/trailing dots/underscores
    .substring(0, 100) // limit length
  return cleaned || 'segment'
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


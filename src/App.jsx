import { useState, useCallback } from 'react'
import { Upload, Music, Scissors, Download } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { useKeyboardShortcuts, createDefaultShortcuts } from './hooks/useKeyboardShortcuts'
import './App.css'

// Component imports
import FileUpload from './components/FileUpload'
import SongList from './components/SongList'
import AudioPlayer from './components/AudioPlayer'
import WaveformCropper from './components/WaveformCropper'
import CroppedSegmentsList from './components/CroppedSegmentsList'
import ExportManager from './components/ExportManager'
import HelpDialog from './components/HelpDialog'

function App() {
  // Global state management
  const [songs, setSongs] = useState([])
  const [selectedSong, setSelectedSong] = useState(null)
  const [croppedSegments, setCroppedSegments] = useState([])
  const [activeTab, setActiveTab] = useState('upload')

  // Song management functions
  const handleSongUpload = useCallback((newSongs) => {
    setSongs(prev => [...prev, ...newSongs])
  }, [])

  const handleSongSelect = useCallback((song) => {
    setSelectedSong(song)
    setActiveTab('crop')
  }, [])

  const handleSegmentSave = useCallback((segment) => {
    setCroppedSegments(prev => [...prev, segment])
  }, [])

  const handleSegmentDelete = useCallback((segmentId) => {
    setCroppedSegments(prev => prev.filter(seg => seg.id !== segmentId))
  }, [])

  const handleSegmentRename = useCallback((segmentId, newName) => {
    setCroppedSegments(prev => 
      prev.map(seg => seg.id === segmentId ? { ...seg, name: newName } : seg)
    )
  }, [])

  // Keyboard shortcuts
  const shortcuts = createDefaultShortcuts({
    onPlayPause: () => {
      // This will be handled by individual components
    },
    onStop: () => {
      // This will be handled by individual components
    },
    onSave: () => {
      if (activeTab === 'crop') {
        // This will be handled by WaveformCropper component
      }
    },
    onExport: () => {
      if (activeTab === 'export') {
        // This will be handled by ExportManager component
      }
    },
    onTabChange: setActiveTab
  })

  useKeyboardShortcuts(shortcuts)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="md:flex items-center gap-3 hidden">
              <div className="flex items-center justify-center w-12 h-12 bg-primary rounded-lg">
                <Scissors className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Song Cropper & Manager</h1>
                <p className="text-muted-foreground">Upload, crop, and manage your audio segments</p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-3 md:hidden">
              <div className='flex items-center gap-3'>
                <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-lg">
                  <Scissors className="w-6 h-6 text-primary-foreground" />
                </div>
                <h1 className="text-xl font-bold text-foreground">Song Cropper & Manager</h1>
              </div>
              <div>
                <p className="text-muted-foreground">Upload, crop, and manage your audio segments</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <HelpDialog />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="crop" className="flex items-center gap-2">
              <Scissors className="w-4 h-4" />
              Crop
            </TabsTrigger>
            <TabsTrigger value="manage" className="flex items-center gap-2">
              <Music className="w-4 h-4" />
              Manage
            </TabsTrigger>
            <TabsTrigger value="export" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </TabsTrigger>
          </TabsList>

          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Upload Audio Files</CardTitle>
              </CardHeader>
              <CardContent>
                <FileUpload onSongUpload={handleSongUpload} />
              </CardContent>
            </Card>

            {songs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Your Songs ({songs.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <SongList 
                    songs={songs} 
                    onSongSelect={handleSongSelect}
                    selectedSong={selectedSong}
                  />
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Crop Tab */}
          <TabsContent value="crop" className="space-y-6">
            {selectedSong ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Audio Player</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <AudioPlayer song={selectedSong} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Waveform & Cropping</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <WaveformCropper 
                      song={selectedSong}
                      onSegmentSave={handleSegmentSave}
                    />
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Music className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Song Selected</h3>
                  <p className="text-muted-foreground mb-4">
                    Please select a song from the upload tab to start cropping
                  </p>
                  <Button onClick={() => setActiveTab('upload')}>
                    Go to Upload
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Manage Tab */}
          <TabsContent value="manage" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Cropped Segments ({croppedSegments.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <CroppedSegmentsList 
                  segments={croppedSegments}
                  onSegmentDelete={handleSegmentDelete}
                  onSegmentRename={handleSegmentRename}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Export Tab */}
          <TabsContent value="export" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Export to ZIP</CardTitle>
              </CardHeader>
              <CardContent>
                <ExportManager segments={croppedSegments} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

export default App


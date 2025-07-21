import { HelpCircle, Keyboard } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog.jsx'
import { Badge } from '@/components/ui/badge.jsx'

const HelpDialog = () => {
  const shortcuts = [
    {
      category: 'Navigation',
      items: [
        { keys: ['1'], description: 'Go to Upload tab' },
        { keys: ['2'], description: 'Go to Crop tab' },
        { keys: ['3'], description: 'Go to Manage tab' },
        { keys: ['4'], description: 'Go to Export tab' },
      ]
    },
    {
      category: 'Playback Controls',
      items: [
        { keys: ['Space'], description: 'Play/Pause audio' },
        { keys: ['Esc'], description: 'Stop playback' },
        { keys: ['←'], description: 'Seek backward 5s' },
        { keys: ['→'], description: 'Seek forward 5s' },
        { keys: ['↑'], description: 'Volume up' },
        { keys: ['↓'], description: 'Volume down' },
        { keys: ['M'], description: 'Toggle mute' },
      ]
    },
    {
      category: 'Waveform Controls',
      items: [
        { keys: ['Home'], description: 'Go to beginning' },
        { keys: ['End'], description: 'Go to end' },
        { keys: ['Ctrl', 'Enter'], description: 'Save current segment' },
      ]
    },
    {
      category: 'Quick Actions',
      items: [
        { keys: ['Ctrl', 'S'], description: 'Save segment' },
        { keys: ['Ctrl', 'E'], description: 'Export segments' },
        { keys: ['Ctrl', 'Shift', 'U'], description: 'Quick upload' },
        { keys: ['Ctrl', 'Shift', 'C'], description: 'Quick crop' },
        { keys: ['Ctrl', 'Shift', 'M'], description: 'Quick manage' },
        { keys: ['Ctrl', 'Shift', 'X'], description: 'Quick export' },
      ]
    }
  ]

  const KeyBadge = ({ keys }) => (
    <div className="flex items-center gap-1">
      {keys.map((key, index) => (
        <span key={index} className="flex items-center gap-1">
          {index > 0 && <span className="text-muted-foreground">+</span>}
          <Badge variant="outline" className="font-mono text-xs px-2 py-1">
            {key}
          </Badge>
        </span>
      ))}
    </div>
  )

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4" />
          Help
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="w-5 h-5" />
            Keyboard Shortcuts & Help
          </DialogTitle>
          <DialogDescription>
            Use these keyboard shortcuts to navigate and control the application more efficiently.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {shortcuts.map((category) => (
            <div key={category.category} className="space-y-3">
              <h3 className="font-semibold text-lg border-b border-border pb-2">
                {category.category}
              </h3>
              <div className="space-y-2">
                {category.items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between py-2">
                    <span className="text-sm">{item.description}</span>
                    <KeyBadge keys={item.keys} />
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="space-y-3 pt-4 border-t border-border">
            <h3 className="font-semibold text-lg">Tips</h3>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>• Keyboard shortcuts work when not typing in input fields</p>
              <p>• Use drag and drop to upload multiple audio files at once</p>
              <p>• Click and drag on the waveform to select audio segments</p>
              <p>• Preview mode plays only the selected segment</p>
              <p>• Export creates WAV files in a ZIP archive</p>
              <p>• All processing happens in your browser - no data is sent to servers</p>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-border">
            <h3 className="font-semibold text-lg">Supported Formats</h3>
            <div className="flex flex-wrap gap-2">
              {['MP3', 'WAV', 'OGG', 'AAC', 'M4A'].map((format) => (
                <Badge key={format} variant="secondary">
                  {format}
                </Badge>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Maximum file size: 50MB per file
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default HelpDialog


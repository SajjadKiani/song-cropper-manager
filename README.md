# Song Cropper & Manager

A complete React.js web-based audio management application that allows users to upload audio files, visualize waveforms, crop specific segments, and export them as a ZIP file.

## 🚀 Live Demo

**[Try the application here: https://dspveqym.manus.space](https://dspveqym.manus.space)**

## ✨ Features

### Core Functionality
- **Audio Upload**: Drag-and-drop or browse to upload multiple audio files
- **File Validation**: Supports MP3, WAV, OGG, AAC, M4A formats (max 50MB each)
- **Waveform Visualization**: Interactive waveform display using WaveSurfer.js
- **Audio Cropping**: Select and crop specific segments from audio files
- **Segment Manageme44nt**: Save, rename, delete, and preview cropped segments
- **ZIP Export**: Export selected segments as WAV files in a ZIP archive

### User Experience
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Keyboard Shortcuts**: Comprehensive keyboard navigation and controls
- **Help System**: Built-in help dialog with shortcuts and tips
- **Real-time Preview**: Play cropped segments before saving
- **Progress Tracking**: Visual feedback during processing and export

### Technical Features
- **Client-side Processing**: All audio processing happens in the browser
- **No Server Dependencies**: Complete privacy - no data sent to servers
- **Modern UI**: Built with Tailwind CSS and shadcn/ui components
- **Performance Optimized**: Efficient handling of large audio files
- **Accessibility**: Keyboard navigation and screen reader support

## 🎹 Keyboard Shortcuts

### Navigation
- `1` - Go to Upload tab
- `2` - Go to Crop tab  
- `3` - Go to Manage tab
- `4` - Go to Export tab

### Playback Controls
- `Space` - Play/Pause audio
- `Esc` - Stop playback
- `←` - Seek backward 5 seconds
- `→` - Seek forward 5 seconds
- `↑` - Volume up
- `↓` - Volume down
- `M` - Toggle mute

### Waveform Controls
- `Home` - Go to beginning
- `End` - Go to end
- `Ctrl + Enter` - Save current segment

### Quick Actions
- `Ctrl + S` - Save segment
- `Ctrl + E` - Export segments
- `Ctrl + Shift + U` - Quick upload
- `Ctrl + Shift + C` - Quick crop
- `Ctrl + Shift + M` - Quick manage
- `Ctrl + Shift + X` - Quick export

## 🛠️ Technology Stack

- **Frontend Framework**: React.js with functional components and hooks
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Audio Processing**: Web Audio API with WaveSurfer.js for visualization
- **File Handling**: JSZip for ZIP file generation
- **Icons**: Lucide React icons
- **Build Tool**: Vite
- **Package Manager**: pnpm

## 📁 Project Structure

```
song-cropper-manager/
├── public/                 # Static assets
├── src/
│   ├── components/        # React components
│   │   ├── ui/           # shadcn/ui components
│   │   ├── AudioPlayer.jsx
│   │   ├── CroppedSegmentsList.jsx
│   │   ├── ExportManager.jsx
│   │   ├── FileUpload.jsx
│   │   ├── HelpDialog.jsx
│   │   ├── SongList.jsx
│   │   └── WaveformCropper.jsx
│   ├── hooks/            # Custom React hooks
│   │   └── useKeyboardShortcuts.js
│   ├── lib/              # Utility functions
│   │   └── audioUtils.js
│   ├── App.jsx           # Main application component
│   ├── App.css           # Application styles
│   └── main.jsx          # Application entry point
├── package.json          # Dependencies and scripts
└── README.md            # This file
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- pnpm (recommended) or npm

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd song-cropper-manager
```

2. Install dependencies:
```bash
pnpm install
```

3. Start the development server:
```bash
pnpm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Building for Production

```bash
pnpm run build
```

The built files will be in the `dist/` directory.

## 📖 How to Use

1. **Upload Audio Files**
   - Go to the Upload tab
   - Drag and drop audio files or click "Browse Files"
   - Supported formats: MP3, WAV, OGG, AAC, M4A (max 50MB each)

2. **Select a Song**
   - Click on any uploaded song to select it
   - This will automatically navigate to the Crop tab

3. **Crop Audio Segments**
   - View the interactive waveform
   - Drag the selection area to choose your segment
   - Resize by dragging the edges
   - Use "Preview Mode" to play only the selected segment
   - Enter a name and click "Save Segment"

4. **Manage Segments**
   - Go to the Manage tab to view all saved segments
   - Play, rename, or delete segments as needed

5. **Export to ZIP**
   - Go to the Export tab
   - Select the segments you want to export
   - Click "Export ZIP" to download a ZIP file containing WAV files

## 🔧 Configuration

The application includes several configurable options in the source code:

- **Maximum file size**: Adjust `MAX_FILE_SIZE` in `FileUpload.jsx`
- **Accepted audio types**: Modify `ACCEPTED_AUDIO_TYPES` array
- **Waveform appearance**: Customize colors and settings in `WaveformCropper.jsx`
- **Keyboard shortcuts**: Add or modify shortcuts in `useKeyboardShortcuts.js`

## 🎨 Customization

The application uses Tailwind CSS for styling, making it easy to customize:

- **Colors**: Modify the color palette in `App.css`
- **Layout**: Adjust spacing and sizing using Tailwind classes
- **Components**: Customize shadcn/ui components in `src/components/ui/`

## 🔒 Privacy & Security

- **Client-side Processing**: All audio processing happens in your browser
- **No Data Upload**: Audio files never leave your device
- **No Tracking**: No analytics or user tracking
- **Local Storage**: Segments are stored temporarily in browser memory

## 🐛 Troubleshooting

### Common Issues

1. **Audio not loading**
   - Check if the file format is supported
   - Ensure file size is under 50MB
   - Try refreshing the page

2. **Waveform not displaying**
   - Check browser compatibility (modern browsers required)
   - Ensure JavaScript is enabled
   - Try a different audio file

3. **Export not working**
   - Check if you have segments saved
   - Ensure browser supports file downloads
   - Try with a smaller number of segments

### Browser Compatibility

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## 📞 Support

If you encounter any issues or have questions, please create an issue in the repository.

---

**Made with ❤️ using React.js, Tailwind CSS, and modern web technologies.**


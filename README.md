# Multi-Pitch Assistant

A mobile application for tracking and analyzing multi-pitch climbing sessions using real-time altitude monitoring and event classification.

![Android](https://img.shields.io/badge/Android-3DDC84?style=for-the-badge&logo=android&logoColor=white)
![Ionic](https://img.shields.io/badge/Ionic-%233880FF.svg?style=for-the-badge&logo=Ionic&logoColor=white)
![Angular](https://img.shields.io/badge/angular-%23DD0031.svg?style=for-the-badge&logo=angular&logoColor=white)
![SQLite](https://img.shields.io/badge/sqlite-%2307405e.svg?style=for-the-badge&logo=sqlite&logoColor=white)
![Jasmine](https://img.shields.io/badge/jasmine-%238A4182.svg?style=for-the-badge&logo=jasmine&logoColor=white)

## 📱 Overview

Multi-Pitch Assistant is an Ionic/Angular mobile application that helps climbers track their climbing sessions with automatic event detection. The app uses the device's barometer to monitor altitude changes and intelligently classifies climbing events such as falls, rests, and pitch changes.

### Key Features

- **Real-time Altitude Monitoring**: Uses device barometer for precise altitude tracking
- **Automatic Event Classification**: Detects falls, rests, retreats, and pitch changes
- **Session Management**: Start, track, and end climbing sessions
- **Event Logging**: Manual note-taking during sessions
- **Session History**: View and analyze past climbing sessions
- **Location Tracking**: GPS coordinates for session locations
- **Cross-platform**: Built with Ionic for Android and iOS compatibility

## 🏗️ Architecture

- **Framework**: Ionic 8 with Angular 20
- **Database**: SQLite with Capacitor Community SQLite
- **Sensors**: Barometer for altitude, GPS for location
- **Platform**: Capacitor for native mobile functionality

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Ionic CLI (`npm install -g @ionic/cli`)
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/petruzdroba/multi-pitch-assistant.git
   cd multi-pitch-assistant
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install Capacitor CLI**
   ```bash
   npm install -g @capacitor/cli
   ```

### Development Setup

1. **Start the development server**
   ```bash
   npm start
   ```

2. **Add Android platform**
   ```bash
   npx cap add android
   ```

3. **Sync the project**
   ```bash
   npx cap sync
   ```

4. **Open in Android Studio**
   ```bash
   npx cap open android
   ```

### Building and Running

#### Web Development
```bash
# Start development server
npm start

# Build for production
npm run build
```

#### Android Development
```bash
# Build and sync
ionic build
npx cap sync android

# Open in Android Studio
npx cap open android
```

#### Quick Build Scripts

**Linux/macOS:**
```bash
chmod +x build_and_install_linux.sh
./build_and_install_linux.sh
```

**Windows:**
```cmd
build_and_install_windows.bat
```

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run linting
npm run lint
```

## 📱 Usage

### Starting a Session
1. Open the app and tap "Start Climbing"
2. The app will begin monitoring altitude changes
3. Automatic event detection will classify your movements

### During a Session
- **Automatic Detection**: Falls, rests, and pitch changes are detected automatically
- **Manual Notes**: Tap the + button to add custom notes
- **Real-time Monitoring**: View altitude changes and events in real-time

### Ending a Session
1. Tap "End Climbing" to finish the session
2. Add session details (name, type, location, notes)
3. Session is saved to your history

### Viewing History
- Navigate to the Log tab to see past sessions
- Tap on any session to view detailed information
- Edit session details or add post-climb notes

## 🔧 Configuration

### Environment Variables
Create `src/environments/environment.prod.ts`:
```typescript
export const environment = {
  production: true
};
```

### Event Classification Thresholds
The app uses configurable thresholds for event detection:
- **Fall Detection**: Minimum altitude drop (default: 0.5m)
- **Rest Detection**: Maximum altitude change (default: 0.3m)
- **Noise Filtering**: Minimum change threshold (default: 0.5m)

## 📊 Data Models

### Session
```typescript
interface Session {
  id: string;
  timeStart: Date;
  timeEnd: Date;
  events: ClimbEvent[];
  name?: string;
  type?: 'sport' | 'trad' | 'undefined';
  location?: { latitude: number; longitude: number };
  notes?: string;
  completed?: boolean;
  pitchCount?: number;
}
```

### Climb Event
```typescript
interface ClimbEvent {
  id: string;
  time: Date;
  altitude?: number;
  type: 'session-started' | 'session-ended' | 'fall' | 'fall-arrested' | 
        'pitch-changed' | 'rest' | 'retreat' | 'manual-note' | 'lead-started' | 
        'lead-ended' | 'second-started' | 'second-ended' | 'error' | 'belay' | 
        'barometer-reading';
  notes?: string;
}
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes**
4. **Run tests**
   ```bash
   npm test
   npm run lint
   ```
5. **Commit your changes**
   ```bash
   git commit -m "Add your feature description"
   ```
6. **Push to your branch**
   ```bash
   git push origin feature/your-feature-name
   ```
7. **Create a Pull Request**

### Development Guidelines

- Follow Angular style guide
- Write unit tests for new features
- Ensure all tests pass before submitting PR
- Update documentation for new features
- Use conventional commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: Report bugs and request features on [GitHub Issues](https://github.com/petruzdroba/multi-pitch-assistant/issues)
- **Discussions**: Join the conversation on [GitHub Discussions](https://github.com/petruzdroba/multi-pitch-assistant/discussions)

## 🙏 Acknowledgments

- Built with [Ionic Framework](https://ionicframework.com/)
- Uses [Capacitor](https://capacitorjs.com/) for native functionality
- Altitude monitoring powered by device barometer sensors

## 📈 Roadmap

- [ ] iOS support
- [ ] Cloud sync for session data
- [ ] Advanced analytics and statistics
- [ ] Route difficulty estimation
- [ ] Social features for sharing sessions
- [ ] Offline mode improvements
- [ ] Custom event types
- [ ] Export functionality

---

<img src="https://github.com/user-attachments/assets/2e7303ef-bbdf-4d48-8f72-17c0fb6e352e" width="300"/>
<img src="https://github.com/user-attachments/assets/78c7203a-4ba7-42fc-9624-23c94694efeb" width="300"/>
<img src="https://github.com/user-attachments/assets/616114bb-defe-4b4c-b33d-7e6f53b55e4d" width="300"/>

**Note**: This app requires a device with a barometer sensor for altitude monitoring functionality. GPS is used for location tracking and is optional.


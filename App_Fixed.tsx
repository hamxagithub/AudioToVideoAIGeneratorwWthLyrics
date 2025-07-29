/**
 * AI Video Generator from Audio - Main App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  useColorScheme,
  Alert,
  StatusBar,
} from 'react-native';

// Import all modules

import { AudioTranscriptionModule } from './src/modules/AudioTranscriptionModule';
import { VisualBackgroundGenerator } from './src/modules/VisualBackgroundGenerator';
import { VideoRenderingModule } from './src/modules/VideoRenderingModule';
import { ExportDownloadModule } from './src/modules/ExportDownloadModule';
import { UserAccountProjectManagement } from './src/modules/UserAccountProjectManagement';
import { PaymentSubscriptionModule } from './src/modules/PaymentSubscriptionModule';


// Import types
import {
  AudioFile,
  VideoPreferences,
  TranscriptionResult,
  BackgroundVideo,
  RenderingProgress,
  ProjectData,
  UserAccount,
} from './src/types';

// Import components
import RenderingProgressScreen from './src/components/RenderingProgressScreen';
import VideoPreviewScreen from './src/components/VideoPreviewScreen';
import AuthScreen from './src/components/AuthScreen';
import UserInputModule from './src/modules/UserInputModule';

type AppState = 
  | 'input' 
  | 'transcribing' 
  | 'generating_backgrounds' 
  | 'rendering' 
  | 'preview' 
  | 'auth';

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  
  // App state
  const [appState, setAppState] = useState<AppState>('auth');
  const [renderingProgress, setRenderingProgress] = useState<RenderingProgress | null>(null);
  
  // User data
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Project data
  const [selectedAudio, setSelectedAudio] = useState<AudioFile | null>(null);
  const [preferences, setPreferences] = useState<VideoPreferences | null>(null);
  const [manualLyrics, setManualLyrics] = useState<string>('');
  const [transcriptions, setTranscriptions] = useState<TranscriptionResult[]>([]);
  const [backgroundVideos, setBackgroundVideos] = useState<BackgroundVideo[]>([]);
  const [finalVideoUrl, setFinalVideoUrl] = useState<string>('');
  
  // Initialize modules
  const [modules] = useState(() => {
    // API keys would typically come from environment variables or secure storage
    const transcriptionModule = new AudioTranscriptionModule(
      'demo-key', // Replace with actual API key
      'whisper'
    );
    
    const backgroundGenerator = new VisualBackgroundGenerator({
      pexels: 'demo-key', // Replace with actual API key
      unsplash: 'demo-key', // Replace with actual API key
      runway: 'demo-key', // Replace with actual API key
      stability: 'demo-key', // Replace with actual API key
    });
    
    const videoRenderer = new VideoRenderingModule((progress) => {
      setRenderingProgress(progress);
    });
    
    const exportModule = new ExportDownloadModule();
    
    const userManagement = new UserAccountProjectManagement();
    
    const paymentModule = new PaymentSubscriptionModule({
      stripePublicKey: 'pk_test_demo', // Replace with actual Stripe key
      paypalClientId: 'demo-client-id', // Replace with actual PayPal client ID
      apiBaseUrl: 'https://api.aivideogenerator.com', // Replace with actual API URL
    });
    
    return {
      transcriptionModule,
      backgroundGenerator,
      videoRenderer,
      exportModule,
      userManagement,
      paymentModule,
    };
  });

  // Check authentication on app start
  useEffect(() => {
    checkAuthenticationStatus();
  }, []);

  /**
   * Check if user is already authenticated
   */
  const checkAuthenticationStatus = async () => {
    try {
      const user = modules.userManagement.getCurrentUser();
      if (user && modules.userManagement.isLoggedIn()) {
        setCurrentUser(user);
        setIsAuthenticated(true);
        setAppState('input');
      } else {
        setAppState('auth');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setAppState('auth');
    }
  };

  /**
   * Handle user authentication
   */
  const handleAuthentication = async (user: UserAccount) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    setAppState('input');
  };

  /**
   * Handle logout
   */
  const handleLogout = async () => {
    try {
      await modules.userManagement.logout();
      setCurrentUser(null);
      setIsAuthenticated(false);
      setAppState('auth');
      
      // Reset all data
      setSelectedAudio(null);
      setPreferences(null);
      setManualLyrics('');
      setTranscriptions([]);
      setBackgroundVideos([]);
      setFinalVideoUrl('');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  /**
   * Handle audio file selection
   */
  const handleAudioSelected = (audio: AudioFile) => {
    setSelectedAudio(audio);
  };

  /**
   * Handle manual lyrics input
   */
  const handleLyricsProvided = (lyrics: string) => {
    setManualLyrics(lyrics);
  };

  /**
   * Handle video generation process
   */
  const handleGenerateVideo = async (videoPreferences: VideoPreferences) => {
    if (!selectedAudio) {
      Alert.alert('Error', 'Please select an audio file first');
      return;
    }

    try {
      setPreferences(videoPreferences);
      setAppState('transcribing');
      
      // Step 1: Transcribe audio (unless manual lyrics provided)
      let lyricsData;
      if (manualLyrics.trim()) {
        // Use manual lyrics
        const mockTranscriptions: TranscriptionResult[] = manualLyrics
          .split(' ')
          .map((word: string, index: number) => ({
            text: word,
            start: index * 0.5,
            end: (index + 1) * 0.5,
            confidence: 1.0,
          }));
        
        lyricsData = {
          transcriptions: mockTranscriptions,
          fullText: manualLyrics,
          totalDuration: mockTranscriptions.length * 0.5,
        };
      } else {
        // Transcribe audio
        lyricsData = await modules.transcriptionModule.transcribeAudio(selectedAudio);
      }
      
      setTranscriptions(lyricsData.transcriptions);
      
      // Step 2: Generate background visuals
      setAppState('generating_backgrounds');
      const backgrounds = await modules.backgroundGenerator.generateBackgroundVisuals(
        lyricsData.transcriptions,
        videoPreferences.style,
        'stock' // Use stock footage for faster generation
      );
      
      setBackgroundVideos(backgrounds);
      
      // Step 3: Render video
      setAppState('rendering');
      const renderingOptions = {
        resolution: videoPreferences.quality === '720p' 
          ? { width: 1280, height: 720 }
          : videoPreferences.quality === '1080p'
          ? { width: 1920, height: 1080 }
          : { width: 3840, height: 2160 },
        framerate: 30,
        bitrate: '5M',
        format: videoPreferences.format,
        quality: 'final' as const,
      };
      
      const videoPath = await modules.videoRenderer.renderVideo(
        selectedAudio,
        lyricsData.transcriptions,
        backgrounds,
        videoPreferences.style,
        renderingOptions
      );
      
      setFinalVideoUrl(videoPath);
      setAppState('preview');
      
      // Save project if user is authenticated
      if (isAuthenticated && modules.userManagement.getCurrentUser()) {
        await saveProject(lyricsData, backgrounds, videoPath);
      }
      
    } catch (error) {
      console.error('Video generation failed:', error);
      Alert.alert(
        'Generation Failed', 
        'Failed to generate video. Please try again.',
        [{ text: 'OK', onPress: () => setAppState('input') }]
      );
    }
  };

  /**
   * Save project to user account
   */
  const saveProject = async (
    lyricsData: any,
    backgrounds: BackgroundVideo[],
    videoPath: string
  ) => {
    if (!selectedAudio || !preferences) return;

    try {
      const projectData: Omit<ProjectData, 'id' | 'createdAt' | 'updatedAt'> = {
        name: `Video - ${selectedAudio.fileName}`,
        audioFile: selectedAudio,
        lyrics: lyricsData,
        preferences,
        backgroundVideos: backgrounds,
        status: 'completed',
        outputVideoUrl: videoPath,
      };

      await modules.userManagement.createProject(projectData);
    } catch (error) {
      console.error('Failed to save project:', error);
    }
  };

  /**
   * Handle export functionality
   */
  const handleExport = async () => {
    if (!finalVideoUrl) return;

    try {
      // Check subscription limits
      const user = modules.userManagement.getCurrentUser();
      const canExportHD = user?.subscription === 'pro';
      
      if (!canExportHD && preferences?.quality !== '720p') {
        Alert.alert(
          'Upgrade Required',
          'HD export requires a Pro subscription. Would you like to upgrade?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Upgrade', onPress: () => handleUpgradePrompt() },
          ]
        );
        return;
      }

      // Export video
      const exportOptions = {
        format: preferences?.format || 'mp4',
        quality: preferences?.quality || '720p',
        compression: 'medium' as const,
        watermark: user?.subscription !== 'pro',
        metadata: {
          title: `AI Generated Video - ${selectedAudio?.fileName}`,
          description: 'Generated with AI Video Generator',
          tags: ['ai', 'video', 'lyrics', 'music'],
        },
      };

      const mockProjectData: ProjectData = {
        id: 'temp-project',
        name: 'Current Project',
        audioFile: selectedAudio!,
        lyrics: { transcriptions, fullText: '', totalDuration: 0 },
        preferences: preferences!,
        backgroundVideos,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'completed',
        outputVideoUrl: finalVideoUrl,
      };

      const result = await modules.exportModule.exportVideo(
        finalVideoUrl,
        mockProjectData,
        exportOptions
      );

      Alert.alert(
        'Export Complete',
        'Your video has been exported successfully!',
        [
          { text: 'Download', onPress: () => downloadVideo(result.downloadUrl) },
          { text: 'Share', onPress: () => shareVideo(result.downloadUrl) },
        ]
      );
    } catch (error) {
      console.error('Export failed:', error);
      Alert.alert('Export Failed', 'Failed to export video. Please try again.');
    }
  };

  /**
   * Handle upgrade prompt
   */
  const handleUpgradePrompt = () => {
    // Navigate to payment/subscription screen
    Alert.alert('Upgrade to Pro', 'This feature will be available in the subscription screen.');
  };

  /**
   * Download video
   */
  const downloadVideo = (url: string) => {
    // In a real app, this would trigger a download
    Alert.alert('Download Started', 'Your video download has started.');
  };

  /**
   * Share video
   */
  const shareVideo = (url: string) => {
    // In a real app, this would open share dialog
    Alert.alert('Share Video', 'Share functionality will be implemented here.');
  };

  /**
   * Handle back navigation
   */
  const handleBack = () => {
    if (appState === 'preview') {
      setAppState('input');
      setFinalVideoUrl('');
    } else if (appState !== 'input' && appState !== 'auth') {
      setAppState('input');
    }
  };

  /**
   * Render current screen based on app state
   */
  const renderCurrentScreen = () => {
    switch (appState) {
      case 'auth':
        return (
          <AuthScreen
            userManagement={modules.userManagement}
            paymentModule={modules.paymentModule}
            onAuthenticated={handleAuthentication}
          />
        );

      case 'input':
        return (
          <UserInputModule
            onAudioSelected={handleAudioSelected}
            onPreferencesSet={handleGenerateVideo}
            onLyricsProvided={handleLyricsProvided}
          />
        );

      case 'transcribing':
      case 'generating_backgrounds':
      case 'rendering':
        return (
          <RenderingProgressScreen
            stage={appState}
            progress={renderingProgress}
            onCancel={handleBack}
          />
        );

      case 'preview':
        return (
          <VideoPreviewScreen
            videoUrl={finalVideoUrl}
            onExport={handleExport}
            onBack={handleBack}
            onLogout={handleLogout}
            currentUser={currentUser}
          />
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      {renderCurrentScreen()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});

export default App;

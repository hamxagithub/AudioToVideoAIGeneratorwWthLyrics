import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Share,
} from 'react-native';
import Video from 'react-native-video';

interface VideoPreviewScreenProps {
  videoUrl: string;
  onExport: () => void;
  onBack: () => void;
  onLogout: () => void;
  currentUser: any;
}

const VideoPreviewScreen: React.FC<VideoPreviewScreenProps> = ({
  videoUrl,
  onExport,
  onBack,
  onLogout,
  currentUser,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const handleVideoPress = () => {
    setIsPlaying(!isPlaying);
  };

  const handleShare = async () => {
    try {
      const result = await Share.share({
        message: 'Check out this AI-generated video I created with AI Video Generator!',
        url: videoUrl,
      });
      
      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          console.log('Shared with activity type:', result.activityType);
        } else {
          console.log('Shared');
        }
      } else if (result.action === Share.dismissedAction) {
        console.log('Share dismissed');
      }
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('Error', 'Failed to share video');
    }
  };

  const handleSaveToProject = () => {
    Alert.alert(
      'Save to Projects',
      'This video has been automatically saved to your projects.',
      [{ text: 'OK' }]
    );
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        
        <Text style={styles.title}>Video Preview</Text>
        
        <TouchableOpacity style={styles.userButton} onPress={onLogout}>
          <Text style={styles.userButtonText}>
            {currentUser?.name || 'User'} ↓
          </Text>
        </TouchableOpacity>
      </View>

      {/* Video Player */}
      <View style={styles.videoContainer}>
        <TouchableOpacity style={styles.videoPlayer} onPress={handleVideoPress}>
          {videoUrl.startsWith('http') ? (
            <Video
              source={{ uri: videoUrl }}
              style={styles.video}
              paused={!isPlaying}
              onLoad={(data) => setDuration(data.duration)}
              onProgress={(data) => setCurrentTime(data.currentTime)}
              onEnd={() => setIsPlaying(false)}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.videoPlaceholder}>
              <Text style={styles.videoPlaceholderText}>
                🎬 Video Preview
              </Text>
              <Text style={styles.videoPlaceholderSubtext}>
                Tap to play generated video
              </Text>
            </View>
          )}
          
          {/* Play/Pause Overlay */}
          <View style={styles.videoOverlay}>
            <View style={styles.playButton}>
              <Text style={styles.playButtonText}>
                {isPlaying ? '⏸️' : '▶️'}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Video Controls */}
        <View style={styles.videoControls}>
          <Text style={styles.timeText}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </Text>
          
          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  { width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }
                ]} 
              />
            </View>
          </View>
        </View>
      </View>

      {/* Video Info */}
      <View style={styles.videoInfo}>
        <Text style={styles.videoTitle}>AI Generated Video</Text>
        <Text style={styles.videoDetails}>
          Created with AI Video Generator • {formatTime(duration)} duration
        </Text>
        
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>HD</Text>
            <Text style={styles.statLabel}>Quality</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>MP4</Text>
            <Text style={styles.statLabel}>Format</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>AI</Text>
            <Text style={styles.statLabel}>Generated</Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.primaryButton} onPress={onExport}>
          <Text style={styles.primaryButtonText}>📥 Export & Download</Text>
        </TouchableOpacity>

        <View style={styles.secondaryButtons}>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleShare}>
            <Text style={styles.secondaryButtonText}>📤 Share</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.secondaryButton} onPress={handleSaveToProject}>
            <Text style={styles.secondaryButtonText}>💾 Save</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Features */}
      <View style={styles.features}>
        <Text style={styles.featuresTitle}>What's Included</Text>
        
        <View style={styles.featuresList}>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🎵</Text>
            <Text style={styles.featureText}>Original audio preserved</Text>
          </View>
          
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>📝</Text>
            <Text style={styles.featureText}>Synchronized lyrics overlay</Text>
          </View>
          
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🎨</Text>
            <Text style={styles.featureText}>AI-generated background visuals</Text>
          </View>
          
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>✨</Text>
            <Text style={styles.featureText}>Professional transitions</Text>
          </View>
        </View>
      </View>

      {/* Subscription Prompt (if free user) */}
      {currentUser?.subscription === 'free' && (
        <View style={styles.upgradePrompt}>
          <Text style={styles.upgradeTitle}>🚀 Upgrade to Pro</Text>
          <Text style={styles.upgradeText}>
            Remove watermarks, export in HD, and get unlimited video generation
          </Text>
          <TouchableOpacity style={styles.upgradeButton}>
            <Text style={styles.upgradeButtonText}>Upgrade Now</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Tips */}
      <View style={styles.tips}>
        <Text style={styles.tipsTitle}>💡 Pro Tips</Text>
        <Text style={styles.tipsText}>
          • Try different themes for varied visual styles{'\n'}
          • Use clear audio for better transcription{'\n'}
          • Manual lyrics give you full control{'\n'}
          • Export in multiple formats for different platforms
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  userButton: {
    padding: 8,
  },
  userButtonText: {
    fontSize: 14,
    color: '#666',
  },
  videoContainer: {
    margin: 20,
    borderRadius: 12,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  videoPlayer: {
    position: 'relative',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
  },
  video: {
    flex: 1,
  },
  videoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  videoPlaceholderText: {
    fontSize: 24,
    color: 'white',
    marginBottom: 8,
  },
  videoPlaceholderSubtext: {
    fontSize: 14,
    color: '#ccc',
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonText: {
    fontSize: 24,
    color: 'white',
  },
  videoControls: {
    padding: 15,
    backgroundColor: 'white',
  },
  timeText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  progressBarContainer: {
    width: '100%',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
  },
  videoInfo: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  videoTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  videoDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  actionButtons: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: '#34C759',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: 'white',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  secondaryButtonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
  },
  features: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  upgradePrompt: {
    backgroundColor: '#007AFF',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  upgradeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 8,
  },
  upgradeText: {
    fontSize: 14,
    color: 'white',
    textAlign: 'center',
    marginBottom: 15,
    opacity: 0.9,
  },
  upgradeButton: {
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  upgradeButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  tips: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 40,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  tipsText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default VideoPreviewScreen;

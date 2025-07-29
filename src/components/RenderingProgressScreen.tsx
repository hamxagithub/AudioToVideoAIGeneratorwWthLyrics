import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ProgressBarAndroid,
  Platform,
} from 'react-native';
import { RenderingProgress } from '../types';

interface RenderingProgressScreenProps {
  stage: 'transcribing' | 'generating_backgrounds' | 'rendering';
  progress: RenderingProgress | null;
  onCancel: () => void;
}

const RenderingProgressScreen: React.FC<RenderingProgressScreenProps> = ({
  stage,
  progress,
  onCancel,
}) => {
  const getStageTitle = () => {
    switch (stage) {
      case 'transcribing':
        return 'Transcribing Audio';
      case 'generating_backgrounds':
        return 'Generating Visuals';
      case 'rendering':
        return 'Rendering Video';
      default:
        return 'Processing';
    }
  };

  const getStageDescription = () => {
    switch (stage) {
      case 'transcribing':
        return 'Converting your audio to synchronized text...';
      case 'generating_backgrounds':
        return 'Creating background visuals that match your lyrics...';
      case 'rendering':
        return 'Combining audio, lyrics, and visuals into your final video...';
      default:
        return 'Processing your request...';
    }
  };

  const getProgressValue = () => {
    if (!progress) return 0;
    return progress.progress / 100;
  };

  const renderProgressBar = () => {
    if (Platform.OS === 'android') {
      return (
        <ProgressBarAndroid
          styleAttr="Horizontal"
          indeterminate={false}
          progress={getProgressValue()}
          style={styles.progressBar}
        />
      );
    } else {
      // For iOS, use a custom progress bar
      return (
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <View 
              style={[
                styles.progressBarFill,
                { width: `${progress?.progress || 0}%` }
              ]} 
            />
          </View>
        </View>
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{getStageTitle()}</Text>
          <Text style={styles.description}>{getStageDescription()}</Text>
        </View>

        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <ActivityIndicator size="large" color="#007AFF" style={styles.spinner} />
          
          {progress && (
            <View style={styles.progressInfo}>
              <Text style={styles.progressText}>
                {Math.round(progress.progress)}% Complete
              </Text>
              <Text style={styles.progressMessage}>
                {progress.message}
              </Text>
            </View>
          )}

          {renderProgressBar()}
        </View>

        {/* Stage Indicators */}
        <View style={styles.stageIndicators}>
          <View style={styles.stageRow}>
            <View style={[
              styles.stageItem,
              stage === 'transcribing' && styles.activeStage,
              ['generating_backgrounds', 'rendering'].includes(stage) && styles.completedStage
            ]}>
              <View style={styles.stageNumber}>
                <Text style={styles.stageNumberText}>1</Text>
              </View>
              <Text style={styles.stageText}>Audio Transcription</Text>
            </View>

            <View style={[
              styles.stageItem,
              stage === 'generating_backgrounds' && styles.activeStage,
              stage === 'rendering' && styles.completedStage
            ]}>
              <View style={styles.stageNumber}>
                <Text style={styles.stageNumberText}>2</Text>
              </View>
              <Text style={styles.stageText}>Visual Generation</Text>
            </View>

            <View style={[
              styles.stageItem,
              stage === 'rendering' && styles.activeStage
            ]}>
              <View style={styles.stageNumber}>
                <Text style={styles.stageNumberText}>3</Text>
              </View>
              <Text style={styles.stageText}>Video Rendering</Text>
            </View>
          </View>
        </View>

        {/* Estimated Time */}
        {progress && (
          <View style={styles.timeEstimate}>
            <Text style={styles.timeText}>
              Estimated time remaining: ~{Math.max(1, Math.ceil((100 - progress.progress) / 10))} minutes
            </Text>
          </View>
        )}

        {/* Tips */}
        <View style={styles.tips}>
          <Text style={styles.tipsTitle}>💡 Did you know?</Text>
          <Text style={styles.tipsText}>
            {stage === 'transcribing' && "We use AI to accurately transcribe your audio with precise timestamps for perfect synchronization."}
            {stage === 'generating_backgrounds' && "Our AI analyzes your lyrics to create visuals that perfectly match the mood and theme of your content."}
            {stage === 'rendering' && "We're combining all elements with professional transitions and effects to create your final video."}
          </Text>
        </View>
      </View>

      {/* Cancel Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: 40,
    width: '100%',
  },
  spinner: {
    marginBottom: 20,
  },
  progressInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  progressText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  progressMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
  },
  progressBarContainer: {
    width: '100%',
  },
  progressBarBackground: {
    width: '100%',
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  stageIndicators: {
    width: '100%',
    marginBottom: 30,
  },
  stageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stageItem: {
    alignItems: 'center',
    flex: 1,
    opacity: 0.4,
  },
  activeStage: {
    opacity: 1,
  },
  completedStage: {
    opacity: 0.8,
  },
  stageNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  stageNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
  stageText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  timeEstimate: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timeText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  tips: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    width: '100%',
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
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    alignSelf: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RenderingProgressScreen;

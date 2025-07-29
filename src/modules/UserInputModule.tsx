import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
} from 'react-native';
// import DocumentPicker from 'react-native-document-picker'; // Temporarily disabled
import { AudioFile, VideoStyle, VideoPreferences } from '../types';

interface UserInputModuleProps {
  onAudioSelected: (audio: AudioFile) => void;
  onPreferencesSet: (preferences: VideoPreferences) => void;
  onLyricsProvided?: (lyrics: string) => void;
}

const UserInputModule: React.FC<UserInputModuleProps> = ({
  onAudioSelected,
  onPreferencesSet,
  onLyricsProvided,
}) => {
  const [selectedAudio, setSelectedAudio] = useState<AudioFile | null>(null);
  const [manualLyrics, setManualLyrics] = useState('');
  const [videoStyle, setVideoStyle] = useState<VideoStyle>({
    fontFamily: 'Arial',
    fontSize: 24,
    fontColor: '#FFFFFF',
    backgroundColor: '#000000',
    theme: 'minimal',
    animationType: 'fade',
    textPosition: 'bottom',
  });
  const [quality, setQuality] = useState<'720p' | '1080p' | '4K'>('1080p');
  const [format, setFormat] = useState<'mp4' | 'mov' | 'webm'>('mp4');

  const handleAudioUpload = useCallback(async () => {
    try {
      // Temporarily disabled - use manual file input
      Alert.alert(
        'Audio Upload', 
        'Document picker temporarily disabled. Please use alternative method to add audio files.',
        [{ text: 'OK' }]
      );
      
      // For demo purposes, create a mock audio file
      const mockAudioFile: AudioFile = {
        uri: 'file://path/to/sample/audio.mp3',
        fileName: 'sample_audio.mp3',
        size: 1024000,
        type: 'audio/mp3',
      };
      
      setSelectedAudio(mockAudioFile);
      onAudioSelected(mockAudioFile);
    } catch (error) {
      Alert.alert('Error', 'Failed to select audio file');
    }
  }, [onAudioSelected]);

  const handleStyleChange = (key: keyof VideoStyle, value: any) => {
    setVideoStyle(prev => ({ ...prev, [key]: value }));
  };

  const handleGenerateVideo = () => {
    if (!selectedAudio) {
      Alert.alert('Error', 'Please select an audio file first');
      return;
    }

    const preferences: VideoPreferences = {
      style: videoStyle,
      quality,
      format,
      length: 'full',
    };

    onPreferencesSet(preferences);
    if (manualLyrics.trim() && onLyricsProvided) {
      onLyricsProvided(manualLyrics.trim());
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>AI Video Generator</Text>
      
      {/* Audio Upload Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. Upload Audio</Text>
        <TouchableOpacity style={styles.uploadButton} onPress={handleAudioUpload}>
          <Text style={styles.uploadButtonText}>
            {selectedAudio ? selectedAudio.fileName : 'Select Audio File'}
          </Text>
        </TouchableOpacity>
        {selectedAudio && (
          <Text style={styles.fileInfo}>
            Size: {(selectedAudio.size / 1024 / 1024).toFixed(2)} MB
          </Text>
        )}
      </View>

      {/* Manual Lyrics Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. Lyrics (Optional)</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Enter lyrics manually if available..."
          multiline
          numberOfLines={4}
          value={manualLyrics}
          onChangeText={setManualLyrics}
        />
      </View>

      {/* Style Preferences */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>3. Video Style</Text>
        
        {/* Theme Selection */}
        <Text style={styles.label}>Theme:</Text>
        <View style={styles.buttonRow}>
          {(['nature', 'city', 'abstract', 'minimal', 'colorful'] as const).map(theme => (
            <TouchableOpacity
              key={theme}
              style={[
                styles.optionButton,
                videoStyle.theme === theme && styles.selectedOption
              ]}
              onPress={() => handleStyleChange('theme', theme)}
            >
              <Text style={[
                styles.optionText,
                videoStyle.theme === theme && styles.selectedOptionText
              ]}>
                {theme.charAt(0).toUpperCase() + theme.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Animation Type */}
        <Text style={styles.label}>Animation:</Text>
        <View style={styles.buttonRow}>
          {(['fade', 'karaoke', 'bounce', 'slide'] as const).map(animation => (
            <TouchableOpacity
              key={animation}
              style={[
                styles.optionButton,
                videoStyle.animationType === animation && styles.selectedOption
              ]}
              onPress={() => handleStyleChange('animationType', animation)}
            >
              <Text style={[
                styles.optionText,
                videoStyle.animationType === animation && styles.selectedOptionText
              ]}>
                {animation.charAt(0).toUpperCase() + animation.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Text Position */}
        <Text style={styles.label}>Text Position:</Text>
        <View style={styles.buttonRow}>
          {(['top', 'center', 'bottom'] as const).map(position => (
            <TouchableOpacity
              key={position}
              style={[
                styles.optionButton,
                videoStyle.textPosition === position && styles.selectedOption
              ]}
              onPress={() => handleStyleChange('textPosition', position)}
            >
              <Text style={[
                styles.optionText,
                videoStyle.textPosition === position && styles.selectedOptionText
              ]}>
                {position.charAt(0).toUpperCase() + position.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Font Size */}
        <Text style={styles.label}>Font Size: {videoStyle.fontSize}px</Text>
        <View style={styles.sliderContainer}>
          {[16, 20, 24, 28, 32, 36].map(size => (
            <TouchableOpacity
              key={size}
              style={[
                styles.sizeButton,
                videoStyle.fontSize === size && styles.selectedOption
              ]}
              onPress={() => handleStyleChange('fontSize', size)}
            >
              <Text style={styles.sizeText}>{size}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Quality & Format */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>4. Output Settings</Text>
        
        <Text style={styles.label}>Quality:</Text>
        <View style={styles.buttonRow}>
          {(['720p', '1080p', '4K'] as const).map(q => (
            <TouchableOpacity
              key={q}
              style={[
                styles.optionButton,
                quality === q && styles.selectedOption
              ]}
              onPress={() => setQuality(q)}
            >
              <Text style={[
                styles.optionText,
                quality === q && styles.selectedOptionText
              ]}>
                {q}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Format:</Text>
        <View style={styles.buttonRow}>
          {(['mp4', 'mov', 'webm'] as const).map(f => (
            <TouchableOpacity
              key={f}
              style={[
                styles.optionButton,
                format === f && styles.selectedOption
              ]}
              onPress={() => setFormat(f)}
            >
              <Text style={[
                styles.optionText,
                format === f && styles.selectedOptionText
              ]}>
                {f.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Generate Button */}
      <TouchableOpacity 
        style={[styles.generateButton, !selectedAudio && styles.disabledButton]} 
        onPress={handleGenerateVideo}
        disabled={!selectedAudio}
      >
        <Text style={styles.generateButtonText}>Generate Video</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
  },
  uploadButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  uploadButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  fileInfo: {
    marginTop: 10,
    color: '#666',
    fontSize: 14,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 10,
    marginTop: 15,
    color: '#333',
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 10,
  },
  optionButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedOption: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  optionText: {
    fontSize: 14,
    color: '#333',
  },
  selectedOptionText: {
    color: 'white',
  },
  sliderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  sizeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  sizeText: {
    fontSize: 12,
    color: '#333',
  },
  generateButton: {
    backgroundColor: '#34C759',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  generateButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default UserInputModule;

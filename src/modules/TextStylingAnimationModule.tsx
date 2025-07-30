import React, { useEffect, useRef } from 'react';
import { Animated, View, Text, StyleSheet, Dimensions } from 'react-native';
import { VideoStyle, TranscriptionResult } from '../types';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface AnimatedLyricProps {
  transcription: TranscriptionResult;
  style: VideoStyle;
  isActive: boolean;
  currentTime: number;
}

const AnimatedLyric: React.FC<AnimatedLyricProps> = ({
  transcription,
  style,
  isActive,
  currentTime,
}) => {
  // Safety checks
  if (!transcription || !transcription.text || !style) {
    return null;
  }

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const translateYAnim = useRef(new Animated.Value(20)).current;
  const colorAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let animationRef: Animated.CompositeAnimation | null = null;
    
    if (isActive) {
      // Reset animations to initial state
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
      translateYAnim.setValue(20);
      colorAnim.setValue(0);
      
      // Animate in based on animation type
      switch (style.animationType) {
        case 'fade':
          animationRef = Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          });
          break;
          
        case 'bounce':
          animationRef = Animated.sequence([
            Animated.timing(scaleAnim, {
              toValue: 1.2,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
          ]);
          break;
          
        case 'slide':
          animationRef = Animated.parallel([
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(translateYAnim, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
          ]);
          break;
          
        case 'karaoke':
          const duration = Math.max((transcription.end - transcription.start) * 1000, 500);
          animationRef = Animated.timing(colorAnim, {
            toValue: 1,
            duration: duration,
            useNativeDriver: false,
          });
          break;
        default:
          animationRef = Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          });
      }
      
      if (animationRef) {
        animationRef.start();
      }
    } else {
      // Animate out
      animationRef = Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      });
      animationRef.start();
    }

    // Cleanup function to stop animations on unmount
    return () => {
      if (animationRef) {
        animationRef.stop();
      }
    };
  }, [isActive, style.animationType, transcription.start, transcription.end, fadeAnim, scaleAnim, translateYAnim, colorAnim]);

  const getTextColor = () => {
    if (style.animationType === 'karaoke') {
      return colorAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [style.fontColor || '#FFFFFF', '#FFD700'], // Gold highlight for karaoke
      });
    }
    return style.fontColor || '#FFFFFF'; // Default white color
  };

  return (
    <Animated.View
      style={[
        styles.lyricContainer,
        {
          opacity: fadeAnim,
          transform: [
            { scale: scaleAnim },
            { translateY: translateYAnim },
          ],
        },
      ]}
    >
      <Animated.Text
        style={[
          styles.lyricText,
          {
            fontSize: style.fontSize,
            fontFamily: style.fontFamily,
            color: getTextColor(),
          },
        ]}
      >
        {transcription.text}
      </Animated.Text>
    </Animated.View>
  );
};

interface TextStylingAnimationModuleProps {
  transcriptions: TranscriptionResult[];
  style: VideoStyle;
  currentTime: number;
  videoDimensions: { width: number; height: number };
}

export const TextStylingAnimationModule: React.FC<TextStylingAnimationModuleProps> = ({
  transcriptions = [],
  style,
  currentTime = 0,
  videoDimensions = { width: 400, height: 600 },
}) => {
  // Safety check for required props
  if (!style || !videoDimensions) {
    console.warn('TextStylingAnimationModule: Missing required props');
    return null;
  }

  const getContainerStyle = () => {
    const baseStyle = {
      position: 'absolute' as const,
      width: videoDimensions.width,
      alignItems: 'center' as const,
      paddingHorizontal: 20,
    };

    switch (style.textPosition) {
      case 'top':
        return {
          ...baseStyle,
          top: 50,
        };
      case 'center':
        return {
          ...baseStyle,
          top: Math.max(videoDimensions.height / 2 - 50, 0),
        };
      case 'bottom':
        return {
          ...baseStyle,
          bottom: 100,
        };
      default:
        return {
          ...baseStyle,
          bottom: 100,
        };
    }
  };

  const getActiveTranscriptions = () => {
    try {
      return transcriptions.filter(
        t => t && typeof t.start === 'number' && typeof t.end === 'number' && 
             currentTime >= t.start && currentTime <= t.end
      );
    } catch (error) {
      console.warn('Error filtering active transcriptions:', error);
      return [];
    }
  };

  const getUpcomingTranscription = () => {
    try {
      return transcriptions.find(t => t && typeof t.start === 'number' && t.start > currentTime);
    } catch (error) {
      console.warn('Error finding upcoming transcription:', error);
      return null;
    }
  };

  return (
    <View style={[styles.container, getContainerStyle()]}>
      <View
        style={[
          styles.textBackground,
          {
            backgroundColor: style.backgroundColor || 'rgba(0,0,0,0.5)',
            borderRadius: 8,
          },
        ]}
      >
        {/* Active lyrics */}
        {getActiveTranscriptions().map((transcription, index) => {
          if (!transcription || !transcription.text) return null;
          
          const lyricKey = `${transcription.start}-${index}-${transcription.text.substring(0, 10)}`;
          return (
            <AnimatedLyric
              key={lyricKey}
              transcription={transcription}
              style={style}
              isActive={true}
              currentTime={currentTime}
            />
          );
        })}
        
        {/* Preview upcoming lyric */}
        {style.animationType === 'fade' && getUpcomingTranscription() && (
          <AnimatedLyric
            transcription={getUpcomingTranscription()!}
            style={{ 
              ...style, 
              fontColor: style.fontColor ? `${style.fontColor}80` : '#FFFFFF80' 
            }} // Semi-transparent
            isActive={false}
            currentTime={currentTime}
          />
        )}
      </View>
    </View>
  );
};

export class TextLayoutEngine {
  private videoDimensions: { width: number; height: number };
  private style: VideoStyle;

  constructor(videoDimensions: { width: number; height: number }, style: VideoStyle) {
    // Safety checks with defaults
    this.videoDimensions = videoDimensions || { width: 400, height: 600 };
    this.style = style || {
      fontSize: 16,
      fontFamily: 'Arial',
      fontColor: '#FFFFFF',
      backgroundColor: 'rgba(0,0,0,0.5)',
      textPosition: 'bottom',
      animationType: 'fade',
      theme: 'minimal'
    };
  }

  /**
   * Calculate optimal text positioning and line breaks
   */
  calculateTextLayout(transcriptions: TranscriptionResult[]): Array<{
    transcription: TranscriptionResult;
    position: { x: number; y: number };
    maxWidth: number;
  }> {
    if (!Array.isArray(transcriptions) || transcriptions.length === 0) {
      return [];
    }

    const layouts: Array<{
      transcription: TranscriptionResult;
      position: { x: number; y: number };
      maxWidth: number;
    }> = [];

    const maxWidth = this.videoDimensions.width * 0.9; // 90% of video width
    const lineHeight = (this.style.fontSize || 16) * 1.5;

    transcriptions.forEach((transcription, index) => {
      if (!transcription || typeof transcription.start !== 'number' || typeof transcription.end !== 'number') {
        return; // Skip invalid transcriptions
      }
      
      try {
        const position = this.calculatePosition(index, lineHeight);
        
        layouts.push({
          transcription,
          position,
          maxWidth,
        });
      } catch (error) {
        console.warn('Error calculating text layout for transcription:', transcription, error);
      }
    });

    return layouts;
  }

  private calculatePosition(index: number, lineHeight: number): { x: number; y: number } {
    const centerX = this.videoDimensions.width / 2;
    
    let y: number;
    switch (this.style.textPosition) {
      case 'top':
        y = 50 + (index * lineHeight);
        break;
      case 'center':
        y = (this.videoDimensions.height / 2) - (lineHeight / 2);
        break;
      case 'bottom':
        y = this.videoDimensions.height - 150 - (index * lineHeight);
        break;
      default:
        y = this.videoDimensions.height - 150;
    }

    return { x: centerX, y };
  }

  /**
   * Group words into lines based on timing and width constraints
   */
  groupWordsIntoLines(transcriptions: TranscriptionResult[]): TranscriptionResult[][] {
    const lines: TranscriptionResult[][] = [];
    let currentLine: TranscriptionResult[] = [];
    let currentLineWidth = 0;
    
    const maxLineWidth = this.videoDimensions.width * 0.8;
    const avgCharWidth = this.style.fontSize * 0.6; // Approximate character width

    transcriptions.forEach((transcription) => {
      const wordWidth = transcription.text.length * avgCharWidth;
      
      if (currentLineWidth + wordWidth > maxLineWidth && currentLine.length > 0) {
        lines.push([...currentLine]);
        currentLine = [transcription];
        currentLineWidth = wordWidth;
      } else {
        currentLine.push(transcription);
        currentLineWidth += wordWidth;
      }
    });

    if (currentLine.length > 0) {
      lines.push(currentLine);
    }

    return lines;
  }

  /**
   * Generate CSS-like styles for text rendering
   */
  generateTextStyles(): any {
    return {
      fontSize: this.style.fontSize || 16,
      fontFamily: this.style.fontFamily || 'Arial',
      color: this.style.fontColor || '#FFFFFF',
      textAlign: 'center',
      textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
      fontWeight: 'bold',
      letterSpacing: 1,
    };
  }
}

export class AnimationEffects {
  /**
   * Create fade-in/fade-out animation timeline
   */
  static createFadeAnimation(transcription: TranscriptionResult) {
    return {
      keyframes: [
        { time: transcription.start - 0.2, opacity: 0 },
        { time: transcription.start, opacity: 1 },
        { time: transcription.end, opacity: 1 },
        { time: transcription.end + 0.2, opacity: 0 },
      ],
    };
  }

  /**
   * Create karaoke-style highlight animation
   */
  static createKaraokeAnimation(transcription: TranscriptionResult) {
    const duration = transcription.end - transcription.start;
    
    return {
      keyframes: [
        { time: transcription.start, backgroundColor: 'transparent' },
        { time: transcription.start + duration * 0.1, backgroundColor: '#FFD700' },
        { time: transcription.end - duration * 0.1, backgroundColor: '#FFD700' },
        { time: transcription.end, backgroundColor: 'transparent' },
      ],
    };
  }

  /**
   * Create bouncing text animation
   */
  static createBounceAnimation(transcription: TranscriptionResult) {
    return {
      keyframes: [
        { time: transcription.start - 0.1, transform: 'scale(0.8) translateY(10px)' },
        { time: transcription.start, transform: 'scale(1.2) translateY(-5px)' },
        { time: transcription.start + 0.1, transform: 'scale(1) translateY(0px)' },
        { time: transcription.end, transform: 'scale(1) translateY(0px)' },
      ],
    };
  }

  /**
   * Create sliding text animation
   */
  static createSlideAnimation(transcription: TranscriptionResult, direction: 'left' | 'right' | 'up' | 'down' = 'up') {
    const getInitialTransform = () => {
      switch (direction) {
        case 'left': return 'translateX(-100px)';
        case 'right': return 'translateX(100px)';
        case 'up': return 'translateY(50px)';
        case 'down': return 'translateY(-50px)';
        default: return 'translateY(50px)';
      }
    };

    return {
      keyframes: [
        { time: transcription.start - 0.2, transform: getInitialTransform(), opacity: 0 },
        { time: transcription.start, transform: 'translate(0px, 0px)', opacity: 1 },
        { time: transcription.end, transform: 'translate(0px, 0px)', opacity: 1 },
      ],
    };
  }
}

const styles = StyleSheet.create({
  container: {
    zIndex: 10,
  },
  textBackground: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    minHeight: 40,
    justifyContent: 'center',
  },
  lyricContainer: {
    marginVertical: 2,
  },
  lyricText: {
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
});

// Error Boundary Component
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class TextAnimationErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('TextStylingAnimationModule Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{ color: '#FFFFFF', textAlign: 'center' }}>
            Text animation temporarily unavailable
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

// Wrapped component with error boundary
export const SafeTextStylingAnimationModule: React.FC<TextStylingAnimationModuleProps> = (props) => {
  return (
    <TextAnimationErrorBoundary>
      <TextStylingAnimationModule {...props} />
    </TextAnimationErrorBoundary>
  );
};

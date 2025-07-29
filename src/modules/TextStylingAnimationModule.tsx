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
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const translateYAnim = useRef(new Animated.Value(20)).current;
  const colorAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isActive) {
      // Animate in based on animation type
      switch (style.animationType) {
        case 'fade':
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }).start();
          break;
          
        case 'bounce':
          Animated.sequence([
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
          ]).start();
          break;
          
        case 'slide':
          Animated.parallel([
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
          ]).start();
          break;
          
        case 'karaoke':
          Animated.timing(colorAnim, {
            toValue: 1,
            duration: (transcription.end - transcription.start) * 1000,
            useNativeDriver: false,
          }).start();
          break;
      }
    } else {
      // Animate out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [isActive, style.animationType]);

  const getTextColor = () => {
    if (style.animationType === 'karaoke') {
      return colorAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [style.fontColor, '#FFD700'], // Gold highlight for karaoke
      });
    }
    return style.fontColor;
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
  transcriptions,
  style,
  currentTime,
  videoDimensions,
}) => {
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
          top: videoDimensions.height / 2 - 50,
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
    return transcriptions.filter(
      t => currentTime >= t.start && currentTime <= t.end
    );
  };

  const getUpcomingTranscription = () => {
    return transcriptions.find(t => t.start > currentTime);
  };

  return (
    <View style={[styles.container, getContainerStyle()]}>
      <View
        style={[
          styles.textBackground,
          {
            backgroundColor: style.backgroundColor,
            borderRadius: 8,
          },
        ]}
      >
        {/* Active lyrics */}
        {getActiveTranscriptions().map((transcription, index) => {
          const lyricKey = `${transcription.start}-${index}`;
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
            style={{ ...style, fontColor: `${style.fontColor}80` }} // Semi-transparent
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
    this.videoDimensions = videoDimensions;
    this.style = style;
  }

  /**
   * Calculate optimal text positioning and line breaks
   */
  calculateTextLayout(transcriptions: TranscriptionResult[]): Array<{
    transcription: TranscriptionResult;
    position: { x: number; y: number };
    maxWidth: number;
  }> {
    const layouts: Array<{
      transcription: TranscriptionResult;
      position: { x: number; y: number };
      maxWidth: number;
    }> = [];

    const maxWidth = this.videoDimensions.width * 0.9; // 90% of video width
    const lineHeight = this.style.fontSize * 1.5;

    transcriptions.forEach((transcription, index) => {
      const position = this.calculatePosition(index, lineHeight);
      
      layouts.push({
        transcription,
        position,
        maxWidth,
      });
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
      fontSize: this.style.fontSize,
      fontFamily: this.style.fontFamily,
      color: this.style.fontColor,
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

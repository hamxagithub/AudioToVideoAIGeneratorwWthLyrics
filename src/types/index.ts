// Core types for the AI Video Generator app

export interface AudioFile {
  uri: string;
  fileName: string;
  size: number;
  type: string;
  duration?: number;
}

export interface TranscriptionResult {
  text: string;
  start: number;
  end: number;
  confidence?: number;
}

export interface LyricsData {
  transcriptions: TranscriptionResult[];
  fullText: string;
  totalDuration: number;
}

export interface VideoStyle {
  fontFamily: string;
  fontSize: number;
  fontColor: string;
  backgroundColor: string;
  theme: 'nature' | 'city' | 'abstract' | 'minimal' | 'colorful';
  animationType: 'fade' | 'karaoke' | 'bounce' | 'slide';
  textPosition: 'top' | 'center' | 'bottom';
}

export interface VideoPreferences {
  style: VideoStyle;
  quality: '720p' | '1080p' | '4K';
  format: 'mp4' | 'mov' | 'webm';
  length: 'full' | 'clip';
  clipDuration?: number;
}

export interface BackgroundVideo {
  id: string;
  url: string;
  keywords: string[];
  duration: number;
  thumbnail: string;
  source: 'stock' | 'ai-generated';
}

export interface RenderingProgress {
  stage: 'transcription' | 'styling' | 'background' | 'rendering' | 'export';
  progress: number;
  message: string;
}

export interface ProjectData {
  id: string;
  name: string;
  audioFile: AudioFile;
  lyrics: LyricsData;
  preferences: VideoPreferences;
  backgroundVideos: BackgroundVideo[];
  createdAt: Date;
  updatedAt: Date;
  status: 'draft' | 'processing' | 'completed' | 'error';
  outputVideoUrl?: string;
}

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  subscription: 'free' | 'pro';
  projects: ProjectData[];
  createdAt: Date;
}

export interface PaymentPlan {
  id: string;
  name: string;
  price: number;
  features: string[];
  maxProjects: number;
  maxVideoLength: number;
  watermark: boolean;
}

import { BackgroundVideo, VideoStyle, TranscriptionResult } from '../types';

// API endpoints for different services
const PEXELS_API_URL = 'https://api.pexels.com/videos/search';
const UNSPLASH_API_URL = 'https://api.unsplash.com/search/photos';
const RUNWAY_ML_API_URL = 'https://api.runwayml.com/v1/generate';
const STABLE_DIFFUSION_API_URL = 'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image';

export class VisualBackgroundGenerator {
  private pexelsApiKey: string;
  private unsplashApiKey: string;
  private runwayApiKey: string;
  private stabilityApiKey: string;

  constructor(apiKeys: {
    pexels?: string;
    unsplash?: string;
    runway?: string;
    stability?: string;
  }) {
    this.pexelsApiKey = apiKeys.pexels || '';
    this.unsplashApiKey = apiKeys.unsplash || '';
    this.runwayApiKey = apiKeys.runway || '';
    this.stabilityApiKey = apiKeys.stability || '';
  }

  /**
   * Main function to generate background visuals based on lyrics and style
   */
  async generateBackgroundVisuals(
    transcriptions: TranscriptionResult[],
    style: VideoStyle,
    approach: 'stock' | 'ai-generated' = 'stock'
  ): Promise<BackgroundVideo[]> {
    try {
      // Extract keywords from lyrics
      const keywords = this.extractKeywords(transcriptions);
      
      if (approach === 'stock') {
        return await this.generateStockFootage(keywords, style);
      } else {
        return await this.generateAIVisuals(keywords, style, transcriptions);
      }
    } catch (error) {
      console.error('Background generation failed:', error);
      // Return fallback videos
      return this.getFallbackVideos(style);
    }
  }

  /**
   * Extract meaningful keywords from transcribed lyrics
   */
  private extractKeywords(transcriptions: TranscriptionResult[]): string[] {
    const fullText = transcriptions.map(t => t.text).join(' ').toLowerCase();
    
    // Common words to filter out
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'may', 'might', 'must', 'can', 'i', 'you', 'he', 'she',
      'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your',
      'his', 'her', 'its', 'our', 'their', 'this', 'that', 'these', 'those'
    ]);

    // Extract words and filter
    const words = fullText
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word));

    // Count word frequency
    const wordCount = new Map<string, number>();
    words.forEach(word => {
      wordCount.set(word, (wordCount.get(word) || 0) + 1);
    });

    // Return top keywords sorted by frequency
    return Array.from(wordCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  }

  /**
   * Generate stock footage matching keywords
   */
  private async generateStockFootage(
    keywords: string[],
    style: VideoStyle
  ): Promise<BackgroundVideo[]> {
    const backgroundVideos: BackgroundVideo[] = [];

    // Combine keywords with theme
    const searchTerms = this.combineKeywordsWithTheme(keywords, style.theme);

    for (const term of searchTerms.slice(0, 3)) { // Limit to 3 searches
      try {
        // Try Pexels first
        const pexelsVideos = await this.searchPexelsVideos(term);
        backgroundVideos.push(...pexelsVideos);

        // If not enough videos, try Unsplash for images (can be converted to video)
        if (backgroundVideos.length < 2) {
          const unsplashImages = await this.searchUnsplashImages(term);
          backgroundVideos.push(...unsplashImages);
        }
      } catch (error) {
        console.error(`Error searching for ${term}:`, error);
      }
    }

    return backgroundVideos.slice(0, 5); // Return top 5 videos
  }

  /**
   * Search Pexels for videos
   */
  private async searchPexelsVideos(query: string): Promise<BackgroundVideo[]> {
    if (!this.pexelsApiKey) {
      return this.getMockPexelsVideos(query);
    }

    try {
      const response = await fetch(`${PEXELS_API_URL}?query=${encodeURIComponent(query)}&per_page=5`, {
        headers: {
          'Authorization': this.pexelsApiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Pexels API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      return data.videos.map((video: any) => ({
        id: `pexels-${video.id}`,
        url: video.video_files[0]?.link || '',
        keywords: [query],
        duration: video.duration || 30,
        thumbnail: video.image,
        source: 'stock' as const,
      }));
    } catch (error) {
      console.error('Pexels search error:', error);
      return this.getMockPexelsVideos(query);
    }
  }

  /**
   * Search Unsplash for images (to be converted to video backgrounds)
   */
  private async searchUnsplashImages(query: string): Promise<BackgroundVideo[]> {
    if (!this.unsplashApiKey) {
      return this.getMockUnsplashVideos(query);
    }

    try {
      const response = await fetch(
        `${UNSPLASH_API_URL}?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape`,
        {
          headers: {
            'Authorization': `Client-ID ${this.unsplashApiKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Unsplash API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      return data.results.map((image: any) => ({
        id: `unsplash-${image.id}`,
        url: image.urls.full,
        keywords: [query],
        duration: 30, // Static image converted to 30s video
        thumbnail: image.urls.thumb,
        source: 'stock' as const,
      }));
    } catch (error) {
      console.error('Unsplash search error:', error);
      return this.getMockUnsplashVideos(query);
    }
  }

  /**
   * Generate AI visuals using text-to-video models
   */
  private async generateAIVisuals(
    keywords: string[],
    style: VideoStyle,
    transcriptions: TranscriptionResult[]
  ): Promise<BackgroundVideo[]> {
    const aiVideos: BackgroundVideo[] = [];

    // Create prompts based on lyrics and style
    const prompts = this.createAIPrompts(keywords, style, transcriptions);

    for (const prompt of prompts.slice(0, 3)) { // Limit to 3 generations
      try {
        // Try RunwayML first
        if (this.runwayApiKey) {
          const runwayVideo = await this.generateWithRunwayML(prompt);
          if (runwayVideo) aiVideos.push(runwayVideo);
        }

        // Fallback to Stable Diffusion for images
        if (aiVideos.length === 0 && this.stabilityApiKey) {
          const stableDiffusionVideo = await this.generateWithStableDiffusion(prompt);
          if (stableDiffusionVideo) aiVideos.push(stableDiffusionVideo);
        }
      } catch (error) {
        console.error(`Error generating AI visual for prompt "${prompt}":`, error);
      }
    }

    return aiVideos.length > 0 ? aiVideos : this.getFallbackVideos(style);
  }

  /**
   * Generate video with RunwayML
   */
  private async generateWithRunwayML(prompt: string): Promise<BackgroundVideo | null> {
    try {
      const response = await fetch(RUNWAY_ML_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.runwayApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          model: 'gen2',
          duration: 4, // 4 seconds
          ratio: '16:9',
        }),
      });

      if (!response.ok) {
        throw new Error(`RunwayML API error: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Poll for completion (simplified)
      const videoUrl = await this.pollRunwayMLResult(result.id);
      
      return {
        id: `runway-${result.id}`,
        url: videoUrl,
        keywords: [prompt],
        duration: 4,
        thumbnail: videoUrl, // Runway usually provides a thumbnail
        source: 'ai-generated',
      };
    } catch (error) {
      console.error('RunwayML generation error:', error);
      return null;
    }
  }

  /**
   * Generate image with Stable Diffusion (to be converted to video)
   */
  private async generateWithStableDiffusion(prompt: string): Promise<BackgroundVideo | null> {
    try {
      const response = await fetch(STABLE_DIFFUSION_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.stabilityApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text_prompts: [{ text: prompt }],
          cfg_scale: 7,
          height: 1024,
          width: 1024,
          samples: 1,
          steps: 30,
        }),
      });

      if (!response.ok) {
        throw new Error(`Stability API error: ${response.statusText}`);
      }

      const result = await response.json();
      const imageBase64 = result.artifacts[0].base64;
      const imageUrl = `data:image/png;base64,${imageBase64}`;
      
      return {
        id: `stability-${Date.now()}`,
        url: imageUrl,
        keywords: [prompt],
        duration: 30, // Static image as 30s background
        thumbnail: imageUrl,
        source: 'ai-generated',
      };
    } catch (error) {
      console.error('Stable Diffusion generation error:', error);
      return null;
    }
  }

  /**
   * Combine keywords with theme preferences
   */
  private combineKeywordsWithTheme(keywords: string[], theme: VideoStyle['theme']): string[] {
    const themeModifiers = {
      nature: ['forest', 'mountains', 'ocean', 'sunset', 'landscape'],
      city: ['urban', 'skyline', 'streets', 'buildings', 'lights'],
      abstract: ['abstract', 'geometric', 'colorful', 'patterns', 'artistic'],
      minimal: ['minimalist', 'clean', 'simple', 'modern', 'elegant'],
      colorful: ['vibrant', 'colorful', 'bright', 'rainbow', 'vivid'],
    };

    const modifiers = themeModifiers[theme] || [];
    const combinedTerms: string[] = [];

    // Combine each keyword with theme modifiers
    keywords.forEach(keyword => {
      combinedTerms.push(keyword);
      modifiers.forEach(modifier => {
        combinedTerms.push(`${modifier} ${keyword}`);
      });
    });

    // Add theme-only searches
    combinedTerms.push(...modifiers);

    return combinedTerms;
  }

  /**
   * Create AI prompts based on lyrics and style
   */
  private createAIPrompts(
    keywords: string[],
    style: VideoStyle,
    transcriptions: TranscriptionResult[]
  ): string[] {
    const prompts: string[] = [];
    
    // Extract emotional context from lyrics
    const emotion = this.detectEmotion(transcriptions);
    
    // Create detailed prompts
    keywords.slice(0, 3).forEach(keyword => {
      const themeDescription = this.getThemeDescription(style.theme);
      const emotionDescription = this.getEmotionDescription(emotion);
      
      const prompt = `A ${emotionDescription} ${themeDescription} scene featuring ${keyword}, cinematic lighting, high quality, 4K resolution, smooth camera movement`;
      prompts.push(prompt);
    });

    return prompts;
  }

  /**
   * Detect emotion from lyrics (simplified)
   */
  private detectEmotion(transcriptions: TranscriptionResult[]): string {
    const text = transcriptions.map(t => t.text).join(' ').toLowerCase();
    
    const emotionWords = {
      happy: ['happy', 'joy', 'love', 'smile', 'laugh', 'celebrate', 'bright', 'shine'],
      sad: ['sad', 'cry', 'tears', 'lonely', 'miss', 'lost', 'dark', 'pain'],
      calm: ['peace', 'calm', 'quiet', 'soft', 'gentle', 'serene', 'still'],
      energetic: ['energy', 'dance', 'jump', 'fast', 'move', 'power', 'strong'],
    };

    let maxScore = 0;
    let dominantEmotion = 'calm';

    Object.entries(emotionWords).forEach(([emotion, words]) => {
      const score = words.reduce((count, word) => {
        return count + (text.includes(word) ? 1 : 0);
      }, 0);

      if (score > maxScore) {
        maxScore = score;
        dominantEmotion = emotion;
      }
    });

    return dominantEmotion;
  }

  /**
   * Get theme description for AI prompts
   */
  private getThemeDescription(theme: VideoStyle['theme']): string {
    const descriptions = {
      nature: 'natural, organic, peaceful outdoor',
      city: 'urban, modern, architectural',
      abstract: 'abstract, artistic, creative',
      minimal: 'minimalist, clean, simple',
      colorful: 'vibrant, colorful, dynamic',
    };
    return descriptions[theme];
  }

  /**
   * Get emotion description for AI prompts
   */
  private getEmotionDescription(emotion: string): string {
    const descriptions = {
      happy: 'uplifting, joyful, bright',
      sad: 'melancholic, moody, atmospheric',
      calm: 'peaceful, serene, tranquil',
      energetic: 'dynamic, energetic, powerful',
    };
    return descriptions[emotion as keyof typeof descriptions] || 'atmospheric';
  }

  /**
   * Poll RunwayML for generation completion
   */
  private async pollRunwayMLResult(taskId: string): Promise<string> {
    // Simplified polling - in real implementation, you'd poll until completion
    await new Promise<void>(resolve => setTimeout(() => resolve(), 10000)); // Wait 10 seconds
    return `https://runway-generated-video-${taskId}.mp4`;
  }

  /**
   * Get fallback videos when API calls fail
   */
  private getFallbackVideos(style: VideoStyle): BackgroundVideo[] {
    const fallbackUrls = {
      nature: [
        'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
        'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4',
      ],
      city: [
        'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
      ],
      abstract: [
        'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
      ],
      minimal: [
        'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
      ],
      colorful: [
        'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
      ],
    };

    const urls = fallbackUrls[style.theme] || fallbackUrls.nature;
    
    return urls.map((url, index) => ({
      id: `fallback-${style.theme}-${index}`,
      url,
      keywords: [style.theme],
      duration: 30,
      thumbnail: url,
      source: 'stock' as const,
    }));
  }

  /**
   * Mock Pexels videos for demo
   */
  private getMockPexelsVideos(query: string): BackgroundVideo[] {
    return [
      {
        id: `mock-pexels-${query}`,
        url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
        keywords: [query],
        duration: 30,
        thumbnail: 'https://via.placeholder.com/1280x720/0066cc/ffffff?text=Pexels+Video',
        source: 'stock',
      },
    ];
  }

  /**
   * Mock Unsplash videos for demo
   */
  private getMockUnsplashVideos(query: string): BackgroundVideo[] {
    return [
      {
        id: `mock-unsplash-${query}`,
        url: `https://via.placeholder.com/1920x1080/ff6b6b/ffffff?text=${encodeURIComponent(query)}`,
        keywords: [query],
        duration: 30,
        thumbnail: `https://via.placeholder.com/400x300/ff6b6b/ffffff?text=${encodeURIComponent(query)}`,
        source: 'stock',
      },
    ];
  }

  /**
   * Smart video selection based on lyrics timing
   */
  selectVideosForSegments(
    backgroundVideos: BackgroundVideo[],
    transcriptions: TranscriptionResult[]
  ): Array<{ video: BackgroundVideo; startTime: number; endTime: number }> {
    const segments: Array<{ video: BackgroundVideo; startTime: number; endTime: number }> = [];
    
    if (backgroundVideos.length === 0) return segments;

    const totalDuration = Math.max(...transcriptions.map(t => t.end));
    const segmentDuration = totalDuration / backgroundVideos.length;

    backgroundVideos.forEach((video, index) => {
      const startTime = index * segmentDuration;
      const endTime = Math.min((index + 1) * segmentDuration, totalDuration);
      
      segments.push({
        video,
        startTime,
        endTime,
      });
    });

    return segments;
  }
}

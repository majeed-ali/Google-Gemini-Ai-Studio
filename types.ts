
export interface ImageResult {
  id: string;
  base64: string;
}

export interface ImageContent {
  type: 'image_generation';
  prompt: string;
  images: ImageResult[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string | ImageContent;
  timestamp: string;
}

export type ImageStyle = 'Photorealistic' | 'Cartoon' | 'Pencil Sketch' | 'Hyper Realistic' | 'Anime' | 'Digital Art' | 'Minimalist';

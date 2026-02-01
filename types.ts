
export interface ImageState {
  original: string | null;
  edited: string | null;
  isProcessing: boolean;
  error: string | null;
}

export enum EditMode {
  NONE = 'NONE',
  BG_REMOVE = 'BG_REMOVE',
  CLOTHING = 'CLOTHING'
}

export interface ClothingOption {
  id: string;
  name: string;
  thumbnail: string;
  prompt: string;
  gender: 'male' | 'female';
}

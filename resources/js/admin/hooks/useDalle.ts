/**
 * useDalle hook
 * Generate images using DALL-E API
 */

import { useState } from 'react';
import { useApiMutation } from './useApi';

export interface DalleGenerateParams {
  prompt: string;
  size?: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792';
  quality?: 'standard' | 'hd';
  style?: 'vivid' | 'natural';
  n?: number;
}

export interface DalleImage {
  url: string;
  revisedPrompt?: string;
}

export interface DalleGenerateResult {
  images: DalleImage[];
  cost: number;
}

export function useDalleGenerate() {
  const [generatedImages, setGeneratedImages] = useState<DalleImage[]>([]);

  const mutation = useApiMutation<DalleGenerateResult, DalleGenerateParams>(
    '/admin/dalle/generate',
    'post'
  );

  const generate = async (params: DalleGenerateParams) => {
    const result = await mutation.mutateAsync(params);
    if (result?.images) {
      setGeneratedImages(result.images);
    }
    return result;
  };

  const reset = () => {
    setGeneratedImages([]);
  };

  return {
    generate,
    reset,
    images: generatedImages,
    isLoading: mutation.isPending,
    error: mutation.error,
    cost: mutation.data?.cost,
  };
}

export function useDalleEdit() {
  const mutation = useApiMutation<
    DalleGenerateResult,
    { image: File; mask?: File; prompt: string; size?: string; n?: number }
  >('/admin/dalle/edit', 'post');

  const edit = async (params: {
    image: File;
    mask?: File;
    prompt: string;
    size?: string;
    n?: number;
  }) => {
    const formData = new FormData();
    formData.append('image', params.image);
    if (params.mask) formData.append('mask', params.mask);
    formData.append('prompt', params.prompt);
    if (params.size) formData.append('size', params.size);
    if (params.n) formData.append('n', String(params.n));

    return mutation.mutateAsync(params);
  };

  return {
    edit,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}

export function useDalle() {
  const generateHook = useDalleGenerate();
  const editHook = useDalleEdit();

  return {
    ...generateHook,
    edit: editHook.edit,
    isEditing: editHook.isLoading,
  };
}

export default useDalle;

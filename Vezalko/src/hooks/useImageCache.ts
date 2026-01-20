'use client';

import { useState, useEffect, useRef } from 'react';

// Global image cache to avoid reloading the same images
const imageCache = new Map<string, HTMLImageElement>();
const loadingPromises = new Map<string, Promise<HTMLImageElement>>();

// Preload all images on module load
const PRELOAD_IMAGES = [
  '/assets/battery.png',
  '/assets/lamp.png',
  '/assets/resistor.png',
  '/assets/switch-off.png',
  '/assets/switch-on.png',
  '/assets/wire.png',
];

function loadImage(url: string): Promise<HTMLImageElement> {
  // Return cached image immediately
  if (imageCache.has(url)) {
    return Promise.resolve(imageCache.get(url)!);
  }

  // Return existing loading promise if already loading
  if (loadingPromises.has(url)) {
    return loadingPromises.get(url)!;
  }

  // Start loading
  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      imageCache.set(url, img);
      loadingPromises.delete(url);
      resolve(img);
    };
    
    img.onerror = () => {
      loadingPromises.delete(url);
      reject(new Error(`Failed to load image: ${url}`));
    };
    
    img.src = url;
  });

  loadingPromises.set(url, promise);
  return promise;
}

// Preload images immediately
if (typeof window !== 'undefined') {
  PRELOAD_IMAGES.forEach(url => loadImage(url).catch(() => {}));
}

export function useImageCache(url: string | undefined): HTMLImageElement | undefined {
  const [image, setImage] = useState<HTMLImageElement | undefined>(() => {
    // Check cache synchronously for instant render
    if (url && imageCache.has(url)) {
      return imageCache.get(url);
    }
    return undefined;
  });

  useEffect(() => {
    if (!url) {
      setImage(undefined);
      return;
    }

    // Check cache first
    if (imageCache.has(url)) {
      setImage(imageCache.get(url));
      return;
    }

    // Load image
    loadImage(url)
      .then(img => setImage(img))
      .catch(() => setImage(undefined));
  }, [url]);

  return image;
}

export function preloadImages(urls: string[]): Promise<void> {
  return Promise.all(urls.map(url => loadImage(url).catch(() => {}))).then(() => {});
}

export function getCachedImage(url: string): HTMLImageElement | undefined {
  return imageCache.get(url);
}

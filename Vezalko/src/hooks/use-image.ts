import { useState, useEffect } from 'react';

// Custom hook to load images for use with react-konva
export default function useImage(
  url: string | undefined
): [HTMLImageElement | undefined, 'loading' | 'loaded' | 'failed'] {
  const [image, setImage] = useState<HTMLImageElement | undefined>(undefined);
  const [status, setStatus] = useState<'loading' | 'loaded' | 'failed'>('loading');

  useEffect(() => {
    if (!url) {
      setImage(undefined);
      setStatus('failed');
      return;
    }

    const img = new window.Image();
    img.crossOrigin = 'anonymous';

    const onLoad = () => {
      setImage(img);
      setStatus('loaded');
    };

    const onError = () => {
      setImage(undefined);
      setStatus('failed');
    };

    img.addEventListener('load', onLoad);
    img.addEventListener('error', onError);
    img.src = url;

    return () => {
      img.removeEventListener('load', onLoad);
      img.removeEventListener('error', onError);
    };
  }, [url]);

  return [image, status];
}

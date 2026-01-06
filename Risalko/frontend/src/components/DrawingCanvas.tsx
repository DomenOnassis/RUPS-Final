'use client';

import { useRef, useState, useEffect } from 'react';

interface DrawingCanvasProps {
  onCanvasMount?: (canvas: HTMLCanvasElement) => void;
  initialImage?: string | null;
}

export default function DrawingCanvas({ onCanvasMount, initialImage }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);
  const [lastPosition, setLastPosition] = useState({ x: 0, y: 0 });
  const [showToolbar, setShowToolbar] = useState(false);
  const [customBrush, setCustomBrush] = useState('default');
  const [history, setHistory] = useState<ImageData[]>([]);
  const [redoHistory, setRedoHistory] = useState<ImageData[]>([]);
  const [tool, setTool] = useState<'brush' | 'bucket' | 'eraser'>('brush');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (onCanvasMount) {
      onCanvasMount(canvas);
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpiFactor = 2;

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (!parent) return;

      const parentWidth = parent.clientWidth;
      const parentHeight = parent.clientHeight;

      canvas.width = parentWidth * dpiFactor;
      canvas.height = parentHeight * dpiFactor;

      canvas.style.width = `${parentWidth}px`;
      canvas.style.height = `${parentHeight}px`;

      ctx.scale(dpiFactor, dpiFactor);

      if (initialImage) {
        const img = new Image();
        img.onload = () => {
          const canvasWidth = canvas.width / dpiFactor;
          const canvasHeight = canvas.height / dpiFactor;
          
          const imgAspect = img.width / img.height;
          const canvasAspect = canvasWidth / canvasHeight;
          
          let drawWidth = canvasWidth;
          let drawHeight = canvasHeight;
          
          if (imgAspect > canvasAspect) {
            drawHeight = canvasWidth / imgAspect;
          } else {
            drawWidth = canvasHeight * imgAspect;
          }
          
          const x = (canvasWidth - drawWidth) / 2;
          const y = (canvasHeight - drawHeight) / 2;
          
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvasWidth, canvasHeight);
          
          ctx.drawImage(img, x, y, drawWidth, drawHeight);
        };
        img.src = initialImage;
      } else {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width / dpiFactor, canvas.height / dpiFactor);
      }
    };

    resizeCanvas();

    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [initialImage, onCanvasMount]);

  const saveState = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => [...prev, snapshot]);
    setRedoHistory([]);
  };

  const undo = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || history.length === 0) return;

    const currentState = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setRedoHistory((prev) => [...prev, currentState]);

    const previousState = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    ctx.putImageData(previousState, 0, 0);
  };

  const redo = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || redoHistory.length === 0) return;

    const nextState = redoHistory[redoHistory.length - 1];
    setRedoHistory((prev) => prev.slice(0, -1));

    const currentState = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => [...prev, currentState]);

    ctx.putImageData(nextState, 0, 0);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        undo();
      } else if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'Z')) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [undo, redo]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (tool === 'bucket') {
      handleCanvasClick(e);
      return;
    }

    saveState();
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;

    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    setLastPosition({ x, y });
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;

    if ('touches' in e) {
      e.preventDefault();
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    if (tool === 'eraser') {
      ctx.clearRect(x - brushSize / 2, y - brushSize / 2, brushSize, brushSize);
      ctx.beginPath();
      ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0)';
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      setLastPosition({ x, y });
      return;
    }

    ctx.beginPath();
    ctx.moveTo(lastPosition.x, lastPosition.y);
    ctx.lineTo(x, y);

    ctx.strokeStyle = color;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (customBrush === 'watercolor') {
      ctx.globalAlpha = 0.3;
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, brushSize);
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.fillRect(x - brushSize, y - brushSize, brushSize * 2, brushSize * 2);
    } else if (customBrush === 'texture') {
      const patternCanvas = document.createElement('canvas');
      const patternCtx = patternCanvas.getContext('2d');
      if (patternCtx) {
        patternCanvas.width = brushSize;
        patternCanvas.height = brushSize;
        patternCtx.fillStyle = color;
        patternCtx.fillRect(0, 0, brushSize, brushSize);
        patternCtx.strokeStyle = 'white';
        patternCtx.lineWidth = 2;
        patternCtx.strokeRect(0, 0, brushSize, brushSize);
        const pattern = ctx.createPattern(patternCanvas, 'repeat');
        if (pattern) {
          ctx.fillStyle = pattern;
          ctx.fillRect(x - brushSize, y - brushSize, brushSize * 2, brushSize * 2);
        }
      }
    } else {
      ctx.globalAlpha = 1;
      ctx.stroke();
    }

    setLastPosition({ x, y });
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const floodFill = (startX: number, startY: number, fillColor: string) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    saveState();

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    const width = canvas.width;
    const height = canvas.height;

    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;
    
    tempCtx.fillStyle = fillColor;
    tempCtx.fillRect(0, 0, 1, 1);
    const fillColorData = tempCtx.getImageData(0, 0, 1, 1).data;
    const fillR = fillColorData[0];
    const fillG = fillColorData[1];
    const fillB = fillColorData[2];

    const dpiFactor = 2;
    const scaledX = Math.floor(startX * dpiFactor);
    const scaledY = Math.floor(startY * dpiFactor);
    
    const startPos = (scaledY * width + scaledX) * 4;
    const startR = pixels[startPos];
    const startG = pixels[startPos + 1];
    const startB = pixels[startPos + 2];

    if (startR === fillR && startG === fillG && startB === fillB) {
      return;
    }

    const pixelStack: [number, number][] = [[scaledX, scaledY]];
    const visited = new Set<string>();

    const matchesStartColor = (x: number, y: number): boolean => {
      if (x < 0 || x >= width || y < 0 || y >= height) return false;
      
      const pos = (y * width + x) * 4;
      return (
        pixels[pos] === startR &&
        pixels[pos + 1] === startG &&
        pixels[pos + 2] === startB
      );
    };

    const setPixel = (x: number, y: number) => {
      const pos = (y * width + x) * 4;
      pixels[pos] = fillR;
      pixels[pos + 1] = fillG;
      pixels[pos + 2] = fillB;
      pixels[pos + 3] = 255;
    };

    while (pixelStack.length > 0) {
      const [x, y] = pixelStack.pop()!;
      const key = `${x},${y}`;
      
      if (visited.has(key)) continue;
      visited.add(key);

      if (!matchesStartColor(x, y)) continue;

      setPixel(x, y);

      pixelStack.push([x + 1, y]);
      pixelStack.push([x - 1, y]);
      pixelStack.push([x, y + 1]);
      pixelStack.push([x, y - 1]);
    }

    ctx.putImageData(imageData, 0, 0);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (tool !== 'bucket') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;

    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    floodFill(x, y, color);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.globalAlpha = 1;
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const saveDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `risalko-drawing-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const colorPresets = [
    '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
    '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080',
    '#FFC0CB', '#A52A2A', '#808080', '#90EE90', '#FFD700'
  ];

  return (
    <div className="relative w-full h-[90vh] flex flex-col">
      {showToolbar && (
        <div className="absolute top-0 left-0 w-full bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 dark:from-pink-700 dark:via-purple-700 dark:to-blue-700 text-white p-4 z-10 rounded-3xl m-2 shadow-2xl border-4 border-yellow-300">
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm">Orodje:</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setTool('brush')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    tool === 'brush'
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  🖌️ Čopič
                </button>
                <button
                  onClick={() => setTool('bucket')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    tool === 'bucket'
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  🪣 Vedro
                </button>
                <button
                  onClick={() => setTool('eraser')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    tool === 'eraser'
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  🧹 Radirka
                </button>
              </div>
            </div>

            {tool === 'brush' && (
              <div className="flex items-center gap-2 bg-white/20 rounded-full px-4 py-2">
                <label className="text-lg font-black">🖌️ Čopič:</label>
                <select
                  value={customBrush}
                  onChange={(e) => setCustomBrush(e.target.value)}
                  className="px-3 py-2 rounded-full bg-white text-purple-700 font-bold border-2 border-yellow-400"
                >
                  <option value="default">Navaden ✏️</option>
                  <option value="watercolor">Vodene barve 💧</option>
                  <option value="texture">Tekstura ✨</option>
                </select>
              </div>
            )}

            <div className="flex gap-2">
              {colorPresets.map((presetColor) => (
                <button
                  key={presetColor}
                  onClick={() => setColor(presetColor)}
                  className={`w-10 h-10 rounded-full border-4 transition-transform hover:scale-125 shadow-lg ${
                    color === presetColor ? 'border-yellow-300 scale-125 ring-4 ring-white' : 'border-white'
                  }`}
                  style={{ backgroundColor: presetColor }}
                  title={presetColor}
                />
              ))}
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-10 h-10 rounded-full cursor-pointer border-4 border-white shadow-lg"
                title="🎨 Izberi poljubno barvo"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={undo}
                className="px-4 py-2 bg-yellow-400 text-purple-800 rounded-full hover:bg-yellow-500 transition-colors font-black shadow-lg transform hover:scale-110 border-2 border-white text-xl"
              >
                ↩️
              </button>
              <button
                onClick={redo}
                className="px-4 py-2 bg-yellow-400 text-purple-800 rounded-full hover:bg-yellow-500 transition-colors font-black shadow-lg transform hover:scale-110 border-2 border-white text-xl"
              >
                ↪️ Naprej
              </button>
              <button
                onClick={clearCanvas}
                className="px-4 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors font-black shadow-lg transform hover:scale-110 border-2 border-white text-xl"
              >
                🗑️ Počisti
              </button>
              <button
                onClick={saveDrawing}
                className="px-4 py-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors font-black shadow-lg transform hover:scale-110 border-2 border-white text-xl"
              >
                � Shrani
              </button>
            </div>

            <div className="flex items-center gap-2">
              <label
                className="text-sm"
                style={{ width: '150px', display: 'inline-block' }}
              >
                Velikost čopiča: {brushSize}px
              </label>
              <input
                type="range"
                min="1"
                max="50"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-32 appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #90EE90, #FFD700)`,
                  height: `${brushSize / 2}px`,
                  borderRadius: '10px',
                  transition: 'height 0.2s ease',
                }}
              />
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setShowToolbar(!showToolbar)}
        className="absolute bottom-4 right-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-full z-20 hover:from-pink-600 hover:to-purple-700 transition-colors font-black text-lg shadow-2xl transform hover:scale-110 border-4 border-yellow-300"
      >
        {showToolbar ? '🎨 Skrij Orodja' : '🎨 Prikaži Orodja'}
      </button>

      <div className="border-8 border-rainbow rounded-3xl overflow-hidden bg-white flex-1 shadow-2xl" style={{borderImage: 'linear-gradient(45deg, #FF6B6B, #FFD93D, #6BCF7F, #4ECDC4, #C44569) 1'}}>
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className={`w-full h-full touch-none ${
            tool === 'bucket' ? 'cursor-pointer' : 'cursor-crosshair'
          }`}
        />
      </div>
    </div>
  );
}

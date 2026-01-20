'use client';

import React, { useRef, useEffect, useState, useCallback, useMemo, memo } from 'react';
import { Stage, Layer, Rect, Circle, Image as KonvaImage, Group } from 'react-konva';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { ComponentType, SimulationResult } from '@/logic/CircuitGraph';
import { useImageCache, preloadImages } from '@/hooks/useImageCache';

// Component images
const COMPONENT_IMAGES: Record<string, string> = {
  battery: '/assets/battery.png',
  bulb: '/assets/lamp.png',
  resistor: '/assets/resistor.png',
  switch: '/assets/switch-off.png',
  'switch-on': '/assets/switch-on.png',
  wire: '/assets/wire.png',
};

// Preload all images on component mount
const ALL_IMAGES = Object.values(COMPONENT_IMAGES);

interface DraggableComponentProps {
  id: string;
  type: ComponentType;
  x: number;
  y: number;
  rotation: number;
  isOn?: boolean;
  isLit?: boolean;
  isSelected?: boolean;
  onDragEnd: (id: string, x: number, y: number) => void;
  onDoubleClick: (id: string) => void;
  onRightClick: (id: string) => void;
  onClick: (id: string) => void;
}

// Memoized component to prevent re-renders
const DraggableComponent = memo(function DraggableComponent({
  id,
  type,
  x,
  y,
  rotation,
  isOn,
  isLit,
  isSelected,
  onDragEnd,
  onDoubleClick,
  onRightClick,
  onClick,
}: DraggableComponentProps) {
  const imageSrc = type === 'switch' && isOn 
    ? COMPONENT_IMAGES['switch-on'] 
    : COMPONENT_IMAGES[type];
  const image = useImageCache(imageSrc);
  
  const handleDragEnd = useCallback((e: any) => {
    onDragEnd(id, e.target.x(), e.target.y());
  }, [id, onDragEnd]);

  const handleDblClick = useCallback(() => {
    onDoubleClick(id);
  }, [id, onDoubleClick]);

  const handleContextMenu = useCallback((e: any) => {
    e.evt.preventDefault();
    onRightClick(id);
  }, [id, onRightClick]);

  const handleClick = useCallback(() => {
    onClick(id);
  }, [id, onClick]);

  return (
    <Group
      x={x}
      y={y}
      rotation={rotation}
      draggable
      onDragEnd={handleDragEnd}
      onDblClick={handleDblClick}
      onContextMenu={handleContextMenu}
      onClick={handleClick}
      perfectDrawEnabled={false}
    >
      {/* Selection indicator */}
      {isSelected && (
        <Rect
          x={-45}
          y={-45}
          width={90}
          height={90}
          stroke="#6366F1"
          strokeWidth={3}
          cornerRadius={8}
          dash={[5, 5]}
          listening={false}
          perfectDrawEnabled={false}
        />
      )}
      
      {/* Glow effect for lit bulbs - simplified */}
      {type === 'bulb' && isLit && (
        <Circle
          x={0}
          y={0}
          radius={45}
          fill="rgba(255, 220, 100, 0.4)"
          listening={false}
          perfectDrawEnabled={false}
        />
      )}
      
      {/* Component image */}
      {image && (
        <KonvaImage
          image={image}
          x={-40}
          y={-40}
          width={80}
          height={80}
          listening={false}
          perfectDrawEnabled={false}
        />
      )}
      
      {/* Connection points (nodes) - hidden for performance */}
      <Circle x={-40} y={0} radius={8} fill="#6366F1" opacity={0.8} listening={false} />
      <Circle x={40} y={0} radius={8} fill="#6366F1" opacity={0.8} listening={false} />
    </Group>
  );
}, (prevProps, nextProps) => {
  // Custom comparison - only re-render if essential props change
  return (
    prevProps.x === nextProps.x &&
    prevProps.y === nextProps.y &&
    prevProps.rotation === nextProps.rotation &&
    prevProps.isOn === nextProps.isOn &&
    prevProps.isLit === nextProps.isLit &&
    prevProps.isSelected === nextProps.isSelected
  );
});

interface ComponentPanelItemProps {
  type: ComponentType;
  label: string;
  onDragStart: (type: ComponentType) => void;
}

const ComponentPanelItem = memo(function ComponentPanelItem({ type, label, onDragStart }: ComponentPanelItemProps) {
  const imageSrc = COMPONENT_IMAGES[type];

  const handleDragStart = useCallback(() => {
    onDragStart(type);
  }, [type, onDragStart]);

  return (
    <div
      className="component-item"
      draggable
      onDragStart={handleDragStart}
    >
      <img src={imageSrc} alt={label} width={60} height={60} loading="eager" />
      <span>{label}</span>
    </div>
  );
});

interface ElectricWorkspaceProps {
  challengeMode?: boolean;
  challengeComponents?: ComponentType[];
  onCheckSolution?: () => void;
}

export default function ElectricWorkspace({
  challengeMode = false,
  challengeComponents,
  onCheckSolution,
}: ElectricWorkspaceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [draggingType, setDraggingType] = useState<ComponentType | null>(null);
  const [isReady, setIsReady] = useState(false);
  
  const {
    components,
    selectedComponentId,
    litBulbs,
    simulationResult,
    zoom,
    panX,
    panY,
    gridSize,
    panelWidth,
    addComponent,
    removeComponent,
    updateComponent,
    rotateComponent,
    toggleSwitch,
    selectComponent,
    setZoom,
    setPan,
    undo,
    redo,
    clear,
  } = useWorkspaceStore();

  // Available components for the panel
  const availableComponents = useMemo(() => 
    challengeComponents
      ? challengeComponents.map(type => ({ type, label: type.charAt(0).toUpperCase() + type.slice(1) }))
      : [
          { type: 'battery' as ComponentType, label: 'Battery' },
          { type: 'bulb' as ComponentType, label: 'Bulb' },
          { type: 'resistor' as ComponentType, label: 'Resistor' },
          { type: 'switch' as ComponentType, label: 'Switch' },
          { type: 'wire' as ComponentType, label: 'Wire' },
        ],
    [challengeComponents]
  );

  // Preload images and set ready state
  useEffect(() => {
    preloadImages(ALL_IMAGES).then(() => {
      setIsReady(true);
    });
  }, []);

  // Handle window resize with debounce
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    const debouncedUpdate = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateDimensions, 100);
    };

    updateDimensions();
    window.addEventListener('resize', debouncedUpdate);
    return () => {
      window.removeEventListener('resize', debouncedUpdate);
      clearTimeout(timeoutId);
    };
  }, []);

  // Handle keyboard shortcuts including arrow keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete component
      if (e.key === 'Delete' && selectedComponentId) {
        removeComponent(selectedComponentId);
        return;
      }
      
      // Undo/Redo
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        undo();
        return;
      }
      if (e.ctrlKey && e.key === 'y') {
        e.preventDefault();
        redo();
        return;
      }
      
      // Arrow keys to move selected component
      if (selectedComponentId && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const component = components.find(c => c.id === selectedComponentId);
        if (!component) return;
        
        const moveAmount = e.shiftKey ? 1 : gridSize; // Fine movement with Shift
        let newX = component.x;
        let newY = component.y;
        
        switch (e.key) {
          case 'ArrowUp': newY -= moveAmount; break;
          case 'ArrowDown': newY += moveAmount; break;
          case 'ArrowLeft': newX -= moveAmount; break;
          case 'ArrowRight': newX += moveAmount; break;
        }
        
        // Snap to grid if not holding shift
        if (!e.shiftKey) {
          const snapped = useWorkspaceStore.getState().snapToGrid(newX, newY);
          newX = snapped.x;
          newY = snapped.y;
        }
        
        // Check if position is valid
        if (newX > panelWidth && !useWorkspaceStore.getState().isPositionOccupied(newX, newY, selectedComponentId)) {
          updateComponent(selectedComponentId, { x: newX, y: newY });
          useWorkspaceStore.getState().simulate();
        }
        return;
      }
      
      // R to rotate selected component
      if (e.key === 'r' && selectedComponentId) {
        rotateComponent(selectedComponentId);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedComponentId, components, gridSize, panelWidth, removeComponent, updateComponent, rotateComponent, undo, redo]);

  const handleDragStart = useCallback((type: ComponentType) => {
    setDraggingType(type);
  }, []);

  const handleStageDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (draggingType && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - panelWidth - panX) / zoom;
      const y = (e.clientY - rect.top - panY) / zoom;
      addComponent(draggingType, x + panelWidth, y);
      setDraggingType(null);
    }
  }, [draggingType, addComponent, panelWidth, panX, panY, zoom]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleComponentDragEnd = useCallback((id: string, x: number, y: number) => {
    const { snapToGrid, isPositionOccupied, saveToHistory, simulate } = useWorkspaceStore.getState();
    const snapped = snapToGrid(x + panelWidth, y);
    
    if (!isPositionOccupied(snapped.x, snapped.y, id) && snapped.x > panelWidth) {
      updateComponent(id, { x: snapped.x, y: snapped.y });
      saveToHistory();
      // Only simulate after drag ends - not during drag
      simulate();
    }
  }, [panelWidth, updateComponent]);

  const handleComponentDoubleClick = useCallback((id: string) => {
    const component = components.find(c => c.id === id);
    if (component?.type === 'switch') {
      toggleSwitch(id);
    } else {
      rotateComponent(id);
    }
  }, [components, toggleSwitch, rotateComponent]);

  const handleComponentRightClick = useCallback((id: string) => {
    removeComponent(id);
  }, [removeComponent]);

  const handleWheel = useCallback((e: any) => {
    e.evt.preventDefault();
    const scaleBy = 1.1;
    const newZoom = e.evt.deltaY < 0 ? zoom * scaleBy : zoom / scaleBy;
    setZoom(Math.max(0.5, Math.min(2, newZoom)));
  }, [zoom, setZoom]);

  const handleStageClick = useCallback((e: any) => {
    if (e.target === e.target.getStage()) {
      selectComponent(null);
    }
  }, [selectComponent]);

  // Status message
  const status = useMemo(() => {
    switch (simulationResult) {
      case SimulationResult.CLOSED_CIRCUIT:
        return { text: '✓ Circuit Complete - Current Flowing!', color: '#22C55E' };
      case SimulationResult.OPEN_CIRCUIT:
        return { text: '○ Open Circuit - Connect all components', color: '#F59E0B' };
      case SimulationResult.NO_BATTERY:
        return { text: '⚡ Add a battery to power the circuit', color: '#737373' };
      case SimulationResult.SWITCH_OFF:
        return { text: '⏻ Switch is OFF - Double-click to toggle', color: '#6366F1' };
      default:
        return { text: '', color: '#737373' };
    }
  }, [simulationResult]);

  // Convert litBulbs Set to array for stable comparison
  const litBulbsArray = useMemo(() => Array.from(litBulbs), [litBulbs]);

  // Show loading state until images are ready
  if (!isReady) {
    return (
      <div ref={containerRef} className="workspace-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '10px' }}>⚡</div>
          <div>Loading workspace...</div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className="workspace-container"
      onDrop={handleStageDrop}
      onDragOver={handleDragOver}
    >
      {/* Component Panel */}
      <div className="component-panel">
        <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem', fontWeight: 600, color: '#171717' }}>
          Components
        </h3>
        {availableComponents.map(({ type, label }) => (
          <ComponentPanelItem
            key={type}
            type={type}
            label={label}
            onDragStart={handleDragStart}
          />
        ))}
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <button className="toolbar-btn" onClick={undo} title="Undo (Ctrl+Z)">
          ↩ Undo
        </button>
        <button className="toolbar-btn" onClick={redo} title="Redo (Ctrl+Y)">
          ↪ Redo
        </button>
        <button className="toolbar-btn" onClick={() => setZoom(zoom + 0.1)}>
          🔍+
        </button>
        <button className="toolbar-btn" onClick={() => setZoom(zoom - 0.1)}>
          🔍-
        </button>
        <button className="toolbar-btn" onClick={clear}>
          🗑 Clear
        </button>
        {challengeMode && onCheckSolution && (
          <button 
            className="btn btn-success" 
            onClick={onCheckSolution}
            style={{ marginLeft: '1rem' }}
          >
            ✓ Check Solution
          </button>
        )}
      </div>

      {/* Status Bar */}
      <div style={{
        position: 'absolute',
        bottom: '1rem',
        left: '220px',
        padding: '0.75rem 1.5rem',
        background: 'white',
        borderRadius: '0.5rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        zIndex: 10,
      }}>
        <span style={{ color: status.color, fontWeight: 600 }}>
          {status.text}
        </span>
      </div>

      {/* CSS Grid Background - much faster than Konva lines */}
      <div 
        style={{
          position: 'absolute',
          left: panelWidth,
          top: 0,
          width: dimensions.width - panelWidth,
          height: dimensions.height,
          backgroundImage: `
            linear-gradient(to right, #e5e5e5 1px, transparent 1px),
            linear-gradient(to bottom, #e5e5e5 1px, transparent 1px)
          `,
          backgroundSize: `${gridSize * zoom}px ${gridSize * zoom}px`,
          backgroundPosition: `${panX % (gridSize * zoom)}px ${panY % (gridSize * zoom)}px`,
          backgroundColor: '#fafafa',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Canvas */}
      <Stage
        width={dimensions.width - panelWidth}
        height={dimensions.height}
        x={panX}
        y={panY}
        scaleX={zoom}
        scaleY={zoom}
        onWheel={handleWheel}
        onClick={handleStageClick}
        style={{ position: 'absolute', left: panelWidth, top: 0, zIndex: 1 }}
      >
        {/* Components */}
        <Layer>
          {components.map(comp => (
            <DraggableComponent
              key={comp.id}
              id={comp.id}
              type={comp.type}
              x={comp.x - panelWidth}
              y={comp.y}
              rotation={comp.rotation}
              isOn={comp.isOn}
              isLit={litBulbsArray.includes(comp.id)}
              isSelected={selectedComponentId === comp.id}
              onDragEnd={(id, x, y) => handleComponentDragEnd(id, x, y)}
              onDoubleClick={handleComponentDoubleClick}
              onRightClick={handleComponentRightClick}
              onClick={selectComponent}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
}

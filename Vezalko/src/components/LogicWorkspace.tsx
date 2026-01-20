'use client';

import React, { useRef, useEffect, useState, useCallback, useMemo, memo } from 'react';
import { Stage, Layer, Rect, Circle, Line, Group, Text } from 'react-konva';
import { useLogicWorkspaceStore } from '@/store/logicWorkspaceStore';
import { LogicGateType, getInputOffsets, getOutputOffset } from '@/logic/LogicCircuitGraph';

// Gate colors
const GATE_COLORS: Record<LogicGateType, string> = {
  'and': '#6366F1',
  'or': '#8B5CF6',
  'not': '#EC4899',
  'nand': '#14B8A6',
  'nor': '#F59E0B',
  'xor': '#EF4444',
  'xnor': '#22C55E',
  'wire': '#737373',
  'input-0': '#EF4444',
  'input-1': '#22C55E',
  'output': '#6366F1',
};

interface LogicGateProps {
  id: string;
  type: LogicGateType;
  x: number;
  y: number;
  rotation: number;
  value?: number;
  isSelected?: boolean;
  onDragEnd: (id: string, x: number, y: number) => void;
  onDoubleClick: (id: string) => void;
  onRightClick: (id: string) => void;
  onClick: (id: string) => void;
}

// Memoized LogicGate component
const LogicGate = memo(function LogicGate({
  id,
  type,
  x,
  y,
  rotation,
  value,
  isSelected,
  onDragEnd,
  onDoubleClick,
  onRightClick,
  onClick,
}: LogicGateProps) {
  const color = GATE_COLORS[type];
  const inputOffsets = getInputOffsets(type, 0);
  const outputOffset = getOutputOffset(0);

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

  // Render gate shape based on type
  const gateShape = useMemo(() => {
    if (type === 'input-0' || type === 'input-1') {
      return (
        <>
          <Circle x={0} y={0} radius={25} fill={color} listening={false} />
          <Text
            x={-10}
            y={-12}
            text={type === 'input-0' ? '0' : '1'}
            fontSize={24}
            fontStyle="bold"
            fill="white"
            listening={false}
          />
        </>
      );
    }

    if (type === 'output') {
      const outputColor = value === 1 ? '#22C55E' : value === 0 ? '#EF4444' : '#737373';
      return (
        <>
          <Circle x={0} y={0} radius={25} fill={outputColor} listening={false} />
          <Text
            x={-8}
            y={-12}
            text={value !== undefined ? String(value) : '?'}
            fontSize={24}
            fontStyle="bold"
            fill="white"
            listening={false}
          />
        </>
      );
    }

    if (type === 'wire') {
      return (
        <Line
          points={[-40, 0, 40, 0]}
          stroke={color}
          strokeWidth={4}
          lineCap="round"
          listening={false}
        />
      );
    }

    // Standard gate shape
    return (
      <>
        <Rect
          x={-35}
          y={-25}
          width={70}
          height={50}
          fill={color}
          cornerRadius={8}
          listening={false}
        />
        <Text
          x={-30}
          y={-10}
          width={60}
          text={type.toUpperCase()}
          fontSize={type.length > 3 ? 10 : 14}
          fontStyle="bold"
          fill="white"
          align="center"
          listening={false}
        />
        
        {inputOffsets.map((offset, i) => (
          <Circle
            key={`input-${i}`}
            x={offset.x}
            y={offset.y}
            radius={6}
            fill="#4B5563"
            stroke="white"
            strokeWidth={2}
            listening={false}
          />
        ))}
        
        <Circle
          x={outputOffset.x}
          y={outputOffset.y}
          radius={6}
          fill={value === 1 ? '#22C55E' : value === 0 ? '#EF4444' : '#9CA3AF'}
          stroke="white"
          strokeWidth={2}
          listening={false}
        />
      </>
    );
  }, [type, color, value, inputOffsets, outputOffset]);

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
      {isSelected && (
        <Rect
          x={-45}
          y={-35}
          width={90}
          height={70}
          stroke="#6366F1"
          strokeWidth={3}
          cornerRadius={8}
          dash={[5, 5]}
          listening={false}
          perfectDrawEnabled={false}
        />
      )}
      {gateShape}
    </Group>
  );
}, (prevProps, nextProps) => {
  // Custom comparison - only re-render if essential props change
  return (
    prevProps.x === nextProps.x &&
    prevProps.y === nextProps.y &&
    prevProps.rotation === nextProps.rotation &&
    prevProps.value === nextProps.value &&
    prevProps.isSelected === nextProps.isSelected
  );
});

interface ComponentPanelItemProps {
  type: LogicGateType;
  label: string;
  onDragStart: (type: LogicGateType) => void;
}

const LogicPanelItem = memo(function LogicPanelItem({ type, label, onDragStart }: ComponentPanelItemProps) {
  const color = GATE_COLORS[type];

  const handleDragStart = useCallback(() => {
    onDragStart(type);
  }, [type, onDragStart]);

  return (
    <div
      className="component-item"
      draggable
      onDragStart={handleDragStart}
      style={{ borderLeftColor: color, borderLeftWidth: 4 }}
    >
      <div style={{
        width: 60,
        height: 40,
        background: color,
        borderRadius: 6,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: 'bold',
        fontSize: type.length > 3 ? 10 : 12,
      }}>
        {type === 'input-0' ? '0' : type === 'input-1' ? '1' : type === 'output' ? 'OUT' : type.toUpperCase()}
      </div>
      <span>{label}</span>
    </div>
  );
});

interface LogicWorkspaceProps {
  challengeMode?: boolean;
  challengeComponents?: LogicGateType[];
  onCheckSolution?: () => void;
}

export default function LogicWorkspace({
  challengeMode = false,
  challengeComponents,
  onCheckSolution,
}: LogicWorkspaceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [draggingType, setDraggingType] = useState<LogicGateType | null>(null);
  const [isReady, setIsReady] = useState(false);
  
  const {
    components,
    selectedComponentId,
    zoom,
    panX,
    panY,
    gridSize,
    panelWidth,
    addComponent,
    removeComponent,
    updateComponent,
    rotateComponent,
    selectComponent,
    setZoom,
    setPan,
    undo,
    redo,
    clear,
    getOutputValues,
  } = useLogicWorkspaceStore();

  // Available components
  const availableComponents = useMemo(() => 
    challengeComponents
      ? challengeComponents.map(type => ({ type, label: type.toUpperCase() }))
      : [
          { type: 'input-1' as LogicGateType, label: 'Input 1' },
          { type: 'input-0' as LogicGateType, label: 'Input 0' },
          { type: 'output' as LogicGateType, label: 'Output' },
          { type: 'wire' as LogicGateType, label: 'Wire' },
          { type: 'and' as LogicGateType, label: 'AND' },
          { type: 'or' as LogicGateType, label: 'OR' },
          { type: 'not' as LogicGateType, label: 'NOT' },
          { type: 'nand' as LogicGateType, label: 'NAND' },
          { type: 'nor' as LogicGateType, label: 'NOR' },
          { type: 'xor' as LogicGateType, label: 'XOR' },
          { type: 'xnor' as LogicGateType, label: 'XNOR' },
        ],
    [challengeComponents]
  );

  // Set ready after mount
  useEffect(() => {
    setIsReady(true);
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

  // Handle keyboard shortcuts
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
          const snapped = useLogicWorkspaceStore.getState().snapToGrid(newX, newY);
          newX = snapped.x;
          newY = snapped.y;
        }
        
        // Check if position is valid
        if (newX > panelWidth && !useLogicWorkspaceStore.getState().isPositionOccupied(newX, newY, selectedComponentId)) {
          updateComponent(selectedComponentId, { x: newX, y: newY });
          useLogicWorkspaceStore.getState().simulate();
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

  const handleDragStart = useCallback((type: LogicGateType) => {
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
    const { snapToGrid, isPositionOccupied, saveToHistory, simulate } = useLogicWorkspaceStore.getState();
    const snapped = snapToGrid(x + panelWidth, y);
    
    if (!isPositionOccupied(snapped.x, snapped.y, id) && snapped.x > panelWidth) {
      updateComponent(id, { x: snapped.x, y: snapped.y });
      saveToHistory();
      simulate();
    }
  }, [panelWidth, updateComponent]);

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

  // Get output status
  const outputStatus = useMemo(() => {
    const outputs = getOutputValues();
    return outputs.length > 0
      ? outputs.map(o => `Output: ${o.value !== undefined ? o.value : '?'}`).join(' | ')
      : 'Add an output component to see results';
  }, [getOutputValues]);

  // Show loading state
  if (!isReady) {
    return (
      <div ref={containerRef} className="workspace-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '10px' }}>🔌</div>
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
          Logic Gates
        </h3>
        {availableComponents.map(({ type, label }) => (
          <LogicPanelItem
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
        <span style={{ color: '#6366F1', fontWeight: 600 }}>
          {outputStatus}
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
            <LogicGate
              key={comp.id}
              id={comp.id}
              type={comp.type}
              x={comp.x - panelWidth}
              y={comp.y}
              rotation={comp.rotation}
              value={comp.value}
              isSelected={selectedComponentId === comp.id}
              onDragEnd={(id, x, y) => handleComponentDragEnd(id, x, y)}
              onDoubleClick={rotateComponent}
              onRightClick={removeComponent}
              onClick={selectComponent}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
}

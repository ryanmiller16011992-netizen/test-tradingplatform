'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

interface ResizablePanelProps {
  children: React.ReactNode;
  direction: 'horizontal' | 'vertical';
  initialSize?: number;
  minSize?: number;
  maxSize?: number;
  storageKey?: string;
  className?: string;
}

export default function ResizablePanel({
  children,
  direction,
  initialSize,
  minSize = 200,
  maxSize,
  storageKey,
  className = '',
}: ResizablePanelProps) {
  const [size, setSize] = useState(() => {
    if (storageKey && typeof window !== 'undefined') {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= minSize && (!maxSize || parsed <= maxSize)) {
          return parsed;
        }
      }
    }
    return initialSize || (direction === 'horizontal' ? 320 : 256);
  });

  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const startPosRef = useRef(0);
  const startSizeRef = useRef(0);
  const isResizingRef = useRef(false);

  useEffect(() => {
    if (storageKey && typeof window !== 'undefined') {
      localStorage.setItem(storageKey, size.toString());
    }
  }, [size, storageKey]);

  useEffect(() => {
    isResizingRef.current = isResizing;
  }, [isResizing]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizingRef.current) return;
    
    let delta: number;
    if (direction === 'horizontal') {
      delta = e.clientX - startPosRef.current;
    } else {
      // For vertical: dragging up (negative deltaY) should increase size
      // Dragging down (positive deltaY) should decrease size
      delta = -(e.clientY - startPosRef.current);
    }
    
    let newSize = startSizeRef.current + delta;
    
    if (newSize < minSize) newSize = minSize;
    if (maxSize && newSize > maxSize) newSize = maxSize;
    
    setSize(newSize);
  }, [direction, minSize, maxSize]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    isResizingRef.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    isResizingRef.current = true;
    startPosRef.current = direction === 'horizontal' ? e.clientX : e.clientY;
    startSizeRef.current = size;
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [direction, size, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const style: React.CSSProperties = {
    [direction === 'horizontal' ? 'width' : 'height']: `${size}px`,
    [direction === 'horizontal' ? 'minWidth' : 'minHeight']: `${minSize}px`,
    ...(maxSize && { [direction === 'horizontal' ? 'maxWidth' : 'maxHeight']: `${maxSize}px` }),
  };

  return (
    <div
      ref={panelRef}
      className={`relative flex-shrink-0 ${className}`}
      style={style}
    >
      {children}
      <div
        onMouseDown={handleMouseDown}
        className={`absolute bg-transparent hover:bg-blue-500/30 dark:hover:bg-blue-400/30 transition-colors z-50 ${
          direction === 'horizontal' 
            ? 'right-0 top-0 bottom-0 w-3' 
            : 'top-0 left-0 right-0 h-3'
        } ${isResizing ? 'bg-blue-500/60 dark:bg-blue-400/60' : ''}`}
        style={{
          cursor: direction === 'horizontal' ? 'col-resize' : 'row-resize',
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}
      >
        <div
          className={`absolute pointer-events-none ${
            direction === 'horizontal'
              ? 'right-1 top-1/2 -translate-y-1/2 w-1 h-16 bg-blue-500 dark:bg-blue-400 rounded-full opacity-70 hover:opacity-100 transition-opacity'
              : 'top-1 left-1/2 -translate-x-1/2 h-1 w-16 bg-blue-500 dark:bg-blue-400 rounded-full opacity-70 hover:opacity-100 transition-opacity'
          }`}
        />
      </div>
    </div>
  );
}


'use client';

import React, { useState, useRef, useEffect } from 'react';
import Draggable from 'react-draggable';
import { Instrument, PriceTick } from '@/types';
import api from '@/lib/api';

interface TradingPanelProps {
  instrument: Instrument | null;
  currentPrice: PriceTick | null;
  onClose?: () => void;
  draggable?: boolean;
}

export default function TradingPanel({ instrument, currentPrice, onClose, draggable = false }: TradingPanelProps) {
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [quantity, setQuantity] = useState(0.01);
  const [orderType, setOrderType] = useState<'market' | 'limit' | 'stop'>('market');
  const [price, setPrice] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [stopLossEnabled, setStopLossEnabled] = useState(false);
  const [takeProfitEnabled, setTakeProfitEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);
  const [isDraggingState, setIsDraggingState] = useState(false);
  const [panelSize, setPanelSize] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('tradingPanel-size');
      if (saved) {
        const parsed = JSON.parse(saved);
        return { width: parsed.width || 320, height: parsed.height || 500 };
      }
    }
    return { width: 320, height: 500 };
  });
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartRef = useRef({ x: 0, y: 0, width: 0, height: 0 });

  // Initialize position from localStorage or default (top-right corner)
  useEffect(() => {
    const savedPosition = localStorage.getItem('tradingPanelPosition');
    if (savedPosition) {
      try {
        const pos = JSON.parse(savedPosition);
        // Validate position is within viewport
        if (pos.x >= 0 && pos.y >= 0 && pos.x < window.innerWidth - 320 && pos.y < window.innerHeight - 100) {
          setPosition(pos);
        } else {
          // Reset to default if invalid
          setPosition({ x: window.innerWidth - 340, y: 80 });
        }
      } catch (e) {
        // Default to top-right if saved position is invalid
        setPosition({ x: window.innerWidth - 340, y: 80 });
      }
    } else {
      // Default to top-right (below top bar)
      setPosition({ x: window.innerWidth - 340, y: 80 });
    }
  }, []);

  // Update position on window resize to keep panel in bounds
  useEffect(() => {
    const handleResize = () => {
      setPosition(prev => {
        const maxX = window.innerWidth - 320;
        const maxY = window.innerHeight - 100;
        return {
          x: Math.min(prev.x, maxX),
          y: Math.min(prev.y, maxY),
        };
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle drag start
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, input, select')) {
      return; // Don't drag if clicking on interactive elements
    }
    setIsDragging(true);
    if (panelRef.current) {
      const rect = panelRef.current.getBoundingClientRect();
      setDragStart({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  // Handle dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !panelRef.current) return;
      
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      
      // Constrain to viewport
      const maxX = window.innerWidth - panelRef.current.offsetWidth;
      const maxY = window.innerHeight - panelRef.current.offsetHeight;
      
      const constrainedPos = {
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      };
      
      setPosition(constrainedPos);
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        // Save position to localStorage
        if (panelRef.current) {
          const rect = panelRef.current.getBoundingClientRect();
          const savedPos = {
            x: rect.left,
            y: rect.top,
          };
          localStorage.setItem('tradingPanelPosition', JSON.stringify(savedPos));
        }
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart]);

  if (!instrument || !currentPrice) {
    return null;
  }

  const placeOrder = async (orderSide: 'buy' | 'sell') => {
    setLoading(true);

    try {
      const orderData: any = {
        instrumentId: instrument.id,
        orderType,
        side: orderSide,
        quantity,
      };

      if (orderType === 'limit' || orderType === 'stop') {
        orderData.price = parseFloat(price) || (orderSide === 'buy' ? currentPrice.ask : currentPrice.bid);
      }
      if (orderType === 'stop') {
        orderData.stopPrice = parseFloat(price);
      }

      // Add Stop Loss and Take Profit if enabled
      if (stopLossEnabled && stopLoss) {
        orderData.stopLossPrice = parseFloat(stopLoss);
      }
      if (takeProfitEnabled && takeProfit) {
        orderData.takeProfitPrice = parseFloat(takeProfit);
      }

      await api.post('/orders', orderData);
      alert('Order placed successfully!');
      setQuantity(0.01);
      setPrice('');
      setStopLoss('');
      setTakeProfit('');
      setStopLossEnabled(false);
      setTakeProfitEnabled(false);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const notionalValue = quantity * (side === 'buy' ? currentPrice.ask : currentPrice.bid) * instrument.contractSize;
  const entryPrice = side === 'buy' ? currentPrice.ask : currentPrice.bid;

  // Calculate default SL/TP based on spread
  const spread = currentPrice.ask - currentPrice.bid;
  const defaultSLDistance = spread * 10; // 10x spread
  const defaultTPDistance = spread * 20; // 20x spread

  const defaultStopLoss = side === 'buy' 
    ? (currentPrice.bid - defaultSLDistance).toFixed(instrument.pricePrecision)
    : (currentPrice.ask + defaultSLDistance).toFixed(instrument.pricePrecision);

  const defaultTakeProfit = side === 'buy'
    ? (currentPrice.ask + defaultTPDistance).toFixed(instrument.pricePrecision)
    : (currentPrice.bid - defaultTPDistance).toFixed(instrument.pricePrecision);

  // Resize handlers
  const handleResizeMove = (e: MouseEvent) => {
    if (!isResizing) return;
    
    const deltaX = e.clientX - resizeStartRef.current.x;
    const deltaY = e.clientY - resizeStartRef.current.y;
    
    let newWidth = resizeStartRef.current.width + deltaX;
    let newHeight = resizeStartRef.current.height + deltaY;
    
    // Constrain sizes
    newWidth = Math.max(280, Math.min(600, newWidth));
    newHeight = Math.max(400, Math.min(800, newHeight));
    
    setPanelSize({ width: newWidth, height: newHeight });
  };

  const handleResizeEnd = () => {
    setIsResizing(false);
    localStorage.setItem('tradingPanel-size', JSON.stringify(panelSize));
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeEnd);
  };

  useEffect(() => {
    if (isResizing) {
      localStorage.setItem('tradingPanel-size', JSON.stringify(panelSize));
    }
  }, [panelSize, isResizing]);

  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
    };
  }, []);

  // Render as draggable overlay or fixed panel
  if (draggable && typeof window !== 'undefined') {
    // Use defaultPosition for initial render, then switch to controlled position
    const useDefaultPosition = position.x === 0 && position.y === 0;
    
    return (
      <Draggable
        handle=".drag-handle"
        {...(useDefaultPosition ? { defaultPosition: { x: window.innerWidth - 340, y: 80 } } : { position })}
        onStart={() => {
          setIsDraggingState(true);
        }}
        onDrag={(e, data) => {
          setPosition({ x: data.x, y: data.y });
        }}
        onStop={(e, data) => {
          setIsDraggingState(false);
          const newPosition = { x: data.x, y: data.y };
          setPosition(newPosition);
          localStorage.setItem('tradingPanelPosition', JSON.stringify(newPosition));
        }}
        bounds="body"
        cancel="button, input, select, .no-drag"
        enableUserSelectHack={false}
        grid={[1, 1]}
      >
        <div 
          className={`fixed z-50 bg-white dark:bg-black border-2 border-blue-500 dark:border-blue-400 rounded-lg shadow-2xl ${isDraggingState ? 'cursor-move' : ''}`}
          style={{
            width: `${panelSize.width}px`,
            height: `${panelSize.height}px`,
            minWidth: '280px',
            minHeight: '400px',
            maxWidth: '600px',
            maxHeight: '800px',
            willChange: isDraggingState || isResizing ? 'transform, width, height' : 'auto',
            transition: (isDraggingState || isResizing) ? 'none' : 'box-shadow 0.2s ease',
          }}
        >
          {/* Header */}
          <div 
            className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 flex items-start justify-between cursor-move drag-handle select-none"
            style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
          >
            <div className="flex-1">
              <div className="text-lg font-bold text-gray-900 dark:text-white mb-0.5">{instrument.symbol}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">{instrument.name}</div>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="ml-2 text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-all duration-200 flex-shrink-0 p-1 hover:bg-gray-100 dark:hover:bg-gray-900 rounded no-drag"
                title="Close panel"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

        {/* Order Type Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-black">
          <button
            type="button"
            onClick={() => setOrderType('market')}
            className={`flex-1 px-4 py-3 text-xs font-semibold transition-all duration-200 ${
              orderType === 'market'
                ? 'bg-blue-50 dark:bg-gradient-to-r dark:from-blue-600/20 dark:to-indigo-600/20 text-blue-600 dark:text-blue-400 border-b-2 border-blue-500'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-gray-900'
            }`}
          >
            Market
          </button>
          <button
            type="button"
            onClick={() => setOrderType('limit')}
            className={`flex-1 px-4 py-3 text-xs font-semibold transition-all duration-200 ${
              orderType === 'limit'
                ? 'bg-blue-50 dark:bg-gradient-to-r dark:from-blue-600/20 dark:to-indigo-600/20 text-blue-600 dark:text-blue-400 border-b-2 border-blue-500'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-gray-900'
            }`}
          >
            Pending
          </button>
        </div>

        <form className="p-3 space-y-3">
          {/* Lot Size */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Lot Size</label>
              <span className="text-xs text-gray-500 dark:text-gray-400">lots</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(instrument.minLot, quantity - instrument.lotStep))}
                className="px-2 py-1.5 border border-gray-300 dark:border-slate-600 dark:bg-gray-700 dark:text-white rounded hover:bg-gray-50 dark:hover:bg-slate-600 font-medium text-gray-700 dark:text-gray-200 text-sm"
              >
                −
              </button>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(parseFloat(e.target.value) || instrument.minLot)}
                min={instrument.minLot}
                step={instrument.lotStep}
                className="flex-1 px-2 py-1.5 border border-gray-300 dark:border-slate-600 dark:bg-gray-700 dark:text-white rounded text-gray-900 dark:text-gray-100 text-center text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                required
              />
              <button
                type="button"
                onClick={() => setQuantity(quantity + instrument.lotStep)}
                className="px-2 py-1.5 border border-gray-300 dark:border-slate-600 dark:bg-gray-700 dark:text-white rounded hover:bg-gray-50 dark:hover:bg-slate-600 font-medium text-gray-700 dark:text-gray-200 text-sm"
              >
                +
              </button>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
              ≈ {notionalValue.toFixed(2)} {instrument.quoteCurrency}
            </div>
          </div>

          {/* Price Input for Pending Orders */}
          {orderType === 'limit' && (
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Price</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                step={Math.pow(10, -instrument.pricePrecision)}
                className="w-full px-2 py-1.5 border border-gray-300 dark:border-slate-600 dark:bg-gray-700 dark:text-white rounded text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                placeholder={entryPrice.toFixed(instrument.pricePrecision)}
              />
            </div>
          )}

          {/* Stop Loss */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <input
                type="checkbox"
                id="stopLoss"
                checked={stopLossEnabled}
                onChange={(e) => {
                  setStopLossEnabled(e.target.checked);
                  if (e.target.checked && !stopLoss) {
                    setStopLoss(defaultStopLoss);
                  }
                }}
                className="w-3 h-3 text-blue-600 dark:text-blue-400 border-gray-300 dark:border-slate-600 rounded"
              />
              <label htmlFor="stopLoss" className="text-xs font-medium text-gray-700 dark:text-gray-300">Stop Loss</label>
            </div>
            {stopLossEnabled && (
              <input
                type="number"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                step={Math.pow(10, -instrument.pricePrecision)}
                className="w-full px-2 py-1.5 border border-gray-300 dark:border-slate-600 dark:bg-gray-700 dark:text-white rounded text-gray-900 dark:text-gray-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                placeholder={defaultStopLoss}
              />
            )}
          </div>

          {/* Take Profit */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <input
                type="checkbox"
                id="takeProfit"
                checked={takeProfitEnabled}
                onChange={(e) => {
                  setTakeProfitEnabled(e.target.checked);
                  if (e.target.checked && !takeProfit) {
                    setTakeProfit(defaultTakeProfit);
                  }
                }}
                className="w-3 h-3 text-blue-600 dark:text-blue-400 border-gray-300 dark:border-slate-600 rounded"
              />
              <label htmlFor="takeProfit" className="text-xs font-medium text-gray-700 dark:text-gray-300">Take Profit</label>
            </div>
            {takeProfitEnabled && (
              <input
                type="number"
                value={takeProfit}
                onChange={(e) => setTakeProfit(e.target.value)}
                step={Math.pow(10, -instrument.pricePrecision)}
                className="w-full px-2 py-1.5 border border-gray-300 dark:border-slate-600 dark:bg-gray-700 dark:text-white rounded text-gray-900 dark:text-gray-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                placeholder={defaultTakeProfit}
              />
            )}
          </div>

          {/* Buy/Sell Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setSide('buy');
                placeOrder('buy');
              }}
              className="py-4 rounded-lg font-bold bg-gradient-to-b from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-lg shadow-green-500/30 hover:shadow-green-500/50"
            >
              <div className="flex flex-col">
                <span className="text-base">BUY</span>
                <span className="text-xs font-normal opacity-90 mt-1">
                  {currentPrice.ask.toFixed(instrument.pricePrecision)}
                </span>
              </div>
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setSide('sell');
                placeOrder('sell');
              }}
              className="py-4 rounded-lg font-bold bg-gradient-to-b from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-lg shadow-red-500/30 hover:shadow-red-500/50"
            >
              <div className="flex flex-col">
                <span className="text-base">SELL</span>
                <span className="text-xs font-normal opacity-90 mt-1">
                  {currentPrice.bid.toFixed(instrument.pricePrecision)}
                </span>
              </div>
            </button>
          </div>

          {/* Order Summary */}
          <div className="pt-3 border-t border-gray-200 dark:border-gray-800">
            <div className="text-xs text-gray-600 dark:text-gray-400 text-center font-medium bg-gray-100 dark:bg-black py-2 rounded-lg">
              {side.toUpperCase()} {quantity} @ {entryPrice.toFixed(instrument.pricePrecision)}
            </div>
          </div>

          {loading && (
            <div className="text-center text-xs text-blue-600 dark:text-blue-400 py-2 font-medium">
              Placing order...
            </div>
          )}
        </form>
        
        {/* Resize Handle - Bottom Right */}
        <div
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsResizing(true);
            resizeStartRef.current = {
              x: e.clientX,
              y: e.clientY,
              width: panelSize.width,
              height: panelSize.height,
            };
            document.addEventListener('mousemove', handleResizeMove);
            document.addEventListener('mouseup', handleResizeEnd);
          }}
          className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize z-20"
          style={{
            background: 'linear-gradient(to top left, transparent 0%, transparent 40%, rgba(59, 130, 246, 0.3) 40%, rgba(59, 130, 246, 0.3) 60%, transparent 60%)',
          }}
        >
          <div className="absolute bottom-1 right-1 w-2 h-2 border-r-2 border-b-2 border-blue-500 dark:border-blue-400 rounded-sm opacity-50 hover:opacity-100 transition-opacity" />
        </div>
        </div>
      </Draggable>
    );
  }

  // Fixed panel (non-draggable)
  return (
    <div className="w-full bg-white dark:bg-black backdrop-blur-sm border-t border-gray-200 dark:border-gray-800">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-black flex items-start justify-between">
        <div className="flex-1">
          <div className="text-lg font-bold text-gray-900 dark:text-white mb-0.5">{instrument.symbol}</div>
          <div className="text-xs text-gray-600 dark:text-gray-400">{instrument.name}</div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-2 text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-slate-300 transition-all duration-200 flex-shrink-0 p-1 hover:bg-gray-100 dark:hover:bg-gray-900 rounded"
            title="Close panel"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Order Type Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-black">
        <button
          type="button"
          onClick={() => setOrderType('market')}
          className={`flex-1 px-4 py-3 text-xs font-semibold transition-all duration-200 ${
            orderType === 'market'
              ? 'bg-blue-50 dark:bg-gradient-to-r dark:from-blue-600/20 dark:to-indigo-600/20 text-blue-600 dark:text-blue-400 border-b-2 border-blue-500'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-gray-900'
          }`}
        >
          Market
        </button>
        <button
          type="button"
          onClick={() => setOrderType('limit')}
          className={`flex-1 px-4 py-3 text-xs font-semibold transition-all duration-200 ${
            orderType === 'limit'
              ? 'bg-blue-50 dark:bg-gradient-to-r dark:from-blue-600/20 dark:to-indigo-600/20 text-blue-600 dark:text-blue-400 border-b-2 border-blue-500'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-gray-900'
          }`}
        >
          Pending
        </button>
      </div>

      <form className="p-3 space-y-3">
        {/* Lot Size */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Lot Size</label>
            <span className="text-xs text-gray-500 dark:text-gray-400">lots</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setQuantity(Math.max(instrument.minLot, quantity - instrument.lotStep))}
              className="px-2 py-1.5 border border-gray-300 dark:border-slate-600 dark:bg-gray-700 dark:text-white rounded hover:bg-gray-50 dark:hover:bg-slate-600 font-medium text-gray-700 dark:text-gray-200 text-sm"
            >
              −
            </button>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(parseFloat(e.target.value) || instrument.minLot)}
              min={instrument.minLot}
              step={instrument.lotStep}
              className="flex-1 px-2 py-1.5 border border-gray-300 dark:border-slate-600 dark:bg-gray-700 dark:text-white rounded text-gray-900 dark:text-gray-100 text-center text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              required
            />
            <button
              type="button"
              onClick={() => setQuantity(quantity + instrument.lotStep)}
              className="px-2 py-1.5 border border-gray-300 dark:border-slate-600 dark:bg-gray-700 dark:text-white rounded hover:bg-gray-50 dark:hover:bg-slate-600 font-medium text-gray-700 dark:text-gray-200 text-sm"
            >
              +
            </button>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
            ≈ {notionalValue.toFixed(2)} {instrument.quoteCurrency}
          </div>
        </div>

        {/* Price Input for Pending Orders */}
        {orderType === 'limit' && (
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Price</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              step={Math.pow(10, -instrument.pricePrecision)}
              className="w-full px-2 py-1.5 border border-gray-300 dark:border-slate-600 dark:bg-gray-700 dark:text-white rounded text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              placeholder={entryPrice.toFixed(instrument.pricePrecision)}
            />
          </div>
        )}

        {/* Stop Loss */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <input
              type="checkbox"
              id="stopLoss"
              checked={stopLossEnabled}
              onChange={(e) => {
                setStopLossEnabled(e.target.checked);
                if (e.target.checked && !stopLoss) {
                  setStopLoss(defaultStopLoss);
                }
              }}
              className="w-3 h-3 text-blue-600 dark:text-blue-400 border-gray-300 dark:border-slate-600 rounded"
            />
            <label htmlFor="stopLoss" className="text-xs font-medium text-gray-700 dark:text-gray-300">Stop Loss</label>
          </div>
          {stopLossEnabled && (
            <input
              type="number"
              value={stopLoss}
              onChange={(e) => setStopLoss(e.target.value)}
              step={Math.pow(10, -instrument.pricePrecision)}
              className="w-full px-2 py-1.5 border border-gray-300 dark:border-slate-600 dark:bg-gray-700 dark:text-white rounded text-gray-900 dark:text-gray-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              placeholder={defaultStopLoss}
            />
          )}
        </div>

        {/* Take Profit */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <input
              type="checkbox"
              id="takeProfit"
              checked={takeProfitEnabled}
              onChange={(e) => {
                setTakeProfitEnabled(e.target.checked);
                if (e.target.checked && !takeProfit) {
                  setTakeProfit(defaultTakeProfit);
                }
              }}
              className="w-3 h-3 text-blue-600 dark:text-blue-400 border-gray-300 dark:border-slate-600 rounded"
            />
            <label htmlFor="takeProfit" className="text-xs font-medium text-gray-700 dark:text-gray-300">Take Profit</label>
          </div>
          {takeProfitEnabled && (
            <input
              type="number"
              value={takeProfit}
              onChange={(e) => setTakeProfit(e.target.value)}
              step={Math.pow(10, -instrument.pricePrecision)}
              className="w-full px-2 py-1.5 border border-gray-300 dark:border-slate-600 dark:bg-gray-700 dark:text-white rounded text-gray-900 dark:text-gray-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              placeholder={defaultTakeProfit}
            />
          )}
        </div>

        {/* Buy/Sell Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            disabled={loading}
            onClick={() => {
              setSide('buy');
              placeOrder('buy');
            }}
            className="py-4 rounded-lg font-bold bg-gradient-to-b from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-lg shadow-green-500/30 hover:shadow-green-500/50"
          >
            <div className="flex flex-col">
              <span className="text-base">BUY</span>
              <span className="text-xs font-normal opacity-90 mt-1">
                {currentPrice.ask.toFixed(instrument.pricePrecision)}
              </span>
            </div>
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => {
              setSide('sell');
              placeOrder('sell');
            }}
            className="py-4 rounded-lg font-bold bg-gradient-to-b from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-lg shadow-red-500/30 hover:shadow-red-500/50"
          >
            <div className="flex flex-col">
              <span className="text-base">SELL</span>
              <span className="text-xs font-normal opacity-90 mt-1">
                {currentPrice.bid.toFixed(instrument.pricePrecision)}
              </span>
            </div>
          </button>
        </div>

        {/* Order Summary */}
        <div className="pt-3 border-t border-gray-200 dark:border-gray-800">
          <div className="text-xs text-gray-600 dark:text-gray-400 text-center font-medium bg-gray-100 dark:bg-black py-2 rounded-lg">
            {side.toUpperCase()} {quantity} @ {entryPrice.toFixed(instrument.pricePrecision)}
          </div>
        </div>

        {loading && (
          <div className="text-center text-xs text-blue-600 dark:text-blue-400 py-2 font-medium">
            Placing order...
          </div>
        )}
      </form>
    </div>
  );
}

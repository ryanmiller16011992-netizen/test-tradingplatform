'use client';

import { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData } from 'lightweight-charts';
import { Instrument, PriceTick } from '@/types';
import api from '@/lib/api';

interface PriceChartProps {
  instrument: Instrument | null;
  currentPrice: PriceTick | null;
}

export default function PriceChart({ instrument, currentPrice }: PriceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const [timeframe, setTimeframe] = useState('1h');

  const generateSampleCandles = (series: ISeriesApi<'Candlestick'>, basePrice: number) => {
    const sampleData: CandlestickData[] = [];
    const candlesCount = timeframe === '1m' ? 500 : timeframe === '5m' ? 200 : timeframe === '15m' ? 100 : timeframe === '1h' ? 168 : timeframe === '4h' ? 90 : 30;
    const timeframeHours = timeframe === '1m' ? 1/60 : timeframe === '5m' ? 5/60 : timeframe === '15m' ? 15/60 : timeframe === '1h' ? 1 : timeframe === '4h' ? 4 : 24;
    
    for (let i = candlesCount; i >= 0; i--) {
      const time = Date.now() / 1000 - i * timeframeHours * 3600;
      const change = (Math.random() - 0.5) * 0.02;
      const open = basePrice * (1 + change);
      const volatility = Math.random() * 0.01;
      sampleData.push({
        time: time as any,
        open,
        high: open * (1 + volatility),
        low: open * (1 - volatility),
        close: open + (Math.random() - 0.5) * volatility * 2,
      });
    }
    series.setData(sampleData);
  };

  useEffect(() => {
    if (!chartContainerRef.current || !instrument) {
      // Clean up if no instrument
      if (chartRef.current) {
        try {
          chartRef.current.remove();
        } catch (e) {
          // Chart already disposed, ignore
        }
        chartRef.current = null;
        seriesRef.current = null;
      }
      return;
    }

    // Clean up existing chart before creating new one
    if (chartRef.current) {
      try {
        chartRef.current.remove();
      } catch (e) {
        // Chart already disposed, ignore
      }
      chartRef.current = null;
      seriesRef.current = null;
    }

    // Create chart
    let chart: IChartApi | null = null;
    let candlestickSeries: ISeriesApi<'Candlestick'> | null = null;

    try {
      // Detect dark mode
      const isDark = document.documentElement.classList.contains('dark');
      
      chart = createChart(chartContainerRef.current, {
        width: chartContainerRef.current.clientWidth,
        height: chartContainerRef.current.clientHeight || 400,
        layout: {
          background: { color: isDark ? '#000000' : '#ffffff' },
          textColor: isDark ? '#ffffff' : '#333',
        },
        grid: {
          vertLines: { color: isDark ? '#1f1f1f' : '#f0f0f0' },
          horzLines: { color: isDark ? '#1f1f1f' : '#f0f0f0' },
        },
        timeScale: {
          timeVisible: true,
          secondsVisible: false,
        },
      });

      // Update chart theme when dark mode changes
      const updateChartTheme = () => {
        if (chartRef.current) {
          const isDark = document.documentElement.classList.contains('dark');
          chartRef.current.applyOptions({
            layout: {
              background: { color: isDark ? '#000000' : '#ffffff' },
              textColor: isDark ? '#ffffff' : '#333',
            },
            grid: {
              vertLines: { color: isDark ? '#1f1f1f' : '#f0f0f0' },
              horzLines: { color: isDark ? '#1f1f1f' : '#f0f0f0' },
            },
          });
        }
      };

      // Listen for theme changes
      const observer = new MutationObserver(updateChartTheme);
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class'],
      });

      candlestickSeries = chart.addCandlestickSeries({
        upColor: '#26a69a',
        downColor: '#ef5350',
        borderVisible: false,
        wickUpColor: '#26a69a',
        wickDownColor: '#ef5350',
      });

      chartRef.current = chart;
      seriesRef.current = candlestickSeries;

      // Store observer for cleanup
      (chart as any)._themeObserver = observer;

      // Fetch historical candles
      const fetchCandles = async () => {
        if (!candlestickSeries) return;
        
        try {
          const to = new Date();
          const from = new Date(to.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

          const response = await api.get(`/market/candles/${instrument.id}`, {
            params: {
              timeframe,
              from: from.toISOString(),
              to: to.toISOString(),
            },
          });

          if (candlestickSeries && response.data && response.data.length > 0) {
            const candles: CandlestickData[] = response.data.map((candle: any) => ({
              time: new Date(candle.openTime).getTime() / 1000 as any,
              open: parseFloat(candle.open),
              high: parseFloat(candle.high),
              low: parseFloat(candle.low),
              close: parseFloat(candle.close),
            }));
            candlestickSeries.setData(candles);
          } else if (candlestickSeries) {
            // Generate sample data if no candles found
            generateSampleCandles(candlestickSeries, currentPrice?.mid || 1.0);
          }
        } catch (error) {
          console.error('Failed to fetch candles:', error);
          // Generate sample data if API fails
          if (candlestickSeries) {
            generateSampleCandles(candlestickSeries, currentPrice?.mid || 1.0);
          }
        }
      };

      fetchCandles();

      // Handle resize
      const handleResize = () => {
        if (chartContainerRef.current && chartRef.current) {
          try {
            chartRef.current.applyOptions({
              width: chartContainerRef.current.clientWidth,
              height: chartContainerRef.current.clientHeight || 400,
            });
          } catch (e) {
            // Chart disposed, ignore
          }
        }
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        if (chartRef.current) {
          // Disconnect theme observer
          if ((chartRef.current as any)._themeObserver) {
            (chartRef.current as any)._themeObserver.disconnect();
          }
          try {
            chartRef.current.remove();
          } catch (e) {
            // Chart already disposed, ignore
          }
          chartRef.current = null;
          seriesRef.current = null;
        }
      };
    } catch (error) {
      console.error('Error creating chart:', error);
      if (chart) {
        try {
          chart.remove();
        } catch (e) {
          // Ignore
        }
      }
    }
  }, [instrument, timeframe]);

  // Update chart with new price
  useEffect(() => {
    if (seriesRef.current && currentPrice && instrument && chartRef.current) {
      try {
        const now = Date.now() / 1000;
        seriesRef.current.update({
          time: now as any,
          open: currentPrice.mid,
          high: currentPrice.mid,
          low: currentPrice.mid,
          close: currentPrice.mid,
        });
      } catch (error) {
        // Chart disposed or error updating, ignore silently
      }
    }
  }, [currentPrice, instrument]);

  if (!instrument) {
    return (
      <div className="h-full flex items-center justify-center bg-white dark:bg-black border border-gray-200 dark:border-gray-800">
        <div className="text-gray-500 dark:text-gray-400">Select an instrument to view chart</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-black overflow-hidden">
      {/* Chart Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex-shrink-0 bg-gray-50 dark:bg-black">
        <div>
          <div className="text-xl font-bold text-gray-900 dark:text-white mb-1">{instrument.symbol}</div>
          {currentPrice && (
            <div className="flex items-center gap-4 text-sm">
              <span className="text-gray-600 dark:text-gray-400">H <span className="text-green-600 dark:text-green-400 font-semibold">{currentPrice.ask.toFixed(instrument.pricePrecision)}</span></span>
              <span className="text-gray-600 dark:text-gray-400">L <span className="text-red-600 dark:text-red-400 font-semibold">{currentPrice.bid.toFixed(instrument.pricePrecision)}</span></span>
              <span className="text-gray-400 dark:text-gray-500">•</span>
              <span className="text-gray-600 dark:text-gray-400">Spread: <span className="text-gray-900 dark:text-gray-300 font-medium">{((currentPrice.ask - currentPrice.bid) * Math.pow(10, instrument.pricePrecision)).toFixed(0)}</span></span>
            </div>
          )}
        </div>
        <div className="flex gap-1 bg-gray-100 dark:bg-black p-1 rounded-lg border border-gray-200 dark:border-gray-700/50">
          {['1m', '5m', '15m', '1h', '4h', '1d'].map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-4 py-1.5 text-xs font-semibold rounded transition-all duration-200 ${
                timeframe === tf
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-slate-200 hover:bg-gray-200 dark:hover:bg-gray-900'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Chart - Takes remaining space */}
      <div ref={chartContainerRef} className="flex-1 min-h-0 bg-white dark:bg-black" />
    </div>
  );
}


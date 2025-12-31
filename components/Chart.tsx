'use client';

import { useEffect, useRef } from 'react';
import { createChart, IChartApi, ISeriesApi } from 'lightweight-charts';
import { Instrument } from '@/types';
import api from '@/lib/api';

interface ChartProps {
  instrument: Instrument;
}

interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export default function Chart({ instrument }: ChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      layout: {
        background: { color: '#ffffff' },
        textColor: '#333',
      },
      grid: {
        vertLines: { color: '#e0e0e0' },
        horzLines: { color: '#e0e0e0' },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    chartRef.current = chart;
    seriesRef.current = candlestickSeries;

    // Fetch historical candles
    const fetchCandles = async () => {
      try {
        const to = new Date();
        const from = new Date(to.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

        const response = await api.get(`/market/candles/${instrument.id}`, {
          params: {
            timeframe: '1h',
            from: from.toISOString(),
            to: to.toISOString(),
          },
        });

        if (response.data && response.data.length > 0) {
          const candles: CandleData[] = response.data.map((candle: any) => ({
            time: new Date(candle.openTime).getTime() / 1000 as any,
            open: parseFloat(candle.open),
            high: parseFloat(candle.high),
            low: parseFloat(candle.low),
            close: parseFloat(candle.close),
          }));
          candlestickSeries.setData(candles);
        } else {
          // Generate sample data if no candles available
          const sampleData: CandleData[] = [];
          const basePrice = 1.08;
          const now = Math.floor(Date.now() / 1000);
          
          for (let i = 168; i >= 0; i--) {
            const time = now - i * 3600;
            const change = (Math.random() - 0.5) * 0.001;
            const open = i === 168 ? basePrice : sampleData[sampleData.length - 1].close;
            const close = open + change;
            const high = Math.max(open, close) + Math.random() * 0.0005;
            const low = Math.min(open, close) - Math.random() * 0.0005;
            
            sampleData.push({ time: time as any, open, high, low, close });
          }
          candlestickSeries.setData(sampleData);
        }
      } catch (error) {
        console.error('Failed to fetch candles:', error);
      }
    };

    fetchCandles();

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
      }
    };
  }, [instrument]);

  return (
    <div className="flex-1 flex flex-col bg-white">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">{instrument.symbol}</h2>
          <div className="flex gap-2">
            <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50">1H</button>
            <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50">4H</button>
            <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50">1D</button>
          </div>
        </div>
      </div>
      <div ref={chartContainerRef} className="flex-1" style={{ minHeight: '400px' }} />
    </div>
  );
}


'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { Instrument, PriceTick, AccountMetrics } from '@/types';
import api from '@/lib/api';
import { getSocket } from '@/lib/websocket';
import TopBar from '@/components/TopBar';
import MarketWatch from '@/components/MarketWatch';
import TradingPanel from '@/components/TradingPanel';
import PriceChart from '@/components/PriceChart';
import PositionsTable from '@/components/PositionsTable';
import NewsPanel from '@/components/NewsPanel';
import ResizablePanel from '@/components/ResizablePanel';

export default function TradingPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [selectedInstrument, setSelectedInstrument] = useState<Instrument | null>(null);
  const [currentPrice, setCurrentPrice] = useState<PriceTick | null>(null);
  const [metrics, setMetrics] = useState<AccountMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showTradingPanel, setShowTradingPanel] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    let interval: NodeJS.Timeout | null = null;
    let socket: any = null;

    try {
      // Fetch account metrics
      const fetchMetrics = async () => {
        try {
          const response = await api.get('/account/metrics');
          setMetrics(response.data);
          setIsLoading(false);
        } catch (error: any) {
          console.error('Failed to fetch metrics:', error);
          console.error('Error details:', error.response?.data || error.message);
          // Set default metrics to prevent UI crash
          setMetrics({
            accountId: user?.accountId || '',
            balance: 0,
            equity: 0,
            usedMargin: 0,
            freeMargin: 0,
            marginLevel: 0,
            unrealizedPnl: 0,
            realizedPnl: 0,
            openPositions: 0,
            drawdown: 0,
            drawdownPercent: 0,
          });
          setIsLoading(false);
        }
      };

      fetchMetrics();
      interval = setInterval(fetchMetrics, 5000);

      // Subscribe to WebSocket updates
      try {
        socket = getSocket();
        if (socket) {
          socket.on('account:metrics', (data: AccountMetrics) => {
            setMetrics(data);
          });
        }
      } catch (wsError) {
        console.error('WebSocket error:', wsError);
        // Continue without WebSocket
      }

      return () => {
        if (interval) clearInterval(interval);
        if (socket) {
          try {
            socket.off('account:metrics');
          } catch (e) {
            // Ignore cleanup errors
          }
        }
      };
    } catch (error) {
      console.error('Error in useEffect:', error);
      setIsLoading(false);
      setMetrics({
        accountId: user?.accountId || '',
        balance: 0,
        equity: 0,
        usedMargin: 0,
        freeMargin: 0,
        marginLevel: 0,
        unrealizedPnl: 0,
        realizedPnl: 0,
        openPositions: 0,
        drawdown: 0,
        drawdownPercent: 0,
      });
    }
  }, [user, router]);

  useEffect(() => {
    if (!selectedInstrument) {
      setShowTradingPanel(false);
      return;
    }

    // Auto-show trading panel when instrument is selected
    setShowTradingPanel(true);

    const socket = getSocket();
    socket.emit('subscribe:prices', { symbols: [selectedInstrument.symbol] });

    socket.on('prices', (prices: PriceTick[]) => {
      const price = prices.find(p => p.symbol === selectedInstrument.symbol);
      if (price) setCurrentPrice(price);
    });

    return () => {
      socket.off('prices');
    };
  }, [selectedInstrument]);

  if (!user) {
    return null;
  }

  // Show loading state while metrics are being fetched initially
  if (isLoading || metrics === null) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading trading platform...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-black overflow-hidden">
      {/* Top Bar */}
      <TopBar metrics={metrics} />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left Sidebar - Resizable Market Watch */}
        <ResizablePanel
          direction="horizontal"
          initialSize={320}
          minSize={200}
          maxSize={600}
          storageKey="trading-leftSidebar-width"
          className="border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-black overflow-hidden"
        >
          <MarketWatch
            onInstrumentSelect={setSelectedInstrument}
            selectedInstrument={selectedInstrument}
          />
        </ResizablePanel>

        {/* Center Chart Area - Takes remaining space */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-black min-w-0">
          <PriceChart instrument={selectedInstrument} currentPrice={currentPrice} />
        </div>
      </div>

      {/* Bottom Section - Resizable Height */}
      <ResizablePanel
        direction="vertical"
        initialSize={256}
        minSize={150}
        maxSize={600}
        storageKey="trading-bottomSection-height"
        className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-black overflow-hidden flex"
      >
        {/* Bottom Left - Resizable News/Calendar */}
        <ResizablePanel
          direction="horizontal"
          initialSize={384}
          minSize={200}
          maxSize={800}
          storageKey="trading-bottomNews-width"
          className="border-r border-gray-200 dark:border-gray-800 overflow-hidden"
        >
          <NewsPanel />
        </ResizablePanel>

        {/* Bottom Right - Positions Table */}
        <div className="flex-1 overflow-hidden min-w-0">
          <PositionsTable />
        </div>
      </ResizablePanel>

      {/* Floating Trading Panel - Draggable */}
      {selectedInstrument && currentPrice && showTradingPanel && (
        <TradingPanel 
          instrument={selectedInstrument} 
          currentPrice={currentPrice}
          onClose={() => setShowTradingPanel(false)}
          draggable={true}
        />
      )}

      {/* Floating Button to Show Trading Panel */}
      {selectedInstrument && currentPrice && !showTradingPanel && (
        <button
          onClick={() => setShowTradingPanel(true)}
          className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg shadow-lg shadow-blue-600/50 hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Open Order Panel
        </button>
      )}
    </div>
  );
}

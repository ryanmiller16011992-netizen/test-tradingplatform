'use client';

import { useState } from 'react';

export default function NewsPanel() {
  const [activeTab, setActiveTab] = useState<'news' | 'calendar' | 'market'>('news');

  // Sample news data
  const newsItems = [
    {
      time: '16:00',
      title: 'Russia Unemployment Rate below forecasts (2.2%) in November: Actual (2.1%)',
    },
    {
      time: '11:34',
      title: 'India FX Reserves, USD up to $693.32B in December 15 from previous $688.95B',
    },
    {
      time: '05:00',
      title: 'Singapore Industrial Production (YoY) registered at 14.3% above expectations...',
    },
    {
      time: '05:00',
      title: 'Singapore Industrial Production (MoM) fell from previous 11.5% to -10.2% in November',
    },
  ];

  const calendarEvents = [
    {
      time: '15:30',
      country: 'US',
      event: 'Core PCE Price Index (MoM)',
      impact: 'High',
    },
    {
      time: '15:30',
      country: 'US',
      event: 'Personal Spending (MoM)',
      impact: 'Medium',
    },
    {
      time: '14:00',
      country: 'UK',
      event: 'GDP (QoQ)',
      impact: 'High',
    },
  ];

  return (
    <div className="h-full flex flex-col bg-white dark:bg-black backdrop-blur-sm overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 flex-shrink-0 bg-gray-50 dark:bg-black">
        <button
          onClick={() => setActiveTab('news')}
          className={`px-4 py-3 text-sm font-semibold transition-all duration-200 ${
            activeTab === 'news'
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-black'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-gray-900'
          }`}
        >
          News
        </button>
        <button
          onClick={() => setActiveTab('calendar')}
          className={`px-4 py-3 text-sm font-semibold transition-all duration-200 ${
            activeTab === 'calendar'
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-black'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-gray-900'
          }`}
        >
          Calendar
        </button>
        <button
          onClick={() => setActiveTab('market')}
          className={`px-4 py-3 text-sm font-semibold transition-all duration-200 ${
            activeTab === 'market'
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-black'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-gray-900'
          }`}
        >
          Market
        </button>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 min-h-0">
        {activeTab === 'news' && (
          <div className="space-y-3">
            {newsItems.map((item, idx) => (
              <div key={idx} className="border-b border-gray-200 dark:border-gray-800 pb-3 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-900/20 rounded-lg p-2 -mx-2 transition-all duration-200">
                <div className="flex items-start gap-3">
                  <span className="text-xs text-gray-600 dark:text-gray-500 whitespace-nowrap font-medium">{item.time}</span>
                  <p className="text-sm text-gray-900 dark:text-gray-200 leading-relaxed">{item.title}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'calendar' && (
          <div className="space-y-3">
            {calendarEvents.map((event, idx) => (
              <div key={idx} className="border-b border-gray-200 dark:border-gray-800 pb-3 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-900/20 rounded-lg p-2 -mx-2 transition-all duration-200">
                <div className="flex items-start gap-3">
                  <span className="text-xs text-gray-600 dark:text-gray-500 whitespace-nowrap font-medium">{event.time}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{event.country}</span>
                      <span className={`text-xs px-2 py-0.5 rounded font-semibold ${
                        event.impact === 'High' 
                          ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-500/30' 
                          : 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border border-yellow-300 dark:border-yellow-500/30'
                      }`}>
                        {event.impact}
                      </span>
                    </div>
                    <p className="text-sm text-gray-900 dark:text-gray-200 leading-relaxed">{event.event}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'market' && (
          <div className="text-center text-gray-500 dark:text-gray-500 text-sm py-8">
            Market overview coming soon
          </div>
        )}
      </div>
    </div>
  );
}



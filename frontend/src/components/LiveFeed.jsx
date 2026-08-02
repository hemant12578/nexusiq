import React, { useState, useEffect } from 'react';

export default function LiveFeed({ API }) {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const sseUrl = `${API}/events`;
    const eventSource = new EventSource(sseUrl);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setEvents((prev) => {
          const newEvents = [data, ...prev].slice(0, 3);
          return newEvents;
        });
      } catch (err) {
        console.error("Error parsing SSE data", err);
      }
    };

    eventSource.onerror = (err) => {
      console.error("SSE error", err);
    };

    return () => {
      eventSource.close();
    };
  }, [API]);

  return (
    <div className="fixed bottom-4 right-4 z-50 pointer-events-none flex flex-col gap-2 items-end">
      <div className="flex items-center gap-2 bg-nexus-800/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-nexus-700 shadow-lg shadow-black/50 pointer-events-auto">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]"></div>
        <span className="text-xs font-bold tracking-widest text-green-400">LIVE</span>
      </div>
      
      {events.map((evt, idx) => (
        <div 
          key={evt.timestamp + idx} 
          className="bg-nexus-800/90 backdrop-blur-md border border-nexus-700 p-3 rounded-lg shadow-xl text-sm max-w-xs text-white pointer-events-auto transition-all duration-300 transform translate-y-0 opacity-100"
        >
          {evt.type === 'upload' ? (
            <div>
              <span className="text-blue-400 font-semibold">New Upload: </span>
              <span className="truncate">{evt.source}</span>
              <div className="text-xs text-gray-400 mt-1">{evt.entities} entities found</div>
            </div>
          ) : (
            <div>
              <span className="text-purple-400 font-semibold">New Query: </span>
              <span className="italic">"{evt.question}..."</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

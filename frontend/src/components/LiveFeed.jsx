import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function LiveFeed({ API }) {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const sseUrl = `${API}/events`;
    const eventSource = new EventSource(sseUrl);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const eventId = data.timestamp ? `${data.timestamp}-${Math.random()}` : `evt-${Date.now()}-${Math.random()}`;
        const newEvent = { ...data, id: eventId };

        setEvents((prev) => [newEvent, ...prev].slice(0, 3));

        // Auto remove event after 4 seconds
        setTimeout(() => {
          setEvents((prev) => prev.filter((e) => e.id !== eventId));
        }, 4000);
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

  const removeEvent = (id) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 pointer-events-none flex flex-col gap-2 items-end max-w-sm">
      <div className="flex items-center gap-2 bg-nexus-800/90 backdrop-blur-md px-3 py-1 rounded-full border border-purple-800/40 shadow-lg pointer-events-auto">
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
        <span className="text-[10px] font-bold tracking-widest text-emerald-400">LIVE FEED</span>
      </div>
      
      {events.map((evt) => (
        <div 
          key={evt.id} 
          className="bg-nexus-800/95 backdrop-blur-xl border border-purple-800/40 p-3 rounded-2xl shadow-2xl text-xs text-white pointer-events-auto transition-all duration-300 transform animate-fade-in flex items-start justify-between gap-3 w-full max-w-xs glow-border"
        >
          <div className="flex-1 min-w-0">
            {evt.type === 'upload' ? (
              <div>
                <div className="text-purple-300 font-semibold flex items-center gap-1.5 text-xs">
                  <span>New Upload:</span>
                  <span className="text-white truncate font-medium">{evt.source}</span>
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">{evt.entities} entities extracted</div>
              </div>
            ) : (
              <div>
                <div className="text-cyan-300 font-semibold text-xs">New Query:</div>
                <div className="text-gray-300 italic truncate mt-0.5 font-light">"{evt.question}"</div>
              </div>
            )}
          </div>

          <button
            onClick={() => removeEvent(evt.id)}
            className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-purple-900/50 transition-colors shrink-0"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

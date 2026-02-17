import React from 'react';
import { ShipmentTimelineEntry } from '@/lib/firestore-models';
import { motion, AnimatePresence } from 'framer-motion';

function parseTimestamp(ts: unknown): Date | null {
  if (!ts) return null;
  if (ts instanceof Date) return ts;
  if (typeof ts === 'string' || typeof ts === 'number') return new Date(ts as any);
  // Firestore Timestamp-like
  // @ts-ignore
  if (typeof (ts as any)?.toDate === 'function') return (ts as any).toDate();
  return null;
}

export default function ShipmentTimeline({ timeline }: { timeline?: ShipmentTimelineEntry[] }) {
  if (!timeline || timeline.length === 0) return <p className="text-sm text-gray-500">No timeline available.</p>;

  // Copy and sort ascending by timestamp
  const sorted = [...timeline].slice().sort((a, b) => {
    const ta = parseTimestamp(a.timestamp)?.getTime() ?? 0;
    const tb = parseTimestamp(b.timestamp)?.getTime() ?? 0;
    return ta - tb;
  });

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {sorted.map((step, index) => {
          const ts = parseTimestamp(step.timestamp);
          const isActive = index === sorted.length - 1;
          return (
            <motion.div
              key={`${step.status}-${index}-${ts?.getTime() ?? index}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.24 }}
              className="flex items-start space-x-4"
            >
              <div className="flex flex-col items-center">
                <div
                  className={`w-4 h-4 rounded-full ${isActive ? 'bg-blue-600 ring-2 ring-blue-200' : 'bg-gray-300'}`}
                ></div>
                {index < sorted.length - 1 && <div className="w-px h-10 bg-gray-200 mt-1"></div>}
              </div>

              <div>
                <p className={`font-semibold ${isActive ? 'text-blue-600' : 'text-gray-800'}`}>{step.status}</p>
                <p className="text-sm text-gray-500">{step.location}</p>
                <p className="text-xs text-gray-400">{ts ? ts.toLocaleString() : '—'}</p>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

"use client";
import { useState } from "react";

export default function SeedControl() {
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function runSeed() {
    setRunning(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/seed", { method: "POST" });
      const data = await res.json();
      setMessage(JSON.stringify(data));
    } catch (e) {
      setMessage((e as Error).message);
    }
    setRunning(false);
  }

  return (
    <div>
      <button onClick={runSeed} disabled={running}>
        {running ? "Seeding…" : "Run Seeder"}
      </button>
      {message ? <pre style={{ whiteSpace: "pre-wrap" }}>{message}</pre> : null}
    </div>
  );
}
"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { initializeFirebase } from '@/firebase';

export default function SeedControl() {
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const runSeed = async (force = false) => {
    setLoading(true);
    setStatus(null);
    try {
      const sdks = initializeFirebase();
      const user = sdks.auth.currentUser;
      let token: string | null = null;
      if (user) {
        token = await user.getIdToken();
      }

      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (force) headers['x-admin-force'] = '1';

      const res = await fetch('/api/admin/seed', {
        method: 'POST',
        headers,
      });

      const json = await res.json();
      if (!res.ok) {
        setStatus(json.error || 'Failed');
      } else {
        setStatus('Seeder executed: ' + JSON.stringify(json));
      }
    } catch (err: any) {
      setStatus(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6">
      <h3 className="text-sm font-medium">Database Seeder</h3>
      <p className="text-muted-foreground text-sm mb-3">Run default data seeding for services and FAQs. Protected to admins.</p>
      <div className="flex items-center gap-3">
        <Button onClick={() => runSeed()} disabled={loading}>Run Seeder</Button>
        <Button variant="destructive" onClick={() => runSeed(true)} disabled={loading}>Force Run</Button>
      </div>
      {status && <pre className="mt-3 text-xs whitespace-pre-wrap">{status}</pre>}
    </div>
  );
}

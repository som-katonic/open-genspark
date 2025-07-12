'use client';

import { useState, useEffect } from 'react';
import SuperAgent from './components/SuperAgent';
import { parseCookies } from '../lib/utils';

export default function Home() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const cookies = parseCookies();
    const userIdFromCookies = cookies['zeroemail_user_id'];
    
    if (!userIdFromCookies) {
      window.location.href = '/signin';
    } else {
      setUserId(userIdFromCookies);
    }
  }, []);

  if (!userId) {
    return null; // or a minimal loading indicator
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      <main className="flex-1 overflow-y-auto">
        <SuperAgent userId={userId} />
      </main>
    </div>
  );
}

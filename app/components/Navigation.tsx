'use client';

import { clsx } from 'clsx';
import { FiSliders, FiGrid, FiStar, FiLogOut } from 'react-icons/fi';
import { parseCookies } from '../../lib/utils';
import { useState, useEffect } from 'react';

interface NavigationProps {
  activeTab: 'superagent' | 'ppt' | 'sheets';
  onTabChange: (tab: 'superagent' | 'ppt' | 'sheets') => void;
}

export default function Navigation({ activeTab, onTabChange }: NavigationProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const cookies = parseCookies();
    setIsAuthenticated(!!cookies['zeroemail_user_id']);
  }, []);

  const handleSignOut = () => {
    document.cookie = 'zeroemail_user_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    window.location.href = '/signin';
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => onTabChange('superagent')}
              className={clsx(
                'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                activeTab === 'superagent'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-200'
              )}
            >
              <FiStar className="w-4 h-4" />
              <span>Super Agent</span>
            </button>
            <button
              onClick={() => onTabChange('ppt')}
              className={clsx(
                'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                activeTab === 'ppt'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-200'
              )}
            >
              <FiSliders className="w-4 h-4" />
              <span>PowerPoint</span>
            </button>
            <button
              onClick={() => onTabChange('sheets')}
              className={clsx(
                'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                activeTab === 'sheets'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-200'
              )}
            >
              <FiGrid className="w-4 h-4" />
              <span>Sheets</span>
            </button>
          </div>
        </div>

        {isAuthenticated && (
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <FiLogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        )}
      </div>
    </nav>
  );
} 
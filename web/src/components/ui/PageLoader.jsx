import React from 'react';
import Navbar from '../layout/Navbar';

/**
 * Reusable full-page loader component featuring a custom animated house SVG and bouncing dots
 */
export default function PageLoader() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <div className="flex flex-col items-center gap-3">
          <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16">
            <rect x="16" y="30" width="32" height="24" rx="3" fill="#f1f5f9" stroke="#0d9488" strokeWidth="2">
              <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" />
            </rect>
            <path d="M12 32 L32 14 L52 32" stroke="#0d9488" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
              <animate attributeName="stroke-dasharray" values="0,100;60,40;0,100" dur="2.5s" repeatCount="indefinite" />
            </path>
            <rect x="27" y="38" width="10" height="16" rx="2" fill="#0d9488" opacity="0.3">
              <animate attributeName="opacity" values="0.3;0.6;0.3" dur="1.5s" repeatCount="indefinite" />
            </rect>
          </svg>
          <div className="flex gap-1.5 mt-1">
            <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" />
            <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
            <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
          </div>
        </div>
      </div>
    </>
  );
}

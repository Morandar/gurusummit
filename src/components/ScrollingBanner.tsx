import React, { useEffect, useState } from 'react';
import { Banner } from '@/context/DataContext';

interface ScrollingBannerProps {
  banner: Banner | null;
}

export const ScrollingBanner = ({ banner }: ScrollingBannerProps) => {
  const [scrollPosition, setScrollPosition] = useState(0);

  useEffect(() => {
    if (!banner?.text) return;

    const textWidth = banner.text.length * 10; // Approximate character width
    const containerWidth = 400; // Approximate container width
    const duration = (textWidth + containerWidth) / 50; // Speed adjustment

    const interval = setInterval(() => {
      setScrollPosition(prev => {
        if (prev > textWidth + containerWidth) {
          return -containerWidth; // Reset to start
        }
        return prev + 1;
      });
    }, 50); // Update every 50ms

    return () => clearInterval(interval);
  }, [banner?.text]);

  if (!banner?.text) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 shadow-lg border-b">
      <div className="max-w-7xl mx-auto">
        <div className="overflow-hidden whitespace-nowrap">
          <div
            className="inline-block text-sm font-medium"
            style={{
              transform: `translateX(${scrollPosition}px)`,
              transition: 'none'
            }}
          >
            📢 {banner.text} 📢 {banner.text} 📢 {banner.text}
          </div>
        </div>
      </div>
    </div>
  );
};
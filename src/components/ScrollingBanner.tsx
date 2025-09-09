import React, { useEffect, useState } from 'react';
import { Banner } from '@/context/DataContext';

interface ScrollingBannerProps {
  banner: Banner | null;
}

export const ScrollingBanner = ({ banner }: ScrollingBannerProps) => {
  const [scrollPosition, setScrollPosition] = useState(100);

  console.log('🎬 ScrollingBanner: Component rendered with banner:', banner ? {
    id: banner.id,
    text: banner.text.substring(0, 30) + (banner.text.length > 30 ? '...' : ''),
    isActive: banner.isActive,
    targetAudience: banner.targetAudience
  } : 'null');

  useEffect(() => {
    if (!banner?.text) {
      console.log('🎬 ScrollingBanner: No banner text available, animation not started');
      return;
    }

    console.log('🎬 ScrollingBanner: Starting animation for banner text:', banner.text.substring(0, 50) + (banner.text.length > 50 ? '...' : ''));

    const interval = setInterval(() => {
      setScrollPosition(prev => {
        // Move from right to left (negative values)
        const newPosition = prev - 1;

        // Reset when text has scrolled completely off screen
        if (newPosition < -800) { // Adjust based on text length
          return 100; // Reset to start from right
        }

        return newPosition;
      });
    }, 30); // Smoother animation with 30ms intervals

    return () => clearInterval(interval);
  }, [banner?.text]);

  if (!banner?.text) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 shadow-lg border-b relative overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="relative">
          <div
            className="inline-block text-sm font-medium whitespace-nowrap"
            style={{
              transform: `translateX(${scrollPosition}px)`,
              transition: 'none'
            }}
          >
            📢 {banner.text} 📢 {banner.text} 📢 {banner.text} 📢 {banner.text} 📢 {banner.text}
          </div>
        </div>
      </div>
    </div>
  );
};
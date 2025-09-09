import React, { useEffect, useState } from 'react';
import { Banner } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';

interface ScrollingBannerProps {
  banners: Banner[];
}

export const ScrollingBanner = ({ banners }: ScrollingBannerProps) => {
  const [scrollPosition, setScrollPosition] = useState(100);
  const { user } = useAuth();

  // Determine which banner to show based on user type
  const getAppropriateBanner = (): Banner | null => {
    if (!banners || banners.length === 0) return null;

    // Determine user type and map to banner audience
    const userType = user?.type || 'participant'; // Default to participant if no user
    let bannerAudience: 'all' | 'participants' | 'booth_staff';

    // Map user types to banner audiences
    switch (userType) {
      case 'participant':
        bannerAudience = 'participants';
        break;
      case 'booth':
        bannerAudience = 'booth_staff';
        break;
      case 'admin':
        bannerAudience = 'all'; // Admins see all banners
        break;
      default:
        bannerAudience = 'participants';
    }

    console.log('🎬 ScrollingBanner: Determining banner for user type:', userType, '-> banner audience:', bannerAudience);

    // Priority order: specific user type first, then 'all'
    const userTypeBanner = banners.find(banner =>
      banner.targetAudience === bannerAudience && banner.isActive
    );

    if (userTypeBanner) {
      console.log('🎬 ScrollingBanner: Found specific banner for user type:', userType);
      return userTypeBanner;
    }

    // Fallback to 'all' audience banner
    const allAudienceBanner = banners.find(banner =>
      banner.targetAudience === 'all' && banner.isActive
    );

    if (allAudienceBanner) {
      console.log('🎬 ScrollingBanner: Using "all" audience banner');
      return allAudienceBanner;
    }

    console.log('🎬 ScrollingBanner: No appropriate banner found');
    return null;
  };

  const banner = getAppropriateBanner();

  console.log('🎬 ScrollingBanner: Component rendered with banners:', banners.length, 'total, selected banner:', banner ? {
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
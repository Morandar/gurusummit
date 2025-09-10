import React, { useEffect, useState } from 'react';
import { Banner } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';

interface ScrollingBannerProps {
  banners: Banner[];
}

export const ScrollingBanner = ({ banners }: ScrollingBannerProps) => {
  const [scrollPosition, setScrollPosition] = useState(100);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const { user } = useAuth();

  // Color schemes for visual distinction
  const getColorScheme = (color: string) => {
    switch (color) {
      case 'blue-purple':
        return 'bg-gradient-to-r from-blue-600 to-purple-600';
      case 'green-teal':
        return 'bg-gradient-to-r from-green-600 to-teal-600';
      case 'red-pink':
        return 'bg-gradient-to-r from-red-600 to-pink-600';
      case 'yellow-orange':
        return 'bg-gradient-to-r from-yellow-600 to-orange-600';
      case 'indigo-cyan':
        return 'bg-gradient-to-r from-indigo-600 to-cyan-600';
      default:
        return 'bg-gradient-to-r from-blue-600 to-purple-600';
    }
  };

  // Determine which banners to show based on user type
  const getAppropriateBanners = (): Banner[] => {
    if (!banners || banners.length === 0) return [];

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

    console.log('🎬 ScrollingBanner: Determining banners for user type:', userType, '-> banner audience:', bannerAudience);

    // Get all banners for this user type
    const userTypeBanners = banners.filter(banner =>
      (banner.targetAudience === bannerAudience || banner.targetAudience === 'all') && banner.isActive
    );

    console.log('🎬 ScrollingBanner: Found', userTypeBanners.length, 'banners for user type:', userType);
    return userTypeBanners;
  };

  const appropriateBanners = getAppropriateBanners();
  const currentBanner = appropriateBanners[currentBannerIndex];

  console.log('🎬 ScrollingBanner: Component rendered with banners:', banners.length, 'total, appropriate banners:', appropriateBanners.length, 'current banner:', currentBanner ? {
    id: currentBanner.id,
    text: currentBanner.text.substring(0, 30) + (currentBanner.text.length > 30 ? '...' : ''),
    isActive: currentBanner.isActive,
    targetAudience: currentBanner.targetAudience
  } : 'null');


  useEffect(() => {
    if (!currentBanner?.text) {
      console.log('🎬 ScrollingBanner: No banner text available, animation not started');
      return;
    }

    console.log('🎬 ScrollingBanner: Starting animation for banner text:', currentBanner.text.substring(0, 50) + (currentBanner.text.length > 50 ? '...' : ''));

    const interval = setInterval(() => {
      setScrollPosition(prev => {
        if (isPaused) return prev; // Don't move if paused

        // Move from right to left (negative values)
        const newPosition = prev - 1;

        // When text has scrolled completely off screen, pause and switch
        if (newPosition < -800) { // Adjust based on text length
          setIsPaused(true);
          setTimeout(() => {
            if (appropriateBanners.length > 1) {
              setCurrentBannerIndex(prev => (prev + 1) % appropriateBanners.length);
            }
            setScrollPosition(100); // Reset to start from right
            setIsPaused(false);
          }, 2000); // 2 second pause before next banner
          return prev; // Keep current position during pause
        }

        return newPosition;
      });
    }, 30); // Smoother animation with 30ms intervals

    return () => clearInterval(interval);
  }, [currentBanner?.text, isPaused, appropriateBanners.length]);

  if (!currentBanner?.text) {
    return null;
  }

  return (
    <div className={`${getColorScheme(currentBanner?.color || 'blue-purple')} text-white py-2 px-4 shadow-lg border-b relative overflow-hidden`}>
      <div className="max-w-7xl mx-auto">
        <div className="relative">
          <div
            className="inline-block text-sm font-medium whitespace-nowrap"
            style={{
              transform: `translateX(${scrollPosition}px)`,
              transition: 'none'
            }}
          >
            📢 {currentBanner.text} 📢 {currentBanner.text} 📢 {currentBanner.text} 📢 {currentBanner.text} 📢 {currentBanner.text}
          </div>
          {/* Banner indicator for multiple banners */}
          {appropriateBanners.length > 1 && (
            <div className="absolute top-1 right-4 flex gap-1">
              {appropriateBanners.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    index === currentBannerIndex ? 'bg-white' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
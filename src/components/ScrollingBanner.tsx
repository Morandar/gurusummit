import React, { useEffect, useMemo, useState } from 'react';
import { Banner } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';

interface ScrollingBannerProps {
  banners: Banner[];
}

export const ScrollingBanner = ({ banners }: ScrollingBannerProps) => {
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const { user } = useAuth();

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

  const getAppropriateBanners = (): Banner[] => {
    if (!banners || banners.length === 0) return [];

    const userType = user?.type || 'participant';
    let bannerAudience: 'all' | 'participants' | 'booth_staff';

    switch (userType) {
      case 'participant':
        bannerAudience = 'participants';
        break;
      case 'booth':
        bannerAudience = 'booth_staff';
        break;
      case 'admin':
        bannerAudience = 'all';
        break;
      default:
        bannerAudience = 'participants';
    }

    return banners.filter(
      banner =>
        (banner.targetAudience === bannerAudience || banner.targetAudience === 'all') && banner.isActive
    );
  };

  const appropriateBanners = useMemo(() => getAppropriateBanners(), [banners, user?.type]);
  const currentBanner = appropriateBanners[currentBannerIndex];

  useEffect(() => {
    if (currentBannerIndex >= appropriateBanners.length) {
      setCurrentBannerIndex(0);
    }
  }, [currentBannerIndex, appropriateBanners.length]);

  useEffect(() => {
    if (appropriateBanners.length <= 1) return;
    const rotationMs = 20_000;
    const interval = setInterval(() => {
      setCurrentBannerIndex(prev => (prev + 1) % appropriateBanners.length);
    }, rotationMs);
    return () => clearInterval(interval);
  }, [appropriateBanners.length]);

  if (!currentBanner?.text) {
    return null;
  }

  const marqueeStyle = { ['--marquee-duration' as any]: '20s' };
  const bannerChunks = Array.from({ length: 4 }, (_, index) => (
    <span key={index} className="mx-6 inline-flex items-center gap-3 text-sm font-semibold tracking-wide">
      <span aria-hidden="true">📢</span>
      <span>{currentBanner.text}</span>
    </span>
  ));

  return (
    <div className={`${getColorScheme(currentBanner?.color || 'blue-purple')} text-white py-2 px-4 shadow-lg border-b relative overflow-hidden`}>
      <div className="max-w-7xl mx-auto">
        <div className="relative overflow-hidden">
          <div
            className="flex w-max animate-marquee items-center whitespace-nowrap will-change-transform motion-reduce:animate-none"
            style={marqueeStyle}
          >
            <div className="flex items-center">{bannerChunks}</div>
            <div className="flex items-center" aria-hidden="true">
              {bannerChunks}
            </div>
          </div>
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

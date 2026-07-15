// MobileDetect — runs once on mount: shows toast, requests location, tracks install prompt
import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { Smartphone, MapPin } from 'lucide-react';

const MobileDetect = () => {
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const isSmallScreen = window.innerWidth < 768;
    if (!isSmallScreen) return;

    const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost';

    // Show mobile detected toast
    toast('📱 Mobile detected — install the app for best experience', {
      duration: 4000,
      icon: <Smartphone size={18} />,
      style: { borderRadius: '12px', fontSize: '13px' },
    });

    // Only request location on secure context
    if (!isSecure) {
      toast('📍 Allow location on the listing page to set exact location', {
        duration: 3000,
        icon: <MapPin size={18} />,
        style: { borderRadius: '12px', fontSize: '13px' },
      });
      return;
    }

    setTimeout(() => {
      if (!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition(
        () => {
          toast.success('📍 Location access granted!', { duration: 2000 });
        },
        (err) => {
          if (err.code === 1) {
            toast('📍 Location permission denied — you can set it manually on the listing page', {
              duration: 3000,
              style: { borderRadius: '12px', fontSize: '13px' },
            });
          }
        },
        { enableHighAccuracy: false, timeout: 8000 }
      );
    }, 2000);
  }, []);

  return null;
};

export default MobileDetect;

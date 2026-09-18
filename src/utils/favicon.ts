import { RestaurantBranding } from '../types';

/**
 * Generate a crisp, clean SVG Data URL for restaurant initials or icon
 */
export function generateSvgFavicon(initials: string, colorGradient?: string): string {
  const cleanInitials = (initials || 'RO').trim().slice(0, 3).toUpperCase();
  
  // Pick background color based on gradient setting or theme
  let bgFill = '#059669'; // Emerald default
  if (colorGradient?.includes('amber') || colorGradient?.includes('orange')) {
    bgFill = '#d97706';
  } else if (colorGradient?.includes('red') || colorGradient?.includes('rose')) {
    bgFill = '#e11d48';
  } else if (colorGradient?.includes('blue')) {
    bgFill = '#2563eb';
  } else if (colorGradient?.includes('purple')) {
    bgFill = '#7c3aed';
  } else if (colorGradient?.includes('slate')) {
    bgFill = '#334155';
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <defs>
    <linearGradient id="favGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${bgFill}" />
      <stop offset="100%" stop-color="#0f172a" stop-opacity="0.85" />
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="18" fill="url(#favGrad)" />
  <rect x="2" y="2" width="60" height="60" rx="16" fill="none" stroke="#ffffff" stroke-opacity="0.25" stroke-width="2" />
  <text x="32" y="42" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="${cleanInitials.length > 2 ? 22 : 26}" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="-0.5">${cleanInitials}</text>
</svg>`.trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Update browser tab favicon and document.title across all connected LAN client devices
 */
export function updateFaviconAndTitle(branding?: RestaurantBranding | null): void {
  if (typeof document === 'undefined') return;

  const currentBranding = branding || {
    systemName: 'Imah Kayu Jatinangor',
    outletName: 'Imah Kayu Jatinangor',
    logoType: 'initials' as const,
    logoInitials: 'IK',
    logoColorGradient: 'from-emerald-500 to-teal-600',
  };

  // 1. Update document tab title
  const titlePart = currentBranding.outletName || currentBranding.systemName || 'Restoran';
  const subtitlePart = currentBranding.systemName && currentBranding.systemName !== currentBranding.outletName
    ? currentBranding.systemName
    : 'Sistem Operasional Resto';
  document.title = `${titlePart} • ${subtitlePart}`;

  // 2. Determine target favicon URL
  let targetFavicon = '';
  if (currentBranding.logoType === 'custom_image' && currentBranding.logoUrl) {
    targetFavicon = currentBranding.logoUrl;
  } else {
    const initials = currentBranding.logoInitials || currentBranding.outletName?.substring(0, 2) || 'IK';
    targetFavicon = generateSvgFavicon(initials, currentBranding.logoColorGradient);
  }

  // 3. Update or create all favicon link relations for robust cross-browser & mobile support
  const relTypes = ['icon', 'shortcut icon', 'apple-touch-icon'];

  relTypes.forEach((rel) => {
    let link = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.rel = rel;
      document.head.appendChild(link);
    }
    
    // Set appropriate MIME type
    if (targetFavicon.startsWith('data:image/svg')) {
      link.type = 'image/svg+xml';
    } else if (targetFavicon.startsWith('data:image/png')) {
      link.type = 'image/png';
    } else if (targetFavicon.startsWith('data:image/jpeg') || targetFavicon.startsWith('data:image/jpg')) {
      link.type = 'image/jpeg';
    } else if (targetFavicon.startsWith('data:image/webp')) {
      link.type = 'image/webp';
    }

    link.href = targetFavicon;
  });
}

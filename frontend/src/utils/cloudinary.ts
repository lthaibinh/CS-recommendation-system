/**
 * Cloudinary optimization utilities
 * Provides functions to optimize Cloudinary URLs with f_auto,q_auto parameters
 */

/**
 * Adds Cloudinary optimization parameters to a URL
 * @param url - The original Cloudinary URL
 * @param options - Additional optimization options
 * @returns Optimized Cloudinary URL with f_auto,q_auto parameters
 */
export function optimizeCloudinaryUrl(
  url: string, 
  options: {
    width?: number;
    height?: number;
    crop?: 'fill' | 'fit' | 'limit' | 'scale' | 'crop' | 'thumb';
    gravity?: 'auto' | 'face' | 'center' | 'north' | 'south' | 'east' | 'west';
    quality?: 'auto' | 'auto:best' | 'auto:good' | 'auto:eco' | 'auto:low' | number;
    format?: 'auto' | 'jpg' | 'png' | 'webp' | 'avif';
    dpr?: 'auto' | number;
  } = {}
): string {
  // Check if it's a Cloudinary URL
  if (!url.includes('res.cloudinary.com')) {
    return url;
  }

  // Parse the URL to extract the path
  const urlParts = url.split('/upload/');
  if (urlParts.length !== 2) {
    return url;
  }

  const [baseUrl, path] = urlParts;
  
  // Build transformation parameters
  const transformations: string[] = [];
  
  // Add f_auto for automatic format selection
  transformations.push('f_auto');
  
  // Add q_auto for automatic quality optimization
  transformations.push('q_auto');
  
  // Add width if specified
  if (options.width) {
    transformations.push(`w_${options.width}`);
  }
  
  // Add height if specified
  if (options.height) {
    transformations.push(`h_${options.height}`);
  }
  
  // Add crop mode if specified
  if (options.crop) {
    transformations.push(`c_${options.crop}`);
  }
  
  // Add gravity if specified
  if (options.gravity) {
    transformations.push(`g_${options.gravity}`);
  }
  
  // Add DPR (Device Pixel Ratio) for responsive images
  if (options.dpr) {
    transformations.push(`dpr_${options.dpr}`);
  }
  
  // Join transformations with comma
  const transformationString = transformations.join(',');
  
  // Reconstruct the URL with transformations
  return `${baseUrl}/upload/${transformationString}/${path}`;
}

/**
 * Optimizes Cloudinary URLs for different use cases
 */
export const cloudinaryOptimizations = {
  /**
   * Optimize for thumbnails (small images)
   */
  thumbnail: (url: string, size: number = 300) => 
    optimizeCloudinaryUrl(url, {
      width: size,
      height: size,
      crop: 'fill',
      gravity: 'auto'
    }),
  
  /**
   * Optimize for gallery display (medium images)
   */
  gallery: (url: string, width: number = 800) => 
    optimizeCloudinaryUrl(url, {
      width,
      crop: 'limit'
    }),
  
  /**
   * Optimize for full-size display
   */
  fullSize: (url: string, maxWidth: number = 1920) => 
    optimizeCloudinaryUrl(url, {
      width: maxWidth,
      crop: 'limit'
    }),
  
  /**
   * Optimize for mobile devices
   */
  mobile: (url: string, width: number = 600) => 
    optimizeCloudinaryUrl(url, {
      width,
      crop: 'limit',
      dpr: 'auto'
    }),
  
  /**
   * Optimize for desktop devices
   */
  desktop: (url: string, width: number = 1200) => 
    optimizeCloudinaryUrl(url, {
      width,
      crop: 'limit',
      dpr: 'auto'
    })
};

/**
 * Get responsive image URLs for different screen sizes
 */
export function getResponsiveImageUrls(baseUrl: string) {
  return {
    mobile: cloudinaryOptimizations.mobile(baseUrl, 600),
    tablet: cloudinaryOptimizations.gallery(baseUrl, 800),
    desktop: cloudinaryOptimizations.desktop(baseUrl, 1200),
    full: cloudinaryOptimizations.fullSize(baseUrl, 1920)
  };
}

/**
 * Check if a URL is a Cloudinary URL
 */
export function isCloudinaryUrl(url: string): boolean {
  return url.includes('res.cloudinary.com');
}

/**
 * Extract public ID from Cloudinary URL
 */
export function extractPublicId(url: string): string | null {
  if (!isCloudinaryUrl(url)) {
    return null;
  }
  
  const match = url.match(/\/upload\/[^\/]+\/(.+)$/);
  return match ? match[1] : null;
}

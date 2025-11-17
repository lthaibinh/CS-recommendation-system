// Browser Fingerprinting Utility using FingerprintJS
// Generates a highly unique and stable device identifier
import FingerprintJS from '@fingerprintjs/fingerprintjs';

// Cache the FingerprintJS agent to avoid recreating it
let fpAgentPromise: Promise<any> | null = null;

/**
 * Initialize FingerprintJS agent (cached)
 * This agent uses advanced techniques like Canvas, WebGL, Audio fingerprinting
 */
async function getFpAgent() {
  if (!fpAgentPromise) {
    fpAgentPromise = FingerprintJS.load();
  }
  return fpAgentPromise;
}

/**
 * Generate a unique device fingerprint using FingerprintJS
 * EXCLUDES browser-specific information to identify the device only
 * - Uses Canvas fingerprinting (GPU rendering differences)
 * - Uses WebGL fingerprinting (graphics card signatures)
 * - Uses Audio context fingerprinting
 * - Uses hardware signals (screen, CPU, etc.)
 * 
 * EXCLUDES:
 * - User Agent (browser name/version)
 * - Plugins (browser-specific extensions)
 * - Vendor/Platform strings
 * 
 * @returns Promise<string> - Unique device ID (browser-agnostic)
 */
export async function generateFingerprint(): Promise<string> {
  try {
    const fp = await getFpAgent();
    const result = await fp.get();
    
    // Get all components and filter out browser-specific ones
    const components = result.components;
    const deviceOnlyComponents: any = {};
    
    // Exclude browser-specific components
    const excludeKeys = [
      'userAgent',           // Browser name, version, etc.
      'vendor',              // Browser vendor (Google Inc., Mozilla, etc.)
      'vendorFlavors',       // Browser-specific flavors
      'platform',            // May include browser info
      'plugins',             // Browser plugins/extensions
      'productSub',          // Browser build number
      'osCpu',               // Sometimes includes browser info
    ];
    
    // Keep only device/hardware components
    for (const [key, value] of Object.entries(components)) {
      if (!excludeKeys.includes(key)) {
        deviceOnlyComponents[key] = value;
      }
    }
    
    // Generate a hash from device-only components
    const deviceHash = await generateHashFromComponents(deviceOnlyComponents);
    return deviceHash;
  } catch (error) {
    console.error('Error generating fingerprint:', error);
    // Fallback to a simple hash if FingerprintJS fails
    return await generateFallbackFingerprint();
  }
}

/**
 * Generate a hash from fingerprint components using SHA-256
 * This provides much better collision resistance than simple hash functions
 */
async function generateHashFromComponents(components: any): Promise<string> {
  const str = JSON.stringify(components, Object.keys(components).sort());
  
  // Use Web Crypto API for SHA-256 hashing (browser-native, secure)
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  
  // Convert to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return `device_${hashHex}`;
}

/**
 * Generate Canvas fingerprint (unique to GPU/graphics card)
 * This is very difficult to fake or change without changing hardware
 */
function getCanvasFingerprint(): string {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'no-canvas';
    
    // Draw unique pattern that will render differently on different GPUs
    canvas.width = 200;
    canvas.height = 50;
    ctx.textBaseline = 'top';
    ctx.font = '14px "Arial"';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('Canvas Fingerprint 🎨', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('Canvas Fingerprint 🎨', 4, 17);
    
    // Get canvas data (unique per GPU)
    return canvas.toDataURL();
  } catch (e) {
    return 'canvas-error';
  }
}

/**
 * Fallback fingerprint using DEVICE-ONLY characteristics
 * Used only if FingerprintJS fails to load
 * EXCLUDES easily-changeable settings like timezone, language
 * ONLY uses hardware-based, difficult-to-change attributes
 */
async function generateFallbackFingerprint(): Promise<string> {
  const data = {
    // Hardware-only characteristics (CANNOT be easily changed)
    hardwareConcurrency: navigator.hardwareConcurrency || 0,
    screenResolution: `${screen.width}x${screen.height}`,
    colorDepth: screen.colorDepth,
    pixelRatio: window.devicePixelRatio || 1,
    // Available screen size (hardware characteristic)
    availableScreenSize: `${screen.availWidth}x${screen.availHeight}`,
    // Screen orientation angle (hardware capability)
    screenOrientationAngle: screen.orientation?.angle || 0,
    // Memory (hardware-based, if available)
    deviceMemory: (navigator as any).deviceMemory || 'unknown',
    // Max touch points (hardware capability)
    maxTouchPoints: navigator.maxTouchPoints || 0,
    // Canvas fingerprint (GPU-specific, very unique!)
    canvasFingerprint: getCanvasFingerprint(),
    // WebGL vendor/renderer (graphics card info)
    webglVendor: getWebGLInfo().vendor,
    webglRenderer: getWebGLInfo().renderer,
    // REMOVED: language (user can change in settings)
    // REMOVED: timezone (user can change in settings)
    // REMOVED: screenOrientation.type (changes on device rotation)
  };
  
  // Use SHA-256 for better collision resistance
  const str = JSON.stringify(data, Object.keys(data).sort());
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  
  // Convert to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return `fallback_${hashHex}`;
}

/**
 * Get WebGL information (graphics card details)
 */
function getWebGLInfo(): { vendor: string; renderer: string } {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return { vendor: 'no-webgl', renderer: 'no-webgl' };
    
    const debugInfo = (gl as any).getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) return { vendor: 'no-debug-info', renderer: 'no-debug-info' };
    
    return {
      vendor: (gl as any).getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || 'unknown',
      renderer: (gl as any).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'unknown',
    };
  } catch (e) {
    return { vendor: 'webgl-error', renderer: 'webgl-error' };
  }
}

/**
 * Get or create persistent fingerprint
 * First checks localStorage, then generates new one if needed
 * 
 * @returns Promise<string> - The device fingerprint
 */
export async function getOrCreateFingerprint(): Promise<string> {
  // Try to get from localStorage first for consistency
  const storedFingerprint = localStorage.getItem('deviceFingerprint');
  
  if (storedFingerprint) {
    console.log('📌 Using stored fingerprint:', storedFingerprint.substring(0, 10) + '...');
    return storedFingerprint;
  }
  
  // Generate new fingerprint using FingerprintJS
  console.log('🔍 Generating new fingerprint...');
  const newFingerprint = await generateFingerprint();
  console.log('✅ Fingerprint generated:', newFingerprint.substring(0, 10) + '...');
  
  // Store in localStorage for consistency across page refreshes
  try {
    localStorage.setItem('deviceFingerprint', newFingerprint);
  } catch (e) {
    console.warn('Could not store fingerprint in localStorage:', e);
  }
  
  return newFingerprint;
}

/**
 * Clear stored fingerprint (for testing purposes)
 * After clearing, next call to getOrCreateFingerprint() will generate a new one
 */
export function clearFingerprint(): void {
  localStorage.removeItem('deviceFingerprint');
  console.log('🗑️ Fingerprint cleared from localStorage');
}

/**
 * Get detailed fingerprint information (for debugging)
 * Returns the full component breakdown from FingerprintJS
 */
export async function getFingerprintDetails() {
  try {
    const fp = await getFpAgent();
    const result = await fp.get();
    return {
      visitorId: result.visitorId,
      confidence: result.confidence,
      components: result.components,
      version: result.version,
    };
  } catch (error) {
    console.error('Error getting fingerprint details:', error);
    return null;
  }
}


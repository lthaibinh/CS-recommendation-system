'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = () => {
      const cookies = document.cookie.split(';');
      const roleCookie = cookies.find(cookie => cookie.trim().startsWith('role='));
      const userIdCookie = cookies.find(cookie => cookie.trim().startsWith('userId='));
      
      const role = roleCookie ? roleCookie.split('=')[1] : null;
      const userId = userIdCookie ? userIdCookie.split('=')[1] : null;

      if (!role) {
        // No authentication found, redirect to login
        router.push('/login');
      } else {
        // User is authenticated, redirect based on role
        if (role === 'admin') {
          router.push('/admin');
        } else if (role === 'client' && userId) {
          router.push(`/client/${userId}`);
        } else {
          // Invalid role, redirect to login
          router.push('/login');
        }
      }
    };

    checkAuth();
  }, [router]);

  // Show loading state while checking authentication
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}

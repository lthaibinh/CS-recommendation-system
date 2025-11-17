'use client';

import { useEffect } from 'react';

export default function FlowbiteProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize Flowbite
    if (typeof window !== 'undefined') {
      import('flowbite').then((module) => {
        module.initFlowbite();
      });
    }

    // Dark mode toggle
    const themeToggleDarkIcon = document.getElementById('theme-toggle-dark-icon');
    const themeToggleLightIcon = document.getElementById('theme-toggle-light-icon');
    const themeToggleBtn = document.getElementById('theme-toggle');

    // Change the icons inside the button based on previous settings
    if (
      localStorage.getItem('color-theme') === 'dark' ||
      (!('color-theme' in localStorage) &&
        window.matchMedia('(prefers-color-scheme: dark)').matches)
    ) {
      document.documentElement.classList.add('dark');
      themeToggleLightIcon?.classList.remove('hidden');
    } else {
      document.documentElement.classList.remove('dark');
      themeToggleDarkIcon?.classList.remove('hidden');
    }

    const handleThemeToggle = () => {
      // toggle icons inside button
      themeToggleDarkIcon?.classList.toggle('hidden');
      themeToggleLightIcon?.classList.toggle('hidden');

      // if set via local storage previously
      if (localStorage.getItem('color-theme')) {
        if (localStorage.getItem('color-theme') === 'light') {
          document.documentElement.classList.add('dark');
          localStorage.setItem('color-theme', 'dark');
        } else {
          document.documentElement.classList.remove('dark');
          localStorage.setItem('color-theme', 'light');
        }

        // if NOT set via local storage previously
      } else {
        if (document.documentElement.classList.contains('dark')) {
          document.documentElement.classList.remove('dark');
          localStorage.setItem('color-theme', 'light');
        } else {
          document.documentElement.classList.add('dark');
          localStorage.setItem('color-theme', 'dark');
        }
      }
    };

    themeToggleBtn?.addEventListener('click', handleThemeToggle);

    // Sidebar toggle for mobile
    const sidebar = document.getElementById('sidebar');
    const toggleSidebarMobile = document.getElementById('toggleSidebarMobile');
    const sidebarBackdrop = document.getElementById('sidebarBackdrop');

    const handleSidebarToggle = () => {
      sidebar?.classList.toggle('hidden');
      sidebarBackdrop?.classList.toggle('hidden');
    };

    toggleSidebarMobile?.addEventListener('click', handleSidebarToggle);
    sidebarBackdrop?.addEventListener('click', handleSidebarToggle);

    // Cleanup
    return () => {
      themeToggleBtn?.removeEventListener('click', handleThemeToggle);
      toggleSidebarMobile?.removeEventListener('click', handleSidebarToggle);
      sidebarBackdrop?.removeEventListener('click', handleSidebarToggle);
    };
  }, []);

  return <>{children}</>;
}



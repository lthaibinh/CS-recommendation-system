import type { Metadata } from 'next';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import FlowbiteProvider from '@/components/FlowbiteProvider';

export const metadata: Metadata = {
  title: 'Admin Dashboard',
  description: 'Admin dashboard built with Next.js and Flowbite',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FlowbiteProvider>
      <div className="antialiased bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="flex pt-16 overflow-hidden bg-gray-50 dark:bg-gray-900">
          <Sidebar />
          <div
            id="main-content"
            className="relative w-full h-full overflow-y-auto bg-gray-50 lg:ml-64 dark:bg-gray-900"
          >
            <main>{children}</main>
          </div>
        </div>
      </div>
    </FlowbiteProvider>
  );
}


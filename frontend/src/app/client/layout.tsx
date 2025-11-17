import type { Metadata } from 'next';

import FlowbiteProvider from '@/components/FlowbiteProvider';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
    title: 'Admin Dashboard',
    description: 'Admin dashboard built with Next.js and Flowbite',
};

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const role = cookies().get("role")?.value;
    const userId = cookies().get("userId")?.value;
    console.log(role, userId)
    if(!role || role !== "client" || !userId) redirect("/login");
    console.log(role, cookies().get("userId")?.value)
    return (
        <>{children}</>
    );
}


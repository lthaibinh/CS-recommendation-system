import OverviewCharts from '@/components/OverviewCharts';
import SalesChart from './components/SalesChart';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default function AdminDashboard() {
  const role = cookies().get("role")?.value;
  if(!role || role !== "admin") redirect("/login");
 
  return (
    <div className="px-4 pt-6">
      <OverviewCharts />
    </div>
  );
}



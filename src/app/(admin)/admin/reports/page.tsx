import { ReportsView } from '@/components/admin/ReportsView';

export default function AdminReportsPage() {
  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-lg font-semibold text-gray-900">Reports</h1>
      <ReportsView />
    </div>
  );
}

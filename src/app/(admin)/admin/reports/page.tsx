import { ReportsView } from '@/components/admin/ReportsView';

export default function AdminReportsPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">Reports</h1>
      <ReportsView />
    </div>
  );
}

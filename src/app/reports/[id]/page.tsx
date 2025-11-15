'use client';

import { useParams } from 'next/navigation';
import { Reports } from '@/app/features/reports/Reports';

export default function ReportDetailPage() {
  const params = useParams();
  const testRunId = params.id as string;

  return <Reports testRunId={testRunId} />;
}

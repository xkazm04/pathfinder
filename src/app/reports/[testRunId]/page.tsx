interface ReportPageProps {
  params: {
    testRunId: string;
  };
}

export default async function ReportPage({ params }: ReportPageProps) {
  const { testRunId } = await params;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-neutral-900">Test Report</h1>
      <p className="mt-4 text-neutral-600">Report ID: {testRunId}</p>
    </div>
  );
}

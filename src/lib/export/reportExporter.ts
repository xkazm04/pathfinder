import type { Finding } from '@/lib/supabase/aiAnalyses';

interface TestResult {
  id: string;
  test_name: string;
  status: 'pass' | 'fail' | 'skip' | 'skipped';
  viewport: string;
  viewport_size: string;
  duration_ms?: number;
  errors?: any[];
  screenshots?: any[];
}

interface ReportData {
  testRun: {
    id: string;
    suite_name: string;
    created_at: string;
    status: string;
    total_tests: number;
  };
  results: TestResult[];
  findings?: Finding[];
  qualityScore?: number;
}

/**
 * Export report as JSON
 */
export function exportAsJSON(reportData: ReportData): void {
  const json = JSON.stringify(reportData, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `test-report-${reportData.testRun.id}-${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export report as CSV
 */
export function exportAsCSV(reportData: ReportData): void {
  const headers = ['Test Name', 'Status', 'Viewport', 'Size', 'Duration (s)', 'Errors'];
  const rows = reportData.results.map(result => [
    result.test_name,
    result.status,
    result.viewport,
    result.viewport_size,
    result.duration_ms ? (result.duration_ms / 1000).toFixed(2) : '0.00',
    result.errors?.length || 0,
  ]);

  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `test-report-${reportData.testRun.id}-${Date.now()}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export report as Markdown
 */
export function exportAsMarkdown(reportData: ReportData): void {
  const { testRun, results, findings, qualityScore } = reportData;

  const passedTests = results.filter(r => r.status === 'pass').length;
  const failedTests = results.filter(r => r.status === 'fail').length;
  const skippedTests = results.filter(r => r.status === 'skip').length;
  const passRate = results.length > 0 ? (passedTests / results.length) * 100 : 0;

  let markdown = `# Test Report: ${testRun.suite_name}\n\n`;
  markdown += `**Test Run ID:** ${testRun.id}\n\n`;
  markdown += `**Date:** ${new Date(testRun.created_at).toLocaleString()}\n\n`;
  markdown += `**Status:** ${testRun.status}\n\n`;

  // Summary
  markdown += `## Summary\n\n`;
  markdown += `- **Total Tests:** ${results.length}\n`;
  markdown += `- **Passed:** ${passedTests} (${passRate.toFixed(1)}%)\n`;
  markdown += `- **Failed:** ${failedTests}\n`;
  markdown += `- **Skipped:** ${skippedTests}\n`;

  if (qualityScore !== undefined) {
    markdown += `- **Quality Score:** ${qualityScore}/100\n`;
  }

  if (findings && findings.length > 0) {
    markdown += `- **Issues Found:** ${findings.length}\n`;
  }

  markdown += `\n`;

  // AI Analysis Summary
  if (findings && findings.length > 0) {
    markdown += `## AI Analysis Summary\n\n`;

    const criticalCount = findings.filter(f => f.severity === 'critical').length;
    const warningCount = findings.filter(f => f.severity === 'warning').length;
    const infoCount = findings.filter(f => f.severity === 'info').length;

    markdown += `- **Critical Issues:** ${criticalCount}\n`;
    markdown += `- **Warnings:** ${warningCount}\n`;
    markdown += `- **Info:** ${infoCount}\n\n`;

    // Group by category
    const byCategory = findings.reduce((acc, finding) => {
      const cat = finding.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(finding);
      return acc;
    }, {} as Record<string, Finding[]>);

    markdown += `### Issues by Category\n\n`;
    Object.entries(byCategory).forEach(([category, items]) => {
      markdown += `#### ${category.charAt(0).toUpperCase() + category.slice(1)} (${items.length})\n\n`;
      items.forEach((finding, idx) => {
        markdown += `${idx + 1}. **[${finding.severity.toUpperCase()}]** ${finding.issue}\n`;
        markdown += `   - **Location:** ${finding.location || 'N/A'}\n`;
        markdown += `   - **Recommendation:** ${finding.recommendation}\n`;
        markdown += `   - **Confidence:** ${(finding.confidenceScore * 100).toFixed(0)}%\n`;
        if (finding.affectedElements && finding.affectedElements.length > 0) {
          markdown += `   - **Affected Elements:** ${finding.affectedElements.join(', ')}\n`;
        }
        markdown += `\n`;
      });
    });
  }

  // Test Results
  markdown += `## Test Results\n\n`;
  markdown += `| Test Name | Status | Viewport | Duration | Errors |\n`;
  markdown += `|-----------|--------|----------|----------|--------|\n`;

  results.forEach(result => {
    const status = result.status === 'pass' ? '✅ Pass' : result.status === 'fail' ? '❌ Fail' : '⊘ Skip';
    const duration = result.duration_ms ? `${(result.duration_ms / 1000).toFixed(2)}s` : '0.00s';
    const errorCount = result.errors?.length || 0;

    markdown += `| ${result.test_name} | ${status} | ${result.viewport} (${result.viewport_size}) | ${duration} | ${errorCount} |\n`;
  });

  markdown += `\n`;

  // Failed Tests Details
  const failedResults = results.filter(r => r.status === 'fail' && r.errors && r.errors.length > 0);
  if (failedResults.length > 0) {
    markdown += `## Failed Tests Details\n\n`;

    failedResults.forEach(result => {
      markdown += `### ${result.test_name} (${result.viewport})\n\n`;
      markdown += `**Viewport Size:** ${result.viewport_size}\n\n`;
      markdown += `**Duration:** ${result.duration_ms ? (result.duration_ms / 1000).toFixed(2) : '0.00'}s\n\n`;
      markdown += `**Errors:**\n\n`;

      result.errors?.forEach((error, idx) => {
        markdown += `${idx + 1}. ${error.message || 'Unknown error'}\n`;
        if (error.stack) {
          markdown += `\`\`\`\n${error.stack}\n\`\`\`\n`;
        }
        markdown += `\n`;
      });
    });
  }

  // Footer
  markdown += `---\n\n`;
  markdown += `*Generated by Pathfinder - AI-Powered Test Automation Platform*\n`;
  markdown += `*Export Date: ${new Date().toLocaleString()}*\n`;

  const blob = new Blob([markdown], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `test-report-${testRun.id}-${Date.now()}.md`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export report as HTML (can be printed to PDF)
 */
export function exportAsHTML(reportData: ReportData): void {
  const { testRun, results, findings, qualityScore } = reportData;

  const passedTests = results.filter(r => r.status === 'pass').length;
  const failedTests = results.filter(r => r.status === 'fail').length;
  const skippedTests = results.filter(r => r.status === 'skip').length;
  const passRate = results.length > 0 ? (passedTests / results.length) * 100 : 0;

  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Test Report - ${testRun.suite_name}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      max-width: 1200px;
      margin: 0 auto;
      padding: 40px 20px;
      background: #f9fafb;
      color: #111827;
    }
    h1 { color: #1f2937; border-bottom: 3px solid #3b82f6; padding-bottom: 10px; }
    h2 { color: #374151; margin-top: 40px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; }
    h3 { color: #4b5563; }
    .meta { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
    .stat-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .stat-value { font-size: 32px; font-weight: bold; margin: 10px 0; }
    .stat-label { color: #6b7280; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin: 20px 0; }
    th { background: #f3f4f6; padding: 12px; text-align: left; font-weight: 600; color: #374151; }
    td { padding: 12px; border-top: 1px solid #e5e7eb; }
    .status-pass { color: #10b981; font-weight: 600; }
    .status-fail { color: #ef4444; font-weight: 600; }
    .status-skip { color: #f59e0b; font-weight: 600; }
    .severity-critical { color: #ef4444; font-weight: bold; }
    .severity-warning { color: #f97316; font-weight: 600; }
    .severity-info { color: #3b82f6; }
    .finding { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #e5e7eb; border-radius: 4px; }
    .finding.critical { border-left-color: #ef4444; background: #fef2f2; }
    .finding.warning { border-left-color: #f97316; background: #fff7ed; }
    @media print {
      body { background: white; }
      .stat-card, table, .meta, .finding { box-shadow: none; border: 1px solid #e5e7eb; }
    }
  </style>
</head>
<body>
  <h1>Test Report: ${testRun.suite_name}</h1>

  <div class="meta">
    <p><strong>Test Run ID:</strong> ${testRun.id}</p>
    <p><strong>Date:</strong> ${new Date(testRun.created_at).toLocaleString()}</p>
    <p><strong>Status:</strong> ${testRun.status}</p>
  </div>

  <h2>Summary</h2>
  <div class="summary">
    <div class="stat-card">
      <div class="stat-label">Total Tests</div>
      <div class="stat-value">${results.length}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Pass Rate</div>
      <div class="stat-value status-pass">${passRate.toFixed(1)}%</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Failed</div>
      <div class="stat-value status-fail">${failedTests}</div>
    </div>
    ${qualityScore !== undefined ? `
    <div class="stat-card">
      <div class="stat-label">Quality Score</div>
      <div class="stat-value">${qualityScore}/100</div>
    </div>
    ` : ''}
  </div>
`;

  // AI Analysis
  if (findings && findings.length > 0) {
    const criticalCount = findings.filter(f => f.severity === 'critical').length;
    const warningCount = findings.filter(f => f.severity === 'warning').length;
    const infoCount = findings.filter(f => f.severity === 'info').length;

    html += `
  <h2>AI Analysis (${findings.length} issues found)</h2>
  <div class="summary">
    <div class="stat-card">
      <div class="stat-label">Critical</div>
      <div class="stat-value severity-critical">${criticalCount}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Warnings</div>
      <div class="stat-value severity-warning">${warningCount}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Info</div>
      <div class="stat-value severity-info">${infoCount}</div>
    </div>
  </div>

  <h3>Issues Details</h3>
`;

    findings.forEach(finding => {
      html += `
  <div class="finding ${finding.severity}">
    <h4><span class="severity-${finding.severity}">[${finding.severity.toUpperCase()}]</span> ${finding.issue}</h4>
    <p><strong>Category:</strong> ${finding.category}</p>
    <p><strong>Location:</strong> ${finding.location || 'N/A'}</p>
    <p><strong>Recommendation:</strong> ${finding.recommendation}</p>
    <p><strong>Confidence:</strong> ${(finding.confidenceScore * 100).toFixed(0)}%</p>
    ${finding.affectedElements && finding.affectedElements.length > 0 ? `
    <p><strong>Affected Elements:</strong> ${finding.affectedElements.join(', ')}</p>
    ` : ''}
  </div>
`;
    });
  }

  // Test Results Table
  html += `
  <h2>Test Results</h2>
  <table>
    <thead>
      <tr>
        <th>Test Name</th>
        <th>Status</th>
        <th>Viewport</th>
        <th>Duration</th>
        <th>Errors</th>
      </tr>
    </thead>
    <tbody>
`;

  results.forEach(result => {
    const statusClass = `status-${result.status}`;
    const statusText = result.status === 'pass' ? '✅ Pass' : result.status === 'fail' ? '❌ Fail' : '⊘ Skip';

    html += `
      <tr>
        <td>${result.test_name}</td>
        <td class="${statusClass}">${statusText}</td>
        <td>${result.viewport} (${result.viewport_size})</td>
        <td>${result.duration_ms ? (result.duration_ms / 1000).toFixed(2) : '0.00'}s</td>
        <td>${result.errors?.length || 0}</td>
      </tr>
`;
  });

  html += `
    </tbody>
  </table>

  <hr style="margin: 40px 0; border: none; border-top: 1px solid #e5e7eb;">
  <p style="text-align: center; color: #6b7280; font-size: 14px;">
    Generated by Pathfinder - AI-Powered Test Automation Platform<br>
    Export Date: ${new Date().toLocaleString()}
  </p>
</body>
</html>
`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `test-report-${testRun.id}-${Date.now()}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

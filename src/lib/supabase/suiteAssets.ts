import { supabase } from '../supabase';
import { ScreenshotMetadata, TestScenario } from '../types';

/**
 * Save suite screenshots to database
 * This saves metadata about screenshots captured during suite generation
 */
export async function saveSuiteScreenshots(
  suiteId: string,
  screenshots: ScreenshotMetadata[]
): Promise<void> {
  if (!screenshots || screenshots.length === 0) {
    return;
  }

  const screenshotRecords = screenshots.map((screenshot, index) => {
    const viewportSize = `${screenshot.width || 1920}x${screenshot.height || 1080}`;
    return {
      suite_id: suiteId,
      viewport: screenshot.viewportName || 'desktop',
      viewport_size: viewportSize,
      screenshot_url: screenshot.screenshotUrl || screenshot.url || '',
      storage_path: `${suiteId}/${screenshot.viewportName || 'desktop'}-${index}.png`,
      captured_at: new Date().toISOString(),
    };
  });

  const { error } = await supabase
    .from('suite_screenshots')
    .insert(screenshotRecords);

  if (error) {
    console.error('Failed to save suite screenshots:', error);
    throw new Error(`Failed to save screenshots: ${error.message}`);
  }
}

/**
 * Get screenshots for a test suite
 */
export async function getSuiteScreenshots(
  suiteId: string
): Promise<ScreenshotMetadata[]> {
  const { data, error } = await supabase
    .from('suite_screenshots')
    .select('*')
    .eq('suite_id', suiteId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Failed to fetch suite screenshots:', error);
    return [];
  }

  if (!data) {
    return [];
  }

  return data.map((record) => {
    const [width, height] = record.viewport_size.split('x').map(Number);
    return {
      viewportName: record.viewport,
      width: width || 1920,
      height: height || 1080,
      url: record.screenshot_url,
      screenshotUrl: record.screenshot_url,
    };
  });
}

/**
 * Delete screenshots for a test suite
 */
export async function deleteSuiteScreenshots(suiteId: string): Promise<void> {
  const { error } = await supabase
    .from('suite_screenshots')
    .delete()
    .eq('suite_id', suiteId);

  if (error) {
    console.error('Failed to delete suite screenshots:', error);
    throw new Error(`Failed to delete screenshots: ${error.message}`);
  }
}

/**
 * Save test scenarios to database
 */
export async function saveTestScenarios(
  suiteId: string,
  scenarios: TestScenario[]
): Promise<void> {
  if (!scenarios || scenarios.length === 0) {
    return;
  }

  const scenarioRecords = scenarios.map((scenario, index) => ({
    suite_id: suiteId,
    title: scenario.name || `Scenario ${index + 1}`, // Use 'name' field from TestScenario
    description: scenario.description || '',
    steps: scenario.steps || [],
    priority: scenario.priority || 'medium',
    category: scenario.category || 'functional',
    expected_outcome: Array.isArray(scenario.expectedOutcomes)
      ? scenario.expectedOutcomes.join('; ')
      : '', // Convert array to string
    confidence_score: 0.8, // Default confidence score
    order_index: index,
  }));

  const { error } = await supabase
    .from('test_scenarios')
    .insert(scenarioRecords);

  if (error) {
    console.error('Failed to save test scenarios:', error);
    throw new Error(`Failed to save scenarios: ${error.message}`);
  }
}

/**
 * Get test scenarios for a test suite
 */
export async function getTestScenarios(suiteId: string): Promise<TestScenario[]> {
  const { data, error } = await supabase
    .from('test_scenarios')
    .select('*')
    .eq('suite_id', suiteId)
    .order('order_index', { ascending: true });

  if (error) {
    console.error('Failed to fetch test scenarios:', error);
    return [];
  }

  if (!data) {
    return [];
  }

  return data.map((record) => ({
    id: record.id,
    name: record.title, // Map 'title' to 'name' field
    description: record.description,
    steps: record.steps,
    priority: record.priority,
    category: record.category,
    expectedOutcomes: record.expected_outcome
      ? record.expected_outcome.split('; ')
      : [], // Convert string back to array
    viewports: [], // Default empty array, could be enhanced later
  }));
}

/**
 * Delete scenarios for a test suite
 */
export async function deleteTestScenarios(suiteId: string): Promise<void> {
  const { error } = await supabase
    .from('test_scenarios')
    .delete()
    .eq('suite_id', suiteId);

  if (error) {
    console.error('Failed to delete test scenarios:', error);
    throw new Error(`Failed to delete scenarios: ${error.message}`);
  }
}

/**
 * Update a test scenario
 */
export async function updateTestScenario(
  scenarioId: string,
  updates: Partial<TestScenario>
): Promise<void> {
  const updateData: Record<string, unknown> = {};

  if (updates.name !== undefined) updateData.title = updates.name;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.steps !== undefined) updateData.steps = updates.steps;
  if (updates.priority !== undefined) updateData.priority = updates.priority;
  if (updates.category !== undefined) updateData.category = updates.category;
  if (updates.expectedOutcomes !== undefined) {
    updateData.expected_outcome = Array.isArray(updates.expectedOutcomes)
      ? updates.expectedOutcomes.join('; ')
      : '';
  }

  const { error } = await supabase
    .from('test_scenarios')
    .update(updateData)
    .eq('id', scenarioId);

  if (error) {
    console.error('Failed to update test scenario:', error);
    throw new Error(`Failed to update scenario: ${error.message}`);
  }
}

/**
 * Save a single flow scenario
 */
export async function saveFlowScenario(
  suiteId: string,
  flowName: string,
  flowDescription: string,
  flowSteps: any[]
): Promise<string> {
  const scenarioRecord = {
    suite_id: suiteId,
    title: flowName,
    description: flowDescription,
    steps: flowSteps,
    priority: 'medium',
    category: 'flow-builder',
    confidence_score: 1.0, // User-created flows have full confidence
    order_index: 0,
  };

  const { data, error } = await supabase
    .from('test_scenarios')
    .insert([scenarioRecord])
    .select()
    .single();

  if (error) {
    console.error('Failed to save flow scenario:', error);
    throw new Error(`Failed to save flow: ${error.message}`);
  }

  return data.id;
}

/**
 * Update an existing flow scenario
 */
export async function updateFlowScenario(
  scenarioId: string,
  flowName: string,
  flowDescription: string,
  flowSteps: any[]
): Promise<void> {
  const { error } = await supabase
    .from('test_scenarios')
    .update({
      title: flowName,
      description: flowDescription,
      steps: flowSteps,
    })
    .eq('id', scenarioId);

  if (error) {
    console.error('Failed to update flow scenario:', error);
    throw new Error(`Failed to update flow: ${error.message}`);
  }
}

/**
 * Get flow scenarios for a suite
 */
export async function getFlowScenarios(suiteId: string): Promise<TestScenario[]> {
  const { data, error } = await supabase
    .from('test_scenarios')
    .select('*')
    .eq('suite_id', suiteId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch flow scenarios:', error);
    return [];
  }

  if (!data) {
    return [];
  }

  return data.map((record) => ({
    id: record.id,
    name: record.title,
    description: record.description,
    steps: record.steps,
    priority: record.priority,
    category: record.category,
    expectedOutcomes: record.expected_outcome
      ? record.expected_outcome.split('; ')
      : [],
    viewports: [],
  }));
}

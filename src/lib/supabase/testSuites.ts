import { supabase } from '../supabase';
import { TestSuite, TestCode } from '../types';

/**
 * Create a new test suite
 */
export async function createTestSuite(data: {
  name: string;
  target_url: string;
  description?: string;
}): Promise<string> {
  const { data: suite, error } = await supabase
    .from('test_suites')
    .insert({
      name: data.name,
      target_url: data.target_url,
      description: data.description,
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to create test suite: ${error.message}`);
  }

  return suite.id;
}

/**
 * Save or update test code for a suite
 */
export async function saveTestCode(
  suiteId: string,
  code: string,
  language: string = 'typescript'
): Promise<void> {
  // Get the latest version for this suite
  const { data: latestCode } = await supabase
    .from('test_code')
    .select('version')
    .eq('suite_id', suiteId)
    .order('version', { ascending: false })
    .limit(1)
    .single();

  const nextVersion = latestCode ? latestCode.version + 1 : 1;

  const { error } = await supabase.from('test_code').insert({
    suite_id: suiteId,
    code,
    language,
    version: nextVersion,
  });

  if (error) {
    throw new Error(`Failed to save test code: ${error.message}`);
  }
}

/**
 * Get all test suites with their latest code
 */
export async function getTestSuites(): Promise<TestSuite[]> {
  const { data, error } = await supabase
    .from('test_suites')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch test suites: ${error.message}`);
  }

  return data || [];
}

/**
 * Get a single test suite by ID
 */
export async function getTestSuite(suiteId: string): Promise<TestSuite | null> {
  const { data, error } = await supabase
    .from('test_suites')
    .select('*')
    .eq('id', suiteId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    throw new Error(`Failed to fetch test suite: ${error.message}`);
  }

  return data;
}

/**
 * Get the latest test code for a suite
 */
export async function getLatestTestCode(suiteId: string): Promise<TestCode | null> {
  const { data, error } = await supabase
    .from('test_code')
    .select('*')
    .eq('suite_id', suiteId)
    .order('version', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    throw new Error(`Failed to fetch test code: ${error.message}`);
  }

  return data;
}

/**
 * Get all versions of test code for a suite
 */
export async function getTestCodeHistory(suiteId: string): Promise<TestCode[]> {
  const { data, error} = await supabase
    .from('test_code')
    .select('*')
    .eq('suite_id', suiteId)
    .order('version', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch test code history: ${error.message}`);
  }

  return data || [];
}

/**
 * Update a test suite
 */
export async function updateTestSuite(
  suiteId: string,
  updates: Partial<Pick<TestSuite, 'name' | 'target_url' | 'description'>>
): Promise<void> {
  const { error } = await supabase
    .from('test_suites')
    .update(updates)
    .eq('id', suiteId);

  if (error) {
    throw new Error(`Failed to update test suite: ${error.message}`);
  }
}

/**
 * Delete a test suite (cascade deletes test_code, test_runs, etc.)
 */
export async function deleteTestSuite(suiteId: string): Promise<void> {
  const { error } = await supabase
    .from('test_suites')
    .delete()
    .eq('id', suiteId);

  if (error) {
    throw new Error(`Failed to delete test suite: ${error.message}`);
  }
}

/**
 * Duplicate a test suite with its latest code
 */
export async function duplicateTestSuite(suiteId: string): Promise<string> {
  // Get original suite
  const suite = await getTestSuite(suiteId);
  if (!suite) {
    throw new Error('Test suite not found');
  }

  // Get latest code
  const code = await getLatestTestCode(suiteId);

  // Create duplicate
  const newSuiteId = await createTestSuite({
    name: `${suite.name} (Copy)`,
    target_url: suite.target_url,
    description: suite.description,
  });

  // Copy code if exists
  if (code) {
    await saveTestCode(newSuiteId, code.code, code.language);
  }

  return newSuiteId;
}

import { createClient } from '@supabase/supabase-js';
import type {
  TestSuite,
  TestRun,
  TestResult,
  AIAnalysis,
  TestCode
} from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test Suites Operations
export const testSuiteOperations = {
  async getAll() {
    const { data, error } = await supabase
      .from('test_suites')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as TestSuite[];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('test_suites')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as TestSuite;
  },

  async create(suite: Omit<TestSuite, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('test_suites')
      .insert(suite)
      .select()
      .single();

    if (error) throw error;
    return data as TestSuite;
  },

  async update(id: string, updates: Partial<TestSuite>) {
    const { data, error } = await supabase
      .from('test_suites')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as TestSuite;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('test_suites')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

// Test Runs Operations
export const testRunOperations = {
  async getAll(suiteId?: string) {
    let query = supabase
      .from('test_runs')
      .select('*')
      .order('created_at', { ascending: false });

    if (suiteId) {
      query = query.eq('suite_id', suiteId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as TestRun[];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('test_runs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as TestRun;
  },

  async create(run: Omit<TestRun, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('test_runs')
      .insert(run)
      .select()
      .single();

    if (error) throw error;
    return data as TestRun;
  },

  async updateStatus(
    id: string,
    status: TestRun['status'],
    additionalData?: Partial<TestRun>
  ) {
    const updates: Partial<TestRun> = { status, ...additionalData };

    if (status === 'running' && !additionalData?.started_at) {
      updates.started_at = new Date().toISOString();
    }

    if (status === 'completed' || status === 'failed') {
      updates.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('test_runs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as TestRun;
  },
};

// Test Results Operations
export const testResultOperations = {
  async getByRunId(runId: string) {
    const { data, error } = await supabase
      .from('test_results')
      .select('*')
      .eq('run_id', runId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as TestResult[];
  },

  async create(result: Omit<TestResult, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('test_results')
      .insert(result)
      .select()
      .single();

    if (error) throw error;
    return data as TestResult;
  },
};

// AI Analysis Operations
export const aiAnalysisOperations = {
  async getByResultId(resultId: string) {
    const { data, error } = await supabase
      .from('ai_analyses')
      .select('*')
      .eq('result_id', resultId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as AIAnalysis[];
  },

  async create(analysis: Omit<AIAnalysis, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('ai_analyses')
      .insert(analysis)
      .select()
      .single();

    if (error) throw error;
    return data as AIAnalysis;
  },
};

// Test Code Operations
export const testCodeOperations = {
  async getBySuiteId(suiteId: string) {
    const { data, error } = await supabase
      .from('test_code')
      .select('*')
      .eq('suite_id', suiteId)
      .order('version', { ascending: false })
      .limit(1)
      .single();

    if (error) throw error;
    return data as TestCode;
  },

  async create(code: Omit<TestCode, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('test_code')
      .insert(code)
      .select()
      .single();

    if (error) throw error;
    return data as TestCode;
  },
};

// Real-time Subscriptions
export const subscribeToTestRuns = (
  suiteId: string,
  callback: (payload: TestRun) => void
) => {
  return supabase
    .channel(`test_runs:suite_id=eq.${suiteId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'test_runs',
        filter: `suite_id=eq.${suiteId}`,
      },
      (payload) => {
        callback(payload.new as TestRun);
      }
    )
    .subscribe();
};

export const subscribeToTestResults = (
  runId: string,
  callback: (payload: TestResult) => void
) => {
  return supabase
    .channel(`test_results:run_id=eq.${runId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'test_results',
        filter: `run_id=eq.${runId}`,
      },
      (payload) => {
        callback(payload.new as TestResult);
      }
    )
    .subscribe();
};

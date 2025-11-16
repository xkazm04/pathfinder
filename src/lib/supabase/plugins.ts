import { supabase } from '../supabase';
import { InstalledPlugin, PluginRegistry } from '../types';

/**
 * Save an installed plugin to Supabase
 */
export async function saveInstalledPlugin(plugin: InstalledPlugin) {
  const { data, error } = await supabase
    .from('installed_plugins')
    .insert({
      plugin_id: plugin.plugin_id,
      plugin_action: plugin.plugin_action,
      enabled: plugin.enabled,
      install_source: plugin.install_source,
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving installed plugin:', error);
    throw error;
  }

  return data;
}

/**
 * Fetch all installed plugins from Supabase
 */
export async function fetchInstalledPlugins(): Promise<InstalledPlugin[]> {
  const { data, error } = await supabase
    .from('installed_plugins')
    .select('*')
    .order('installed_at', { ascending: false });

  if (error) {
    console.error('Error fetching installed plugins:', error);
    return [];
  }

  return data as InstalledPlugin[];
}

/**
 * Update plugin enabled state
 */
export async function updatePluginEnabledState(pluginId: string, enabled: boolean) {
  const { data, error } = await supabase
    .from('installed_plugins')
    .update({ enabled })
    .eq('plugin_id', pluginId)
    .select()
    .single();

  if (error) {
    console.error('Error updating plugin state:', error);
    throw error;
  }

  return data;
}

/**
 * Delete an installed plugin
 */
export async function deleteInstalledPlugin(pluginId: string) {
  const { error } = await supabase
    .from('installed_plugins')
    .delete()
    .eq('plugin_id', pluginId);

  if (error) {
    console.error('Error deleting plugin:', error);
    throw error;
  }

  return true;
}

/**
 * Fetch all plugin registries
 */
export async function fetchPluginRegistries(): Promise<PluginRegistry[]> {
  const { data, error } = await supabase
    .from('plugin_registries')
    .select('*')
    .eq('enabled', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching plugin registries:', error);
    return [];
  }

  return data as PluginRegistry[];
}

/**
 * Add a new plugin registry
 */
export async function addPluginRegistry(registry: Omit<PluginRegistry, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('plugin_registries')
    .insert(registry)
    .select()
    .single();

  if (error) {
    console.error('Error adding plugin registry:', error);
    throw error;
  }

  return data;
}

/**
 * Track plugin usage
 */
export async function trackPluginUsage(
  pluginId: string,
  suiteId?: string,
  runId?: string
) {
  // Check if usage record exists
  const { data: existing } = await supabase
    .from('plugin_usage_stats')
    .select('*')
    .eq('plugin_id', pluginId)
    .eq('suite_id', suiteId || '')
    .maybeSingle();

  if (existing) {
    // Update existing record
    const { error } = await supabase
      .from('plugin_usage_stats')
      .update({
        usage_count: existing.usage_count + 1,
        last_used_at: new Date().toISOString(),
        run_id: runId,
      })
      .eq('id', existing.id);

    if (error) {
      console.error('Error updating plugin usage:', error);
    }
  } else {
    // Create new record
    const { error } = await supabase
      .from('plugin_usage_stats')
      .insert({
        plugin_id: pluginId,
        suite_id: suiteId,
        run_id: runId,
        usage_count: 1,
      });

    if (error) {
      console.error('Error tracking plugin usage:', error);
    }
  }
}

/**
 * Get plugin usage statistics
 */
export async function getPluginUsageStats(pluginId?: string) {
  let query = supabase
    .from('plugin_usage_stats')
    .select('*')
    .order('usage_count', { ascending: false });

  if (pluginId) {
    query = query.eq('plugin_id', pluginId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching plugin usage stats:', error);
    return [];
  }

  return data;
}

/**
 * Sync installed plugins between localStorage and Supabase
 */
export async function syncInstalledPlugins(localPlugins: InstalledPlugin[]) {
  try {
    // Fetch plugins from Supabase
    const remotePlugins = await fetchInstalledPlugins();

    // Merge local and remote plugins (prefer remote for conflicts)
    const mergedPlugins = new Map<string, InstalledPlugin>();

    // Add remote plugins
    remotePlugins.forEach((plugin) => {
      mergedPlugins.set(plugin.plugin_id, plugin);
    });

    // Add local plugins that don't exist remotely
    for (const localPlugin of localPlugins) {
      if (!mergedPlugins.has(localPlugin.plugin_id)) {
        // Upload to Supabase
        await saveInstalledPlugin(localPlugin);
        mergedPlugins.set(localPlugin.plugin_id, localPlugin);
      }
    }

    return Array.from(mergedPlugins.values());
  } catch (error) {
    console.error('Error syncing plugins:', error);
    return localPlugins; // Fallback to local plugins
  }
}

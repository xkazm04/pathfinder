# Plugin System Architecture

## Overview

The Pathfinder Plugin System is a powerful extensibility framework that allows developers to create custom test actions beyond the built-in Playwright commands. This enables teams to encapsulate complex interactions, integrate with external services, and reuse logic across test suites.

## Key Features

- **Dynamic Plugin Loading**: Plugins are loaded at runtime and can be added/removed without code changes
- **Custom Actions**: Define specialized test actions (API calls, custom selectors, file uploads, etc.)
- **Code Generation**: Each plugin includes a code generator that produces Playwright test code
- **Marketplace Integration**: Share and discover plugins via a central marketplace
- **Type-Safe**: Full TypeScript support with comprehensive type definitions
- **UI Integration**: Plugins appear as selectable actions in the Designer interface

## Architecture Components

### 1. Plugin Types (`src/lib/types.ts`)

Core type definitions for the plugin system:

- `PluginAction`: Complete plugin definition with metadata, parameters, and code generator
- `PluginMetadata`: Plugin identity, author, version, and description
- `PluginParameter`: Parameter definitions with validation and UI hints
- `PluginStepData`: Runtime data for a plugin step execution
- `InstalledPlugin`: Tracks locally installed plugins
- `PluginRegistry`: External marketplace/registry configuration

### 2. Plugin Registry (`src/lib/plugins/pluginRegistry.ts`)

Central registry for managing plugins:

- **Registration**: `registerPlugin(plugin)` - Add a plugin to the registry
- **Retrieval**: `getPlugin(id)`, `getAllPlugins()`, `getPluginsByCategory()`
- **Search**: `searchPlugins(query)` - Full-text search across plugins
- **Installation**: `markAsInstalled()`, `uninstallPlugin()`
- **State Management**: `togglePlugin()` - Enable/disable plugins
- **Persistence**: Auto-saves to localStorage

### 3. Code Generator (`src/lib/plugins/pluginCodeGenerator.ts`)

Converts plugin actions into Playwright test code:

- Each plugin specifies a `codeGenerator` function name
- Generators receive `PluginStepData` and produce executable code
- Built-in generators for API calls, selectors, storage, etc.
- Extensible: Register custom generators with `registerCodeGenerator()`

### 4. Default Plugins (`src/lib/plugins/defaultPlugins.ts`)

Six built-in plugin actions:

1. **API Call** - Make HTTP requests during tests
2. **Custom Selector** - XPath, text content, data attributes
3. **File Upload** - Upload files to input elements
4. **Drag & Drop** - Drag and drop interactions
5. **Local Storage** - Read/write localStorage
6. **Cookie Management** - Set/get/delete cookies

### 5. Designer Integration

#### PluginActionSelector Component
`src/app/features/designer/components/PluginActionSelector.tsx`

- Browse plugins by category
- Search functionality
- Dynamic parameter forms
- Validation before adding to test

#### PluginManager Component
`src/app/features/designer/components/PluginManager.tsx`

- View installed plugins
- Browse marketplace
- Install/uninstall plugins
- Enable/disable plugins
- Search and filter

### 6. Database Schema (`supabase/schema-plugins.sql`)

Three tables for plugin persistence:

- `installed_plugins` - User-installed plugins with JSONB storage
- `plugin_registries` - Configured marketplace URLs
- `plugin_usage_stats` - Analytics on plugin usage

## Creating a Custom Plugin

### Step 1: Define Plugin Metadata

```typescript
import { PluginAction } from '@/lib/types';

const myCustomPlugin: PluginAction = {
  metadata: {
    id: 'custom-my-action',
    name: 'my-action',
    displayName: 'My Custom Action',
    description: 'Does something amazing',
    author: 'Your Name',
    version: '1.0.0',
    category: 'custom',
    icon: 'Zap', // Lucide icon name
    tags: ['custom', 'special'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  actionType: 'custom',
  parameters: [
    {
      name: 'targetElement',
      label: 'Target Element',
      type: 'string',
      required: true,
      placeholder: '#my-element',
      description: 'CSS selector for the target',
    },
    {
      name: 'action',
      label: 'Action Type',
      type: 'select',
      required: true,
      options: [
        { label: 'Highlight', value: 'highlight' },
        { label: 'Scroll To', value: 'scroll' },
      ],
    },
  ],
  codeGenerator: 'generateMyCustomCode',
  dependencies: [],
};
```

### Step 2: Create Code Generator

```typescript
import { PluginStepData, CodeGeneratorContext } from '@/lib/plugins';

export function generateMyCustomCode(
  pluginData: PluginStepData,
  context: CodeGeneratorContext = {}
): string {
  const { indent = '    ' } = context;
  const { parameters } = pluginData;

  const targetElement = parameters.targetElement as string;
  const action = parameters.action as string;

  let code = `${indent}// My Custom Action\n`;

  if (action === 'highlight') {
    code += `${indent}await page.locator('${targetElement}').evaluate(el => {\n`;
    code += `${indent}  el.style.border = '2px solid red';\n`;
    code += `${indent}});\n`;
  } else if (action === 'scroll') {
    code += `${indent}await page.locator('${targetElement}').scrollIntoViewIfNeeded();\n`;
  }

  return code;
}
```

### Step 3: Register Plugin

```typescript
import { registerPlugin, registerCodeGenerator } from '@/lib/plugins';

// Register the code generator
registerCodeGenerator('generateMyCustomCode', generateMyCustomCode);

// Register the plugin
registerPlugin(myCustomPlugin);
```

## Using Plugins in Tests

### In the Designer UI

1. Navigate to the Designer
2. In step creation, click "Add Plugin Action"
3. Browse/search for your plugin
4. Fill in required parameters
5. Add to test scenario
6. Generated code includes plugin action

### Programmatically

```typescript
import { TestStep, PluginStepData } from '@/lib/types';

const pluginStep: TestStep = {
  action: 'custom', // Can be any standard action
  description: 'Highlight the header',
  pluginAction: {
    pluginId: 'custom-my-action',
    actionType: 'custom',
    parameters: {
      targetElement: '#header',
      action: 'highlight',
    },
  },
};

// Add to scenario.steps array
```

## Plugin Marketplace

### Publishing Plugins

1. **Create Plugin**: Define `PluginAction` with metadata
2. **Test Locally**: Install via Plugin Manager
3. **Package**: Export as JSON or npm package
4. **Submit**: Upload to marketplace API
5. **Review**: Verification by Pathfinder team
6. **Publish**: Available to all users

### Installing from Marketplace

1. Open Plugin Manager in Designer
2. Switch to "Marketplace" tab
3. Search/browse available plugins
4. Click "Install" on desired plugin
5. Plugin appears in "Installed" tab
6. Use in Designer or via code

## Plugin Security

- **Sandboxed Execution**: Plugins run in controlled environment
- **Code Review**: Marketplace plugins undergo review
- **Permissions**: Future: Permission system for sensitive operations
- **Verification**: Verified badge for trusted publishers

## API Endpoints

### GET /api/plugins/marketplace

Fetch available plugins from marketplace.

**Query Parameters:**
- `category` - Filter by category (interaction, api, data, etc.)
- `search` - Search query

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "pluginAction": { ... },
      "downloads": 5432,
      "rating": 4.8,
      "reviews": 234,
      "verified": true,
      "repository": "https://github.com/...",
      "license": "MIT"
    }
  ],
  "total": 10
}
```

## Best Practices

### Plugin Development

1. **Clear Naming**: Use descriptive `displayName` and `description`
2. **Comprehensive Parameters**: Define all inputs with validation
3. **Error Handling**: Handle edge cases in code generator
4. **Documentation**: Include `examples` in plugin definition
5. **Testing**: Test generated code in real Playwright tests
6. **Versioning**: Use semantic versioning

### Plugin Usage

1. **Enable Only Needed**: Disable unused plugins for performance
2. **Update Regularly**: Check for plugin updates
3. **Review Code**: Inspect generated code before running
4. **Report Issues**: Use plugin repository for bug reports
5. **Share Knowledge**: Document custom plugins for team

## Troubleshooting

### Plugin Not Appearing

- Check if plugin is enabled in Plugin Manager
- Verify plugin registration in console
- Clear localStorage and re-initialize

### Code Generation Errors

- Ensure code generator is registered
- Check parameter validation
- Verify generator function signature

### Installation Failures

- Check network connectivity to marketplace
- Verify plugin compatibility
- Review browser console for errors

## Future Enhancements

- **NPM Integration**: Install plugins via npm packages
- **Hot Reload**: Reload plugins without page refresh
- **Plugin CLI**: Command-line tools for plugin development
- **Advanced Validation**: Schema validation for parameters
- **Plugin Dependencies**: Plugins can depend on other plugins
- **Custom UI Components**: Plugins can provide custom React components
- **Analytics Dashboard**: Track plugin usage and performance
- **Plugin SDK**: Dedicated SDK for plugin development

## Resources

- **GitHub Repository**: https://github.com/pathfinder/plugins
- **Plugin Template**: https://github.com/pathfinder/plugin-template
- **Documentation**: https://docs.pathfinder.dev/plugins
- **Community**: https://community.pathfinder.dev

## Support

For plugin development support:
- Open an issue on GitHub
- Join our Discord community
- Email: plugins@pathfinder.dev

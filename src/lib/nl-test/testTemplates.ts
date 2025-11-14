export interface TestTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  template: string;
  placeholders: TemplatePlaceholder[];
}

export interface TemplatePlaceholder {
  key: string;
  label: string;
  type: 'text' | 'url' | 'number' | 'select';
  required: boolean;
  defaultValue?: string;
  options?: string[];
  placeholder?: string;
}

export const TEST_TEMPLATES: TestTemplate[] = [
  {
    id: 'basic-page-load',
    name: 'Basic Page Load Test',
    description: 'Navigate to URL and verify page loads correctly',
    category: 'Basic',
    template: `Test that {{url}} loads successfully:
1. Go to the page
2. Verify the page title contains "{{expected_title}}"
3. Check that the main content is visible`,
    placeholders: [
      {
        key: 'url',
        label: 'Target URL',
        type: 'url',
        required: true,
        placeholder: 'https://example.com',
      },
      {
        key: 'expected_title',
        label: 'Expected Title',
        type: 'text',
        required: true,
        placeholder: 'Home Page',
      },
    ],
  },
  {
    id: 'form-submission',
    name: 'Form Submission Test',
    description: 'Test form with multiple fields',
    category: 'Forms',
    template: `Test the {{form_name}} form:
1. Navigate to {{url}}
2. Fill in {{field_1}} with {{value_1}}
3. Fill in {{field_2}} with {{value_2}}
4. Click the submit button
5. Verify success message appears`,
    placeholders: [
      {
        key: 'form_name',
        label: 'Form Name',
        type: 'text',
        required: true,
        placeholder: 'contact',
      },
      {
        key: 'url',
        label: 'Form URL',
        type: 'url',
        required: true,
        placeholder: 'https://example.com/contact',
      },
      {
        key: 'field_1',
        label: 'First Field',
        type: 'text',
        required: true,
        placeholder: 'Name',
      },
      {
        key: 'value_1',
        label: 'First Value',
        type: 'text',
        required: true,
        placeholder: 'John Doe',
      },
      {
        key: 'field_2',
        label: 'Second Field',
        type: 'text',
        required: true,
        placeholder: 'Email',
      },
      {
        key: 'value_2',
        label: 'Second Value',
        type: 'text',
        required: true,
        placeholder: 'john@example.com',
      },
    ],
  },
  {
    id: 'login-flow',
    name: 'Login Flow Test',
    description: 'Standard login test',
    category: 'Authentication',
    template: `Test user login:
1. Go to {{login_url}}
2. Enter username: {{username}}
3. Enter password: {{password}}
4. Click login button
5. Verify user is redirected to {{dashboard_url}}
6. Check that username is displayed in header`,
    placeholders: [
      {
        key: 'login_url',
        label: 'Login URL',
        type: 'url',
        required: true,
        placeholder: 'https://example.com/login',
      },
      {
        key: 'username',
        label: 'Test Username',
        type: 'text',
        required: true,
        placeholder: 'testuser@example.com',
      },
      {
        key: 'password',
        label: 'Test Password',
        type: 'text',
        required: true,
        placeholder: 'password123',
      },
      {
        key: 'dashboard_url',
        label: 'Dashboard URL',
        type: 'url',
        required: false,
        defaultValue: '/dashboard',
        placeholder: '/dashboard',
      },
    ],
  },
  {
    id: 'responsive-layout',
    name: 'Responsive Layout Test',
    description: 'Test across multiple viewports',
    category: 'Visual',
    template: `Test responsive design:
1. Navigate to {{url}}
2. Verify layout at mobile size (375px)
3. Verify layout at tablet size (768px)
4. Verify layout at desktop size (1920px)
5. Check that navigation adapts appropriately`,
    placeholders: [
      {
        key: 'url',
        label: 'Target URL',
        type: 'url',
        required: true,
        placeholder: 'https://example.com',
      },
    ],
  },
  {
    id: 'add-to-cart',
    name: 'Add to Cart Test',
    description: 'Test adding product to shopping cart',
    category: 'E-commerce',
    template: `Test adding product to cart:
1. Navigate to {{product_url}}
2. Verify product {{product_name}} is displayed
3. Click "Add to Cart" button
4. Verify cart count increases
5. Open cart and verify product is listed
6. Check product price matches {{expected_price}}`,
    placeholders: [
      {
        key: 'product_url',
        label: 'Product URL',
        type: 'url',
        required: true,
        placeholder: 'https://example.com/products/item',
      },
      {
        key: 'product_name',
        label: 'Product Name',
        type: 'text',
        required: true,
        placeholder: 'Blue T-Shirt',
      },
      {
        key: 'expected_price',
        label: 'Expected Price',
        type: 'text',
        required: false,
        placeholder: '$29.99',
      },
    ],
  },
  {
    id: 'search-functionality',
    name: 'Search Functionality Test',
    description: 'Test search with query and results',
    category: 'Search',
    template: `Test search functionality:
1. Navigate to {{url}}
2. Enter "{{search_query}}" in the search field
3. Click search or press Enter
4. Verify search results page loads
5. Check that results contain "{{search_query}}"
6. Verify at least {{min_results}} results are shown`,
    placeholders: [
      {
        key: 'url',
        label: 'Homepage URL',
        type: 'url',
        required: true,
        placeholder: 'https://example.com',
      },
      {
        key: 'search_query',
        label: 'Search Query',
        type: 'text',
        required: true,
        placeholder: 'laptop',
      },
      {
        key: 'min_results',
        label: 'Minimum Results',
        type: 'number',
        required: false,
        defaultValue: '1',
        placeholder: '1',
      },
    ],
  },
  {
    id: 'navigation-menu',
    name: 'Navigation Menu Test',
    description: 'Test main navigation menu links',
    category: 'Navigation',
    template: `Test navigation menu:
1. Navigate to {{url}}
2. Verify main menu is visible
3. Click on "{{menu_item}}" link
4. Verify navigation to {{expected_url}}
5. Check that page title contains "{{expected_title}}"
6. Verify back navigation works`,
    placeholders: [
      {
        key: 'url',
        label: 'Homepage URL',
        type: 'url',
        required: true,
        placeholder: 'https://example.com',
      },
      {
        key: 'menu_item',
        label: 'Menu Item',
        type: 'text',
        required: true,
        placeholder: 'About Us',
      },
      {
        key: 'expected_url',
        label: 'Expected URL',
        type: 'url',
        required: true,
        placeholder: 'https://example.com/about',
      },
      {
        key: 'expected_title',
        label: 'Expected Title',
        type: 'text',
        required: false,
        placeholder: 'About',
      },
    ],
  },
  {
    id: 'modal-interaction',
    name: 'Modal Interaction Test',
    description: 'Test opening and closing modals',
    category: 'Interaction',
    template: `Test modal interaction:
1. Navigate to {{url}}
2. Click on "{{trigger_element}}" to open modal
3. Verify modal appears with title "{{modal_title}}"
4. Check that modal content is visible
5. Click close button or background
6. Verify modal closes`,
    placeholders: [
      {
        key: 'url',
        label: 'Page URL',
        type: 'url',
        required: true,
        placeholder: 'https://example.com',
      },
      {
        key: 'trigger_element',
        label: 'Trigger Element',
        type: 'text',
        required: true,
        placeholder: 'Sign Up',
      },
      {
        key: 'modal_title',
        label: 'Modal Title',
        type: 'text',
        required: false,
        placeholder: 'Create Account',
      },
    ],
  },
];

/**
 * Get template by ID
 */
export function getTemplateById(id: string): TestTemplate | undefined {
  return TEST_TEMPLATES.find(t => t.id === id);
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: string): TestTemplate[] {
  return TEST_TEMPLATES.filter(t => t.category === category);
}

/**
 * Get all categories
 */
export function getTemplateCategories(): string[] {
  return [...new Set(TEST_TEMPLATES.map(t => t.category))];
}

/**
 * Fill template with values
 */
export function fillTemplate(template: TestTemplate, values: Record<string, string>): string {
  let filled = template.template;

  for (const placeholder of template.placeholders) {
    const value = values[placeholder.key] || placeholder.defaultValue || '';
    const regex = new RegExp(`{{${placeholder.key}}}`, 'g');
    filled = filled.replace(regex, value);
  }

  return filled;
}

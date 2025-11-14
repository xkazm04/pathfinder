export interface ExamplePrompt {
  text: string;
  category: string;
}

export interface ExampleCategory {
  category: string;
  description: string;
  examples: string[];
}

export const EXAMPLE_PROMPTS: ExampleCategory[] = [
  {
    category: 'Navigation',
    description: 'Test navigation menus, links, and page routing',
    examples: [
      'Test the main navigation menu on desktop',
      'Verify all footer links work correctly',
      'Check that the hamburger menu opens on mobile',
      'Test breadcrumb navigation on product pages',
      'Verify back button functionality',
    ],
  },
  {
    category: 'Forms',
    description: 'Test form submissions, validations, and user input',
    examples: [
      'Test the contact form with valid data',
      'Test form validation with empty fields',
      'Verify error messages appear for invalid email',
      'Test multi-step registration form',
      'Verify form submission success message',
    ],
  },
  {
    category: 'E-commerce',
    description: 'Test shopping cart, checkout, and product interactions',
    examples: [
      'Test adding a product to cart',
      'Test the checkout flow on mobile',
      'Verify product search returns correct results',
      'Test removing items from cart',
      'Verify coupon code application',
    ],
  },
  {
    category: 'User Authentication',
    description: 'Test login, logout, signup, and password flows',
    examples: [
      'Test login with valid credentials',
      'Test login with invalid password',
      'Verify forgot password flow',
      'Test user registration with valid data',
      'Verify logout functionality',
    ],
  },
  {
    category: 'Visual Checks',
    description: 'Test visual elements, layouts, and responsive design',
    examples: [
      'Check if all images load on the homepage',
      'Verify the hero section displays correctly',
      'Test responsive layout on different screen sizes',
      'Check footer appears on every page',
      'Verify logo displays correctly in header',
    ],
  },
  {
    category: 'Search & Filtering',
    description: 'Test search functionality and filter options',
    examples: [
      'Test product search with valid query',
      'Verify search results update as you type',
      'Test filtering products by price range',
      'Verify sorting products by relevance',
      'Test empty search results message',
    ],
  },
  {
    category: 'Modal & Popups',
    description: 'Test modals, dialogs, tooltips, and popup interactions',
    examples: [
      'Test opening and closing modal dialog',
      'Verify cookie consent banner appears',
      'Test tooltip displays on hover',
      'Verify modal closes on background click',
      'Test newsletter signup popup',
    ],
  },
  {
    category: 'Accessibility',
    description: 'Test keyboard navigation, ARIA labels, and screen reader support',
    examples: [
      'Test keyboard navigation through form fields',
      'Verify skip to content link works',
      'Check ARIA labels on interactive elements',
      'Test focus indicators are visible',
      'Verify alt text on all images',
    ],
  },
];

/**
 * Get all examples as flat list
 */
export function getAllExamples(): ExamplePrompt[] {
  return EXAMPLE_PROMPTS.flatMap(category =>
    category.examples.map(example => ({
      text: example,
      category: category.category,
    }))
  );
}

/**
 * Get random examples
 */
export function getRandomExamples(count: number = 5): ExamplePrompt[] {
  const allExamples = getAllExamples();
  const shuffled = [...allExamples].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Search examples by keyword
 */
export function searchExamples(query: string): ExamplePrompt[] {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const lowerQuery = query.toLowerCase();
  return getAllExamples().filter(example =>
    example.text.toLowerCase().includes(lowerQuery) ||
    example.category.toLowerCase().includes(lowerQuery)
  );
}

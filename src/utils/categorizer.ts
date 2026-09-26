/**
 * Keyword-based transaction categorizer.
 *
 * Rules are evaluated in order and the first match wins, so more specific
 * rules must come first: "Uber Eats" has to be caught by Food & Dining
 * before the bare "uber" keyword in Transportation can claim it.
 */

export const INCOME_CATEGORY = 'Income'
export const UNCATEGORIZED = 'Other'

interface CategoryRule {
  category: string
  keywords: readonly string[]
}

const RULES: readonly CategoryRule[] = [
  {
    category: INCOME_CATEGORY,
    keywords: [
      'payroll',
      'direct deposit',
      'deposit',
      'salary',
      'paycheck',
      'freelance',
      'invoice payment',
      'dividend',
      'interest paid',
      'reimbursement',
      'tax refund',
      'cash back reward',
    ],
  },
  {
    category: 'Housing',
    keywords: ['rent', 'mortgage', 'landlord', 'apartments', 'property tax', 'hoa dues'],
  },
  {
    category: 'Bills & Utilities',
    keywords: [
      'utility',
      'electric',
      'water bill',
      'sewer',
      'internet',
      'comcast',
      'xfinity',
      'verizon',
      't-mobile',
      'at&t',
      'phone bill',
      'insurance',
      'trash service',
    ],
  },
  {
    category: 'Groceries',
    keywords: [
      'whole foods',
      'trader joe',
      'safeway',
      'kroger',
      'aldi',
      'costco',
      'publix',
      'wegmans',
      'grocery',
      'supermarket',
      'market basket',
    ],
  },
  {
    category: 'Food & Dining',
    keywords: [
      'starbucks',
      'coffee',
      'dunkin',
      'cafe',
      'restaurant',
      'chipotle',
      'mcdonald',
      'sweetgreen',
      'panera',
      'pizza',
      'sushi',
      'taco',
      'uber eats',
      'doordash',
      'grubhub',
      'postmates',
      'brewery',
      'diner',
    ],
  },
  {
    category: 'Travel',
    keywords: [
      'airbnb',
      'hotel',
      'marriott',
      'hilton',
      'expedia',
      'booking.com',
      'airlines',
      'airfare',
      'flight',
    ],
  },
  {
    category: 'Transportation',
    keywords: [
      'uber',
      'lyft',
      'shell',
      'chevron',
      'exxon',
      'bp fuel',
      'gas station',
      'gasoline',
      'parking',
      'toll',
      'transit',
      'metro',
      'bart',
      'amtrak',
      'car payment',
      'auto loan',
    ],
  },
  {
    category: 'Health & Fitness',
    keywords: [
      'gym',
      'fitness',
      'equinox',
      'peloton',
      'pharmacy',
      'cvs',
      'walgreens',
      'doctor',
      'dental',
      'clinic',
      'hospital',
      'therapy',
    ],
  },
  {
    category: 'Entertainment',
    keywords: [
      'netflix',
      'spotify',
      'hulu',
      'disney',
      'hbo',
      'prime video',
      'youtube premium',
      'cinema',
      'movie',
      'steam games',
      'playstation',
      'xbox',
      'concert',
      'ticketmaster',
    ],
  },
  {
    category: 'Shopping',
    keywords: [
      'amazon',
      'target',
      'walmart',
      'best buy',
      'ikea',
      'etsy',
      'ebay',
      'nike',
      'apple store',
      'zara',
      'h&m',
      'home depot',
      'wayfair',
    ],
  },
  {
    category: 'Education',
    keywords: ['tuition', 'udemy', 'coursera', 'textbook', 'school fee', 'student loan'],
  },
  {
    category: 'Personal Care',
    keywords: ['salon', 'barber', 'haircut', 'day spa', 'skincare'],
  },
]

/** Every category the categorizer can emit, useful for budget pickers. */
export const CATEGORIES: readonly string[] = [
  ...RULES.map((rule) => rule.category),
  UNCATEGORIZED,
]

/**
 * Maps a raw bank-statement description to a spending category.
 * Falls back to `Other` when nothing matches.
 */
export function autoCategorize(description: string): string {
  const haystack = description.toLowerCase()

  for (const rule of RULES) {
    if (rule.keywords.some((keyword) => haystack.includes(keyword))) {
      return rule.category
    }
  }

  return UNCATEGORIZED
}

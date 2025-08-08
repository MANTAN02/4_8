// Business Categories Constants
export const BUSINESS_CATEGORIES = [
  { value: "electronics", label: "Electronics / Gadgets", icon: "Smartphone" },
  { value: "clothing", label: "Clothing Store (general)", icon: "ShirtIcon" },
  { value: "restaurant", label: "Food / Restaurant", icon: "UtensilsCrossed" },
  { value: "salon", label: "Salon / Beauty", icon: "Scissors" },
  { value: "footwear", label: "Footwear", icon: "Footprints" },
  { value: "cafe", label: "Café / Ice Cream", icon: "Coffee" },
  { value: "gifts", label: "Gift / Toy Shop", icon: "Gift" },
  { value: "pharmacy", label: "Medicine / Wellness / Pharmacy", icon: "Cross" },
  { value: "stationery", label: "Stationery", icon: "PenTool" },
  { value: "ethnic-wear", label: "Ethnic Wear Store", icon: "Crown" },
  { value: "kids-clothing", label: "Kids' Clothing Store", icon: "Baby" },
  { value: "formal-wear", label: "Casual / Formal Wear Store", icon: "Shirt" },
  { value: "cosmetics", label: "Cosmetics / Beauty / Perfume Store", icon: "Sparkles" },
  { value: "turf", label: "Turf Ground (football, cricket, box cricket)", icon: "Trophy" },
  { value: "beauty-parlour", label: "Beauty Parlour (facials, bridal makeup, skincare)", icon: "Heart" }
];

// Category filter options for UI components
export const CATEGORY_FILTER_OPTIONS = [
  { value: "", label: "All Categories" },
  ...BUSINESS_CATEGORIES
];

// Category value to label mapping
export const CATEGORY_LABELS: Record<string, string> = BUSINESS_CATEGORIES.reduce(
  (acc, category) => ({
    ...acc,
    [category.value]: category.label
  }),
  {}
);

// Category value to icon mapping
export const CATEGORY_ICONS: Record<string, string> = BUSINESS_CATEGORIES.reduce(
  (acc, category) => ({
    ...acc,
    [category.value]: category.icon
  }),
  {}
);

// Get category label by value
export const getCategoryLabel = (value: string): string => {
  return CATEGORY_LABELS[value] || value;
};

// Get category icon by value
export const getCategoryIcon = (value: string): string => {
  return CATEGORY_ICONS[value] || "Store";
};

// Validation: Check if category value is valid
export const isValidCategory = (value: string): boolean => {
  return BUSINESS_CATEGORIES.some(category => category.value === value);
};
// Business Categories Constants
export const BUSINESS_CATEGORIES = [
  { value: "restaurant", label: "Restaurant", icon: "UtensilsCrossed", color: "bg-red-500", description: "Delicious dining experiences" },
  { value: "cafe", label: "Café", icon: "Coffee", color: "bg-amber-600", description: "Coffee, snacks & casual bites" },
  { value: "clothes", label: "Clothes", icon: "Shirt", color: "bg-purple-500", description: "Fashion & apparel stores" },
  { value: "gift", label: "Gift Shop", icon: "Gift", color: "bg-pink-500", description: "Perfect gifts for every occasion" },
  { value: "accessories", label: "Accessories", icon: "Gem", color: "bg-indigo-500", description: "Jewelry, bags & fashion accessories" },
  { value: "salon", label: "Salon", icon: "Scissors", color: "bg-rose-500", description: "Beauty & grooming services" },
  { value: "medical", label: "Medical", icon: "Cross", color: "bg-green-600", description: "Healthcare & pharmacy services" },
  { value: "footwear", label: "Footwear", icon: "Footprints", color: "bg-orange-500", description: "Shoes, sandals & boots" },
  { value: "eyewear", label: "Eyewear", icon: "Glasses", color: "bg-blue-600", description: "Glasses, sunglasses & lenses" },
  { value: "repair", label: "Repair Services", icon: "Wrench", color: "bg-yellow-600", description: "Fix & maintenance services" },
  { value: "mobile", label: "Mobile & Electronics", icon: "Smartphone", color: "bg-cyan-600", description: "Phones, gadgets & accessories" },
  { value: "plastic", label: "Plastic & Home", icon: "Package", color: "bg-teal-600", description: "Plastic goods & home essentials" }
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
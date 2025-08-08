import { 
  Smartphone, 
  Shirt, 
  UtensilsCrossed, 
  Scissors, 
  Footprints, 
  Coffee, 
  Gift, 
  Cross, 
  PenTool, 
  Crown, 
  Baby, 
  Sparkles, 
  Trophy, 
  Heart, 
  Store,
  LucideIcon 
} from 'lucide-react';

// Map of icon names to Lucide React components
const iconMap: Record<string, LucideIcon> = {
  Smartphone,
  ShirtIcon: Shirt,
  UtensilsCrossed,
  Scissors,
  Footprints,
  Coffee,
  Gift,
  Cross,
  PenTool,
  Crown,
  Baby,
  Shirt,
  Sparkles,
  Trophy,
  Heart,
  Store
};

// Get icon component by name, fallback to Store
export const getIconComponent = (iconName: string): LucideIcon => {
  return iconMap[iconName] || Store;
};

// Get icon element with optional props
export const CategoryIcon = ({ 
  iconName, 
  className = "w-4 h-4", 
  ...props 
}: { 
  iconName: string; 
  className?: string; 
  [key: string]: any; 
}) => {
  const IconComponent = getIconComponent(iconName);
  return <IconComponent className={className} {...props} />;
};
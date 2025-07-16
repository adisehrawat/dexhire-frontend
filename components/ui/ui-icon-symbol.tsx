import React from 'react';
import { 
  Home, 
  Search, 
  MessageCircle, 
  User, 
  Briefcase,
  type LucideIcon 
} from 'lucide-react-native';

interface TabBarIconProps {
  name: string;
  focused: boolean;
  color: string;
  size: number;
}

export const TabBarIcon: React.FC<TabBarIconProps> = ({
  name,
  focused,
  color,
  size,
}) => {
  const IconComponent = getIconComponent(name);
  
  return (
    <IconComponent
      color={color}
      size={size}
      strokeWidth={focused ? 2.5 : 2}
    />
  );
};

const getIconComponent = (name: string): LucideIcon => {
  switch (name) {
    case 'home':
      return Home;
    case 'search':
      return Search;
    case 'messages':
      return MessageCircle;
    case 'profile':
      return User;
    case 'projects':
      return Briefcase;
    default:
      return Home;
  }
};
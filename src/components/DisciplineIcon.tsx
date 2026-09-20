import React from 'react';
import {
  Code,
  Laptop,
  Dumbbell,
  Book,
  Sparkles,
  CalendarCheck,
  CheckSquare,
  Flame,
  Target,
  Film,
  Terminal,
  Coffee,
  Award,
  Activity,
  MessageSquare,
  Compass,
  Cpu,
  Feather,
  Zap,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  code: Code,
  laptop: Laptop,
  dumbbell: Dumbbell,
  book: Book,
  sparkles: Sparkles,
  'calendar-check': CalendarCheck,
  'check-square': CheckSquare,
  flame: Flame,
  target: Target,
  film: Film,
  terminal: Terminal,
  coffee: Coffee,
  award: Award,
  activity: Activity,
  message: MessageSquare,
  compass: Compass,
  cpu: Cpu,
  feather: Feather,
  zap: Zap,
};

interface DisciplineIconProps {
  name: string;
  className?: string;
  style?: React.CSSProperties;
}

export const DisciplineIcon: React.FC<DisciplineIconProps> = ({ name, className = 'w-4 h-4', style }) => {
  const IconComponent = ICON_MAP[name.toLowerCase()] || Activity;
  return <IconComponent className={className} style={style} />;
};

export const AVAILABLE_ICONS = [
  { id: 'code', label: 'Code' },
  { id: 'laptop', label: 'Laptop' },
  { id: 'dumbbell', label: 'Dumbbell' },
  { id: 'book', label: 'Book' },
  { id: 'sparkles', label: 'Sparkles' },
  { id: 'calendar-check', label: 'Weekly Check' },
  { id: 'check-square', label: 'Task' },
  { id: 'flame', label: 'Flame' },
  { id: 'target', label: 'Target' },
  { id: 'film', label: 'Video' },
  { id: 'terminal', label: 'Terminal' },
  { id: 'coffee', label: 'Habit' },
  { id: 'zap', label: 'Energy' },
];

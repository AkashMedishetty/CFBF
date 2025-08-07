// UI Components Export
import logger from '../../utils/logger';

logger.debug('Loading UI components...', 'UI_COMPONENTS');

// Basic UI Components
export { default as Button } from './Button';
export { default as Card } from './Card';
export { default as Input } from './Input';
export { default as Modal } from './Modal';

// OTP Components
export { default as OTPInput } from './OTPInput';
export { default as OTPModal } from './OTPModal';
export { default as CountdownTimer } from './CountdownTimer';

// Animated UI Components
export { default as AnimatedButton } from './AnimatedButton';
export { default as AnimatedCard } from './AnimatedCard';
export { default as LoadingSpinner, SkeletonLoader, ProgressBar } from './LoadingSpinner';
export { default as AnimatedList, AnimatedListItem, AnimatedGrid, FadeInWhenVisible } from './AnimatedList';
export { default as PageTransition, RouteTransition, ModalTransition, NotificationTransition } from './PageTransition';

// Premium UI Components
export { default as Dropdown } from './Dropdown';
export { default as Tooltip } from './Tooltip';
export { default as Badge, BadgeGroup } from './Badge';
export { default as Alert, AlertList } from './Alert';
export { default as Tabs, TabList, Tab, TabPanels, TabPanel } from './Tabs';

// Showcase Component
export { default as AnimationShowcase } from './AnimationShowcase';

// Animation System
export { default as animationSystem } from '../../utils/animations';

logger.success('UI components loaded successfully', 'UI_COMPONENTS');
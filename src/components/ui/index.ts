/**
 * UI Components - Sistema de Diseño Moderno
 * 
 * Exporta todos los componentes átomicos del sistema de diseño.
 * 
 * @example
 * import { Button, Input, Modal, Badge, Avatar, Dropdown, Tooltip, DatePicker } from '@/components/ui';
 */

// ==========================================
// BOTONES
// ==========================================
export { Button, IconButton } from './Button';

// ==========================================
// SKELETONS Y LOADING
// ==========================================
export { 
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonTable,
  SkeletonAvatar,
  SkeletonList,
  LoadingSpinner,
  LoadingOverlay,
} from './Skeleton';

// ==========================================
// BADGES
// ==========================================
export { Badge, StatusBadge } from './Badge';

// ==========================================
// FORMULARIOS
// ==========================================
export { 
  Input, 
  Textarea, 
  Select, 
  Checkbox, 
  Radio,
  InputGroup,
} from './Input';

// ==========================================
// MODALES Y DIALOGS
// ==========================================
export { Modal, ConfirmDialog, Drawer } from './Modal';

// ==========================================
// AVATARES
// ==========================================
export { Avatar, AvatarGroup, AvatarWithTooltip } from './Avatar';

// ==========================================
// DROPDOWN
// ==========================================
export { Dropdown, DropdownSelect, DropdownMenu } from './Dropdown';

// ==========================================
// TOOLTIP
// ==========================================
export { Tooltip, TooltipWithIcon, RichTooltip } from './Tooltip';

// ==========================================
// DATEPICKER
// ==========================================
export { DatePicker, DateRangePicker } from './DatePicker';

// ==========================================
// ANIMACIONES
// ==========================================
export { 
  FadeIn,
  SlideIn,
  ScaleIn,
  AnimateOnMount,
  StaggerChildren,
  Pulse,
  HoverScale,
  ProgressBar,
  NumberCounter,
  Accordion,
  Tabs,
} from './Animations';

// ==========================================
// UTILIDADES
// ==========================================
export { 
  EmptyState,
  EmptyStateSimple,
  Divider,
  CardWrapper,
  Show,
  Hide,
  Text,
  Flex,
  Grid,
  Spacer,
  VStack,
  HStack,
  VisuallyHidden,
} from './Utilities';

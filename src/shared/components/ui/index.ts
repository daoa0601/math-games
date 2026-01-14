// shadcn/ui components (Vietnamese Premium styled)
export {
  Button,
  buttonVariants,
  type ButtonProps,
  Input,
  type InputProps,
  Label,
  Textarea,
  type TextareaProps,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
  Toaster,
  toast,
  Progress,
  type ProgressProps,
  RadioGroup,
  RadioGroupItem,
  type RadioGroupProps,
} from './shadcn';

// Custom components (game-specific or unique functionality)
export { Timer } from './Timer';
export type { TimerProps } from './Timer';
export { DifficultySelector } from './DifficultySelector';
export { SyncIndicator, type SyncStatus } from './SyncIndicator';
export { OfflineBanner } from './OfflineBanner';
export { BottomSheet } from './BottomSheet';
export type { BottomSheetProps, BottomSheetDetent } from './BottomSheet';
export { SettingsDrawer, SettingsDrawerTrigger, SettingsSection } from './SettingsDrawer';
export type { SettingsDrawerProps, SettingsDrawerTriggerProps, SettingsSectionProps } from './SettingsDrawer';

/**
 * shadcn/ui components - Vietnamese Premium styled
 *
 * All components use:
 * - tw: prefix for Tailwind classes (avoiding conflicts with existing CSS)
 * - CSS variables from Vietnamese Premium design system
 * - Two styling modes:
 *   - Premium surfaces (credit card aesthetic): Sheet, Dialog
 *   - Editorial flat style: Button, Input, Select, Label, Textarea
 */

// Premium surface components (credit card aesthetic)
export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
} from './sheet';

export {
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
} from './dialog';

export { Toaster, toast } from './sonner';

// Editorial flat style primitives
export { Button, buttonVariants, type ButtonProps } from './button';
export { Input, type InputProps } from './input';
export { Label } from './label';
export { Textarea, type TextareaProps } from './textarea';
export {
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
} from './select';

export { Progress, type ProgressProps } from './progress';
export {
  RadioGroup,
  RadioGroupItem,
  type RadioGroupProps,
} from './radio-group';

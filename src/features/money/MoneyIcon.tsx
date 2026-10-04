/**
 * features/money/MoneyIcon.tsx — a category's icon key (core/money/starter)
 * as a lucide icon. Unknown or empty keys fall back to a wallet.
 */
import {
  BookOpen,
  Briefcase,
  Car,
  Coins,
  Dumbbell,
  Ellipsis,
  Gift,
  HeartPulse,
  House,
  PawPrint,
  Plane,
  Receipt,
  Shirt,
  ShoppingCart,
  Sparkles,
  Ticket,
  Tv,
  Undo2,
  UtensilsCrossed,
  Wallet,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  cart: ShoppingCart,
  utensils: UtensilsCrossed,
  home: House,
  car: Car,
  heart: HeartPulse,
  dumbbell: Dumbbell,
  tv: Tv,
  ticket: Ticket,
  shirt: Shirt,
  sparkles: Sparkles,
  book: BookOpen,
  gift: Gift,
  plane: Plane,
  receipt: Receipt,
  paw: PawPrint,
  dots: Ellipsis,
  briefcase: Briefcase,
  undo: Undo2,
  coins: Coins,
  wallet: Wallet,
};

export function MoneyIcon({ icon, size = 18 }: { icon: string; size?: number }) {
  const Icon = ICONS[icon] ?? Wallet;
  return <Icon size={size} aria-hidden="true" />;
}

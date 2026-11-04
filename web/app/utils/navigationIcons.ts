import {
  BarChart3,
  BookOpen,
  CalendarCheck,
  CalendarDays,
  Church,
  ClipboardList,
  Cog,
  HandHeart,
  Heart,
  House,
  MessageCircle,
  MoreHorizontal,
  User,
  Users,
} from "lucide-vue-next";
import type { RoleNavigationIcon } from "./roleNavigation";

/** Ícone (lucide) de cada atalho de navegação. */
export const navigationIcons: Record<RoleNavigationIcon, unknown> = {
  book: BookOpen,
  calendar: CalendarCheck,
  church: Church,
  clipboard: ClipboardList,
  cog: Cog,
  heart: Heart,
  home: House,
  messages: MessageCircle,
  more: MoreHorizontal,
  pastoral: HandHeart,
  reports: BarChart3,
  scale: CalendarDays,
  team: Church,
  user: User,
  users: Users,
};

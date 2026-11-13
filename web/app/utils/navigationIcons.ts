import {
  BarChart3,
  CalendarCheck,
  CalendarDays,
  Church,
  HandHeart,
  Heart,
  House,
  LayoutGrid,
  Megaphone,
  Settings2,
  ShieldCheck,
  User,
  Users,
  UsersRound,
} from "lucide-vue-next";
import type { RoleNavigationIcon } from "./roleNavigation";

/** Ícone (lucide) de cada aba e item de navegação. */
export const navigationIcons: Record<RoleNavigationIcon, unknown> = {
  home: House,
  scale: CalendarDays,
  church: Church,
  ministries: UsersRound,
  management: LayoutGrid,
  platform: ShieldCheck,
  profile: User,
  people: Users,
  care: HandHeart,
  prayer: Heart,
  cults: CalendarCheck,
  communicate: Megaphone,
  settings: Settings2,
  reports: BarChart3,
};

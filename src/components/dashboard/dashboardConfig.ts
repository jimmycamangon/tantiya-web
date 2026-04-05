import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  CalendarRange,
  HandCoins,
  LayoutDashboard,
  Settings,
  WalletCards,
} from 'lucide-react'

export type RouteMeta = {
  path: string
  title: string
  description?: string
  breadcrumbs: string[]
}

export type NavItem = {
  id: string
  icon: LucideIcon
  title: string
  detail: string
}

export const routeMeta: Record<string, RouteMeta> = {
  dashboard: {
    path: '/dashboard',
    title: 'Dashboard',
    description: 'Budget overview and current balance',
    breadcrumbs: ['dashboard'],
  },
  quickDeduct: {
    path: '/quick-deduct',
    title: 'Quick Deduct',
    description: 'Tap gastos and deduct instantly',
    breadcrumbs: ['quickDeduct'],
  },
  cutoffs: {
    path: '/cutoffs',
    title: 'Cutoff Tracking',
    description: 'Compare spending by payroll cycle',
    breadcrumbs: ['cutoffs'],
  },
  analysis: {
    path: '/analysis',
    title: 'Analysis',
    description: 'Budget and spending insights',
    breadcrumbs: ['analysis'],
  },
  settings: {
    path: '/settings',
    title: 'Settings',
    description: 'Preferences and backup tools',
    breadcrumbs: ['settings'],
  },
  budgetSetup: {
    path: '/setup',
    title: 'Budget Setup',
    description: 'Income, bills, and housing setup',
    breadcrumbs: ['budgetSetup'],
  },
}

export const navItems: NavItem[] = [
  {
    id: 'dashboard',
    icon: LayoutDashboard,
    title: 'Dashboard',
    detail: 'Current budget pulse',
  },
  {
    id: 'quickDeduct',
    icon: HandCoins,
    title: 'Quick Deduct',
    detail: 'Tap gastos fast',
  },
  {
    id: 'cutoffs',
    icon: CalendarRange,
    title: 'Cutoffs',
    detail: 'Payroll cycle tracking',
  },
  {
    id: 'analysis',
    icon: BarChart3,
    title: 'Analysis',
    detail: 'Compare spending trends',
  },
  {
    id: 'budgetSetup',
    icon: WalletCards,
    title: 'Budget Setup',
    detail: 'Income and obligations',
  },
  {
    id: 'settings',
    icon: Settings,
    title: 'Settings',
    detail: 'Backup and preferences',
  },
]

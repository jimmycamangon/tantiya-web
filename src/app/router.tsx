import { createBrowserRouter } from 'react-router-dom'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import RootLayout from '@/layouts/RootLayout'
import AnalysisPage from '@/pages/AnalysisPage'
import CutoffsPage from '@/pages/CutoffsPage'
import DashboardPage from '@/pages/DashboardPage'
import LandingPage from '@/pages/LandingPage'
import NotFoundPage from '@/pages/NotFoundPage'
import QuickDeductPage from '@/pages/QuickDeductPage'
import SettingsPage from '@/pages/SettingsPage'
import SetupPage from '@/pages/SetupPage'
import StartPage from '@/pages/StartPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <LandingPage />,
      },
      {
        path: 'start',
        element: <StartPage />,
      },
    ],
  },
  {
    element: <DashboardLayout />,
    children: [
      {
        path: '/dashboard',
        element: <DashboardPage />,
      },
      {
        path: '/quick-deduct',
        element: <QuickDeductPage />,
      },
      {
        path: '/cutoffs',
        element: <CutoffsPage />,
      },
      {
        path: '/analysis',
        element: <AnalysisPage />,
      },
      {
        path: '/setup',
        element: <SetupPage />,
      },
      {
        path: '/settings',
        element: <SettingsPage />,
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])

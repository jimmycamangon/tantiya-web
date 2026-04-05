import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { readThemePreference } from '@/lib/userPreference'
import { router } from './router'

export default function App() {
  useEffect(() => {
    document.documentElement.classList.toggle(
      'dark',
      readThemePreference() === 'dark',
    )
  }, [])

  return <RouterProvider router={router} />
}

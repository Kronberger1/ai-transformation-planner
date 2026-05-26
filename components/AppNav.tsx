'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LayoutGrid, Settings, BookOpen, LogOut, ChevronRight, BarChart2 } from 'lucide-react'
import type { UserRole } from '@/types'

interface Props {
  userName: string
  orgName: string
  role: UserRole
}

export default function AppNav({ userName, orgName, role }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const nav = [
    { href: '/dashboard', icon: LayoutGrid, label: 'Canvas' },
    { href: '/reports', icon: BarChart2, label: 'Reports' },
    { href: '/skills', icon: BookOpen, label: 'Skills' },
    ...(role === 'org_admin' || role === 'super_admin'
      ? [{ href: '/admin', icon: Settings, label: 'Admin' }]
      : []),
  ]

  return (
    <header className="flex h-14 items-center gap-4 border-b border-gray-200 bg-white px-4 shadow-sm">
      <span className="text-sm font-bold text-slate-800 mr-2">{orgName}</span>
      <ChevronRight className="h-3 w-3 text-gray-400" />
      <nav className="flex items-center gap-1">
        {nav.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              pathname.startsWith(href)
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>
      <div className="ml-auto flex items-center gap-3">
        <span className="text-sm text-gray-500">{userName}</span>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-1 rounded-md px-2 py-1.5 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          title="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  )
}

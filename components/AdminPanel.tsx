'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { OrgConfigSchema } from '@/types'
import type { UserRole } from '@/types'
import { Users, Building2, Shield } from 'lucide-react'

interface OrgUser {
  id: string
  display_name: string | null
  role: UserRole
  created_at: string
}

interface OrgRow {
  id: string
  name: string
  slug: string
  created_at: string
}

interface Props {
  orgUsers: OrgUser[]
  currentOrg: { id: string; name: string; slug: string; config: unknown } | null
  allOrgs: OrgRow[] | null
  currentUserId: string
  role: UserRole
  organisationId: string
}

export default function AdminPanel({
  orgUsers,
  currentOrg,
  allOrgs,
  currentUserId,
  role,
  organisationId,
}: Props) {
  const supabase = createClient()
  const [tab, setTab] = useState<'users' | 'org' | 'orgs'>('users')
  const [users, setUsers] = useState<OrgUser[]>(orgUsers)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<UserRole>('member')
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviteSuccess, setInviteSuccess] = useState(false)

  const config = OrgConfigSchema.parse(currentOrg?.config ?? {})
  const [accentColor, setAccentColor] = useState(config.accentColor)
  const [orgName, setOrgName] = useState(currentOrg?.name ?? '')
  const [savedMsg, setSavedMsg] = useState('')

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setInviteError(null)

    const res = await fetch('/api/admin/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
    })

    if (!res.ok) {
      const data = await res.json()
      setInviteError(data.error ?? 'Invite failed')
    } else {
      setInviteSuccess(true)
      setInviteEmail('')
      setTimeout(() => setInviteSuccess(false), 3000)
    }
  }

  async function handleRoleChange(userId: string, newRole: UserRole) {
    const { error } = await supabase
      .from('users')
      .update({ role: newRole })
      .eq('id', userId)
    if (!error) {
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)))
    }
  }

  async function handleSaveOrg(e: React.FormEvent) {
    e.preventDefault()
    const newConfig = OrgConfigSchema.parse({ ...config, accentColor })
    const { error } = await supabase
      .from('organisations')
      .update({ name: orgName, config: newConfig })
      .eq('id', organisationId)
    if (!error) {
      setSavedMsg('Saved!')
      setTimeout(() => setSavedMsg(''), 2000)
    }
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Panel</h1>

      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {[
          { key: 'users', icon: Users, label: 'Users' },
          { key: 'org', icon: Building2, label: 'Organisation' },
          ...(allOrgs ? [{ key: 'orgs', icon: Shield, label: 'All Orgs' }] : []),
        ].map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => setTab(key as typeof tab)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === key
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'users' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">User</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Role</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="px-4 py-3">
                      {u.display_name ?? '—'}
                      {u.id === currentUserId && (
                        <span className="ml-2 text-xs text-gray-400">(you)</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {u.id === currentUserId ? (
                        <span className="text-gray-500">{u.role}</span>
                      ) : (
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                          className="rounded border border-gray-300 px-2 py-1 text-xs"
                        >
                          <option value="member">member</option>
                          <option value="org_admin">org_admin</option>
                          {role === 'super_admin' && (
                            <option value="super_admin">super_admin</option>
                          )}
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Invite user</h3>
            <form onSubmit={handleInvite} className="flex gap-3">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
                placeholder="email@example.com"
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as UserRole)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="member">member</option>
                <option value="org_admin">org_admin</option>
              </select>
              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Invite
              </button>
            </form>
            {inviteError && <p className="mt-2 text-sm text-red-600">{inviteError}</p>}
            {inviteSuccess && <p className="mt-2 text-sm text-green-600">Invite sent!</p>}
          </div>
        </div>
      )}

      {tab === 'org' && (
        <form onSubmit={handleSaveOrg} className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Organisation name</label>
            <input
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Accent colour</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="h-9 w-16 rounded border border-gray-300 p-0.5"
              />
              <span className="text-sm text-gray-500">{accentColor}</span>
            </div>
          </div>
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Save
          </button>
          {savedMsg && <p className="text-sm text-green-600">{savedMsg}</p>}
        </form>
      )}

      {tab === 'orgs' && allOrgs && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Name</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Slug</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {allOrgs.map((o) => (
                <tr key={o.id}>
                  <td className="px-4 py-3 font-medium">{o.name}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{o.slug}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(o.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

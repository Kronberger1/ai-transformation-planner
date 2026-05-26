export const dynamic = 'force-dynamic'

import LoginForm from '@/components/LoginForm'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white">AI Transformation Planner</h1>
          <p className="mt-2 text-slate-400">Sign in to continue</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}

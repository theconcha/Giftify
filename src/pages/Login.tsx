import { useState } from 'react'
import { Mail, ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { supabase } from '../lib/supabase'

type View = 'magic-link' | 'password' | 'magic-sent' | 'create-account' | 'forgot-password' | 'reset-sent'

export default function Login() {
  const [view, setView] = useState<View>('magic-link')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clearError = () => setError(null)

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    clearError()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    })
    setLoading(false)
    if (error) return setError(error.message)
    setView('magic-sent')
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    clearError()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) setError(error.message)
  }

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) return setError('Passwords do not match.')
    setLoading(true)
    clearError()
    const { error } = await supabase.auth.signUp({ email, password })
    setLoading(false)
    if (error) setError(error.message)
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    clearError()
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    setLoading(false)
    if (error) return setError(error.message)
    setView('reset-sent')
  }

  return (
    <div className="min-h-svh bg-[#FAF6F1] flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-[#2D2420] tracking-tight">Giftify</h1>
          <p className="text-[#8B7355] mt-1 text-sm">Your personal gift tracker</p>
        </div>

        {/* Magic link form */}
        {view === 'magic-link' && (
          <form onSubmit={handleSendMagicLink} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-[#2D2420] mb-1.5">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl border border-[#E8E0D8] bg-white text-[#2D2420] placeholder-[#B8A898] focus:outline-none focus:border-[#C2714F] transition-colors text-sm"
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#C2714F] text-white font-semibold text-sm hover:bg-[#A85E3E] transition-colors disabled:opacity-60"
            >
              {loading ? 'Sending…' : 'Send magic link'}
            </button>
            <div className="text-center">
              <button
                type="button"
                onClick={() => { clearError(); setView('password') }}
                className="text-sm text-[#8B7355] hover:text-[#C2714F] transition-colors"
              >
                Use password instead
              </button>
            </div>
          </form>
        )}

        {/* Magic link sent confirmation */}
        {view === 'magic-sent' && (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#F0E8E0] flex items-center justify-center mx-auto">
              <Mail size={28} className="text-[#C2714F]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#2D2420]">Check your email</h2>
              <p className="text-sm text-[#8B7355] mt-1">
                We sent a magic link to <span className="font-semibold text-[#2D2420]">{email}</span>
              </p>
            </div>
            <button
              onClick={handleSendMagicLink}
              disabled={loading}
              className="text-sm text-[#C2714F] font-semibold hover:underline disabled:opacity-60"
            >
              {loading ? 'Sending…' : 'Resend link'}
            </button>
            <div>
              <button
                onClick={() => { clearError(); setView('magic-link') }}
                className="flex items-center gap-1 text-sm text-[#8B7355] hover:text-[#2D2420] transition-colors mx-auto"
              >
                <ArrowLeft size={14} /> Back
              </button>
            </div>
          </div>
        )}

        {/* Password sign in form */}
        {view === 'password' && (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label htmlFor="email-pw" className="block text-sm font-semibold text-[#2D2420] mb-1.5">
                Email address
              </label>
              <input
                id="email-pw"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl border border-[#E8E0D8] bg-white text-[#2D2420] placeholder-[#B8A898] focus:outline-none focus:border-[#C2714F] transition-colors text-sm"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-[#2D2420] mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl border border-[#E8E0D8] bg-white text-[#2D2420] placeholder-[#B8A898] focus:outline-none focus:border-[#C2714F] transition-colors text-sm pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B7355] hover:text-[#2D2420]"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#C2714F] text-white font-semibold text-sm hover:bg-[#A85E3E] transition-colors disabled:opacity-60"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
            <div className="flex justify-between text-sm">
              <button
                type="button"
                onClick={() => { clearError(); setView('forgot-password') }}
                className="text-[#8B7355] hover:text-[#C2714F] transition-colors"
              >
                Forgot password?
              </button>
              <button
                type="button"
                onClick={() => { clearError(); setView('create-account') }}
                className="text-[#8B7355] hover:text-[#C2714F] transition-colors"
              >
                Create account
              </button>
            </div>
            <div className="text-center">
              <button
                type="button"
                onClick={() => { clearError(); setView('magic-link') }}
                className="flex items-center gap-1 text-sm text-[#8B7355] hover:text-[#2D2420] transition-colors mx-auto"
              >
                <ArrowLeft size={14} /> Use magic link instead
              </button>
            </div>
          </form>
        )}

        {/* Create account form */}
        {view === 'create-account' && (
          <form onSubmit={handleCreateAccount} className="space-y-4">
            <div>
              <label htmlFor="email-ca" className="block text-sm font-semibold text-[#2D2420] mb-1.5">
                Email address
              </label>
              <input
                id="email-ca"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl border border-[#E8E0D8] bg-white text-[#2D2420] placeholder-[#B8A898] focus:outline-none focus:border-[#C2714F] transition-colors text-sm"
              />
            </div>
            <div>
              <label htmlFor="password-ca" className="block text-sm font-semibold text-[#2D2420] mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password-ca"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl border border-[#E8E0D8] bg-white text-[#2D2420] placeholder-[#B8A898] focus:outline-none focus:border-[#C2714F] transition-colors text-sm pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B7355] hover:text-[#2D2420]"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-semibold text-[#2D2420] mb-1.5">
                Confirm password
              </label>
              <input
                id="confirm-password"
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-[#E8E0D8] bg-white text-[#2D2420] placeholder-[#B8A898] focus:outline-none focus:border-[#C2714F] transition-colors text-sm"
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#C2714F] text-white font-semibold text-sm hover:bg-[#A85E3E] transition-colors disabled:opacity-60"
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
            <div className="text-center">
              <button
                type="button"
                onClick={() => { clearError(); setView('password') }}
                className="flex items-center gap-1 text-sm text-[#8B7355] hover:text-[#2D2420] transition-colors mx-auto"
              >
                <ArrowLeft size={14} /> Back to sign in
              </button>
            </div>
          </form>
        )}

        {/* Forgot password form */}
        {view === 'forgot-password' && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="text-center mb-2">
              <h2 className="text-lg font-bold text-[#2D2420]">Reset your password</h2>
              <p className="text-sm text-[#8B7355] mt-1">We'll send you a link to reset it.</p>
            </div>
            <div>
              <label htmlFor="email-fp" className="block text-sm font-semibold text-[#2D2420] mb-1.5">
                Email address
              </label>
              <input
                id="email-fp"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl border border-[#E8E0D8] bg-white text-[#2D2420] placeholder-[#B8A898] focus:outline-none focus:border-[#C2714F] transition-colors text-sm"
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#C2714F] text-white font-semibold text-sm hover:bg-[#A85E3E] transition-colors disabled:opacity-60"
            >
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
            <div className="text-center">
              <button
                type="button"
                onClick={() => { clearError(); setView('password') }}
                className="flex items-center gap-1 text-sm text-[#8B7355] hover:text-[#2D2420] transition-colors mx-auto"
              >
                <ArrowLeft size={14} /> Back to sign in
              </button>
            </div>
          </form>
        )}

        {/* Reset link sent confirmation */}
        {view === 'reset-sent' && (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#F0E8E0] flex items-center justify-center mx-auto">
              <Mail size={28} className="text-[#C2714F]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#2D2420]">Check your email</h2>
              <p className="text-sm text-[#8B7355] mt-1">
                We sent a password reset link to <span className="font-semibold text-[#2D2420]">{email}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => { clearError(); setView('password') }}
              className="flex items-center gap-1 text-sm text-[#8B7355] hover:text-[#2D2420] transition-colors mx-auto"
            >
              <ArrowLeft size={14} /> Back to sign in
            </button>
          </div>
        )}

      </div>
    </div>
  )
}

import { useAuth } from '../context/AuthContext'
import { Store, Globe, Database, Shield } from 'lucide-react'

export default function Settings() {
  const { user } = useAuth()

  const mainSiteUrl = import.meta.env.VITE_MAIN_SITE_URL || 'https://itemista.com'

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
        <p className="text-sm text-text-muted mt-1">Admin panel configuration</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Admin Info */}
        <div className="bg-surface rounded-xl border border-border p-5">
          <h2 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Shield size={18} /> Admin Account
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-border/50">
              <span className="text-text-muted">Email</span>
              <span className="text-text-primary font-medium">{user?.email}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border/50">
              <span className="text-text-muted">Name</span>
              <span className="text-text-primary font-medium">
                {user?.user_metadata?.full_name || 
                 `${user?.user_metadata?.first_name || ''} ${user?.user_metadata?.last_name || ''}`.trim() || 
                 '—'}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-border/50">
              <span className="text-text-muted">Role</span>
              <span className="text-primary font-medium">Administrator</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-text-muted">User ID</span>
              <span className="text-text-secondary font-mono text-xs">{user?.id}</span>
            </div>
          </div>
        </div>

        {/* Environment */}
        <div className="bg-surface rounded-xl border border-border p-5">
          <h2 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Database size={18} /> Environment
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-border/50">
              <span className="text-text-muted">Supabase URL</span>
              <span className="text-text-secondary font-mono text-xs">
                {import.meta.env.VITE_SUPABASE_URL ? '✓ Configured' : '✗ Missing'}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-border/50">
              <span className="text-text-muted">Anon Key</span>
              <span className="text-text-secondary font-mono text-xs">
                {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✓ Configured' : '✗ Missing'}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-text-muted">Environment</span>
              <span className="text-text-secondary font-mono text-xs">
                {import.meta.env.MODE}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-surface rounded-xl border border-border p-5">
          <h2 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Globe size={18} /> Quick Links
          </h2>
          <div className="space-y-2">
            <a
              href={mainSiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Store size={18} className="text-primary" />
              <div>
                <p className="text-sm font-medium text-text-primary">Main Website</p>
                <p className="text-xs text-text-muted">{mainSiteUrl}</p>
              </div>
            </a>
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Database size={18} className="text-green-600" />
              <div>
                <p className="text-sm font-medium text-text-primary">Supabase Dashboard</p>
                <p className="text-xs text-text-muted">supabase.com/dashboard</p>
              </div>
            </a>
          </div>
        </div>

        {/* System Info */}
        <div className="bg-surface rounded-xl border border-border p-5">
          <h2 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Store size={18} /> System Info
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-border/50">
              <span className="text-text-muted">App</span>
              <span className="text-text-primary font-medium">ItemIsta Admin</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border/50">
              <span className="text-text-muted">Framework</span>
              <span className="text-text-secondary">React 19 + Vite</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border/50">
              <span className="text-text-muted">CSS</span>
              <span className="text-text-secondary">Tailwind CSS 4</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-text-muted">Backend</span>
              <span className="text-text-secondary">Supabase (PostgreSQL)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

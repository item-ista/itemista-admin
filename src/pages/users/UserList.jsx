import { useEffect, useState, useCallback } from 'react'
import { Search, Users as UsersIcon, Shield, ShieldCheck, Mail, Phone, Calendar } from 'lucide-react'
import { getUsers, updateUserRole } from '../../services/adminService'
import { formatDateTime, getInitials, debounce, timeAgo } from '../../utils/helpers'
import { USER_ROLES } from '../../utils/constants'
import Pagination from '../../components/ui/Pagination'
import Modal from '../../components/ui/Modal'
import { toast } from 'react-toastify'

export default function UserList() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)

  useEffect(() => {
    loadUsers()
  }, [page])

  const debouncedSearch = useCallback(
    debounce(() => {
      setPage(1)
      loadUsers()
    }, 400),
    []
  )

  useEffect(() => {
    debouncedSearch()
  }, [search])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const data = await getUsers({ page, search })
      setUsers(data.users)
      setTotal(data.total)
    } catch (err) {
      console.error('Failed to load users:', err)
      toast.error('Failed to load users. Service role key may be required.')
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateUserRole(userId, newRole)
      toast.success('User role updated')
      loadUsers()
    } catch (err) {
      toast.error('Failed to update role')
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Users</h1>
        <p className="text-sm text-text-muted mt-1">{total} registered users</p>
      </div>

      {/* Search */}
      <div className="bg-surface rounded-xl border border-border p-4 mb-6">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or phone..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-text-muted">
            <UsersIcon size={48} className="mb-3 opacity-40" />
            <p className="text-base font-medium">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/80">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-text-muted">User</th>
                  <th className="text-left py-3 px-4 font-medium text-text-muted">Email</th>
                  <th className="text-left py-3 px-4 font-medium text-text-muted">Phone</th>
                  <th className="text-left py-3 px-4 font-medium text-text-muted">Role</th>
                  <th className="text-left py-3 px-4 font-medium text-text-muted">Joined</th>
                  <th className="text-left py-3 px-4 font-medium text-text-muted">Last Sign In</th>
                  <th className="text-right py-3 px-4 font-medium text-text-muted">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {users.map((user) => {
                  const name = user.user_metadata?.full_name ||
                    `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim() ||
                    user.email?.split('@')[0] || 'Unknown'
                  const role = user.user_metadata?.role || user.app_metadata?.role || USER_ROLES.USER
                  const isAdmin = role === USER_ROLES.ADMIN

                  return (
                    <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white ${isAdmin ? 'bg-primary' : 'bg-gray-400'}`}>
                            {getInitials(name)}
                          </div>
                          <div>
                            <p className="font-medium text-text-primary">{name}</p>
                            <p className="text-xs text-text-muted">ID: {user.id.slice(0, 8)}...</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-text-secondary">{user.email || '—'}</td>
                      <td className="py-3 px-4 text-text-secondary">{user.phone || user.user_metadata?.phone || '—'}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          isAdmin ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-text-secondary'
                        }`}>
                          {isAdmin ? <ShieldCheck size={12} /> : <Shield size={12} />}
                          {isAdmin ? 'Admin' : 'Customer'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-text-secondary text-xs">{formatDateTime(user.created_at)}</td>
                      <td className="py-3 px-4 text-text-secondary text-xs">{user.last_sign_in_at ? timeAgo(user.last_sign_in_at) : 'Never'}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="text-xs text-primary hover:text-primary-hover font-medium transition-colors"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Pagination page={page} totalPages={Math.ceil(total / 20)} onPageChange={setPage} />

      {/* User Detail Modal */}
      <Modal isOpen={!!selectedUser} onClose={() => setSelectedUser(null)} title="User Details" maxWidth="max-w-md">
        {selectedUser && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 pb-4 border-b border-border">
              <div className="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center text-lg font-bold">
                {getInitials(selectedUser.user_metadata?.full_name || selectedUser.email || 'U')}
              </div>
              <div>
                <p className="text-lg font-semibold text-text-primary">
                  {selectedUser.user_metadata?.full_name ||
                    `${selectedUser.user_metadata?.first_name || ''} ${selectedUser.user_metadata?.last_name || ''}`.trim() ||
                    'Unknown'}
                </p>
                <p className="text-sm text-text-muted">{selectedUser.email}</p>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Mail size={16} className="text-text-muted" />
                <span className="text-text-secondary">{selectedUser.email || '—'}</span>
                {selectedUser.email_confirmed_at && (
                  <span className="text-xs text-success font-medium">Verified</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Phone size={16} className="text-text-muted" />
                <span className="text-text-secondary">{selectedUser.phone || selectedUser.user_metadata?.phone || '—'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-text-muted" />
                <span className="text-text-secondary">Joined {formatDateTime(selectedUser.created_at)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-text-muted" />
                <span className="text-text-secondary">
                  Last sign in: {selectedUser.last_sign_in_at ? formatDateTime(selectedUser.last_sign_in_at) : 'Never'}
                </span>
              </div>
            </div>

            {/* Role management */}
            <div className="pt-4 border-t border-border">
              <label className="block text-sm font-medium text-text-primary mb-2">Role</label>
              <select
                value={selectedUser.user_metadata?.role || USER_ROLES.USER}
                onChange={(e) => handleRoleChange(selectedUser.id, e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              >
                <option value={USER_ROLES.USER}>Customer</option>
                <option value={USER_ROLES.ADMIN}>Admin</option>
              </select>
            </div>

            {/* User metadata */}
            {selectedUser.user_metadata && Object.keys(selectedUser.user_metadata).length > 0 && (
              <div className="pt-4 border-t border-border">
                <p className="text-sm font-medium text-text-primary mb-2">Metadata</p>
                <div className="bg-background rounded-lg p-3 text-xs font-mono text-text-secondary overflow-x-auto max-h-40">
                  <pre>{JSON.stringify(selectedUser.user_metadata, null, 2)}</pre>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

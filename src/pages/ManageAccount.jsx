import { useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { toast } from 'react-toastify'
import { Save, Upload } from 'lucide-react'
import { getInitials } from '../utils/helpers'

const MAX_FILE_SIZE = 2 * 1024 * 1024

export default function ManageAccount() {
  const { user, refreshUser } = useAuth()
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [saving, setSaving] = useState(false)

  const displayName = useMemo(() => {
    return (
      user?.user_metadata?.full_name ||
      `${user?.user_metadata?.first_name || ''} ${user?.user_metadata?.last_name || ''}`.trim() ||
      user?.email ||
      'Admin'
    )
  }, [user])

  const currentAvatarUrl = user?.user_metadata?.avatar_url || ''

  const handleFileChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error('Image size must be 2MB or less')
      return
    }

    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const handleSaveAvatar = async () => {
    if (!selectedFile || !user?.id) {
      toast.error('Please choose an image first')
      return
    }

    try {
      setSaving(true)

      const safeFileName = selectedFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const filePath = `${user.id}/${Date.now()}-${safeFileName}`

      const { error: uploadError } = await supabase.storage
        .from('admin-avatars')
        .upload(filePath, selectedFile, { cacheControl: '3600', upsert: false })

      if (uploadError) throw uploadError

      const { data: publicUrlData } = supabase.storage.from('admin-avatars').getPublicUrl(filePath)
      const newAvatarUrl = publicUrlData?.publicUrl

      if (!newAvatarUrl) {
        throw new Error('Failed to generate image URL')
      }

      const existingMetadata = user.user_metadata || {}
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          ...existingMetadata,
          avatar_url: newAvatarUrl,
        },
      })

      if (updateError) throw updateError

      await refreshUser()
      setSelectedFile(null)
      setPreviewUrl('')
      toast.success('Profile image updated successfully')
    } catch (error) {
      toast.error(error?.message || 'Failed to update profile image')
    } finally {
      setSaving(false)
    }
  }

  const shownAvatar = previewUrl || currentAvatarUrl

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Manage Account</h1>
        <p className="text-sm text-text-muted mt-1">Update your profile image</p>
      </div>

      <div className="max-w-2xl bg-surface rounded-xl border border-border p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div
            className="rounded-full bg-white text-text-secondary flex items-center justify-center text-2xl font-bold overflow-hidden border border-border shrink-0"
            style={{ width: '96px', height: '96px', minWidth: '96px', minHeight: '96px' }}
          >
            {shownAvatar ? (
              <img
                src={shownAvatar}
                alt={displayName}
                className="rounded-full object-contain bg-white"
                style={{ width: '96px', height: '96px', minWidth: '96px', minHeight: '96px' }}
              />
            ) : (
              getInitials(displayName)
            )}
          </div>

          <div className="flex-1 w-full">
            <p className="text-base font-semibold text-text-primary">{displayName}</p>
            <p className="text-sm text-text-muted break-all">{user?.email}</p>

            <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium cursor-pointer hover:bg-primary-hover transition-colors">
                <Upload size={16} />
                Choose Image
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/jpg"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>

              <button
                type="button"
                onClick={handleSaveAvatar}
                disabled={saving || !selectedFile}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium text-text-primary disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                <Save size={16} />
                {saving ? 'Saving...' : 'Save Profile Image'}
              </button>
            </div>

            <p className="text-xs text-text-muted mt-3">Accepted formats: JPG, PNG, WEBP. Maximum size: 2MB.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, ImagePlus, Loader2, RefreshCw, X } from 'lucide-react'
import { toast } from 'react-toastify'
import {
  createHomepageBanner,
  deleteHomepageBanner,
  deleteHomepageBannerImage,
  getHomepageBanners,
  getHomepageSliderSettings,
  reorderHomepageBanners,
  updateHomepageBanner,
  updateHomepageSliderSettings,
  uploadHomepageBannerImage,
} from '../../services/adminService'

const MIN_SLIDE_SPEED_MS = 1000
const MAX_SLIDE_SPEED_MS = 20000

export default function BannerManager() {
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [savingSpeed, setSavingSpeed] = useState(false)
  const [reordering, setReordering] = useState(false)
  const [banners, setBanners] = useState([])
  const [autoplayDelayMs, setAutoplayDelayMs] = useState(2000)

  const dragIndexRef = useRef(null)
  const [draggingIndex, setDraggingIndex] = useState(null)
  const [overIndex, setOverIndex] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [bannerData, settingData] = await Promise.all([
        getHomepageBanners(),
        getHomepageSliderSettings(),
      ])
      setBanners(bannerData)
      setAutoplayDelayMs(settingData.autoplay_delay_ms || 2000)
    } catch (err) {
      toast.error('Failed to load banner settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSpeed = async () => {
    const clamped = Math.min(MAX_SLIDE_SPEED_MS, Math.max(MIN_SLIDE_SPEED_MS, Number(autoplayDelayMs) || 2000))
    setSavingSpeed(true)
    try {
      await updateHomepageSliderSettings(clamped)
      setAutoplayDelayMs(clamped)
      toast.success('Slider speed updated')
    } catch (err) {
      toast.error(err.message || 'Failed to update speed')
    } finally {
      setSavingSpeed(false)
    }
  }

  const handleAddImages = async (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    setUploading(true)
    try {
      let nextSortOrder = banners.length

      for (const file of files) {
        const imageUrl = await uploadHomepageBannerImage(file)
        await createHomepageBanner({
          image_url: imageUrl,
          sort_order: nextSortOrder,
          is_active: true,
          alt_text: `Homepage banner ${nextSortOrder + 1}`,
        })
        nextSortOrder += 1
      }

      toast.success(`${files.length} banner image${files.length > 1 ? 's' : ''} uploaded`)
      await loadData()
    } catch (err) {
      toast.error(err.message || 'Failed to upload banner image')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleDelete = async (banner) => {
    try {
      await deleteHomepageBanner(banner.id)
      if (banner.image_url) {
        try {
          await deleteHomepageBannerImage(banner.image_url)
        } catch {
          // Ignore storage delete failures so DB row deletion still succeeds.
        }
      }

      const nextBanners = banners.filter((b) => b.id !== banner.id)
      setBanners(nextBanners)
      await reorderHomepageBanners(nextBanners.map((b) => b.id))
      toast.success('Banner deleted')
      await loadData()
    } catch (err) {
      toast.error(err.message || 'Failed to delete banner')
    }
  }

  const handleToggleActive = async (banner) => {
    try {
      await updateHomepageBanner(banner.id, { is_active: !banner.is_active })
      setBanners((prev) => prev.map((b) => (b.id === banner.id ? { ...b, is_active: !b.is_active } : b)))
    } catch (err) {
      toast.error(err.message || 'Failed to update banner status')
    }
  }

  const handleAltTextSave = async (banner, value) => {
    if ((banner.alt_text || '') === value.trim()) return
    try {
      await updateHomepageBanner(banner.id, { alt_text: value.trim() })
      setBanners((prev) => prev.map((b) => (b.id === banner.id ? { ...b, alt_text: value.trim() } : b)))
    } catch (err) {
      toast.error(err.message || 'Failed to save alt text')
    }
  }

  const persistReorder = async (nextBanners) => {
    setBanners(nextBanners)
    setReordering(true)
    try {
      await reorderHomepageBanners(nextBanners.map((b) => b.id))
    } catch (err) {
      toast.error(err.message || 'Failed to reorder banners')
      await loadData()
    } finally {
      setReordering(false)
    }
  }

  const moveBanner = async (index, direction) => {
    const target = direction === 'left' ? index - 1 : index + 1
    if (target < 0 || target >= banners.length || reordering) return

    const nextBanners = [...banners]
    ;[nextBanners[index], nextBanners[target]] = [nextBanners[target], nextBanners[index]]
    await persistReorder(nextBanners)
  }

  const handleDragStart = (e, index) => {
    dragIndexRef.current = index
    setDraggingIndex(index)
    e.dataTransfer.effectAllowed = 'move'

    const ghost = document.createElement('div')
    ghost.style.width = '1px'
    ghost.style.height = '1px'
    document.body.appendChild(ghost)
    e.dataTransfer.setDragImage(ghost, 0, 0)
    setTimeout(() => document.body.removeChild(ghost), 0)
  }

  const handleDragOver = (e, index) => {
    e.preventDefault()
    if (dragIndexRef.current === null || dragIndexRef.current === index) return
    setOverIndex(index)
  }

  const handleDrop = async (e, index) => {
    e.preventDefault()
    if (dragIndexRef.current === null || dragIndexRef.current === index || reordering) return

    const from = dragIndexRef.current
    const nextBanners = [...banners]
    const [moved] = nextBanners.splice(from, 1)
    nextBanners.splice(index, 0, moved)

    dragIndexRef.current = null
    setDraggingIndex(null)
    setOverIndex(null)

    await persistReorder(nextBanners)
  }

  const handleDragEnd = () => {
    dragIndexRef.current = null
    setDraggingIndex(null)
    setOverIndex(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Homepage Banners</h1>
          <p className="text-sm text-text-muted mt-1">Manage home page slider images and speed from admin panel.</p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm text-text-secondary hover:bg-gray-50 disabled:opacity-60"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="bg-surface rounded-xl border border-border p-5 space-y-4">
        <h2 className="text-base font-semibold text-text-primary">Slider Speed</h2>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-end">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Autoplay Delay (milliseconds)</label>
            <input
              type="number"
              min={MIN_SLIDE_SPEED_MS}
              max={MAX_SLIDE_SPEED_MS}
              step="100"
              value={autoplayDelayMs}
              onChange={(e) => setAutoplayDelayMs(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
            <p className="text-xs text-text-muted mt-2">
              Allowed range: {MIN_SLIDE_SPEED_MS}ms to {MAX_SLIDE_SPEED_MS}ms ({(MIN_SLIDE_SPEED_MS / 1000).toFixed(1)}s - {(MAX_SLIDE_SPEED_MS / 1000).toFixed(1)}s)
            </p>
          </div>
          <button
            onClick={handleSaveSpeed}
            disabled={savingSpeed}
            className="px-4 py-2.5 rounded-lg bg-warning text-secondary text-sm font-medium hover:opacity-90 disabled:opacity-60"
          >
            {savingSpeed ? 'Saving...' : 'Save Speed'}
          </button>
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-border p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-text-primary">Banner Images</h2>
          <span className="text-xs text-text-muted">{banners.length} total · drag to reorder</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-text-muted">
            <Loader2 className="animate-spin" size={22} />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
            {banners.map((banner, index) => (
              <div
                key={banner.id}
                draggable={!reordering}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                onDragLeave={() => setOverIndex(null)}
                className={`rounded-lg border-2 overflow-hidden bg-background transition-all ${
                  draggingIndex === index
                    ? 'opacity-40 scale-95 border-primary/50'
                    : overIndex === index
                    ? 'border-primary ring-2 ring-primary/30 scale-105'
                    : 'border-border'
                }`}
              >
                <div className="relative bg-gray-100" style={{ aspectRatio: '1976 / 688' }}>
                  <img src={banner.image_url} alt={banner.alt_text || `Banner ${index + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleDelete(banner)}
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center"
                    title="Delete banner"
                  >
                    <X size={12} />
                  </button>
                  {!banner.is_active && (
                    <span className="absolute left-2 top-2 px-2 py-0.5 rounded bg-danger text-white text-[10px]">Inactive</span>
                  )}
                </div>

                <div className="p-2.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-text-muted">Position {index + 1}</span>
                    <label className="inline-flex items-center gap-1.5 text-xs text-text-muted">
                      <input
                        type="checkbox"
                        checked={banner.is_active}
                        onChange={() => handleToggleActive(banner)}
                        className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary"
                      />
                      Active
                    </label>
                  </div>

                  <input
                    type="text"
                    defaultValue={banner.alt_text || ''}
                    placeholder="Alt text"
                    onBlur={(e) => handleAltTextSave(banner, e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-border text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />

                  <div className="flex items-center justify-center gap-1">
                    <button
                      type="button"
                      disabled={index === 0 || reordering}
                      onClick={() => moveBanner(index, 'left')}
                      className="w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center disabled:opacity-40"
                      title="Move left"
                    >
                      <ChevronLeft size={12} />
                    </button>
                    <button
                      type="button"
                      disabled={index === banners.length - 1 || reordering}
                      onClick={() => moveBanner(index, 'right')}
                      className="w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center disabled:opacity-40"
                      title="Move right"
                    >
                      <ChevronRight size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <label className="rounded-lg border-2 border-dashed border-border hover:border-primary transition-colors cursor-pointer bg-background flex flex-col items-center justify-center text-text-muted gap-2" style={{ aspectRatio: '1976 / 688' }}>
              {uploading ? <Loader2 size={24} className="animate-spin" /> : <ImagePlus size={24} />}
              <span className="text-xs font-medium">{uploading ? 'Uploading...' : 'Add Banner Image'}</span>
              <input type="file" accept="image/*" multiple onChange={handleAddImages} className="hidden" disabled={uploading} />
            </label>
          </div>
        )}

        <p className="text-xs text-text-muted">
          Tip: drag cards to reorder slider sequence. Only active banners are shown on website slider.
        </p>
      </div>
    </div>
  )
}

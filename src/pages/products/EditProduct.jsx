import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, X, ImagePlus, Star, ChevronLeft, ChevronRight } from 'lucide-react'
import { getProduct, updateProduct, uploadProductImage, deleteProductImage, getProductCategories } from '../../services/adminService'
import { generateSlug } from '../../utils/helpers'
import { PRODUCT_STATUS, PRODUCT_CATEGORIES } from '../../utils/constants'
import LoadingScreen from '../../components/ui/LoadingScreen'
import { toast } from 'react-toastify'

export default function EditProduct() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [categories, setCategories] = useState([])
  // Unified ordered image list: { id, type: 'existing'|'new', url, file?, preview? }
  const [orderedImages, setOrderedImages] = useState([])
  const [removedImageUrls, setRemovedImageUrls] = useState([])

  const [form, setForm] = useState({
    name: '',
    slug: '',
    sku: '',
    description: '',
    price: '',
    cut_price: '',
    category: '',
    brand: '',
    stock: '0',
    status: 'active',
    is_flash_sale: false,
    flash_sale_end_time: '',
    discount_percentage: '',
    is_just_for_you: false,
  })

  useEffect(() => {
    loadProduct()
    getProductCategories().then(setCategories).catch(() => {})
  }, [id])

  const loadProduct = async () => {
    try {
      const product = await getProduct(id)
      setForm({
        name: product.name || '',
        slug: product.slug || '',
        sku: product.sku || '',
        description: product.description || '',
        price: product.price?.toString() || '',
        cut_price: product.cut_price?.toString() || '',
        category: product.category || '',
        brand: product.brand || '',
        stock: product.stock?.toString() || '0',
        status: product.status || 'active',
        is_flash_sale: product.is_flash_sale || false,
        flash_sale_end_time: product.flash_sale_end_time ? product.flash_sale_end_time.slice(0, 16) : '',
        discount_percentage: product.discount_percentage?.toString() || '',
        is_just_for_you: product.is_just_for_you || false,
      })
      const imgs = (product.images || (product.image ? [product.image] : []))
      setOrderedImages(imgs.map((url, i) => ({ id: `existing-${i}-${url}`, type: 'existing', url, preview: url })))
    } catch (err) {
      toast.error('Failed to load product')
      navigate('/products')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    const newForm = { ...form, [name]: type === 'checkbox' ? checked : value }
    if (name === 'name') newForm.slug = generateSlug(value)
    setForm(newForm)
  }

  const handleNewImages = (e) => {
    const files = Array.from(e.target.files)
    if (orderedImages.length + files.length > 10) {
      toast.error('Maximum 10 images allowed')
      return
    }
    const newItems = files.map((file, i) => ({
      id: `new-${Date.now()}-${i}`,
      type: 'new',
      file,
      preview: URL.createObjectURL(file),
    }))
    setOrderedImages((prev) => [...prev, ...newItems])
  }

  const removeImage = (imgId) => {
    setOrderedImages((prev) => {
      const item = prev.find((o) => o.id === imgId)
      if (item?.type === 'existing') setRemovedImageUrls((r) => [...r, item.url])
      return prev.filter((o) => o.id !== imgId)
    })
  }

  const setAsMain = (imgId) => {
    setOrderedImages((prev) => {
      const idx = prev.findIndex((o) => o.id === imgId)
      if (idx <= 0) return prev
      const updated = [...prev]
      const [item] = updated.splice(idx, 1)
      updated.unshift(item)
      return updated
    })
    toast.success('Main image updated')
  }

  const moveImage = (imgId, direction) => {
    setOrderedImages((prev) => {
      const idx = prev.findIndex((o) => o.id === imgId)
      const newIdx = direction === 'left' ? idx - 1 : idx + 1
      if (newIdx < 0 || newIdx >= prev.length) return prev
      const updated = [...prev]
      ;[updated[idx], updated[newIdx]] = [updated[newIdx], updated[idx]]
      return updated
    })
  }

  // Drag-and-drop handlers
  const dragIndexRef = useRef(null)
  const [draggingIndex, setDraggingIndex] = useState(null)
  const [overIndex, setOverIndex] = useState(null)

  const handleDragStart = (e, index) => {
    dragIndexRef.current = index
    setDraggingIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    // Transparent ghost — real item stays visible in-place
    const ghost = document.createElement('div')
    ghost.style.width = '1px'
    ghost.style.height = '1px'
    document.body.appendChild(ghost)
    e.dataTransfer.setDragImage(ghost, 0, 0)
    setTimeout(() => document.body.removeChild(ghost), 0)
  }
  const handleDragOver = (e, index) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragIndexRef.current === null || dragIndexRef.current === index) return
    setOverIndex(index)
  }
  const handleDragLeave = () => setOverIndex(null)
  const handleDrop = (e, index) => {
    e.preventDefault()
    if (dragIndexRef.current === null || dragIndexRef.current === index) return
    const from = dragIndexRef.current
    setOrderedImages((prev) => {
      const updated = [...prev]
      const [dragged] = updated.splice(from, 1)
      updated.splice(index, 0, dragged)
      return updated
    })
    dragIndexRef.current = null
    setDraggingIndex(null)
    setOverIndex(null)
  }
  const handleDragEnd = () => {
    dragIndexRef.current = null
    setDraggingIndex(null)
    setOverIndex(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.price) {
      toast.error('Name and price are required')
      return
    }

    setSubmitting(true)
    try {
      // Upload new images in order
      const uploadedMap = {}
      for (const img of orderedImages) {
        if (img.type === 'new') {
          uploadedMap[img.id] = await uploadProductImage(img.file)
        }
      }

      // Delete removed images from storage
      for (const url of removedImageUrls) {
        try { await deleteProductImage(url) } catch { /* ignore */ }
      }

      // Build final image array in correct order
      const allImages = orderedImages.map((img) =>
        img.type === 'existing' ? img.url : uploadedMap[img.id]
      ).filter(Boolean)

      const productData = {
        ...form,
        sku: form.sku || null,
        price: parseFloat(form.price),
        cut_price: form.cut_price ? parseFloat(form.cut_price) : null,
        stock: parseInt(form.stock) || 0,
        discount_percentage: form.discount_percentage ? parseFloat(form.discount_percentage) : null,
        flash_sale_end_time: form.flash_sale_end_time || null,
        image: allImages[0] || null,
        images: allImages.length > 0 ? allImages : null,
      }

      await updateProduct(id, productData)
      toast.success('Product updated successfully!')
      navigate('/products')
    } catch (err) {
      toast.error(err.message || 'Failed to update product')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <LoadingScreen />

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/products')}
          className="p-2 rounded-lg hover:bg-gray-100 text-text-secondary transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Edit Product</h1>
          <p className="text-sm text-text-muted mt-0.5">Update product details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface rounded-xl border border-border p-5 space-y-4">
            <h2 className="text-base font-semibold text-text-primary">Basic Information</h2>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Product Name *</label>
              <input
                type="text" name="name" value={form.name} onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Slug</label>
              <input
                type="text" name="slug" value={form.slug} onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors text-text-muted"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">SKU</label>
              <input
                type="text" name="sku" value={form.sku} onChange={handleChange}
                placeholder="e.g., ITEM-001"
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Description</label>
              <textarea
                name="description" value={form.description} onChange={handleChange} rows={4}
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none transition-colors"
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-surface rounded-xl border border-border p-5 space-y-4">
            <h2 className="text-base font-semibold text-text-primary">Pricing & Inventory</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Price (PKR) *</label>
                <input type="number" name="price" value={form.price} onChange={handleChange} min="0" step="0.01"
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Cut Price (PKR)</label>
                <input type="number" name="cut_price" value={form.cut_price} onChange={handleChange} min="0" step="0.01"
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Stock</label>
                <input type="number" name="stock" value={form.stock} onChange={handleChange} min="0"
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors" />
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="bg-surface rounded-xl border border-border p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-text-primary">Product Images</h2>
              <span className="text-xs text-text-muted">{orderedImages.length}/10 — drag to reorder</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {orderedImages.map((img, i) => (
                <div
                  key={img.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, i)}
                  onDragOver={(e) => handleDragOver(e, i)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, i)}
                  onDragEnd={handleDragEnd}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 group cursor-grab active:cursor-grabbing transition-all select-none ${
                    draggingIndex === i
                      ? 'opacity-40 scale-95 border-primary/50'
                      : overIndex === i
                      ? 'border-primary ring-2 ring-primary/40 scale-105'
                      : i === 0
                      ? 'border-primary shadow-md'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <img src={img.preview} alt="" className="w-full h-full object-cover pointer-events-none" />

                  {/* Remove button */}
                  <button type="button" onClick={() => removeImage(img.id)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <X size={12} />
                  </button>

                  {/* Set as main (star) — non-first images only */}
                  {i !== 0 && (
                    <button type="button" onClick={() => setAsMain(img.id)}
                      title="Set as main image"
                      className="absolute top-1 left-1 w-6 h-6 rounded-full bg-black/70 text-yellow-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <Star size={11} fill="currentColor" />
                    </button>
                  )}

                  {/* Move left / right */}
                  <div className="absolute bottom-6 inset-x-0 flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    {i > 0 && (
                      <button type="button" onClick={() => moveImage(img.id, 'left')}
                        className="w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center">
                        <ChevronLeft size={11} />
                      </button>
                    )}
                    {i < orderedImages.length - 1 && (
                      <button type="button" onClick={() => moveImage(img.id, 'right')}
                        className="w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center">
                        <ChevronRight size={11} />
                      </button>
                    )}
                  </div>

                  {/* Labels */}
                  {i === 0 ? (
                    <span className="absolute bottom-1 left-1 right-1 text-center bg-primary text-white text-[10px] px-1.5 py-0.5 rounded font-semibold">
                      ★ Main
                    </span>
                  ) : img.type === 'new' ? (
                    <span className="absolute bottom-1 left-1 bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded">New</span>
                  ) : null}
                </div>
              ))}

              {/* Add new */}
              {orderedImages.length < 10 && (
                <label className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary flex flex-col items-center justify-center cursor-pointer transition-colors">
                  <ImagePlus size={24} className="text-text-muted mb-1" />
                  <span className="text-xs text-text-muted">Add Image</span>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleNewImages} />
                </label>
              )}
            </div>
            {orderedImages.length > 0 && (
              <p className="text-xs text-text-muted">⭐ Hover on any image → click star to set as main · drag to reorder · arrows to move</p>
            )}
          </div>
        </div>

        {/* Right — Sidebar */}
        <div className="space-y-6">
          <div className="bg-surface rounded-xl border border-border p-5 space-y-4">
            <h2 className="text-base font-semibold text-text-primary">Status</h2>
            <select name="status" value={form.status} onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors">
              {Object.values(PRODUCT_STATUS).map((s) => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>

          <div className="bg-surface rounded-xl border border-border p-5 space-y-4">
            <h2 className="text-base font-semibold text-text-primary">Organization</h2>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Category</label>
              <select name="category" value={form.category} onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors">
                <option value="">Select Category</option>
                {PRODUCT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Brand</label>
              <input type="text" name="brand" value={form.brand} onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors" />
            </div>
          </div>

          <div className="bg-surface rounded-xl border border-border p-5 space-y-4">
            <h2 className="text-base font-semibold text-text-primary">Flash Sale</h2>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" name="is_flash_sale" checked={form.is_flash_sale} onChange={handleChange}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary" />
              <span className="text-sm text-text-primary">Enable Flash Sale</span>
            </label>
            {form.is_flash_sale && (
              <>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">Discount %</label>
                  <input type="number" name="discount_percentage" value={form.discount_percentage} onChange={handleChange}
                    min="0" max="100"
                    className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">Sale End Time</label>
                  <input type="datetime-local" name="flash_sale_end_time" value={form.flash_sale_end_time} onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors" />
                </div>
              </>
            )}
          </div>

          <div className="bg-surface rounded-xl border border-border p-5 space-y-4">
            <h2 className="text-base font-semibold text-text-primary">Just For You</h2>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" name="is_just_for_you" checked={form.is_just_for_you} onChange={handleChange}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary" />
              <span className="text-sm text-text-primary">Show in Just For You</span>
            </label>
          </div>

          <button type="submit" disabled={submitting}
            className="w-full py-3 rounded-lg bg-warning text-secondary font-medium hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors">
            {submitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Upload, X, Plus, ImagePlus } from 'lucide-react'
import { createProduct, uploadProductImage, getProductCategories } from '../../services/adminService'
import { generateSlug } from '../../utils/helpers'
import { PRODUCT_STATUS, PRODUCT_CATEGORIES } from '../../utils/constants'
import { toast } from 'react-toastify'

export default function AddProduct() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [imageFiles, setImageFiles] = useState([])
  const [imagePreviews, setImagePreviews] = useState([])

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
  })

  useEffect(() => {
    getProductCategories().then(setCategories).catch(() => {})
  }, [])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    const newForm = { ...form, [name]: type === 'checkbox' ? checked : value }

    // Auto-generate slug from name
    if (name === 'name') {
      newForm.slug = generateSlug(value)
    }

    setForm(newForm)
  }

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files)
    if (imageFiles.length + files.length > 10) {
      toast.error('Maximum 10 images allowed')
      return
    }

    const newFiles = [...imageFiles, ...files]
    setImageFiles(newFiles)

    // Generate previews
    const newPreviews = [...imagePreviews]
    files.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        newPreviews.push(ev.target.result)
        setImagePreviews([...newPreviews])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index) => {
    setImageFiles(imageFiles.filter((_, i) => i !== index))
    setImagePreviews(imagePreviews.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.price) {
      toast.error('Name and price are required')
      return
    }

    setSubmitting(true)
    try {
      // Upload images
      let imageUrls = []
      for (const file of imageFiles) {
        const url = await uploadProductImage(file)
        imageUrls.push(url)
      }

      const productData = {
        ...form,
        sku: form.sku || null,
        price: parseFloat(form.price),
        cut_price: form.cut_price ? parseFloat(form.cut_price) : null,
        stock: parseInt(form.stock) || 0,
        discount_percentage: form.discount_percentage ? parseFloat(form.discount_percentage) : null,
        flash_sale_end_time: form.flash_sale_end_time || null,
        image: imageUrls[0] || null,
        images: imageUrls.length > 0 ? imageUrls : null,
      }

      await createProduct(productData)
      toast.success('Product created successfully!')
      navigate('/products')
    } catch (err) {
      toast.error(err.message || 'Failed to create product')
    } finally {
      setSubmitting(false)
    }
  }

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
          <h1 className="text-2xl font-bold text-text-primary">Add New Product</h1>
          <p className="text-sm text-text-muted mt-0.5">Create a new product listing</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="bg-surface rounded-xl border border-border p-5 space-y-4">
            <h2 className="text-base font-semibold text-text-primary">Basic Information</h2>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Product Name *</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g., Wireless Bluetooth Headphones"
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Slug</label>
              <input
                type="text"
                name="slug"
                value={form.slug}
                onChange={handleChange}
                placeholder="auto-generated-from-name"
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors text-text-muted"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">SKU</label>
              <input
                type="text"
                name="sku"
                value={form.sku}
                onChange={handleChange}
                placeholder="e.g., ITEM-001"
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                placeholder="Describe the product..."
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
                <input
                  type="number"
                  name="price"
                  value={form.price}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Cut Price (PKR)</label>
                <input
                  type="number"
                  name="cut_price"
                  value={form.cut_price}
                  onChange={handleChange}
                  placeholder="Original price"
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Stock</label>
                <input
                  type="number"
                  name="stock"
                  value={form.stock}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="bg-surface rounded-xl border border-border p-5 space-y-4">
            <h2 className="text-base font-semibold text-text-primary">Product Images</h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {imagePreviews.map((preview, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-border group">
                  <img src={preview} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={14} />
                  </button>
                  {i === 0 && (
                    <span className="absolute bottom-1 left-1 bg-primary text-white text-[10px] px-1.5 py-0.5 rounded">
                      Main
                    </span>
                  )}
                </div>
              ))}

              {imageFiles.length < 10 && (
                <label className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary flex flex-col items-center justify-center cursor-pointer transition-colors">
                  <ImagePlus size={24} className="text-text-muted mb-1" />
                  <span className="text-xs text-text-muted">Add Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageSelect}
                  />
                </label>
              )}
            </div>
            <p className="text-xs text-text-muted">First image will be the main product image. Max 10 images.</p>
          </div>
        </div>

        {/* Right — Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <div className="bg-surface rounded-xl border border-border p-5 space-y-4">
            <h2 className="text-base font-semibold text-text-primary">Status</h2>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            >
              {Object.values(PRODUCT_STATUS).map((s) => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>

          {/* Organization */}
          <div className="bg-surface rounded-xl border border-border p-5 space-y-4">
            <h2 className="text-base font-semibold text-text-primary">Organization</h2>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Category</label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              >
                <option value="">Select Category</option>
                {PRODUCT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Brand</label>
              <input
                type="text"
                name="brand"
                value={form.brand}
                onChange={handleChange}
                placeholder="e.g., TechPro"
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              />
            </div>
          </div>

          {/* Flash Sale */}
          <div className="bg-surface rounded-xl border border-border p-5 space-y-4">
            <h2 className="text-base font-semibold text-text-primary">Flash Sale</h2>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="is_flash_sale"
                checked={form.is_flash_sale}
                onChange={handleChange}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-sm text-text-primary">Enable Flash Sale</span>
            </label>

            {form.is_flash_sale && (
              <>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">Discount %</label>
                  <input
                    type="number"
                    name="discount_percentage"
                    value={form.discount_percentage}
                    onChange={handleChange}
                    placeholder="e.g., 20"
                    min="0"
                    max="100"
                    className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">Sale End Time</label>
                  <input
                    type="datetime-local"
                    name="flash_sale_end_time"
                    value={form.flash_sale_end_time}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                  />
                </div>
              </>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-lg bg-primary text-white font-medium hover:bg-primary-hover disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Creating...' : 'Create Product'}
          </button>
        </div>
      </form>
    </div>
  )
}

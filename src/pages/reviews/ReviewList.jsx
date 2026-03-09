import { useEffect, useState } from 'react'
import { Search, Star, Trash2, Eye, ChevronDown, ChevronUp, Image as ImageIcon, X } from 'lucide-react'
import { getReviews, deleteReview, updateReview, getProductNameById } from '../../services/adminService'
import { formatDate } from '../../utils/helpers'
import Pagination from '../../components/ui/Pagination'
import { toast } from 'react-toastify'

export default function ReviewList() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [ratingFilter, setRatingFilter] = useState('')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('newest')
  const [expandedId, setExpandedId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')
  const [editRating, setEditRating] = useState(0)
  const [productNames, setProductNames] = useState({})
  const [imageModal, setImageModal] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  useEffect(() => {
    loadReviews()
  }, [page, ratingFilter, sort])

  const loadReviews = async () => {
    setLoading(true)
    try {
      const data = await getReviews({ page, rating: ratingFilter, search, sort })
      setReviews(data.reviews)
      setTotalPages(data.totalPages)
      setTotal(data.total)

      // Load product names for all reviews
      const uniqueProductIds = [...new Set(data.reviews.map((r) => r.product_id))]
      const newNames = { ...productNames }
      for (const pid of uniqueProductIds) {
        if (!newNames[pid]) {
          const product = await getProductNameById(pid)
          if (product) newNames[pid] = product
        }
      }
      setProductNames(newNames)
    } catch (err) {
      console.error('Failed to load reviews:', err)
      toast.error('Failed to load reviews')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(1)
    loadReviews()
  }

  const handleDelete = async (id) => {
    try {
      await deleteReview(id)
      toast.success('Review deleted successfully')
      setDeleteConfirm(null)
      loadReviews()
    } catch (err) {
      toast.error('Failed to delete review')
    }
  }

  const handleStartEdit = (review) => {
    setEditingId(review.id)
    setEditText(review.review_text || '')
    setEditRating(review.rating)
  }

  const handleSaveEdit = async (id) => {
    try {
      await updateReview(id, { review_text: editText, rating: editRating })
      toast.success('Review updated successfully')
      setEditingId(null)
      loadReviews()
    } catch (err) {
      toast.error('Failed to update review')
    }
  }

  const renderStars = (rating, size = 14) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={size}
          fill={s <= rating ? '#FFC107' : '#e0e0e0'}
          color={s <= rating ? '#FFC107' : '#e0e0e0'}
        />
      ))}
    </div>
  )

  const renderEditableStars = () => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => setEditRating(s)}
          className="hover:scale-110 transition-transform"
        >
          <Star
            size={20}
            fill={s <= editRating ? '#FFC107' : '#e0e0e0'}
            color={s <= editRating ? '#FFC107' : '#e0e0e0'}
          />
        </button>
      ))}
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Reviews</h1>
        <p className="text-sm text-text-muted mt-1">{total} total reviews</p>
      </div>

      {/* Filters */}
      <div className="bg-surface rounded-xl border border-border p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleSearch} className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search by customer name or review text..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
            />
          </form>
          <select
            value={ratingFilter}
            onChange={(e) => { setRatingFilter(e.target.value); setPage(1) }}
            className="px-3 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(1) }}
            className="px-3 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="highest">Highest Rating</option>
            <option value="lowest">Lowest Rating</option>
          </select>
        </div>
      </div>

      {/* Reviews Table / Cards */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-20 text-text-muted">
          <Star size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">No reviews found</p>
          <p className="text-sm mt-1">Reviews will appear here when customers submit them.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => {
            const product = productNames[review.product_id]
            const isExpanded = expandedId === review.id
            const isEditing = editingId === review.id

            return (
              <div
                key={review.id}
                className="bg-surface rounded-xl border border-border overflow-hidden transition-shadow hover:shadow-md"
              >
                {/* Review Header Row */}
                <div
                  className="flex items-center gap-4 p-4 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : review.id)}
                >
                  {/* Product Image */}
                  <div className="w-12 h-12 rounded-lg overflow-hidden border border-border flex-shrink-0 bg-gray-50">
                    {product?.image ? (
                      <img src={product.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-text-muted">
                        <ImageIcon size={20} />
                      </div>
                    )}
                  </div>

                  {/* Customer + Product */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-text-primary">{review.customer_name || 'Anonymous'}</span>
                      <span className="text-xs text-text-muted">•</span>
                      <span className="text-xs text-text-muted truncate">{product?.name || 'Unknown Product'}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {renderStars(review.rating)}
                      <span className="text-xs text-text-muted">{formatDate(review.created_at)}</span>
                    </div>
                  </div>

                  {/* Review Images indicator */}
                  {review.images && review.images.length > 0 && (
                    <div className="flex items-center gap-1 text-xs text-text-muted">
                      <ImageIcon size={14} />
                      <span>{review.images.length}</span>
                    </div>
                  )}

                  {/* Expand arrow */}
                  <div className="text-text-muted">
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-border pt-3">
                    {isEditing ? (
                      /* Edit Mode */
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-medium text-text-muted mb-1 block">Rating</label>
                          {renderEditableStars()}
                        </div>
                        <div>
                          <label className="text-xs font-medium text-text-muted mb-1 block">Review Text</label>
                          <textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            rows={4}
                            className="w-full p-3 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveEdit(review.id)}
                            className="px-4 py-1.5 bg-warning text-secondary font-medium text-sm rounded-lg hover:opacity-90 transition-colors"
                          >
                            Save Changes
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-4 py-1.5 border border-border text-sm rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* View Mode */
                      <div>
                        {/* Review Text */}
                        <p className="text-sm text-text-secondary leading-relaxed mb-3">
                          {review.review_text || <span className="italic text-text-muted">No review text</span>}
                        </p>

                        {/* Review Images */}
                        {review.images && review.images.length > 0 && (
                          <div className="flex gap-2 flex-wrap mb-3">
                            {review.images.map((img, idx) => (
                              <div
                                key={idx}
                                className="w-16 h-16 rounded-lg overflow-hidden border border-border cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => setImageModal(img)}
                              >
                                <img src={img} alt={`Review ${idx + 1}`} className="w-full h-full object-cover" />
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Meta info */}
                        <div className="flex items-center gap-4 text-xs text-text-muted mb-3">
                          <span>Order: <span className="font-mono">#{review.order_id?.slice(0, 8)}</span></span>
                          <span>User: <span className="font-mono">#{review.user_id?.slice(0, 8)}</span></span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-2 border-t border-border">
                          <button
                            onClick={() => handleStartEdit(review)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-warning/50 hover:bg-yellow-50 transition-colors text-warning"
                          >
                            <Eye size={14} /> Edit
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(review.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-danger/50 hover:bg-red-50 transition-colors text-danger"
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-bold text-text-primary mb-2">Delete Review</h3>
            <p className="text-sm text-text-muted mb-4">
              Are you sure you want to delete this review? This action cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Lightbox Modal */}
      {imageModal && (
        <div
          className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4"
          onClick={() => setImageModal(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setImageModal(null)}
              className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100 transition-colors z-10"
            >
              <X size={16} />
            </button>
            <img src={imageModal} alt="Review" className="max-w-full max-h-[85vh] object-contain rounded-lg" />
          </div>
        </div>
      )}
    </div>
  )
}

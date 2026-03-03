import { Link } from 'react-router-dom'
import { FileQuestion } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center">
        <FileQuestion size={64} className="mx-auto text-text-muted mb-4 opacity-40" />
        <h1 className="text-4xl font-bold text-text-primary mb-2">404</h1>
        <p className="text-text-secondary mb-6">Page not found</p>
        <Link
          to="/dashboard"
          className="px-6 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}

// PageHeader — reusable page-level heading with optional subtitle and action slot
import { Fragment } from 'react';

/**
 * @param {{
 *   title: string,
 *   subtitle?: string,
 *   action?: React.ReactNode,
 * }} props
 */
export default function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6 sm:mb-8">
      {/* Text block */}
      <div className="min-w-0">
        <h1 className="section-title truncate">{title}</h1>
        {subtitle && <p className="section-subtitle mt-1">{subtitle}</p>}
      </div>

      {/* Optional right-side action */}
      {action && (
        <div className="flex-shrink-0 flex items-center">
          {action}
        </div>
      )}
    </div>
  );
}

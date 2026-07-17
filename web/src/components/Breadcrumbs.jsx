import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export default function Breadcrumbs({ items = [] }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.label,
      item: item.href ? `https://quikden.vercel.app${item.href}` : undefined,
    })),
  };

  return (
    <>
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-surface-400 mb-4 flex-wrap">
        {items.map((item, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronRight size={12} className="text-surface-300" />}
            {item.href && i < items.length - 1 ? (
              <Link to={item.href} className="hover:text-primary-600 transition-colors">
                {item.label}
              </Link>
            ) : (
              <span className="text-surface-600 font-medium">{item.label}</span>
            )}
          </span>
        ))}
      </nav>
    </>
  );
}

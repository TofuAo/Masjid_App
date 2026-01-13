import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

/**
 * Breadcrumbs Component
 * Navigation breadcrumb component for showing current page location
 */
const Breadcrumbs = ({ 
  items, 
  className = '',
  separator = 'chevron',
  showHome = true,
  homeHref = '/',
  homeLabel = 'Dashboard'
}) => {
  const Separator = separator === 'chevron' ? ChevronRight : 
                    separator === 'slash' ? () => <span className="text-gray-400">/</span> :
                    separator === 'dot' ? () => <span className="text-gray-400">•</span> :
                    () => <span className="text-gray-400">{separator}</span>;

  return (
    <nav 
      className={`flex items-center space-x-2 text-sm ${className}`}
      aria-label="Breadcrumb"
    >
      <ol className="flex items-center space-x-2">
        {showHome && (
          <>
            <li>
              <Link
                to={homeHref}
                className="text-gray-500 hover:text-emerald-600 transition-colors flex items-center"
                aria-label="Home"
              >
                <Home className="w-4 h-4" />
              </Link>
            </li>
            {items.length > 0 && (
              <li>
                <Separator />
              </li>
            )}
          </>
        )}
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          
          return (
            <React.Fragment key={index}>
              <li>
                {isLast ? (
                  <span 
                    className="text-gray-900 font-medium"
                    aria-current="page"
                  >
                    {item.label}
                  </span>
                ) : item.href ? (
                  <Link
                    to={item.href}
                    className="text-gray-500 hover:text-emerald-600 transition-colors"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span className="text-gray-500">{item.label}</span>
                )}
              </li>
              {!isLast && (
                <li>
                  <Separator />
                </li>
              )}
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
};

/**
 * Breadcrumb Item Helper
 * Creates a breadcrumb item object
 */
export const createBreadcrumbItem = (label, href = null) => ({
  label,
  href,
});

/**
 * Example usage:
 * 
 * <Breadcrumbs 
 *   items={[
 *     createBreadcrumbItem('Kelas', '/kelas'),
 *     createBreadcrumbItem('Tambah Kelas')
 *   ]}
 * />
 */
export default Breadcrumbs;

import React from 'react';

/**
 * PageLayout - 12-column responsive grid for main content + optional side panel.
 * Use for pages that need the "8 cols main + 4 cols side" SaaS dashboard pattern.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Main content (8 cols)
 * @param {React.ReactNode} [props.sidePanel] - Optional side panel (4 cols), e.g. calendar or Recent Activity
 * @param {string} [props.title] - Page title (rendered above content)
 * @param {React.ReactNode} [props.quickAction] - Optional "Quick Action" button (e.g. "+ Add Record")
 */
const PageLayout = ({ children, sidePanel, title, quickAction }) => {
  return (
    <div className="space-y-4">
      {(title || quickAction) && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {title && <h2 className="text-xl font-semibold text-gray-900">{title}</h2>}
          {quickAction && <div className="flex-shrink-0">{quickAction}</div>}
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 min-w-0">{children}</div>
        {sidePanel && (
          <div className="lg:col-span-4 min-w-0">
            <div className="sticky top-4">{sidePanel}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PageLayout;

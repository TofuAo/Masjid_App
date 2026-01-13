import React from 'react';
import Card from './Card';

/**
 * Bento Grid Component
 * A modern grid layout inspired by Apple's Bento Box design
 */
const BentoGrid = ({ 
  children, 
  className = '',
  columns = { default: 1, sm: 2, md: 3, lg: 4 },
  gap = 4
}) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
  };

  const gridColsSm = {
    1: 'sm:grid-cols-1',
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-3',
    4: 'sm:grid-cols-4',
  };

  const gridColsMd = {
    1: 'md:grid-cols-1',
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-4',
  };

  const gridColsLg = {
    1: 'lg:grid-cols-1',
    2: 'lg:grid-cols-2',
    3: 'lg:grid-cols-3',
    4: 'lg:grid-cols-4',
  };

  const gapClasses = {
    2: 'gap-2',
    3: 'gap-3',
    4: 'gap-4',
    6: 'gap-6',
    8: 'gap-8',
  };

  return (
    <div
      className={`
        grid
        ${gridCols[columns.default] || gridCols[1]}
        ${columns.sm ? gridColsSm[columns.sm] : ''}
        ${columns.md ? gridColsMd[columns.md] : ''}
        ${columns.lg ? gridColsLg[columns.lg] : ''}
        ${gapClasses[gap] || gapClasses[4]}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

/**
 * Bento Grid Item
 * Individual item in the bento grid with span options
 */
const BentoGridItem = ({ 
  children, 
  className = '',
  span = { default: 1, sm: 1, md: 1, lg: 1 },
  rowSpan = { default: 1, sm: 1, md: 1, lg: 1 },
  asCard = true
}) => {
  const colSpanClasses = {
    1: 'col-span-1',
    2: 'col-span-2',
    3: 'col-span-3',
    4: 'col-span-4',
  };

  const rowSpanClasses = {
    1: 'row-span-1',
    2: 'row-span-2',
    3: 'row-span-3',
    4: 'row-span-4',
  };

  const content = (
    <div
      className={`
        ${colSpanClasses[span.default] || colSpanClasses[1]}
        ${span.sm ? `sm:${colSpanClasses[span.sm]}` : ''}
        ${span.md ? `md:${colSpanClasses[span.md]}` : ''}
        ${span.lg ? `lg:${colSpanClasses[span.lg]}` : ''}
        ${rowSpanClasses[rowSpan.default] || rowSpanClasses[1]}
        ${rowSpan.sm ? `sm:${rowSpanClasses[rowSpan.sm]}` : ''}
        ${rowSpan.md ? `md:${rowSpanClasses[rowSpan.md]}` : ''}
        ${rowSpan.lg ? `lg:${rowSpanClasses[rowSpan.lg]}` : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );

  if (asCard) {
    return (
      <Card className={`h-full ${className}`}>
        {children}
      </Card>
    );
  }

  return content;
};

BentoGrid.Item = BentoGridItem;

export default BentoGrid;

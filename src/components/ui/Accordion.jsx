import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * Accordion Component
 * Collapsible content sections
 */
const Accordion = ({ 
  children, 
  className = '',
  allowMultiple = false,
  defaultOpen = []
}) => {
  const [openItems, setOpenItems] = useState(new Set(defaultOpen));

  const toggleItem = (index) => {
    setOpenItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        if (!allowMultiple) {
          newSet.clear();
        }
        newSet.add(index);
      }
      return newSet;
    });
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement(child) && child.type === AccordionItem) {
          return React.cloneElement(child, {
            isOpen: openItems.has(index),
            onToggle: () => toggleItem(index),
          });
        }
        return child;
      })}
    </div>
  );
};

/**
 * Accordion Item
 * Individual collapsible item
 */
const AccordionItem = ({ 
  title, 
  children, 
  isOpen = false, 
  onToggle,
  className = '',
  icon,
  defaultOpen = false
}) => {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = onToggle !== undefined;
  const open = isControlled ? isOpen : internalOpen;
  const toggle = isControlled ? onToggle : () => setInternalOpen(!internalOpen);

  return (
    <div className={`border border-gray-200 rounded-lg overflow-hidden ${className}`}>
      <button
        onClick={toggle}
        className={`
          w-full flex items-center justify-between p-4
          text-left bg-white hover:bg-gray-50
          transition-colors duration-200
          focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2
        `}
        aria-expanded={open}
        aria-controls={`accordion-content-${title}`}
      >
        <div className="flex items-center gap-3">
          {icon && <span className="text-emerald-600">{icon}</span>}
          <span className="font-semibold text-gray-900">{title}</span>
        </div>
        <ChevronDown
          className={`
            w-5 h-5 text-gray-500 transition-transform duration-200
            ${open ? 'transform rotate-180' : ''}
          `}
        />
      </button>
      <div
        id={`accordion-content-${title}`}
        className={`
          overflow-hidden transition-all duration-300 ease-in-out
          ${open ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}
        `}
        aria-hidden={!open}
      >
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          {children}
        </div>
      </div>
    </div>
  );
};

/**
 * Simple Accordion (single item, uncontrolled)
 * For standalone use without the Accordion wrapper
 */
export const SimpleAccordion = ({ 
  title, 
  children, 
  defaultOpen = false,
  className = '',
  icon
}) => {
  return (
    <AccordionItem
      title={title}
      defaultOpen={defaultOpen}
      className={className}
      icon={icon}
    >
      {children}
    </AccordionItem>
  );
};

Accordion.Item = AccordionItem;

export default Accordion;

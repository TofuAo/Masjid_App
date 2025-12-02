import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Page Transition Component
 * Provides smooth fade and slide animations between routes
 */
const PageTransition = ({ children, className = '' }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{
        duration: 0.3,
        ease: [0.22, 1, 0.36, 1] // Custom easing for smooth feel
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * Stagger Children Animation
 * Animates children with staggered delay
 */
export const StaggerContainer = ({ children, className = '' }) => {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.1,
            delayChildren: 0.1
          }
        }
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * Stagger Item
 * Individual item for stagger animation
 */
export const StaggerItem = ({ children, className = '' }) => {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.4,
            ease: [0.22, 1, 0.36, 1]
          }
        }
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;


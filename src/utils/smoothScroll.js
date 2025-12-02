/**
 * Smooth scroll utilities
 */

/**
 * Smooth scroll to element
 * @param {string|HTMLElement} target - Element ID or HTMLElement
 * @param {object} options - Scroll options
 */
export const smoothScrollTo = (target, options = {}) => {
  const {
    offset = 0,
    duration = 500,
    behavior = 'smooth'
  } = options;

  let element;
  if (typeof target === 'string') {
    element = document.getElementById(target) || document.querySelector(target);
  } else {
    element = target;
  }

  if (!element) {
    console.warn('Smooth scroll target not found:', target);
    return;
  }

  const elementPosition = element.getBoundingClientRect().top;
  const offsetPosition = elementPosition + window.pageYOffset - offset;

  window.scrollTo({
    top: offsetPosition,
    behavior: behavior
  });
};

/**
 * Smooth scroll to top
 */
export const smoothScrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
};

/**
 * Smooth scroll to bottom
 */
export const smoothScrollToBottom = () => {
  window.scrollTo({
    top: document.documentElement.scrollHeight,
    behavior: 'smooth'
  });
};

export default {
  smoothScrollTo,
  smoothScrollToTop,
  smoothScrollToBottom
};


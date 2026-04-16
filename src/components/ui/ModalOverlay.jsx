/**
 * ModalOverlay — Ensures modals are viewport-fixed, centered, and body scroll is locked.
 * Use as wrapper or copy its pattern: fixed inset-0, portal to document.body, body overflow hidden.
 */
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

const MODAL_PORTAL_ID = 'modal-portal-root';

function getPortalRoot() {
  let root = document.getElementById(MODAL_PORTAL_ID);
  if (!root) {
    root = document.createElement('div');
    root.id = MODAL_PORTAL_ID;
    document.body.appendChild(root);
  }
  return root;
}

/**
 * Locks body scroll when isOpen is true; restores on unmount or when isOpen becomes false.
 */
export function useModalBodyScrollLock(isOpen) {
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);
}

/**
 * Renders children in a portal with viewport-fixed overlay styling.
 * Use for modals so they are always centered in the viewport and not affected by parent transform/scroll.
 *
 * Overlay classes: fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm
 * (prevents background scroll via body lock in parent; overlay covers full viewport and centers content)
 */
export function ModalPortal({ children }) {
  return createPortal(children, getPortalRoot());
}

export default ModalPortal;

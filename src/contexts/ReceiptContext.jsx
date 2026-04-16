import React, { createContext, useContext, useRef, useCallback, useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * Receipt state lives in ReceiptStateRoot (sibling to the page). Opening the receipt
 * only re-renders ReceiptStateRoot and the modal, not the page/table/sidebar.
 */
const ReceiptDispatchContext = createContext(null);

export function useReceiptDispatch() {
  return useContext(ReceiptDispatchContext);
}

const ReceiptViewerLazy = React.lazy(() => import('../components/receipt/ReceiptViewer'));

function ReceiptModal({ payload, onClose }) {
  return (
    <React.Suspense fallback={
      <div
        className="fixed inset-0 flex items-center justify-center p-4 overflow-hidden"
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          width: '100%',
          height: '100%',
          zIndex: 2147483647,
          background: 'transparent',
          isolation: 'isolate',
        }}
      >
        <div
          className="bg-white rounded-xl shadow-2xl flex-shrink-0 w-full max-w-4xl max-h-[90vh] min-h-[400px] overflow-hidden animate-receipt-in"
          style={{ width: 'min(100%, 56rem)' }}
        />
      </div>
    }>
      <ReceiptViewerLazy
        isOpen={true}
        onClose={onClose}
        receiptNumber={payload?.receiptNumber ?? null}
        feeId={payload?.feeId ?? null}
        paymentId={payload?.paymentId ?? null}
      />
    </React.Suspense>
  );
}

function ReceiptStateRoot({ setStateRef }) {
  const [state, setState] = useState({ isOpen: false, payload: null });

  useEffect(() => {
    setStateRef.current = setState;
    return () => { setStateRef.current = null; };
  }, [setStateRef]);

  useEffect(() => {
    if (state.isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.classList.add('receipt-open');
      return () => {
        document.body.style.overflow = '';
        document.body.classList.remove('receipt-open');
      };
    }
  }, [state.isOpen]);

  if (!state.isOpen) return null;
  const portalRoot = document.getElementById('receipt-portal') ?? (() => {
    const el = document.createElement('div');
    el.id = 'receipt-portal';
    el.setAttribute('aria-hidden', 'true');
    document.body.appendChild(el);
    return el;
  })();
  return createPortal(
    <ReceiptModal
      payload={state.payload}
      onClose={() => setStateRef.current?.({ isOpen: false, payload: null })}
    />,
    portalRoot
  );
}

export function ReceiptProvider({ children }) {
  const setStateRef = useRef(null);

  const openReceipt = useCallback((payload) => {
    setStateRef.current?.({ isOpen: true, payload: payload || null });
  }, []);

  const closeReceipt = useCallback(() => {
    setStateRef.current?.({ isOpen: false, payload: null });
  }, []);

  const dispatchValue = useMemo(() => ({ openReceipt, closeReceipt }), [openReceipt, closeReceipt]);

  return (
    <>
      <ReceiptDispatchContext.Provider value={dispatchValue}>
        {children}
      </ReceiptDispatchContext.Provider>
      <ReceiptStateRoot setStateRef={setStateRef} />
    </>
  );
}

'use client';

import {
  AlertDialog as ChakraAlertDialog,
  type AlertDialogProps,
  Drawer as ChakraDrawer,
  type DrawerProps,
  Modal as ChakraModal,
  type ModalProps,
} from '@chakra-ui/react';
import {
  createContext,
  type ReactNode,
  type RefObject,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react';
import { RemoveScroll } from 'react-remove-scroll';
import {
  initialOverlayStackState,
  overlayStackReducer,
  type OverlayStackState,
} from '@/components/common/overlay-stack-state';

type ReservedOverlayProps =
  | 'allowPinchZoom'
  | 'blockScrollOnMount'
  | 'portalProps'
  | 'preserveScrollBarGap';

export type AppModalProps = Omit<ModalProps, ReservedOverlayProps>;
export type AppDrawerProps = Omit<DrawerProps, ReservedOverlayProps>;
export type AppAlertDialogProps = Omit<AlertDialogProps, ReservedOverlayProps>;

type OverlayStackContextValue = OverlayStackState & {
  close: (id: string) => void;
  open: (id: string) => void;
  portalRef: RefObject<HTMLDivElement | null>;
  topId: string | null;
};

const OverlayStackContext = createContext<OverlayStackContextValue | null>(
  null,
);
const useBrowserLayoutEffect =
  typeof window === 'undefined' ? useEffect : useLayoutEffect;

export function OverlayStackProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(
    overlayStackReducer,
    initialOverlayStackState,
  );
  const portalRef = useRef<HTMLDivElement>(null);

  const open = useCallback((id: string) => {
    dispatch({ id, type: 'open' });
  }, []);
  const close = useCallback((id: string) => {
    dispatch({ id, type: 'close' });
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      close,
      open,
      portalRef,
      topId: state.stack.at(-1) ?? null,
    }),
    [close, open, state],
  );

  return (
    <OverlayStackContext.Provider value={value}>
      {children}
      <RemoveScroll
        enabled={state.stack.length > 0}
        removeScrollBar={false}
        shards={[portalRef]}
      >
        <div
          ref={portalRef}
          data-overlay-count={state.stack.length}
          data-testid="managed-overlay-root"
        />
      </RemoveScroll>
    </OverlayStackContext.Provider>
  );
}

function useManagedOverlay(isOpen: boolean, onCloseComplete?: () => void) {
  const context = useContext(OverlayStackContext);
  const id = useId();

  if (!context) {
    throw new Error('Managed overlays require OverlayStackProvider');
  }

  const { close, open, portalRef, topId } = context;

  useBrowserLayoutEffect(() => {
    if (isOpen) open(id);
  }, [id, isOpen, open]);

  useBrowserLayoutEffect(
    () => () => {
      close(id);
    },
    [close, id],
  );

  const handleCloseComplete = useCallback(() => {
    close(id);
    onCloseComplete?.();
  }, [close, id, onCloseComplete]);

  return {
    isTop: topId === null || topId === id,
    onCloseComplete: handleCloseComplete,
    portalRef,
  };
}

function topOnly(value: boolean | undefined, isTop: boolean) {
  return isTop ? (value ?? true) : false;
}

export function AppModal({
  closeOnEsc,
  closeOnOverlayClick,
  isOpen,
  onCloseComplete,
  trapFocus,
  useInert,
  ...props
}: AppModalProps) {
  const managed = useManagedOverlay(isOpen, onCloseComplete);
  return (
    <ChakraModal
      {...props}
      isOpen={isOpen}
      blockScrollOnMount={false}
      closeOnEsc={topOnly(closeOnEsc, managed.isTop)}
      closeOnOverlayClick={topOnly(closeOnOverlayClick, managed.isTop)}
      onCloseComplete={managed.onCloseComplete}
      portalProps={{
        appendToParentPortal: false,
        containerRef: managed.portalRef,
      }}
      trapFocus={topOnly(trapFocus, managed.isTop)}
      useInert={topOnly(useInert, managed.isTop)}
    />
  );
}

export function AppDrawer({
  closeOnEsc,
  closeOnOverlayClick,
  isOpen,
  onCloseComplete,
  trapFocus,
  useInert,
  ...props
}: AppDrawerProps) {
  const managed = useManagedOverlay(isOpen, onCloseComplete);
  return (
    <ChakraDrawer
      {...props}
      isOpen={isOpen}
      blockScrollOnMount={false}
      closeOnEsc={topOnly(closeOnEsc, managed.isTop)}
      closeOnOverlayClick={topOnly(closeOnOverlayClick, managed.isTop)}
      onCloseComplete={managed.onCloseComplete}
      portalProps={{
        appendToParentPortal: false,
        containerRef: managed.portalRef,
      }}
      trapFocus={topOnly(trapFocus, managed.isTop)}
      useInert={topOnly(useInert, managed.isTop)}
    />
  );
}

export function AppAlertDialog({
  closeOnEsc,
  closeOnOverlayClick,
  isOpen,
  onCloseComplete,
  trapFocus,
  useInert,
  ...props
}: AppAlertDialogProps) {
  const managed = useManagedOverlay(isOpen, onCloseComplete);
  return (
    <ChakraAlertDialog
      {...props}
      isOpen={isOpen}
      blockScrollOnMount={false}
      closeOnEsc={topOnly(closeOnEsc, managed.isTop)}
      closeOnOverlayClick={topOnly(closeOnOverlayClick, managed.isTop)}
      onCloseComplete={managed.onCloseComplete}
      portalProps={{
        appendToParentPortal: false,
        containerRef: managed.portalRef,
      }}
      trapFocus={topOnly(trapFocus, managed.isTop)}
      useInert={topOnly(useInert, managed.isTop)}
    />
  );
}

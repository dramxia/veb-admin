'use client';

import {
  Box,
  Icon,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Portal,
  useDisclosure,
  useFormControlContext,
} from '@chakra-ui/react';
import type { PlacementWithLogical, SystemStyleObject } from '@chakra-ui/react';
import { Check, ChevronDown } from 'lucide-react';
import type {
  ChangeEvent,
  ComponentProps,
  KeyboardEvent as ReactKeyboardEvent,
  ReactNode,
  Ref,
  UIEvent,
} from 'react';
import {
  Children,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';

type SelectSize = 'sm' | 'md' | 'lg';

type AppSelectOption = {
  value: string;
  label: ReactNode;
  disabled?: boolean;
};

export type AppSelectProps = {
  /** 选项列表。也可以通过 children <option> 传入，两者取其一。 */
  options?: AppSelectOption[];
  /** 受控选中值；传入即进入受控模式。 */
  value?: string;
  /** 非受控模式初始值（配合 name 供原生表单 FormData 读取）。 */
  defaultValue?: string;
  /** 受控变更回调，event.target.value 与原生 select 行为一致。 */
  onChange?: (event: ChangeEvent<HTMLSelectElement>) => void;
  /** 表单字段名。传入后会渲染一个视觉隐藏的同步原生 select，FormData 可直接读取。 */
  name?: string;
  /** 空值占位文案。占位本身不是选项，值为 '' 时展示。 */
  placeholder?: string;
  isDisabled?: boolean;
  isInvalid?: boolean;
  size?: SelectSize;
  /** 浮层宽度策略：trigger 跟随触发器宽度，auto 随内容展开。 */
  listboxWidth?: 'trigger' | 'auto';
  /** 浮层最大高度，超出后内部滚动。 */
  listboxMaxH?: string;
  placement?: PlacementWithLogical;
  'aria-label'?: string;
  id?: string;
  className?: string;
  children?: ReactNode;
  /** 透传给触发器的 Chakra style props（如 maxW、w、flex）。 */
  sx?: SystemStyleObject;
};

const triggerSizes: Record<
  SelectSize,
  { h: string; px: string; fontSize: string }
> = {
  sm: { h: '32px', px: '12px', fontSize: '14px' },
  md: { h: '36px', px: '14px', fontSize: '14px' },
  lg: { h: '40px', px: '16px', fontSize: '16px' },
};

const floatingViewportPadding = 8;
const floatingGutter = 8;
const contentChromeHeight = 14;
const fallbackAvailableHeight = `calc(100dvh - ${
  floatingViewportPadding * 2
}px)`;

const constrainFloatingSize: NonNullable<
  ComponentProps<typeof Popover>['modifiers']
>[number] = {
  name: 'appSelectAvailableSize',
  enabled: true,
  phase: 'beforeWrite',
  requires: ['computeStyles'],
  fn({ state }) {
    const reference = state.elements.reference;
    if (!('ownerDocument' in reference)) return;

    const doc = reference.ownerDocument;
    const viewport = doc.defaultView?.visualViewport;
    const viewportTop = viewport?.offsetTop ?? 0;
    const viewportHeight = viewport?.height ?? doc.documentElement.clientHeight;
    const viewportWidth = viewport?.width ?? doc.documentElement.clientWidth;
    const viewportBottom = viewportTop + viewportHeight;
    const referenceRect = reference.getBoundingClientRect();
    const isAbove = state.placement.startsWith('top');
    const availableHeight = isAbove
      ? referenceRect.top -
        viewportTop -
        floatingGutter -
        floatingViewportPadding
      : viewportBottom -
        referenceRect.bottom -
        floatingGutter -
        floatingViewportPadding;
    const popperStyle = state.elements.popper.style;

    popperStyle.setProperty(
      '--app-select-available-height',
      `${Math.max(0, Math.floor(availableHeight))}px`,
    );
    popperStyle.maxWidth = `${Math.max(
      0,
      Math.floor(viewportWidth - floatingViewportPadding * 2),
    )}px`;
  },
  effect({ state }) {
    return () => {
      const popperStyle = state.elements.popper.style;
      popperStyle.removeProperty('--app-select-available-height');
      popperStyle.removeProperty('max-width');
    };
  },
};

function parseChildren(children: ReactNode): AppSelectOption[] {
  return Children.toArray(children).flatMap((child): AppSelectOption[] => {
    if (!isValidElement(child)) return [];
    if (child.type === 'option') {
      const props = child.props as {
        value?: string;
        disabled?: boolean;
        children?: ReactNode;
      };
      return [
        {
          value: String(props.value ?? ''),
          label: props.children ?? props.value ?? '',
          disabled: props.disabled,
        },
      ];
    }
    if (child.type === 'optgroup') {
      const props = child.props as { children?: ReactNode };
      return parseChildren(props.children);
    }
    return [];
  });
}

function flattenText(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === 'boolean') {
    return '';
  }
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(flattenText).join('');
  }
  if (isValidElement(node)) {
    return flattenText((node.props as { children?: ReactNode }).children);
  }
  return '';
}

export function AppSelect(props: AppSelectProps) {
  const {
    options: optionsProp,
    value: controlledValue,
    defaultValue,
    onChange,
    name,
    placeholder,
    isDisabled: isDisabledProp,
    isInvalid: isInvalidProp,
    size = 'md',
    listboxWidth = 'trigger',
    listboxMaxH = '264px',
    placement = 'bottom-start',
    id,
    className,
    children,
    sx,
  } = props;

  const ariaLabel = props['aria-label'];
  const formControl = useFormControlContext();
  const isDisabled = isDisabledProp ?? formControl?.isDisabled ?? false;
  const isInvalid = isInvalidProp ?? formControl?.isInvalid ?? false;

  const options = useMemo(
    () => optionsProp ?? parseChildren(children),
    [optionsProp, children],
  );

  const hasOptionValue = useCallback(
    (v: string) => options.some((option) => option.value === v),
    [options],
  );

  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = useState(() => defaultValue ?? '');
  const currentValue = isControlled ? controlledValue : internalValue;

  const { isOpen, onOpen, onClose } = useDisclosure();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const hiddenSelectRef = useRef<HTMLSelectElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const autoId = useId();
  const listboxId = `${autoId}-listbox`;

  const selectedIndex = useMemo(
    () => options.findIndex((option) => option.value === currentValue),
    [options, currentValue],
  );
  const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : null;

  const commitValue = useCallback(
    (next: string) => {
      if (!isControlled) {
        setInternalValue(next);
      }
      if (onChange) {
        const hiddenSelect = hiddenSelectRef.current;
        if (hiddenSelect) {
          hiddenSelect.value = next;
          onChange({
            target: hiddenSelect,
            currentTarget: hiddenSelect,
          } as ChangeEvent<HTMLSelectElement>);
        } else {
          onChange({
            target: { value: next, name },
            currentTarget: { value: next, name },
          } as unknown as ChangeEvent<HTMLSelectElement>);
        }
      }
    },
    [isControlled, name, onChange],
  );

  const selectIndex = useCallback(
    (index: number) => {
      const option = options[index];
      if (!option || option.disabled) return;
      commitValue(option.value);
      onClose();
      triggerRef.current?.focus();
    },
    [commitValue, onClose, options],
  );

  const openWithIndex = useCallback(
    (index: number) => {
      setActiveIndex(index);
      if (!isOpen) onOpen();
    },
    [isOpen, onOpen],
  );

  const findNextEnabled = useCallback(
    (from: number, step: 1 | -1) => {
      if (options.length === 0) return -1;
      let index = from;
      for (let count = 0; count < options.length; count += 1) {
        index = (index + step + options.length) % options.length;
        if (!options[index]?.disabled) return index;
      }
      return -1;
    },
    [options],
  );

  const handleTriggerKeyDown = (event: ReactKeyboardEvent) => {
    if (isDisabled) return;
    switch (event.key) {
      case 'ArrowDown': {
        event.preventDefault();
        if (isOpen) {
          setActiveIndex((current) => findNextEnabled(current, 1));
        } else {
          const from = selectedIndex >= 0 ? selectedIndex : -1;
          openWithIndex(findNextEnabled(from, 1));
        }
        break;
      }
      case 'ArrowUp': {
        event.preventDefault();
        if (isOpen) {
          setActiveIndex((current) => findNextEnabled(current, -1));
        } else {
          const from = selectedIndex >= 0 ? selectedIndex : options.length;
          openWithIndex(findNextEnabled(from, -1));
        }
        break;
      }
      case 'Enter':
      case ' ': {
        event.preventDefault();
        if (isOpen) {
          if (activeIndex >= 0) selectIndex(activeIndex);
        } else {
          openWithIndex(
            selectedIndex >= 0 ? selectedIndex : findNextEnabled(-1, 1),
          );
        }
        break;
      }
      case 'Escape': {
        if (isOpen) {
          event.preventDefault();
          event.stopPropagation();
          onClose();
        }
        break;
      }
      case 'Home': {
        if (isOpen) {
          event.preventDefault();
          setActiveIndex(findNextEnabled(-1, 1));
        }
        break;
      }
      case 'End': {
        if (isOpen) {
          event.preventDefault();
          setActiveIndex(findNextEnabled(options.length, -1));
        }
        break;
      }
      default:
        break;
    }
  };

  const handleListKeyDown = (event: ReactKeyboardEvent) => {
    switch (event.key) {
      case 'ArrowDown': {
        event.preventDefault();
        setActiveIndex((current) => findNextEnabled(current, 1));
        break;
      }
      case 'ArrowUp': {
        event.preventDefault();
        setActiveIndex((current) => findNextEnabled(current, -1));
        break;
      }
      case 'Enter':
      case ' ': {
        event.preventDefault();
        if (activeIndex >= 0) selectIndex(activeIndex);
        break;
      }
      case 'Escape': {
        event.preventDefault();
        onClose();
        triggerRef.current?.focus();
        break;
      }
      case 'Tab': {
        onClose();
        break;
      }
      case 'Home': {
        event.preventDefault();
        setActiveIndex(findNextEnabled(-1, 1));
        break;
      }
      case 'End': {
        event.preventDefault();
        setActiveIndex(findNextEnabled(options.length, -1));
        break;
      }
      default:
        break;
    }
  };

  // 打开后确保高亮项在可视区域内
  useEffect(() => {
    if (!isOpen) return;
    const listbox = listboxRef.current;
    if (!listbox) return;
    const target =
      activeIndex >= 0
        ? activeIndex
        : selectedIndex >= 0
          ? selectedIndex
          : findNextEnabled(-1, 1);
    if (target < 0) return;
    setActiveIndex((current) => (current >= 0 ? current : target));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || activeIndex < 0) return;
    const listbox = listboxRef.current;
    const item = listbox?.querySelector<HTMLElement>(
      `[data-option-index="${activeIndex}"]`,
    );
    if (!listbox || !item) return;

    const listboxRect = listbox.getBoundingClientRect();
    const itemRect = item.getBoundingClientRect();
    if (itemRect.top < listboxRect.top) {
      listbox.scrollTop -= listboxRect.top - itemRect.top;
    } else if (itemRect.bottom > listboxRect.bottom) {
      listbox.scrollTop += itemRect.bottom - listboxRect.bottom;
    }
  }, [activeIndex, isOpen]);

  useEffect(() => {
    if (!isOpen || !triggerRef.current || !window.IntersectionObserver) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry && !entry.isIntersecting) onClose();
    });
    observer.observe(triggerRef.current);
    return () => observer.disconnect();
  }, [isOpen, onClose]);

  const handleListScroll = (event: UIEvent<HTMLDivElement>) => {
    event.stopPropagation();
  };

  const triggerContent = selectedOption ? (
    selectedOption.label
  ) : placeholder ? (
    <Box as="span" color="ink.400">
      {placeholder}
    </Box>
  ) : (
    ''
  );

  const sizeStyles = triggerSizes[size];

  const triggerSx: SystemStyleObject = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 2,
    w: 'full',
    h: sizeStyles.h,
    px: sizeStyles.px,
    fontSize: sizeStyles.fontSize,
    bg: 'controlBg',
    borderWidth: '1px',
    borderColor: isInvalid ? 'statusDanger' : 'borderDefault',
    borderRadius: 'control',
    color: 'ink.800',
    fontWeight: 500,
    lineHeight: '1.2',
    textAlign: 'start',
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    transitionDuration: '160ms',
    transitionProperty: 'common',
    _hover: isDisabled
      ? undefined
      : {
          bg: 'surfaceSolidBg',
          borderColor: isInvalid ? 'statusDanger' : 'brand.300',
        },
    _focusVisible: {
      borderColor: isInvalid ? 'statusDanger' : 'brand.500',
      boxShadow: isInvalid ? 'focusRingDanger' : 'focusRing',
      outline: 'none',
    },
    _disabled: {
      bg: 'controlDisabledBg',
      borderColor: 'borderSubtle',
      color: 'ink.500',
      opacity: 1,
    },
    ...sx,
  };

  return (
    <>
      {/* 隐藏的原生 select：同步当前值，供 FormData / 非受控表单读取 */}
      <Box
        as="select"
        ref={hiddenSelectRef as Ref<HTMLSelectElement>}
        aria-hidden="true"
        tabIndex={-1}
        name={name}
        value={currentValue}
        onChange={() => undefined}
        sx={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: 0,
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0 0 0 0)',
          whiteSpace: 'nowrap',
          border: 0,
          opacity: 0,
          pointerEvents: 'none',
        }}
      >
        {currentValue !== '' && !hasOptionValue(currentValue) ? (
          <option value={currentValue}>
            {flattenText(selectedOption?.label) || currentValue}
          </option>
        ) : null}
        {placeholder !== undefined ? <option value="" /> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {flattenText(option.label)}
          </option>
        ))}
      </Box>

      <Popover
        isOpen={isOpen}
        onOpen={onOpen}
        onClose={onClose}
        placement={placement}
        matchWidth={listboxWidth === 'trigger'}
        strategy="fixed"
        boundary="clippingParents"
        preventOverflow
        flip
        eventListeners={{ scroll: true, resize: true }}
        modifiers={[constrainFloatingSize]}
        isLazy
        lazyBehavior="unmount"
        autoFocus={false}
        returnFocusOnClose={false}
        computePositionOnMount
      >
        <PopoverTrigger>
          <Box
            as="button"
            type="button"
            ref={triggerRef}
            id={id}
            className={className}
            aria-label={ariaLabel}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            aria-invalid={isInvalid || undefined}
            disabled={isDisabled}
            onKeyDown={handleTriggerKeyDown}
            sx={triggerSx}
          >
            <Box
              as="span"
              overflow="hidden"
              textOverflow="ellipsis"
              whiteSpace="nowrap"
              flex="1"
              minW={0}
            >
              {triggerContent}
            </Box>
            <Icon
              as={ChevronDown}
              boxSize={4}
              flexShrink={0}
              color={isDisabled ? 'ink.400' : 'brand.600'}
              transform={isOpen ? 'rotate(180deg)' : 'rotate(0deg)'}
              transition="transform 160ms ease"
              aria-hidden="true"
            />
          </Box>
        </PopoverTrigger>
        <Portal>
          <PopoverContent
            width={listboxWidth === 'auto' ? 'max-content' : '100%'}
            minW={listboxWidth === 'auto' ? '160px' : undefined}
            maxW={`min(360px, calc(100vw - ${floatingViewportPadding * 2}px))`}
            maxH={`var(--app-select-available-height, ${fallbackAvailableHeight})`}
            overflow="hidden"
            p={1.5}
            _focus={{ outline: 'none' }}
            _focusVisible={{ outline: 'none', boxShadow: 'floating' }}
          >
            <Box
              as="div"
              role="listbox"
              id={listboxId}
              aria-label={ariaLabel}
              tabIndex={-1}
              ref={listboxRef}
              display="flex"
              flexDirection="column"
              gap={1}
              maxH={`min(${listboxMaxH}, calc(var(--app-select-available-height, ${fallbackAvailableHeight}) - ${contentChromeHeight}px))`}
              overflowY="auto"
              onKeyDown={handleListKeyDown}
              onScroll={handleListScroll}
              sx={{
                overscrollBehavior: 'contain',
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(148, 163, 184, 0.5) transparent',
                '&::-webkit-scrollbar': { width: '6px' },
                '&::-webkit-scrollbar-thumb': {
                  background: 'rgba(148, 163, 184, 0.45)',
                  borderRadius: 'full',
                },
                '&::-webkit-scrollbar-track': { background: 'transparent' },
              }}
            >
              {options.length === 0 ? (
                <Box px={3} py={2.5} color="ink.400" fontSize="sm">
                  暂无可选项
                </Box>
              ) : (
                options.map((option, index) => {
                  const isSelected = option.value === currentValue;
                  const isActive = index === activeIndex;
                  return (
                    <Box
                      key={option.value || `__empty_${index}`}
                      as="div"
                      role="option"
                      id={`${listboxId}-option-${index}`}
                      data-option-index={index}
                      aria-selected={isSelected}
                      aria-disabled={option.disabled || undefined}
                      onClick={() => selectIndex(index)}
                      onMouseEnter={() => {
                        if (!option.disabled) setActiveIndex(index);
                      }}
                      display="flex"
                      alignItems="center"
                      justifyContent="space-between"
                      gap={2}
                      px={3}
                      py={2}
                      minH={10}
                      borderRadius="control"
                      fontSize="sm"
                      fontWeight={isSelected ? 600 : 500}
                      lineHeight="1.35"
                      color={
                        option.disabled
                          ? 'ink.400'
                          : isSelected
                            ? 'brand.700'
                            : 'ink.700'
                      }
                      bg={
                        isSelected
                          ? 'brand.50'
                          : isActive
                            ? 'brand.50'
                            : 'transparent'
                      }
                      cursor={option.disabled ? 'not-allowed' : 'pointer'}
                      transition="background 160ms ease, color 160ms ease"
                      _hover={
                        option.disabled
                          ? undefined
                          : { bg: 'brand.50', color: 'ink.900' }
                      }
                    >
                      <Box
                        as="span"
                        overflow="hidden"
                        textOverflow="ellipsis"
                        whiteSpace="nowrap"
                      >
                        {option.label}
                      </Box>
                      {isSelected ? (
                        <Icon
                          as={Check}
                          boxSize={4}
                          flexShrink={0}
                          color="brand.600"
                          aria-hidden="true"
                        />
                      ) : null}
                    </Box>
                  );
                })
              )}
            </Box>
          </PopoverContent>
        </Portal>
      </Popover>
    </>
  );
}

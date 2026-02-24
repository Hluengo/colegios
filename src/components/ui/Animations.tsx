/**
 * Animations - Micro-interacciones y utilerías de animación
 *
 * Componentes de animación avanzados y hooks para transiciones.
 *
 * @example
 * <FadeIn delay={200}>Contenido</FadeIn>
 * <SlideIn direction="up">Contenido</SlideIn>
 * <ScaleIn>Contenido</ScaleIn>
 */

import { Children, isValidElement, useState, useEffect } from 'react';
import type { ReactNode, CSSProperties } from 'react';

interface FadeInProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

export function FadeIn({
  children,
  delay = 0,
  duration = 300,
  className = '',
}: FadeInProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`transition-opacity ${className}`}
      style={{
        opacity: isVisible ? 1 : 0,
        transition: `opacity ${duration}ms ease-out`,
      }}
    >
      {children}
    </div>
  );
}

interface SlideInProps {
  children: ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right';
  delay?: number;
  distance?: number;
  duration?: number;
  className?: string;
}

export function SlideIn({
  children,
  direction = 'up',
  delay = 0,
  distance = 20,
  duration = 300,
  className = '',
}: SlideInProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const transforms = {
    up: `translateY(${isVisible ? 0 : distance}px)`,
    down: `translateY(${isVisible ? 0 : -distance}px)`,
    left: `translateX(${isVisible ? 0 : distance}px)`,
    right: `translateX(${isVisible ? 0 : -distance}px)`,
  };

  return (
    <div
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: transforms[direction],
        transition: `all ${duration}ms ease-out`,
      }}
    >
      {children}
    </div>
  );
}

interface ScaleInProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

export function ScaleIn({
  children,
  delay = 0,
  duration = 200,
  className = '',
}: ScaleInProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: `scale(${isVisible ? 1 : 0.95})`,
        transition: `all ${duration}ms ease-out`,
      }}
    >
      {children}
    </div>
  );
}

/**
 * AnimateOnMount - Animación cuando el componente se monta
 */
interface AnimateOnMountProps {
  children: ReactNode;
  animation?: 'fade' | 'slide-up' | 'slide-down' | 'scale';
  delay?: number;
  className?: string;
}

export function AnimateOnMount({
  children,
  animation = 'fade',
  delay = 0,
  className = '',
}: AnimateOnMountProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const animations: Record<string, CSSProperties> = {
    fade: { opacity: isVisible ? 1 : 0 },
    'slide-up': {
      opacity: isVisible ? 1 : 0,
      transform: `translateY(${isVisible ? 0 : 20}px)`,
    },
    'slide-down': {
      opacity: isVisible ? 1 : 0,
      transform: `translateY(${isVisible ? 0 : -20}px)`,
    },
    scale: {
      opacity: isVisible ? 1 : 0,
      transform: `scale(${isVisible ? 1 : 0.9})`,
    },
  };

  return (
    <div
      className={className}
      style={{
        ...animations[animation],
        transition: 'all 300ms ease-out',
      }}
    >
      {children}
    </div>
  );
}

/**
 * StaggerChildren - Animaciones escalonadas para listas
 *
 * NOTA: Para un uso correcto, los children deben tener una prop 'key' única.
 * Si no tienen key, se usará el índice como fallback (no recomendado para listas dinámicas).
 */
interface StaggerChildrenProps {
  children: ReactNode;
  delay?: number;
  stagger?: number;
  className?: string;
}

export function StaggerChildren({
  children,
  delay = 0,
  stagger = 50,
  className = '',
}: StaggerChildrenProps) {
  const childArray = Children.toArray(children);

  return (
    <div className={className}>
      {childArray.map((child, index) => {
        // Intentar obtener la key del child si existe, sino usar índice
        const key =
          isValidElement(child) && child.key !== null
            ? child.key
            : `stagger-${index}`;
        return (
          <FadeIn key={key} delay={delay + index * stagger}>
            {child}
          </FadeIn>
        );
      })}
    </div>
  );
}

/**
 * Pulse - Efecto de pulso
 */
interface PulseProps {
  children: ReactNode;
  className?: string;
}

export function Pulse({ children, className = '' }: PulseProps) {
  return <div className={`animate-pulse ${className}`}>{children}</div>;
}

/**
 * Spin - Efecto de rotación
 */
interface SpinProps {
  children: ReactNode;
  className?: string;
}

export function Spin({ children, className = '' }: SpinProps) {
  return <div className={`animate-spin ${className}`}>{children}</div>;
}

/**
 * HoverScale - Escala en hover
 */
interface HoverScaleProps {
  children: ReactNode;
  scale?: number;
  className?: string;
}

export function HoverScale({
  children,
  scale = 1.05,
  className = '',
}: HoverScaleProps) {
  return (
    <div
      className={`transition-transform duration-200 hover:scale-[var(--hover-scale)] ${className}`}
      style={{ ['--hover-scale' as string]: String(scale) } as CSSProperties}
    >
      {children}
    </div>
  );
}

/**
 * ProgressBar - Barra de progreso animada
 */
interface ProgressBarProps {
  value: number;
  max?: number;
  color?: 'primary' | 'success' | 'warning' | 'danger';
  showLabel?: boolean;
  className?: string;
}

export function ProgressBar({
  value,
  max = 100,
  color = 'primary',
  showLabel = false,
  className = '',
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const colors = {
    primary: 'bg-primary-500',
    success: 'bg-success-500',
    warning: 'bg-warning-500',
    danger: 'bg-danger-500',
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="h-2 bg-surface-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${colors[color]} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-surface-500 mt-1">
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  );
}

/**
 * NumberCounter - Contador animado de números
 */
interface NumberCounterProps {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
}

export function NumberCounter({
  value,
  prefix = '',
  suffix = '',
  duration = 1000,
  className = '',
}: NumberCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime: number;
    let frameId = 0;
    const startValue = 0;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.floor(
        startValue + (value - startValue) * easeOut,
      );

      setDisplayValue(currentValue);

      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      }
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [value, duration]);

  return (
    <span className={className}>
      {prefix}
      {displayValue.toLocaleString()}
      {suffix}
    </span>
  );
}

/**
 * Accordion - Acordeón animado
 */
interface AccordionItem {
  id: string;
  title: string;
  content: ReactNode;
}

interface AccordionProps {
  items: AccordionItem[];
  allowMultiple?: boolean;
  className?: string;
}

export function Accordion({
  items,
  allowMultiple = false,
  className = '',
}: AccordionProps) {
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    if (allowMultiple) {
      setOpenIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      });
    } else {
      setOpenIds((prev) => (prev.has(id) ? new Set() : new Set([id])));
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {items.map((item) => (
        <div
          key={item.id}
          className="border border-surface-200 rounded-xl overflow-hidden"
        >
          <button
            type="button"
            onClick={() => toggle(item.id)}
            className="w-full px-4 py-3 flex items-center justify-between bg-white hover:bg-surface-50 transition-colors"
          >
            <span className="font-medium text-surface-900">{item.title}</span>
            <span
              className={`transform transition-transform duration-200 ${
                openIds.has(item.id) ? 'rotate-180' : ''
              }`}
            >
              ▼
            </span>
          </button>
          <div
            className={`overflow-hidden transition-all duration-300 ${
              openIds.has(item.id)
                ? 'max-h-96 opacity-100'
                : 'max-h-0 opacity-0'
            }`}
          >
            <div className="px-4 py-3 bg-surface-50 text-surface-600">
              {item.content}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Tabs - Pestañas animadas
 */
interface Tab {
  id: string;
  label: string;
  content: ReactNode;
  icon?: ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  className?: string;
}

export function Tabs({ tabs, defaultTab, className = '' }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id || '');

  useEffect(() => {
    if (!tabs || tabs.length === 0) {
      setActiveTab('');
      return;
    }

    if (!tabs.some((t) => t.id === activeTab)) {
      setActiveTab(
        defaultTab && tabs.some((t) => t.id === defaultTab)
          ? defaultTab
          : tabs[0].id,
      );
    }
  }, [tabs, defaultTab, activeTab]);

  if (!tabs || tabs.length === 0) return null;

  return (
    <div className={className}>
      <div className="flex border-b border-surface-200">
        {tabs.map((tab) => (
          <button
            type="button"
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              px-4 py-3 font-medium text-sm transition-all duration-200
              border-b-2 -mb-px
              ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-surface-500 hover:text-surface-700 hover:border-surface-300'
              }
            `}
          >
            {tab.icon && <span className="mr-2">{tab.icon}</span>}
            {tab.label}
          </button>
        ))}
      </div>
      <div className="mt-4">
        {tabs.find((t) => t.id === activeTab)?.content}
      </div>
    </div>
  );
}

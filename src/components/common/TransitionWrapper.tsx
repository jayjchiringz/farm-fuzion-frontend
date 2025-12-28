// src/components/common/TransitionWrapper.tsx
import React, { ReactNode, useEffect, useState } from 'react';

interface TransitionWrapperProps {
  children: ReactNode;
  show: boolean;
  duration?: number;
  delay?: number;
  animation?: 'fade' | 'slide-up' | 'slide-down' | 'scale';
  className?: string;
}

export const TransitionWrapper: React.FC<TransitionWrapperProps> = ({
  children,
  show,
  duration = 300,
  delay = 0,
  animation = 'fade',
  className = '',
}) => {
  const [shouldRender, setShouldRender] = useState(show);

  useEffect(() => {
    if (show) {
      setShouldRender(true);
    }
  }, [show]);

  const onAnimationEnd = () => {
    if (!show) {
      setShouldRender(false);
    }
  };

  if (!shouldRender) return null;

  const animationClasses = {
    'fade': show ? 'animate-fade-in' : 'opacity-0',
    'slide-up': show ? 'animate-slide-up' : 'opacity-0 -translate-y-2',
    'slide-down': show ? 'animate-slide-down' : 'opacity-0 translate-y-2',
    'scale': show ? 'animate-[scaleUp_0.3s_ease-out]' : 'opacity-0 scale-95',
  };

  const style = {
    animationDuration: `${duration}ms`,
    animationDelay: `${delay}ms`,
    animationFillMode: 'both' as const,
  };

  return (
    <div
      className={`transition-all duration-${duration} ${animationClasses[animation]} ${className}`}
      style={style}
      onAnimationEnd={onAnimationEnd}
    >
      {children}
    </div>
  );
};

// For staggered animations in lists
export const StaggeredList: React.FC<{
  children: ReactNode[];
  animation?: 'slide-up' | 'fade' | 'slide-in-right';
  delay?: number;
}> = ({ children, animation = 'slide-up', delay = 100 }) => {
  return (
    <>
      {React.Children.map(children, (child, index) => (
        <div
          className={`animate-${animation} ${
            animation === 'slide-up' ? 'animate-slide-up' :
            animation === 'fade' ? 'animate-fade-in' :
            'animate-slide-in-right'
          }`}
          style={{
            animationDelay: `${index * delay}ms`,
            animationFillMode: 'both',
          }}
        >
          {child}
        </div>
      ))}
    </>
  );
};

import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'outline' | 'success' | 'warning' | 'info' | 'purple' | 'danger';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = ''
}) => {
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1';

  let variantClasses = 'bg-slate-800 text-slate-300 border-slate-700';

  switch (variant) {
    case 'outline':
      variantClasses = 'bg-transparent text-slate-400 border-slate-700 hover:border-slate-600';
      break;
    case 'success':
      variantClasses = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      break;
    case 'warning':
      variantClasses = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      break;
    case 'info':
      variantClasses = 'bg-sky-500/10 text-sky-400 border-sky-500/30';
      break;
    case 'purple':
      variantClasses = 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      break;
    case 'danger':
      variantClasses = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      break;
  }

  return (
    <span
      className={`inline-flex items-center gap-1 font-medium rounded-md border whitespace-nowrap select-none ${sizeClasses} ${variantClasses} ${className}`}
    >
      {children}
    </span>
  );
};

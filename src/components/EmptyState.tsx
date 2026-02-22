/**
 * EmptyState component - Generic fallback UI for empty data scenarios
 * Prevents 404 errors and provides helpful messaging
 */

import React from 'react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    href: string;
  };
  className?: string;
}

export function EmptyState({
  title = 'No items found',
  description = 'Please check back soon or contact us for more information.',
  icon,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-4 ${className}`}>
      {icon && (
        <div className="mb-4 text-gray-400">
          {icon}
        </div>
      )}
      
      <h3 className="text-xl font-semibold text-gray-800 mb-2">
        {title}
      </h3>
      
      <p className="text-gray-600 text-center max-w-md mb-6">
        {description}
      </p>
      
      {action && (
        <a
          href={action.href}
          className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
        >
          {action.label}
        </a>
      )}
    </div>
  );
}

export default EmptyState;

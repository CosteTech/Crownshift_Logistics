'use client';

import { AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface ContentPlaceholderProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  actionHref?: string;
  actionLabel?: string;
  isAdmin?: boolean;
}

export function ContentPlaceholder({
  title,
  description,
  icon = <AlertCircle className="h-12 w-12 text-amber-500" />,
  actionHref,
  actionLabel = 'Go Back Home',
  isAdmin = false,
}: ContentPlaceholderProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="text-center space-y-4 max-w-md">
        <div className="flex justify-center">{icon}</div>
        
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        
        <p className="text-muted-foreground text-sm leading-relaxed">
          {description}
        </p>

        {isAdmin && (
          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-left">
            <p className="text-xs text-blue-900 dark:text-blue-100 font-medium">
              💡 Tip: Add content from the admin panel to display it here.
            </p>
          </div>
        )}

        <div className="pt-4">
          <Button asChild>
            <Link href={actionHref || '/'}>
              {actionLabel}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

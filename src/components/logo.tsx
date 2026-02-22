import type { SVGProps } from "react";

const Logo = (props: SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      aria-label="Crownshift Logistics LTD Logo"
      {...props}
    >
      <defs>
        <linearGradient id="chevron-light-gradient" x1="0.5" x2="0.5" y2="1">
            <stop stopColor="hsl(var(--muted-foreground))" />
            <stop offset="1" stopColor="hsl(var(--muted))" />
        </linearGradient>
        <linearGradient id="chevron-medium-gradient" x1="0.5" x2="0.5" y2="1">
            <stop stopColor="hsl(var(--primary))" />
            <stop offset="1" stopColor="hsl(var(--primary) / 0.8)" />
        </linearGradient>
         <linearGradient id="chevron-dark-gradient" x1="0.5" x2="0.5" y2="1">
            <stop stopColor="hsl(var(--primary) / 0.9)" />
            <stop offset="1" stopColor="hsl(var(--primary) / 0.7)" />
        </linearGradient>
      </defs>
      
      {/* Crown */}
      <g transform="translate(0, 2) scale(1.1)">
        <path
          d="M25 25 L35 15 L50 22 L65 15 L75 25 L25 25 Z"
          fill="hsl(var(--muted-foreground))"
          stroke="hsl(var(--foreground))"
          strokeWidth="1"
        />
        <circle cx="35" cy="15" r="3" fill="hsl(var(--foreground))" />
        <circle cx="50" cy="22" r="3" fill="hsl(var(--foreground))" />
        <circle cx="65" cy="15" r="3" fill="hsl(var(--foreground))" />
      </g>

      {/* Chevrons */}
      <g transform="translate(0, 10)">
          <path d="M10 40 L30 40 L50 60 L30 80 L10 80 L30 60 Z" fill="url(#chevron-light-gradient)" />
          <path d="M35 40 L55 40 L75 60 L55 80 L35 80 L55 60 Z" fill="url(#chevron-medium-gradient)" />
          <path d="M60 40 L80 40 L100 60 L80 80 L60 80 L80 60 Z" fill="url(#chevron-dark-gradient)" />
      </g>
    </svg>
  );
  

export default Logo;

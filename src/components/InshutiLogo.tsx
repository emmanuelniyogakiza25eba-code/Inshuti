type InshutiLogoProps = {
  variant?: 'light' | 'dark';
  className?: string;
  sizeClassName?: string;
  iconOnly?: boolean;
  stacked?: boolean;
  horizontal?: boolean;
};

function InfinityMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 320" aria-hidden="true" focusable="false" className={className} fill="none">
      <path d="M64 160C112 40 208 40 256 160C304 280 400 280 448 160C400 40 304 40 256 160C208 280 112 280 64 160Z" stroke="currentColor" strokeWidth="32" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export { InfinityMark };

export default function InshutiLogo({
  variant = 'light',
  className = '',
  sizeClassName = '',
  iconOnly = false,
  stacked = false,
  horizontal = false,
}: InshutiLogoProps) {
  const orientation = stacked && !horizontal ? 'inshuti-logo--stacked' : 'inshuti-logo--horizontal';
  if (iconOnly) {
    return <InfinityMark className={`inshuti-logo__mark ${sizeClassName || 'h-5 w-8'} ${className}`.trim()} />;
  }

  return (
    <span className={`inshuti-logo inshuti-logo--${variant} ${orientation} ${className}`.trim()} role="img" aria-label="INSHUTI">
      <InfinityMark className={`inshuti-logo__mark ${sizeClassName || 'h-5 w-8'}`} />
      <span className="inshuti-logo__word">INSHUTI</span>
    </span>
  );
}

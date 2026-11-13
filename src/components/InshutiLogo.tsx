type InshutiLogoProps = {
  variant?: 'light' | 'dark';
  className?: string;
};

export default function InshutiLogo({ variant = 'light', className = '' }: InshutiLogoProps) {
  return (
    <span className={`inshuti-logo inshuti-logo--${variant} ${className}`.trim()} role="img" aria-label="INSHUTI store">
      <span className="inshuti-logo__top">
        <span className="inshuti-logo__word">INSHUTI</span>
      </span>
      <span className="inshuti-logo__signature">st@re</span>
    </span>
  );
}

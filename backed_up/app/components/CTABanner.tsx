import Link from 'next/link';

interface CTABannerProps {
  title: string;
  description: string;
  primaryButton?: {
    text: string;
    href: string;
  };
  secondaryButton?: {
    text: string;
    href: string;
  };
}

export default function CTABanner({
  title,
  description,
  primaryButton,
  secondaryButton,
}: CTABannerProps) {
  return (
    <section className="cta-banner">
      <div className="container">
        <h2>{title}</h2>
        <p>{description}</p>
        <div className="cta-buttons">
          {primaryButton && (
            <Link href={primaryButton.href} className="btn btn-white btn-lg">
              {primaryButton.text}
            </Link>
          )}
          {secondaryButton && (
            <Link
              href={secondaryButton.href}
              className="btn btn-secondary btn-lg"
              style={{ borderColor: 'white', color: 'white' }}
            >
              {secondaryButton.text}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

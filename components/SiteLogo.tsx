import { cn } from 'cn';
import Image from 'next/image';
import Link from 'next/link';

interface SiteLogoProps {
  href: string;
  classNames?: string;
  textClassNames?: string;
  onClick?: () => void;
  imgSrc?: string;
  imgAlt?: string;
  imgHeight?: number;
  imgWidth?: number;
  text?: string;
}

const SiteLogo = ({
  href,
  classNames,
  textClassNames,
  onClick,
  imgSrc = '/assets/images/logo.png',
  imgAlt = 'NexusSupply Logo',
  imgHeight = 30,
  imgWidth = 30,
  text = 'NexusSupply',
}: SiteLogoProps) => {
  return (
    <Link
      href={href}
      className={cn('flex items-center gap-2 text-xl font-bold', classNames)}
      onClick={onClick}
    >
      <Image
        src={imgSrc}
        alt={imgAlt}
        height={imgHeight}
        width={imgWidth}
      />
      <span className={textClassNames}>{text}</span>
    </Link>
  );
};

export default SiteLogo;

import Link from 'next/link';

interface MenuItemProps {
  title: string;
  href: string;
  target?: string;
  rel?: string;
  isLogin?: boolean;
}

export default function MenuItem({ title, href, target, rel, isLogin }: MenuItemProps) {
  return (
    <Link href={href} target={target} rel={rel} passHref>
      <span
        className={`font-bold text-xl border-x-4 border-transparent px-5 py-2 transition-all duration-300 ease-in-out hover:scale-110
          ${!isLogin ? 'hover:border-[var(--text-header)]' : ''}`}
      >
        {title}
      </span>
    </Link>
  );
}
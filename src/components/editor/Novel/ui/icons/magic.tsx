import { cn } from '@/lib/utils';

interface MagicProps {
  className?: string;
}

export default function Magic({ className }: MagicProps) {
  return (
    <svg
      className={cn('w-5 h-5', className)}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4 12L8.5 7.5L13 12L8.5 16.5L4 12Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M12 2L15.09 8.26L22 9L17 14L18 21L12 18L6 21L7 14L2 9L8.91 8.26L12 2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M19 4V2M19 8V6M21 6H19H17"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

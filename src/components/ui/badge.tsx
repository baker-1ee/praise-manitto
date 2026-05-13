import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-[0.125px] transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-[#f0ebff] text-[#7c3aed] border border-[#7c3aed]/15',
        secondary: 'bg-[rgba(124,58,237,0.06)] text-[#5b5080] border border-[rgba(124,58,237,0.12)]',
        destructive: 'bg-destructive/10 text-destructive border border-destructive/20',
        outline: 'text-foreground border border-[rgba(124,58,237,0.15)]',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }

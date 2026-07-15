import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary-500 text-white',
        secondary: 'border-transparent bg-white/20 text-white',
        destructive: 'border-transparent bg-red-500 text-white',
        outline: 'text-white border-white/30',
        gold: 'border-transparent bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        green: 'border-transparent bg-green-500/20 text-green-400 border-green-500/30',
        blue: 'border-transparent bg-blue-500/20 text-blue-400 border-blue-500/30',
        new: 'border-transparent bg-primary-500 text-white font-bold',
        hd: 'border-transparent bg-blue-600 text-white font-bold',
        '4k': 'border-transparent bg-purple-600 text-white font-bold',
        live: 'border-transparent bg-red-500 text-white font-bold animate-pulse',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }

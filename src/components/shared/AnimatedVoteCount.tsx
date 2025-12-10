import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';

interface AnimatedVoteCountProps {
  value: number;
  duration?: number;
  className?: string;
  suffix?: string;
}

export function AnimatedVoteCount({ 
  value, 
  duration = 1500, 
  className = '',
  suffix = ''
}: AnimatedVoteCountProps) {
  const animatedValue = useAnimatedCounter(value, duration);
  
  return (
    <span className={className}>
      {animatedValue.toLocaleString()}{suffix}
    </span>
  );
}

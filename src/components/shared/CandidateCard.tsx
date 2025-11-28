import { Candidate } from '@/types/election';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface CandidateCardProps {
  candidate: Candidate;
  isSelected?: boolean;
  onSelect?: (candidate: Candidate) => void;
  showVotes?: boolean;
  totalVotes?: number;
  disabled?: boolean;
}

export function CandidateCard({ 
  candidate, 
  isSelected, 
  onSelect, 
  showVotes = false, 
  totalVotes = 0,
  disabled = false 
}: CandidateCardProps) {
  const votePercentage = totalVotes > 0 ? (candidate.voteCount / totalVotes) * 100 : 0;

  return (
    <div
      className={cn(
        'relative rounded-xl border p-6 transition-all duration-200',
        'bg-card hover:shadow-lg',
        isSelected && 'border-primary ring-2 ring-primary/20',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      {isSelected && (
        <div className="absolute top-3 right-3 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
          <svg className="h-4 w-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}

      <div className="flex items-start gap-4">
        <Avatar className="h-16 w-16 border-2 border-border">
          <AvatarImage src={candidate.photo} alt={candidate.name} />
          <AvatarFallback className="text-lg">{candidate.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg">{candidate.name}</h3>
          <p className="text-sm text-primary">{candidate.party}</p>
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{candidate.bio}</p>
        </div>
      </div>

      {showVotes && (
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Votes</span>
            <span className="font-medium">{candidate.voteCount.toLocaleString()} ({votePercentage.toFixed(1)}%)</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
              style={{ width: `${votePercentage}%` }}
            />
          </div>
        </div>
      )}

      {onSelect && !disabled && (
        <Button
          className="w-full mt-4"
          variant={isSelected ? 'default' : 'outline'}
          onClick={() => onSelect(candidate)}
        >
          {isSelected ? 'Selected' : 'Select Candidate'}
        </Button>
      )}
    </div>
  );
}

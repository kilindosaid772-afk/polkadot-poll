import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { mockElections } from '@/lib/mock-data';
import { Link } from 'react-router-dom';
import { Calendar, Users, Vote, Clock, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

const statusConfig = {
  upcoming: { label: 'Upcoming', variant: 'secondary' as const, color: 'bg-warning/10 text-warning border-warning/20' },
  active: { label: 'Active', variant: 'default' as const, color: 'bg-success/10 text-success border-success/20' },
  completed: { label: 'Completed', variant: 'outline' as const, color: 'bg-muted text-muted-foreground border-border' },
};

export default function Elections() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        <section className="py-12 md:py-20">
          <div className="container">
            <div className="max-w-2xl mb-12">
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                <span className="gradient-text">Active Elections</span>
              </h1>
              <p className="text-lg text-muted-foreground">
                Browse current and upcoming elections. Your vote matters – participate in shaping the future.
              </p>
            </div>

            <div className="grid gap-6">
              {mockElections.map((election) => {
                const config = statusConfig[election.status];
                
                return (
                  <div 
                    key={election.id}
                    className="rounded-xl border border-border bg-card p-6 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      <div className="flex-1 space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <Vote className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <h2 className="text-xl font-semibold">{election.title}</h2>
                              <Badge className={config.color}>{config.label}</Badge>
                            </div>
                            <p className="text-muted-foreground">{election.description}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-6 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {format(new Date(election.startDate), 'MMM d, yyyy')} - {format(new Date(election.endDate), 'MMM d, yyyy')}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Users className="h-4 w-4" />
                            <span>{election.candidates.length} candidates</span>
                          </div>
                          {election.totalVotes > 0 && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Vote className="h-4 w-4" />
                              <span>{election.totalVotes.toLocaleString()} votes cast</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3">
                        {election.status === 'active' && (
                          <Button asChild>
                            <Link to={`/vote/${election.id}`}>
                              Cast Your Vote
                              <ChevronRight className="h-4 w-4 ml-1" />
                            </Link>
                          </Button>
                        )}
                        {election.status === 'completed' && (
                          <Button variant="outline" asChild>
                            <Link to={`/results/${election.id}`}>
                              View Results
                              <ChevronRight className="h-4 w-4 ml-1" />
                            </Link>
                          </Button>
                        )}
                        {election.status === 'upcoming' && (
                          <Button variant="secondary" disabled>
                            <Clock className="h-4 w-4 mr-2" />
                            Coming Soon
                          </Button>
                        )}
                        <Button variant="ghost" asChild>
                          <Link to={`/election/${election.id}`}>
                            Learn More
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

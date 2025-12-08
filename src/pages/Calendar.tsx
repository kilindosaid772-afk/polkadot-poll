import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useElections } from '@/hooks/useElections';
import { Calendar as CalendarIcon, Clock, Vote, ChevronRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { differenceInDays, differenceInHours, differenceInMinutes, differenceInSeconds, parseISO, format, isBefore, isAfter } from 'date-fns';

interface CountdownProps {
  targetDate: string;
  label: string;
}

function Countdown({ targetDate, label }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const target = parseISO(targetDate);
      const now = new Date();
      
      if (isBefore(target, now)) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      const days = differenceInDays(target, now);
      const hours = differenceInHours(target, now) % 24;
      const minutes = differenceInMinutes(target, now) % 60;
      const seconds = differenceInSeconds(target, now) % 60;

      return { days, hours, minutes, seconds };
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  const isZero = timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0;

  if (isZero) {
    return null;
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="grid grid-cols-4 gap-2">
        <div className="rounded-lg bg-primary/10 border border-primary/20 p-2 text-center">
          <div className="text-2xl font-bold text-primary">{timeLeft.days}</div>
          <div className="text-xs text-muted-foreground">Days</div>
        </div>
        <div className="rounded-lg bg-primary/10 border border-primary/20 p-2 text-center">
          <div className="text-2xl font-bold text-primary">{timeLeft.hours}</div>
          <div className="text-xs text-muted-foreground">Hours</div>
        </div>
        <div className="rounded-lg bg-primary/10 border border-primary/20 p-2 text-center">
          <div className="text-2xl font-bold text-primary">{timeLeft.minutes}</div>
          <div className="text-xs text-muted-foreground">Min</div>
        </div>
        <div className="rounded-lg bg-primary/10 border border-primary/20 p-2 text-center">
          <div className="text-2xl font-bold text-primary animate-pulse">{timeLeft.seconds}</div>
          <div className="text-xs text-muted-foreground">Sec</div>
        </div>
      </div>
    </div>
  );
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'active':
      return <Badge className="bg-success/10 text-success border-success/20">Active</Badge>;
    case 'upcoming':
      return <Badge className="bg-primary/10 text-primary border-primary/20">Upcoming</Badge>;
    case 'completed':
      return <Badge className="bg-muted text-muted-foreground">Completed</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default function Calendar() {
  const navigate = useNavigate();
  const { data: elections, isLoading } = useElections();

  const sortedElections = elections?.slice().sort((a, b) => {
    // Active first, then upcoming by start date, then completed
    if (a.status === 'active' && b.status !== 'active') return -1;
    if (a.status !== 'active' && b.status === 'active') return 1;
    if (a.status === 'upcoming' && b.status === 'completed') return -1;
    if (a.status === 'completed' && b.status === 'upcoming') return 1;
    return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
  });

  const upcomingElections = sortedElections?.filter(e => e.status === 'upcoming') || [];
  const activeElections = sortedElections?.filter(e => e.status === 'active') || [];
  const completedElections = sortedElections?.filter(e => e.status === 'completed') || [];

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-12">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <CalendarIcon className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h1 className="text-4xl font-bold mb-4">Election Calendar</h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                View all upcoming, active, and past elections with live countdown timers
              </p>
            </div>

            {/* Active Elections */}
            {activeElections.length > 0 && (
              <section className="mb-12">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                  Active Elections
                </h2>
                <div className="space-y-4">
                  {activeElections.map((election) => (
                    <Card key={election.id} className="border-success/20 bg-success/5">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-xl">{election.title}</CardTitle>
                            <CardDescription className="mt-1">
                              {election.description}
                            </CardDescription>
                          </div>
                          {getStatusBadge(election.status)}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <Countdown targetDate={election.end_date} label="Voting ends in:" />
                          
                          <div className="flex items-center gap-6 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              Ends: {format(parseISO(election.end_date), 'PPP p')}
                            </div>
                            <div className="flex items-center gap-2">
                              <Vote className="h-4 w-4" />
                              {election.total_votes} votes cast
                            </div>
                          </div>

                          <Button onClick={() => navigate(`/vote/${election.id}`)} className="w-full">
                            Vote Now
                            <ChevronRight className="h-4 w-4 ml-2" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* Upcoming Elections */}
            {upcomingElections.length > 0 && (
              <section className="mb-12">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-primary" />
                  Upcoming Elections
                </h2>
                <div className="space-y-4">
                  {upcomingElections.map((election) => (
                    <Card key={election.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-xl">{election.title}</CardTitle>
                            <CardDescription className="mt-1">
                              {election.description}
                            </CardDescription>
                          </div>
                          {getStatusBadge(election.status)}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <Countdown targetDate={election.start_date} label="Voting starts in:" />
                          
                          <div className="flex items-center gap-6 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <CalendarIcon className="h-4 w-4" />
                              Starts: {format(parseISO(election.start_date), 'PPP p')}
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              Ends: {format(parseISO(election.end_date), 'PPP p')}
                            </div>
                          </div>

                          <Button 
                            variant="outline" 
                            onClick={() => navigate('/elections')} 
                            className="w-full"
                          >
                            View Details
                            <ChevronRight className="h-4 w-4 ml-2" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* Completed Elections */}
            {completedElections.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Vote className="h-5 w-5 text-muted-foreground" />
                  Past Elections
                </h2>
                <div className="space-y-4">
                  {completedElections.map((election) => (
                    <Card key={election.id} className="opacity-80">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{election.title}</CardTitle>
                            <CardDescription className="mt-1">
                              {election.description}
                            </CardDescription>
                          </div>
                          {getStatusBadge(election.status)}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-6 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <CalendarIcon className="h-4 w-4" />
                              Ended: {format(parseISO(election.end_date), 'PPP')}
                            </div>
                            <div className="flex items-center gap-2">
                              <Vote className="h-4 w-4" />
                              {election.total_votes} total votes
                            </div>
                          </div>

                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => navigate(`/results/${election.id}`)}
                          >
                            View Results
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* Empty State */}
            {!elections || elections.length === 0 ? (
              <div className="text-center py-16">
                <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                  <CalendarIcon className="h-8 w-8 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-semibold mb-2">No Elections Scheduled</h2>
                <p className="text-muted-foreground">
                  Check back later for upcoming elections
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

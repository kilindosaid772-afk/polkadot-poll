import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { BlockchainStatus } from '@/components/shared/BlockchainStatus';
import { 
  Vote, Shield, Eye, Lock, Users, BarChart3, 
  ChevronRight, Zap, Globe, CheckCircle2 
} from 'lucide-react';

const features = [
  {
    icon: Shield,
    title: 'Tamper-Proof',
    description: 'Votes are immutably stored on the blockchain, making manipulation impossible.',
  },
  {
    icon: Eye,
    title: 'Transparent',
    description: 'All transactions are publicly verifiable while maintaining voter privacy.',
  },
  {
    icon: Lock,
    title: 'Secure',
    description: 'Military-grade encryption and multi-factor authentication protect every vote.',
  },
  {
    icon: Zap,
    title: 'Real-Time',
    description: 'Instant vote confirmation and live results as votes are counted.',
  },
  {
    icon: Globe,
    title: 'Accessible',
    description: 'Vote from anywhere via web, SMS, or USSD - no barriers to participation.',
  },
  {
    icon: CheckCircle2,
    title: 'Verifiable',
    description: 'Every voter can verify their vote was counted correctly on the blockchain.',
  },
];

const stats = [
  { value: '25,847', label: 'Registered Voters' },
  { value: '13,804', label: 'Votes Cast' },
  { value: '99.99%', label: 'Uptime' },
  { value: '0', label: 'Security Breaches' },
];

export default function Index() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 lg:py-32">
          {/* Background Effects */}
          <div className="absolute inset-0 bg-grid-pattern bg-[size:40px_40px] opacity-20" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-3xl" />
          
          <div className="container relative">
            <div className="max-w-3xl mx-auto text-center space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                </span>
                Powered by Polkadot Blockchain
              </div>
              
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight">
                <span className="gradient-text">Secure Elections</span>
                <br />
                <span className="text-foreground">for the Digital Age</span>
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                Experience democracy reimagined with blockchain technology. 
                Every vote is transparent, verifiable, and impossible to tamper with.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="xl" variant="gradient" asChild>
                  <Link to="/register">
                    <Vote className="h-5 w-5 mr-2" />
                    Register to Vote
                  </Link>
                </Button>
                <Button size="xl" variant="outline" asChild>
                  <Link to="/elections">
                    View Elections
                    <ChevronRight className="h-5 w-5 ml-2" />
                  </Link>
                </Button>
              </div>
              
              <div className="pt-8">
                <BlockchainStatus />
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 border-y border-border/40 bg-card/30">
          <div className="container">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <p className="text-3xl md:text-4xl font-bold gradient-text">{stat.value}</p>
                  <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 lg:py-32">
          <div className="container">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Why Choose <span className="gradient-text">BlockVote</span>?
              </h2>
              <p className="text-muted-foreground">
                Built on cutting-edge blockchain technology to ensure the integrity 
                of every election.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <div 
                  key={index}
                  className="group p-6 rounded-xl border border-border bg-card hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
                >
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 lg:py-32 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10" />
          
          <div className="container relative">
            <div className="max-w-3xl mx-auto text-center space-y-8">
              <h2 className="text-3xl md:text-4xl font-bold">
                Ready to Participate in <span className="gradient-text">Democracy</span>?
              </h2>
              <p className="text-lg text-muted-foreground">
                Join thousands of voters who trust BlockVote for secure, 
                transparent elections.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="gradient" asChild>
                  <Link to="/register">
                    <Users className="h-5 w-5 mr-2" />
                    Register Now
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/verify">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Verify a Vote
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

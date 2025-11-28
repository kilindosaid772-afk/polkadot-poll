import { Activity, Box, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';

export function BlockchainStatus() {
  const [blockHeight, setBlockHeight] = useState(15847350);
  const [lastBlock, setLastBlock] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setBlockHeight(prev => prev + 1);
      setLastBlock(new Date());
    }, 6000); // Simulate block every 6 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-6 text-sm">
      <div className="flex items-center gap-2">
        <div className="relative">
          <Activity className="h-4 w-4 text-success" />
          <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-success animate-pulse" />
        </div>
        <span className="text-muted-foreground">Network:</span>
        <span className="text-success font-medium">Online</span>
      </div>
      
      <div className="flex items-center gap-2">
        <Box className="h-4 w-4 text-primary" />
        <span className="text-muted-foreground">Block:</span>
        <span className="font-mono text-foreground">{blockHeight.toLocaleString()}</span>
      </div>
      
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <span className="text-muted-foreground">Last:</span>
        <span className="text-foreground">{lastBlock.toLocaleTimeString()}</span>
      </div>
    </div>
  );
}

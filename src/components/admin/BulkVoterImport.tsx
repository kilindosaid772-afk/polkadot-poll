import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, FileText, AlertCircle, CheckCircle, Loader2, Download } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useQueryClient } from '@tanstack/react-query';

interface ParsedVoter {
  name: string;
  email: string;
  national_id: string;
  phone?: string;
}

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

export function BulkVoterImport() {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedVoters, setParsedVoters] = useState<ParsedVoter[]>([]);
  const [fileName, setFileName] = useState('');
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const downloadTemplate = () => {
    const csvContent = 'name,email,national_id,phone\nJohn Doe,john@example.com,NID123456,+1234567890\nJane Smith,jane@example.com,NID789012,+0987654321';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'voter_import_template.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const parseCSV = (content: string): ParsedVoter[] => {
    const lines = content.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
    const nameIndex = headers.indexOf('name');
    const emailIndex = headers.indexOf('email');
    const nationalIdIndex = headers.indexOf('national_id');
    const phoneIndex = headers.indexOf('phone');

    if (nameIndex === -1 || emailIndex === -1 || nationalIdIndex === -1) {
      throw new Error('CSV must have name, email, and national_id columns');
    }

    return lines.slice(1).map((line, index) => {
      const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      
      if (!values[nameIndex] || !values[emailIndex] || !values[nationalIdIndex]) {
        throw new Error(`Row ${index + 2} has missing required fields`);
      }

      return {
        name: values[nameIndex],
        email: values[emailIndex],
        national_id: values[nationalIdIndex],
        phone: phoneIndex !== -1 ? values[phoneIndex] : undefined,
      };
    }).filter(v => v.name && v.email && v.national_id);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }

    setFileName(file.name);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const voters = parseCSV(content);
        setParsedVoters(voters);
        toast.success(`Parsed ${voters.length} voters from CSV`);
      } catch (error: any) {
        toast.error(error.message || 'Failed to parse CSV file');
        setParsedVoters([]);
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (parsedVoters.length === 0) {
      toast.error('No voters to import');
      return;
    }

    setIsProcessing(true);
    const result: ImportResult = { success: 0, failed: 0, errors: [] };

    for (const voter of parsedVoters) {
      try {
        // Create auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: voter.email,
          password: `temp_${voter.national_id}_${Date.now()}`,
          options: {
            data: {
              name: voter.name,
              national_id: voter.national_id,
              phone: voter.phone || '',
            },
          },
        });

        if (authError) {
          result.failed++;
          result.errors.push(`${voter.email}: ${authError.message}`);
        } else if (authData.user) {
          result.success++;
        }
      } catch (error: any) {
        result.failed++;
        result.errors.push(`${voter.email}: ${error.message}`);
      }
    }

    setImportResult(result);
    setIsProcessing(false);
    
    if (result.success > 0) {
      queryClient.invalidateQueries({ queryKey: ['voters'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      toast.success(`Successfully imported ${result.success} voters`);
    }
    
    if (result.failed > 0) {
      toast.error(`Failed to import ${result.failed} voters`);
    }
  };

  const resetState = () => {
    setParsedVoters([]);
    setFileName('');
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        <Upload className="h-4 w-4 mr-2" />
        Import Voters
      </Button>

      <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetState(); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bulk Voter Import</DialogTitle>
            <DialogDescription>
              Upload a CSV file to import multiple voters at once. Voters will be created with temporary passwords.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={downloadTemplate} size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
            </div>

            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
              <Input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload" className="cursor-pointer">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  {fileName || 'Click to upload CSV file'}
                </p>
              </label>
            </div>

            {parsedVoters.length > 0 && (
              <div className="rounded-lg border border-border bg-muted/50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span className="font-medium">{parsedVoters.length} voters ready to import</span>
                </div>
                <div className="max-h-40 overflow-y-auto text-sm text-muted-foreground">
                  {parsedVoters.slice(0, 5).map((voter, i) => (
                    <div key={i} className="py-1 border-b border-border last:border-0">
                      {voter.name} - {voter.email}
                    </div>
                  ))}
                  {parsedVoters.length > 5 && (
                    <div className="py-1 text-primary">
                      ... and {parsedVoters.length - 5} more
                    </div>
                  )}
                </div>
              </div>
            )}

            {importResult && (
              <div className={`rounded-lg border p-4 ${importResult.failed > 0 ? 'border-warning bg-warning/10' : 'border-success bg-success/10'}`}>
                <div className="flex items-center gap-2 mb-2">
                  {importResult.failed > 0 ? (
                    <AlertCircle className="h-4 w-4 text-warning" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-success" />
                  )}
                  <span className="font-medium">
                    Import complete: {importResult.success} successful, {importResult.failed} failed
                  </span>
                </div>
                {importResult.errors.length > 0 && (
                  <div className="max-h-32 overflow-y-auto text-sm text-muted-foreground">
                    {importResult.errors.map((error, i) => (
                      <div key={i} className="py-1">{error}</div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsOpen(false); resetState(); }}>
              Cancel
            </Button>
            <Button 
              onClick={handleImport} 
              disabled={parsedVoters.length === 0 || isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Import {parsedVoters.length} Voters
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

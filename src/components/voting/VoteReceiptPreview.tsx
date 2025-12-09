import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Eye, X, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { generateVoteReceiptPDF, VoteReceiptData } from '@/lib/pdfUtils';
import { toast } from 'sonner';

interface VoteReceiptPreviewProps {
  data: VoteReceiptData;
  onDownload?: () => void;
}

export function VoteReceiptPreview({ data, onDownload }: VoteReceiptPreviewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const generatePreview = async () => {
    setIsLoading(true);
    try {
      const pdf = generateVoteReceiptPDF(data);
      const blob = pdf.output('blob');
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      setIsOpen(true);
    } catch (error) {
      toast.error('Failed to generate preview');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    const pdf = generateVoteReceiptPDF(data);
    pdf.save(`vote-receipt-${data.txHash.slice(0, 10)}.pdf`);
    toast.success('Vote receipt downloaded');
    onDownload?.();
  };

  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  return (
    <>
      <div className="flex gap-2">
        <Button className="flex-1" variant="outline" onClick={generatePreview} disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Eye className="h-4 w-4 mr-2" />
          )}
          Preview Receipt
        </Button>
        <Button className="flex-1" onClick={handleDownload}>
          <Download className="h-4 w-4 mr-2" />
          Download PDF
        </Button>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              Vote Receipt Preview
              <Button size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 -mx-6 -mb-6">
            {pdfUrl ? (
              <iframe
                src={pdfUrl}
                className="w-full h-full border-0 rounded-b-lg"
                title="Vote Receipt Preview"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

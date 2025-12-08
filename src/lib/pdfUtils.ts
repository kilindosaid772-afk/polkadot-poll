import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

export interface VoteReceiptData {
  voterName: string;
  electionTitle: string;
  candidateName: string;
  candidateParty: string;
  txHash: string;
  blockNumber: number;
  timestamp: Date;
}

export function generateVoteReceiptPDF(data: VoteReceiptData): jsPDF {
  const doc = new jsPDF();
  
  // Header
  doc.setFillColor(139, 92, 246); // Primary purple
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('Vote Receipt', 105, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Blockchain Voting System', 105, 30, { align: 'center' });
  
  // Content
  doc.setTextColor(0, 0, 0);
  
  // Receipt details box
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.roundedRect(15, 50, 180, 120, 3, 3);
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Vote Confirmation', 20, 62);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  
  const lineHeight = 10;
  let y = 75;
  
  // Voter info
  doc.setFont('helvetica', 'bold');
  doc.text('Voter:', 20, y);
  doc.setFont('helvetica', 'normal');
  doc.text(data.voterName, 60, y);
  y += lineHeight;
  
  // Election
  doc.setFont('helvetica', 'bold');
  doc.text('Election:', 20, y);
  doc.setFont('helvetica', 'normal');
  doc.text(data.electionTitle, 60, y);
  y += lineHeight;
  
  // Candidate
  doc.setFont('helvetica', 'bold');
  doc.text('Candidate:', 20, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.candidateName} (${data.candidateParty})`, 60, y);
  y += lineHeight;
  
  // Timestamp
  doc.setFont('helvetica', 'bold');
  doc.text('Date & Time:', 20, y);
  doc.setFont('helvetica', 'normal');
  doc.text(format(data.timestamp, 'PPpp'), 60, y);
  y += lineHeight + 5;
  
  // Blockchain details
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(18, y, 174, 45, 2, 2, 'F');
  y += 12;
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Blockchain Verification Details', 20, y);
  y += 10;
  
  doc.setFont('helvetica', 'normal');
  doc.text('Block Number:', 20, y);
  doc.text(data.blockNumber.toLocaleString(), 60, y);
  y += 8;
  
  doc.text('Transaction Hash:', 20, y);
  doc.setFontSize(7);
  doc.text(data.txHash, 60, y);
  
  // Verification section
  y = 185;
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('This receipt confirms your vote has been securely recorded on the blockchain.', 105, y, { align: 'center' });
  y += 6;
  doc.text('You can verify your vote at any time using the transaction hash above.', 105, y, { align: 'center' });
  
  // Footer
  doc.setFillColor(240, 240, 240);
  doc.rect(0, 270, 210, 30, 'F');
  
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated on ${format(new Date(), 'PPpp')}`, 105, 280, { align: 'center' });
  doc.text('This is an official voting receipt from the Blockchain Voting System', 105, 286, { align: 'center' });
  
  return doc;
}

export interface ElectionResultData {
  electionTitle: string;
  electionDescription: string;
  startDate: string;
  endDate: string;
  status: string;
  totalVotes: number;
  candidates: {
    name: string;
    party: string;
    voteCount: number;
    percentage: number;
  }[];
}

export function generateElectionResultsPDF(data: ElectionResultData): jsPDF {
  const doc = new jsPDF();
  
  // Header
  doc.setFillColor(139, 92, 246);
  doc.rect(0, 0, 210, 35, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('Election Results Report', 105, 18, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${format(new Date(), 'PPpp')}`, 105, 28, { align: 'center' });
  
  // Election Info
  doc.setTextColor(0, 0, 0);
  let y = 50;
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(data.electionTitle, 15, y);
  y += 8;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  if (data.electionDescription) {
    doc.text(data.electionDescription, 15, y);
    y += 8;
  }
  
  doc.setTextColor(0, 0, 0);
  doc.text(`Status: ${data.status.charAt(0).toUpperCase() + data.status.slice(1)}`, 15, y);
  y += 6;
  doc.text(`Duration: ${format(new Date(data.startDate), 'PPP')} - ${format(new Date(data.endDate), 'PPP')}`, 15, y);
  y += 6;
  doc.text(`Total Votes Cast: ${data.totalVotes.toLocaleString()}`, 15, y);
  y += 15;
  
  // Results Table
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Candidate Results', 15, y);
  y += 8;
  
  const tableData = data.candidates
    .sort((a, b) => b.voteCount - a.voteCount)
    .map((candidate, index) => [
      (index + 1).toString(),
      candidate.name,
      candidate.party,
      candidate.voteCount.toLocaleString(),
      `${candidate.percentage.toFixed(2)}%`,
    ]);
  
  autoTable(doc, {
    startY: y,
    head: [['Rank', 'Candidate', 'Party', 'Votes', 'Percentage']],
    body: tableData,
    headStyles: {
      fillColor: [139, 92, 246],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250],
    },
    styles: {
      fontSize: 10,
      cellPadding: 5,
    },
    columnStyles: {
      0: { cellWidth: 15, halign: 'center' },
      3: { halign: 'right' },
      4: { halign: 'right' },
    },
  });
  
  // Winner highlight
  if (data.candidates.length > 0 && data.status === 'completed') {
    const winner = data.candidates.sort((a, b) => b.voteCount - a.voteCount)[0];
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    
    doc.setFillColor(236, 253, 245);
    doc.roundedRect(15, finalY, 180, 25, 3, 3, 'F');
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(22, 163, 74);
    doc.text('Winner', 25, finalY + 10);
    doc.setTextColor(0, 0, 0);
    doc.text(`${winner.name} (${winner.party})`, 25, finalY + 18);
    doc.text(`${winner.voteCount.toLocaleString()} votes (${winner.percentage.toFixed(2)}%)`, 120, finalY + 14);
  }
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('This is an official election results report from the Blockchain Voting System', 105, 285, { align: 'center' });
  
  return doc;
}

export function generateElectionResultsCSV(data: ElectionResultData): string {
  const headers = ['Rank', 'Candidate', 'Party', 'Votes', 'Percentage'];
  
  const sortedCandidates = [...data.candidates].sort((a, b) => b.voteCount - a.voteCount);
  
  const rows = sortedCandidates.map((candidate, index) => [
    index + 1,
    `"${candidate.name}"`,
    `"${candidate.party}"`,
    candidate.voteCount,
    `${candidate.percentage.toFixed(2)}%`,
  ]);
  
  const metaInfo = [
    `"Election: ${data.electionTitle}"`,
    `"Status: ${data.status}"`,
    `"Start Date: ${format(new Date(data.startDate), 'PPP')}"`,
    `"End Date: ${format(new Date(data.endDate), 'PPP')}"`,
    `"Total Votes: ${data.totalVotes}"`,
    '',
  ];
  
  const csvContent = [
    ...metaInfo,
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n');
  
  return csvContent;
}

export function downloadCSV(csvContent: string, filename: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

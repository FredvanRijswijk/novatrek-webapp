import { Trip, Activity, DayItinerary } from '@/types/travel';
import { ChatMemory } from '@/lib/models/chat-memory';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export interface ExportOptions {
  includeActivities?: boolean;
  includeMemories?: boolean;
  includeBudget?: boolean;
  includePackingList?: boolean;
  includeWeather?: boolean;
  format: 'pdf' | 'markdown' | 'json';
}

export class ExportService {
  /**
   * Export trip data in various formats
   */
  static async exportTrip(
    trip: Trip, 
    memories: ChatMemory[] = [],
    options: ExportOptions
  ): Promise<Blob> {
    switch (options.format) {
      case 'pdf':
        return this.generatePDF(trip, memories, options);
      case 'markdown':
        return this.generateMarkdown(trip, memories, options);
      case 'json':
        return this.generateJSON(trip, memories, options);
      default:
        throw new Error('Unsupported export format');
    }
  }

  /**
   * Generate PDF export
   */
  private static async generatePDF(
    trip: Trip,
    memories: ChatMemory[],
    options: ExportOptions
  ): Promise<Blob> {
    const pdf = new jsPDF();
    let yPosition = 20;
    const pageHeight = pdf.internal.pageSize.height;
    const lineHeight = 7;
    const margin = 20;

    // Helper function to add new page if needed
    const checkNewPage = (requiredSpace: number = 30) => {
      if (yPosition + requiredSpace > pageHeight - margin) {
        pdf.addPage();
        yPosition = 20;
      }
    };

    // Title
    pdf.setFontSize(24);
    pdf.text(trip.title || 'Trip Itinerary', margin, yPosition);
    yPosition += 15;

    // Destination and dates
    pdf.setFontSize(12);
    const destination = this.getDestinationName(trip);
    const dates = `${format(trip.startDate, 'MMM d')} - ${format(trip.endDate, 'MMM d, yyyy')}`;
    pdf.text(`${destination} | ${dates}`, margin, yPosition);
    yPosition += 10;

    // Travelers
    pdf.setFontSize(10);
    pdf.text(`Travelers: ${trip.travelers.map(t => t.name).join(', ')}`, margin, yPosition);
    yPosition += 15;

    // Activities by day
    if (options.includeActivities && trip.itinerary) {
      pdf.setFontSize(16);
      pdf.text('Daily Itinerary', margin, yPosition);
      yPosition += 10;

      trip.itinerary.forEach((day: DayItinerary) => {
        checkNewPage(50);
        
        // Day header
        pdf.setFontSize(14);
        pdf.setFont(undefined, 'bold');
        pdf.text(`Day ${day.dayNumber} - ${format(day.date, 'EEEE, MMM d')}`, margin, yPosition);
        pdf.setFont(undefined, 'normal');
        yPosition += 8;

        // Activities
        if (day.activities && day.activities.length > 0) {
          pdf.setFontSize(10);
          day.activities.forEach((activity: Activity) => {
            checkNewPage(20);
            
            const time = activity.startTime || 'All day';
            const duration = activity.duration ? `(${activity.duration} min)` : '';
            pdf.text(`• ${time} - ${activity.name} ${duration}`, margin + 5, yPosition);
            yPosition += lineHeight;
            
            if (activity.location?.address) {
              pdf.setFontSize(9);
              pdf.text(`  ${activity.location.address}`, margin + 10, yPosition);
              yPosition += lineHeight;
              pdf.setFontSize(10);
            }
          });
        } else {
          pdf.text('No activities planned', margin + 5, yPosition);
          yPosition += lineHeight;
        }
        
        yPosition += 5;
      });
    }

    // Budget breakdown
    if (options.includeBudget && trip.budget) {
      checkNewPage(60);
      yPosition += 10;
      
      pdf.setFontSize(16);
      pdf.text('Budget', margin, yPosition);
      yPosition += 10;
      
      pdf.setFontSize(10);
      pdf.text(`Total Budget: ${trip.budget.currency} ${trip.budget.total}`, margin, yPosition);
      yPosition += lineHeight;
      
      if (trip.budget.breakdown) {
        Object.entries(trip.budget.breakdown).forEach(([category, amount]) => {
          pdf.text(`${category}: ${trip.budget!.currency} ${amount}`, margin + 5, yPosition);
          yPosition += lineHeight;
        });
      }
    }

    // Saved memories
    if (options.includeMemories && memories.length > 0) {
      checkNewPage(40);
      yPosition += 10;
      
      pdf.setFontSize(16);
      pdf.text('Saved Memories', margin, yPosition);
      yPosition += 10;
      
      memories.forEach((memory) => {
        checkNewPage(30);
        
        pdf.setFontSize(11);
        pdf.setFont(undefined, 'bold');
        pdf.text(`• ${memory.title}`, margin, yPosition);
        pdf.setFont(undefined, 'normal');
        yPosition += lineHeight;
        
        pdf.setFontSize(9);
        // Split long content into lines
        const lines = pdf.splitTextToSize(memory.content, 170);
        lines.forEach((line: string) => {
          checkNewPage(lineHeight);
          pdf.text(line, margin + 5, yPosition);
          yPosition += lineHeight;
        });
        
        yPosition += 3;
      });
    }

    return pdf.output('blob');
  }

  /**
   * Generate Markdown export
   */
  private static generateMarkdown(
    trip: Trip,
    memories: ChatMemory[],
    options: ExportOptions
  ): Blob {
    let markdown = '';

    // Header
    markdown += `# ${trip.title || 'Trip Itinerary'}\n\n`;
    markdown += `**Destination:** ${this.getDestinationName(trip)}\n`;
    markdown += `**Dates:** ${format(trip.startDate, 'MMM d')} - ${format(trip.endDate, 'MMM d, yyyy')}\n`;
    markdown += `**Travelers:** ${trip.travelers.map(t => t.name).join(', ')}\n\n`;

    // Daily itinerary
    if (options.includeActivities && trip.itinerary) {
      markdown += '## Daily Itinerary\n\n';
      
      trip.itinerary.forEach((day: DayItinerary) => {
        markdown += `### Day ${day.dayNumber} - ${format(day.date, 'EEEE, MMM d')}\n\n`;
        
        if (day.activities && day.activities.length > 0) {
          day.activities.forEach((activity: Activity) => {
            const time = activity.startTime || 'All day';
            const duration = activity.duration ? ` (${activity.duration} min)` : '';
            markdown += `- **${time}** - ${activity.name}${duration}\n`;
            
            if (activity.location?.address) {
              markdown += `  - 📍 ${activity.location.address}\n`;
            }
            
            if (activity.description) {
              markdown += `  - ${activity.description}\n`;
            }
            
            if (activity.cost) {
              markdown += `  - 💰 ${activity.cost.currency} ${activity.cost.amount}${activity.cost.perPerson ? ' per person' : ''}\n`;
            }
            
            markdown += '\n';
          });
        } else {
          markdown += '*No activities planned*\n\n';
        }
      });
    }

    // Budget
    if (options.includeBudget && trip.budget) {
      markdown += '## Budget\n\n';
      markdown += `**Total Budget:** ${trip.budget.currency} ${trip.budget.total}\n\n`;
      
      if (trip.budget.breakdown) {
        markdown += '### Breakdown\n';
        Object.entries(trip.budget.breakdown).forEach(([category, amount]) => {
          markdown += `- **${category}:** ${trip.budget!.currency} ${amount}\n`;
        });
        markdown += '\n';
      }
    }

    // Memories
    if (options.includeMemories && memories.length > 0) {
      markdown += '## Saved Memories\n\n';
      
      const memoryTypes = ['recommendation', 'tip', 'place', 'booking', 'note'];
      memoryTypes.forEach(type => {
        const typeMemories = memories.filter(m => m.type === type);
        if (typeMemories.length > 0) {
          markdown += `### ${type.charAt(0).toUpperCase() + type.slice(1)}s\n\n`;
          
          typeMemories.forEach(memory => {
            markdown += `**${memory.title}**\n`;
            markdown += `${memory.content}\n`;
            if (memory.metadata.day) {
              markdown += `*Day ${memory.metadata.day}*\n`;
            }
            markdown += '\n';
          });
        }
      });
    }

    // Footer
    markdown += '---\n\n';
    markdown += `*Generated on ${format(new Date(), 'PPP')} with NovaTrek*\n`;

    return new Blob([markdown], { type: 'text/markdown' });
  }

  /**
   * Generate JSON export
   */
  private static generateJSON(
    trip: Trip,
    memories: ChatMemory[],
    options: ExportOptions
  ): Blob {
    const exportData: any = {
      metadata: {
        exportDate: new Date().toISOString(),
        version: '1.0',
        source: 'NovaTrek'
      },
      trip: {
        id: trip.id,
        title: trip.title,
        destination: this.getDestinationName(trip),
        startDate: trip.startDate,
        endDate: trip.endDate,
        travelers: trip.travelers
      }
    };

    if (options.includeActivities) {
      exportData.itinerary = trip.itinerary;
    }

    if (options.includeBudget) {
      exportData.budget = trip.budget;
    }

    if (options.includeMemories) {
      exportData.memories = memories;
    }

    const json = JSON.stringify(exportData, null, 2);
    return new Blob([json], { type: 'application/json' });
  }

  /**
   * Helper to get destination name
   */
  private static getDestinationName(trip: Trip): string {
    if (trip.destinations && trip.destinations.length > 0) {
      return trip.destinations.map(d => d.destination?.name).filter(Boolean).join(', ');
    }
    return trip.destination?.name || 'Unknown Destination';
  }

  /**
   * Export chat conversation as PDF
   */
  static async exportChatAsPDF(chatElement: HTMLElement, tripTitle: string): Promise<Blob> {
    const canvas = await html2canvas(chatElement, {
      scale: 2,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF();
    
    const imgWidth = 210;
    const pageHeight = 295;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    let position = 0;

    pdf.setFontSize(16);
    pdf.text(`${tripTitle} - Chat History`, 20, 20);
    position = 30;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    return pdf.output('blob');
  }
}
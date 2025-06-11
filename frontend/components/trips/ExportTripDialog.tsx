'use client';

import { useState } from 'react';
import { 
  Download, 
  FileText, 
  FileCode, 
  File,
  Calendar,
  Bookmark,
  DollarSign,
  Package,
  Cloud
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ExportService, ExportOptions } from '@/lib/services/export-service';
import { Trip } from '@/types/travel';
import { ChatMemory, ChatMemoryModel } from '@/lib/models/chat-memory';

interface ExportTripDialogProps {
  trip: Trip;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExportTripDialog({ trip, open, onOpenChange }: ExportTripDialogProps) {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    includeActivities: true,
    includeMemories: true,
    includeBudget: true,
    includePackingList: false,
    includeWeather: false,
    format: 'pdf'
  });
  const [exporting, setExporting] = useState(false);

  const formatConfig = {
    pdf: { 
      icon: File, 
      label: 'PDF Document', 
      description: 'Best for printing and sharing',
      color: 'text-red-500'
    },
    markdown: { 
      icon: FileText, 
      label: 'Markdown', 
      description: 'Plain text format for notes apps',
      color: 'text-blue-500'
    },
    json: { 
      icon: FileCode, 
      label: 'JSON', 
      description: 'Machine-readable for backup',
      color: 'text-green-500'
    }
  };

  const handleExport = async () => {
    setExporting(true);
    
    try {
      // Load memories if needed
      let memories: ChatMemory[] = [];
      if (exportOptions.includeMemories) {
        memories = await ChatMemoryModel.getTripMemories(trip.id);
      }

      // Generate export
      const blob = await ExportService.exportTrip(trip, memories, exportOptions);
      
      // Create download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Set filename based on format
      const date = new Date().toISOString().split('T')[0];
      const extension = exportOptions.format === 'pdf' ? 'pdf' : 
                       exportOptions.format === 'markdown' ? 'md' : 'json';
      a.download = `${trip.title || 'trip'}-${date}.${extension}`;
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Trip exported successfully!');
      onOpenChange(false);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export trip. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Export Trip</DialogTitle>
          <DialogDescription>
            Choose what to include in your trip export
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Export Format</Label>
            <RadioGroup
              value={exportOptions.format}
              onValueChange={(value) => setExportOptions(prev => ({ 
                ...prev, 
                format: value as 'pdf' | 'markdown' | 'json' 
              }))}
            >
              {Object.entries(formatConfig).map(([format, config]) => {
                const Icon = config.icon;
                return (
                  <div key={format} className="flex items-center space-x-3">
                    <RadioGroupItem value={format} id={format} />
                    <Label 
                      htmlFor={format} 
                      className="flex items-center gap-3 cursor-pointer flex-1"
                    >
                      <Icon className={`h-5 w-5 ${config.color}`} />
                      <div className="flex-1">
                        <div className="font-medium">{config.label}</div>
                        <div className="text-sm text-muted-foreground">
                          {config.description}
                        </div>
                      </div>
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>
          </div>

          {/* Content Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Include in Export</Label>
            <div className="space-y-3">
              {/* Activities */}
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="activities"
                  checked={exportOptions.includeActivities}
                  onCheckedChange={(checked) => 
                    setExportOptions(prev => ({ ...prev, includeActivities: !!checked }))
                  }
                />
                <Label
                  htmlFor="activities"
                  className="flex items-center gap-2 cursor-pointer flex-1"
                >
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Daily activities and itinerary</span>
                </Label>
              </div>

              {/* Memories */}
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="memories"
                  checked={exportOptions.includeMemories}
                  onCheckedChange={(checked) => 
                    setExportOptions(prev => ({ ...prev, includeMemories: !!checked }))
                  }
                />
                <Label
                  htmlFor="memories"
                  className="flex items-center gap-2 cursor-pointer flex-1"
                >
                  <Bookmark className="h-4 w-4 text-muted-foreground" />
                  <span>Saved memories and recommendations</span>
                </Label>
              </div>

              {/* Budget */}
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="budget"
                  checked={exportOptions.includeBudget}
                  onCheckedChange={(checked) => 
                    setExportOptions(prev => ({ ...prev, includeBudget: !!checked }))
                  }
                />
                <Label
                  htmlFor="budget"
                  className="flex items-center gap-2 cursor-pointer flex-1"
                >
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span>Budget breakdown</span>
                </Label>
              </div>

              {/* Coming Soon Items */}
              <div className="opacity-50">
                <div className="flex items-center space-x-3">
                  <Checkbox id="packing" disabled />
                  <Label
                    htmlFor="packing"
                    className="flex items-center gap-2 cursor-not-allowed flex-1"
                  >
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span>Packing checklist (coming soon)</span>
                  </Label>
                </div>
              </div>

              <div className="opacity-50">
                <div className="flex items-center space-x-3">
                  <Checkbox id="weather" disabled />
                  <Label
                    htmlFor="weather"
                    className="flex items-center gap-2 cursor-not-allowed flex-1"
                  >
                    <Cloud className="h-4 w-4 text-muted-foreground" />
                    <span>Weather forecast (coming soon)</span>
                  </Label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleExport} 
            disabled={exporting || (!exportOptions.includeActivities && !exportOptions.includeMemories && !exportOptions.includeBudget)}
          >
            {exporting ? (
              <>
                <Download className="mr-2 h-4 w-4 animate-pulse" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
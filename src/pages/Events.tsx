import { useMemo, useState } from 'react';
import { CalendarDays, Edit, Eye, Printer, Trash2, Share2 } from 'lucide-react';
import { EventFilterBar } from '@/components/events/EventFilterBar';
import { EventFormDialog } from '@/components/events/EventFormDialog';
import { EventPrintDialog } from '@/components/events/EventPrintDialog';
import { EventShareDialog } from '@/components/events/EventShareDialog';
import { DeleteConfirmationDialog } from '@/components/shared/DeleteConfirmationDialog';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useEvents, useDeleteEvent } from '@/hooks/events/useEvents';
import type { EventActivityFilters, EventActivityWithRelations } from '@/types/events';

export function Events() {
  const [filters, setFilters] = useState<EventActivityFilters & { date_filter?: any }>({});
  const sortKey: 'start_time' | 'title' | 'created_at' | 'updated_at' = 'start_time';
  const sortDirection: 'asc' | 'desc' = 'desc';

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [selected, setSelected] = useState<EventActivityWithRelations | null>(null);
  const [selectedForPrint, setSelectedForPrint] = useState<EventActivityWithRelations[]>([]);

  const eventsQuery = useEvents(filters, { field: sortKey, direction: sortDirection });
  const deleteEvent = useDeleteEvent();

  const data = useMemo(() => {
    return [...(eventsQuery.data || [])];
  }, [eventsQuery.data]);

  const toggleSelectForPrint = (evt: EventActivityWithRelations) => {
    const exists = selectedForPrint.some((e) => e.id === evt.id);
    setSelectedForPrint((prev) => exists ? prev.filter((e) => e.id !== evt.id) : [...prev, evt]);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <CalendarDays className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Events and Activities</h1>
      </div>

      <EventFilterBar
        filters={filters}
        onFiltersChange={setFilters}
        showAddButton
        onAddClick={() => setIsAddOpen(true)}
      />

      <div className="rounded-lg border bg-card">
        <div className="flex justify-between items-center p-3">
          <div className="text-sm text-muted-foreground">Total: {data.length}</div>
          <div className="flex gap-2">
            <Button variant="outline" disabled={selectedForPrint.length === 0} onClick={() => setIsPrintOpen(true)}>
              <Printer className="h-4 w-4 mr-2" /> Print Selected ({selectedForPrint.length})
            </Button>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Start</TableHead>
              <TableHead>End</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((evt) => {
              const start = evt.start_time ? new Date(evt.start_time) : null;
              const end = evt.end_time ? new Date(evt.end_time) : null;
              return (
                <TableRow key={evt.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" className="h-4 w-4" checked={selectedForPrint.some((e) => e.id === evt.id)} onChange={() => toggleSelectForPrint(evt)} />
                      <div className="font-medium truncate max-w-[220px]">{evt.title}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">{evt.type}</Badge>
                  </TableCell>
                  <TableCell>{start ? start.toLocaleString() : '-'}</TableCell>
                  <TableCell>{end ? end.toLocaleString() : '-'}</TableCell>
                  <TableCell className="truncate max-w-[180px]">{evt.location || '-'}</TableCell>
                  <TableCell className="truncate max-w-[160px]">{evt.branch_name || '-'}</TableCell>
                  <TableCell>
                    {evt.status === 'upcoming' && <Badge className="bg-blue-600 text-white">Upcoming</Badge>}
                    {evt.status === 'ongoing' && <Badge className="bg-green-600 text-white">Ongoing</Badge>}
                    {evt.status === 'past' && <Badge className="bg-gray-600 text-white">Past</Badge>}
                  </TableCell>
                  <TableCell>{evt.is_active ? 'Yes' : 'No'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => { setSelected(evt); setIsViewOpen(true); }}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => { setSelected(evt); setIsEditOpen(true); }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => { setSelected(evt); setIsShareOpen(true); }}>
                        <Share2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => { setSelected(evt); setIsDeleteOpen(true); }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {data.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground py-10">No events or activities found</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <EventFormDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        mode="add"
        title="Add Event/Activity"
        onSuccess={() => setIsAddOpen(false)}
      />

      <EventFormDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        mode="edit"
        title="Edit Event/Activity"
        initialData={selected || undefined}
        onSuccess={() => setIsEditOpen(false)}
      />

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-[620px]">
          <DialogHeader>
            <DialogTitle>{selected?.title}</DialogTitle>
            <DialogDescription className="capitalize">{selected?.type}{selected?.category ? ` • ${selected.category}` : ''}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <div><span className="font-medium">Start:</span> {selected?.start_time ? new Date(selected.start_time).toLocaleString() : '-'}</div>
            <div><span className="font-medium">End:</span> {selected?.end_time ? new Date(selected.end_time).toLocaleString() : '-'}</div>
            <div><span className="font-medium">Location:</span> {selected?.location || '-'}</div>
            {selected?.branch_name && (<div><span className="font-medium">Branch:</span> {selected.branch_name}</div>)}
            <div className="pt-2 whitespace-pre-line">{selected?.description || '-'}</div>
          </div>
        </DialogContent>
      </Dialog>

      <EventPrintDialog
        open={isPrintOpen}
        onOpenChange={(o) => { setIsPrintOpen(o); if (!o) setSelectedForPrint([]); }}
        events={selectedForPrint}
      />

      <EventShareDialog
        open={isShareOpen}
        onOpenChange={setIsShareOpen}
        event={selected}
      />

      <DeleteConfirmationDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={async () => {
          if (!selected?.id) return;
          try {
            await deleteEvent.mutateAsync(selected.id);
            setIsDeleteOpen(false);
            setSelected(null);
          } catch (err) {}
        }}
        title="Delete Event/Activity"
        description="Are you sure you want to delete this item?"
        confirmButtonText="Delete"
        cancelButtonText="Cancel"
        isLoading={deleteEvent.isPending}
      />
    </div>
  );
}

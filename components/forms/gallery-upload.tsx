'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { UploadCloud, X } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { uploadImage } from '@/lib/upload';
import { useEvents } from '@/lib/queries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { cn } from '@/lib/utils';

export function GalleryUpload({ onDone }: { onDone?: () => void }) {
  const qc = useQueryClient();
  const { data: events } = useEvents('all');
  const [files, setFiles] = React.useState<File[]>([]);
  const [eventId, setEventId] = React.useState('');
  const [title, setTitle] = React.useState('');
  const [uploading, setUploading] = React.useState(false);
  const [dragOver, setDragOver] = React.useState(false);

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    setFiles((prev) => [...prev, ...Array.from(list)]);
  };

  const submit = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    if (files.length === 0) {
      toast.error('Choose at least one image');
      return;
    }
    setUploading(true);
    try {
      for (const file of files) {
        const path = await uploadImage(file, eventId ? `gallery/${eventId}` : 'gallery/general');
        await supabase.from('gallery_items').insert({
          title: title || null,
          description: null,
          image_url: path,
          event_id: eventId || null,
          uploaded_by: user.id,
          is_public: true
        });
      }
      toast.success(`${files.length} image${files.length > 1 ? 's' : ''} uploaded`);
      setFiles([]);
      setTitle('');
      setEventId('');
      qc.invalidateQueries({ queryKey: ['gallery'] });
      onDone?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          addFiles(e.dataTransfer.files);
        }}
        className={cn(
          'flex flex-col items-center justify-center gap-2 rounded-xl2 border-2 border-dashed border-coffee-300 bg-coffee-50/40 px-6 py-10 text-center transition-colors dark:bg-coffee-900/20',
          dragOver && 'border-coffee-500 bg-coffee-100 dark:bg-coffee-800/40'
        )}
      >
        <UploadCloud className="h-8 w-8 text-coffee-500" />
        <p className="text-sm font-medium">Drag &amp; drop images here</p>
        <p className="text-xs text-muted-foreground">or</p>
        <Button variant="outline" size="sm" type="button" onClick={() => document.getElementById('g-upload')?.click()}>
          Browse files
        </Button>
        <Input
          id="g-upload"
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
      </div>

      {files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {files.map((f, i) => (
            <div key={i} className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-xs">
              <span className="max-w-[180px] truncate">{f.name}</span>
              <button
                type="button"
                className="text-muted-foreground hover:text-warmred-500"
                onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                aria-label="Remove file"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="g-title">Title (optional)</Label>
          <Input id="g-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Photo title" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="g-event">Link to event (optional)</Label>
          <Select id="g-event" value={eventId} onChange={(e) => setEventId(e.target.value)}>
            <option value="">General</option>
            {events?.map((ev) => (
              <option key={ev.id} value={ev.id}>{ev.title}</option>
            ))}
          </Select>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={submit} disabled={uploading || files.length === 0}>
          {uploading ? 'Uploading…' : `Upload ${files.length || ''} image${files.length !== 1 ? 's' : ''}`}
        </Button>
      </div>
    </div>
  );
}

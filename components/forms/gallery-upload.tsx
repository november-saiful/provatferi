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
import { cn, toBengaliDigits } from '@/lib/utils';

export function GalleryUpload({ onDone, open = true }: { onDone?: () => void; open?: boolean }) {
  const qc = useQueryClient();
  // Fetch the event list only while the dialog is open.
  const { data: events } = useEvents('all', open);
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
      toast.error('কমপক্ষে একটি ছবি বেছে নিন');
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
      toast.success(`${toBengaliDigits(files.length)}টি ছবি আপলোড হয়েছে`);
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
        <p className="text-sm font-medium">এখানে ছবি টেনে আনুন</p>
        <p className="text-xs text-muted-foreground">অথবা</p>
        <Button variant="outline" size="sm" type="button" onClick={() => document.getElementById('g-upload')?.click()}>
          ফাইল বেছে নিন
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
                aria-label="ফাইল সরান"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="g-title">শিরোনাম (ঐচ্ছিক)</Label>
          <Input id="g-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="ছবির শিরোনাম" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="g-event">ইভেন্টের সাথে যুক্ত করুন (ঐচ্ছিক)</Label>
          <Select id="g-event" value={eventId} onChange={(e) => setEventId(e.target.value)}>
            <option value="">সাধারণ</option>
            {events?.map((ev) => (
              <option key={ev.id} value={ev.id}>{ev.title}</option>
            ))}
          </Select>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={submit} disabled={uploading || files.length === 0}>
          {uploading ? 'আপলোড হচ্ছে…' : `আপলোড ${files.length ? toBengaliDigits(files.length) : ''}টি ছবি`}
        </Button>
      </div>
    </div>
  );
}

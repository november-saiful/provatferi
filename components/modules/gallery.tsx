'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight, X, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { useGallery, useEvents } from '@/lib/queries';
import { useAuthStore } from '@/lib/auth-store';
import { canWrite } from '@/lib/permissions';
import { storageUrl, storageThumb } from '@/lib/supabase/client';
import { deleteImage } from '@/lib/upload';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Select } from '@/components/ui/select';
import { Dialog } from '@/components/ui/dialog';
import { GalleryUpload } from '@/components/forms/gallery-upload';
import type { GalleryItem } from '@/lib/types';
import { Stagger, StaggerItem } from '@/components/ui/motion';

export function Gallery() {
  const qc = useQueryClient();
  const { role, user } = useAuthStore();
  const { data: items, isLoading } = useGallery();
  const { data: events } = useEvents('all');
  const [eventFilter, setEventFilter] = React.useState('');
  const [lightbox, setLightbox] = React.useState<GalleryItem | null>(null);
  const [showUpload, setShowUpload] = React.useState(false);

  const canUpload = canWrite(role, 'glr');

  const filtered = React.useMemo(
    () => (items ?? []).filter((g) => !eventFilter || g.event_id === eventFilter),
    [items, eventFilter]
  );

  const handleDelete = async (item: GalleryItem) => {
    if (!confirm('Delete this image?')) return;
    try {
      await deleteImage(item.image_url);
    } catch {
      // storage delete may be blocked; still remove the row
    }
    const { error } = await supabase.from('gallery_items').delete().eq('id', item.id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Image deleted');
      qc.invalidateQueries({ queryKey: ['gallery'] });
    }
  };

  return (
    <Stagger className="space-y-5">
      <StaggerItem>
        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={eventFilter}
            onChange={(e) => setEventFilter(e.target.value)}
            className="w-56"
          >
            <option value="">All events</option>
            {events?.map((ev) => (
              <option key={ev.id} value={ev.id}>{ev.title}</option>
            ))}
          </Select>
          {canUpload && (
            <Button onClick={() => setShowUpload(true)}>
              <Plus /> Upload photos
            </Button>
          )}
        </div>
      </StaggerItem>

      {isLoading && (
        <div className="columns-2 gap-3 md:columns-3 lg:columns-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="mb-3 h-40 w-full" />
          ))}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <EmptyState
          title="No photos yet"
          description="The gallery is empty. Check back soon for photos of club events."
        />
      )}

      <div className="columns-2 gap-3 md:columns-3 lg:columns-4">
        {filtered.map((item) => (
          <StaggerItem key={item.id}>
            <div className="group relative mb-3 break-inside-avoid overflow-hidden rounded-lg">
              <button type="button" className="block w-full" onClick={() => setLightbox(item)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={storageThumb(item.image_url, 640)}
                  alt={item.title ?? 'gallery image'}
                  className="w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                {item.title && (
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-left text-sm font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                    {item.title}
                  </div>
                )}
              </button>
              {(canWrite(role, 'glr') || user?.id === item.uploaded_by) && (
                <button
                  className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white opacity-0 transition-opacity hover:bg-warmred-600 group-hover:opacity-100"
                  onClick={() => handleDelete(item)}
                  aria-label="Delete image"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </StaggerItem>
        ))}
      </div>

      <Dialog open={showUpload} onClose={() => setShowUpload(false)} title="Upload photos">
        <GalleryUpload onDone={() => setShowUpload(false)} />
      </Dialog>

      {lightbox && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/90" onClick={() => setLightbox(null)}>
          <div className="flex items-center justify-between p-4 text-white">
            <p className="text-sm">{lightbox.title ?? 'Gallery image'}</p>
            <button onClick={() => setLightbox(null)} aria-label="Close">
              <X className="h-6 w-6" />
            </button>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={storageUrl(lightbox.image_url)}
            alt={lightbox.title ?? 'gallery image'}
            className="mx-auto max-h-full max-w-full object-contain p-4"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </Stagger>
  );
}

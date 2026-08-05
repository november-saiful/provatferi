'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowUpDown, 
  Search, 
  Image as ImageIcon, 
  X, 
  Plus, 
  Trash2,
  FolderOpen,
  ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { useGallery, useRealtimeInvalidate } from '@/lib/queries';
import { useQueryParam } from '@/lib/use-query-param';
import { useAuthStore } from '@/lib/auth-store';
import { canWrite } from '@/lib/permissions';
import { storageUrl, storageThumb } from '@/lib/supabase/client';
import { deleteImage } from '@/lib/upload';

import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Dialog } from '@/components/ui/dialog';
import { GalleryUpload } from '@/components/forms/gallery-upload';
import type { GalleryItem } from '@/lib/types';
import { cn } from '@/lib/utils';

export function Gallery() {
  const qc = useQueryClient();
  const { role, user } = useAuthStore();
  const { data: items, isLoading } = useGallery();
  useRealtimeInvalidate('gallery_items', [['gallery']]);
  
  const queryEvent = useQueryParam('event');
  const [eventFilter, setEventFilter] = React.useState('');
  const [lightbox, setLightbox] = React.useState<GalleryItem | null>(null);
  const [showUpload, setShowUpload] = React.useState(false);
  const [sortOldest, setSortOldest] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [activeView, setActiveView] = React.useState<'photos' | 'albums'>('photos');
  const [sortTooltip, setSortTooltip] = React.useState(false);
  const sortTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    return () => {
      if (sortTimerRef.current) clearTimeout(sortTimerRef.current);
    };
  }, []);

  // Show upload button only when logged in and has permission
  const canUpload = canWrite(role, 'glr');

  React.useEffect(() => {
    setEventFilter(queryEvent ?? '');
  }, [queryEvent]);



  // Albums: group items by event_id
  const albums = React.useMemo(() => {
    const filtered = (items ?? []).filter((g) => {
      const matchesSearch = !searchQuery || 
        (g.title?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
        (g.events?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
      return matchesSearch;
    });

    const albumMap = new Map<string, { title: string; cover: string; count: number; eventId: string; eventDate: string | null; eventStatus: string | null }>();
    for (const item of filtered) {
      const key = item.event_id ?? 'general';
      if (!albumMap.has(key)) {
        albumMap.set(key, {
          title: item.events?.title ?? 'সাধারণ ছবি',
          cover: item.image_url,
          count: 1,
          eventId: key,
          eventDate: item.events?.event_date ?? null,
          eventStatus: item.events?.status ?? null
        });
      } else {
        const existing = albumMap.get(key)!;
        existing.count++;
      }
    }
    return Array.from(albumMap.values());
  }, [items, searchQuery]);

  // Group items by date
  const groupedItems = React.useMemo(() => {
    const filtered = (items ?? []).filter((g) => {
      const matchesEvent = !eventFilter || g.event_id === eventFilter;
      const matchesSearch = !searchQuery || 
        (g.title?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
      return matchesEvent && matchesSearch;
    });

    // Sort by date
    const sorted = [...filtered].sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOldest ? dateA - dateB : dateB - dateA;
    });

    // Group by date
    const groups = new Map<string, GalleryItem[]>();
    for (const item of sorted) {
      const dateKey = new Date(item.created_at).toLocaleDateString('bn-BD', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      if (!groups.has(dateKey)) {
        groups.set(dateKey, []);
      }
      groups.get(dateKey)!.push(item);
    }

    return Array.from(groups.entries());
  }, [items, eventFilter, searchQuery, sortOldest]);

  const handleDelete = async (item: GalleryItem) => {
    if (!confirm('এই ছবিটি মুছে ফেলবেন?')) return;
    try {
      await deleteImage(item.image_url);
    } catch {
      // storage delete may be blocked; still remove the row
    }
    const { error } = await supabase.from('gallery_items').delete().eq('id', item.id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('ছবি মুছে ফেলা হয়েছে');
      qc.invalidateQueries({ queryKey: ['gallery'] });
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)]">
      {/* Main feed */}
      <div className="gallery-feed mx-auto max-w-[1680px] px-1 sm:px-2 md:px-4" style={{ paddingTop: 'calc(var(--gallery-gap, 3px) + env(safe-area-inset-top, 0px))', paddingBottom: 'calc(100px + env(safe-area-inset-bottom, 0px))' }}>
        {isLoading && (
          <div className="gallery-masonry">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="gallery-item mb-1 h-40 w-full rounded-sm" />
            ))}
          </div>
        )}

        {/* Albums View */}
        {!isLoading && activeView === 'albums' && (
          <div className="gallery-albums-grid">
            {albums.length === 0 && (
              <EmptyState
                title="কোনো অ্যালবাম নেই"
                description="ইভেন্টের ছবি এখনো আপলোড করা হয়নি।"
                className="mx-auto max-w-md"
              />
            )}
            {albums.map((album) => (
              <button
                key={album.eventId}
                className="gallery-album-card group"
                onClick={() => {
                  setActiveView('photos');
                  setEventFilter(album.eventId === 'general' ? '' : album.eventId);
                  const url = new URL(window.location.href);
                  if (album.eventId !== 'general') url.searchParams.set('event', album.eventId);
                  else url.searchParams.delete('event');
                  window.history.replaceState(null, '', url.toString());
                }}
              >
                <div className="gallery-album-cover">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={storageThumb(album.cover, 400)}
                    alt={album.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-sm font-semibold text-white leading-tight">{album.title}</p>
                    <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                      {album.eventDate && (
                        <span className="text-[10px] text-white/60">
                          {new Date(album.eventDate).toLocaleDateString('bn-BD', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                      )}
                      {album.eventStatus && (
                        <span className={cn(
                          'inline-block rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none',
                          album.eventStatus === 'upcoming' && 'bg-emerald-500/80 text-white',
                          album.eventStatus === 'ongoing' && 'bg-amber-500/80 text-white',
                          album.eventStatus === 'past' && 'bg-white/20 text-white/80'
                        )}>
                          {album.eventStatus === 'upcoming' ? 'আসছে' : album.eventStatus === 'ongoing' ? 'চলমান' : 'সম্পন্ন'}
                        </span>
                      )}
                      <span className="text-[10px] text-white/50">{album.count}টি ছবি</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Photos View: back button when event filtered */}
        {!isLoading && activeView === 'photos' && eventFilter && (
          <button
            className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            onClick={() => {
              setEventFilter('');
              const url = new URL(window.location.href);
              url.searchParams.delete('event');
              window.history.replaceState(null, '', url.toString());
            }}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            সব ছবি
          </button>
        )}

        {/* Photos View: empty state */}
        {!isLoading && activeView === 'photos' && groupedItems.length === 0 && (
          <EmptyState
            title="এখনো কোনো ছবি নেই"
            description="গ্যালারি খালি। ক্লাব ইভেন্টের ছবির জন্য শীঘ্রই আবার দেখুন।"
            className="mx-auto max-w-md"
          />
        )}

        {!isLoading && activeView === 'photos' && groupedItems.map(([date, dayItems]) => (
          <section key={date} className="gallery-day">
            <div className="gallery-masonry">
              {dayItems.map((item) => (
                <div key={item.id} className="gallery-item">
                  <div className="group relative overflow-hidden rounded-sm bg-muted">
                    <button 
                      type="button" 
                      className="block w-full" 
                      onClick={() => setLightbox(item)}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={storageThumb(item.image_url, 640)}
                        alt={item.title ?? 'gallery image'}
                        className="w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                        decoding="async"
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
                        aria-label="ছবি মুছুন"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Floating Bottom Navigation */}
      <nav className="gallery-bottom-nav">
        <div className="gallery-tab-bar">
          <button
            className={cn("gallery-tab", activeView === 'photos' && "active")}
            onClick={() => setActiveView('photos')}
          >
            <ImageIcon className="h-5 w-5" />
            <span>ফটো</span>
          </button>
          <button
            className={cn("gallery-tab", activeView === 'albums' && "active")}
            onClick={() => setActiveView('albums')}
          >
            <FolderOpen className="h-5 w-5" />
            <span>অ্যালবাম</span>
          </button>
          {canUpload && (
            <button
              className="gallery-tab"
              onClick={() => setShowUpload(true)}
            >
              <Plus className="h-5 w-5" />
              <span>আপলোড</span>
            </button>
          )}
        </div>
        <div className="relative w-fit">
          <button
            className={cn(
              "gallery-action-btn",
              sortOldest && "gallery-action-btn-active"
            )}
            onClick={() => {
              setSortOldest(!sortOldest);
              setSortTooltip(true);
              if (sortTimerRef.current) clearTimeout(sortTimerRef.current);
              sortTimerRef.current = setTimeout(() => setSortTooltip(false), 1800);
            }}
            aria-label={sortOldest ? 'নতুন আগে সাজান' : 'পুরানো আগে সাজান'}
          >
            <ArrowUpDown
              className={cn(
                "h-5 w-5 transition-transform duration-300",
                sortOldest && "rotate-180"
              )}
            />
          </button>
          <AnimatePresence>
            {sortTooltip && (
              <motion.div
                className="gallery-sort-tooltip"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.2 }}
              >
                {sortOldest ? 'পুরানো থেকে নতুন' : 'নতুন থেকে পুরানো'}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <button
          className="gallery-search-btn"
          onClick={() => setSearchOpen(true)}
          aria-label="সার্চ"
        >
          <Search className="h-6 w-6" />
        </button>
      </nav>

      {/* Search Dialog */}
      <Dialog open={searchOpen} onClose={() => setSearchOpen(false)} title="ছবি সার্চ করুন">
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="ছবির নাম খুঁজুন..."
              className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>
        </div>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={showUpload} onClose={() => setShowUpload(false)} title="ছবি আপলোড করুন">
        <GalleryUpload onDone={() => setShowUpload(false)} />
      </Dialog>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col bg-black/90"
            onClick={() => setLightbox(null)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex items-center justify-between p-4 text-white">
              <p className="text-sm">{lightbox.title ?? 'গ্যালারির ছবি'}</p>
              <button onClick={() => setLightbox(null)} aria-label="Close">
                <X className="h-6 w-6" />
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={storageUrl(lightbox.image_url)}
              alt={lightbox.title ?? 'gallery image'}
              className="mx-auto max-h-full max-w-full object-contain p-4"
              decoding="async"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

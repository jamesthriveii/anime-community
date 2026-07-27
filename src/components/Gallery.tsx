import { useEffect, useState, useCallback } from 'react';
import { Heart, X, ChevronLeft, ChevronRight, Loader2, Search, ImageIcon, Trash2 } from 'lucide-react';
import { supabase, type Picture } from '../lib/supabase';

type Props = {
  userId: string;
  showFavoritesOnly: boolean;
  isAdmin?: boolean;
};

export default function Gallery({ userId, showFavoritesOnly, isAdmin = false }: Props) {
  const [pictures, setPictures] = useState<Picture[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  // load pictures
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      const { data, error: err } = await supabase
        .from('pictures')
        .select('*')
        .order('created_at', { ascending: false });
      if (cancelled) return;
      if (err) {
        setError('Could not load pictures. Please try again.');
        setPictures([]);
      } else {
        setPictures(data ?? []);
      }
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // load favorites
  useEffect(() => {
    let cancelled = false;
    async function loadFavs() {
      const { data } = await supabase.from('favorites').select('picture_id').eq('user_id', userId);
      if (cancelled) return;
      setFavoriteIds(new Set((data ?? []).map((f) => f.picture_id)));
    }
    loadFavs();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const toggleFavorite = useCallback(
    async (pictureId: string) => {
      const isFav = favoriteIds.has(pictureId);
      // optimistic update
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (isFav) next.delete(pictureId);
        else next.add(pictureId);
        return next;
      });
      setToggling(pictureId);
      try {
        if (isFav) {
          await supabase.from('favorites').delete().eq('user_id', userId).eq('picture_id', pictureId);
        } else {
          await supabase.from('favorites').insert({ user_id: userId, picture_id: pictureId });
        }
      } catch {
        // revert on failure
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          if (isFav) next.add(pictureId);
          else next.delete(pictureId);
          return next;
        });
      } finally {
        setToggling(null);
      }
    },
    [favoriteIds, userId]
  );

  const deletePicture = useCallback(async (pic: Picture) => {
    if (!confirm(`Delete "${pic.title}"? This permanently removes the image and its storage file.`)) return;
    setDeleting(pic.id);
    try {
      if (pic.storage_path) {
        await supabase.storage.from('anime-images').remove([pic.storage_path]);
      }
      const { error: delErr } = await supabase.from('pictures').delete().eq('id', pic.id);
      if (delErr) throw delErr;
      setPictures((prev) => prev.filter((p) => p.id !== pic.id));
      if (lightboxIndex !== null) {
        setLightboxIndex(null);
      }
    } catch {
      setError('Could not delete image. Please try again.');
    } finally {
      setDeleting(null);
    }
  }, [lightboxIndex]);

  // derive categories from loaded pictures
  const categories = ['All', ...Array.from(new Set(pictures.map((p) => p.category)))].sort();

  const filtered = pictures.filter((p) => {
    const matchesCat = activeCategory === 'All' || p.category === activeCategory;
    const q = search.toLowerCase().trim();
    const matchesSearch =
      q === '' ||
      p.title.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      (p.anime_name?.toLowerCase().includes(q) ?? false) ||
      (p.character_name?.toLowerCase().includes(q) ?? false) ||
      p.tags.some((t) => t.toLowerCase().includes(q));
    const matchesFav = !showFavoritesOnly || favoriteIds.has(p.id);
    return matchesCat && matchesSearch && matchesFav;
  });

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);
  const prevImage = () =>
    setLightboxIndex((i) => (i === null ? i : (i - 1 + filtered.length) % filtered.length));
  const nextImage = () => setLightboxIndex((i) => (i === null ? i : (i + 1) % filtered.length));

  // keyboard nav for lightbox
  useEffect(() => {
    if (lightboxIndex === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') prevImage();
      if (e.key === 'ArrowRight') nextImage();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxIndex, filtered.length]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-rose-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <p className="text-rose-300">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-lg bg-rose-500/20 px-4 py-2 text-sm font-medium text-rose-300 hover:bg-rose-500/30"
        >
          Retry
        </button>
      </div>
    );
  }

  const activePicture = lightboxIndex !== null ? filtered[lightboxIndex] : null;

  return (
    <div>
      {/* controls */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, anime, or character..."
            className="w-full rounded-xl border border-white/10 bg-slate-900/60 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition focus:border-rose-400/50 focus:ring-2 focus:ring-rose-400/20"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                activeCategory === cat
                  ? 'bg-rose-500/90 text-white shadow-lg shadow-rose-500/20'
                  : 'border border-white/10 bg-white/5 text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center text-slate-500">
          <ImageIcon className="h-10 w-10" />
          <p>
            {showFavoritesOnly
              ? 'No favorites yet. Tap the heart on any picture to save it here.'
              : 'No pictures match your search.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((pic, i) => {
            const isFav = favoriteIds.has(pic.id);
            return (
              <div
                key={pic.id}
                onClick={() => openLightbox(i)}
                className="group relative cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-slate-900/40"
              >
                <div className="aspect-[4/5] overflow-hidden">
                  <img
                    src={pic.image_url}
                    alt={pic.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent opacity-0 transition group-hover:opacity-100" />
                <div className="absolute bottom-0 left-0 right-0 p-4 opacity-0 transition group-hover:opacity-100">
                  <span className="inline-block rounded-full bg-rose-500/30 px-2.5 py-0.5 text-xs font-medium text-rose-200">
                    {pic.category}
                  </span>
                  <h3 className="mt-1.5 text-sm font-semibold text-white">{pic.title}</h3>
                  {(pic.anime_name || pic.character_name) && (
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      {pic.anime_name && (
                        <span className="rounded bg-rose-500/15 px-1.5 py-0.5 text-xs font-medium text-rose-300">
                          {pic.anime_name}
                        </span>
                      )}
                      {pic.character_name && (
                        <span className="rounded bg-sky-500/15 px-1.5 py-0.5 text-xs font-medium text-sky-300">
                          {pic.character_name}
                        </span>
                      )}
                    </div>
                  )}
                  {pic.tags.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {pic.tags.slice(0, 4).map((t) => (
                        <span key={t} className="text-xs text-slate-400">#{t}</span>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(pic.id);
                  }}
                  disabled={toggling === pic.id}
                  aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
                  className={`absolute right-3 top-3 rounded-full p-2 backdrop-blur transition ${
                    isFav
                      ? 'bg-rose-500/90 text-white'
                      : 'bg-slate-950/60 text-white/80 opacity-0 group-hover:opacity-100 hover:bg-slate-950/80'
                  }`}
                >
                  <Heart className={`h-4 w-4 ${isFav ? 'fill-current' : ''}`} />
                </button>
                {isAdmin && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deletePicture(pic);
                    }}
                    disabled={deleting === pic.id}
                    aria-label="Delete image"
                    className="absolute left-3 top-3 rounded-full bg-slate-950/60 p-2 text-white/80 opacity-0 backdrop-blur transition hover:bg-rose-500/80 hover:text-white group-hover:opacity-100 disabled:opacity-40"
                  >
                    {deleting === pic.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* lightbox */}
      {activePicture && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 p-4 backdrop-blur-sm"
          onClick={closeLightbox}
        >
          <button
            onClick={closeLightbox}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          {filtered.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prevImage();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
                aria-label="Previous"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
                aria-label="Next"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          <div
            className="flex max-h-full max-w-5xl flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={activePicture.full_url}
              alt={activePicture.title}
              className="max-h-[80vh] rounded-xl object-contain"
            />
            <div className="mt-4 flex items-center gap-4">
              <div>
                <span className="inline-block rounded-full bg-rose-500/30 px-2.5 py-0.5 text-xs font-medium text-rose-200">
                  {activePicture.category}
                </span>
                <h3 className="mt-1.5 text-lg font-semibold text-white">{activePicture.title}</h3>
                {(activePicture.anime_name || activePicture.character_name) && (
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {activePicture.anime_name && (
                      <span className="rounded bg-rose-500/15 px-2 py-0.5 text-xs font-medium text-rose-300">
                        {activePicture.anime_name}
                      </span>
                    )}
                    {activePicture.character_name && (
                      <span className="rounded bg-sky-500/15 px-2 py-0.5 text-xs font-medium text-sky-300">
                        {activePicture.character_name}
                      </span>
                    )}
                  </div>
                )}
                {activePicture.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {activePicture.tags.map((t) => (
                      <span key={t} className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs text-slate-300">#{t}</span>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => toggleFavorite(activePicture.id)}
                disabled={toggling === activePicture.id}
                aria-label={favoriteIds.has(activePicture.id) ? 'Remove from favorites' : 'Add to favorites'}
                className={`rounded-full p-3 transition ${
                  favoriteIds.has(activePicture.id)
                    ? 'bg-rose-500/90 text-white'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <Heart
                  className={`h-5 w-5 ${favoriteIds.has(activePicture.id) ? 'fill-current' : ''}`}
                />
              </button>
              {isAdmin && (
                <button
                  onClick={() => deletePicture(activePicture)}
                  disabled={deleting === activePicture.id}
                  aria-label="Delete image"
                  className="rounded-full bg-white/10 p-3 text-white transition hover:bg-rose-500/80 disabled:opacity-40"
                >
                  {deleting === activePicture.id ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Trash2 className="h-5 w-5" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

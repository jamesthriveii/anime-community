import { useCallback, useEffect, useRef, useState, type DragEvent, type FormEvent } from 'react';
import {
  UploadCloud,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Tag as TagIcon,
  Image as ImageIcon,
} from 'lucide-react';
import { supabase, type Picture } from '../lib/supabase';

const STORAGE_BUCKET = 'anime-images';
const CATEGORIES = ['Illustration', 'Mural', 'Cosplay', 'Sketch', 'Character'];

type Props = {
  userId: string;
};

export default function UploadPanel({ userId }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [animeName, setAnimeName] = useState('');
  const [characterName, setCharacterName] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploads, setUploads] = useState<Picture[]>([]);
  const [uploadsLoading, setUploadsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadUploads = useCallback(async () => {
    setUploadsLoading(true);
    const { data } = await supabase
      .from('pictures')
      .select('*')
      .eq('uploaded_by', userId)
      .order('created_at', { ascending: false });
    setUploads(data ?? []);
    setUploadsLoading(false);
  }, [userId]);

  useEffect(() => {
    loadUploads();
  }, [loadUploads]);

  const resetForm = () => {
    setFile(null);
    setPreview(null);
    setTitle('');
    setCategory(CATEGORIES[0]);
    setAnimeName('');
    setCharacterName('');
    setTagInput('');
    setTags([]);
    setError(null);
    setSuccess(null);
  };

  const handleFile = (f: File) => {
    if (!f.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError('Image must be under 10MB.');
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setError(null);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) {
      setTags((prev) => [...prev, t]);
    }
    setTagInput('');
  };

  const removeTag = (t: string) => {
    setTags((prev) => prev.filter((x) => x !== t));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!file) {
      setError('Please select an image to upload.');
      return;
    }
    if (!title.trim()) {
      setError('Please enter a title.');
      return;
    }
    setBusy(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const storagePath = `${userId}/${Date.now()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(storagePath, file, { cacheControl: '3600', upsert: false });
      if (upErr) throw new Error(`Upload failed: ${upErr.message}`);

      const { data: pubData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(storagePath);
      const publicUrl = pubData.publicUrl;

      const { error: dbErr } = await supabase.from('pictures').insert({
        title: title.trim(),
        category,
        image_url: publicUrl,
        full_url: publicUrl,
        tags,
        anime_name: animeName.trim() || null,
        character_name: characterName.trim() || null,
        storage_path: storagePath,
      });
      if (dbErr) {
        await supabase.storage.from(STORAGE_BUCKET).remove([storagePath]);
        throw new Error(`Database error: ${dbErr.message}`);
      }

      setSuccess(`"${title.trim()}" uploaded successfully.`);
      resetForm();
      loadUploads();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setBusy(false);
    }
  };

  const deleteUpload = async (pic: Picture) => {
    if (!confirm(`Delete "${pic.title}"? This removes the image and its storage file.`)) return;
    try {
      if (pic.storage_path) {
        await supabase.storage.from(STORAGE_BUCKET).remove([pic.storage_path]);
      }
      const { error: delErr } = await supabase.from('pictures').delete().eq('id', pic.id);
      if (delErr) throw new Error(delErr.message);
      setUploads((prev) => prev.filter((p) => p.id !== pic.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed.');
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Upload Anime Art</h2>
        <p className="mt-1 text-sm text-slate-400">
          Share your favorite anime images with the gallery. Add a title and optional tags.
        </p>
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-rose-300/60 hover:text-rose-300">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      {success && (
        <div className="mb-6 flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{success}</span>
          <button onClick={() => setSuccess(null)} className="ml-auto text-emerald-300/60 hover:text-emerald-300">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upload form */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
            <UploadCloud className="h-4 w-4" /> New Upload
          </h3>
          <form onSubmit={submit} className="space-y-5">
            {/* drop zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative flex aspect-video cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition ${
                dragOver
                  ? 'border-rose-400 bg-rose-500/10'
                  : 'border-white/15 bg-slate-900/40 hover:border-white/30'
              }`}
            >
              {preview ? (
                <>
                  <img src={preview} alt="Preview" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      resetForm();
                    }}
                    className="absolute right-2 top-2 rounded-full bg-slate-950/80 p-1.5 text-white hover:bg-slate-950"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-500">
                  <UploadCloud className="h-8 w-8" />
                  <p className="text-sm">Drag an image here or click to browse</p>
                  <p className="text-xs text-slate-600">PNG, JPG, WebP up to 10MB</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
            </div>

            {/* title */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Sunset Samurai"
                className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-rose-400/50 focus:ring-2 focus:ring-rose-400/20"
              />
            </div>

            {/* category */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Category</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory(c)}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                      category === c
                        ? 'bg-rose-500/90 text-white'
                        : 'border border-white/10 bg-white/5 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* anime name */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Anime Name <span className="text-slate-500">(optional)</span>
              </label>
              <input
                type="text"
                value={animeName}
                onChange={(e) => setAnimeName(e.target.value)}
                placeholder="e.g. Demon Slayer, Naruto, One Piece"
                className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-rose-400/50 focus:ring-2 focus:ring-rose-400/20"
              />
            </div>

            {/* character name */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Character Name <span className="text-slate-500">(optional)</span>
              </label>
              <input
                type="text"
                value={characterName}
                onChange={(e) => setCharacterName(e.target.value)}
                placeholder="e.g. Tanjiro Kamado, Naruto Uzumaki"
                className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-rose-400/50 focus:ring-2 focus:ring-rose-400/20"
              />
            </div>

            {/* tags */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Tags <span className="text-slate-500">(optional)</span>
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <TagIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    placeholder="Type a tag and press Enter"
                    className="w-full rounded-xl border border-white/10 bg-slate-900/60 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition focus:border-rose-400/50 focus:ring-2 focus:ring-rose-400/20"
                  />
                </div>
                <button
                  type="button"
                  onClick={addTag}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-medium text-slate-300 hover:bg-white/10"
                >
                  Add
                </button>
              </div>
              {tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-3 py-1 text-xs font-medium text-rose-300"
                    >
                      {t}
                      <button type="button" onClick={() => removeTag(t)} className="hover:text-rose-200">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-fuchsia-500 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-500/25 transition hover:from-rose-400 hover:to-fuchsia-400 disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
              {busy ? 'Uploading...' : 'Upload Image'}
            </button>
          </form>
        </div>

        {/* your uploads list */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
            <ImageIcon className="h-4 w-4" /> Your Uploads
          </h3>
          {uploadsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-rose-400" />
            </div>
          ) : uploads.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-slate-500">
              <ImageIcon className="h-8 w-8" />
              <p className="text-sm">No uploads yet. Your uploaded images will appear here.</p>
            </div>
          ) : (
            <div className="max-h-[600px] space-y-3 overflow-y-auto pr-1">
              {uploads.map((pic) => (
                <div
                  key={pic.id}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-900/40 p-3"
                >
                  <img
                    src={pic.image_url}
                    alt={pic.title}
                    className="h-14 w-14 flex-shrink-0 rounded-lg object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">{pic.title}</p>
                    <p className="text-xs text-slate-500">{pic.category}</p>
                    {pic.tags.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {pic.tags.slice(0, 3).map((t) => (
                          <span key={t} className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-slate-400">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => deleteUpload(pic)}
                    className="flex-shrink-0 rounded-lg p-2 text-slate-500 transition hover:bg-rose-500/10 hover:text-rose-400"
                    aria-label="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

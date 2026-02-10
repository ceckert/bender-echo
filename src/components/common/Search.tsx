import { useState, useEffect, useRef } from 'preact/hooks';

interface PagefindResult {
  url: string;
  meta: { title: string; image?: string };
  excerpt: string;
}

let pagefind: any = null;

export default function Search() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PagefindResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      document.body.style.overflow = '';
      setQuery('');
      setResults([]);
    }
  }, [open]);

  async function loadPagefind() {
    if (pagefind) return pagefind;
    try {
      pagefind = await import(/* @vite-ignore */ '/pagefind/pagefind.js');
      await pagefind.init();
      return pagefind;
    } catch {
      console.error('Pagefind not available — run a production build first.');
      return null;
    }
  }

  async function handleSearch(value: string) {
    setQuery(value);
    clearTimeout(debounceRef.current);

    if (!value.trim()) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const pf = await loadPagefind();
      if (!pf) {
        setLoading(false);
        return;
      }

      const search = await pf.search(value);
      const raw = await Promise.all(
        search.results.slice(0, 8).map((r: any) => r.data())
      );
      const data: PagefindResult[] = raw.map((r) => ({
        ...r,
        url: r.url.replace(/\/+$/, '') || '/',
      }));
      setResults(data);
      setLoading(false);
    }, 200);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        class="text-muted dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700 rounded-lg text-sm p-2.5 inline-flex items-center"
        aria-label="Search"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </button>

      {open && <div
      class="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" />

      <div class="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
        <div class="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-slate-700">
          <svg class="w-5 h-5 text-gray-400 dark:text-slate-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onInput={(e) => handleSearch((e.target as HTMLInputElement).value)}
            placeholder="Search blog posts..."
            class="flex-1 bg-transparent text-gray-900 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 outline-none text-sm"
          />
          <kbd class="hidden sm:inline-flex items-center rounded border border-gray-200 dark:border-slate-600 px-1.5 py-0.5 text-xs text-gray-400 dark:text-slate-500">
            Esc
          </kbd>
        </div>

        <div class="max-h-[50vh] overflow-y-auto">
          {loading && (
            <div class="px-4 py-8 text-center text-sm text-gray-400 dark:text-slate-500">
              Searching...
            </div>
          )}

          {!loading && query && results.length === 0 && (
            <div class="px-4 py-8 text-center text-sm text-gray-400 dark:text-slate-500">
              No results for "{query}"
            </div>
          )}

          {!loading && results.length > 0 && (
            <ul class="py-2">
              {results.map((result) => (
                <li key={result.url}>
                  <a
                    href={result.url}
                    class="block px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition"
                  >
                    <div class="text-sm font-medium text-gray-900 dark:text-slate-200">
                      {result.meta.title}
                    </div>
                    <div
                      class="mt-1 text-xs text-gray-500 dark:text-slate-400 line-clamp-2"
                      dangerouslySetInnerHTML={{ __html: result.excerpt }}
                    />
                  </a>
                </li>
              ))}
            </ul>
          )}

          {!loading && !query && (
            <div class="px-4 py-8 text-center text-sm text-gray-400 dark:text-slate-500">
              Start typing to search...
            </div>
          )}
        </div>
      </div>
    </div>}
    </>
  );
}

import { useState } from 'preact/hooks';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getFirebaseDb } from '~/utils/firebase';
import type { User } from 'firebase/auth';

interface Props {
  postSlug: string;
  user: User;
}

export default function CommentForm({ postSlug, user }: Props) {
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);
    setError('');

    try {
      await addDoc(collection(getFirebaseDb(), 'comments'), {
        postSlug,
        authorName: user.displayName || 'Anonymous',
        authorAvatar: user.photoURL || '',
        authorUid: user.uid,
        content: trimmed,
        createdAt: serverTimestamp(),
      });
      setContent('');
    } catch (err) {
      console.error('Failed to post comment:', err);
      setError('Failed to post comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} class="mt-6">
      <div class="flex gap-3">
        {user.photoURL && (
          <img
            src={user.photoURL}
            alt={user.displayName || 'User'}
            class="w-10 h-10 rounded-full flex-shrink-0"
          />
        )}
        <div class="flex-1">
          <textarea
            value={content}
            onInput={(e) => setContent((e.target as HTMLTextAreaElement).value)}
            placeholder="Add a comment..."
            rows={3}
            maxLength={2000}
            class="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-gray-900 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-y transition"
          />
          {error && <p class="mt-1 text-sm text-red-500">{error}</p>}
          <div class="mt-2 flex justify-between items-center">
            <span class="text-xs text-gray-400 dark:text-slate-500">{content.length}/2000</span>
            <button
              type="submit"
              disabled={!content.trim() || submitting}
              class="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Posting...' : 'Post Comment'}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

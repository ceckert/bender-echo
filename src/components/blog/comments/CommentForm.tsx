import { useState } from 'preact/hooks';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getFirebaseDb } from '~/utils/firebase';
import type { User } from 'firebase/auth';

interface Props {
  postSlug: string;
  user: User;
  parentId?: string | null;
  onCancel?: () => void;
}

export default function CommentForm({ postSlug, user, parentId = null, onCancel }: Props) {
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isReply = parentId !== null;

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);
    setError('');

    try {
      await addDoc(collection(getFirebaseDb(), 'comments'), {
        postSlug,
        parentId,
        authorName: user.displayName || 'Anonymous',
        authorAvatar: user.photoURL || '',
        authorUid: user.uid,
        content: trimmed,
        createdAt: serverTimestamp(),
      });
      setContent('');
      if (isReply && onCancel) onCancel();
    } catch (err) {
      console.error('Failed to post comment:', err);
      setError('Failed to post comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} class={isReply ? 'mt-3' : 'mt-6'}>
      <div class="flex gap-3">
        {!isReply && user.photoURL && (
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
            placeholder={isReply ? 'Reply...' : 'Add a comment...'}
            rows={isReply ? 2 : 3}
            maxLength={2000}
            class="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-gray-900 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-y transition"
          />
          {error && <p class="mt-1 text-sm text-red-500">{error}</p>}
          <div class="mt-2 flex justify-between items-center">
            <span class="text-xs text-gray-400 dark:text-slate-500">{content.length}/2000</span>
            <div class="flex gap-2">
              {isReply && onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  class="inline-flex items-center rounded-lg px-3 py-1.5 text-sm font-medium text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 transition"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={!content.trim() || submitting}
                class={`inline-flex items-center rounded-lg bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed ${isReply ? 'px-3 py-1.5' : 'px-4 py-2'}`}
              >
                {submitting ? 'Posting...' : isReply ? 'Reply' : 'Post Comment'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

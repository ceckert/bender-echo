import { useState } from 'preact/hooks';
import type { User } from 'firebase/auth';
import type { Comment } from './types';
import CommentForm from './CommentForm';

interface Props {
  comments: Comment[];
  loading: boolean;
  user: User | null;
  postSlug: string;
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}

function CommentBubble({ comment }: { comment: Comment }) {
  return (
    <div class="flex gap-3">
      {comment.authorAvatar && (
        <img
          src={comment.authorAvatar}
          alt={comment.authorName}
          class="w-10 h-10 rounded-full flex-shrink-0"
        />
      )}
      <div class="flex-1 min-w-0">
        <div class="flex items-baseline gap-2">
          <span class="font-medium text-sm text-gray-900 dark:text-slate-200">
            {comment.authorName}
          </span>
          <span class="text-xs text-gray-400 dark:text-slate-500">{timeAgo(comment.createdAt)}</span>
        </div>
        <p class="mt-1 text-gray-700 dark:text-slate-300 text-sm whitespace-pre-wrap break-words">
          {comment.content}
        </p>
      </div>
    </div>
  );
}

export default function CommentList({ comments, loading, user, postSlug }: Props) {
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  if (loading) {
    return (
      <div class="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} class="animate-pulse flex gap-3">
            <div class="w-10 h-10 bg-gray-200 dark:bg-slate-700 rounded-full" />
            <div class="flex-1 space-y-2">
              <div class="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/4" />
              <div class="h-4 bg-gray-200 dark:bg-slate-700 rounded w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <p class="text-gray-500 dark:text-slate-400 text-sm italic">
        No comments yet. Be the first to share your thoughts!
      </p>
    );
  }

  const topLevel = comments.filter((c) => c.parentId === null);
  const repliesByParent = new Map<string, Comment[]>();
  for (const c of comments) {
    if (c.parentId !== null) {
      const existing = repliesByParent.get(c.parentId) || [];
      existing.push(c);
      repliesByParent.set(c.parentId, existing);
    }
  }

  return (
    <div class="space-y-6">
      {topLevel.map((comment) => {
        const replies = repliesByParent.get(comment.id) || [];
        return (
          <div key={comment.id}>
            <CommentBubble comment={comment} />

            {user && (
              <button
                type="button"
                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                class="ml-13 mt-1 text-xs text-gray-400 dark:text-slate-500 hover:text-blue-500 dark:hover:text-blue-400 transition"
              >
                {replyingTo === comment.id ? 'Cancel' : 'Reply'}
              </button>
            )}

            {replyingTo === comment.id && user && (
              <div class="ml-13 mt-2">
                <CommentForm
                  postSlug={postSlug}
                  user={user}
                  parentId={comment.id}
                  onCancel={() => setReplyingTo(null)}
                />
              </div>
            )}

            {replies.length > 0 && (
              <div class="ml-13 mt-4 space-y-4 border-l-2 border-gray-100 dark:border-slate-700 pl-4">
                {replies.map((reply) => (
                  <CommentBubble key={reply.id} comment={reply} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

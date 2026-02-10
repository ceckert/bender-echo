import type { Comment } from './types';

interface Props {
  comments: Comment[];
  loading: boolean;
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

export default function CommentList({ comments, loading }: Props) {
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

  return (
    <div class="space-y-6">
      {comments.map((comment) => (
        <div key={comment.id} class="flex gap-3">
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
      ))}
    </div>
  );
}

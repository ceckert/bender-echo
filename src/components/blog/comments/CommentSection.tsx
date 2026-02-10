import { useState, useEffect } from 'preact/hooks';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { getFirebaseDb } from '~/utils/firebase';
import type { User } from 'firebase/auth';
import type { Comment } from './types';
import AuthButton from './AuthButton';
import CommentList from './CommentList';
import CommentForm from './CommentForm';

interface Props {
  postSlug: string;
}

export default function CommentSection({ postSlug }: Props) {
  const [user, setUser] = useState<User | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(getFirebaseDb(), 'comments'),
      where('postSlug', '==', postSlug),
      // orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetched: Comment[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          postSlug: doc.data().postSlug,
          authorName: doc.data().authorName,
          authorAvatar: doc.data().authorAvatar,
          authorUid: doc.data().authorUid,
          content: doc.data().content,
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        }));
        setComments(fetched);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching comments:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [postSlug]);

  return (
    <div class="mx-auto px-6 sm:px-6 max-w-3xl mt-12 mb-8">
      <div class="border-t border-gray-200 dark:border-slate-700 pt-8">
        <h2 class="text-2xl font-bold font-heading text-gray-900 dark:text-slate-200 mb-6">
          Comments
          {!loading && comments.length > 0 && (
            <span class="ml-2 text-base font-normal text-gray-400 dark:text-slate-500">
              ({comments.length})
            </span>
          )}
        </h2>

        <CommentList comments={comments} loading={loading} />

        <div class="mt-8 pt-6 border-t border-gray-100 dark:border-slate-700/50">
          {user ? (
            <div>
              <div class="flex justify-between items-center mb-4">
                <span class="text-sm text-gray-500 dark:text-slate-400">
                  Commenting as{' '}
                  <strong class="text-gray-700 dark:text-slate-300">{user.displayName}</strong>
                </span>
                <AuthButton onUserChange={setUser} />
              </div>
              <CommentForm postSlug={postSlug} user={user} />
            </div>
          ) : (
            <div>
              <p class="text-sm text-gray-500 dark:text-slate-400 mb-4">Sign in to leave a comment</p>
              <AuthButton onUserChange={setUser} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

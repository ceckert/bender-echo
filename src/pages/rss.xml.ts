import { getRssString } from '@astrojs/rss';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, query, orderBy, getDocs } from 'firebase/firestore';

import { SITE, METADATA, APP_BLOG } from 'astrowind:config';
import { fetchPosts } from '~/utils/blog';
import { getPermalink } from '~/utils/permalinks';

function getFirebaseApp() {
  const config = {
    apiKey: import.meta.env.PUBLIC_FIREBASE_API_KEY,
    authDomain: import.meta.env.PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.PUBLIC_FIREBASE_APP_ID,
    measurementId: import.meta.env.PUBLIC_FIREBASE_MEASUREMENT_ID,
  };
  return getApps().length === 0 ? initializeApp(config) : getApp();
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

interface RssComment {
  id: string;
  authorName: string;
  content: string;
  createdAt: Date;
  parentId: string | null;
}

function renderCommentsHtml(comments: RssComment[]): string {
  if (comments.length === 0) return '';

  const topLevel = comments.filter((c) => !c.parentId);
  const replies = comments.filter((c) => c.parentId);
  const repliesByParent = new Map<string, RssComment[]>();
  for (const reply of replies) {
    const group = repliesByParent.get(reply.parentId!) || [];
    group.push(reply);
    repliesByParent.set(reply.parentId!, group);
  }

  let html = `<hr><h2>Comments (${comments.length})</h2>`;
  for (const comment of topLevel) {
    html += `<p><strong>${escapeHtml(comment.authorName)}</strong><br>${escapeHtml(comment.content)}</p>`;
    const childReplies = repliesByParent.get(comment.id);
    if (childReplies) {
      html += '<blockquote>';
      for (const reply of childReplies) {
        html += `<p><strong>${escapeHtml(reply.authorName)}</strong><br>${escapeHtml(reply.content)}</p>`;
      }
      html += '</blockquote>';
    }
  }
  return html;
}

export const GET = async () => {
  if (!APP_BLOG.isEnabled) {
    return new Response(null, {
      status: 404,
      statusText: 'Not found',
    });
  }

  const posts = await fetchPosts();

  // Fetch all comments from Firestore
  const db = getFirestore(getFirebaseApp());
  const commentsQuery = query(collection(db, 'comments'), orderBy('createdAt', 'asc'));
  const snapshot = await getDocs(commentsQuery);

  const commentsByPost = new Map<string, RssComment[]>();
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const slug: string = data.postSlug;
    if (!commentsByPost.has(slug)) {
      commentsByPost.set(slug, []);
    }
    commentsByPost.get(slug)!.push({
      id: doc.id,
      authorName: data.authorName,
      content: data.content,
      createdAt: data.createdAt?.toDate() || new Date(),
      parentId: data.parentId ?? null,
    });
  }

  const rss = await getRssString({
    title: `${SITE.name}'s Blog`,
    description: METADATA?.description || '',
    site: import.meta.env.SITE,

    items: posts.map((post) => {
      const postComments = commentsByPost.get(post.slug) || [];
      const commentsHtml = renderCommentsHtml(postComments);

      return {
        link: getPermalink(post.permalink, 'post'),
        title: post.title,
        description: post.excerpt,
        pubDate: post.publishDate,
        ...(commentsHtml ? { content: commentsHtml } : {}),
      };
    }),

    trailingSlash: SITE.trailingSlash,
  });

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
};

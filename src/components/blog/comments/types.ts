export interface Comment {
  id: string;
  postSlug: string;
  parentId: string | null;
  authorName: string;
  authorAvatar: string;
  authorUid: string;
  content: string;
  createdAt: Date;
}

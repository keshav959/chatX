export type Post = {
  id: number;
  authorId: number;
  authorDisplayName: string;
  content: string;
  createdAt: string;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  topComments: Comment[];
};

export type Comment = {
  id: number;
  postId: number;
  authorId: number;
  authorDisplayName: string;
  parentId: number | null;
  content: string;
  createdAt: string;
  children: Comment[];
};

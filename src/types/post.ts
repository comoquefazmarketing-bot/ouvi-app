export type MediaType = "image" | "video";

export type Post = {
  id: string;
  authorName: string;
  authorHandle: string;
  caption: string;
  commentsCount: number;
  mediaType: MediaType;
};

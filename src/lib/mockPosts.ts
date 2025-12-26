import { Post } from "@/types/post";

export const mockPosts: Post[] = [
  {
    id: "ouvi-1",
    authorName: "Lia Rocha",
    authorHandle: "@liarocha",
    caption: "Silêncio bom depois de um dia cheio. 🌙",
    commentsCount: 12,
    mediaType: "image",
  },
  {
    id: "ouvi-2",
    authorName: "Caio Mendes",
    authorHandle: "@caiom",
    caption: "Descobri um café novo no bairro, vibe tranquila.",
    commentsCount: 8,
    mediaType: "video",
  },
  {
    id: "ouvi-3",
    authorName: "Nina Alves",
    authorHandle: "@nina",
    caption: "Meu lugar favorito na cidade continua o mesmo.",
    commentsCount: 21,
    mediaType: "image",
  },
];

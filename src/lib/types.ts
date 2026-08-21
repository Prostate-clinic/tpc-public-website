export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  tags: string[];
  status: "PUBLISHED" | "DRAFT" | "ARCHIVED";
  authorId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  author: BlogAuthor;
}

export interface BlogAuthor {
  id: string;
  name: string;
  email: string;
  role: "DOCTOR" | string;
}
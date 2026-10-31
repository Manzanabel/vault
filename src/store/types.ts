export type FileItemType =
  | "pdf"
  | "image"
  | "doc"
  | "sheet"
  | "archive"
  | "other";

export type SharePermission = "read" | "write";

export interface FilesResponse {
    items: FileItem[];
    next_cursor: string | null;
    total: number;
}

export interface FileItem {
  id: string;
  name: string;
  type: FileItemType;
  mime_type: string;
  size_bytes: number;
  created_at: string;
  updated_at: string;
  shared_with_count: number;
  version: number;
}

export interface FileDetail extends FileItem {
  shared_with: Array<{
    user_id: string;
    email: string;
    permission: SharePermission;
  }>;
}
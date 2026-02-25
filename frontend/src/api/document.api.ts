import api from "./axios";
import type { DocumentItem } from "../types";

export const listDocumentsApi = async () => {
  const { data } = await api.get<{ documents: DocumentItem[] }>("/api/documents");
  return data.documents;
};

export const uploadDocumentApi = async (file: File, onUploadProgress?: (percent: number) => void) => {
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await api.post<{ document: DocumentItem }>("/api/documents/upload", formData, {
    onUploadProgress: (evt) => {
      if (!evt.total) return;
      onUploadProgress?.(Math.round((evt.loaded / evt.total) * 100));
    }
  });

  return data.document;
};

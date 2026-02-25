import { useQuery } from "@tanstack/react-query";
import { listDocumentsApi } from "../../api/document.api";
import { DocumentCard } from "./DocumentCard";

export const DocumentList = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: listDocumentsApi,
    refetchInterval: 5001
  });

  if (isLoading) return <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 bg-slate-100 animate-pulse rounded" />)}</div>;
  if (!data?.length) return <p className="text-slate-500">No documents yet. Upload your first PDF or DOCX.</p>;

  return <div className="space-y-3">{data.map((doc) => <DocumentCard key={doc._id} doc={doc} />)}</div>;
};

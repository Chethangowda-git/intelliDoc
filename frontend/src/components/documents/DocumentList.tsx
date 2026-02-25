import { useQuery } from "@tanstack/react-query";
import { listDocumentsApi } from "../../api/document.api";
import { DocumentCard } from "./DocumentCard";

export const DocumentList = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["documents"],
    queryFn: listDocumentsApi,
    refetchInterval: 5000
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-100" />
        ))}
      </div>
    );
  }

  if (isError) {
    return <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">Could not load documents. Please try again.</p>;
  }

  if (!data?.length) {
    return <p className="text-sm text-slate-500">No documents yet. Upload your first PDF or DOCX.</p>;
  }

  return (
    <div className="space-y-3">
      {data.map((doc) => (
        <DocumentCard key={doc._id} doc={doc} />
      ))}
    </div>
  );
};

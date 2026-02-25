import { useNavigate } from "react-router-dom";
import type { DocumentItem } from "../../types";

const statusClass: Record<DocumentItem["status"], string> = {
  queued: "bg-slate-200 text-slate-700",
  extracting: "bg-yellow-100 text-yellow-700",
  embedding: "bg-blue-100 text-blue-700",
  ready: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700"
};

export const DocumentCard = ({ doc }: { doc: DocumentItem }) => {
  const navigate = useNavigate();
  return (
    <div className="bg-white border rounded-lg p-4 flex justify-between items-center">
      <div>
        <p className="font-medium">{doc.originalName}</p>
        <p className="text-sm text-slate-500">{(doc.fileSize / 1024 / 1024).toFixed(2)} MB • {new Date(doc.createdAt).toLocaleString()}</p>
      </div>
      <div className="flex gap-2 items-center">
        <span className="text-xs px-2 py-1 rounded bg-slate-100 uppercase">{doc.fileType}</span>
        <span className={`text-xs px-2 py-1 rounded ${statusClass[doc.status]}`}>{doc.status}</span>
        {doc.status === "ready" && <button className="text-sm underline" onClick={() => navigate(`/documents/${doc._id}`)}>Open</button>}
      </div>
    </div>
  );
};

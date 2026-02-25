import { useNavigate } from "react-router-dom";
import type { DocumentItem } from "../../types";

const statusClass: Record<DocumentItem["status"], string> = {
  queued: "bg-slate-100 text-slate-700",
  extracting: "bg-yellow-100 text-yellow-700",
  embedding: "bg-blue-100 text-blue-700",
  ready: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700"
};

const statusLabel: Record<DocumentItem["status"], string> = {
  queued: "Queued",
  extracting: "Extracting...",
  embedding: "Embedding...",
  ready: "Ready",
  failed: "Failed"
};

export const DocumentCard = ({ doc }: { doc: DocumentItem }) => {
  const navigate = useNavigate();

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-medium text-slate-900">{doc.originalName}</h3>
          <p className="mt-1 text-sm text-slate-500">
            {(doc.fileSize / 1024 / 1024).toFixed(2)} MB • {new Date(doc.createdAt).toLocaleString()}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700">
            {doc.fileType}
          </span>
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClass[doc.status]}`}>
            {statusLabel[doc.status]}
          </span>
          {doc.status === "ready" ? (
            <button className="btn-secondary px-3 py-1.5" onClick={() => navigate(`/documents/${doc._id}`)}>
              Open
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
};

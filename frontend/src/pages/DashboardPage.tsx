import { useState } from "react";
import { DocumentList } from "../components/documents/DocumentList";
import { UploadDropzone } from "../components/documents/UploadDropzone";

export const DashboardPage = () => {
  const [showUpload, setShowUpload] = useState(false);

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8 sm:px-6">
      <header className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">My Documents</h2>
          <p className="mt-1 text-sm text-slate-600">Upload and track PDF/DOCX processing status in real time.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowUpload((v) => !v)}>
          {showUpload ? "Close Upload" : "Upload Document"}
        </button>
      </header>

      {showUpload ? (
        <section className="card p-5">
          <UploadDropzone />
        </section>
      ) : null}

      <section className="card p-5">
        <DocumentList />
      </section>
    </main>
  );
};

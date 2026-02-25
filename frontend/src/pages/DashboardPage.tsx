import { useState } from "react";
import { DocumentList } from "../components/documents/DocumentList";
import { UploadDropzone } from "../components/documents/UploadDropzone";

export const DashboardPage = () => {
  const [showUpload, setShowUpload] = useState(false);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">My Documents</h2>
        <button className="bg-slate-900 text-white px-4 py-2 rounded" onClick={() => setShowUpload((v) => !v)}>
          Upload Document
        </button>
      </div>
      {showUpload && <UploadDropzone />}
      <DocumentList />
    </div>
  );
};

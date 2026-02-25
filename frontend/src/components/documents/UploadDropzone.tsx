import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { uploadDocumentApi } from "../../api/document.api";
import { useQueryClient } from "@tanstack/react-query";

const formatFileSize = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(2)} MB`;

export const UploadDropzone = () => {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const onDrop = async (accepted: File[]) => {
    const file = accepted[0];
    if (!file) return;

    setError("");
    setSelectedFile(file);

    try {
      await uploadDocumentApi(file, setProgress);
      setProgress(0);
      setSelectedFile(null);
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Upload failed");
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"]
    },
    multiple: false
  });

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition ${
          isDragActive ? "border-blue-500 bg-blue-50" : "border-slate-300 bg-slate-50 hover:border-blue-400"
        }`}
      >
        <input {...getInputProps()} />
        <p className="text-sm font-medium text-slate-800">{isDragActive ? "Drop your file here" : "Drag PDF/DOCX here, or click to select"}</p>
        <p className="mt-1 text-xs text-slate-500">Maximum file size: 20MB</p>
      </div>

      {selectedFile ? (
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
          <strong>{selectedFile.name}</strong> • {formatFileSize(selectedFile.size)}
        </div>
      ) : null}

      {progress > 0 ? (
        <div>
          <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
            <span>Upload progress</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 rounded bg-slate-200">
            <div style={{ width: `${progress}%` }} className="h-full rounded bg-blue-500 transition-all" />
          </div>
        </div>
      ) : null}

      {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
    </div>
  );
};

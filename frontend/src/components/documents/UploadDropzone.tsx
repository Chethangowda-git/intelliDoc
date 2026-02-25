import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { uploadDocumentApi } from "../../api/document.api";
import { useQueryClient } from "@tanstack/react-query";

export const UploadDropzone = () => {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  const onDrop = async (accepted: File[]) => {
    const file = accepted[0];
    if (!file) return;
    setError("");
    try {
      await uploadDocumentApi(file, setProgress);
      setProgress(0);
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
    <div>
      <div {...getRootProps()} className="border-2 border-dashed rounded-lg p-6 text-center bg-white cursor-pointer">
        <input {...getInputProps()} />
        <p>{isDragActive ? "Drop your file here" : "Drag PDF/DOCX here, or click to select"}</p>
      </div>
      {progress > 0 && <div className="h-2 bg-slate-200 mt-3 rounded"><div style={{ width: `${progress}%` }} className="h-full bg-blue-500 rounded" /></div>}
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </div>
  );
};

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';
import client from '../api/client';

export default function UploadZone({ onUploadComplete }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setError('');
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await client.post('/api/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onUploadComplete(data.document);
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }, [onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] },
    maxFiles: 1,
    disabled: uploading,
  });

  return (
    <div>
      <div
        {...getRootProps()}
        style={{
          ...styles.zone,
          ...(isDragActive ? styles.zoneActive : {}),
          ...(uploading ? styles.zoneDisabled : {}),
        }}
      >
        <input {...getInputProps()} />
        <Upload size={32} color={isDragActive ? '#3b82f6' : '#64748b'} />
        <p style={styles.text}>
          {uploading
            ? 'Uploading...'
            : isDragActive
            ? 'Drop it here'
            : 'Drag & drop a PDF or DOCX, or click to browse'}
        </p>
        <p style={styles.hint}>Max 50MB</p>
      </div>
      {error && <p style={styles.error}>{error}</p>}
    </div>
  );
}

const styles = {
  zone: { border: '2px dashed #334155', borderRadius: 12, padding: '40px 24px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 },
  zoneActive: { borderColor: '#3b82f6', background: '#1e3a5f22' },
  zoneDisabled: { opacity: 0.5, cursor: 'not-allowed' },
  text: { color: '#94a3b8', margin: 0, fontSize: 14 },
  hint: { color: '#475569', margin: 0, fontSize: 12 },
  error: { color: '#f87171', fontSize: 13, marginTop: 8 },
};
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import client from '../api/client';

export default function UploadZone({ onUploadComplete, onUploadError }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState('');

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploading(true);
    setProgress('Uploading...');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await client.post('/api/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onUploadComplete(data.document);
    } catch (err) {
      const msg = err.response?.data?.error || 'Upload failed';
      onUploadError?.(msg);
    } finally {
      setUploading(false);
      setProgress('');
    }
  }, [onUploadComplete, onUploadError]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
    disabled: uploading,
  });

  return (
    <div
      {...getRootProps()}
      style={{
        ...s.zone,
        ...(isDragActive ? s.zoneActive : {}),
        ...(uploading ? s.zoneUploading : {}),
      }}
    >
      <input {...getInputProps()} />

      {uploading ? (
        <div style={s.uploadingState}>
          <div style={s.spinnerWrap}>
            <div style={s.spinnerRing} />
          </div>
          <span style={s.uploadingText}>{progress}</span>
        </div>
      ) : isDragActive ? (
        <div style={s.dragState}>
          <div style={s.dragIcon}>↓</div>
          <span style={s.dragText}>Release to upload</span>
        </div>
      ) : (
        <div style={s.idleState}>
          <div style={s.iconWrap}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="rgba(59,130,246,0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="17 8 12 3 7 8" stroke="rgba(59,130,246,0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="12" y1="3" x2="12" y2="15" stroke="rgba(59,130,246,0.8)" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <div style={s.textWrap}>
            <span style={s.mainText}>Drop a file or <span style={s.browseLink}>browse</span></span>
            <span style={s.subText}>PDF or DOCX · Max 50MB</span>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  zone: {
    border: '1px dashed rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: '20px 16px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    background: 'rgba(255,255,255,0.02)',
    minHeight: 80,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoneActive: {
    borderColor: 'rgba(59,130,246,0.5)',
    background: 'rgba(59,130,246,0.06)',
  },
  zoneUploading: {
    opacity: 0.7,
    cursor: 'not-allowed',
  },
  idleState: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
  },
  iconWrap: {
    width: 36,
    height: 36,
    background: 'var(--blue-dim)',
    border: '1px solid rgba(59,130,246,0.15)',
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  textWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  mainText: {
    color: 'var(--text-2)',
    fontSize: 13,
    fontWeight: 400,
  },
  browseLink: {
    color: 'var(--blue)',
    fontWeight: 500,
  },
  subText: {
    color: 'var(--text-3)',
    fontSize: 11,
  },
  dragState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  dragIcon: {
    fontSize: 24,
    color: 'var(--blue)',
  },
  dragText: {
    color: 'var(--blue)',
    fontSize: 13,
    fontWeight: 500,
  },
  uploadingState: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  spinnerWrap: {
    position: 'relative',
    width: 20,
    height: 20,
  },
  spinnerRing: {
    width: 20,
    height: 20,
    border: '2px solid rgba(59,130,246,0.2)',
    borderTopColor: 'var(--blue)',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
  },
  uploadingText: {
    color: 'var(--text-2)',
    fontSize: 13,
  },
};
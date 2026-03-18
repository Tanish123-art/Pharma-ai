import React, { useState, useRef } from 'react';
import { X, Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import api from '../lib/api';

interface UploadModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function UploadModal({ isOpen, onClose }: UploadModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setStatus('idle');
            setMessage('');
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setStatus('uploading');
        const formData = new FormData();
        formData.append('file', file);

        try {
            const { data } = await api.post('/documents/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setStatus('success');
            setMessage(`Successfully ingested ${data.chunks} chunks from ${file.name}`);
            setFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (error: any) {
            console.error('Upload failed', error);
            setStatus('error');
            setMessage(error.response?.data?.detail || 'Failed to upload document. Please try again.');
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <Upload className="w-5 h-5 text-blue-500" />
                        Upload Knowledge
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                        Upload PDF or TXT documents to add them to the Internal Knowledge Base (RAG).
                    </p>

                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${
                            file ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                    >
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileChange} 
                            accept=".pdf,.txt,.md" 
                            className="hidden" 
                        />
                        
                        {file ? (
                            <div className="flex flex-col items-center">
                                <FileText className="w-12 h-12 text-blue-500 mb-3" />
                                <span className="text-sm font-medium text-slate-900 dark:text-white truncate max-w-[200px]">
                                    {file.name}
                                </span>
                                <span className="text-xs text-slate-500">
                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                </span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center">
                                <Upload className="w-12 h-12 text-slate-300 mb-3" />
                                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                                    Click to select or drag and drop
                                </span>
                                <span className="text-xs text-slate-400 mt-1">
                                    PDF, TXT, or MD up to 10MB
                                </span>
                            </div>
                        )}
                    </div>

                    {status !== 'idle' && (
                        <div className={`mt-4 p-3 rounded-lg flex items-start gap-3 ${
                            status === 'uploading' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' :
                            status === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300' :
                            'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300'
                        }`}>
                            {status === 'uploading' ? <Loader2 className="w-5 h-5 animate-spin shrink-0" /> :
                             status === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> :
                             <AlertCircle className="w-5 h-5 shrink-0" />}
                            <span className="text-sm">{status === 'uploading' ? 'Processing and embedding...' : message}</span>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleUpload}
                        disabled={!file || status === 'uploading'}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg shadow-sm transition-colors flex items-center gap-2"
                    >
                        {status === 'uploading' && <Loader2 className="w-4 h-4 animate-spin" />}
                        {status === 'uploading' ? 'Ingesting...' : 'Start Ingestion'}
                    </button>
                </div>
            </div>
        </div>
    );
}

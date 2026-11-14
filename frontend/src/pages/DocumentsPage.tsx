import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FolderLock,
  Upload,
  Search,
  Download,
  Trash2,
  Tag,
  Calendar,
  FileText,
  FileImage,
  FileSpreadsheet,
  File,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { EmptyState } from '../components/common/EmptyState';
import { DocumentItem, DocumentCategory } from '../types';

export const DocumentsPage: React.FC = () => {
  const { currentWorkspace } = useAuth();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Upload Form states
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('OTHER');
  const [expirationDate, setExpirationDate] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [notes, setNotes] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Queries
  const { data: documents = [], isLoading } = useQuery<DocumentItem[]>({
    queryKey: ['documents', currentWorkspace?.id, categoryFilter, selectedTag, searchTerm],
    queryFn: () =>
      api.get<DocumentItem[]>('/documents', {
        category: categoryFilter !== 'ALL' ? categoryFilter : undefined,
        tag: selectedTag || undefined,
        search: searchTerm || undefined
      }),
    enabled: !!currentWorkspace?.id
  });

  // Mutations
  const uploadMutation = useMutation({
    mutationFn: (formData: FormData) => api.upload('/documents/upload', formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setIsUploadModalOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      setUploadError(err.message || 'File upload failed');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/documents/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    }
  });

  const resetForm = () => {
    setFile(null);
    setTitle('');
    setDescription('');
    setCategory('OTHER');
    setExpirationDate('');
    setTagInput('');
    setNotes('');
    setUploadError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      if (!title) {
        setTitle(selected.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setUploadError('Please select a file to upload');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    if (description) formData.append('description', description);
    formData.append('category', category);
    if (expirationDate) formData.append('expirationDate', expirationDate);
    if (notes) formData.append('notes', notes);

    if (tagInput.trim()) {
      const tags = tagInput.split(',').map((t) => t.trim()).filter(Boolean);
      formData.append('tags', JSON.stringify(tags));
    }

    uploadMutation.mutate(formData);
  };

  const getFileIcon = (mime: string) => {
    if (mime.includes('pdf')) return <FileText className="w-6 h-6 text-rose-500" />;
    if (mime.includes('image')) return <FileImage className="w-6 h-6 text-blue-500" />;
    if (mime.includes('sheet') || mime.includes('excel') || mime.includes('csv'))
      return <FileSpreadsheet className="w-6 h-6 text-emerald-500" />;
    return <File className="w-6 h-6 text-slate-500" />;
  };

  const categories: { label: string; value: DocumentCategory }[] = [
    { label: 'Bills & Utilities', value: 'BILL' },
    { label: 'Receipts & Proof of Purchase', value: 'RECEIPT' },
    { label: 'Rental & Leases', value: 'RENTAL_AGREEMENT' },
    { label: 'Warranties', value: 'WARRANTY' },
    { label: 'Insurance Policies', value: 'INSURANCE' },
    { label: 'Household Records', value: 'HOUSEHOLD_RECORD' },
    { label: 'Other Documents', value: 'OTHER' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Secure Document Vault
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Private, encrypted storage for household records, warranties, and receipts.
          </p>
        </div>
        <Button
          variant="primary"
          icon={<Upload className="w-4 h-4" />}
          onClick={() => {
            resetForm();
            setIsUploadModalOpen(true);
          }}
        >
          Upload Document
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search documents by title, tags, or notes..."
              className="w-full bg-slate-50 dark:bg-slate-800 text-xs rounded-xl pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 text-xs rounded-xl px-3 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Document Grid */}
      {documents.length === 0 ? (
        <EmptyState
          icon={<FolderLock className="w-7 h-7" />}
          title="Vault is empty"
          description="Upload receipts, warranties, and lease agreements to access them safely anytime."
          actionLabel="Upload Document"
          onAction={() => {
            resetForm();
            setIsUploadModalOpen(true);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <Card key={doc.id} className="flex flex-col justify-between hoverable">
              <div>
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-700">
                    {getFileIcon(doc.mimeType)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight truncate">
                      {doc.title}
                    </h3>
                    <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                      {doc.fileOriginalName} • {(doc.fileSize / 1024).toFixed(0)} KB
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 mb-3">
                  <Badge variant="slate" size="sm">{doc.category}</Badge>
                  {doc.tags?.map((t) => (
                    <span key={t.id} className="inline-flex items-center text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                      #{t.name}
                    </span>
                  ))}
                </div>

                {doc.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
                    {doc.description}
                  </p>
                )}

                <div className="text-[11px] text-slate-400 space-y-1 mb-3">
                  <div>Uploaded by {doc.uploadedBy?.firstName || 'Member'}</div>
                  {doc.expirationDate && (
                    <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                      <Calendar className="w-3 h-3" />
                      <span>Expires: {new Date(doc.expirationDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <a
                  href={doc.signedDownloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-500"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Private File</span>
                </a>

                <button
                  onClick={() => {
                    if (confirm(`Delete document "${doc.title}"?`)) {
                      deleteMutation.mutate(doc.id);
                    }
                  }}
                  title="Delete document"
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload Private Document"
        description="Files are stored securely in vault storage. Direct public links are blocked."
      >
        <form onSubmit={handleUploadSubmit} className="space-y-4">
          {uploadError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300">
              {uploadError}
            </div>
          )}

          {/* Drag & drop file area */}
          <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 text-center hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
            <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <label className="text-xs font-semibold text-emerald-600 hover:text-emerald-500 cursor-pointer">
              <span>Choose a file from your device</span>
              <input type="file" className="sr-only" onChange={handleFileChange} />
            </label>
            <p className="text-[11px] text-slate-400 mt-1">PDF, PNG, JPG, DOCX, CSV up to 15MB</p>
            {file && (
              <div className="mt-3 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 py-1.5 px-3 rounded-lg inline-block">
                Selected: {file.name}
              </div>
            )}
          </div>

          <Input
            label="Document Title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. 2026 Lease Agreement"
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as DocumentCategory)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm py-2 px-3 focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <Input
              label="Expiration Date (Optional)"
              type="date"
              value={expirationDate}
              onChange={(e) => setExpirationDate(e.target.value)}
            />
          </div>

          <Input
            label="Tags (Comma-separated)"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="lease, apartment, legal"
          />

          <Input
            label="Notes / Description"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Signed copy kept in office cabinet"
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsUploadModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={uploadMutation.isPending}>
              Upload Document
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

'use client';

import { useState } from 'react';
import { uploadOrganizationLogo } from './actions';
import { Loader2, Upload } from 'lucide-react';

interface BrandingSettingsFormProps {
  currentLogoUrl: string | null;
}

export function BrandingSettingsForm({ currentLogoUrl }: BrandingSettingsFormProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentLogoUrl);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage(null);

    // Create local preview
    setPreview(URL.createObjectURL(file));

    const formData = new FormData();
    formData.append('logo', file);

    const result = await uploadOrganizationLogo(formData);

    if (result.error) {
      setMessage({ type: 'error', text: result.error });
      setPreview(currentLogoUrl);
    } else {
      setMessage({ type: 'success', text: 'Logo uploaded successfully!' });
    }
    setUploading(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-8">
        <div className="relative group">
          <div className="w-32 h-32 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border-2 border-dashed border-zinc-300 dark:border-zinc-700 flex items-center justify-center overflow-hidden">
            {preview ? (
              <img src={preview} alt="Organization Logo" className="w-full h-full object-contain" />
            ) : (
              <div className="text-zinc-400 text-xs text-center p-2">No logo uploaded</div>
            )}
          </div>
          <label className="absolute -bottom-2 -right-2 p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full shadow-lg cursor-pointer hover:text-indigo-600 transition-colors">
            <Upload className="w-4 h-4" />
            <input type="file" className="hidden" accept="image/*" onChange={handleUpload} />
          </label>
        </div>
        <div className="space-y-1">
          <h3 className="font-medium text-zinc-900 dark:text-white">Organization Branding</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Upload your school's official logo. This will appear on reports, invoices, and the student portal.
          </p>
          <p className="text-xs text-zinc-400">Max file size: 2MB (PNG, JPG, SVG)</p>
        </div>
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-sm ${
          message.type === 'success'
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
        }`}>
          {message.text}
        </div>
      )}

      {uploading && (
        <div className="flex items-center gap-2 text-sm text-indigo-600 font-medium">
          <Loader2 className="w-4 h-4 animate-spin" />
          Uploading logo...
        </div>
      )}
    </div>
  );
}

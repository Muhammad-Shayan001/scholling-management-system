'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createCampus } from '../actions';

export function CreateCampusForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    contactEmail: '',
    contactPhone: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await createCampus(formData);

      if (result.error) {
        setError(result.error);
        return;
      }

      router.push('/admin/campuses');
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      )}

      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700"
        >
          Campus Name *
        </label>
        <input
          type="text"
          id="name"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
          placeholder="Main Campus"
        />
      </div>

      <div>
        <label
          htmlFor="address"
          className="block text-sm font-medium text-gray-700"
        >
          Address
        </label>
        <textarea
          id="address"
          rows={3}
          value={formData.address}
          onChange={(e) =>
            setFormData({ ...formData, address: e.target.value })
          }
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
          placeholder="Street address, city, state, postal code"
        />
      </div>

      <div>
        <label
          htmlFor="contactEmail"
          className="block text-sm font-medium text-gray-700"
        >
          Contact Email
        </label>
        <input
          type="email"
          id="contactEmail"
          value={formData.contactEmail}
          onChange={(e) =>
            setFormData({ ...formData, contactEmail: e.target.value })
          }
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
          placeholder="campus@school.edu"
        />
      </div>

      <div>
        <label
          htmlFor="contactPhone"
          className="block text-sm font-medium text-gray-700"
        >
          Contact Phone
        </label>
        <input
          type="tel"
          id="contactPhone"
          value={formData.contactPhone}
          onChange={(e) =>
            setFormData({ ...formData, contactPhone: e.target.value })
          }
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
          placeholder="+1 (555) 123-4567"
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Campus'}
        </button>
        <a
          href="/admin/campuses"
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}

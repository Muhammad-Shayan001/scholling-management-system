'use client';

interface Campus {
  id: string;
  name: string;
  address: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  created_at: string;
}

export function CampusesList({ campuses }: { campuses: Campus[] }) {
  if (campuses.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No campuses</h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by creating your first campus.
        </p>
        <div className="mt-6">
          <a
            href="/admin/campuses/new"
            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Add Campus
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg bg-white shadow">
      <ul className="divide-y divide-gray-200">
        {campuses.map((campus) => (
          <li key={campus.id}>
            <a
              href={`/admin/campuses/${campus.id}`}
              className="block hover:bg-gray-50"
            >
              <div className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900">
                      {campus.name}
                    </h3>
                    {campus.address && (
                      <p className="mt-1 text-sm text-gray-500">
                        {campus.address}
                      </p>
                    )}
                    <div className="mt-2 flex gap-4 text-sm text-gray-500">
                      {campus.contact_email && (
                        <span>📧 {campus.contact_email}</span>
                      )}
                      {campus.contact_phone && (
                        <span>📞 {campus.contact_phone}</span>
                      )}
                    </div>
                  </div>
                  <div className="ml-4">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

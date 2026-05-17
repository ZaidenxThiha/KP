import type { ReactNode } from 'react';

// A list that renders as a real table on tablet/desktop and as a stack of
// label/value cards on mobile — so admin/officer data is readable on a phone.
export type Column<T> = {
  header: string;
  cell: (row: T) => ReactNode;
  align?: 'right';
};

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  rowClassName,
  empty = 'Nothing here yet.',
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey?: (row: T, index: number) => string;
  rowClassName?: (row: T) => string;
  empty?: string;
}) {
  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-gray-200 bg-white px-4 py-12 text-center text-sm text-gray-400">
        {empty}
      </p>
    );
  }

  return (
    <>
      {/* Tablet / desktop */}
      <div className="hidden overflow-hidden rounded-xl border border-gray-200 bg-white md:block">
        <table className="w-full text-sm text-gray-700">
          <thead>
            <tr className="border-b border-gray-200">
              {columns.map((c) => (
                <th
                  key={c.header}
                  className={`px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-gray-400 ${
                    c.align === 'right' ? 'text-right' : 'text-left'
                  }`}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row, i) => (
              <tr key={rowKey ? rowKey(row, i) : i} className={rowClassName?.(row)}>
                {columns.map((c) => (
                  <td
                    key={c.header}
                    className={`px-4 py-3 align-top ${c.align === 'right' ? 'text-right' : ''}`}
                  >
                    {c.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile — one card per row */}
      <ul className="flex flex-col gap-2.5 text-gray-700 md:hidden">
        {rows.map((row, i) => (
          <li
            key={rowKey ? rowKey(row, i) : i}
            className={`rounded-xl border border-gray-200 bg-white p-3.5 ${rowClassName?.(row) ?? ''}`}
          >
            <dl className="flex flex-col gap-2">
              {columns.map((c) => (
                <div key={c.header} className="flex items-baseline justify-between gap-4">
                  <dt className="shrink-0 text-xs font-medium uppercase tracking-wide text-gray-400">
                    {c.header}
                  </dt>
                  <dd className="min-w-0 break-words text-right">{c.cell(row)}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
    </>
  );
}

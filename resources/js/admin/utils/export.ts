/**
 * Export Utilities
 * Functions for exporting data to various formats (CSV, Excel, PDF, JSON)
 */

// ============================================================================
// TYPES
// ============================================================================

export interface ExportColumn<T> {
  key: keyof T | string;
  header: string;
  width?: number;
  format?: (value: unknown, row: T) => string;
}

export interface ExportOptions {
  filename: string;
  sheetName?: string;
  includeHeaders?: boolean;
  dateFormat?: string;
}

// ============================================================================
// CSV EXPORT
// ============================================================================

/**
 * Convert data to CSV string
 */
export function toCSV<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn<T>[],
  options: Partial<ExportOptions> = {}
): string {
  const { includeHeaders = true } = options;
  const lines: string[] = [];

  // Headers
  if (includeHeaders) {
    lines.push(columns.map(col => escapeCSV(col.header)).join(','));
  }

  // Data rows
  for (const row of data) {
    const values = columns.map(col => {
      const value = getNestedValue(row, col.key as string);
      const formatted = col.format ? col.format(value, row) : String(value ?? '');
      return escapeCSV(formatted);
    });
    lines.push(values.join(','));
  }

  return lines.join('\n');
}

/**
 * Download data as CSV file
 */
export function downloadCSV<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn<T>[],
  options: ExportOptions
): void {
  const csv = toCSV(data, columns, options);
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `${options.filename}.csv`);
}

/**
 * Escape CSV value
 */
function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

// ============================================================================
// JSON EXPORT
// ============================================================================

/**
 * Download data as JSON file
 */
export function downloadJSON<T>(data: T, filename: string, pretty = true): void {
  const json = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
  const blob = new Blob([json], { type: 'application/json' });
  downloadBlob(blob, `${filename}.json`);
}

// ============================================================================
// EXCEL EXPORT (Simple HTML-based)
// ============================================================================

/**
 * Convert data to Excel-compatible HTML table
 */
export function toExcelHTML<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn<T>[],
  options: Partial<ExportOptions> = {}
): string {
  const { sheetName = 'Sheet1' } = options;

  let html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:x="urn:schemas-microsoft-com:office:excel">
    <head>
      <meta charset="UTF-8">
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>${sheetName}</x:Name>
              <x:WorksheetOptions>
                <x:DisplayGridlines/>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>
        table { border-collapse: collapse; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f3f4f6; font-weight: bold; }
      </style>
    </head>
    <body>
      <table>
        <thead>
          <tr>
            ${columns.map(col => `<th>${escapeHTML(col.header)}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
  `;

  for (const row of data) {
    html += '<tr>';
    for (const col of columns) {
      const value = getNestedValue(row, col.key as string);
      const formatted = col.format ? col.format(value, row) : String(value ?? '');
      html += `<td>${escapeHTML(formatted)}</td>`;
    }
    html += '</tr>';
  }

  html += '</tbody></table></body></html>';
  return html;
}

/**
 * Download data as Excel file (.xls)
 */
export function downloadExcel<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn<T>[],
  options: ExportOptions
): void {
  const html = toExcelHTML(data, columns, options);
  const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
  downloadBlob(blob, `${options.filename}.xls`);
}

// ============================================================================
// PDF EXPORT (Print-based)
// ============================================================================

/**
 * Generate printable HTML for PDF export
 */
export function toPrintHTML<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn<T>[],
  options: Partial<ExportOptions & { title?: string }> = {}
): string {
  const { title = 'Export' } = options;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        @media print {
          @page { margin: 1cm; }
        }
        body {
          font-family: Arial, sans-serif;
          font-size: 12px;
          margin: 20px;
        }
        h1 {
          font-size: 18px;
          margin-bottom: 20px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        th, td {
          border: 1px solid #ccc;
          padding: 8px;
          text-align: left;
        }
        th {
          background-color: #f5f5f5;
          font-weight: bold;
        }
        tr:nth-child(even) {
          background-color: #fafafa;
        }
        .footer {
          margin-top: 20px;
          font-size: 10px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <h1>${escapeHTML(title)}</h1>
      <table>
        <thead>
          <tr>
            ${columns.map(col => `<th>${escapeHTML(col.header)}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${data.map(row => `
            <tr>
              ${columns.map(col => {
                const value = getNestedValue(row, col.key as string);
                const formatted = col.format ? col.format(value, row) : String(value ?? '');
                return `<td>${escapeHTML(formatted)}</td>`;
              }).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="footer">
        Genere le ${new Date().toLocaleString('fr-FR')}
      </div>
    </body>
    </html>
  `;
}

/**
 * Open print dialog for PDF export
 */
export function printToPDF<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn<T>[],
  options: ExportOptions & { title?: string }
): void {
  const html = toPrintHTML(data, columns, options);
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Download a blob as file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Get nested object value using dot notation
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((acc: unknown, part: string) => {
    if (acc && typeof acc === 'object' && part in acc) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
}

/**
 * Escape HTML special characters
 */
function escapeHTML(str: string): string {
  const escapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return str.replace(/[&<>"']/g, char => escapeMap[char]);
}

// ============================================================================
// FORMAT HELPERS
// ============================================================================

/**
 * Format date for export
 */
export function formatDate(date: string | Date, format = 'DD/MM/YYYY'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  return format
    .replace('DD', day)
    .replace('MM', month)
    .replace('YYYY', String(year))
    .replace('HH', hours)
    .replace('mm', minutes);
}

/**
 * Format number for export
 */
export function formatNumber(value: number, decimals = 0): string {
  return value.toLocaleString('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format currency for export
 */
export function formatCurrency(value: number, currency = 'EUR'): string {
  return value.toLocaleString('fr-FR', {
    style: 'currency',
    currency,
  });
}

/**
 * Format percentage for export
 */
export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format boolean for export
 */
export function formatBoolean(value: boolean, trueLabel = 'Oui', falseLabel = 'Non'): string {
  return value ? trueLabel : falseLabel;
}

export default {
  toCSV,
  downloadCSV,
  downloadJSON,
  toExcelHTML,
  downloadExcel,
  toPrintHTML,
  printToPDF,
  downloadBlob,
  formatDate,
  formatNumber,
  formatCurrency,
  formatPercent,
  formatBoolean,
};

import { Download, Upload } from 'lucide-react';
import { exportData, importData } from './db';

export function ExportImport() {
  const handleExport = async () => {
    try {
      const data = await exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json'
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `finone-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert('Data exported successfully!');
    } catch (error) {
      alert('Export failed: ' + error.message);
    }
  };

  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (confirm('This will replace all your current data. Continue?')) {
        await importData(data);
        alert('Data imported successfully! Please refresh the page.');
        window.location.reload();
      }
    } catch (error) {
      alert('Import failed: ' + error.message);
    }

    event.target.value = '';
  };

  return (
    <div className="export-import">
      <h3>Backup & Restore</h3>
      <div className="export-import-buttons">
        <button
          onClick={handleExport}
          className="export-btn"
          title="Download your data as a JSON backup file"
        >
          <Download size={16} />
          Export
        </button>

        <label
          className="import-btn"
          title="Upload a JSON backup file to restore your data"
        >
          <Upload size={16} />
          Import
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            style={{ display: 'none' }}
          />
        </label>
      </div>
    </div>
  );
}
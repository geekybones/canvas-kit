import type { ExportManager } from '@/extensions/export/ExportManager';
import type { ExportAccessor, ExportOptions } from '@/extensions/export/types';

export function createExportAccessor(getManager: () => ExportManager | undefined): ExportAccessor {
  return {
    render: async (format, options?: ExportOptions) => {
      const exportManager = getManager();
      if (!exportManager) {
        throw new Error('Export extension is disabled');
      }
      return exportManager.render(format, options);
    },
  };
}

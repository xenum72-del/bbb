import { createBackup } from './backup';

// iOS-specific backup utilities
export interface iOSBackupOptions {
  format: 'json' | 'csv' | 'pdf' | 'markdown';
  includePhotos: boolean;
  splitSize?: number; // For large backups, split into smaller files
}

// Detect if we're on iOS
export function isiOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window);
}

// Detect if we're in a PWA on iOS
export function isiOSPWA(): boolean {
  return isiOS() && 'standalone' in window.navigator && (window.navigator as any).standalone === true;
}

// iOS Web Share API support
export function canUseWebShare(): boolean {
  return 'share' in navigator && 'canShare' in navigator;
}

// Create a shareable text summary for iOS
export async function createSummaryForSharing(): Promise<string> {
  const backup = await createBackup(false);
  const friendCount = backup.friends.length;
  const encounterCount = backup.encounters.length;
  
  const lastEncounter = backup.encounters
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  
  const summary = `📊 The Load Down Summary

👥 Friends: ${friendCount}
🔥 Encounters: ${encounterCount}
📅 Latest: ${lastEncounter ? new Date(lastEncounter.date).toLocaleDateString() : 'None'}
⭐ Avg Rating: ${backup.encounters.length > 0 ? 
  (backup.encounters.reduce((sum, e) => sum + e.rating, 0) / backup.encounters.length).toFixed(1) : 'N/A'}

Generated: ${new Date().toLocaleDateString()}

#EncounterLedger #PersonalStats`;

  return summary;
}

// Create CSV format for easy Excel import
export async function createCSVBackup(includePhotos: boolean = false): Promise<string> {
  const backup = await createBackup(includePhotos);
  
  let csv = 'Type,Date,Friend,Rating,Duration,Activities,Location,Notes\n';
  
  backup.encounters.forEach(encounter => {
    const friendName = backup.friends.find(f => f.id === encounter.participants?.[0])?.name || 'Unknown';
    const activities = encounter.activitiesPerformed?.map((i: number) => 
      backup.interactionTypes.find(type => type.id === i)?.name || 'Unknown'
    ).join('; ') || '';
    
    const row = [
      'Encounter',
      new Date(encounter.date).toLocaleDateString(),
      `"${friendName}"`,
      encounter.rating,
      encounter.durationMinutes || '',
      `"${activities}"`,
      `"${encounter.location?.place || ''}"`,
      `"${encounter.notes || ''}"`
    ].join(',');
    
    csv += row + '\n';
  });
  
  return csv;
}

// Create Markdown format for better readability
export async function createMarkdownBackup(): Promise<string> {
  const backup = await createBackup(false);
  
  let md = `# 🏳️‍🌈 The Load Down Backup

**Generated:** ${new Date().toLocaleDateString()}  
**Friends:** ${backup.friends.length}  
**Encounters:** ${backup.encounters.length}

## 📊 Statistics

`;

  // Add monthly breakdown
  const monthlyStats = backup.encounters.reduce((acc, encounter) => {
    const month = new Date(encounter.date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    });
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  Object.entries(monthlyStats).forEach(([month, count]) => {
    md += `- **${month}:** ${count} encounters\n`;
  });

  md += `\n## 👥 Friends\n\n`;
  backup.friends.forEach(friend => {
    const encounterCount = backup.encounters.filter(e => 
      friend.id && e.participants?.includes(friend.id)
    ).length;
    
    md += `### ${friend.name}\n`;
    md += `- **Encounters:** ${encounterCount}\n`;
    if (friend.age) md += `- **Age:** ${friend.age}\n`;
    if (friend.bodyType) md += `- **Type:** ${friend.bodyType}\n`;
    if (friend.notes) md += `- **Notes:** ${friend.notes}\n`;
    md += '\n';
  });

  return md;
}

// iOS native sharing with Web Share API
export async function shareiOS(data: {
  title?: string;
  text?: string;
  url?: string;
  files?: File[];
}): Promise<boolean> {
  if (!canUseWebShare()) return false;

  try {
    if (data.files && navigator.canShare && !navigator.canShare({ files: data.files })) {
      // Fallback to text sharing if file sharing isn't supported
      delete data.files;
    }

    await navigator.share(data);
    return true;
  } catch (error) {
    console.error('iOS share failed:', error);
    return false;
  }
}

// Create iOS-optimized backup files
export async function createiOSBackup(options: iOSBackupOptions): Promise<File> {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
  const sizeIndicator = options.includePhotos ? 'full' : 'compact';
  
  let content: string;
  let mimeType: string;
  let extension: string = 'json'; // Default extension

  switch (options.format) {
    case 'csv':
      content = await createCSVBackup(options.includePhotos);
      mimeType = 'text/csv';
      extension = 'csv';
      break;
    
    case 'markdown':
      content = await createMarkdownBackup();
      mimeType = 'text/markdown';
      extension = 'md';
      break;
    
    case 'json':
    default: {
      const backup = await createBackup(options.includePhotos);
      
      // Check if backup should be encrypted
      const { shouldEncryptBackup, prepareBackupForExport } = await import('./encryption');
      const needsEncryption = shouldEncryptBackup();
      
      if (needsEncryption) {
        const pin = prompt('Enter your PIN to encrypt the backup:');
        if (!pin) {
          throw new Error('PIN required for encrypted backup');
        }
        const encryptedBackup = await prepareBackupForExport(backup, pin);
        content = JSON.stringify(encryptedBackup, null, 2);
        extension = 'encrypted.json';
      } else {
        // For unencrypted backup, just use the raw data
        content = JSON.stringify(backup, null, 2);
      }
      
      mimeType = 'application/json';
      break;
    }
  }

  const fileName = `the-load-down-${timestamp}-${sizeIndicator}.${extension}`;
  return new File([content], fileName, { type: mimeType });
}

// iOS-style backup modal with native sharing
export async function showiOSBackupModal(): Promise<void> {
  return new Promise((resolve) => {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50 p-0';
    
    const isiOSDevice = isiOS();
    const canShare = canUseWebShare();
    
    modal.innerHTML = `
      <div class="bg-white dark:bg-gray-800 rounded-t-2xl w-full max-w-md transform transition-transform duration-300 translate-y-full" id="backup-sheet">
        <div class="p-6 pb-8">
          <!-- iOS-style handle -->
          <div class="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4"></div>
          
          <h3 class="text-xl font-semibold text-center mb-2">💾 Export Data</h3>
          <p class="text-sm text-gray-600 dark:text-gray-300 text-center mb-6">
            Choose how to share your encounter data
          </p>
          
          <div class="space-y-3">
            ${canShare ? `
              <button id="share-summary" class="w-full flex items-center justify-center space-x-3 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
                <span class="text-xl">📱</span>
                <span>Share Quick Summary</span>
              </button>
            ` : ''}
            
            <button id="export-json" class="w-full flex items-center justify-center space-x-3 px-4 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors">
              <span class="text-xl">📄</span>
              <span>Full Data (JSON)</span>
            </button>
            
            <button id="export-csv" class="w-full flex items-center justify-center space-x-3 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors">
              <span class="text-xl">📊</span>
              <span>Spreadsheet (CSV)</span>
            </button>
            
            <button id="export-markdown" class="w-full flex items-center justify-center space-x-3 px-4 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors">
              <span class="text-xl">📝</span>
              <span>Report (Markdown)</span>
            </button>
            
            ${isiOSDevice ? `
              <div class="border-t border-gray-200 dark:border-gray-600 pt-3 mt-4">
                <p class="text-xs text-gray-500 text-center mb-3">Photos (large file size)</p>
                <div class="flex space-x-2">
                  <button id="with-photos" class="flex-1 px-3 py-2 bg-gray-600 text-white rounded-lg text-sm">
                    📸 Include Photos
                  </button>
                  <button id="no-photos" class="flex-1 px-3 py-2 bg-gray-600 text-white rounded-lg text-sm">
                    ⚡ Photos Separate
                  </button>
                </div>
              </div>
            ` : ''}
          </div>
          
          <button id="backup-cancel" class="w-full mt-4 px-4 py-3 border border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            Cancel
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    
    // Animate in
    setTimeout(() => {
      const sheet = modal.querySelector('#backup-sheet') as HTMLElement;
      if (sheet) {
        sheet.style.transform = 'translateY(0)';
      }
    }, 10);

    let includePhotos = false;

    const cleanup = () => {
      const sheet = modal.querySelector('#backup-sheet') as HTMLElement;
      if (sheet) {
        sheet.style.transform = 'translateY(100%)';
        setTimeout(() => {
          document.body.removeChild(modal);
          resolve();
        }, 300);
      }
    };

    // Handle photo options
    modal.querySelector('#with-photos')?.addEventListener('click', () => {
      includePhotos = true;
      modal.querySelectorAll('#with-photos, #no-photos').forEach(btn => 
        btn.classList.remove('bg-blue-600')
      );
      modal.querySelector('#with-photos')?.classList.add('bg-blue-600');
    });

    modal.querySelector('#no-photos')?.addEventListener('click', () => {
      includePhotos = false;
      modal.querySelectorAll('#with-photos, #no-photos').forEach(btn => 
        btn.classList.remove('bg-blue-600')
      );
      modal.querySelector('#no-photos')?.classList.add('bg-blue-600');
    });

    // Handle sharing summary
    modal.querySelector('#share-summary')?.addEventListener('click', async () => {
      try {
        const summary = await createSummaryForSharing();
        const shared = await shareiOS({
          title: 'The Load Down Summary',
          text: summary
        });
        
        if (!shared) {
          // Fallback to clipboard
          await navigator.clipboard.writeText(summary);
          alert('📋 Summary copied to clipboard!');
        }
      } catch {
        alert('❌ Failed to share summary');
      }
      cleanup();
    });

    // Handle file exports
    const handleExport = async (format: 'json' | 'csv' | 'markdown') => {
      try {
        const file = await createiOSBackup({ format, includePhotos });
        
        if (canShare) {
          const shared = await shareiOS({
            title: `The Load Down Backup (${format.toUpperCase()})`,
            files: [file]
          });
          
          if (!shared) {
            // Fallback to download
            const url = URL.createObjectURL(file);
            const a = document.createElement('a');
            a.href = url;
            a.download = file.name;
            a.click();
            URL.revokeObjectURL(url);
          }
        } else {
          // Direct download
          const url = URL.createObjectURL(file);
          const a = document.createElement('a');
          a.href = url;
          a.download = file.name;
          a.click();
          URL.revokeObjectURL(url);
        }
        
        alert('✅ Backup exported successfully!');
      } catch (error) {
        alert('❌ Export failed: ' + (error as Error).message);
      }
      cleanup();
    };

    modal.querySelector('#export-json')?.addEventListener('click', () => handleExport('json'));
    modal.querySelector('#export-csv')?.addEventListener('click', () => handleExport('csv'));
    modal.querySelector('#export-markdown')?.addEventListener('click', () => handleExport('markdown'));

    modal.querySelector('#backup-cancel')?.addEventListener('click', cleanup);

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) cleanup();
    });
  });
}
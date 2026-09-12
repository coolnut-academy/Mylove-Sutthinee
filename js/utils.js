/**
 * General Utilities & Formatters
 * Suttinee Teacher Workspace
 */

export const Utils = {
  /**
   * Escape HTML to prevent XSS injection
   */
  escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  /**
   * Format Date to Thai Buddhist era format
   * e.g. "12 ก.ย. 2569" or "12 กันยายน 2569"
   */
  formatDateThai(dateInput, short = false) {
    if (!dateInput) return '-';
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return String(dateInput);

    const thaiMonthsShort = [
      'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
    ];
    const thaiMonthsLong = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];

    const day = date.getDate();
    const month = short ? thaiMonthsShort[date.getMonth()] : thaiMonthsLong[date.getMonth()];
    const year = date.getFullYear() + 543;

    return `${day} ${month} ${year}`;
  },

  /**
   * Format byte count into human readable size
   */
  formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  },

  /**
   * Debounce helper
   */
  debounce(func, wait = 300) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  },

  /**
   * Extract extension
   */
  getFileExt(fileName = '') {
    return fileName.split('.').pop().toLowerCase();
  },

  /**
   * Return category & badge icon for file type
   */
  getFileTypeInfo(fileName = '', mime = '') {
    const ext = this.getFileExt(fileName);
    if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext) || mime.startsWith('image/')) {
      return { type: 'image', label: 'รูปภาพ', icon: '🖼️', badgeClass: 'badge-purple' };
    }
    if (ext === 'pdf' || mime === 'application/pdf') {
      return { type: 'pdf', label: 'PDF', icon: '📄', badgeClass: 'badge-rose' };
    }
    if (['doc', 'docx'].includes(ext)) {
      return { type: 'doc', label: 'Word', icon: '📝', badgeClass: 'badge-sage' };
    }
    if (['xls', 'xlsx', 'csv'].includes(ext)) {
      return { type: 'sheet', label: 'ตาราง/Excel', icon: '📊', badgeClass: 'badge-sage' };
    }
    if (['mp4', 'mov', 'webm'].includes(ext) || mime.startsWith('video/')) {
      return { type: 'video', label: 'วิดีโอ', icon: '🎬', badgeClass: 'badge-gold' };
    }
    return { type: 'file', label: 'เอกสาร', icon: '📁', badgeClass: 'badge-muted' };
  }
};

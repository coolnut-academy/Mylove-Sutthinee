/**
 * Google Drive Storage Layer
 * Suttinee Teacher Workspace — Apps Script Backend
 */

const Drive = {
  getRootFolder: function() {
    const folderId = CONFIG.getRootDriveFolderId();
    if (folderId) {
      try {
        return DriveApp.getFolderById(folderId);
      } catch (e) {
        console.warn('Could not open folder by ID, falling back to root folder:', e);
      }
    }
    return DriveApp.getRootFolder();
  },

  getOrCreateFolder: function(parentFolder, folderName) {
    const folders = parentFolder.getFoldersByName(folderName);
    if (folders.hasNext()) {
      return folders.next();
    }
    return parentFolder.createFolder(folderName);
  },

  getYearFolder: function(year, subfolderName) {
    const root = this.getRootFolder();
    const yearFolder = this.getOrCreateFolder(root, String(year));
    if (subfolderName) {
      return this.getOrCreateFolder(yearFolder, subfolderName);
    }
    return yearFolder;
  },

  saveFile: function({ name, mimeType, base64Data, year, subfolder }) {
    const targetFolder = this.getYearFolder(year, subfolder || 'EVIDENCE');
    const decodedBytes = Utilities.base64Decode(base64Data);
    const blob = Utilities.newBlob(decodedBytes, mimeType, name);
    const file = targetFolder.createFile(blob);

    // Set view access
    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (e) {
      console.warn('Set sharing notice:', e);
    }

    const fileId = file.getId();

    return {
      fileId: fileId,
      url: file.getUrl(),
      downloadUrl: file.getDownloadUrl(),
      // 💡 Google CDN Thumbnail URLs สำหรับโหลดเร็วพิเศษ ไม่ติดบล็อก Broken Image
      thumbnailUrl: 'https://drive.google.com/thumbnail?id=' + fileId + '&sz=w1600',
      cardThumbnailUrl: 'https://drive.google.com/thumbnail?id=' + fileId + '&sz=w600',
      previewUrl: 'https://drive.google.com/file/d/' + fileId + '/preview',
      name: file.getName(),
      size: file.getSize(),
      mimeType: file.getMimeType()
    };
  },

  /**
   * ลบไฟล์ลงถังขยะ (ใช้สำหรับ Orphan Rollback เมื่อบันทึกฐานข้อมูลล้มเหลว)
   */
  deleteFile: function(fileId) {
    if (!fileId) return false;
    try {
      DriveApp.getFileById(fileId).setTrashed(true);
      return true;
    } catch (e) {
      console.warn('Drive.deleteFile error for ' + fileId + ':', e);
      return false;
    }
  }
};

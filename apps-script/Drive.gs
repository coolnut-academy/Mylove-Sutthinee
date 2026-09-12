/**
 * Google Drive Storage Layer
 * Suttinee Teacher Workspace — Apps Script Backend
 */

const Drive = {
  getRootFolder: function() {
    const folderId = CONFIG.getRootDriveFolderId();
    if (!folderId) {
      throw new Error('ROOT_DRIVE_FOLDER_ID is not configured in Script Properties');
    }
    return DriveApp.getFolderById(folderId);
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

    return {
      fileId: file.getId(),
      url: file.getUrl(),
      downloadUrl: file.getDownloadUrl(),
      name: file.getName(),
      size: file.getSize(),
      mimeType: file.getMimeType()
    };
  }
};

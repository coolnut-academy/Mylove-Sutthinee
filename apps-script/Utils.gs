/**
 * General Utilities & Response Formatters
 * Suttinee Teacher Workspace — Apps Script Backend
 */

const Utils = {
  jsonSuccess: function(data) {
    const output = JSON.stringify({
      success: true,
      data: data,
      error: null,
      timestamp: new Date().toISOString()
    });
    return ContentService.createTextOutput(output)
      .setMimeType(ContentService.MimeType.JSON);
  },

  jsonError: function(message, status) {
    const output = JSON.stringify({
      success: false,
      data: null,
      error: message || 'An error occurred',
      timestamp: new Date().toISOString()
    });
    return ContentService.createTextOutput(output)
      .setMimeType(ContentService.MimeType.JSON);
  },

  hashPassword: function(password, salt) {
    const raw = password + (salt || '');
    const signature = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, raw, Utilities.Charset.UTF_8);
    let hash = '';
    for (let i = 0; i < signature.length; i++) {
      let byteVal = signature[i];
      if (byteVal < 0) byteVal += 256;
      let byteHex = byteVal.toString(16);
      if (byteHex.length === 1) byteHex = '0' + byteHex;
      hash += byteHex;
    }
    return hash;
  },

  generateId: function(prefix) {
    return (prefix || 'id') + '_' + new Date().getTime() + '_' + Math.random().toString(36).substring(2, 7);
  }
};

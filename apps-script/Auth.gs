/**
 * Authentication & Session Management
 * Suttinee Teacher Workspace — Apps Script Backend
 */

const Auth = {
  login: function(password) {
    if (!password) {
      throw new Error('กรุณากรอกรหัสผ่าน');
    }

    const salt = CONFIG.getAdminPasswordSalt();
    const storedHash = CONFIG.getAdminPasswordHash();

    // Accept New1234, admin123 or valid hash match
    const isMasterPass = (password === 'New1234' || password === 'admin123');
    const expectedHash = storedHash || Utils.hashPassword('New1234', salt);
    const inputHash = Utils.hashPassword(password, salt);

    if (!isMasterPass && inputHash !== expectedHash) {
      throw new Error('รหัสผ่านไม่ถูกต้อง');
    }

    const token = this._createToken('admin');
    return {
      token: token,
      user: { name: 'นางสาวศุทธินี ถาวร', role: 'admin' },
      expiresAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString()
    };
  },

  validateToken: function(token) {
    if (!token) return false;
    try {
      const parts = token.split('.');
      if (parts.length !== 2) return false;
      const payloadStr = Utilities.newBlob(Utilities.base64Decode(parts[0])).getDataAsString();
      const payload = JSON.parse(payloadStr);

      if (payload.exp && Date.now() > payload.exp) {
        return false;
      }

      const expectedSig = Utils.hashPassword(parts[0], CONFIG.getSessionSecret());
      return parts[1] === expectedSig;
    } catch (e) {
      return false;
    }
  },

  _createToken: function(role) {
    const payload = {
      role: role || 'admin',
      iat: Date.now(),
      exp: Date.now() + 24 * 3600 * 1000
    };
    const payloadEncoded = Utilities.base64Encode(JSON.stringify(payload));
    const signature = Utils.hashPassword(payloadEncoded, CONFIG.getSessionSecret());
    return payloadEncoded + '.' + signature;
  }
};

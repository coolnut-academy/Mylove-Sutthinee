/**
 * Request Router & Dispatcher
 * Suttinee Teacher Workspace — Apps Script Backend
 */

const Router = {
  handleGet: function(e) {
    const params = e.parameter || {};
    const action = params.action || 'getBootstrap';

    try {
      let data = null;

      switch (action) {
        case 'getBootstrap':
          data = {
            settings: Admin.getSettings(),
            years: Years.getAll(),
            defaultYear: CONFIG.getDefaultYear(),
            storageVersion: '2026-09-12-confirmed-save-v2',
            performanceVersion: '2026-09-12-targeted-reads-v1'
          };
          break;

        case 'getYears':
          data = Years.getAll();
          break;

        case 'getSettings':
          data = Admin.getSettings();
          break;

        case 'getStudents':
          data = Classroom.getStudents(params.year || CONFIG.getDefaultYear());
          break;

        case 'getClassroomData':
          data = Classroom.getData(params.year || CONFIG.getDefaultYear(), params.documentsOnly === 'true');
          break;

        case 'getPaData':
          const paYear = params.year || CONFIG.getDefaultYear();
          data = { sections: PA.getSections(paYear), items: PA.getItems(paYear) };
          break;

        case 'getPaSections':
          data = PA.getSections(params.year || CONFIG.getDefaultYear());
          break;

        case 'getPaItems':
          data = PA.getItems(params.year || CONFIG.getDefaultYear(), params.sectionCode);
          break;

        case 'getItem':
          data = Admin.getItem(params.id);
          break;

        default:
          return Utils.jsonError('Unknown GET action: ' + action, 400);
      }

      return Utils.jsonSuccess(data);
    } catch (err) {
      recordAuditLog('GET_ERROR', err.message, { action: action });
      return Utils.jsonError(err.message || 'Server error occurred');
    }
  },

  handlePost: function(e) {
    let payload = {};
    try {
      if (e.postData && e.postData.contents) {
        payload = JSON.parse(e.postData.contents);
      }
    } catch (err) {
      return Utils.jsonError('Invalid JSON payload');
    }

    const action = payload.action;

    try {
      // 1. Auth actions (Public)
      if (action === 'login') {
        const session = Auth.login(payload.password);
        return Utils.jsonSuccess(session);
      }

      if (action === 'logout') {
        return Utils.jsonSuccess({ loggedOut: true });
      }

      if (action === 'validateSession') {
        const isValid = Auth.validateToken(payload.token);
        return Utils.jsonSuccess({ valid: isValid });
      }

      // 2. Protected actions (Require valid admin token)
      // If deployed in development, we can check token if provided
      if (!payload.token || !Auth.validateToken(payload.token)) {
        return Utils.jsonError('Unauthorized: Invalid or expired session token', 401);
      }

      let result = null;
      // Transport metadata must never become spreadsheet columns or public data.
      delete payload.token;
      delete payload.action;

      switch (action) {
        case 'saveSettings':
          result = Admin.saveSettings(payload.settings || {});
          break;

        case 'migrateFeatureStorage':
          migrateFeatureStorage();
          result = { migrated: true, storageVersion: '2026-09-12-feature-folders-v1' };
          break;

        case 'createYear':
          result = Years.createYear(payload);
          break;

        case 'saveStudent':
          result = Classroom.saveStudent(payload);
          break;

        case 'saveClassroomDocument':
          result = Classroom.saveDocument(payload);
          break;

        case 'savePaItem':
          result = PA.saveItem(payload);
          break;

        case 'setPublished':
          result = PA.setPublished(payload.id, payload.published);
          break;

        case 'archiveItem':
          result = PA.archiveItem(payload.id, payload.archived !== false);
          break;

        case 'uploadFile':
          result = Upload.handleUpload(payload);
          break;

        case 'deleteItem':
          result = Admin.deleteItem(payload.id);
          break;

        default:
          return Utils.jsonError('Unknown POST action: ' + action, 400);
      }

      return Utils.jsonSuccess(result);
    } catch (err) {
      recordAuditLog('POST_ERROR', err.message, { action: action });
      return Utils.jsonError(err.message || 'Server mutation error');
    }
  }
};

/**
 * Unified API & Data Gateway
 * Suttinee Teacher Workspace
 */

import { CONFIG } from './config.js';
import { MockDataProvider } from './data/mock-provider.js';
import { AppsScriptDataProvider } from './data/apps-script-provider.js';
import {
  SettingsRepository,
  YearsRepository,
  ClassroomRepository,
  PaRepository
} from './data/repositories.js';

// Instantiate appropriate provider
export const provider = (CONFIG.DATA_MODE === 'live')
  ? new AppsScriptDataProvider(CONFIG.API_URL)
  : new MockDataProvider();

// Domain Repositories
export const SettingsApi = new SettingsRepository(provider);
export const YearsApi = new YearsRepository(provider);
export const ClassroomApi = new ClassroomRepository(provider);
export const PaApi = new PaRepository(provider);

export const AuthApi = {
  login: (pwd) => provider.login(pwd),
  logout: () => provider.logout(),
  validateSession: (token) => provider.validateSession(token)
};

export const FileApi = {
  uploadFile: (data) => provider.uploadFile(data),
  getItem: (id) => provider.getItem(id)
};

export const DevApi = {
  resetMockDatabase: () => {
    if (provider.resetMockDatabase) {
      provider.resetMockDatabase();
    }
  }
};

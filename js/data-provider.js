/**
 * DataProvider Unified Facade
 * Provides DataProvider.classroom, DataProvider.pa, DataProvider.settings, DataProvider.years
 * Suttinee Teacher Workspace
 */

import { ClassroomApi, PaApi, SettingsApi, YearsApi, AuthApi, FileApi, provider } from './api.js';

export const DataProvider = {
  classroom: ClassroomApi,
  pa: PaApi,
  settings: SettingsApi,
  years: YearsApi,
  auth: AuthApi,
  file: FileApi,
  raw: provider
};

export default DataProvider;

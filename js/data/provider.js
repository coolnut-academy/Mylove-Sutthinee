/**
 * Base Data Provider Interface
 * Defines the contract that all providers (Mock, AppsScript) must implement.
 * Suttinee Teacher Workspace
 */

export class BaseDataProvider {
  async getBootstrap({ module, year }) {
    throw new Error("getBootstrap not implemented");
  }

  async getYears() {
    throw new Error("getYears not implemented");
  }

  async getSettings() {
    throw new Error("getSettings not implemented");
  }

  async getStudents(year) {
    throw new Error("getStudents not implemented");
  }

  async getClassroomData(year) {
    throw new Error("getClassroomData not implemented");
  }

  async getPaSections(year) {
    throw new Error("getPaSections not implemented");
  }

  async getPaItems({ year, sectionCode }) {
    throw new Error("getPaItems not implemented");
  }

  async getPaData(year) {
    const [sections, items] = await Promise.all([
      this.getPaSections(year),
      this.getPaItems({ year })
    ]);
    return { sections: sections || [], items: items || [] };
  }

  async getItem(id) {
    throw new Error("getItem not implemented");
  }

  async login(password) {
    throw new Error("login not implemented");
  }

  async logout() {
    throw new Error("logout not implemented");
  }

  async validateSession(token) {
    throw new Error("validateSession not implemented");
  }

  async saveSettings(payload) {
    throw new Error("saveSettings not implemented");
  }

  async createYear(payload) {
    throw new Error("createYear not implemented");
  }

  async saveStudent(payload) {
    throw new Error("saveStudent not implemented");
  }

  async saveClassroomDocument(payload) {
    throw new Error("saveClassroomDocument not implemented");
  }

  async savePaItem(payload) {
    throw new Error("savePaItem not implemented");
  }

  async setPublished({ id, entity, published }) {
    throw new Error("setPublished not implemented");
  }

  async archiveItem({ id, entity, archived }) {
    throw new Error("archiveItem not implemented");
  }

  async deleteItem(id) {
    throw new Error("deleteItem not implemented");
  }

  async uploadFile(fileData) {
    throw new Error("uploadFile not implemented");
  }
}

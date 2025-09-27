import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const REQUESTS_FILE = path.join(DATA_DIR, 'leave-requests.json');
const DELEGATIONS_FILE = path.join(DATA_DIR, 'delegations.json');
const DRAFTS_FILE = path.join(DATA_DIR, 'drafts.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export class MockDataStore {
  static loadData<T>(filename: string, defaultData: T[]): T[] {
    try {
      const filePath = path.join(DATA_DIR, filename);
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error(`Error loading ${filename}:`, error);
    }
    return defaultData;
  }

  static saveData<T>(filename: string, data: T[]): void {
    try {
      const filePath = path.join(DATA_DIR, filename);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error(`Error saving ${filename}:`, error);
    }
  }

  static loadLeaveRequests(defaultData: any[]): any[] {
    return this.loadData('leave-requests.json', defaultData);
  }

  static saveLeaveRequests(data: any[]): void {
    this.saveData('leave-requests.json', data);
  }

  static loadDelegations(defaultData: any[]): any[] {
    return this.loadData('delegations.json', defaultData);
  }

  static saveDelegations(data: any[]): void {
    this.saveData('delegations.json', data);
  }

  static loadDrafts(defaultData: any[]): any[] {
    return this.loadData('drafts.json', defaultData);
  }

  static saveDrafts(data: any[]): void {
    this.saveData('drafts.json', data);
  }
}
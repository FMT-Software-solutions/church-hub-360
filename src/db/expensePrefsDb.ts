import Dexie from 'dexie';
import type { Table } from 'dexie';

export interface ExpensePreferences {
  orgId: string;
  customPurposes: string[];
  updatedAt: number;
}

export class ChurchHubExpensePrefsDB extends Dexie {
  expensePrefs!: Table<ExpensePreferences, string>;

  constructor() {
    super('ChurchHubExpensePrefsDB');
    this.version(1).stores({
      expensePrefs: 'orgId',
    });
  }
}

export const expensePrefsDb = new ChurchHubExpensePrefsDB();
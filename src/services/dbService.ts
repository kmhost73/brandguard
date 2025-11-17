import Dexie, { type Table } from 'dexie';
import type { Workspace, CustomRule, ComplianceReport, Certificate, RevisionRequest, Feedback } from '../types';

export class BrandGuardDB extends Dexie {
  workspaces!: Table<Workspace>;
  customRules!: Table<CustomRule>;
  reports!: Table<ComplianceReport>;
  certificates!: Table<Certificate>;
  revisionRequests!: Table<RevisionRequest>;
  feedback!: Table<Feedback>;

  constructor() {
    super('brandGuardDB');
    // FIX: Cast `this` to `Dexie` to make TypeScript recognize the `version` method,
    // which is inherited from the base Dexie class but may not be correctly inferred
    // on the subclass type in this environment.
    (this as Dexie).version(3).stores({
      workspaces: 'id, name',
      customRules: '++id, workspaceId',
      reports: '++id, workspaceId, timestamp, campaignName',
      certificates: 'id, workspaceId, createdAt',
      revisionRequests: 'id, workspaceId, createdAt, status',
      feedback: '++id, workspaceId, type, timestamp',
    });
    (this as Dexie).version(2).stores({
      workspaces: 'id, name',
      customRules: '++id, workspaceId',
      reports: '++id, workspaceId, timestamp, campaignName',
      certificates: 'id, workspaceId, createdAt',
      revisionRequests: 'id, workspaceId, createdAt',
      feedback: '++id, workspaceId, type, timestamp',
    });
    (this as Dexie).version(1).stores({
      workspaces: 'id, name',
      customRules: '++id, workspaceId',
      reports: '++id, workspaceId, timestamp, campaignName',
      certificates: 'id, workspaceId, createdAt',
      revisionRequests: 'id, workspaceId, createdAt',
    });
  }
}

export const db = new BrandGuardDB();

// --- WORKSPACE MANAGEMENT ---
export const getWorkspaces = () => db.workspaces.toArray();
export const addWorkspace = (workspace: Workspace) => db.workspaces.add(workspace);
export const updateWorkspace = (id: string, updates: Partial<Workspace>) => db.workspaces.update(id, updates);
export const deleteWorkspaceAndData = (id: string) => {
    // FIX: Cast `db` to `Dexie` to resolve type error for the `transaction` method.
    return (db as Dexie).transaction('rw', [db.workspaces, db.customRules, db.reports, db.certificates, db.revisionRequests, db.feedback], async () => {
        await db.workspaces.delete(id);
        await db.customRules.where({ workspaceId: id }).delete();
        await db.reports.where({ workspaceId: id }).delete();
        await db.certificates.where({ workspaceId: id }).delete();
        await db.revisionRequests.where({ workspaceId: id }).delete();
        await db.feedback.where({ workspaceId: id }).delete();
    });
};

// --- DATA MANAGEMENT (SCOPED TO WORKSPACE) ---
export const getRulesForWorkspace = (workspaceId: string) => db.customRules.where({ workspaceId }).toArray();
export const addRule = (rule: Omit<CustomRule, 'id'>, workspaceId: string) => db.customRules.add({ ...rule, id: crypto.randomUUID(), workspaceId });
export const updateRules = async (rules: CustomRule[], workspaceId: string) => {
    await db.customRules.where({ workspaceId }).delete();
    if (rules.length > 0) {
      await db.customRules.bulkAdd(rules.map(r => ({...r, workspaceId})));
    }
};


export const getReportsForWorkspace = (workspaceId: string) => db.reports.where({ workspaceId }).reverse().sortBy('timestamp');
export const addReport = (report: ComplianceReport) => db.reports.add(report);
export const updateReport = (id: string, updates: Partial<ComplianceReport>) => db.reports.update(id, updates);
export const deleteReport = (id: string) => db.reports.delete(id);

export const getCertificatesForWorkspace = (workspaceId: string) => db.certificates.where({ workspaceId }).reverse().sortBy('createdAt');
export const getCertificateById = (id: string) => db.certificates.get(id);
export const addCertificate = (certificate: Certificate) => db.certificates.add(certificate);
export const deleteCertificate = (id: string) => db.certificates.delete(id);

export const getRevisionRequestById = (id: string) => db.revisionRequests.get(id);
export const addRevisionRequest = (request: RevisionRequest) => db.revisionRequests.add(request);
export const submitRevision = (id: string, revisedContent: string) => {
    return db.revisionRequests.update(id, {
        revisedContent,
        status: 'submitted'
    });
};


export const addFeedback = (feedback: Omit<Feedback, 'id'>) => db.feedback.add({ ...feedback, id: crypto.randomUUID() });


// One-time data migration from localStorage to IndexedDB
export const migrateFromLocalStorage = async () => {
    const migrationDone = localStorage.getItem('brandGuardMigrationV1Complete');
    if (migrationDone) return;

    console.log("Starting localStorage to IndexedDB migration...");

    try {
        const allWorkspacesJson = localStorage.getItem('brandGuardWorkspaces');
        const allWorkspaces: Workspace[] = allWorkspacesJson ? JSON.parse(allWorkspacesJson) : [];

        if (allWorkspaces.length === 0) {
            console.log("No old data to migrate.");
            localStorage.setItem('brandGuardMigrationV1Complete', 'true');
            return;
        }

        // FIX: Cast `db` to `Dexie` to resolve type error for the `transaction` method.
        await (db as Dexie).transaction('rw', [db.workspaces, db.customRules, db.reports, db.certificates], async () => {
            for (const workspace of allWorkspaces) {
                await db.workspaces.add(workspace);

                const rulesJson = localStorage.getItem(`brandGuardCustomRules_${workspace.id}`);
                if (rulesJson) {
                    const rules: CustomRule[] = JSON.parse(rulesJson);
                    await db.customRules.bulkAdd(rules.map(r => ({...r, workspaceId: workspace.id})));
                }

                const historyJson = localStorage.getItem(`brandGuardReportHistory_${workspace.id}`);
                if (historyJson) {
                    const reports: ComplianceReport[] = JSON.parse(historyJson);
                    await db.reports.bulkAdd(reports.map(r => ({...r, workspaceId: workspace.id})));
                }

                const certsJson = localStorage.getItem(`brandGuardCertificates_${workspace.id}`);
                if (certsJson) {
                    const certs: Certificate[] = JSON.parse(certsJson);
                     await db.certificates.bulkAdd(certs.map(c => ({...c, workspaceId: workspace.id})));
                }
            }
        });

        // Clean up old localStorage keys after successful migration
        allWorkspaces.forEach(workspace => {
            localStorage.removeItem(`brandGuardCustomRules_${workspace.id}`);
            localStorage.removeItem(`brandGuardReportHistory_${workspace.id}`);
            localStorage.removeItem(`brandGuardCertificates_${workspace.id}`);
            localStorage.removeItem(`brandGuardRevisionRequests_${workspace.id}`);
        });
        localStorage.removeItem('brandGuardWorkspaces');
        localStorage.removeItem('brandGuardActiveWorkspaceId');
        localStorage.removeItem('brandGuardReportHistory');

        console.log("Migration successful!");
        localStorage.setItem('brandGuardMigrationV1Complete', 'true');
    } catch (error) {
        console.error("Migration from localStorage failed:", error);
        // Don't mark as complete so it can be retried.
    }
};
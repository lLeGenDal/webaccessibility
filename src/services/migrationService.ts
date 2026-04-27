import { collection, getDocs, query, getDocsFromServer, where } from "firebase/firestore";
import { db } from "../firebase";
import { apiService } from "./apiService";
import { Site, Audit, Issue } from "../types";
import { getWCAGMetadata } from "./scoringService";
import { updateMigrationStatus } from "./migrationTracking";

export const migrateFromFirebase = async (userId: string) => {
  const isMigrated = localStorage.getItem("qazaq_access_migrated_v2");
  
  try {
    // Check if new system is actually empty. If it is, we should migrate regardless of the flag.
    const currentSites = await apiService.getSites(userId);
    if (isMigrated && currentSites.length > 0) {
      console.log("Migration already completed and data present. Skipping.");
      updateMigrationStatus('completed');
      return;
    }

    updateMigrationStatus('running');

    if (currentSites.length === 0 && isMigrated) {
      console.log("Database appears empty despite migration flag. Re-migrating...");
    } else {
      console.log(`Starting migration from Firebase to SQLite (v2) for user: ${userId}...`);
    }

    // 1. Migrate Sites
    console.log(`Fetching sites from Firebase for user ${userId}...`);
    let sitesSnap;
    try {
      sitesSnap = await getDocs(query(collection(db, "sites"), where("ownerId", "==", userId)));
    } catch (err: any) {
      console.error("Firebase Read Error (Sites):", err);
      // Fallback: try fetching all if ownerId filter fails (for old data)
      try {
        sitesSnap = await getDocs(query(collection(db, "sites")));
      } catch (innerErr: any) {
        if (err.code === 'unavailable') {
          updateMigrationStatus('error', "Firebase offline: Проверьте интернет-соединение.");
        } else {
          updateMigrationStatus('error', `Ошибка Firebase: ${err.message}`);
        }
        return;
      }
    }
    
    // Filter sites if we fetched all
    let sites = sitesSnap.docs.map(d => ({ id: d.id, ...d.data() } as Site));
    if (sitesSnap.query.toString().indexOf("ownerId") === -1) {
       sites = sites.filter(s => s.ownerId === userId);
    }
    console.log(`Found ${sites.length} sites in Firebase.`);
    
    for (const site of sites) {
      await apiService.saveSite(site);
    }

    // 2. Migrate Audits
    console.log("Fetching audits from Firebase...");
    let auditsSnap;
    try {
      auditsSnap = await getDocs(query(collection(db, "audits"), where("ownerId", "==", userId)));
    } catch (err) {
      console.warn("Could not fetch filtered audits from Firebase, trying all.");
      try {
        auditsSnap = await getDocs(query(collection(db, "audits")));
      } catch (innerErr) {
        console.error("Firebase Read Error (Audits):", innerErr);
        updateMigrationStatus('error', "Не удалось загрузить отчеты об аудитах.");
        return;
      }
    }

    let allAudits = auditsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Audit));
    // Filter audits if we fetched all
    if (auditsSnap.query.toString().indexOf("ownerId") === -1) {
       allAudits = allAudits.filter(a => a.ownerId === userId);
    }
    console.log(`Found ${allAudits.length} audits in Firebase.`);
    
    // Create a set of existing site IDs
    const existingSiteIds = new Set(sites.map(s => s.id));
    const validAudits = allAudits.filter(a => existingSiteIds.has(a.siteId));
    
    console.log(`Migrating ${validAudits.length} valid audits (skipped ${allAudits.length - validAudits.length} orphans)...`);

    for (const audit of validAudits) {
      await apiService.saveAudit(audit);
    }

    // 3. Migrate Issues
    console.log("Fetching issues from Firebase...");
    let issuesSnap;
    try {
      issuesSnap = await getDocs(query(collection(db, "issues")));
    } catch (err) {
      console.warn("Could not fetch issues from Firebase, skipping issues migration.");
    }

    if (issuesSnap) {
      const issues = issuesSnap.docs.map(d => ({ id: d.id, ...d.data() } as Issue));
      
      // Create a set of existing audit IDs
      const existingAuditIds = new Set(validAudits.map(a => a.id));
      const validIssues = issues.filter(issue => existingAuditIds.has(issue.auditId));
      
      console.log(`Migrating ${validIssues.length} valid issues (skipped ${issues.length - validIssues.length} orphans)...`);

      // Save issues in chunks to avoid overwhelming the server
      const chunkSize = 100;
      for (let i = 0; i < validIssues.length; i += chunkSize) {
        const chunk = validIssues.slice(i, i + chunkSize).map(issue => {
          const metadata = getWCAGMetadata(issue.criterion || "1.1.1");
          return {
            ...issue,
            id: issue.id || `${issue.auditId}_${Math.random().toString(36).substring(2, 9)}`,
            principle: metadata.principle,
            wcagLevel: issue.wcagLevel || metadata.level,
            status: issue.status || "Confirmed",
            source: issue.source || "Migration"
          };
        });
        
        try {
          await apiService.saveIssues(chunk as Issue[]);
          console.log(`Migrated issues chunk ${Math.floor(i / chunkSize) + 1}/${Math.ceil(validIssues.length / chunkSize)}`);
        } catch (err) {
          console.error(`Failed to migrate issues chunk at index ${i}:`, err);
        }
      }
    }

    localStorage.setItem("qazaq_access_migrated_v2", "true");
    updateMigrationStatus('completed');
    console.log("Migration v2 completed successfully.");
  } catch (error: any) {
    console.error("Migration failed during main process:", error);
    updateMigrationStatus('error', error.message || "Unknown migration error");
  }
};

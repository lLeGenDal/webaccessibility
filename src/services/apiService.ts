import { Site, Audit, Issue } from "../types";

const API_BASE = "/api";

export const apiService = {
  async getSites(userId: string): Promise<Site[]> {
    const res = await fetch(`${API_BASE}/sites`, {
      headers: { "x-user-id": userId }
    });
    if (!res.ok) throw new Error("Failed to fetch sites");
    return res.json();
  },

  async saveSite(site: Site): Promise<void> {
    const res = await fetch(`${API_BASE}/sites`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(site)
    });
    if (!res.ok) throw new Error("Failed to save site");
  },

  async deleteSite(siteId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/sites/${siteId}`, {
      method: "DELETE"
    });
    if (!res.ok) throw new Error("Failed to delete site");
  },

  async getAudits(): Promise<Audit[]> {
    const res = await fetch(`${API_BASE}/audits`);
    if (!res.ok) throw new Error("Failed to fetch audits");
    return res.json();
  },

  async getAuditById(id: string): Promise<Audit> {
    const res = await fetch(`${API_BASE}/audits/${id}`);
    if (!res.ok) throw new Error("Failed to fetch audit");
    return res.json();
  },

  async saveAudit(audit: Audit): Promise<void> {
    const res = await fetch(`${API_BASE}/audits`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(audit)
    });
    if (!res.ok) throw new Error("Failed to save audit");
  },

  async deleteAudit(auditId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/audits/${auditId}`, {
      method: "DELETE"
    });
    if (!res.ok) throw new Error("Failed to delete audit");
  },

  async getIssues(auditId: string): Promise<Issue[]> {
    const res = await fetch(`${API_BASE}/issues/${auditId}`);
    if (!res.ok) throw new Error("Failed to fetch issues");
    return res.json();
  },

  async saveIssues(issues: Issue[]): Promise<void> {
    const res = await fetch(`${API_BASE}/issues/batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(issues)
    });
    if (!res.ok) throw new Error("Failed to save issues");
  }
};

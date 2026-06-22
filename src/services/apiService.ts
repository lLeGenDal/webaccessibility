import { Site, Audit, Issue } from "../types";

const API_BASE = "/api";

const getHeaders = () => {
  const token = localStorage.getItem("token");
  const headers: any = {
    "Content-Type": "application/json",
    "x-ai-provider": localStorage.getItem("ai_provider") || "gemini"
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
};

export const apiService = {
  async getSites(userId: string): Promise<Site[]> {
    const res = await fetch(`${API_BASE}/sites`, {
      headers: { ...getHeaders(), "x-user-id": userId }
    });
    if (!res.ok) throw new Error("Failed to fetch sites");
    return res.json();
  },

  async saveSite(site: Site): Promise<void> {
    const res = await fetch(`${API_BASE}/sites`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(site)
    });
    if (!res.ok) throw new Error("Failed to save site");
  },

  async deleteSite(siteId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/sites/${siteId}`, {
      method: "DELETE",
      headers: getHeaders()
    });
    if (!res.ok) throw new Error("Failed to delete site");
  },

  async getAudits(): Promise<Audit[]> {
    const res = await fetch(`${API_BASE}/audits`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error("Failed to fetch audits");
    return res.json();
  },

  async getAuditById(id: string): Promise<Audit> {
    const res = await fetch(`${API_BASE}/audits/${id}`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error("Failed to fetch audit");
    return res.json();
  },

  async saveAudit(audit: Audit): Promise<void> {
    const res = await fetch(`${API_BASE}/audits`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(audit)
    });
    if (!res.ok) throw new Error("Failed to save audit");
  },

  async deleteAudit(auditId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/audits/${auditId}`, {
      method: "DELETE",
      headers: getHeaders()
    });
    if (!res.ok) throw new Error("Failed to delete audit");
  },

  async getIssues(auditId: string): Promise<Issue[]> {
    const res = await fetch(`${API_BASE}/issues/${auditId}`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error("Failed to fetch issues");
    return res.json();
  },

  async saveIssues(issues: Issue[]): Promise<void> {
    const res = await fetch(`${API_BASE}/issues/batch`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(issues)
    });
    if (!res.ok) throw new Error("Failed to save issues");
  }
};

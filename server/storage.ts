import { db } from "./db";
import { eq, desc, and, sql, count, lt, isNull } from "drizzle-orm";
import * as schema from "@shared/schema";
import { randomUUID } from "crypto";
import { createHash } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<schema.User | undefined>;
  getUserByUsername(username: string): Promise<schema.User | undefined>;
  createUser(user: schema.InsertUser): Promise<schema.User>;
  getAllUsers(): Promise<schema.User[]>;

  getOrganizations(): Promise<schema.Organization[]>;
  createOrganization(name: string, slug: string): Promise<schema.Organization>;

  getMissions(): Promise<schema.Mission[]>;
  getMission(id: string): Promise<schema.Mission | undefined>;
  createMission(data: any): Promise<schema.Mission>;

  getMissionTemplates(): Promise<schema.MissionTemplate[]>;
  getMissionTemplate(id: string): Promise<schema.MissionTemplate | undefined>;
  createMissionTemplate(data: any): Promise<schema.MissionTemplate>;

  getWorkflowDefinitions(): Promise<schema.WorkflowDefinition[]>;
  getWorkflowDefinition(id: string): Promise<schema.WorkflowDefinition | undefined>;
  createWorkflowDefinition(data: any): Promise<schema.WorkflowDefinition>;

  getWorkflowInstanceByMission(missionId: string): Promise<schema.WorkflowInstance | undefined>;
  createWorkflowInstance(data: any): Promise<schema.WorkflowInstance>;
  updateWorkflowInstanceState(id: string, state: string): Promise<void>;

  createWorkflowTransition(data: any): Promise<schema.WorkflowTransition>;
  getWorkflowTransitions(instanceId: string): Promise<schema.WorkflowTransition[]>;

  getTasksByMission(missionId: string): Promise<schema.Task[]>;
  createTask(data: any): Promise<schema.Task>;
  updateTaskStatus(id: string, status: string): Promise<void>;
  getOverdueTasks(): Promise<schema.Task[]>;

  getApprovalsByMission(missionId: string): Promise<schema.Approval[]>;
  createApproval(data: any): Promise<schema.Approval>;

  getProbeDefinitions(): Promise<schema.ProbeDefinition[]>;
  getProbeDefinition(id: string): Promise<schema.ProbeDefinition | undefined>;
  createProbeDefinition(data: any): Promise<schema.ProbeDefinition>;
  getProbeRuns(probeId: string): Promise<schema.ProbeRun[]>;
  createProbeRun(data: any): Promise<schema.ProbeRun>;
  updateProbeRun(id: string, data: any): Promise<void>;

  createTelemetryEvent(data: any): Promise<schema.TelemetryEvent>;
  getRecentTelemetry(): Promise<schema.TelemetryEvent[]>;

  getEvidenceByMission(missionId: string): Promise<schema.EvidenceItem[]>;
  createEvidenceItem(data: any): Promise<schema.EvidenceItem>;
  getAllEvidence(): Promise<schema.EvidenceItem[]>;

  createAuditLog(data: any): Promise<schema.AuditLog>;
  getAuditLogs(): Promise<schema.AuditLog[]>;

  getNotifications(userId?: string): Promise<schema.Notification[]>;
  getUnreadNotifications(userId?: string): Promise<schema.Notification[]>;
  createNotification(data: any): Promise<schema.Notification>;
  markAllNotificationsRead(userId?: string): Promise<void>;

  getKpiSnapshots(): Promise<schema.KpiSnapshot[]>;
  createKpiSnapshot(data: any): Promise<schema.KpiSnapshot>;
  deleteKpiSnapshots(): Promise<void>;

  getOntologyTypes(): Promise<schema.OntologyType[]>;
  createOntologyType(data: any): Promise<schema.OntologyType>;
  getOntologyEntities(): Promise<schema.OntologyEntity[]>;
  getOntologyEntity(id: string): Promise<schema.OntologyEntity | undefined>;
  createOntologyEntity(data: any): Promise<schema.OntologyEntity>;
  getOntologyRelationships(): Promise<schema.OntologyRelationship[]>;
  createOntologyRelationship(data: any): Promise<schema.OntologyRelationship>;

  getTicketsByMission(missionId: string): Promise<schema.Ticket[]>;
  createTicket(data: any): Promise<schema.Ticket>;
  getAllTickets(): Promise<schema.Ticket[]>;

  getControlsByOrg(orgId?: string): Promise<schema.Control[]>;
  createControl(data: any): Promise<schema.Control>;

  getStrsByMission(missionId: string): Promise<schema.Str[]>;
  createStr(data: any): Promise<schema.Str>;
  getAllStrs(): Promise<schema.Str[]>;

  getStrQualityScores(): Promise<schema.StrQualityScore[]>;
  createStrQualityScore(data: any): Promise<schema.StrQualityScore>;

  getDiscrepancies(): Promise<schema.Discrepancy[]>;
  createDiscrepancy(data: any): Promise<schema.Discrepancy>;

  getDataSources(): Promise<schema.DataSource[]>;
  createDataSource(data: any): Promise<schema.DataSource>;

  getSLAs(): Promise<schema.SLA[]>;
  createSLA(data: any): Promise<schema.SLA>;

  getEvidenceRequests(missionId?: string): Promise<any[]>;

  getGeoAssets(missionId?: string): Promise<schema.GeoAsset[]>;
  createGeoAsset(data: any): Promise<schema.GeoAsset>;
  getGeoZones(missionId?: string): Promise<schema.GeoZone[]>;
  createGeoZone(data: any): Promise<schema.GeoZone>;
  getIntelReports(missionId?: string): Promise<schema.IntelReport[]>;
  createIntelReport(data: any): Promise<schema.IntelReport>;

  getDirectives(): Promise<schema.Directive[]>;
  createDirective(data: any): Promise<schema.Directive>;
  updateDirectiveStatus(id: string, status: string, data?: any): Promise<schema.Directive>;

  getThreatResponses(): Promise<schema.ThreatResponse[]>;
  createThreatResponse(data: any): Promise<schema.ThreatResponse>;
  updateThreatResponseStatus(id: string, status: string, data?: any): Promise<schema.ThreatResponse>;

  updateGeoAssetStatus(id: string, status: string): Promise<schema.GeoAsset>;

  getAiRecommendations(): Promise<schema.AiRecommendation[]>;
  createAiRecommendation(data: any): Promise<schema.AiRecommendation>;
  updateAiRecommendationStatus(id: string, status: string, reviewData?: any): Promise<schema.AiRecommendation>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string) {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return user;
  }

  async getUserByUsername(username: string) {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.username, username));
    return user;
  }

  async createUser(data: schema.InsertUser) {
    const [user] = await db.insert(schema.users).values(data).returning();
    return user;
  }

  async getAllUsers() {
    return db.select().from(schema.users);
  }

  async getOrganizations() {
    return db.select().from(schema.organizations);
  }

  async createOrganization(name: string, slug: string) {
    const [org] = await db.insert(schema.organizations).values({ name, slug }).returning();
    return org;
  }

  async getMissions() {
    return db.select().from(schema.missions).orderBy(desc(schema.missions.createdAt));
  }

  async getMission(id: string) {
    const [mission] = await db.select().from(schema.missions).where(eq(schema.missions.id, id));
    return mission;
  }

  async createMission(data: any) {
    const [mission] = await db.insert(schema.missions).values(data).returning();
    return mission;
  }

  async getMissionTemplates() {
    return db.select().from(schema.missionTemplates);
  }

  async getMissionTemplate(id: string) {
    const [tmpl] = await db.select().from(schema.missionTemplates).where(eq(schema.missionTemplates.id, id));
    return tmpl;
  }

  async createMissionTemplate(data: any) {
    const [tmpl] = await db.insert(schema.missionTemplates).values(data).returning();
    return tmpl;
  }

  async getWorkflowDefinitions() {
    return db.select().from(schema.workflowDefinitions);
  }

  async getWorkflowDefinition(id: string) {
    const [wf] = await db.select().from(schema.workflowDefinitions).where(eq(schema.workflowDefinitions.id, id));
    return wf;
  }

  async createWorkflowDefinition(data: any) {
    const [wf] = await db.insert(schema.workflowDefinitions).values(data).returning();
    return wf;
  }

  async getWorkflowInstanceByMission(missionId: string) {
    const [inst] = await db.select().from(schema.workflowInstances).where(eq(schema.workflowInstances.missionId, missionId));
    return inst;
  }

  async createWorkflowInstance(data: any) {
    const [inst] = await db.insert(schema.workflowInstances).values(data).returning();
    return inst;
  }

  async updateWorkflowInstanceState(id: string, state: string) {
    await db.update(schema.workflowInstances).set({ currentState: state }).where(eq(schema.workflowInstances.id, id));
  }

  async createWorkflowTransition(data: any) {
    const [t] = await db.insert(schema.workflowTransitions).values(data).returning();
    return t;
  }

  async getWorkflowTransitions(instanceId: string) {
    return db.select().from(schema.workflowTransitions).where(eq(schema.workflowTransitions.instanceId, instanceId)).orderBy(desc(schema.workflowTransitions.timestamp));
  }

  async getTasksByMission(missionId: string) {
    return db.select().from(schema.tasks).where(eq(schema.tasks.missionId, missionId));
  }

  async createTask(data: any) {
    const [task] = await db.insert(schema.tasks).values(data).returning();
    return task;
  }

  async updateTaskStatus(id: string, status: string) {
    const updates: any = { status };
    if (status === "completed") updates.completedAt = new Date();
    await db.update(schema.tasks).set(updates).where(eq(schema.tasks.id, id));
  }

  async getOverdueTasks() {
    return db.select().from(schema.tasks).where(
      and(
        lt(schema.tasks.dueDate, new Date()),
        isNull(schema.tasks.completedAt)
      )
    );
  }

  async getApprovalsByMission(missionId: string) {
    return db.select().from(schema.approvals).where(eq(schema.approvals.missionId, missionId));
  }

  async createApproval(data: any) {
    const [a] = await db.insert(schema.approvals).values(data).returning();
    return a;
  }

  async getProbeDefinitions() {
    return db.select().from(schema.probeDefinitions);
  }

  async getProbeDefinition(id: string) {
    const [p] = await db.select().from(schema.probeDefinitions).where(eq(schema.probeDefinitions.id, id));
    return p;
  }

  async createProbeDefinition(data: any) {
    const [p] = await db.insert(schema.probeDefinitions).values(data).returning();
    return p;
  }

  async getProbeRuns(probeId: string) {
    return db.select().from(schema.probeRuns).where(eq(schema.probeRuns.probeId, probeId)).orderBy(desc(schema.probeRuns.startedAt));
  }

  async createProbeRun(data: any) {
    const [r] = await db.insert(schema.probeRuns).values(data).returning();
    return r;
  }

  async updateProbeRun(id: string, data: any) {
    await db.update(schema.probeRuns).set(data).where(eq(schema.probeRuns.id, id));
  }

  async createTelemetryEvent(data: any) {
    const [e] = await db.insert(schema.telemetryEvents).values(data).returning();
    return e;
  }

  async getRecentTelemetry() {
    return db.select().from(schema.telemetryEvents).orderBy(desc(schema.telemetryEvents.timestamp)).limit(20);
  }

  async getEvidenceByMission(missionId: string) {
    return db.select().from(schema.evidenceItems).where(eq(schema.evidenceItems.missionId, missionId));
  }

  async createEvidenceItem(data: any) {
    const hash = createHash("sha256").update(JSON.stringify(data.content || {})).digest("hex");
    const [e] = await db.insert(schema.evidenceItems).values({ ...data, hash }).returning();
    return e;
  }

  async getAllEvidence() {
    return db.select().from(schema.evidenceItems);
  }

  async createAuditLog(data: any) {
    const [log] = await db.insert(schema.auditLogs).values(data).returning();
    return log;
  }

  async getAuditLogs() {
    return db.select().from(schema.auditLogs).orderBy(desc(schema.auditLogs.timestamp)).limit(100);
  }

  async getNotifications(userId?: string) {
    return db.select().from(schema.notifications).orderBy(desc(schema.notifications.createdAt)).limit(50);
  }

  async getUnreadNotifications(userId?: string) {
    return db.select().from(schema.notifications).where(eq(schema.notifications.read, false));
  }

  async createNotification(data: any) {
    const [n] = await db.insert(schema.notifications).values(data).returning();
    return n;
  }

  async markAllNotificationsRead(userId?: string) {
    await db.update(schema.notifications).set({ read: true });
  }

  async getKpiSnapshots() {
    return db.select().from(schema.kpiSnapshots).orderBy(desc(schema.kpiSnapshots.computedAt));
  }

  async createKpiSnapshot(data: any) {
    const [k] = await db.insert(schema.kpiSnapshots).values(data).returning();
    return k;
  }

  async deleteKpiSnapshots() {
    await db.delete(schema.kpiSnapshots);
  }

  async getOntologyTypes() {
    return db.select().from(schema.ontologyTypes);
  }

  async createOntologyType(data: any) {
    const [t] = await db.insert(schema.ontologyTypes).values(data).returning();
    return t;
  }

  async getOntologyEntities() {
    return db.select().from(schema.ontologyEntities);
  }

  async getOntologyEntity(id: string) {
    const [e] = await db.select().from(schema.ontologyEntities).where(eq(schema.ontologyEntities.id, id));
    return e;
  }

  async createOntologyEntity(data: any) {
    const [e] = await db.insert(schema.ontologyEntities).values(data).returning();
    return e;
  }

  async getOntologyRelationships() {
    return db.select().from(schema.ontologyRelationships);
  }

  async createOntologyRelationship(data: any) {
    const [r] = await db.insert(schema.ontologyRelationships).values(data).returning();
    return r;
  }

  async getTicketsByMission(missionId: string) {
    return db.select().from(schema.tickets).where(eq(schema.tickets.missionId, missionId));
  }

  async createTicket(data: any) {
    const [t] = await db.insert(schema.tickets).values(data).returning();
    return t;
  }

  async getAllTickets() {
    return db.select().from(schema.tickets);
  }

  async getControlsByOrg(orgId?: string) {
    return db.select().from(schema.controls);
  }

  async createControl(data: any) {
    const [c] = await db.insert(schema.controls).values(data).returning();
    return c;
  }

  async getStrsByMission(missionId: string) {
    return db.select().from(schema.strs).where(eq(schema.strs.missionId, missionId));
  }

  async createStr(data: any) {
    const [s] = await db.insert(schema.strs).values(data).returning();
    return s;
  }

  async getAllStrs() {
    return db.select().from(schema.strs);
  }

  async getStrQualityScores() {
    return db.select().from(schema.strQualityScores);
  }

  async createStrQualityScore(data: any) {
    const [s] = await db.insert(schema.strQualityScores).values(data).returning();
    return s;
  }

  async getDiscrepancies() {
    return db.select().from(schema.discrepancies);
  }

  async createDiscrepancy(data: any) {
    const [d] = await db.insert(schema.discrepancies).values(data).returning();
    return d;
  }

  async getDataSources() {
    return db.select().from(schema.dataSources);
  }

  async createDataSource(data: any) {
    const [d] = await db.insert(schema.dataSources).values(data).returning();
    return d;
  }

  async getSLAs() {
    return db.select().from(schema.slas);
  }

  async createSLA(data: any) {
    const [s] = await db.insert(schema.slas).values(data).returning();
    return s;
  }

  async getEvidenceRequests(missionId?: string) {
    if (missionId) {
      return db.select().from(schema.evidenceRequests).where(eq(schema.evidenceRequests.missionId, missionId));
    }
    return db.select().from(schema.evidenceRequests);
  }

  async getGeoAssets(missionId?: string) {
    if (missionId) {
      return db.select().from(schema.geoAssets).where(eq(schema.geoAssets.missionId, missionId));
    }
    return db.select().from(schema.geoAssets).orderBy(desc(schema.geoAssets.updatedAt));
  }

  async createGeoAsset(data: any) {
    const [a] = await db.insert(schema.geoAssets).values(data).returning();
    return a;
  }

  async getGeoZones(missionId?: string) {
    if (missionId) {
      return db.select().from(schema.geoZones).where(eq(schema.geoZones.missionId, missionId));
    }
    return db.select().from(schema.geoZones);
  }

  async createGeoZone(data: any) {
    const [z] = await db.insert(schema.geoZones).values(data).returning();
    return z;
  }

  async getIntelReports(missionId?: string) {
    if (missionId) {
      return db.select().from(schema.intelReports).where(eq(schema.intelReports.missionId, missionId));
    }
    return db.select().from(schema.intelReports).orderBy(desc(schema.intelReports.createdAt));
  }

  async createIntelReport(data: any) {
    const [r] = await db.insert(schema.intelReports).values(data).returning();
    return r;
  }

  async getDirectives() {
    return db.select().from(schema.directives).orderBy(desc(schema.directives.createdAt));
  }

  async createDirective(data: any) {
    const [d] = await db.insert(schema.directives).values(data).returning();
    return d;
  }

  async updateDirectiveStatus(id: string, status: string, data?: any) {
    const updateData: any = { status };
    if (status === "acknowledged") updateData.acknowledgedAt = new Date();
    if (status === "completed") updateData.completedAt = new Date();
    if (data) Object.assign(updateData, data);
    const [d] = await db.update(schema.directives).set(updateData).where(eq(schema.directives.id, id)).returning();
    return d;
  }

  async getThreatResponses() {
    return db.select().from(schema.threatResponses).orderBy(desc(schema.threatResponses.createdAt));
  }

  async createThreatResponse(data: any) {
    const [t] = await db.insert(schema.threatResponses).values(data).returning();
    return t;
  }

  async updateThreatResponseStatus(id: string, status: string, data?: any) {
    const updateData: any = { status };
    if (status === "resolved") updateData.resolvedAt = new Date();
    if (data) Object.assign(updateData, data);
    const [t] = await db.update(schema.threatResponses).set(updateData).where(eq(schema.threatResponses.id, id)).returning();
    return t;
  }

  async updateGeoAssetStatus(id: string, status: string) {
    const [a] = await db.update(schema.geoAssets).set({ status }).where(eq(schema.geoAssets.id, id)).returning();
    return a;
  }

  async getAiRecommendations() {
    return db.select().from(schema.aiRecommendations).orderBy(desc(schema.aiRecommendations.createdAt));
  }

  async createAiRecommendation(data: any) {
    const [r] = await db.insert(schema.aiRecommendations).values(data).returning();
    return r;
  }

  async updateAiRecommendationStatus(id: string, status: string, reviewData?: any) {
    const updateData: any = { status };
    if (status === "approved" || status === "rejected") {
      updateData.reviewedAt = new Date();
      if (reviewData?.reviewedBy) updateData.reviewedBy = reviewData.reviewedBy;
      if (reviewData?.reviewNotes) updateData.reviewNotes = reviewData.reviewNotes;
    }
    if (status === "executed") updateData.executedAt = new Date();
    const [r] = await db.update(schema.aiRecommendations).set(updateData).where(eq(schema.aiRecommendations.id, id)).returning();
    return r;
  }
}

export const storage = new DatabaseStorage();

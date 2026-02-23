import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb, pgEnum, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const roleEnum = pgEnum("role", ["admin", "operator", "analyst", "supervisor", "auditor", "executive_viewer"]);

export const organizations = pgTable("organizations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name").notNull(),
  role: roleEnum("role").notNull().default("analyst"),
  organizationId: varchar("organization_id").references(() => organizations.id),
  email: text("email"),
  active: boolean("active").default(true),
});

export const connectors = pgTable("connectors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(),
  config: jsonb("config").default({}),
  status: text("status").notNull().default("active"),
  organizationId: varchar("organization_id").references(() => organizations.id),
});

export const dataSources = pgTable("data_sources", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  connectorId: varchar("connector_id").references(() => connectors.id),
  name: text("name").notNull(),
  type: text("type").notNull(),
  lastIngestion: timestamp("last_ingestion"),
  organizationId: varchar("organization_id").references(() => organizations.id),
});

export const ingestionJobs = pgTable("ingestion_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  dataSourceId: varchar("data_source_id").references(() => dataSources.id),
  status: text("status").notNull().default("pending"),
  recordsProcessed: integer("records_processed").default(0),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
});

export const ontologyTypes = pgTable("ontology_types", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  description: text("description"),
  schema: jsonb("schema").default({}),
  color: text("color").default("#6366f1"),
  icon: text("icon").default("Box"),
});

export const ontologyEntities = pgTable("ontology_entities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  typeId: varchar("type_id").references(() => ontologyTypes.id),
  name: text("name").notNull(),
  properties: jsonb("properties").default({}),
  organizationId: varchar("organization_id").references(() => organizations.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const ontologyRelationships = pgTable("ontology_relationships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sourceId: varchar("source_id").references(() => ontologyEntities.id),
  targetId: varchar("target_id").references(() => ontologyEntities.id),
  type: text("type").notNull(),
  properties: jsonb("properties").default({}),
});

export const ontologyEvents = pgTable("ontology_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  entityId: varchar("entity_id").references(() => ontologyEntities.id),
  type: text("type").notNull(),
  data: jsonb("data").default({}),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const missionTemplates = pgTable("mission_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  sector: text("sector").notNull(),
  targetRoles: text("target_roles").array().default(sql`'{}'::text[]`),
  ontologyMappings: jsonb("ontology_mappings").default({}),
  workflowDefinition: jsonb("workflow_definition").default({}),
  probes: jsonb("probes").default([]),
  kpiDefinitions: jsonb("kpi_definitions").default([]),
  icon: text("icon").default("Target"),
  color: text("color").default("#6366f1"),
});

export const missions = pgTable("missions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  templateId: varchar("template_id").references(() => missionTemplates.id),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").notNull().default("active"),
  organizationId: varchar("organization_id").references(() => organizations.id),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const workflowDefinitions = pgTable("workflow_definitions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  states: jsonb("states").default([]),
  transitions: jsonb("transitions").default([]),
  published: boolean("published").default(false),
  organizationId: varchar("organization_id").references(() => organizations.id),
});

export const workflowInstances = pgTable("workflow_instances", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  definitionId: varchar("definition_id").references(() => workflowDefinitions.id),
  missionId: varchar("mission_id").references(() => missions.id),
  currentState: text("current_state").notNull(),
  data: jsonb("data").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const workflowTransitions = pgTable("workflow_transitions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  instanceId: varchar("instance_id").references(() => workflowInstances.id),
  fromState: text("from_state").notNull(),
  toState: text("to_state").notNull(),
  triggeredBy: varchar("triggered_by").references(() => users.id),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  notes: text("notes"),
});

export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  missionId: varchar("mission_id").references(() => missions.id),
  workflowInstanceId: varchar("workflow_instance_id").references(() => workflowInstances.id),
  title: text("title").notNull(),
  description: text("description"),
  assigneeId: varchar("assignee_id").references(() => users.id),
  status: text("status").notNull().default("pending"),
  priority: text("priority").default("medium"),
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const approvals = pgTable("approvals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  taskId: varchar("task_id").references(() => tasks.id),
  missionId: varchar("mission_id").references(() => missions.id),
  requestedBy: varchar("requested_by").references(() => users.id),
  approvedBy: varchar("approved_by").references(() => users.id),
  status: text("status").notNull().default("pending"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const slas = pgTable("slas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  missionId: varchar("mission_id").references(() => missions.id),
  name: text("name").notNull(),
  targetHours: integer("target_hours").notNull(),
  status: text("status").notNull().default("on_track"),
  breachedAt: timestamp("breached_at"),
});

export const probeDefinitions = pgTable("probe_definitions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(),
  config: jsonb("config").default({}),
  schedule: text("schedule"),
  active: boolean("active").default(true),
  organizationId: varchar("organization_id").references(() => organizations.id),
});

export const probeRuns = pgTable("probe_runs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  probeId: varchar("probe_id").references(() => probeDefinitions.id),
  status: text("status").notNull(),
  result: jsonb("result").default({}),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const telemetryEvents = pgTable("telemetry_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  probeRunId: varchar("probe_run_id").references(() => probeRuns.id),
  type: text("type").notNull(),
  severity: text("severity").default("info"),
  message: text("message").notNull(),
  data: jsonb("data").default({}),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const evidenceItems = pgTable("evidence_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  missionId: varchar("mission_id").references(() => missions.id),
  probeRunId: varchar("probe_run_id").references(() => probeRuns.id),
  type: text("type").notNull(),
  title: text("title").notNull(),
  content: jsonb("content").default({}),
  hash: text("hash"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: varchar("entity_id"),
  details: jsonb("details").default({}),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  type: text("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const kpiSnapshots = pgTable("kpi_snapshots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  category: text("category").notNull(),
  value: text("value").notNull(),
  metadata: jsonb("metadata").default({}),
  computedAt: timestamp("computed_at").defaultNow().notNull(),
});

// ITSM-specific
export const tickets = pgTable("tickets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  missionId: varchar("mission_id").references(() => missions.id),
  title: text("title").notNull(),
  description: text("description"),
  severity: text("severity").notNull().default("medium"),
  status: text("status").notNull().default("open"),
  assigneeId: varchar("assignee_id").references(() => users.id),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const serviceCatalogItems = pgTable("service_catalog_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category"),
  organizationId: varchar("organization_id").references(() => organizations.id),
});

// Cyber Compliance
export const controls = pgTable("controls", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  framework: text("framework").notNull(),
  description: text("description"),
  status: text("status").notNull().default("not_assessed"),
  organizationId: varchar("organization_id").references(() => organizations.id),
});

export const controlMappings = pgTable("control_mappings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  controlId: varchar("control_id").references(() => controls.id),
  missionId: varchar("mission_id").references(() => missions.id),
  entityId: varchar("entity_id").references(() => ontologyEntities.id),
  status: text("status").notNull().default("pending"),
});

export const evidenceRequests = pgTable("evidence_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  controlId: varchar("control_id").references(() => controls.id),
  missionId: varchar("mission_id").references(() => missions.id),
  description: text("description").notNull(),
  status: text("status").notNull().default("pending"),
  dueDate: timestamp("due_date"),
});

// FIU/FATF
export const strs = pgTable("strs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  missionId: varchar("mission_id").references(() => missions.id),
  referenceNumber: text("reference_number").notNull(),
  subject: text("subject").notNull(),
  description: text("description"),
  status: text("status").notNull().default("pending"),
  filingDate: timestamp("filing_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const strQualityScores = pgTable("str_quality_scores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  strId: varchar("str_id").references(() => strs.id),
  score: integer("score").notNull(),
  criteria: jsonb("criteria").default({}),
  assessedBy: varchar("assessed_by").references(() => users.id),
  assessedAt: timestamp("assessed_at").defaultNow().notNull(),
});

export const boEntities = pgTable("bo_entities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  missionId: varchar("mission_id").references(() => missions.id),
  name: text("name").notNull(),
  entityType: text("entity_type").notNull(),
  jurisdiction: text("jurisdiction"),
  properties: jsonb("properties").default({}),
});

export const beneficialOwners = pgTable("beneficial_owners", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  boEntityId: varchar("bo_entity_id").references(() => boEntities.id),
  name: text("name").notNull(),
  ownershipPercentage: integer("ownership_percentage"),
  verified: boolean("verified").default(false),
});

export const discrepancies = pgTable("discrepancies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  missionId: varchar("mission_id").references(() => missions.id),
  boEntityId: varchar("bo_entity_id").references(() => boEntities.id),
  type: text("type").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().default("open"),
  resolvedAt: timestamp("resolved_at"),
});

export const caseFiles = pgTable("case_files", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  missionId: varchar("mission_id").references(() => missions.id),
  title: text("title").notNull(),
  status: text("status").notNull().default("open"),
  assigneeId: varchar("assignee_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Defense / GIS
export const geoAssets = pgTable("geo_assets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  category: text("category").notNull(),
  assetType: text("asset_type").notNull(),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  status: text("status").notNull().default("active"),
  classification: text("classification").default("unclassified"),
  missionId: varchar("mission_id").references(() => missions.id),
  properties: jsonb("properties").default({}),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const geoZones = pgTable("geo_zones", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  zoneType: text("zone_type").notNull(),
  coordinates: jsonb("coordinates").notNull(),
  color: text("color").default("#ef4444"),
  classification: text("classification").default("unclassified"),
  missionId: varchar("mission_id").references(() => missions.id),
  properties: jsonb("properties").default({}),
});

export const intelReports = pgTable("intel_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  summary: text("summary"),
  classification: text("classification").default("unclassified"),
  source: text("source"),
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
  missionId: varchar("mission_id").references(() => missions.id),
  severity: text("severity").default("medium"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Command Control Center
export const directives = pgTable("directives", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  targetAssetId: varchar("target_asset_id").references(() => geoAssets.id),
  type: text("type").notNull(),
  command: text("command").notNull(),
  parameters: jsonb("parameters").default({}),
  status: text("status").notNull().default("pending"),
  priority: text("priority").notNull().default("normal"),
  issuedBy: varchar("issued_by").references(() => users.id),
  acknowledgedAt: timestamp("acknowledged_at"),
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const threatResponses = pgTable("threat_responses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  threatAssetId: varchar("threat_asset_id").references(() => geoAssets.id),
  responseType: text("response_type").notNull(),
  status: text("status").notNull().default("pending"),
  assignedAssets: jsonb("assigned_assets").default([]),
  priority: text("priority").notNull().default("high"),
  issuedBy: varchar("issued_by").references(() => users.id),
  escalationLevel: integer("escalation_level").default(1),
  notes: text("notes"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// AI Recommendations - AI-generated tactical recommendations with human approval
export const aiRecommendations = pgTable("ai_recommendations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  category: text("category").notNull(),
  priority: text("priority").notNull().default("medium"),
  summary: text("summary").notNull(),
  reasoning: text("reasoning").notNull(),
  suggestedAction: text("suggested_action").notNull(),
  affectedAssets: jsonb("affected_assets").default([]),
  relatedThreats: jsonb("related_threats").default([]),
  confidence: doublePrecision("confidence").notNull().default(0.0),
  status: text("status").notNull().default("pending"),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewNotes: text("review_notes"),
  reviewedAt: timestamp("reviewed_at"),
  executedAt: timestamp("executed_at"),
  missionId: varchar("mission_id").references(() => missions.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertOrganizationSchema = createInsertSchema(organizations).omit({ id: true, createdAt: true });
export const insertMissionSchema = createInsertSchema(missions).omit({ id: true, createdAt: true });
export const insertMissionTemplateSchema = createInsertSchema(missionTemplates).omit({ id: true });
export const insertWorkflowDefinitionSchema = createInsertSchema(workflowDefinitions).omit({ id: true });
export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true, createdAt: true });
export const insertProbeDefinitionSchema = createInsertSchema(probeDefinitions).omit({ id: true });
export const insertEvidenceItemSchema = createInsertSchema(evidenceItems).omit({ id: true, createdAt: true });
export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({ id: true, timestamp: true });
export const insertOntologyEntitySchema = createInsertSchema(ontologyEntities).omit({ id: true, createdAt: true });
export const insertOntologyRelationshipSchema = createInsertSchema(ontologyRelationships).omit({ id: true });
export const insertTicketSchema = createInsertSchema(tickets).omit({ id: true, createdAt: true });
export const insertControlSchema = createInsertSchema(controls).omit({ id: true });
export const insertStrSchema = createInsertSchema(strs).omit({ id: true, createdAt: true });
export const insertGeoAssetSchema = createInsertSchema(geoAssets).omit({ id: true, updatedAt: true });
export const insertGeoZoneSchema = createInsertSchema(geoZones).omit({ id: true });
export const insertIntelReportSchema = createInsertSchema(intelReports).omit({ id: true, createdAt: true });
export const insertDirectiveSchema = createInsertSchema(directives).omit({ id: true, createdAt: true });
export const insertThreatResponseSchema = createInsertSchema(threatResponses).omit({ id: true, createdAt: true });
export const insertAiRecommendationSchema = createInsertSchema(aiRecommendations).omit({ id: true, createdAt: true });

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Organization = typeof organizations.$inferSelect;
export type Mission = typeof missions.$inferSelect;
export type MissionTemplate = typeof missionTemplates.$inferSelect;
export type WorkflowDefinition = typeof workflowDefinitions.$inferSelect;
export type WorkflowInstance = typeof workflowInstances.$inferSelect;
export type WorkflowTransition = typeof workflowTransitions.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type Approval = typeof approvals.$inferSelect;
export type ProbeDefinition = typeof probeDefinitions.$inferSelect;
export type ProbeRun = typeof probeRuns.$inferSelect;
export type TelemetryEvent = typeof telemetryEvents.$inferSelect;
export type EvidenceItem = typeof evidenceItems.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type KpiSnapshot = typeof kpiSnapshots.$inferSelect;
export type OntologyType = typeof ontologyTypes.$inferSelect;
export type OntologyEntity = typeof ontologyEntities.$inferSelect;
export type OntologyRelationship = typeof ontologyRelationships.$inferSelect;
export type Ticket = typeof tickets.$inferSelect;
export type Control = typeof controls.$inferSelect;
export type Str = typeof strs.$inferSelect;
export type StrQualityScore = typeof strQualityScores.$inferSelect;
export type BoEntity = typeof boEntities.$inferSelect;
export type Discrepancy = typeof discrepancies.$inferSelect;
export type CaseFile = typeof caseFiles.$inferSelect;
export type Connector = typeof connectors.$inferSelect;
export type DataSource = typeof dataSources.$inferSelect;
export type SLA = typeof slas.$inferSelect;
export type GeoAsset = typeof geoAssets.$inferSelect;
export type GeoZone = typeof geoZones.$inferSelect;
export type IntelReport = typeof intelReports.$inferSelect;
export type Directive = typeof directives.$inferSelect;
export type ThreatResponse = typeof threatResponses.$inferSelect;
export type AiRecommendation = typeof aiRecommendations.$inferSelect;

export * from "./models/chat";

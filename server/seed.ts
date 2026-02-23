import { storage } from "./storage";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function seedDatabase() {
  const existingUsers = await storage.getAllUsers();
  if (existingUsers.length > 0) return;

  console.log("Seeding database...");

  const org = await storage.createOrganization("Acme Corp", "acme-corp");

  const adminUser = await storage.createUser({
    username: "admin",
    password: "demo123",
    displayName: "Sarah Chen",
    role: "admin",
    organizationId: org.id,
    email: "admin@acme.com",
    active: true,
  });

  const operatorUser = await storage.createUser({
    username: "operator",
    password: "demo123",
    displayName: "James Wilson",
    role: "operator",
    organizationId: org.id,
    email: "operator@acme.com",
    active: true,
  });

  const analystUser = await storage.createUser({
    username: "analyst",
    password: "demo123",
    displayName: "Maria Garcia",
    role: "analyst",
    organizationId: org.id,
    email: "analyst@acme.com",
    active: true,
  });

  await storage.createUser({
    username: "supervisor",
    password: "demo123",
    displayName: "Robert Kim",
    role: "supervisor",
    organizationId: org.id,
    email: "supervisor@acme.com",
    active: true,
  });

  await storage.createUser({
    username: "auditor",
    password: "demo123",
    displayName: "Elena Petrov",
    role: "auditor",
    organizationId: org.id,
    email: "auditor@acme.com",
    active: true,
  });

  await storage.createUser({
    username: "executive",
    password: "demo123",
    displayName: "David Thompson",
    role: "executive_viewer",
    organizationId: org.id,
    email: "exec@acme.com",
    active: true,
  });

  // Ontology Types
  const personType = await storage.createOntologyType({ name: "Person", description: "Individual person entity", color: "#6366f1", icon: "User" });
  const orgType = await storage.createOntologyType({ name: "Organization", description: "Organization entity", color: "#0ea5e9", icon: "Building2" });
  const assetType = await storage.createOntologyType({ name: "Asset", description: "Physical or digital asset", color: "#10b981", icon: "Box" });
  const systemType = await storage.createOntologyType({ name: "System", description: "IT system or service", color: "#f59e0b", icon: "Monitor" });
  const ticketType = await storage.createOntologyType({ name: "Ticket", description: "Support ticket", color: "#ef4444", icon: "Ticket" });
  const controlType = await storage.createOntologyType({ name: "Control", description: "Compliance control", color: "#8b5cf6", icon: "Shield" });
  const strType = await storage.createOntologyType({ name: "STR", description: "Suspicious Transaction Report", color: "#ec4899", icon: "FileText" });
  const boType = await storage.createOntologyType({ name: "BOEntity", description: "Beneficial Ownership Entity", color: "#14b8a6", icon: "Briefcase" });
  const caseType = await storage.createOntologyType({ name: "Case", description: "Investigation case", color: "#f97316", icon: "FileText" });
  const eventType = await storage.createOntologyType({ name: "Event", description: "System or business event", color: "#64748b", icon: "Network" });

  // Ontology Entities
  const person1 = await storage.createOntologyEntity({ typeId: personType.id, name: "John Smith", properties: { department: "IT", role: "Manager" }, organizationId: org.id });
  const person2 = await storage.createOntologyEntity({ typeId: personType.id, name: "Alice Johnson", properties: { department: "Security", role: "Analyst" }, organizationId: org.id });
  const orgEntity = await storage.createOntologyEntity({ typeId: orgType.id, name: "Acme Corp", properties: { industry: "Technology", employees: 500 }, organizationId: org.id });
  const sys1 = await storage.createOntologyEntity({ typeId: systemType.id, name: "Production ERP", properties: { vendor: "SAP", version: "S/4HANA" }, organizationId: org.id });
  const sys2 = await storage.createOntologyEntity({ typeId: systemType.id, name: "HR Portal", properties: { vendor: "Workday", environment: "Cloud" }, organizationId: org.id });
  const asset1 = await storage.createOntologyEntity({ typeId: assetType.id, name: "Customer Database", properties: { classification: "Confidential", records: 50000 }, organizationId: org.id });
  const boEntity1 = await storage.createOntologyEntity({ typeId: boType.id, name: "Alpha Holdings Ltd", properties: { jurisdiction: "Cayman Islands", risk: "High" }, organizationId: org.id });
  const str1Entity = await storage.createOntologyEntity({ typeId: strType.id, name: "STR-2024-0042", properties: { amount: 250000, currency: "USD" }, organizationId: org.id });

  // Relationships
  await storage.createOntologyRelationship({ sourceId: person1.id, targetId: orgEntity.id, type: "ASSOCIATED_WITH" });
  await storage.createOntologyRelationship({ sourceId: person2.id, targetId: orgEntity.id, type: "ASSOCIATED_WITH" });
  await storage.createOntologyRelationship({ sourceId: person1.id, targetId: sys1.id, type: "OWNS" });
  await storage.createOntologyRelationship({ sourceId: sys1.id, targetId: asset1.id, type: "LINKED_TO" });
  await storage.createOntologyRelationship({ sourceId: boEntity1.id, targetId: str1Entity.id, type: "TRIGGERED_BY" });
  await storage.createOntologyRelationship({ sourceId: person2.id, targetId: sys2.id, type: "IMPACTS" });

  // Workflow Definitions
  const itsmWf = await storage.createWorkflowDefinition({
    name: "ITSM Incident Workflow",
    description: "Incident management: triage, assignment, resolution, postmortem",
    states: [
      { name: "open", label: "Open", initial: true },
      { name: "triaged", label: "Triaged" },
      { name: "assigned", label: "Assigned" },
      { name: "in_progress", label: "In Progress" },
      { name: "resolved", label: "Resolved" },
      { name: "postmortem", label: "Postmortem" },
      { name: "closed", label: "Closed", final: true },
    ],
    transitions: [
      { from: "open", to: "triaged", label: "Triage", roles: ["operator", "admin"] },
      { from: "triaged", to: "assigned", label: "Assign", roles: ["operator", "admin"] },
      { from: "assigned", to: "in_progress", label: "Start Work", roles: ["operator", "analyst", "admin"] },
      { from: "in_progress", to: "resolved", label: "Resolve", roles: ["operator", "analyst", "admin"] },
      { from: "resolved", to: "postmortem", label: "Begin Postmortem", roles: ["supervisor", "admin"] },
      { from: "postmortem", to: "closed", label: "Close", roles: ["supervisor", "admin"] },
    ],
    published: true,
    organizationId: org.id,
  });

  const cyberWf = await storage.createWorkflowDefinition({
    name: "Cyber Compliance Workflow",
    description: "Control mapping, evidence collection, audit pack generation",
    states: [
      { name: "mapping", label: "Control Mapping", initial: true },
      { name: "evidence_collection", label: "Evidence Collection" },
      { name: "review", label: "Review" },
      { name: "audit_ready", label: "Audit Ready" },
      { name: "completed", label: "Completed", final: true },
    ],
    transitions: [
      { from: "mapping", to: "evidence_collection", label: "Begin Evidence Collection", roles: ["analyst", "admin"] },
      { from: "evidence_collection", to: "review", label: "Submit for Review", roles: ["analyst", "admin"] },
      { from: "review", to: "audit_ready", label: "Approve", roles: ["supervisor", "auditor", "admin"] },
      { from: "review", to: "evidence_collection", label: "Return for More Evidence", roles: ["supervisor", "admin"] },
      { from: "audit_ready", to: "completed", label: "Complete Audit", roles: ["auditor", "admin"] },
    ],
    published: true,
    organizationId: org.id,
  });

  const fiuWf = await storage.createWorkflowDefinition({
    name: "FIU/FATF Investigation Workflow",
    description: "STR scoring, BO discrepancy analysis, case management",
    states: [
      { name: "intake", label: "Intake", initial: true },
      { name: "scoring", label: "STR Scoring" },
      { name: "investigation", label: "Investigation" },
      { name: "escalated", label: "Escalated" },
      { name: "case_closed", label: "Case Closed", final: true },
    ],
    transitions: [
      { from: "intake", to: "scoring", label: "Begin Scoring", roles: ["analyst", "admin"] },
      { from: "scoring", to: "investigation", label: "Investigate", roles: ["analyst", "admin"] },
      { from: "investigation", to: "escalated", label: "Escalate", roles: ["analyst", "supervisor", "admin"] },
      { from: "investigation", to: "case_closed", label: "Close Case", roles: ["supervisor", "admin"] },
      { from: "escalated", to: "case_closed", label: "Resolve & Close", roles: ["supervisor", "admin"] },
    ],
    published: true,
    organizationId: org.id,
  });

  // Mission Templates
  const itsmTemplate = await storage.createMissionTemplate({
    name: "ITSM Incident Management",
    description: "End-to-end incident management: triage, assignment, resolution, and postmortem analysis. Tracks tickets, SLAs, and generates evidence for audit.",
    sector: "itsm",
    targetRoles: ["operator", "analyst", "supervisor"],
    workflowDefinition: { definitionId: itsmWf.id },
    probes: ["sla_breach_detector", "data_freshness"],
    kpiDefinitions: ["tickets_opened", "tickets_closed", "mean_time_to_resolve"],
    icon: "Target",
    color: "#2563eb",
  });

  const cyberTemplate = await storage.createMissionTemplate({
    name: "Cyber Compliance Assessment",
    description: "Map controls to frameworks, collect evidence, review compliance posture, and generate audit-ready packs. Supports NIST, ISO 27001, SOC 2.",
    sector: "cyber_compliance",
    targetRoles: ["analyst", "auditor", "supervisor"],
    workflowDefinition: { definitionId: cyberWf.id },
    probes: ["compliance_evidence_completeness", "data_freshness"],
    kpiDefinitions: ["controls_with_evidence", "audit_pack_readiness"],
    icon: "Shield",
    color: "#16a34a",
  });

  const fiuTemplate = await storage.createMissionTemplate({
    name: "FIU/FATF Investigation",
    description: "Suspicious Transaction Report (STR) scoring, Beneficial Ownership (BO) discrepancy detection, case management, and KPI dashboard for financial intelligence.",
    sector: "fiu_fatf",
    targetRoles: ["analyst", "supervisor", "auditor"],
    workflowDefinition: { definitionId: fiuWf.id },
    probes: ["sla_breach_detector", "compliance_evidence_completeness"],
    kpiDefinitions: ["str_quality_avg", "bo_discrepancy_rate"],
    icon: "FileText",
    color: "#7c3aed",
  });

  // Create demo missions
  const itsmMission = await storage.createMission({
    templateId: itsmTemplate.id,
    name: "Q1 Incident Response",
    description: "Active incident management for Q1 2026 production issues",
    status: "active",
    organizationId: org.id,
    createdBy: adminUser.id,
  });

  const cyberMission = await storage.createMission({
    templateId: cyberTemplate.id,
    name: "SOC 2 Type II Audit",
    description: "Annual SOC 2 compliance assessment and evidence collection",
    status: "active",
    organizationId: org.id,
    createdBy: adminUser.id,
  });

  const fiuMission = await storage.createMission({
    templateId: fiuTemplate.id,
    name: "FATF Compliance Review",
    description: "Quarterly review of STR quality and BO discrepancy resolution",
    status: "active",
    organizationId: org.id,
    createdBy: adminUser.id,
  });

  // Create workflow instances
  const itsmWfInst = await storage.createWorkflowInstance({
    definitionId: itsmWf.id,
    missionId: itsmMission.id,
    currentState: "assigned",
    data: {},
  });

  await storage.createWorkflowTransition({ instanceId: itsmWfInst.id, fromState: "open", toState: "triaged", triggeredBy: operatorUser.id, notes: "Triaged as P1" });
  await storage.createWorkflowTransition({ instanceId: itsmWfInst.id, fromState: "triaged", toState: "assigned", triggeredBy: operatorUser.id, notes: "Assigned to ops team" });

  const cyberWfInst = await storage.createWorkflowInstance({
    definitionId: cyberWf.id,
    missionId: cyberMission.id,
    currentState: "evidence_collection",
    data: {},
  });

  await storage.createWorkflowTransition({ instanceId: cyberWfInst.id, fromState: "mapping", toState: "evidence_collection", triggeredBy: analystUser.id, notes: "Control mapping complete" });

  const fiuWfInst = await storage.createWorkflowInstance({
    definitionId: fiuWf.id,
    missionId: fiuMission.id,
    currentState: "scoring",
    data: {},
  });

  await storage.createWorkflowTransition({ instanceId: fiuWfInst.id, fromState: "intake", toState: "scoring", triggeredBy: analystUser.id, notes: "Starting STR scoring" });

  // Tasks
  const past = new Date(); past.setDate(past.getDate() - 1);
  const future = new Date(); future.setDate(future.getDate() + 5);

  await storage.createTask({ missionId: itsmMission.id, workflowInstanceId: itsmWfInst.id, title: "Investigate root cause of outage", description: "Production DB connection pool exhaustion", assigneeId: operatorUser.id, status: "in_progress", priority: "high", dueDate: future });
  await storage.createTask({ missionId: itsmMission.id, workflowInstanceId: itsmWfInst.id, title: "Update runbook with new procedure", description: "Document connection pool monitoring steps", assigneeId: analystUser.id, status: "pending", priority: "medium", dueDate: future });
  await storage.createTask({ missionId: itsmMission.id, workflowInstanceId: itsmWfInst.id, title: "Notify affected stakeholders", description: "Send comms to business units", assigneeId: operatorUser.id, status: "completed", priority: "high", dueDate: past, completedAt: new Date() });

  await storage.createTask({ missionId: cyberMission.id, workflowInstanceId: cyberWfInst.id, title: "Collect access control evidence", description: "Gather screenshots and logs for AC-1 through AC-6", assigneeId: analystUser.id, status: "in_progress", priority: "high", dueDate: future });
  await storage.createTask({ missionId: cyberMission.id, workflowInstanceId: cyberWfInst.id, title: "Review encryption policies", description: "Verify TLS certificates and key rotation", assigneeId: analystUser.id, status: "pending", priority: "medium", dueDate: future });

  await storage.createTask({ missionId: fiuMission.id, workflowInstanceId: fiuWfInst.id, title: "Score batch of 12 new STRs", description: "Apply quality scoring criteria to incoming STRs", assigneeId: analystUser.id, status: "in_progress", priority: "high", dueDate: future });
  await storage.createTask({ missionId: fiuMission.id, workflowInstanceId: fiuWfInst.id, title: "Resolve BO discrepancy for Alpha Holdings", description: "Cross-reference registry data with filed ownership", assigneeId: analystUser.id, status: "pending", priority: "critical", dueDate: past });

  // Evidence items
  await storage.createEvidenceItem({ missionId: itsmMission.id, type: "log_export", title: "Database connection pool metrics", content: { metric: "pool_exhaustion", peak: 150, threshold: 100, duration: "2h" } });
  await storage.createEvidenceItem({ missionId: itsmMission.id, type: "screenshot", title: "Monitoring dashboard during outage", content: { source: "Datadog", captured_at: new Date().toISOString() } });
  await storage.createEvidenceItem({ missionId: cyberMission.id, type: "policy_document", title: "Access Control Policy v3.2", content: { framework: "SOC 2", controls: ["AC-1", "AC-2", "AC-3"], version: "3.2" } });
  await storage.createEvidenceItem({ missionId: cyberMission.id, type: "audit_log", title: "User access review log", content: { period: "Q4 2025", reviewed_accounts: 245, findings: 3 } });
  await storage.createEvidenceItem({ missionId: fiuMission.id, type: "str_analysis", title: "STR Batch Quality Report", content: { batch_size: 12, avg_score: 78, above_threshold: 9, threshold: 70 } });

  // Probes
  const slaBreach = await storage.createProbeDefinition({ name: "SLA Breach Detector", description: "Flags tasks that have exceeded their due date without completion", type: "sla_breach_detector", config: { checkInterval: "1h" }, schedule: "Every hour", active: true, organizationId: org.id });
  const dataFresh = await storage.createProbeDefinition({ name: "Data Freshness Check", description: "Verifies data sources have been ingested within acceptable timeframes", type: "data_freshness", config: { maxAgeHours: 24 }, schedule: "Every 6 hours", active: true, organizationId: org.id });
  const compEvidence = await storage.createProbeDefinition({ name: "Compliance Evidence Completeness", description: "Checks that all required evidence items are present for active compliance missions", type: "compliance_evidence_completeness", config: { minEvidence: 3 }, schedule: "Daily", active: true, organizationId: org.id });

  // Probe runs
  const slaRun = await storage.createProbeRun({ probeId: slaBreach.id, status: "warning", result: { overdueTasks: 1, details: "1 task overdue in FIU mission" }, completedAt: new Date() });
  await storage.createTelemetryEvent({ probeRunId: slaRun.id, type: "sla_check", severity: "warning", message: "SLA breach detected: 1 overdue task found", data: { overdue: 1 } });

  const freshRun = await storage.createProbeRun({ probeId: dataFresh.id, status: "pass", result: { sourcesChecked: 3, allFresh: true }, completedAt: new Date() });
  await storage.createTelemetryEvent({ probeRunId: freshRun.id, type: "freshness_check", severity: "info", message: "All data sources are within freshness thresholds", data: { sources: 3 } });

  const compRun = await storage.createProbeRun({ probeId: compEvidence.id, status: "pass", result: { missionsChecked: 1, allComplete: true }, completedAt: new Date() });
  await storage.createTelemetryEvent({ probeRunId: compRun.id, type: "evidence_check", severity: "info", message: "Compliance evidence requirements met for SOC 2 mission", data: { evidence: 2 } });

  // Tickets (ITSM)
  await storage.createTicket({ missionId: itsmMission.id, title: "Production DB connection pool exhaustion", description: "Database connections maxing out during peak hours", severity: "critical", status: "in_progress", assigneeId: operatorUser.id });
  await storage.createTicket({ missionId: itsmMission.id, title: "API gateway timeout errors", description: "Intermittent 504 errors on /api/payments endpoint", severity: "high", status: "open", assigneeId: operatorUser.id });
  await storage.createTicket({ missionId: itsmMission.id, title: "SSL certificate renewal", description: "Cert expiring in 30 days for app.acme.com", severity: "medium", status: "resolved", assigneeId: analystUser.id, resolvedAt: new Date() });

  // Controls (Cyber)
  await storage.createControl({ name: "AC-1 Access Control Policy", framework: "SOC 2", description: "Organization-wide access control policies", status: "compliant", organizationId: org.id });
  await storage.createControl({ name: "AC-2 Account Management", framework: "SOC 2", description: "User account lifecycle management", status: "compliant", organizationId: org.id });
  await storage.createControl({ name: "SC-8 Transmission Confidentiality", framework: "SOC 2", description: "Protection of data in transit", status: "not_assessed", organizationId: org.id });
  await storage.createControl({ name: "IR-1 Incident Response Policy", framework: "NIST 800-53", description: "Incident response procedures", status: "compliant", organizationId: org.id });

  // STRs (FIU)
  await storage.createStr({ missionId: fiuMission.id, referenceNumber: "STR-2024-0042", subject: "Alpha Holdings Ltd wire transfers", description: "Multiple large wire transfers to high-risk jurisdictions", status: "under_review" });
  await storage.createStr({ missionId: fiuMission.id, referenceNumber: "STR-2024-0043", subject: "Suspicious cash deposits pattern", description: "Structured cash deposits below reporting threshold", status: "pending" });
  await storage.createStr({ missionId: fiuMission.id, referenceNumber: "STR-2024-0041", subject: "Shell company transactions", description: "Layered transactions through multiple shell entities", status: "filed" });

  // STR Quality Scores
  await storage.createStrQualityScore({ strId: (await storage.getAllStrs())[0].id, score: 85, criteria: { completeness: 90, timeliness: 80, analysis: 85 }, assessedBy: analystUser.id });
  await storage.createStrQualityScore({ strId: (await storage.getAllStrs())[1].id, score: 72, criteria: { completeness: 70, timeliness: 75, analysis: 70 }, assessedBy: analystUser.id });
  await storage.createStrQualityScore({ strId: (await storage.getAllStrs())[2].id, score: 91, criteria: { completeness: 95, timeliness: 88, analysis: 90 }, assessedBy: analystUser.id });

  // Discrepancies
  await storage.createDiscrepancy({ missionId: fiuMission.id, boEntityId: null, type: "ownership_mismatch", description: "Registered ownership differs from beneficial ownership declaration", status: "open" });
  await storage.createDiscrepancy({ missionId: fiuMission.id, boEntityId: null, type: "missing_declaration", description: "No BO declaration filed for subsidiary entity", status: "resolved", resolvedAt: new Date() });

  // SLAs
  await storage.createSLA({ missionId: itsmMission.id, name: "P1 Resolution SLA", targetHours: 4, status: "on_track" });
  await storage.createSLA({ missionId: itsmMission.id, name: "P2 Resolution SLA", targetHours: 24, status: "on_track" });
  await storage.createSLA({ missionId: fiuMission.id, name: "STR Filing Deadline", targetHours: 72, status: "warning" });

  // Notifications
  await storage.createNotification({ userId: adminUser.id, type: "assignment", title: "New incident assigned", message: "Production DB connection pool exhaustion has been assigned to your team.", read: false });
  await storage.createNotification({ userId: adminUser.id, type: "probe_failure", title: "SLA breach warning", message: "1 overdue task detected in FIU/FATF mission.", read: false });
  await storage.createNotification({ userId: adminUser.id, type: "approval_needed", title: "Evidence review pending", message: "Access Control Policy v3.2 requires supervisor approval.", read: true });
  await storage.createNotification({ userId: operatorUser.id, type: "sla_breach", title: "SLA at risk", message: "STR filing deadline approaching for STR-2024-0043.", read: false });

  // Audit logs
  await storage.createAuditLog({ userId: adminUser.id, action: "CREATE", entityType: "mission", entityId: itsmMission.id, details: { name: "Q1 Incident Response" } });
  await storage.createAuditLog({ userId: adminUser.id, action: "CREATE", entityType: "mission", entityId: cyberMission.id, details: { name: "SOC 2 Type II Audit" } });
  await storage.createAuditLog({ userId: adminUser.id, action: "CREATE", entityType: "mission", entityId: fiuMission.id, details: { name: "FATF Compliance Review" } });
  await storage.createAuditLog({ userId: operatorUser.id, action: "TRANSITION", entityType: "workflow", entityId: itsmWfInst.id, details: { from: "open", to: "triaged" } });
  await storage.createAuditLog({ userId: analystUser.id, action: "TRANSITION", entityType: "workflow", entityId: cyberWfInst.id, details: { from: "mapping", to: "evidence_collection" } });

  // ===== DEFENSE SECTOR =====

  // Defense Ontology Types
  const militaryUnitType = await storage.createOntologyType({ name: "Military Unit", description: "Military unit or formation", color: "#059669", icon: "Shield" });
  const theaterType = await storage.createOntologyType({ name: "Theater", description: "Operational theater of war", color: "#dc2626", icon: "Map" });
  const platformType = await storage.createOntologyType({ name: "Platform", description: "Military platform (vehicle, aircraft, vessel)", color: "#2563eb", icon: "Plane" });
  const intelType = await storage.createOntologyType({ name: "Intelligence", description: "Intelligence report or assessment", color: "#7c3aed", icon: "Eye" });
  const threatType = await storage.createOntologyType({ name: "Threat", description: "Threat actor or entity", color: "#ef4444", icon: "AlertTriangle" });
  const installationType = await storage.createOntologyType({ name: "Installation", description: "Military installation or base", color: "#0891b2", icon: "Building" });

  // Defense Ontology Entities
  const unit1 = await storage.createOntologyEntity({ typeId: militaryUnitType.id, name: "1st Combined Arms Brigade", properties: { branch: "Army", size: 4500, readiness: "C1", commander: "COL Richardson" }, organizationId: org.id });
  const unit2 = await storage.createOntologyEntity({ typeId: militaryUnitType.id, name: "3rd Maritime Task Group", properties: { branch: "Navy", size: 2200, readiness: "C2", commander: "CAPT Hayward" }, organizationId: org.id });
  const unit3 = await storage.createOntologyEntity({ typeId: militaryUnitType.id, name: "12th ISR Squadron", properties: { branch: "Air Force", size: 350, readiness: "C1", commander: "LTC Martinez" }, organizationId: org.id });

  const theater1 = await storage.createOntologyEntity({ typeId: theaterType.id, name: "Eastern Mediterranean Theater", properties: { region: "EUCOM", status: "Active", threatLevel: "Elevated" }, organizationId: org.id });
  const theater2 = await storage.createOntologyEntity({ typeId: theaterType.id, name: "Indo-Pacific Theater", properties: { region: "INDOPACOM", status: "Active", threatLevel: "High" }, organizationId: org.id });

  const platform1 = await storage.createOntologyEntity({ typeId: platformType.id, name: "MQ-9 Reaper UAS", properties: { type: "UAV", range: "1150nm", endurance: "27hr", sensors: ["EO/IR", "SAR", "SIGINT"] }, organizationId: org.id });
  const platform2 = await storage.createOntologyEntity({ typeId: platformType.id, name: "DDG-119 USS Delbert D. Black", properties: { type: "Destroyer", class: "Arleigh Burke", displacement: "9800t" }, organizationId: org.id });

  const threat1 = await storage.createOntologyEntity({ typeId: threatType.id, name: "APT-47 Crimson Viper", properties: { type: "State Actor", capability: "Cyber + Kinetic", lastActivity: "2026-01-15" }, organizationId: org.id });
  const threat2 = await storage.createOntologyEntity({ typeId: threatType.id, name: "Coastal Defense Battery Alpha", properties: { type: "A2/AD", systems: ["HQ-9", "YJ-12"], range: "400km" }, organizationId: org.id });

  const install1 = await storage.createOntologyEntity({ typeId: installationType.id, name: "FOB Eagle Point", properties: { type: "Forward Operating Base", capacity: 800, status: "Operational" }, organizationId: org.id });

  // Defense Relationships
  await storage.createOntologyRelationship({ sourceId: unit1.id, targetId: theater1.id, type: "DEPLOYED_TO" });
  await storage.createOntologyRelationship({ sourceId: unit2.id, targetId: theater2.id, type: "DEPLOYED_TO" });
  await storage.createOntologyRelationship({ sourceId: unit3.id, targetId: theater1.id, type: "SUPPORTS" });
  await storage.createOntologyRelationship({ sourceId: platform1.id, targetId: unit3.id, type: "ASSIGNED_TO" });
  await storage.createOntologyRelationship({ sourceId: platform2.id, targetId: unit2.id, type: "ASSIGNED_TO" });
  await storage.createOntologyRelationship({ sourceId: threat1.id, targetId: theater1.id, type: "THREATENS" });
  await storage.createOntologyRelationship({ sourceId: threat2.id, targetId: theater2.id, type: "THREATENS" });
  await storage.createOntologyRelationship({ sourceId: unit1.id, targetId: install1.id, type: "OPERATES_FROM" });

  // Defense Workflow
  const defenseWf = await storage.createWorkflowDefinition({
    name: "Defense Operations Workflow",
    description: "Force deployment, intelligence cycle, threat assessment, and operational planning",
    states: [
      { name: "planning", label: "Planning", initial: true },
      { name: "intel_collection", label: "Intel Collection" },
      { name: "threat_assessment", label: "Threat Assessment" },
      { name: "force_posture", label: "Force Posturing" },
      { name: "execution", label: "Execution" },
      { name: "after_action", label: "After Action Review" },
      { name: "completed", label: "Completed", final: true },
    ],
    transitions: [
      { from: "planning", to: "intel_collection", label: "Begin Collection", roles: ["analyst", "operator", "admin"] },
      { from: "intel_collection", to: "threat_assessment", label: "Assess Threats", roles: ["analyst", "admin"] },
      { from: "threat_assessment", to: "force_posture", label: "Posture Forces", roles: ["operator", "supervisor", "admin"] },
      { from: "force_posture", to: "execution", label: "Execute", roles: ["supervisor", "admin"] },
      { from: "execution", to: "after_action", label: "Begin AAR", roles: ["supervisor", "admin"] },
      { from: "after_action", to: "completed", label: "Complete", roles: ["supervisor", "admin"] },
      { from: "threat_assessment", to: "intel_collection", label: "Request More Intel", roles: ["analyst", "supervisor", "admin"] },
    ],
    published: true,
    organizationId: org.id,
  });

  // Defense Mission Templates
  const defenseTemplate = await storage.createMissionTemplate({
    name: "Force Deployment & Operations",
    description: "End-to-end operational planning: intelligence collection, threat assessment, force posturing, and execution with full GIS situational awareness.",
    sector: "defense",
    targetRoles: ["operator", "analyst", "supervisor"],
    workflowDefinition: { definitionId: defenseWf.id },
    probes: ["asset_readiness", "intel_freshness", "threat_proximity"],
    kpiDefinitions: ["unit_readiness", "coverage_percentage", "response_time"],
    icon: "Shield",
    color: "#059669",
  });

  const isrTemplate = await storage.createMissionTemplate({
    name: "ISR Collection Mission",
    description: "Intelligence, Surveillance, and Reconnaissance mission planning with sensor tasking, collection management, and product dissemination.",
    sector: "defense",
    targetRoles: ["analyst", "operator"],
    workflowDefinition: { definitionId: defenseWf.id },
    probes: ["intel_freshness", "coverage_gap"],
    kpiDefinitions: ["collection_rate", "product_timeliness"],
    icon: "Eye",
    color: "#7c3aed",
  });

  const threatTemplate = await storage.createMissionTemplate({
    name: "Threat Assessment & Response",
    description: "Systematic threat identification, assessment, and response coordination across operational theaters with real-time GIS overlay.",
    sector: "defense",
    targetRoles: ["analyst", "supervisor"],
    workflowDefinition: { definitionId: defenseWf.id },
    probes: ["threat_proximity", "asset_readiness"],
    kpiDefinitions: ["threat_coverage", "response_readiness"],
    icon: "AlertTriangle",
    color: "#dc2626",
  });

  // Defense Mission
  const defenseMission = await storage.createMission({
    templateId: defenseTemplate.id,
    name: "Operation Sentinel Shield",
    description: "Combined arms force deployment to Eastern Mediterranean in response to elevated threat posture",
    status: "active",
    organizationId: org.id,
    createdBy: adminUser.id,
  });

  const defWfInst = await storage.createWorkflowInstance({
    definitionId: defenseWf.id,
    missionId: defenseMission.id,
    currentState: "threat_assessment",
    data: {},
  });

  await storage.createWorkflowTransition({ instanceId: defWfInst.id, fromState: "planning", toState: "intel_collection", triggeredBy: operatorUser.id, notes: "Initial planning complete, commencing ISR" });
  await storage.createWorkflowTransition({ instanceId: defWfInst.id, fromState: "intel_collection", toState: "threat_assessment", triggeredBy: analystUser.id, notes: "Collection phase complete, assessing threats" });

  // Defense Tasks
  await storage.createTask({ missionId: defenseMission.id, workflowInstanceId: defWfInst.id, title: "Complete theater threat assessment", description: "Analyze SIGINT and HUMINT for Eastern Med threat picture", assigneeId: analystUser.id, status: "in_progress", priority: "critical", dueDate: future });
  await storage.createTask({ missionId: defenseMission.id, workflowInstanceId: defWfInst.id, title: "Deploy ISR assets to AO", description: "Task MQ-9 sorties for continuous coverage of threat zones", assigneeId: operatorUser.id, status: "pending", priority: "high", dueDate: future });
  await storage.createTask({ missionId: defenseMission.id, workflowInstanceId: defWfInst.id, title: "Coordinate naval task group movement", description: "3rd MTG transit to operational area", assigneeId: operatorUser.id, status: "in_progress", priority: "high", dueDate: future });

  // Defense Evidence
  await storage.createEvidenceItem({ missionId: defenseMission.id, type: "intel_report", title: "SIGINT Summary - Eastern Med", content: { classification: "SECRET", period: "2026-02-01 to 2026-02-15", signals: 47, threats_identified: 3 } });
  await storage.createEvidenceItem({ missionId: defenseMission.id, type: "imagery", title: "Satellite Imagery - Coastal Defense", content: { source: "NRO", resolution: "0.5m", captured: "2026-02-10", coordinates: "34.5N 35.8E" } });

  // Defense Probes
  const assetReadiness = await storage.createProbeDefinition({ name: "Asset Readiness Monitor", description: "Monitors readiness status of deployed military assets and units", type: "asset_readiness", config: { checkInterval: "30m", minReadiness: "C2" }, schedule: "Every 30 minutes", active: true, organizationId: org.id });
  const intelFresh = await storage.createProbeDefinition({ name: "Intel Freshness Tracker", description: "Ensures intelligence products are current and within acceptable age", type: "intel_freshness", config: { maxAgeHours: 12 }, schedule: "Every 2 hours", active: true, organizationId: org.id });
  const threatProx = await storage.createProbeDefinition({ name: "Threat Proximity Alert", description: "Monitors threat positions relative to friendly forces and triggers proximity warnings", type: "threat_proximity", config: { warningRadius: 100, criticalRadius: 50, unit: "km" }, schedule: "Every 15 minutes", active: true, organizationId: org.id });

  const readyRun = await storage.createProbeRun({ probeId: assetReadiness.id, status: "pass", result: { unitsChecked: 3, allReady: true, readinessLevels: { "1st CAB": "C1", "3rd MTG": "C2", "12th ISR": "C1" } }, completedAt: new Date() });
  await storage.createTelemetryEvent({ probeRunId: readyRun.id, type: "readiness_check", severity: "info", message: "All units meeting readiness threshold. 2 at C1, 1 at C2.", data: { c1: 2, c2: 1 } });

  const intelRun = await storage.createProbeRun({ probeId: intelFresh.id, status: "warning", result: { reportsChecked: 5, staleReports: 1, details: "HUMINT summary older than 12 hours" }, completedAt: new Date() });
  await storage.createTelemetryEvent({ probeRunId: intelRun.id, type: "intel_freshness", severity: "warning", message: "1 intelligence product exceeds freshness threshold", data: { stale: 1, total: 5 } });

  const threatRun = await storage.createProbeRun({ probeId: threatProx.id, status: "warning", result: { threatsTracked: 2, proximityAlerts: 1, closest: { name: "Coastal Defense Battery Alpha", distance: "78km" } }, completedAt: new Date() });
  await storage.createTelemetryEvent({ probeRunId: threatRun.id, type: "threat_proximity", severity: "warning", message: "Threat within warning radius: Coastal Defense Battery Alpha at 78km", data: { threat: "CDB-A", distance: 78 } });

  // Drone & Aircraft Endpoint Probes
  const droneComms = await storage.createProbeDefinition({ name: "Drone Link Monitor", description: "Monitors data link connectivity and signal strength for all UAV/UAS assets in theater", type: "drone_link_monitor", config: { minSignalStrength: -80, maxLatencyMs: 200, checkInterval: "5m" }, schedule: "Every 5 minutes", active: true, organizationId: org.id });
  const droneCommsRun = await storage.createProbeRun({ probeId: droneComms.id, status: "pass", result: { assetsChecked: 8, allLinksActive: true, avgLatency: "45ms", avgSignal: "-62dBm" }, completedAt: new Date() });
  await storage.createTelemetryEvent({ probeRunId: droneCommsRun.id, type: "link_check", severity: "info", message: "All drone data links nominal. 8 assets checked, avg latency 45ms", data: { assets: 8, avgLatency: 45 } });

  const airspaceDeconf = await storage.createProbeDefinition({ name: "Airspace Deconfliction", description: "Checks for potential airspace conflicts between friendly aircraft and drone orbits", type: "airspace_deconfliction", config: { minSeparation: "1000ft", checkInterval: "2m" }, schedule: "Every 2 minutes", active: true, organizationId: org.id });
  const airspaceRun = await storage.createProbeRun({ probeId: airspaceDeconf.id, status: "warning", result: { conflictsDetected: 1, details: "F-35A CAP altitude within 2000ft of MQ-9 Orbit Alpha", recommendation: "Adjust MQ-9 orbit altitude" }, completedAt: new Date() });
  await storage.createTelemetryEvent({ probeRunId: airspaceRun.id, type: "deconfliction", severity: "warning", message: "Airspace conflict: F-35A CAP within 2000ft of MQ-9 Orbit Alpha", data: { asset1: "F-35A", asset2: "MQ-9", separation: 2000 } });

  const sensorHealth = await storage.createProbeDefinition({ name: "Sensor Payload Health", description: "Monitors health and calibration status of sensor payloads across ISR platforms", type: "sensor_health", config: { checkCalibration: true, minResolution: "0.3m" }, schedule: "Every 30 minutes", active: true, organizationId: org.id });
  const sensorRun = await storage.createProbeRun({ probeId: sensorHealth.id, status: "pass", result: { sensorsChecked: 14, degraded: 0, details: "All EO/IR, SAR, and SIGINT sensors operational" }, completedAt: new Date() });
  await storage.createTelemetryEvent({ probeRunId: sensorRun.id, type: "sensor_check", severity: "info", message: "All 14 sensor payloads operational and calibrated", data: { sensors: 14, degraded: 0 } });

  const endpointCtrl = await storage.createProbeDefinition({ name: "Endpoint Control Validator", description: "Validates command & control authority and encryption status for all remote-operated platforms", type: "endpoint_control", config: { requireEncryption: true, validateAuth: true, maxHandoffLatency: "500ms" }, schedule: "Every 10 minutes", active: true, organizationId: org.id });
  const endpointRun = await storage.createProbeRun({ probeId: endpointCtrl.id, status: "pass", result: { endpointsValidated: 10, encrypted: 10, authValid: 10, avgHandoff: "120ms" }, completedAt: new Date() });
  await storage.createTelemetryEvent({ probeRunId: endpointRun.id, type: "endpoint_check", severity: "info", message: "All 10 endpoint control channels encrypted and authenticated", data: { endpoints: 10, encrypted: 10 } });

  const fuelEndurance = await storage.createProbeDefinition({ name: "Fuel & Endurance Monitor", description: "Tracks fuel levels and remaining endurance for airborne assets, alerts when below threshold", type: "fuel_endurance", config: { minFuelPercent: 30, alertThreshold: "2hr" }, schedule: "Every 15 minutes", active: true, organizationId: org.id });
  const fuelRun = await storage.createProbeRun({ probeId: fuelEndurance.id, status: "warning", result: { assetsMonitored: 12, belowThreshold: 1, details: "RQ-7 Shadow Tac-Drone 1 at 35% fuel, 3.2hr remaining" }, completedAt: new Date() });
  await storage.createTelemetryEvent({ probeRunId: fuelRun.id, type: "fuel_check", severity: "warning", message: "RQ-7 Shadow Tac-Drone 1 approaching fuel threshold (35%, 3.2hr remaining)", data: { asset: "RQ-7 Shadow 1", fuel: 35, hoursRemaining: 3.2 } });

  // GEO ASSETS - Military positions on the map
  await storage.createGeoAsset({ name: "1st Combined Arms Brigade HQ", category: "ground_force", assetType: "brigade_hq", lat: 34.68, lng: 33.04, status: "deployed", classification: "secret", missionId: defenseMission.id, properties: { readiness: "C1", personnel: 4500, equipment: "M1A2, M2A3, M109A7" } });
  await storage.createGeoAsset({ name: "FOB Eagle Point", category: "installation", assetType: "fob", lat: 34.89, lng: 33.62, status: "active", classification: "secret", missionId: defenseMission.id, properties: { capacity: 800, defenseLevel: "Enhanced", perimeter: "Secured" } });
  await storage.createGeoAsset({ name: "DDG-119 USS Delbert D. Black", category: "naval", assetType: "destroyer", lat: 34.42, lng: 34.15, status: "active", classification: "secret", missionId: defenseMission.id, properties: { speed: "30kn", weapons: "SM-6, ESSM, Harpoon", aegis: true } });
  await storage.createGeoAsset({ name: "CG-73 USS Port Royal", category: "naval", assetType: "cruiser", lat: 34.15, lng: 34.55, status: "active", classification: "secret", missionId: defenseMission.id, properties: { speed: "30kn", weapons: "SM-2, SM-3, Tomahawk", aegis: true } });
  await storage.createGeoAsset({ name: "MQ-9 Reaper Orbit Alpha", category: "air", assetType: "uav", lat: 34.55, lng: 34.80, status: "active", classification: "secret", missionId: defenseMission.id, properties: { altitude: "25000ft", endurance: "27hr", sensors: "EO/IR, SAR" } });
  await storage.createGeoAsset({ name: "MQ-9 Reaper Orbit Bravo", category: "air", assetType: "uav", lat: 35.10, lng: 33.20, status: "active", classification: "secret", missionId: defenseMission.id, properties: { altitude: "28000ft", endurance: "24hr", sensors: "SIGINT" } });
  await storage.createGeoAsset({ name: "F-35A Lightning II CAP", category: "air", assetType: "fighter", lat: 34.92, lng: 32.85, status: "active", classification: "top_secret", missionId: defenseMission.id, properties: { altitude: "35000ft", mission: "Combat Air Patrol", weapons: "AIM-120D, AIM-9X" } });
  await storage.createGeoAsset({ name: "SIGINT Collection Post", category: "intelligence", assetType: "sigint_station", lat: 35.18, lng: 33.38, status: "active", classification: "top_secret", missionId: defenseMission.id, properties: { coverage: "360deg", range: "200km", systems: "AN/ALQ-99" } });
  await storage.createGeoAsset({ name: "Supply Convoy Route Alpha", category: "logistics", assetType: "supply_route", lat: 34.75, lng: 33.30, status: "active", classification: "confidential", missionId: defenseMission.id, properties: { route: "Port → FOB", convoy_size: 12, est_time: "4hr" } });
  await storage.createGeoAsset({ name: "Field Hospital Charlie", category: "medical", assetType: "field_hospital", lat: 34.78, lng: 33.55, status: "active", classification: "unclassified", missionId: defenseMission.id, properties: { beds: 50, surgical: true, medevac: "available" } });

  // Threat/adversary positions
  await storage.createGeoAsset({ name: "Coastal Defense Battery Alpha", category: "threat", assetType: "a2ad", lat: 34.90, lng: 35.85, status: "active", classification: "secret", missionId: defenseMission.id, properties: { systems: "HQ-9, YJ-12", range: "400km", assessed_capability: "High" } });
  await storage.createGeoAsset({ name: "Hostile Radar Site Delta", category: "threat", assetType: "radar", lat: 35.15, lng: 35.70, status: "active", classification: "secret", missionId: defenseMission.id, properties: { type: "S-400", range: "600km", tracking: "Active" } });
  await storage.createGeoAsset({ name: "Hostile Naval Patrol", category: "threat", assetType: "patrol_boat", lat: 34.65, lng: 35.20, status: "active", classification: "secret", missionId: defenseMission.id, properties: { vessels: 3, type: "Fast Attack Craft", weapons: "C-802" } });

  // Surveillance Drones
  await storage.createGeoAsset({ name: "RQ-4 Global Hawk Orbit Charlie", category: "air", assetType: "hale_uav", lat: 34.75, lng: 34.20, status: "active", classification: "top_secret", missionId: defenseMission.id, properties: { altitude: "55000ft", endurance: "34hr", sensors: "Multi-INT, SIGINT, EO/IR", range: "12300nm", callsign: "HAWK-3" } });
  await storage.createGeoAsset({ name: "MQ-1C Gray Eagle Orbit Delta", category: "air", assetType: "male_uav", lat: 34.30, lng: 33.90, status: "active", classification: "secret", missionId: defenseMission.id, properties: { altitude: "25000ft", endurance: "25hr", sensors: "EO/IR, SAR, SIGINT", weapons: "AGM-114 Hellfire", callsign: "EAGLE-7" } });
  await storage.createGeoAsset({ name: "RQ-7 Shadow Tac-Drone 1", category: "air", assetType: "tac_uav", lat: 34.82, lng: 33.15, status: "active", classification: "secret", missionId: defenseMission.id, properties: { altitude: "15000ft", endurance: "9hr", sensors: "EO/IR", range: "125km", unit: "1st CAB" } });
  await storage.createGeoAsset({ name: "RQ-7 Shadow Tac-Drone 2", category: "air", assetType: "tac_uav", lat: 34.95, lng: 33.45, status: "active", classification: "secret", missionId: defenseMission.id, properties: { altitude: "14000ft", endurance: "8hr", sensors: "EO/IR", range: "125km", unit: "1st CAB" } });
  await storage.createGeoAsset({ name: "ScanEagle Small UAS Flight 1", category: "air", assetType: "small_uav", lat: 34.50, lng: 34.65, status: "active", classification: "confidential", missionId: defenseMission.id, properties: { altitude: "5000ft", endurance: "20hr", sensors: "EO/IR", range: "60nm", launched: "DDG-119" } });
  await storage.createGeoAsset({ name: "MQ-25 Stingray Tanker Drone", category: "air", assetType: "tanker_uav", lat: 34.60, lng: 33.70, status: "active", classification: "top_secret", missionId: defenseMission.id, properties: { altitude: "30000ft", role: "Aerial Refueling", fuelCapacity: "15000lbs", callsign: "STING-1" } });

  // Fixed-Wing Aircraft
  await storage.createGeoAsset({ name: "E-3G Sentry AWACS", category: "air", assetType: "awacs", lat: 35.05, lng: 34.10, status: "active", classification: "top_secret", missionId: defenseMission.id, properties: { altitude: "29000ft", radarRange: "250nm", crew: 24, callsign: "MAGIC-21", role: "Airborne Early Warning" } });
  await storage.createGeoAsset({ name: "P-8A Poseidon ASW-1", category: "air", assetType: "patrol_aircraft", lat: 34.20, lng: 34.80, status: "active", classification: "secret", missionId: defenseMission.id, properties: { altitude: "8000ft", role: "Anti-Submarine Warfare", sonobuoys: 120, callsign: "TRIDENT-5" } });
  await storage.createGeoAsset({ name: "F-35A Lightning II Strike Package", category: "air", assetType: "fighter", lat: 35.20, lng: 33.60, status: "active", classification: "top_secret", missionId: defenseMission.id, properties: { altitude: "40000ft", mission: "Strike Package", weapons: "GBU-31 JDAM, AIM-120D", flight: "4-ship" } });
  await storage.createGeoAsset({ name: "KC-135 Stratotanker", category: "air", assetType: "tanker", lat: 35.30, lng: 33.00, status: "active", classification: "secret", missionId: defenseMission.id, properties: { altitude: "28000ft", fuelCapacity: "200000lbs", callsign: "SHELL-22", orbit: "Track Alpha" } });
  await storage.createGeoAsset({ name: "RC-135V Rivet Joint", category: "intelligence", assetType: "recon_aircraft", lat: 34.45, lng: 35.00, status: "active", classification: "top_secret", missionId: defenseMission.id, properties: { altitude: "34000ft", role: "SIGINT/ELINT Collection", crew: 32, callsign: "OLIVE-77" } });
  await storage.createGeoAsset({ name: "C-17 Globemaster III Airlift", category: "logistics", assetType: "transport", lat: 34.65, lng: 32.90, status: "active", classification: "confidential", missionId: defenseMission.id, properties: { role: "Strategic Airlift", payload: "170900lbs", destination: "FOB Eagle Point", callsign: "REACH-42" } });

  // Hostile Drones (Threats)
  await storage.createGeoAsset({ name: "Hostile UAV Swarm Alpha", category: "threat", assetType: "hostile_uav", lat: 34.80, lng: 35.50, status: "active", classification: "secret", missionId: defenseMission.id, properties: { type: "Small UAS Swarm", count: 12, altitude: "2000ft", assessed_intent: "ISR", threat_level: "Medium" } });
  await storage.createGeoAsset({ name: "Hostile UCAV Track Bravo", category: "threat", assetType: "hostile_ucav", lat: 35.00, lng: 35.60, status: "active", classification: "secret", missionId: defenseMission.id, properties: { type: "Armed UCAV", weapons: "PGM", altitude: "18000ft", assessed_intent: "Strike", threat_level: "High" } });

  // Missile Defense Systems
  await storage.createGeoAsset({ name: "Patriot PAC-3 Battery Alpha", category: "missile_defense", assetType: "patriot", lat: 34.72, lng: 33.12, status: "active", classification: "top_secret", missionId: defenseMission.id, properties: { system: "MIM-104 PAC-3 MSE", range: "160km", interceptors: 16, readiness: "C1", coverage: "360deg" } });
  await storage.createGeoAsset({ name: "THAAD Battery Bravo", category: "missile_defense", assetType: "thaad", lat: 34.85, lng: 33.50, status: "active", classification: "top_secret", missionId: defenseMission.id, properties: { system: "THAAD", range: "200km", interceptors: 48, radar: "AN/TPY-2", coverage: "Ballistic Missile Defense" } });
  await storage.createGeoAsset({ name: "Iron Dome Battery Charlie", category: "missile_defense", assetType: "iron_dome", lat: 34.60, lng: 33.25, status: "active", classification: "secret", missionId: defenseMission.id, properties: { system: "Iron Dome", range: "70km", interceptors: 20, role: "Short-Range Air Defense", targets: "Rockets, Artillery, Mortars" } });
  await storage.createGeoAsset({ name: "SA-21 Growler (Hostile)", category: "threat", assetType: "hostile_sam", lat: 35.25, lng: 35.80, status: "active", classification: "secret", missionId: defenseMission.id, properties: { system: "S-400 Triumf", range: "400km", tracking: "Active", assessed_capability: "High", threat_level: "Critical" } });

  // Strike / Fire Support
  await storage.createGeoAsset({ name: "M142 HIMARS Battery Fox", category: "strike", assetType: "himars", lat: 34.70, lng: 33.08, status: "active", classification: "secret", missionId: defenseMission.id, properties: { system: "M142 HIMARS", munitions: "GMLRS, ATACMS", range: "300km", rounds: 24, readiness: "C1" } });
  await storage.createGeoAsset({ name: "Tomahawk Strike Package", category: "strike", assetType: "cruise_missile", lat: 34.42, lng: 34.15, status: "standby", classification: "top_secret", missionId: defenseMission.id, properties: { type: "BGM-109 Tomahawk Block V", range: "1600km", warhead: "JMEW", launchPlatform: "DDG-119", quantity: 8 } });
  await storage.createGeoAsset({ name: "M109A7 Paladin Battery", category: "strike", assetType: "artillery", lat: 34.66, lng: 33.00, status: "active", classification: "secret", missionId: defenseMission.id, properties: { system: "M109A7 Paladin", caliber: "155mm", range: "30km (Excalibur: 40km)", rounds: 39, unit: "1st CAB" } });
  await storage.createGeoAsset({ name: "Hostile Ballistic TEL", category: "threat", assetType: "hostile_missile", lat: 35.10, lng: 35.90, status: "active", classification: "top_secret", missionId: defenseMission.id, properties: { type: "SRBM TEL", system: "Fateh-313", range: "500km", assessed_intent: "Strike", threat_level: "Critical" } });

  // Installations / Base Stations
  await storage.createGeoAsset({ name: "Akrotiri Air Base", category: "installation", assetType: "airbase", lat: 34.59, lng: 32.98, status: "active", classification: "secret", missionId: defenseMission.id, properties: { runway: "9000ft", capacity: "40 aircraft", fuel: "JP-8 500000gal", defenses: "SHORAD, CIWS" } });
  await storage.createGeoAsset({ name: "Naval Station Echo", category: "installation", assetType: "naval_base", lat: 34.35, lng: 33.95, status: "active", classification: "secret", missionId: defenseMission.id, properties: { berths: 8, dryDock: true, fuelCapacity: "2M gal", ammoStorage: "Class V" } });
  await storage.createGeoAsset({ name: "Tactical Command Post Kilo", category: "installation", assetType: "command_post", lat: 34.80, lng: 33.40, status: "active", classification: "top_secret", missionId: defenseMission.id, properties: { type: "Mobile CP", systems: "CPOF, GCCS-A, AFATDS", comms: "SATCOM, HF, VHF", personnel: 45 } });
  await storage.createGeoAsset({ name: "SATCOM Relay Station", category: "installation", assetType: "comms_relay", lat: 35.00, lng: 33.30, status: "active", classification: "secret", missionId: defenseMission.id, properties: { type: "Wideband SATCOM", bandwidth: "2Gbps", coverage: "Theater-wide", redundancy: "Dual-path" } });

  // Ground Forces (expanded)
  await storage.createGeoAsset({ name: "2nd Armored Battalion", category: "ground_force", assetType: "armor", lat: 34.73, lng: 33.18, status: "deployed", classification: "secret", missionId: defenseMission.id, properties: { vehicles: "14x M1A2 SEPv3", personnel: 420, readiness: "C1", attachments: "M2A3 Bradley x12" } });
  await storage.createGeoAsset({ name: "3rd Infantry Company", category: "ground_force", assetType: "infantry", lat: 34.84, lng: 33.28, status: "deployed", classification: "secret", missionId: defenseMission.id, properties: { personnel: 180, weapons: "M4A1, M240B, Javelin", transport: "M-ATV", role: "Perimeter Security" } });
  await storage.createGeoAsset({ name: "ODA-5131 Special Forces", category: "ground_force", assetType: "sof", lat: 34.95, lng: 34.70, status: "active", classification: "top_secret", missionId: defenseMission.id, properties: { unit: "5th SFG", mission: "Special Reconnaissance", insertionMethod: "HALO", comms: "Encrypted SATCOM" } });

  // Naval (expanded)
  await storage.createGeoAsset({ name: "SSN-790 USS South Dakota", category: "naval", assetType: "submarine", lat: 34.05, lng: 34.30, status: "active", classification: "top_secret", missionId: defenseMission.id, properties: { class: "Virginia Block IV", weapons: "Tomahawk, Mk48 ADCAP", depth: "Classified", mission: "ISR / Strike" } });
  await storage.createGeoAsset({ name: "CVN-78 USS Gerald R. Ford", category: "naval", assetType: "carrier", lat: 33.80, lng: 33.50, status: "active", classification: "top_secret", missionId: defenseMission.id, properties: { airWing: "CVW-8 (75 aircraft)", escorts: "CSG-12", speed: "30+ knots", crew: 4539 } });
  await storage.createGeoAsset({ name: "FFG-62 USS Constellation", category: "naval", assetType: "frigate", lat: 34.25, lng: 34.40, status: "active", classification: "secret", missionId: defenseMission.id, properties: { class: "Constellation-class", weapons: "NSM, ESSM, Mk110", role: "ASW / Surface Warfare", speed: "26kn" } });
  await storage.createGeoAsset({ name: "Hostile Corvette Group", category: "threat", assetType: "hostile_ship", lat: 34.50, lng: 35.40, status: "active", classification: "secret", missionId: defenseMission.id, properties: { vessels: 2, type: "Buyan-M Corvette", weapons: "Kalibr SLCM", assessed_intent: "Patrol / Strike", threat_level: "High" } });
  await storage.createGeoAsset({ name: "Hostile Submarine Contact", category: "threat", assetType: "hostile_sub", lat: 34.10, lng: 35.10, status: "active", classification: "top_secret", missionId: defenseMission.id, properties: { type: "Kilo-class (636.3)", depth: "Unknown", assessed_intent: "ISR", threat_level: "High", lastContact: "2hr ago" } });

  // Intelligence / EW / Cyber (expanded)
  await storage.createGeoAsset({ name: "EW Jamming Station Zulu", category: "intelligence", assetType: "ew_station", lat: 34.88, lng: 33.72, status: "active", classification: "top_secret", missionId: defenseMission.id, properties: { system: "AN/TLQ-46", capability: "Communications Jamming, Radar Jamming", range: "150km", coverage: "Directional" } });
  await storage.createGeoAsset({ name: "Cyber Operations Node", category: "intelligence", assetType: "cyber_node", lat: 34.60, lng: 33.05, status: "active", classification: "top_secret", missionId: defenseMission.id, properties: { unit: "CYBERCOM Det", capability: "CNO, CNA, CND", targets: "APT-47 Infrastructure", status: "Active Operations" } });
  await storage.createGeoAsset({ name: "MUOS Ground Terminal", category: "intelligence", assetType: "satellite_gnd", lat: 34.55, lng: 32.95, status: "active", classification: "top_secret", missionId: defenseMission.id, properties: { satellite: "MUOS-5", role: "Wideband SATCOM", bandwidth: "384kbps", coverage: "Global" } });

  // Air (expanded)
  await storage.createGeoAsset({ name: "B-2A Spirit Strike Package", category: "air", assetType: "bomber", lat: 35.40, lng: 32.70, status: "standby", classification: "top_secret", missionId: defenseMission.id, properties: { altitude: "50000ft", mission: "Strategic Strike", weapons: "GBU-57 MOP, B61-12", callsign: "DEATH-11", stealth: true } });
  await storage.createGeoAsset({ name: "AH-64E Apache Flight", category: "air", assetType: "helicopter", lat: 34.70, lng: 33.22, status: "active", classification: "secret", missionId: defenseMission.id, properties: { altitude: "500ft", mission: "Close Air Support", weapons: "AGM-114L, M230 30mm", flight: "2-ship", callsign: "VIKING-6" } });
  await storage.createGeoAsset({ name: "Switchblade 600 Section", category: "air", assetType: "loitering_munition", lat: 34.90, lng: 33.60, status: "active", classification: "secret", missionId: defenseMission.id, properties: { type: "Loitering Munition", warhead: "Anti-Armor", range: "40km", endurance: "40min", quantity: 6, operator: "ODA-5131" } });

  // GEO ZONES - Operational areas
  await storage.createGeoZone({ name: "AO Sentinel", zoneType: "operational_area", coordinates: [[34.2, 32.5], [35.5, 32.5], [35.5, 35.0], [34.2, 35.0]], color: "#3b82f6", classification: "secret", missionId: defenseMission.id, properties: { commander: "COL Richardson", status: "Active" } });
  await storage.createGeoZone({ name: "Threat Engagement Zone", zoneType: "threat_zone", coordinates: [[34.5, 35.3], [35.4, 35.3], [35.4, 36.2], [34.5, 36.2]], color: "#ef4444", classification: "secret", missionId: defenseMission.id, properties: { threatLevel: "High", systems: ["HQ-9", "S-400"] } });
  await storage.createGeoZone({ name: "ISR Coverage Zone", zoneType: "surveillance", coordinates: [[34.3, 33.0], [35.3, 33.0], [35.3, 35.5], [34.3, 35.5]], color: "#8b5cf6", classification: "secret", missionId: defenseMission.id, properties: { sensors: ["EO/IR", "SAR", "SIGINT"], coverageHours: 24 } });
  await storage.createGeoZone({ name: "Naval Exclusion Zone", zoneType: "exclusion", coordinates: [[34.0, 34.8], [34.8, 34.8], [34.8, 35.6], [34.0, 35.6]], color: "#f59e0b", classification: "confidential", missionId: defenseMission.id, properties: { enforcement: "Active", ruleOfEngagement: "Defensive" } });
  await storage.createGeoZone({ name: "Forward Logistics Area", zoneType: "logistics", coordinates: [[34.6, 32.8], [34.95, 32.8], [34.95, 33.3], [34.6, 33.3]], color: "#10b981", classification: "confidential", missionId: defenseMission.id, properties: { supplies: "Class I-V", capacity: "5000t" } });

  // Intel Reports
  await storage.createIntelReport({ title: "SIGINT Summary: Eastern Med Communications", summary: "Increased encrypted communications detected from coastal defense installations. Pattern analysis suggests elevated alert status.", classification: "secret", source: "NSA/CSS", lat: 35.0, lng: 35.5, missionId: defenseMission.id, severity: "high", status: "active" });
  await storage.createIntelReport({ title: "HUMINT: Port Activity Assessment", summary: "Source reports unusual naval activity at Port Tartus. Three corvettes observed loading munitions.", classification: "secret", source: "DIA", lat: 34.88, lng: 35.88, missionId: defenseMission.id, severity: "high", status: "active" });
  await storage.createIntelReport({ title: "IMINT: Coastal Battery Repositioning", summary: "Satellite imagery confirms mobile TEL repositioning at grid reference 34.90N 35.85E. Two new launch positions identified.", classification: "top_secret", source: "NRO", lat: 34.90, lng: 35.85, missionId: defenseMission.id, severity: "critical", status: "active" });
  await storage.createIntelReport({ title: "OSINT: Maritime Traffic Analysis", summary: "Commercial shipping diverted from normal routes. Pattern consistent with undeclared naval exercise.", classification: "unclassified", source: "ONI", lat: 34.30, lng: 34.50, missionId: defenseMission.id, severity: "medium", status: "pending" });
  await storage.createIntelReport({ title: "CYBER: APT-47 Infrastructure Mapping", summary: "Identified C2 infrastructure linked to APT-47 Crimson Viper. 3 new IP ranges attributed.", classification: "top_secret", source: "CYBERCOM", lat: 35.10, lng: 35.40, missionId: defenseMission.id, severity: "high", status: "active" });

  // Defense Audit Logs
  await storage.createAuditLog({ userId: adminUser.id, action: "CREATE", entityType: "mission", entityId: defenseMission.id, details: { name: "Operation Sentinel Shield" } });
  await storage.createAuditLog({ userId: operatorUser.id, action: "DEPLOY", entityType: "geo_asset", entityId: defenseMission.id, details: { assets: 10, theater: "Eastern Mediterranean" } });

  console.log("Database seeded successfully!");
}

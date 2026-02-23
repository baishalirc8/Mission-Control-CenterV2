import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import session from "express-session";
import { seedDatabase } from "./seed";
import { db } from "./db";
import OpenAI from "openai";

declare module "express-session" {
  interface SessionData {
    userId?: string;
    role?: string;
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Session setup
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "mission-os-dev-secret",
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 },
    })
  );

  // Push schema and seed
  try {
    const { migrate } = await import("drizzle-orm/node-postgres/migrator");
    // Use db:push approach via drizzle-kit at startup
  } catch (e) {}

  // Auth middleware
  function requireAuth(req: Request, res: Response, next: Function) {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  }

  function requireRole(...roles: string[]) {
    return (req: Request, res: Response, next: Function) => {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      if (!roles.includes(req.session.role || "")) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      next();
    };
  }

  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      req.session.userId = user.id;
      req.session.role = user.role;
      await storage.createAuditLog({
        userId: user.id,
        action: "LOGIN",
        entityType: "user",
        entityId: user.id,
      });
      res.json({ id: user.id, username: user.username, displayName: user.displayName, role: user.role });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not logged in" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user) return res.status(401).json({ message: "User not found" });
    res.json({ id: user.id, username: user.username, displayName: user.displayName, role: user.role });
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {});
    res.json({ ok: true });
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", requireAuth, async (req, res) => {
    try {
      const missions = await storage.getMissions();
      const activeMissions = missions.filter(m => m.status === "active").length;
      const probeRuns = await storage.getProbeDefinitions();
      let passCount = 0, failCount = 0, warnCount = 0;
      for (const p of probeRuns) {
        const runs = await storage.getProbeRuns(p.id);
        for (const r of runs) {
          if (r.status === "pass") passCount++;
          else if (r.status === "fail") failCount++;
          else if (r.status === "warning") warnCount++;
        }
      }
      const total = passCount + failCount + warnCount;
      const overdueTasks = (await storage.getOverdueTasks()).length;
      const evidence = await storage.getAllEvidence();

      const missionsByType: Record<string, number> = {};
      const templates = await storage.getMissionTemplates();
      for (const m of missions) {
        const tmpl = templates.find(t => t.id === m.templateId);
        const sector = tmpl?.sector || "unknown";
        missionsByType[sector] = (missionsByType[sector] || 0) + 1;
      }

      res.json({
        activeMissions,
        probePassRate: total > 0 ? Math.round((passCount / total) * 100) : 0,
        overdueTasks,
        evidenceCount: evidence.length,
        missionsByType: Object.entries(missionsByType).map(([sector, count]) => ({ sector: sector.replace(/_/g, " "), count })),
        probeStats: { pass: passCount, fail: failCount, warning: warnCount },
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Missions
  app.get("/api/missions", requireAuth, async (req, res) => {
    try {
      res.json(await storage.getMissions());
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/missions/:id", requireAuth, async (req, res) => {
    try {
      const mission = await storage.getMission(req.params.id);
      if (!mission) return res.status(404).json({ message: "Not found" });
      res.json(mission);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/missions", requireAuth, async (req, res) => {
    try {
      const { templateId, name, description } = req.body;
      const template = await storage.getMissionTemplate(templateId);
      if (!template) return res.status(400).json({ message: "Template not found" });

      const mission = await storage.createMission({
        templateId,
        name,
        description,
        status: "active",
        createdBy: req.session.userId,
      });

      // Create workflow instance
      const wfDef = (template.workflowDefinition as any);
      if (wfDef?.definitionId) {
        const def = await storage.getWorkflowDefinition(wfDef.definitionId);
        if (def) {
          const states = (def.states as any[]) || [];
          const initial = states.find((s: any) => s.initial)?.name || states[0]?.name || "open";
          await storage.createWorkflowInstance({
            definitionId: def.id,
            missionId: mission.id,
            currentState: initial,
          });
        }
      }

      await storage.createAuditLog({
        userId: req.session.userId,
        action: "CREATE",
        entityType: "mission",
        entityId: mission.id,
        details: { name, templateId },
      });

      res.json(mission);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Mission workflow
  app.get("/api/missions/:id/workflow", requireAuth, async (req, res) => {
    try {
      const instance = await storage.getWorkflowInstanceByMission(req.params.id);
      if (!instance) return res.json({ currentState: null, availableTransitions: [] });

      const def = await storage.getWorkflowDefinition(instance.definitionId!);
      const transitions = (def?.transitions as any[]) || [];
      const userRole = req.session.role || "";

      const available = transitions
        .filter((t: any) => t.from === instance.currentState)
        .filter((t: any) => !t.roles || t.roles.includes(userRole) || userRole === "admin")
        .map((t: any) => ({ toState: t.to, label: t.label }));

      res.json({ currentState: instance.currentState, availableTransitions: available });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/missions/:id/transition", requireAuth, async (req, res) => {
    try {
      const { toState } = req.body;
      const instance = await storage.getWorkflowInstanceByMission(req.params.id);
      if (!instance) return res.status(400).json({ message: "No workflow instance" });

      const def = await storage.getWorkflowDefinition(instance.definitionId!);
      const transitions = (def?.transitions as any[]) || [];
      const userRole = req.session.role || "";

      const valid = transitions.find(
        (t: any) => t.from === instance.currentState && t.to === toState &&
        (!t.roles || t.roles.includes(userRole) || userRole === "admin")
      );

      if (!valid) {
        return res.status(403).json({ message: "Transition not allowed for your role" });
      }

      const fromState = instance.currentState;
      await storage.updateWorkflowInstanceState(instance.id, toState);
      await storage.createWorkflowTransition({
        instanceId: instance.id,
        fromState,
        toState,
        triggeredBy: req.session.userId,
        notes: req.body.notes || null,
      });

      await storage.createAuditLog({
        userId: req.session.userId,
        action: "TRANSITION",
        entityType: "workflow",
        entityId: instance.id,
        details: { from: fromState, to: toState },
      });

      // Check if final state -> update mission status
      const states = (def?.states as any[]) || [];
      const targetState = states.find((s: any) => s.name === toState);
      if (targetState?.final) {
        const { missions: missionsTable } = await import("@shared/schema");
        const { eq } = await import("drizzle-orm");
        await db.update(missionsTable).set({ status: "completed" }).where(eq(missionsTable.id, req.params.id));
      }

      res.json({ ok: true, currentState: toState });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Mission tasks
  app.get("/api/missions/:id/tasks", requireAuth, async (req, res) => {
    try {
      res.json(await storage.getTasksByMission(req.params.id));
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Mission evidence
  app.get("/api/missions/:id/evidence", requireAuth, async (req, res) => {
    try {
      res.json(await storage.getEvidenceByMission(req.params.id));
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Mission timeline
  app.get("/api/missions/:id/timeline", requireAuth, async (req, res) => {
    try {
      const instance = await storage.getWorkflowInstanceByMission(req.params.id);
      if (!instance) return res.json([]);
      res.json(await storage.getWorkflowTransitions(instance.id));
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Mission export (evidence pack)
  app.get("/api/missions/:id/export", requireAuth, async (req, res) => {
    try {
      const mission = await storage.getMission(req.params.id);
      if (!mission) return res.status(404).json({ message: "Not found" });

      const tasks = await storage.getTasksByMission(req.params.id);
      const evidence = await storage.getEvidenceByMission(req.params.id);
      const instance = await storage.getWorkflowInstanceByMission(req.params.id);
      const timeline = instance ? await storage.getWorkflowTransitions(instance.id) : [];

      const pack = {
        exportedAt: new Date().toISOString(),
        mission: { id: mission.id, name: mission.name, description: mission.description, status: mission.status },
        workflowTimeline: timeline.map(t => ({ from: t.fromState, to: t.toState, timestamp: t.timestamp, notes: t.notes })),
        tasks: tasks.map(t => ({ id: t.id, title: t.title, status: t.status, priority: t.priority })),
        evidence: evidence.map(e => ({ id: e.id, title: e.title, type: e.type, hash: e.hash, createdAt: e.createdAt, content: e.content })),
      };

      await storage.createAuditLog({
        userId: req.session.userId,
        action: "EXPORT",
        entityType: "evidence_pack",
        entityId: mission.id,
      });

      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", `attachment; filename=mission-${mission.id}-evidence-pack.json`);
      res.json(pack);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Mission templates
  app.get("/api/mission-templates", requireAuth, async (req, res) => {
    try {
      res.json(await storage.getMissionTemplates());
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Workflow definitions
  app.get("/api/workflow-definitions", requireAuth, async (req, res) => {
    try {
      res.json(await storage.getWorkflowDefinitions());
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/workflow-definitions", requireAuth, async (req, res) => {
    try {
      const { name, description, states, transitions } = req.body;
      const wf = await storage.createWorkflowDefinition({
        name,
        description,
        states,
        transitions,
        published: true,
      });
      await storage.createAuditLog({
        userId: req.session.userId,
        action: "CREATE",
        entityType: "workflow_definition",
        entityId: wf.id,
      });
      res.json(wf);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Probes
  app.get("/api/probes", requireAuth, async (req, res) => {
    try {
      res.json(await storage.getProbeDefinitions());
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/probes/:id/runs", requireAuth, async (req, res) => {
    try {
      res.json(await storage.getProbeRuns(req.params.id));
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/probes/:id/run", requireAuth, async (req, res) => {
    try {
      const probe = await storage.getProbeDefinition(req.params.id);
      if (!probe) return res.status(404).json({ message: "Probe not found" });

      const run = await storage.createProbeRun({
        probeId: probe.id,
        status: "running",
        result: {},
      });

      let status = "pass";
      let result: any = {};
      let severity = "info";
      let message = "";

      if (probe.type === "sla_breach_detector") {
        const overdue = await storage.getOverdueTasks();
        if (overdue.length > 0) {
          status = "warning";
          severity = "warning";
          result = { overdueTasks: overdue.length, taskIds: overdue.map(t => t.id) };
          message = `SLA breach detected: ${overdue.length} overdue task(s)`;

          for (const task of overdue) {
            await storage.createEvidenceItem({
              missionId: task.missionId,
              probeRunId: run.id,
              type: "probe_evidence",
              title: `SLA breach evidence: ${task.title}`,
              content: { taskId: task.id, dueDate: task.dueDate, status: task.status },
            });
          }
        } else {
          result = { overdueTasks: 0 };
          message = "No SLA breaches detected";
        }
      } else if (probe.type === "data_freshness") {
        const sources = await storage.getDataSources();
        const stale = sources.filter(s => {
          if (!s.lastIngestion) return true;
          const age = Date.now() - new Date(s.lastIngestion).getTime();
          return age > 24 * 60 * 60 * 1000;
        });
        if (stale.length > 0) {
          status = "warning";
          severity = "warning";
          result = { staleSources: stale.length };
          message = `${stale.length} data source(s) stale`;
        } else {
          result = { allFresh: true, sourcesChecked: sources.length };
          message = `All ${sources.length} data sources are fresh`;
        }
      } else if (probe.type === "compliance_evidence_completeness") {
        const missions = await storage.getMissions();
        const activeMissions = missions.filter(m => m.status === "active");
        let incomplete = 0;
        for (const m of activeMissions) {
          const evidence = await storage.getEvidenceByMission(m.id);
          if (evidence.length < 2) incomplete++;
        }
        if (incomplete > 0) {
          status = "fail";
          severity = "warning";
          result = { incompleteMissions: incomplete };
          message = `${incomplete} mission(s) missing required evidence`;
        } else {
          result = { allComplete: true };
          message = "All missions have required evidence";
        }
      }

      await storage.updateProbeRun(run.id, { status, result, completedAt: new Date() });
      await storage.createTelemetryEvent({
        probeRunId: run.id,
        type: probe.type,
        severity,
        message,
        data: result,
      });

      await storage.createAuditLog({
        userId: req.session.userId,
        action: "PROBE_RUN",
        entityType: "probe",
        entityId: probe.id,
        details: { status, result },
      });

      res.json({ runId: run.id, status, result });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Telemetry
  app.get("/api/telemetry/recent", requireAuth, async (req, res) => {
    try {
      res.json(await storage.getRecentTelemetry());
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Ontology
  app.get("/api/ontology/types", requireAuth, async (req, res) => {
    try {
      res.json(await storage.getOntologyTypes());
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/ontology/entities", requireAuth, async (req, res) => {
    try {
      res.json(await storage.getOntologyEntities());
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/ontology/entities/:id", requireAuth, async (req, res) => {
    try {
      const entity = await storage.getOntologyEntity(req.params.id);
      if (!entity) return res.status(404).json({ message: "Not found" });
      res.json(entity);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/ontology/relationships", requireAuth, async (req, res) => {
    try {
      res.json(await storage.getOntologyRelationships());
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Notifications
  app.get("/api/notifications", requireAuth, async (req, res) => {
    try {
      res.json(await storage.getNotifications());
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/notifications/unread", requireAuth, async (req, res) => {
    try {
      res.json(await storage.getUnreadNotifications());
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/notifications/read-all", requireAuth, async (req, res) => {
    try {
      await storage.markAllNotificationsRead();
      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // KPIs
  app.get("/api/kpis", requireAuth, async (req, res) => {
    try {
      res.json(await storage.getKpiSnapshots());
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/kpis/compute", requireAuth, async (req, res) => {
    try {
      await storage.deleteKpiSnapshots();

      const missions = await storage.getMissions();
      const activeMissions = missions.filter(m => m.status === "active").length;

      // Platform KPIs
      await storage.createKpiSnapshot({ name: "active_missions", category: "platform", value: String(activeMissions) });

      const overdue = await storage.getOverdueTasks();
      await storage.createKpiSnapshot({ name: "overdue_tasks", category: "platform", value: String(overdue.length) });

      let totalRuns = 0, passRuns = 0;
      const probes = await storage.getProbeDefinitions();
      for (const p of probes) {
        const runs = await storage.getProbeRuns(p.id);
        totalRuns += runs.length;
        passRuns += runs.filter(r => r.status === "pass").length;
      }
      await storage.createKpiSnapshot({ name: "probe_pass_rate", category: "platform", value: String(totalRuns > 0 ? Math.round((passRuns / totalRuns) * 100) : 0) });
      await storage.createKpiSnapshot({ name: "avg_time_in_state", category: "platform", value: "4.2" });

      // ITSM KPIs
      const tickets = await storage.getAllTickets();
      await storage.createKpiSnapshot({ name: "tickets_opened", category: "itsm", value: String(tickets.length) });
      await storage.createKpiSnapshot({ name: "tickets_closed", category: "itsm", value: String(tickets.filter(t => t.status === "resolved").length) });
      const resolved = tickets.filter(t => t.resolvedAt);
      const mttr = resolved.length > 0 ? Math.round(resolved.reduce((sum, t) => {
        return sum + (new Date(t.resolvedAt!).getTime() - new Date(t.createdAt).getTime()) / (1000 * 60 * 60);
      }, 0) / resolved.length) : 0;
      await storage.createKpiSnapshot({ name: "mean_time_to_resolve", category: "itsm", value: `${mttr}h` });

      // Cyber Compliance KPIs
      const controls = await storage.getControlsByOrg();
      const withEvidence = controls.filter(c => c.status === "compliant").length;
      await storage.createKpiSnapshot({ name: "controls_with_evidence", category: "cyber_compliance", value: `${withEvidence}/${controls.length}` });
      const readiness = controls.length > 0 ? Math.round((withEvidence / controls.length) * 100) : 0;
      await storage.createKpiSnapshot({ name: "audit_pack_readiness", category: "cyber_compliance", value: `${readiness}%` });

      // FIU/FATF KPIs
      const scores = await storage.getStrQualityScores();
      const avgScore = scores.length > 0 ? Math.round(scores.reduce((s, q) => s + q.score, 0) / scores.length) : 0;
      await storage.createKpiSnapshot({ name: "str_quality_avg", category: "fiu_fatf", value: String(avgScore) });
      const aboveThreshold = scores.filter(s => s.score >= 70).length;
      const pctAbove = scores.length > 0 ? Math.round((aboveThreshold / scores.length) * 100) : 0;
      await storage.createKpiSnapshot({ name: "str_above_threshold", category: "fiu_fatf", value: `${pctAbove}%` });

      const disc = await storage.getDiscrepancies();
      const resolved_disc = disc.filter(d => d.status === "resolved").length;
      const discRate = disc.length > 0 ? Math.round((resolved_disc / disc.length) * 100) : 0;
      await storage.createKpiSnapshot({ name: "bo_discrepancy_resolution", category: "fiu_fatf", value: `${discRate}%` });

      await storage.createAuditLog({
        userId: req.session.userId,
        action: "COMPUTE_KPIS",
        entityType: "kpi",
        entityId: null,
      });

      res.json(await storage.getKpiSnapshots());
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Admin routes
  app.get("/api/admin/users", requireAuth, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users.map(u => ({ ...u, password: undefined })));
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/admin/organizations", requireAuth, async (req, res) => {
    try {
      res.json(await storage.getOrganizations());
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Defense / GIS
  app.get("/api/defense/geo-assets", requireAuth, async (req, res) => {
    try {
      const missionId = req.query.missionId as string | undefined;
      res.json(await storage.getGeoAssets(missionId));
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/defense/geo-zones", requireAuth, async (req, res) => {
    try {
      const missionId = req.query.missionId as string | undefined;
      res.json(await storage.getGeoZones(missionId));
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/defense/intel-reports", requireAuth, async (req, res) => {
    try {
      const missionId = req.query.missionId as string | undefined;
      res.json(await storage.getIntelReports(missionId));
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/defense/map", requireAuth, async (req, res) => {
    try {
      const [assets, zones, reports] = await Promise.all([
        storage.getGeoAssets(),
        storage.getGeoZones(),
        storage.getIntelReports(),
      ]);
      res.json({ assets, zones, reports });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Command Control Center
  app.get("/api/c2/directives", requireAuth, async (req, res) => {
    try {
      res.json(await storage.getDirectives());
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/c2/directives", requireAuth, async (req, res) => {
    try {
      const directive = await storage.createDirective({
        ...req.body,
        issuedBy: req.session.userId,
      });
      await storage.createAuditLog({
        userId: req.session.userId,
        action: "ISSUE_DIRECTIVE",
        entityType: "directive",
        entityId: directive.id,
        details: { type: directive.type, command: directive.command, targetAssetId: directive.targetAssetId },
      });
      res.json(directive);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.patch("/api/c2/directives/:id/status", requireAuth, async (req, res) => {
    try {
      const directive = await storage.updateDirectiveStatus(req.params.id, req.body.status);
      await storage.createAuditLog({
        userId: req.session.userId,
        action: "UPDATE_DIRECTIVE",
        entityType: "directive",
        entityId: directive.id,
        details: { newStatus: req.body.status },
      });
      res.json(directive);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/c2/threat-responses", requireAuth, async (req, res) => {
    try {
      res.json(await storage.getThreatResponses());
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/c2/threat-responses", requireAuth, async (req, res) => {
    try {
      const response = await storage.createThreatResponse({
        ...req.body,
        issuedBy: req.session.userId,
      });
      await storage.createAuditLog({
        userId: req.session.userId,
        action: "THREAT_RESPONSE",
        entityType: "threat_response",
        entityId: response.id,
        details: { responseType: response.responseType, threatAssetId: response.threatAssetId },
      });
      res.json(response);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.patch("/api/c2/threat-responses/:id/status", requireAuth, async (req, res) => {
    try {
      const response = await storage.updateThreatResponseStatus(req.params.id, req.body.status);
      await storage.createAuditLog({
        userId: req.session.userId,
        action: "UPDATE_THREAT_RESPONSE",
        entityType: "threat_response",
        entityId: response.id,
        details: { newStatus: req.body.status },
      });
      res.json(response);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/c2/quick-action", requireAuth, async (req, res) => {
    try {
      const { action, parameters } = req.body;
      const directive = await storage.createDirective({
        type: "quick_action",
        command: action,
        parameters,
        status: "executing",
        priority: "urgent",
        issuedBy: req.session.userId,
      });
      await storage.createAuditLog({
        userId: req.session.userId,
        action: "QUICK_ACTION",
        entityType: "directive",
        entityId: directive.id,
        details: { action, parameters },
      });
      res.json(directive);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.patch("/api/defense/geo-assets/:id/status", requireAuth, async (req, res) => {
    try {
      const asset = await storage.updateGeoAssetStatus(req.params.id, req.body.status);
      await storage.createAuditLog({
        userId: req.session.userId,
        action: "UPDATE_ASSET_STATUS",
        entityType: "geo_asset",
        entityId: asset.id,
        details: { newStatus: req.body.status },
      });
      res.json(asset);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/c2/overview", requireAuth, async (req, res) => {
    try {
      const [assets, threats, directives, threatResponses, telemetry] = await Promise.all([
        storage.getGeoAssets(),
        storage.getGeoAssets(),
        storage.getDirectives(),
        storage.getThreatResponses(),
        storage.getRecentTelemetry(),
      ]);
      const friendlyAssets = assets.filter((a: any) => a.category !== "threat");
      const threatAssets = threats.filter((a: any) => a.category === "threat");
      const activeDirectives = directives.filter((d: any) => d.status !== "completed" && d.status !== "cancelled");
      const activeResponses = threatResponses.filter((t: any) => t.status !== "resolved");
      res.json({
        totalAssets: friendlyAssets.length,
        activeAssets: friendlyAssets.filter((a: any) => a.status === "active" || a.status === "deployed").length,
        totalThreats: threatAssets.length,
        activeDirectives: activeDirectives.length,
        pendingDirectives: directives.filter((d: any) => d.status === "pending").length,
        activeResponses: activeResponses.length,
        recentTelemetry: telemetry.slice(0, 10),
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // AI Recommendations
  app.get("/api/ai/recommendations", requireAuth, async (req, res) => {
    try {
      res.json(await storage.getAiRecommendations());
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/ai/recommendations/generate", requireAuth, requireRole("admin", "operator", "supervisor"), async (req, res) => {
    try {
      const [assets, threats, intelReports, directives, threatResponses] = await Promise.all([
        storage.getGeoAssets(),
        storage.getGeoAssets(),
        storage.getIntelReports(),
        storage.getDirectives(),
        storage.getThreatResponses(),
      ]);

      const friendlyAssets = assets.filter((a: any) => a.category !== "threat");
      const threatAssets = threats.filter((a: any) => a.category === "threat");
      const activeIntel = intelReports.filter((r: any) => r.status === "active");
      const pendingDirectives = directives.filter((d: any) => d.status === "pending" || d.status === "acknowledged");

      const situationBrief = JSON.stringify({
        friendlyAssets: friendlyAssets.map((a: any) => ({ name: a.name, type: a.assetType, category: a.category, status: a.status, lat: a.lat, lng: a.lng, properties: a.properties })),
        threats: threatAssets.map((a: any) => ({ name: a.name, type: a.assetType, status: a.status, lat: a.lat, lng: a.lng, properties: a.properties })),
        activeIntelReports: activeIntel.map((r: any) => ({ title: r.title, summary: r.summary, severity: r.severity, source: r.source })),
        pendingDirectives: pendingDirectives.length,
        activeResponses: threatResponses.filter((t: any) => t.status !== "resolved").length,
      });

      const openai = new OpenAI({
        apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
        baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      });

      const completion = await openai.chat.completions.create({
        model: "gpt-5-mini",
        messages: [
          {
            role: "system",
            content: `You are a military AI tactical advisor for the Holocron defense platform. Analyze the current operational situation and generate 3-5 actionable tactical recommendations. Each recommendation must have human approval before execution.

Return a JSON array of recommendations. Each object must have:
- title: Short tactical title (max 60 chars)
- category: One of "threat_response", "asset_reposition", "intelligence_collection", "force_protection", "logistics", "electronic_warfare", "mission_planning"
- priority: "critical", "high", "medium", or "low"
- summary: 1-2 sentence tactical summary
- reasoning: Detailed reasoning based on observed data (2-3 sentences)
- suggestedAction: Specific actionable step to take (1-2 sentences)
- affectedAssets: Array of asset names involved
- relatedThreats: Array of threat names involved
- confidence: Confidence score between 0.0 and 1.0

Focus on identifying:
1. Immediate threat responses needed
2. Asset repositioning opportunities
3. Intelligence gaps that need collection
4. Force protection improvements
5. Electronic warfare or counter-measures

Return a JSON object with a "recommendations" key containing the array.`
          },
          {
            role: "user",
            content: `Analyze this operational situation and provide tactical recommendations:\n\n${situationBrief}`
          }
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 8192,
      });

      const responseText = completion.choices[0]?.message?.content || "[]";
      let recommendations: any[];
      try {
        const parsed = JSON.parse(responseText);
        recommendations = Array.isArray(parsed) ? parsed : (parsed.recommendations || []);
      } catch {
        recommendations = [];
      }

      const mission = await storage.getMissions();
      const defenseMission = mission.find((m: any) => m.name?.includes("Sentinel"));
      const missionId = defenseMission?.id || null;

      const created = [];
      for (const rec of recommendations) {
        const saved = await storage.createAiRecommendation({
          title: rec.title || "Tactical Recommendation",
          category: rec.category || "threat_response",
          priority: rec.priority || "medium",
          summary: rec.summary || "",
          reasoning: rec.reasoning || "",
          suggestedAction: rec.suggestedAction || "",
          affectedAssets: rec.affectedAssets || [],
          relatedThreats: rec.relatedThreats || [],
          confidence: rec.confidence || 0.5,
          status: "pending",
          missionId,
        });
        created.push(saved);
      }

      await storage.createAuditLog({
        userId: req.session.userId,
        action: "AI_GENERATE_RECOMMENDATIONS",
        entityType: "ai_recommendation",
        entityId: "batch",
        details: { count: created.length },
      });

      res.json(created);
    } catch (err: any) {
      console.error("AI recommendation generation error:", err);
      res.status(500).json({ message: err.message });
    }
  });

  app.patch("/api/ai/recommendations/:id/approve", requireAuth, requireRole("admin", "operator", "supervisor"), async (req, res) => {
    try {
      const rec = await storage.updateAiRecommendationStatus(req.params.id, "approved", {
        reviewedBy: req.session.userId,
        reviewNotes: req.body.notes || "",
      });
      await storage.createAuditLog({
        userId: req.session.userId,
        action: "APPROVE_AI_RECOMMENDATION",
        entityType: "ai_recommendation",
        entityId: rec.id,
        details: { title: rec.title },
      });
      res.json(rec);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.patch("/api/ai/recommendations/:id/reject", requireAuth, requireRole("admin", "operator", "supervisor"), async (req, res) => {
    try {
      const rec = await storage.updateAiRecommendationStatus(req.params.id, "rejected", {
        reviewedBy: req.session.userId,
        reviewNotes: req.body.notes || "",
      });
      await storage.createAuditLog({
        userId: req.session.userId,
        action: "REJECT_AI_RECOMMENDATION",
        entityType: "ai_recommendation",
        entityId: rec.id,
        details: { title: rec.title },
      });
      res.json(rec);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.patch("/api/ai/recommendations/:id/execute", requireAuth, requireRole("admin", "operator"), async (req, res) => {
    try {
      const rec = await storage.updateAiRecommendationStatus(req.params.id, "executed");
      await storage.createAuditLog({
        userId: req.session.userId,
        action: "EXECUTE_AI_RECOMMENDATION",
        entityType: "ai_recommendation",
        entityId: rec.id,
        details: { title: rec.title, suggestedAction: rec.suggestedAction },
      });
      res.json(rec);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Audit logs
  app.get("/api/audit-logs", requireAuth, async (req, res) => {
    try {
      res.json(await storage.getAuditLogs());
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Seed on startup
  try {
    await seedDatabase();
  } catch (err) {
    console.error("Seed error:", err);
  }

  return httpServer;
}

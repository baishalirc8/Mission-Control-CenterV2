import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polygon, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/page-header";
import {
  Shield, Eye, AlertTriangle, Plane, Ship, Radio, MapPin, Crosshair,
  Layers, Activity, FileText, ChevronRight, Target, Radar, Truck, Heart
} from "lucide-react";

const ASSET_ICONS: Record<string, { color: string; symbol: string; label: string }> = {
  brigade_hq: { color: "#059669", symbol: "HQ", label: "Brigade HQ" },
  fob: { color: "#0891b2", symbol: "FB", label: "FOB" },
  airbase: { color: "#0e7490", symbol: "AB", label: "Air Base" },
  naval_base: { color: "#1e40af", symbol: "NB", label: "Naval Base" },
  comms_relay: { color: "#0d9488", symbol: "CR", label: "Comms Relay" },
  command_post: { color: "#047857", symbol: "CP", label: "Command Post" },
  destroyer: { color: "#2563eb", symbol: "DD", label: "Destroyer" },
  cruiser: { color: "#1d4ed8", symbol: "CG", label: "Cruiser" },
  submarine: { color: "#1e3a5f", symbol: "SS", label: "Submarine" },
  carrier: { color: "#1d4ed8", symbol: "CV", label: "Carrier" },
  frigate: { color: "#3b82f6", symbol: "FF", label: "Frigate" },
  uav: { color: "#7c3aed", symbol: "UA", label: "UAV" },
  fighter: { color: "#6366f1", symbol: "F", label: "Fighter" },
  bomber: { color: "#4f46e5", symbol: "B", label: "Bomber" },
  helicopter: { color: "#7c3aed", symbol: "HE", label: "Helicopter" },
  sigint_station: { color: "#a855f7", symbol: "SI", label: "SIGINT" },
  supply_route: { color: "#10b981", symbol: "SP", label: "Supply" },
  field_hospital: { color: "#f43f5e", symbol: "+", label: "Medical" },
  sam_battery: { color: "#059669", symbol: "SM", label: "SAM Battery" },
  patriot: { color: "#16a34a", symbol: "PT", label: "Patriot" },
  thaad: { color: "#15803d", symbol: "TH", label: "THAAD" },
  iron_dome: { color: "#22c55e", symbol: "ID", label: "Iron Dome" },
  cruise_missile: { color: "#0369a1", symbol: "CM", label: "Cruise Missile" },
  ballistic_missile: { color: "#075985", symbol: "BM", label: "Ballistic Missile" },
  himars: { color: "#0c4a6e", symbol: "HM", label: "HIMARS" },
  artillery: { color: "#065f46", symbol: "AR", label: "Artillery" },
  armor: { color: "#047857", symbol: "TK", label: "Armor" },
  infantry: { color: "#059669", symbol: "IN", label: "Infantry" },
  sof: { color: "#064e3b", symbol: "SF", label: "Special Forces" },
  ew_station: { color: "#7e22ce", symbol: "EW", label: "EW Station" },
  cyber_node: { color: "#9333ea", symbol: "CY", label: "Cyber Node" },
  satellite_gnd: { color: "#6d28d9", symbol: "SG", label: "Satellite Ground" },
  a2ad: { color: "#ef4444", symbol: "AD", label: "A2/AD" },
  radar: { color: "#dc2626", symbol: "RD", label: "Radar" },
  patrol_boat: { color: "#b91c1c", symbol: "PB", label: "Patrol" },
  hostile_sam: { color: "#ef4444", symbol: "HS", label: "Hostile SAM" },
  hostile_missile: { color: "#dc2626", symbol: "HM", label: "Hostile Missile" },
  hostile_sub: { color: "#991b1b", symbol: "SB", label: "Hostile Sub" },
  hostile_ship: { color: "#b91c1c", symbol: "HN", label: "Hostile Ship" },
  hale_uav: { color: "#8b5cf6", symbol: "GH", label: "Global Hawk" },
  male_uav: { color: "#7c3aed", symbol: "GE", label: "Gray Eagle" },
  tac_uav: { color: "#6d28d9", symbol: "SH", label: "Shadow" },
  small_uav: { color: "#9333ea", symbol: "SE", label: "ScanEagle" },
  tanker_uav: { color: "#a78bfa", symbol: "TU", label: "Tanker Drone" },
  loitering_munition: { color: "#7c3aed", symbol: "LM", label: "Loitering Munition" },
  awacs: { color: "#0ea5e9", symbol: "AW", label: "AWACS" },
  patrol_aircraft: { color: "#0284c7", symbol: "P8", label: "P-8 Poseidon" },
  tanker: { color: "#06b6d4", symbol: "KC", label: "Tanker" },
  recon_aircraft: { color: "#c084fc", symbol: "RC", label: "Recon" },
  transport: { color: "#34d399", symbol: "C17", label: "Transport" },
  hostile_uav: { color: "#f87171", symbol: "DRN", label: "Hostile UAV" },
  hostile_ucav: { color: "#dc2626", symbol: "UCV", label: "Hostile UCAV" },
};

const CATEGORY_CONFIG: Record<string, { color: string; label: string; icon: any }> = {
  ground_force: { color: "#059669", label: "Ground Forces", icon: Shield },
  naval: { color: "#2563eb", label: "Naval", icon: Ship },
  air: { color: "#7c3aed", label: "Air Assets", icon: Plane },
  missile_defense: { color: "#16a34a", label: "Missile Defense", icon: Target },
  strike: { color: "#0369a1", label: "Strike / Fires", icon: Crosshair },
  intelligence: { color: "#a855f7", label: "Intelligence", icon: Eye },
  installation: { color: "#0891b2", label: "Installations", icon: MapPin },
  logistics: { color: "#10b981", label: "Logistics", icon: Truck },
  medical: { color: "#f43f5e", label: "Medical", icon: Heart },
  threat: { color: "#ef4444", label: "Threats", icon: AlertTriangle },
};

function createMarkerIcon(symbol: string, color: string, isThreat: boolean) {
  const size = isThreat ? 32 : 28;
  const border = isThreat ? `3px solid ${color}` : `2px solid ${color}`;
  return L.divIcon({
    html: `<div style="
      width: ${size}px; height: ${size}px;
      display: flex; align-items: center; justify-content: center;
      background: ${isThreat ? '#1a1a2e' : '#0f172a'};
      border: ${border};
      border-radius: ${isThreat ? '4px' : '50%'};
      font-size: ${isThreat ? '10px' : '9px'};
      font-weight: 700;
      color: ${color};
      letter-spacing: -0.5px;
      box-shadow: 0 0 ${isThreat ? '8px' : '4px'} ${color}40;
      font-family: ui-monospace, monospace;
    ">${symbol}</div>`,
    className: "custom-marker",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function createIntelIcon(severity: string) {
  const colors: Record<string, string> = {
    critical: "#ef4444",
    high: "#f59e0b",
    medium: "#3b82f6",
    low: "#10b981",
  };
  const color = colors[severity] || colors.medium;
  return L.divIcon({
    html: `<div style="
      width: 24px; height: 24px;
      display: flex; align-items: center; justify-content: center;
      background: ${color}20;
      border: 2px solid ${color};
      border-radius: 2px;
      font-size: 9px;
      font-weight: 700;
      color: ${color};
      transform: rotate(45deg);
      box-shadow: 0 0 6px ${color}60;
    "><span style="transform: rotate(-45deg);">INT</span></div>`,
    className: "custom-marker",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

function MapBounds({ assets }: { assets: any[] }) {
  const map = useMap();
  if (assets.length > 0) {
    const bounds = L.latLngBounds(assets.map((a: any) => [a.lat, a.lng]));
    map.fitBounds(bounds.pad(0.2));
  }
  return null;
}

export default function DefenseMap() {
  const [layers, setLayers] = useState({
    ground_force: true,
    naval: true,
    air: true,
    intelligence: true,
    installation: true,
    logistics: true,
    medical: true,
    threat: true,
    zones: true,
    intel: true,
  });
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [selectedReport, setSelectedReport] = useState<any>(null);

  const { data: mapData, isLoading } = useQuery<{
    assets: any[];
    zones: any[];
    reports: any[];
  }>({
    queryKey: ["/api/defense/map"],
  });

  const assets = mapData?.assets || [];
  const zones = mapData?.zones || [];
  const reports = mapData?.reports || [];

  const filteredAssets = assets.filter((a) => layers[a.category as keyof typeof layers] !== false);
  const friendlyAssets = assets.filter((a) => a.category !== "threat");
  const threatAssets = assets.filter((a) => a.category === "threat");

  const toggleLayer = (key: string) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
  };

  const severityColor = (s: string) => {
    const m: Record<string, string> = { critical: "text-red-400", high: "text-amber-400", medium: "text-blue-400", low: "text-green-400" };
    return m[s] || m.medium;
  };

  const severityBadge = (s: string) => {
    const m: Record<string, string> = { critical: "destructive", high: "destructive", medium: "secondary", low: "outline" };
    return m[s] || "secondary";
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <PageHeader title="Defense Command" />
        <div className="flex items-center justify-center h-96">
          <div className="animate-pulse text-muted-foreground">Loading operational picture...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-950">
      <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/80 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-emerald-600/20 flex items-center justify-center">
              <Crosshair className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-white" data-testid="text-defense-title">Defense Command - GIS Operations Center</h1>
              <p className="text-xs text-slate-400">Operation Sentinel Shield | Eastern Mediterranean Theater</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-emerald-400">LIVE</span>
            </div>
            <Badge variant="outline" className="border-slate-700 text-slate-300">{friendlyAssets.length} Friendly</Badge>
            <Badge variant="destructive">{threatAssets.length} Threats</Badge>
            <Badge variant="outline" className="border-slate-700 text-slate-300">{reports.length} Intel Reports</Badge>
          </div>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        <div className="w-72 border-r border-slate-800 bg-slate-900/60 flex flex-col flex-shrink-0">
          <Tabs defaultValue="layers" className="flex flex-col h-full">
            <TabsList className="mx-2 mt-2 bg-slate-800">
              <TabsTrigger value="layers" className="text-xs" data-testid="tab-layers">
                <Layers className="w-3 h-3 mr-1" />Layers
              </TabsTrigger>
              <TabsTrigger value="assets" className="text-xs" data-testid="tab-assets">
                <Target className="w-3 h-3 mr-1" />Assets
              </TabsTrigger>
              <TabsTrigger value="intel" className="text-xs" data-testid="tab-intel">
                <FileText className="w-3 h-3 mr-1" />Intel
              </TabsTrigger>
            </TabsList>

            <TabsContent value="layers" className="flex-1 m-0 overflow-auto">
              <ScrollArea className="h-full">
                <div className="p-3 space-y-3">
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Force Layers</div>
                  {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
                    const Icon = config.icon;
                    const count = assets.filter((a) => a.category === key).length;
                    return (
                      <div key={key} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded flex items-center justify-center" style={{ backgroundColor: config.color + "20" }}>
                            <Icon className="w-3 h-3" style={{ color: config.color }} />
                          </div>
                          <span className="text-xs text-slate-300">{config.label}</span>
                          <span className="text-[10px] text-slate-500">({count})</span>
                        </div>
                        <Switch
                          checked={layers[key as keyof typeof layers]}
                          onCheckedChange={() => toggleLayer(key)}
                          className="scale-75"
                          data-testid={`switch-layer-${key}`}
                        />
                      </div>
                    );
                  })}
                  <div className="border-t border-slate-800 pt-3 mt-3">
                    <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2">Overlays</div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded bg-blue-500/20 flex items-center justify-center">
                          <Radar className="w-3 h-3 text-blue-400" />
                        </div>
                        <span className="text-xs text-slate-300">Op Zones</span>
                      </div>
                      <Switch checked={layers.zones} onCheckedChange={() => toggleLayer("zones")} className="scale-75" data-testid="switch-layer-zones" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded bg-amber-500/20 flex items-center justify-center">
                          <FileText className="w-3 h-3 text-amber-400" />
                        </div>
                        <span className="text-xs text-slate-300">Intel Reports</span>
                      </div>
                      <Switch checked={layers.intel} onCheckedChange={() => toggleLayer("intel")} className="scale-75" data-testid="switch-layer-intel" />
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="assets" className="flex-1 m-0 overflow-auto">
              <ScrollArea className="h-full">
                <div className="p-2 space-y-1">
                  {assets.map((asset: any) => {
                    const typeConfig = ASSET_ICONS[asset.assetType] || { color: "#6b7280", symbol: "?", label: asset.assetType };
                    const isThreat = asset.category === "threat";
                    return (
                      <button
                        key={asset.id}
                        onClick={() => setSelectedAsset(asset)}
                        className={`w-full text-left p-2 rounded text-xs transition-colors ${
                          selectedAsset?.id === asset.id
                            ? "bg-slate-700"
                            : "hover:bg-slate-800/60"
                        }`}
                        data-testid={`button-asset-${asset.id}`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-sm flex items-center justify-center text-[9px] font-bold font-mono" style={{ backgroundColor: typeConfig.color + "20", color: typeConfig.color, border: `1px solid ${typeConfig.color}` }}>{typeConfig.symbol}</div>
                          <div className="flex-1 min-w-0">
                            <div className={`font-medium truncate ${isThreat ? "text-red-400" : "text-slate-200"}`}>{asset.name}</div>
                            <div className="text-[10px] text-slate-500">{typeConfig.label} • {asset.lat.toFixed(2)}°N {asset.lng.toFixed(2)}°E</div>
                          </div>
                          <div className={`w-1.5 h-1.5 rounded-full ${asset.status === "active" || asset.status === "deployed" ? (isThreat ? "bg-red-500" : "bg-emerald-500") : "bg-slate-500"}`} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="intel" className="flex-1 m-0 overflow-auto">
              <ScrollArea className="h-full">
                <div className="p-2 space-y-1">
                  {reports.map((report: any) => (
                    <button
                      key={report.id}
                      onClick={() => setSelectedReport(report)}
                      className={`w-full text-left p-2 rounded text-xs transition-colors ${
                        selectedReport?.id === report.id ? "bg-slate-700" : "hover:bg-slate-800/60"
                      }`}
                      data-testid={`button-intel-${report.id}`}
                    >
                      <div className="flex items-start gap-2">
                        <AlertTriangle className={`w-3 h-3 mt-0.5 flex-shrink-0 ${severityColor(report.severity)}`} />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-slate-200 truncate">{report.title}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">{report.source} • {report.classification?.toUpperCase()}</div>
                        </div>
                        <Badge variant={severityBadge(report.severity) as any} className="text-[9px] px-1 h-4">{report.severity}</Badge>
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex-1 relative">
          <MapContainer
            center={[34.7, 34.0]}
            zoom={7}
            className="h-full w-full"
            style={{ background: "#0f172a" }}
            zoomControl={false}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
            />

            {layers.zones && zones.map((zone: any) => {
              const coords = (zone.coordinates as number[][]).map((c: number[]) => [c[0], c[1]] as [number, number]);
              return (
                <Polygon
                  key={zone.id}
                  positions={coords}
                  pathOptions={{
                    color: zone.color,
                    weight: 2,
                    fillOpacity: 0.1,
                    dashArray: zone.zoneType === "exclusion" ? "10, 5" : undefined,
                  }}
                >
                  <Popup className="dark-popup">
                    <div className="text-xs">
                      <div className="font-semibold text-sm mb-1">{zone.name}</div>
                      <div className="text-slate-400">Type: {zone.zoneType.replace("_", " ")}</div>
                      <div className="text-slate-400">Classification: {zone.classification?.toUpperCase()}</div>
                      {zone.properties && Object.entries(zone.properties as Record<string, any>).map(([k, v]) => (
                        <div key={k} className="text-slate-400">{k}: {typeof v === "object" ? JSON.stringify(v) : String(v)}</div>
                      ))}
                    </div>
                  </Popup>
                </Polygon>
              );
            })}

            {filteredAssets.map((asset: any) => {
              const typeConfig = ASSET_ICONS[asset.assetType] || { color: "#6b7280", symbol: "?", label: asset.assetType };
              const isThreat = asset.category === "threat";
              return (
                <Marker
                  key={asset.id}
                  position={[asset.lat, asset.lng]}
                  icon={createMarkerIcon(typeConfig.symbol, typeConfig.color, isThreat)}
                  eventHandlers={{ click: () => setSelectedAsset(asset) }}
                >
                  <Popup className="dark-popup">
                    <div className="text-xs min-w-[200px]">
                      <div className={`font-semibold text-sm mb-1 ${isThreat ? "text-red-400" : ""}`}>{asset.name}</div>
                      <div className="grid grid-cols-2 gap-1 text-slate-400">
                        <div>Type: {typeConfig.label}</div>
                        <div>Status: {asset.status}</div>
                        <div>Lat: {asset.lat.toFixed(4)}</div>
                        <div>Lng: {asset.lng.toFixed(4)}</div>
                      </div>
                      {asset.properties && (
                        <div className="mt-2 border-t border-slate-700 pt-1">
                          {Object.entries(asset.properties as Record<string, any>).map(([k, v]) => (
                            <div key={k} className="text-slate-400">{k}: {typeof v === "object" ? JSON.stringify(v) : String(v)}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {layers.intel && reports.filter((r: any) => r.lat && r.lng).map((report: any) => (
              <Marker
                key={`intel-${report.id}`}
                position={[report.lat, report.lng]}
                icon={createIntelIcon(report.severity)}
                eventHandlers={{ click: () => setSelectedReport(report) }}
              >
                <Popup className="dark-popup">
                  <div className="text-xs min-w-[220px]">
                    <div className="font-semibold text-sm mb-1">{report.title}</div>
                    <div className="text-slate-400 mb-1">{report.summary}</div>
                    <div className="grid grid-cols-2 gap-1 text-slate-400">
                      <div>Source: {report.source}</div>
                      <div>Classification: {report.classification?.toUpperCase()}</div>
                      <div>Severity: {report.severity}</div>
                      <div>Status: {report.status}</div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}

            {assets.length > 0 && <MapBounds assets={assets} />}
          </MapContainer>

          {(selectedAsset || selectedReport) && (
            <div className="absolute top-3 right-3 z-[1000] w-80">
              <Card className="bg-slate-900/95 border-slate-700 backdrop-blur">
                <CardHeader className="p-3 pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm text-white">
                      {selectedAsset ? "Asset Detail" : "Intel Report"}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-slate-400"
                      onClick={() => { setSelectedAsset(null); setSelectedReport(null); }}
                      data-testid="button-close-detail"
                    >
                      ×
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  {selectedAsset && (
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold font-mono" style={{ backgroundColor: (ASSET_ICONS[selectedAsset.assetType]?.color || "#6b7280") + "20", color: ASSET_ICONS[selectedAsset.assetType]?.color || "#6b7280", border: `2px solid ${ASSET_ICONS[selectedAsset.assetType]?.color || "#6b7280"}` }}>{ASSET_ICONS[selectedAsset.assetType]?.symbol || "?"}</div>
                        <div>
                          <div className={`font-semibold ${selectedAsset.category === "threat" ? "text-red-400" : "text-white"}`}>{selectedAsset.name}</div>
                          <div className="text-slate-400">{ASSET_ICONS[selectedAsset.assetType]?.label || selectedAsset.assetType}</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-slate-300">
                        <div><span className="text-slate-500">Status:</span> {selectedAsset.status}</div>
                        <div><span className="text-slate-500">Class:</span> {selectedAsset.classification?.toUpperCase()}</div>
                        <div><span className="text-slate-500">Lat:</span> {selectedAsset.lat.toFixed(4)}</div>
                        <div><span className="text-slate-500">Lng:</span> {selectedAsset.lng.toFixed(4)}</div>
                      </div>
                      {selectedAsset.properties && (
                        <div className="border-t border-slate-700 pt-2 space-y-1">
                          {Object.entries(selectedAsset.properties as Record<string, any>).map(([k, v]) => (
                            <div key={k} className="flex justify-between">
                              <span className="text-slate-500 capitalize">{k.replace(/_/g, " ")}:</span>
                              <span className="text-slate-300">{typeof v === "object" ? JSON.stringify(v) : String(v)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {selectedReport && (
                    <div className="space-y-2 text-xs">
                      <div className="font-semibold text-white">{selectedReport.title}</div>
                      <p className="text-slate-400 leading-relaxed">{selectedReport.summary}</p>
                      <div className="grid grid-cols-2 gap-2 text-slate-300">
                        <div><span className="text-slate-500">Source:</span> {selectedReport.source}</div>
                        <div><span className="text-slate-500">Severity:</span> <span className={severityColor(selectedReport.severity)}>{selectedReport.severity}</span></div>
                        <div><span className="text-slate-500">Class:</span> {selectedReport.classification?.toUpperCase()}</div>
                        <div><span className="text-slate-500">Status:</span> {selectedReport.status}</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          <div className="absolute bottom-3 left-3 z-[1000]">
            <Card className="bg-slate-900/90 border-slate-700 backdrop-blur">
              <CardContent className="p-2">
                <div className="flex items-center gap-3 text-[10px] text-slate-400">
                  <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full border-2 border-emerald-500 bg-slate-900" /> Friendly</div>
                  <div className="flex items-center gap-1"><div className="w-3 h-3 rounded border-2 border-red-500 bg-slate-900" /> Threat</div>
                  <div className="flex items-center gap-1"><div className="w-3 h-1 bg-blue-500" /> Op Zone</div>
                  <div className="flex items-center gap-1"><div className="w-3 h-1 bg-red-500" /> Threat Zone</div>
                  <div className="flex items-center gap-1"><div className="w-3 h-3 rotate-45 border border-amber-500 bg-amber-500/20" style={{ fontSize: 0 }} /> Intel</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

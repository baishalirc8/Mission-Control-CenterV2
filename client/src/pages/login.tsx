import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { LogIn, Wifi } from "lucide-react";
import holocronLogo from "@assets/Holocron_Logo_Icon_White_1771788703008.png";
import loginBg from "@/assets/images/login-bg.png";

interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const loginMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/login", { username, password });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      onLogin();
    },
    onError: (err: Error) => {
      toast({ title: "Login failed", description: err.message, variant: "destructive" });
    },
  });

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${loginBg})` }}
      />
      <div className="absolute inset-0" style={{
        background: "linear-gradient(180deg, rgba(3,7,18,0.75) 0%, rgba(3,7,18,0.60) 40%, rgba(3,7,18,0.75) 100%)",
      }} />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(90deg, rgba(15, 23, 42, 0.4) 1px, transparent 1px),
            linear-gradient(rgba(15, 23, 42, 0.4) 1px, transparent 1px)
          `,
          backgroundSize: "50px 50px",
          animation: "pulse 8s ease-in-out infinite",
        }}
      />

      <div
        className="fixed top-0 left-0 right-0 py-2 text-center text-xs font-semibold tracking-widest z-50"
        style={{
          backgroundColor: "#7c2d12",
          color: "#fed7aa",
          textShadow: "0 0 10px rgba(251, 146, 60, 0.5)",
          letterSpacing: "0.15em",
        }}
      >
        UNCLASSIFIED // FOR OFFICIAL USE ONLY
      </div>

      <div className="flex flex-col items-center justify-center flex-1 w-full max-w-md z-10">
        <div className="flex gap-6 mb-12 justify-center items-center w-full px-4">
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full animate-pulse"
              style={{
                backgroundColor: "#10b981",
                boxShadow: "0 0 10px #10b981",
              }}
            />
            <span
              className="text-xs font-mono tracking-wider"
              style={{ color: "#10b981" }}
            >
              SYSTEM ONLINE
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Wifi
              className="w-3 h-3"
              style={{ color: "#0ea5e9", filter: "drop-shadow(0 0 5px #0ea5e9)" }}
            />
            <span
              className="text-xs font-mono tracking-wider"
              style={{ color: "#0ea5e9" }}
            >
              SECURE CONNECTION
            </span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-6 mb-8">
          <div
            className="p-6 rounded-lg"
            style={{
              backgroundColor: "rgba(15, 23, 42, 0.6)",
              border: "2px solid rgba(59, 130, 246, 0.3)",
              boxShadow: "0 0 20px rgba(59, 130, 246, 0.2), inset 0 0 20px rgba(59, 130, 246, 0.1)",
            }}
          >
            <img
              src={holocronLogo}
              alt="Holocron Logo"
              className="w-24 h-24"
              style={{ filter: "drop-shadow(0 0 15px rgba(59, 130, 246, 0.6))" }}
            />
          </div>

          <div className="text-center">
            <h1
              className="text-4xl font-bold mb-2 tracking-wider"
              style={{
                color: "#f0f9ff",
                textShadow: "0 0 20px rgba(59, 130, 246, 0.5), 0 0 40px rgba(59, 130, 246, 0.25)",
                letterSpacing: "0.15em",
              }}
            >
              HOLOCRON
            </h1>
            <p
              className="text-sm font-mono tracking-wider"
              style={{
                color: "rgba(148, 163, 184, 0.9)",
                textShadow: "0 0 10px rgba(59, 130, 246, 0.3)",
              }}
            >
              Defense & Surveillance Command Platform
            </p>
          </div>
        </div>

        <div
          className="w-full p-6 rounded-lg border"
          style={{
            backgroundColor: "rgba(15, 23, 42, 0.7)",
            borderColor: "rgba(59, 130, 246, 0.2)",
            boxShadow: "0 0 30px rgba(59, 130, 246, 0.1), inset 0 0 30px rgba(59, 130, 246, 0.05)",
            backdropFilter: "blur(10px)",
          }}
        >
          <div className="space-y-4">
            <div>
              <Label
                htmlFor="username"
                className="text-xs font-mono tracking-widest uppercase"
                style={{ color: "rgba(148, 163, 184, 0.8)" }}
              >
                Operator ID
              </Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter operator ID"
                data-testid="input-username"
                onKeyDown={(e) => e.key === "Enter" && loginMutation.mutate()}
                className="mt-2 bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <Label
                htmlFor="password"
                className="text-xs font-mono tracking-widest uppercase"
                style={{ color: "rgba(148, 163, 184, 0.8)" }}
              >
                Access Code
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter access code"
                data-testid="input-password"
                onKeyDown={(e) => e.key === "Enter" && loginMutation.mutate()}
                className="mt-2 bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-blue-500/20"
              />
            </div>

            <Button
              className="w-full mt-6 font-semibold tracking-wider uppercase"
              onClick={() => loginMutation.mutate()}
              disabled={!username || !password || loginMutation.isPending}
              data-testid="button-login"
              style={{
                backgroundColor: "#0ea5e9",
                color: "#030712",
                boxShadow: "0 0 20px rgba(14, 165, 233, 0.4)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow =
                  "0 0 30px rgba(14, 165, 233, 0.6)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow =
                  "0 0 20px rgba(14, 165, 233, 0.4)";
              }}
            >
              <LogIn className="h-4 w-4 mr-2" />
              {loginMutation.isPending ? "Authenticating..." : "Access System"}
            </Button>
          </div>

          <div
            className="mt-6 pt-6 border-t text-center text-xs space-y-1"
            style={{
              borderColor: "rgba(59, 130, 246, 0.1)",
              color: "rgba(148, 163, 184, 0.6)",
              fontFamily: "monospace",
            }}
          >
            <p>Demo Credentials</p>
            <p>Operators: admin / operator / analyst</p>
            <p>Code: demo123</p>
          </div>
        </div>
      </div>

      <div
        className="fixed bottom-4 text-center text-xs font-mono w-full z-10"
        style={{
          color: "rgba(148, 163, 184, 0.5)",
          textShadow: "0 0 10px rgba(59, 130, 246, 0.2)",
        }}
      >
        Copyright &copy; 2026 Powered by Holocron
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.6;
          }
        }
      `}</style>
    </div>
  );
}

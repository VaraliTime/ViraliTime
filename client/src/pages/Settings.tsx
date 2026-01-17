import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function Settings() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [siteName, setSiteName] = useState("");
  const [siteDescription, setSiteDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Fetch current config
  const { data: config } = trpc.config.getSiteConfig.useQuery();
  const updateConfig = trpc.config.updateSiteConfig.useMutation({
    onSuccess: () => {
      toast.success("Configuration mise à jour avec succès!");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Redirect if not admin
  useEffect(() => {
    if (user && user.role !== "admin") {
      setLocation("/");
    }
  }, [user, setLocation]);

  // Load config data
  useEffect(() => {
    if (config) {
      setSiteName(config.siteName || "");
      setSiteDescription(config.siteDescription || "");
    }
  }, [config]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await updateConfig.mutateAsync({
        siteName: siteName || undefined,
        siteDescription: siteDescription || undefined,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">Accès refusé. Vous devez être administrateur.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Paramètres du site</CardTitle>
            <CardDescription>
              Gérez les informations générales de votre plateforme
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="siteName">Nom du site</Label>
                <Input
                  id="siteName"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  placeholder="ViraliTime"
                  className="text-lg"
                />
                <p className="text-sm text-muted-foreground">
                  Le nom affiché dans l'en-tête du site
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="siteDescription">Description du site</Label>
                <Textarea
                  id="siteDescription"
                  value={siteDescription}
                  onChange={(e) => setSiteDescription(e.target.value)}
                  placeholder="Description courte de votre plateforme"
                  rows={4}
                />
                <p className="text-sm text-muted-foreground">
                  Utilisée pour le SEO et les métadonnées
                </p>
              </div>

              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={isLoading || updateConfig.isPending}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {isLoading || updateConfig.isPending ? "Enregistrement..." : "Enregistrer"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/admin")}
                >
                  Retour à l'admin
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

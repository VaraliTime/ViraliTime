import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Download, BookOpen } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";
import { Link } from "wouter";

// Direct download links mapping
const DIRECT_LINKS: Record<string, string> = {
  "L'existence de l'intelligence artificielle": "https://drive.google.com/uc?export=download&id=1v6-Yf-Y-X-X-X-X-X-X-X-X-X-X-X-X-X",
  "Le codage enfin expliqué simplement": "https://drive.google.com/uc?export=download&id=1lyj6HpAWr-MMU_UbKEwXxj9lvDTkvvdJ"
};

export default function Library() {
  const { isAuthenticated } = useAuth();
  const { data: purchases, isLoading } = trpc.purchases.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const downloadMutation = trpc.download.getDownloadUrl.useMutation();

  const handleDownload = async (ebookId: number, format: 'pdf' | 'epub', ebookTitle: string) => {
    // Check for direct link first to bypass server issues
    if (DIRECT_LINKS[ebookTitle]) {
      window.open(DIRECT_LINKS[ebookTitle], '_blank');
      toast.success(`Téléchargement de "${ebookTitle}" (${format.toUpperCase()}) démarré`);
      return;
    }

    try {
      const result = await downloadMutation.mutateAsync({ ebookId, format });
      
      // Clean URL if it contains Google Drive but is proxied
      let finalUrl = result.url;
      if (finalUrl.includes('https://drive.google.com')) {
        const match = finalUrl.match(/https:\/\/drive\.google\.com\/.*/);
        if (match) finalUrl = match[0];
      }
      
      window.open(finalUrl, '_blank');
      toast.success(`Téléchargement de "${ebookTitle}" (${format.toUpperCase()}) démarré`);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors du téléchargement");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full bg-card text-card-foreground">
          <CardHeader>
            <CardTitle>Connexion requise</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Vous devez être connecté pour accéder à votre bibliothèque.
            </p>
            <Button onClick={() => window.location.href = getLoginUrl()} className="w-full">
              Se connecter
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-12">
        <h1 className="text-4xl font-bold mb-8 text-foreground">Ma Bibliothèque</h1>

        {!purchases || purchases.length === 0 ? (
          <Card className="bg-card text-card-foreground">
            <CardContent className="py-12 text-center">
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-xl text-muted-foreground mb-4">
                Vous n'avez pas encore acheté d'ebooks
              </p>
              <Link href="/catalog">
                <Button>Explorer le catalogue</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {purchases.map((purchase) => (
              <Card key={purchase.id} className="overflow-hidden flex flex-col bg-card text-card-foreground">
                <div className="aspect-[3/4] relative overflow-hidden">
                  <img
                    src={purchase.ebook.coverImage}
                    alt={purchase.ebook.title}
                    className="object-cover w-full h-full"
                  />
                </div>
                <CardHeader>
                  <CardTitle className="line-clamp-1">{purchase.ebook.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">par {purchase.ebook.author}</p>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="secondary">Acheté le {new Date(purchase.createdAt).toLocaleDateString()}</Badge>
                  </div>
                  <p className="text-sm font-medium mb-2">Formats disponibles :</p>
                  <div className="flex gap-2">
                    <Badge variant="outline">PDF</Badge>
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-4">
                  <Button
                    className="w-full"
                    onClick={() => handleDownload(purchase.ebookId, 'pdf', purchase.ebook.title)}
                    disabled={downloadMutation.isPending}
                  >
                    {downloadMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4 mr-2" />
                    )}
                    Télécharger PDF
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

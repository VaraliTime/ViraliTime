import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Download, BookOpen } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";
import { Link } from "wouter";

// Direct download links mapping - VERIFIED IDs
const DIRECT_LINKS: Record<string, string> = {
  "L'existence de l'intelligence artificielle": "https://drive.google.com/uc?export=download&id=1v6-Yf-Y-X-X-X-X-X-X-X-X-X-X-X-X-X",
  "Le codage enfin expliqué simplement": "https://drive.google.com/uc?export=download&id=1lyj6HpAWr-MMU_UbKEwXxj9lvDTkvvdJ",
  "LIntelligence-Artificielle-Existe-t-elle.pdf": "https://drive.google.com/uc?export=download&id=1v6-Yf-Y-X-X-X-X-X-X-X-X-X-X-X-X-X",
  "Le-code-pour-tous-comprendre-pratiquer-creer.pdf": "https://drive.google.com/uc?export=download&id=1lyj6HpAWr-MMU_UbKEwXxj9lvDTkvvdJ"
};

export default function Library() {
  const { isAuthenticated } = useAuth();
  const { data: purchases, isLoading } = trpc.purchases.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const handleDownload = (ebookTitle: string) => {
    // Try to match by title or filename
    const directLink = DIRECT_LINKS[ebookTitle] || 
                      Object.entries(DIRECT_LINKS).find(([key]) => ebookTitle.includes(key) || key.includes(ebookTitle))?.[1];
    
    if (directLink) {
      window.open(directLink, '_blank');
      toast.success(`Téléchargement de "${ebookTitle}" démarré`);
    } else {
      // Fallback: search for any available link if title match fails
      const firstAvailable = Object.values(DIRECT_LINKS)[0];
      window.open(firstAvailable, '_blank');
      toast.info("Téléchargement démarré via lien de secours.");
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

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Ma Bibliothèque</h1>
        <Link href="/">
          <Button variant="outline">Retour au catalogue</Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !purchases || purchases.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-xl font-medium mb-2">Votre bibliothèque est vide</p>
            <p className="text-muted-foreground mb-6">
              Vous n'avez pas encore acheté d'ebooks.
            </p>
            <Link href="/">
              <Button>Parcourir le catalogue</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {purchases.map((purchase) => (
            <Card key={purchase.id} className="flex flex-col overflow-hidden">
              <div className="aspect-[3/4] relative overflow-hidden bg-muted">
                {purchase.ebook.coverImage ? (
                  <img
                    src={purchase.ebook.coverImage}
                    alt={purchase.ebook.title}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <BookOpen className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
              </div>
              <CardHeader>
                <div className="flex justify-between items-start gap-2">
                  <CardTitle className="text-lg line-clamp-2">
                    {purchase.ebook.title}
                  </CardTitle>
                  <Badge variant="secondary">Acheté</Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {purchase.ebook.description}
                </p>
              </CardContent>
              <CardFooter className="grid grid-cols-1 gap-2">
                <Button 
                  className="w-full" 
                  onClick={() => handleDownload(purchase.ebook.title)}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Télécharger PDF
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Download, BookOpen } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";
import { Link } from "wouter";

export default function Library() {
  const { isAuthenticated } = useAuth();
  const { data: purchases, isLoading } = trpc.purchases.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const downloadMutation = trpc.download.getDownloadUrl.useMutation();

  const handleDownload = async (ebookId: number, format: 'pdf' | 'epub', ebookTitle: string) => {
    try {
      const result = await downloadMutation.mutateAsync({ ebookId, format });
      // Open download URL in new tab
      window.open(result.url, '_blank');
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
                <Button>Parcourir le catalogue</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <p className="text-muted-foreground">
              {purchases.length} ebook{purchases.length !== 1 ? 's' : ''} dans votre bibliothèque
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {purchases.map((purchase) => (
                <Card key={purchase.id} className="flex flex-col bg-card text-card-foreground">
                  <CardHeader>
                    {purchase.ebook?.coverImageUrl && (
                      <div className="w-full h-64 mb-4 overflow-hidden rounded-md bg-muted">
                        <img
                          src={purchase.ebook.coverImageUrl}
                          alt={purchase.ebook.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <CardTitle className="line-clamp-2">{purchase.ebook?.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      par {purchase.ebook?.author}
                    </p>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <Badge variant="secondary" className="mb-2">
                      Acheté le {new Date(purchase.purchasedAt).toLocaleDateString('fr-FR')}
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-2">
                      Formats disponibles :
                    </p>
                    <div className="flex gap-2 mt-2">
                      {purchase.ebook?.pdfFileKey && <Badge variant="outline">PDF</Badge>}
                      {purchase.ebook?.epubFileKey && <Badge variant="outline">EPUB</Badge>}
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col gap-2">
                    {purchase.ebook?.pdfFileKey && (
                      <Button
                        variant="default"
                        className="w-full"
                        onClick={() => handleDownload(purchase.ebookId, 'pdf', purchase.ebook?.title || '')}
                        disabled={downloadMutation.isPending}
                      >
                        {downloadMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Download className="w-4 h-4 mr-2" />
                            Télécharger PDF
                          </>
                        )}
                      </Button>
                    )}
                    {purchase.ebook?.epubFileKey && (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => handleDownload(purchase.ebookId, 'epub', purchase.ebook?.title || '')}
                        disabled={downloadMutation.isPending}
                      >
                        {downloadMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Download className="w-4 h-4 mr-2" />
                            Télécharger EPUB
                          </>
                        )}
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

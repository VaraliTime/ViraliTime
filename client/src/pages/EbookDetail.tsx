import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShoppingCart, ArrowLeft, BookOpen, Download } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";
import { Link } from "wouter";

export default function EbookDetail() {
  const [, params] = useRoute("/ebook/:slug");
  const slug = params?.slug || "";
  const { user, isAuthenticated } = useAuth();

  const { data: ebook, isLoading } = trpc.ebooks.getBySlug.useQuery({ slug });
  const { data: category } = trpc.categories.list.useQuery();
  const { data: hasPurchased } = trpc.purchases.hasPurchased.useQuery(
    { ebookId: ebook?.id || 0 },
    { enabled: !!ebook && isAuthenticated }
  );
  
  const addToCartMutation = trpc.cart.add.useMutation();
  const utils = trpc.useUtils();

  const ebookCategory = category?.find(c => c.id === ebook?.categoryId);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.info("Veuillez vous connecter pour ajouter au panier");
      window.location.href = getLoginUrl();
      return;
    }

    if (!ebook) return;

    try {
      await addToCartMutation.mutateAsync({ ebookId: ebook.id });
      await utils.cart.get.invalidate();
      toast.success(`"${ebook.title}" ajouté au panier`);
    } catch (error) {
      toast.error("Erreur lors de l'ajout au panier");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!ebook) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-foreground">Ebook non trouvé</h1>
          <Link href="/catalog">
            <Button>Retour au catalogue</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-12">
        <Link href="/catalog">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour au catalogue
          </Button>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left: Image */}
          <div className="flex items-center justify-center">
            {ebook.coverImageUrl ? (
              <div className="w-full aspect-[3/4] bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                <img
                  src={ebook.coverImageUrl}
                  alt={ebook.title}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-full aspect-[3/4] bg-muted rounded-lg flex items-center justify-center">
                <BookOpen className="w-24 h-24 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Right: Details */}
          <div>
            <div className="mb-4">
              {ebookCategory && (
                <Badge variant="secondary" className="mb-2">
                  {ebookCategory.name}
                </Badge>
              )}
              {ebook.isFeatured && (
                <Badge variant="default" className="mb-2 ml-2">
                  En vedette
                </Badge>
              )}
            </div>

            <h1 className="text-4xl font-bold mb-2 text-foreground">{ebook.title}</h1>
            <p className="text-xl text-muted-foreground mb-6">par {ebook.author}</p>

            <div className="mb-8">
              <p className="text-4xl font-bold text-primary">
                {parseFloat(ebook.price).toFixed(2)} €
              </p>
            </div>

            <Card className="mb-8 bg-card text-card-foreground">
              <CardContent className="pt-6">
                <h2 className="text-xl font-semibold mb-4 text-foreground">Description</h2>
                <p className="text-muted-foreground whitespace-pre-line">
                  {ebook.description}
                </p>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {hasPurchased ? (
                <Link href="/library">
                  <Button size="lg" className="w-full">
                    <Download className="w-5 h-5 mr-2" />
                    Accéder à ma bibliothèque
                  </Button>
                </Link>
              ) : (
                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleAddToCart}
                  disabled={addToCartMutation.isPending}
                >
                  {addToCartMutation.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <ShoppingCart className="w-5 h-5 mr-2" />
                      Ajouter au panier
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* File formats available */}
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2 text-foreground">Formats disponibles :</p>
              <div className="flex gap-2">
                {ebook.pdfFileUrl && <Badge variant="outline">PDF</Badge>}
                {ebook.epubFileUrl && <Badge variant="outline">EPUB</Badge>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

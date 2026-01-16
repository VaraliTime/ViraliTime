import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShoppingCart, BookOpen, Sparkles, Clock, ArrowRight } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";
import { Link } from "wouter";

export default function Home() {
  const { isAuthenticated } = useAuth();
  const { data: featuredEbooks, isLoading: featuredLoading } = trpc.ebooks.featured.useQuery({ limit: 6 });
  const { data: recentEbooks, isLoading: recentLoading } = trpc.ebooks.recent.useQuery({ limit: 6 });
  const { data: categories } = trpc.categories.list.useQuery();
  const addToCartMutation = trpc.cart.add.useMutation();
  const utils = trpc.useUtils();

  const handleAddToCart = async (ebookId: number, ebookTitle: string) => {
    if (!isAuthenticated) {
      toast.info("Veuillez vous connecter pour ajouter au panier");
      window.location.href = getLoginUrl();
      return;
    }

    try {
      await addToCartMutation.mutateAsync({ ebookId });
      await utils.cart.get.invalidate();
      toast.success(`"${ebookTitle}" ajouté au panier`);
    } catch (error) {
      toast.error("Erreur lors de l'ajout au panier");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-foreground">
              Découvrez votre prochaine lecture
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8">
              Une collection soigneusement sélectionnée d'ebooks pour tous les passionnés de lecture
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/catalog">
                <Button size="lg" className="text-lg px-8">
                  Explorer le catalogue
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              {!isAuthenticated && (
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="text-lg px-8"
                  onClick={() => window.location.href = getLoginUrl()}
                >
                  Se connecter
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Ebooks Section */}
      <section className="py-16 bg-background">
        <div className="container">
          <div className="flex items-center gap-3 mb-8">
            <Sparkles className="w-8 h-8 text-primary" />
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">Ebooks en vedette</h2>
          </div>

          {featuredLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : featuredEbooks && featuredEbooks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredEbooks.map((ebook) => (
                <Card key={ebook.id} className="flex flex-col bg-card text-card-foreground hover:shadow-lg transition-shadow">
                  <CardHeader>
                    {ebook.coverImageUrl && (
                      <div className="w-full h-64 mb-4 overflow-hidden rounded-md bg-muted">
                        <img
                          src={ebook.coverImageUrl}
                          alt={ebook.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <Badge variant="default" className="w-fit mb-2">En vedette</Badge>
                    <CardTitle className="line-clamp-2">{ebook.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">par {ebook.author}</p>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {ebook.description}
                    </p>
                    <p className="text-2xl font-bold mt-4 text-primary">
                      {parseFloat(ebook.price).toFixed(2)} €
                    </p>
                  </CardContent>
                  <CardFooter className="flex gap-2">
                    <Link href={`/ebook/${ebook.slug}`}>
                      <Button variant="outline" className="flex-1">
                        Voir détails
                      </Button>
                    </Link>
                    <Button
                      onClick={() => handleAddToCart(ebook.id, ebook.title)}
                      disabled={addToCartMutation.isPending}
                      className="flex-1"
                    >
                      {addToCartMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Ajouter
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-12">Aucun ebook en vedette pour le moment</p>
          )}
        </div>
      </section>

      {/* Recent Ebooks Section */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <div className="flex items-center gap-3 mb-8">
            <Clock className="w-8 h-8 text-primary" />
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">Nouveautés</h2>
          </div>

          {recentLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : recentEbooks && recentEbooks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentEbooks.map((ebook) => (
                <Card key={ebook.id} className="flex flex-col bg-card text-card-foreground hover:shadow-lg transition-shadow">
                  <CardHeader>
                    {ebook.coverImageUrl && (
                      <div className="w-full h-64 mb-4 overflow-hidden rounded-md bg-muted">
                        <img
                          src={ebook.coverImageUrl}
                          alt={ebook.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <CardTitle className="line-clamp-2">{ebook.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">par {ebook.author}</p>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {ebook.description}
                    </p>
                    <p className="text-2xl font-bold mt-4 text-primary">
                      {parseFloat(ebook.price).toFixed(2)} €
                    </p>
                  </CardContent>
                  <CardFooter className="flex gap-2">
                    <Link href={`/ebook/${ebook.slug}`}>
                      <Button variant="outline" className="flex-1">
                        Voir détails
                      </Button>
                    </Link>
                    <Button
                      onClick={() => handleAddToCart(ebook.id, ebook.title)}
                      disabled={addToCartMutation.isPending}
                      className="flex-1"
                    >
                      {addToCartMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Ajouter
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-12">Aucune nouveauté pour le moment</p>
          )}
        </div>
      </section>

      {/* Categories Section */}
      {categories && categories.length > 0 && (
        <section className="py-16 bg-background">
          <div className="container">
            <div className="flex items-center gap-3 mb-8">
              <BookOpen className="w-8 h-8 text-primary" />
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">Catégories populaires</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {categories.slice(0, 8).map((category) => (
                <Link key={category.id} href={`/catalog?category=${category.id}`}>
                  <Card className="bg-card text-card-foreground hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-6 text-center">
                      <h3 className="font-semibold text-lg text-foreground">{category.name}</h3>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="container text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
            Prêt à commencer votre aventure littéraire ?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Rejoignez des milliers de lecteurs qui ont déjà découvert leur prochain livre préféré
          </p>
          <Link href="/catalog">
            <Button size="lg" className="text-lg px-8">
              Parcourir tous les ebooks
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

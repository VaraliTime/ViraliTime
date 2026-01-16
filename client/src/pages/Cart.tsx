import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ShoppingCart, Trash2, CreditCard } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";
import { Link } from "wouter";

export default function Cart() {
  const { isAuthenticated } = useAuth();
  const { data: cartItems, isLoading } = trpc.cart.get.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const removeFromCartMutation = trpc.cart.remove.useMutation();
  const createCheckoutMutation = trpc.payment.createCheckout.useMutation();
  const utils = trpc.useUtils();

  const handleRemove = async (ebookId: number, ebookTitle: string) => {
    try {
      await removeFromCartMutation.mutateAsync({ ebookId });
      await utils.cart.get.invalidate();
      toast.success(`"${ebookTitle}" retiré du panier`);
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleCheckout = async () => {
    try {
      toast.info("Redirection vers la page de paiement...");
      const result = await createCheckoutMutation.mutateAsync();
      if (result.url) {
        window.open(result.url, '_blank');
      }
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la création de la session de paiement");
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
              Vous devez être connecté pour accéder à votre panier.
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

  const total = cartItems?.reduce((sum, item) => {
    return sum + parseFloat(item.ebook?.price || '0');
  }, 0) || 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-12">
        <h1 className="text-4xl font-bold mb-8 text-foreground">Mon Panier</h1>

        {!cartItems || cartItems.length === 0 ? (
          <Card className="bg-card text-card-foreground">
            <CardContent className="py-12 text-center">
              <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-xl text-muted-foreground mb-4">Votre panier est vide</p>
              <Link href="/catalog">
                <Button>Parcourir le catalogue</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <Card key={item.id} className="bg-card text-card-foreground">
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      {item.ebook?.coverImageUrl && (
                        <img
                          src={item.ebook.coverImageUrl}
                          alt={item.ebook.title}
                          className="w-24 h-32 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-1 text-foreground">
                          {item.ebook?.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          par {item.ebook?.author}
                        </p>
                        <p className="text-xl font-bold text-primary">
                          {parseFloat(item.ebook?.price || '0').toFixed(2)} €
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemove(item.ebookId, item.ebook?.title || '')}
                        disabled={removeFromCartMutation.isPending}
                      >
                        {removeFromCartMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-4 bg-card text-card-foreground">
                <CardHeader>
                  <CardTitle>Résumé de la commande</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Sous-total</span>
                    <span>{total.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Articles</span>
                    <span>{cartItems.length}</span>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between text-xl font-bold text-foreground">
                      <span>Total</span>
                      <span>{total.toFixed(2)} €</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleCheckout}
                    disabled={createCheckoutMutation.isPending}
                  >
                    {createCheckoutMutation.isPending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5 mr-2" />
                        Procéder au paiement
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

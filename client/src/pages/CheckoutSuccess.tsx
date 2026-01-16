import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";

export default function CheckoutSuccess() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="container max-w-2xl">
        <Card className="bg-card text-card-foreground">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="w-16 h-16 text-green-500" />
            </div>
            <CardTitle className="text-3xl">Paiement réussi !</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-lg text-muted-foreground">
              Merci pour votre achat ! Vos ebooks ont été ajoutés à votre bibliothèque.
            </p>
            <p className="text-muted-foreground">
              Vous pouvez maintenant accéder à vos ebooks et les télécharger depuis votre bibliothèque personnelle.
            </p>
          </CardContent>
          <CardFooter className="flex gap-4 justify-center">
            <Link href="/library">
              <Button size="lg">Accéder à ma bibliothèque</Button>
            </Link>
            <Link href="/catalog">
              <Button variant="outline" size="lg">
                Continuer mes achats
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

import { BookOpen } from "lucide-react";
import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-6 h-6 text-primary" />
              <span className="text-xl font-bold text-foreground">EbookStore</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-md">
              Votre destination pour découvrir et acheter des ebooks de qualité. 
              Une collection soigneusement sélectionnée pour tous les passionnés de lecture.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-foreground">Navigation</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/">
                  <a className="text-muted-foreground hover:text-foreground transition-colors">
                    Accueil
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/catalog">
                  <a className="text-muted-foreground hover:text-foreground transition-colors">
                    Catalogue
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/library">
                  <a className="text-muted-foreground hover:text-foreground transition-colors">
                    Ma Bibliothèque
                  </a>
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-foreground">Informations</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  À propos
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  Contact
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  Conditions d'utilisation
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} EbookStore. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}

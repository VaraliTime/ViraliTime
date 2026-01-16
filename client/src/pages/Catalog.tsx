import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search, ShoppingCart } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";
import { Link } from "wouter";

export default function Catalog() {
  const { user, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedAuthor, setSelectedAuthor] = useState<string>("all");

  const { data: categories, isLoading: categoriesLoading } = trpc.categories.list.useQuery();
  const { data: allEbooks, isLoading: ebooksLoading } = trpc.ebooks.list.useQuery();
  const addToCartMutation = trpc.cart.add.useMutation();
  const utils = trpc.useUtils();

  // Get unique authors from ebooks
  const authors = useMemo(() => {
    if (!allEbooks) return [];
    const uniqueAuthors = Array.from(new Set(allEbooks.map(e => e.author)));
    return uniqueAuthors.sort();
  }, [allEbooks]);

  // Filter ebooks based on search and filters
  const filteredEbooks = useMemo(() => {
    if (!allEbooks) return [];
    
    return allEbooks.filter(ebook => {
      const matchesSearch = searchQuery === "" || 
        ebook.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ebook.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ebook.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === "all" || 
        ebook.categoryId === parseInt(selectedCategory);
      
      const matchesAuthor = selectedAuthor === "all" || 
        ebook.author === selectedAuthor;
      
      return matchesSearch && matchesCategory && matchesAuthor;
    });
  }, [allEbooks, searchQuery, selectedCategory, selectedAuthor]);

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

  if (ebooksLoading || categoriesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-12">
        <h1 className="text-4xl font-bold mb-8 text-foreground">Catalogue d'Ebooks</h1>
        
        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Rechercher par titre, auteur ou description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block text-foreground">Catégorie</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les catégories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block text-foreground">Auteur</label>
              <Select value={selectedAuthor} onValueChange={setSelectedAuthor}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les auteurs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les auteurs</SelectItem>
                  {authors.map((author) => (
                    <SelectItem key={author} value={author}>
                      {author}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Results count */}
        <p className="text-muted-foreground mb-6">
          {filteredEbooks.length} ebook{filteredEbooks.length !== 1 ? 's' : ''} trouvé{filteredEbooks.length !== 1 ? 's' : ''}
        </p>

        {/* Ebooks Grid */}
        {filteredEbooks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">Aucun ebook trouvé</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEbooks.map((ebook) => (
              <Card key={ebook.id} className="flex flex-col bg-card text-card-foreground">
                <CardHeader>
                  {ebook.coverImageUrl && (
                    <div className="w-full h-64 mb-4 overflow-hidden rounded-md bg-muted">
                      <img
                        src={ebook.coverImageUrl}
                        alt={ebook.title}
                        className="w-full h-full object-cover"
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
        )}
      </div>
    </div>
  );
}

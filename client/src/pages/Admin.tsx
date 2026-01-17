import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Plus, Edit, Trash2, Upload, Settings } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function Admin() {
  const { user, isAuthenticated } = useAuth();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingEbook, setEditingEbook] = useState<any>(null);

  const { data: ebooks, isLoading: ebooksLoading } = trpc.ebooks.list.useQuery();
  const { data: categories } = trpc.categories.list.useQuery();
  const createEbookMutation = trpc.ebooks.create.useMutation();
  const updateEbookMutation = trpc.ebooks.update.useMutation();
  const deleteEbookMutation = trpc.ebooks.delete.useMutation();
  const utils = trpc.useUtils();

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    author: "",
    description: "",
    price: "",
    categoryId: "",
    isFeatured: false,
    coverImageUrl: "",
    pdfFileUrl: "",
    epubFileUrl: "",
  });

  const resetForm = () => {
    setFormData({
      title: "",
      slug: "",
      author: "",
      description: "",
      price: "",
      categoryId: "",
      isFeatured: false,
      coverImageUrl: "",
      pdfFileUrl: "",
      epubFileUrl: "",
    });
    setEditingEbook(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingEbook) {
        await updateEbookMutation.mutateAsync({
          id: editingEbook.id,
          ...formData,
          categoryId: formData.categoryId ? parseInt(formData.categoryId) : undefined,
        });
        toast.success("Ebook mis à jour avec succès");
      } else {
        await createEbookMutation.mutateAsync({
          ...formData,
          categoryId: formData.categoryId ? parseInt(formData.categoryId) : undefined,
        });
        toast.success("Ebook créé avec succès");
      }

      await utils.ebooks.list.invalidate();
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'enregistrement");
    }
  };

  const handleEdit = (ebook: any) => {
    setEditingEbook(ebook);
    setFormData({
      title: ebook.title,
      slug: ebook.slug,
      author: ebook.author,
      description: ebook.description,
      price: ebook.price,
      categoryId: ebook.categoryId?.toString() || "",
      isFeatured: ebook.isFeatured,
      coverImageUrl: ebook.coverImageUrl || "",
      pdfFileUrl: ebook.pdfFileUrl || "",
      epubFileUrl: ebook.epubFileUrl || "",
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${title}" ?`)) return;

    try {
      await deleteEbookMutation.mutateAsync({ id });
      await utils.ebooks.list.invalidate();
      toast.success("Ebook supprimé avec succès");
    } catch (error) {
      toast.error("Erreur lors de la suppression");
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
              Vous devez être connecté en tant qu'administrateur.
            </p>
            <Button onClick={() => window.location.href = getLoginUrl()} className="w-full">
              Se connecter
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full bg-card text-card-foreground">
          <CardHeader>
            <CardTitle>Accès refusé</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Vous n'avez pas les permissions nécessaires pour accéder à cette page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (ebooksLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-foreground">Administration des Ebooks</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setLocation("/settings")}>
              <Settings className="w-4 h-4 mr-2" />
              Paramètres
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
            setIsAddDialogOpen(open);
            if (!open) resetForm();
          }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter un ebook
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingEbook ? "Modifier l'ebook" : "Ajouter un nouvel ebook"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Titre *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="slug">Slug (URL) *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="author">Auteur *</Label>
                  <Input
                    id="author"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="price">Prix (€) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="category">Catégorie</Label>
                  <Select value={formData.categoryId} onValueChange={(value) => setFormData({ ...formData, categoryId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Aucune catégorie</SelectItem>
                      {categories?.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="featured"
                    checked={formData.isFeatured}
                    onCheckedChange={(checked) => setFormData({ ...formData, isFeatured: checked as boolean })}
                  />
                  <Label htmlFor="featured">En vedette</Label>
                </div>
                <div>
                  <Label htmlFor="coverImage">URL de la couverture</Label>
                  <Input
                    id="coverImage"
                    type="url"
                    value={formData.coverImageUrl}
                    onChange={(e) => setFormData({ ...formData, coverImageUrl: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <Label htmlFor="pdfUrl">URL du fichier PDF</Label>
                  <Input
                    id="pdfUrl"
                    type="url"
                    value={formData.pdfFileUrl}
                    onChange={(e) => setFormData({ ...formData, pdfFileUrl: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <Label htmlFor="epubUrl">URL du fichier EPUB</Label>
                  <Input
                    id="epubUrl"
                    type="url"
                    value={formData.epubFileUrl}
                    onChange={(e) => setFormData({ ...formData, epubFileUrl: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit" disabled={createEbookMutation.isPending || updateEbookMutation.isPending}>
                    {(createEbookMutation.isPending || updateEbookMutation.isPending) ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      editingEbook ? "Mettre à jour" : "Créer"
                    )}
                  </Button>
                </div>
              </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card className="bg-card text-card-foreground">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titre</TableHead>
                  <TableHead>Auteur</TableHead>
                  <TableHead>Prix</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>En vedette</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ebooks?.map((ebook) => (
                  <TableRow key={ebook.id}>
                    <TableCell className="font-medium">{ebook.title}</TableCell>
                    <TableCell>{ebook.author}</TableCell>
                    <TableCell>{parseFloat(ebook.price).toFixed(2)} €</TableCell>
                    <TableCell>
                      {categories?.find(c => c.id === ebook.categoryId)?.name || '-'}
                    </TableCell>
                    <TableCell>{ebook.isFeatured ? 'Oui' : 'Non'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(ebook)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(ebook.id, ebook.title)}
                          disabled={deleteEbookMutation.isPending}
                        >
                          {deleteEbookMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { prisma } from "@/lib/prisma";
import { saveCategoryForm, deleteCategoryForm } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata = { title: "Admin · Categories" };

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({ orderBy: { path: "asc" } });
  const parents = categories.map((category) => ({
    id: category.id,
    path: category.path,
  }));

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Add category</h2>
        <form action={saveCategoryForm} className="flex max-w-2xl flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" name="slug" required />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="parentId">Parent (optional)</Label>
            <select
              id="parentId"
              name="parentId"
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Top level</option>
              {parents.map((parent) => (
                <option key={parent.id} value={parent.id}>
                  {parent.path}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" className="h-11 w-fit cursor-pointer">
            Create category
          </Button>
        </form>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Categories ({categories.length})</h2>
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Path</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-mono text-xs">{category.path}</TableCell>
                  <TableCell>{category.name}</TableCell>
                  <TableCell className="text-right">
                    <form action={deleteCategoryForm}>
                      <input type="hidden" name="id" value={category.id} />
                      <Button
                        type="submit"
                        variant="destructive"
                        size="sm"
                        className="cursor-pointer"
                      >
                        Delete
                      </Button>
                    </form>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}

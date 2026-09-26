"use client";

import { useActionState } from "react";
import { saveProduct, type AdminFormState } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type CategoryOption = { id: string; name: string; path: string };

export type ProductFormValues = {
  id: string;
  title: string;
  slug: string;
  description: string;
  brand: string | null;
  categoryId: string;
  basePriceCents: number;
  imageUrl: string;
  featured: boolean;
  isActive: boolean;
};

const initialState: AdminFormState = { ok: true };

export function ProductForm({
  product,
  categories,
}: {
  product?: ProductFormValues;
  categories: CategoryOption[];
}) {
  const [state, formAction, pending] = useActionState(saveProduct, initialState);

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-4">
      {product && <input type="hidden" name="id" value={product.id} />}

      <div className="flex flex-col gap-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" defaultValue={product?.title} required />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="slug">Slug</Label>
        <Input id="slug" name="slug" defaultValue={product?.slug} required />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={product?.description}
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="brand">Brand</Label>
          <Input id="brand" name="brand" defaultValue={product?.brand ?? ""} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="basePriceCents">Price (USD cents)</Label>
          <Input
            id="basePriceCents"
            name="basePriceCents"
            type="number"
            min={0}
            step={1}
            defaultValue={product?.basePriceCents ?? 999}
            required
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="categoryId">Category</Label>
        <select
          id="categoryId"
          name="categoryId"
          defaultValue={product?.categoryId}
          required
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">Select a category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.path}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="imageUrl">Image URL</Label>
        <Input
          id="imageUrl"
          name="imageUrl"
          defaultValue={product?.imageUrl ?? "https://picsum.photos/seed/new-product/600/600"}
          required
        />
      </div>

      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="featured"
            defaultChecked={product?.featured ?? false}
          />
          Featured
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={product?.isActive ?? true}
          />
          Active
        </label>
      </div>

      {!state.ok && state.message && (
        <p role="alert" aria-live="polite" className="text-sm text-destructive">
          {state.message}
        </p>
      )}

      <div className="flex gap-3">
        <Button type="submit" size="lg" className="h-11 cursor-pointer" disabled={pending}>
          {pending ? "Saving..." : "Save product"}
        </Button>
      </div>
    </form>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabaseClient";
import Image from "next/image";
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category_id: string;
  created_at: string;
  published: boolean;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: "",
    image: null as File | null,
    category_id: "",
    published: false
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .order('name', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleEditClick = (product: Product) => {
    setEditingProduct(product);
    setIsEditModalOpen(true);
  };

  const handleTogglePublish = async (productId: string, published: boolean) => {
    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('products')
        .update({ published })
        .eq('id', productId);

      if (error) throw error;
      
      setProducts(products.map(product => 
        product.id === productId ? { ...product, published } : product
      ));
    } catch (error) {
      console.error('Error toggling publish status:', error);
    }
  };

  const handleSaveChanges = async (updatedProduct: Product) => {
    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('products')
        .update(updatedProduct)
        .eq('id', updatedProduct.id);

      if (error) throw error;
      
      setProducts(products.map(p => 
        p.id === updatedProduct.id ? updatedProduct : p
      ));
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Error updating product:', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewProduct(prev => ({ ...prev, image: file }));
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleAddProductChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    if (type === 'file') return;
    
    setNewProduct(prev => ({
      ...prev,
      [name]: name === 'price' ? value.replace(/[^0-9.]/g, '') : value
    }));
  };

  const handleAddProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name", newProduct.name);
      formDataToSend.append("description", newProduct.description);
      formDataToSend.append("price", newProduct.price);
      formDataToSend.append("category_id", newProduct.category_id);
      formDataToSend.append("published", String(newProduct.published));

      if (newProduct.image) {
        formDataToSend.append("image", newProduct.image);
      }

      const res = await fetch("/api/products", {
        method: "POST",
        body: formDataToSend,
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "فشل إضافة المنتج");
      }

      await fetchProducts();
      setIsAddModalOpen(false);
      
      setNewProduct({
        name: "",
        description: "",
        price: "",
        image: null,
        category_id: "",
        published: false
      });
      setPreviewUrl(null);
    } catch (error) {
      alert((error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">جاري التحميل...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">المنتجات</h1>
        <Button onClick={() => setIsAddModalOpen(true)}>إضافة منتج جديد</Button>
      </div>
      
      {products.length === 0 ? (
        <div className="mt-4">
          <p className="text-gray-600">لا توجد منتجات مضافة بعد</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div key={product.id} className="border rounded-lg overflow-hidden shadow">
              {product.image && (
                <div className="relative h-48 w-full">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="p-4">
                <h3 className="font-semibold text-lg">{product.name}</h3>
                <p className="text-gray-600 mt-2 line-clamp-2">{product.description}</p>
                <div className="mt-4 flex flex-wrap justify-between items-center gap-2">
                  <span className="font-bold text-lg">{product.price} ر.س</span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={product.published ? "default" : "outline"}
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTogglePublish(product.id, !product.published);
                      }}
                      className="text-xs"
                    >
                      {product.published ? "إخفاء" : "نشر"}
                    </Button>
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditClick(product);
                      }}
                      className="text-xs"
                    >
                      تعديل
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      <Dialog.Root open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg w-full max-w-md z-50">
            <div className="flex justify-between items-center mb-4">
              <Dialog.Title className="text-xl font-bold">تعديل المنتج</Dialog.Title>
              <Dialog.Close className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </Dialog.Close>
            </div>
            
            {editingProduct && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الاسم</label>
                  <input
                    type="text"
                    value={editingProduct.name}
                    onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                    className="w-full p-2 border rounded"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الوصف</label>
                  <textarea
                    value={editingProduct.description}
                    onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})}
                    className="w-full p-2 border rounded h-24"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">السعر</label>
                  <input
                    type="number"
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({...editingProduct, price: Number(e.target.value)})}
                    className="w-full p-2 border rounded"
                  />
                </div>

                <div className="flex items-center space-x-2 py-2">
                  <input
                    type="checkbox"
                    id="published"
                    checked={editingProduct.published || false}
                    onChange={(e) => setEditingProduct({...editingProduct, published: e.target.checked})}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="published" className="text-sm font-medium text-gray-700">
                    منشور
                  </label>
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Dialog.Close asChild>
                    <Button variant="outline">إلغاء</Button>
                  </Dialog.Close>
                  <Button onClick={() => handleSaveChanges(editingProduct)}>
                    حفظ التغييرات
                  </Button>
                </div>
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Add Product Modal */}
      <Dialog.Root open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto z-50">
            <div className="flex justify-between items-center mb-6">
              <Dialog.Title className="text-2xl font-bold">إضافة منتج جديد</Dialog.Title>
              <Dialog.Close className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </Dialog.Close>
            </div>

            <form onSubmit={handleAddProductSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">اسم المنتج</Label>
                <Input
                  id="name"
                  name="name"
                  value={newProduct.name}
                  onChange={handleAddProductChange}
                  required
                  disabled={isSubmitting}
                  placeholder="أدخل اسم المنتج"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">الوصف</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={newProduct.description}
                  onChange={handleAddProductChange}
                  disabled={isSubmitting}
                  placeholder="أدخل وصف المنتج"
                  className="min-h-[100px]"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">السعر</Label>
                  <Input
                    id="price"
                    name="price"
                    type="text"
                    inputMode="decimal"
                    value={newProduct.price}
                    onChange={handleAddProductChange}
                    required
                    disabled={isSubmitting}
                    placeholder="0.00"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category_id">التصنيف</Label>
                  <select
                    id="category_id"
                    name="category_id"
                    value={newProduct.category_id}
                    onChange={handleAddProductChange}
                    required
                    disabled={isSubmitting}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">اختر التصنيف</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="image">صورة المنتج</Label>
                <div className="mt-1 flex items-center">
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary/90 focus-within:outline-none"
                  >
                    <span>اختر صورة</span>
                    <input
                      id="image-upload"
                      name="image"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      disabled={isSubmitting}
                      className="sr-only"
                    />
                  </label>
                  <p className="pl-2 text-sm text-gray-600">
                    {newProduct.image ? newProduct.image.name : 'لم يتم اختيار صورة'}
                  </p>
                </div>
                {previewUrl && (
                  <div className="mt-2">
                    <div className="w-40 h-40 relative">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-full object-cover rounded-md"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="published"
                    checked={newProduct.published}
                    onCheckedChange={(checked) => 
                      setNewProduct(prev => ({ ...prev, published: checked }))
                    }
                    disabled={isSubmitting}
                  />
                  <Label htmlFor="published">
                    {newProduct.published ? "منشور" : "مسودة"}
                  </Label>
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsAddModalOpen(false);
                      setNewProduct({
                        name: "",
                        description: "",
                        price: "",
                        image: null,
                        category_id: "",
                        published: false
                      });
                      setPreviewUrl(null);
                    }}
                    disabled={isSubmitting}
                  >
                    إلغاء
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "جاري الحفظ..." : "حفظ المنتج"}
                  </Button>
                </div>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
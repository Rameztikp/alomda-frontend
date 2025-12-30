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
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    price: '',
    image: null as File | null,
    category_id: '',
    published: false
  });
  const [editPreviewUrl, setEditPreviewUrl] = useState<string | null>(null);
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
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([{ id: 'all', name: 'الكل' }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

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
      // Keep the 'all' option and add the fetched categories
      setCategories(prev => [...prev, ...(data || [])]);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleEditClick = (product: Product) => {
    setEditingProduct(product);
    setEditFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      image: null,
      category_id: product.category_id,
      published: product.published
    });
    setEditPreviewUrl(product.image || null);
    setIsEditModalOpen(true);
  };

  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditFormData(prev => ({ ...prev, image: file }));
      setEditPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    setEditFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
             type === 'number' ? value.replace(/[^0-9.]/g, '') : 
             value
    }));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name", editFormData.name);
      formDataToSend.append("description", editFormData.description);
      formDataToSend.append("price", editFormData.price);
      formDataToSend.append("category_id", editFormData.category_id);
      formDataToSend.append("published", String(editFormData.published));
      formDataToSend.append("_method", "PATCH");

      if (editFormData.image) {
        formDataToSend.append("image", editFormData.image);
      }

      const res = await fetch(`/api/products/${editingProduct.id}`, {
        method: "POST",
        body: formDataToSend,
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "فشل تحديث المنتج");
      }

      await fetchProducts();
      setIsEditModalOpen(false);
    } catch (error) {
      alert((error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
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

  // Filter products based on search query and category
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
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

      {/* Search and Filter Controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="ابحث عن منتج..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="w-full md:w-64">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {filteredProducts.length === 0 ? (
        <div className="mt-4">
          <p className="text-center text-gray-500 mt-4">
            {products.length === 0 ? 'لا توجد منتجات متاحة' : 'لا توجد نتائج مطابقة للبحث'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {paginatedProducts.map((product) => (
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
                  <span className="font-bold text-lg">{product.price} ر.ي</span>
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
      
      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-8 gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
            className="px-3 py-1 text-sm"
          >
            الأولى
          </Button>
          <Button
            variant="outline"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 text-sm"
          >
            السابق
          </Button>
          
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }
            
            return (
              <Button
                key={pageNum}
                variant={currentPage === pageNum ? "default" : "outline"}
                onClick={() => handlePageChange(pageNum)}
                className="px-3 py-1 text-sm min-w-[40px]"
              >
                {pageNum}
              </Button>
            );
          })}
          
          <Button
            variant="outline"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 text-sm"
          >
            التالي
          </Button>
          <Button
            variant="outline"
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 text-sm"
          >
            الأخيرة
          </Button>
        </div>
      )}

      {/* Edit Modal */}
      <Dialog.Root open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg shadow-lg w-full max-w-md z-50 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <Dialog.Title className="text-xl font-semibold">تعديل المنتج</Dialog.Title>
              <Dialog.Close asChild>
                <button className="text-gray-500 hover:text-gray-700">
                  <X className="w-5 h-5" />
                </button>
              </Dialog.Close>
            </div>
            
            {editingProduct && (
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="edit-name">اسم المنتج</Label>
                  <Input
                    id="edit-name"
                    name="name"
                    value={editFormData.name}
                    onChange={handleEditChange}
                    className="mt-1"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-description">الوصف</Label>
                  <Textarea
                    id="edit-description"
                    name="description"
                    value={editFormData.description}
                    onChange={handleEditChange}
                    rows={3}
                    className="mt-1"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-price">السعر (ر.ي)</Label>
                  <Input
                    id="edit-price"
                    name="price"
                    type="text"
                    inputMode="decimal"
                    value={editFormData.price}
                    onChange={handleEditChange}
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="edit-category">الفئة</Label>
                  <select
                    id="edit-category"
                    name="category_id"
                    value={editFormData.category_id}
                    onChange={handleEditChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    required
                  >
                    <option value="">اختر فئة</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="edit-image">صورة المنتج</Label>
                  <div className="mt-1 flex items-center">
                    <label className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                      تغيير الصورة
                      <input
                        id="edit-image"
                        name="image"
                        type="file"
                        accept="image/*"
                        onChange={handleEditFileChange}
                        className="sr-only"
                      />
                    </label>
                    {editFormData.image && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditFormData(prev => ({ ...prev, image: null }));
                          setEditPreviewUrl(null);
                        }}
                        className="ml-2 text-red-600 hover:text-red-800 text-sm"
                      >
                        حذف
                      </button>
                    )}
                  </div>
                  
                  {(editPreviewUrl || editingProduct.image) && (
                    <div className="mt-2 relative w-32 h-32 border rounded-md overflow-hidden">
                      <Image
                        src={editPreviewUrl || editingProduct.image}
                        alt={editingProduct.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <Switch
                    id="edit-published"
                    name="published"
                    checked={editFormData.published}
                    onCheckedChange={(checked) => 
                      setEditFormData(prev => ({ ...prev, published: checked }))
                    }
                  />
                  <Label htmlFor="edit-published">نشر المنتج</Label>
                </div>
                
                <div className="flex justify-end space-x-2 pt-4 rtl:space-x-reverse">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditModalOpen(false)}
                    disabled={isSubmitting}
                  >
                    إلغاء
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                  </Button>
                </div>
              </form>
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
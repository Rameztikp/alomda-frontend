"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { getSupabase } from '../lib/supabaseClient';
import { Product, Category } from './types';
import ImageCarousel from './components/ImageCarousel';

// Dynamic imports for better code splitting
const DynamicProductCard = dynamic(() => import('./components/ProductCard'), {
  loading: () => <div className="bg-gray-100 rounded-lg h-80 animate-pulse"></div>,
  ssr: false
});

// المكون الرئيسي للصفحة
const Page: React.FC = () => {
    // الثوابت
    const WHATSAPP_NUMBER = '967782888988'; // رقم الواتساب الرسمي
    const PHONE_NUMBERS = ['04 235 000', '782 888 888'];

    // صور البانر
    const carouselImages = [
      { src: '/panur1.jpg', alt: 'عروض خاصة' },
      { src: '/panur2.jpg', alt: 'خصومات حصرية' },
      { src: '/panur3.jpg', alt: 'أحدث المنتجات' },
      { src: '/panur4.jpg', alt: 'عروض مميزة' },
    ];

    // دالة لمعالجة النصوص وإزالة علامات Markdown
    const cleanText = (text: string | null | undefined): string => text ? text.replace(/[#*`]/g, '').trim() : '';

    // حالة لتخزين بيانات المنتجات والأصناف
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [displayProducts, setDisplayProducts] = useState<Product[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 12; // 12 products per page
    
    // تصفية المنتجات حسب الصنف المحدد
    useEffect(() => {
        if (activeCategory) {
            setDisplayProducts(products.filter(p => p.category_id === activeCategory));
        } else {
            setDisplayProducts(products);
        }
    }, [activeCategory, products]);
    
    // دالة لجلب الأصناف
    const fetchCategories = useCallback(async () => {
        try {
            const supabase = getSupabase();
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .order('name_ar', { ascending: true });

            if (error) throw error;
            
            setCategories(data || []);
        } catch (err) {
            console.error('Error fetching categories:', err);
            setError('فشل في تحميل الأصناف');
        }
    }, []);

    // دالة لجلب البيانات من Supabase
    const fetchData = useCallback(async () => {
        console.log('fetchData called - Using Supabase');
        setIsLoading(true);
        setError(null);
        
        try {
            const supabase = getSupabase();
            
            // 1. جلب جميع الفئات أولاً
            console.log('جاري جلب الفئات...');
            const { data: allCategories, error: categoriesError } = await supabase
                .from('categories')
                .select('*')
                .order('name', { ascending: true }); // تم تغيير name_ar إلى name

            if (categoriesError) {
                console.error('خطأ في جلب الفئات:', categoriesError);
                throw categoriesError;
            }
            
            console.log('تم جلب الفئات بنجاح:', allCategories?.length);

            // 2. جلب المنتجات المنشورة فقط
            console.log('جاري جلب المنتجات...');
            const { data: productsData, error: productsError } = await supabase
                .from('products')
                .select('*')
                .eq('published', true)
                .order('created_at', { ascending: false });

            if (productsError) {
                console.error('خطأ في جلب المنتجات:', productsError);
                throw productsError;
            }
            
            console.log('تم جلب المنتجات بنجاح:', productsData?.length);

            // 3. دمج البيانات
            const productsWithCategories = (productsData || []).map(product => ({
                ...product,
                categories: (allCategories || []).find(cat => cat.id === product.category_id) || null
            }));
            
            console.log('تم دمج البيانات بنجاح');
            
            // 4. تحديث الحالة
            setProducts(productsWithCategories);
            setCategories(allCategories || []);
            setDisplayProducts(productsWithCategories);
            setCurrentPage(1); // Reset to first page when products change
            
            console.log('تم تحديث واجهة المستخدم بنجاح');
            
        } catch (error) {
            console.error('حدث خطأ في fetchData:', {
                error,
                errorString: String(error),
                errorJSON: JSON.stringify(error, null, 2)
            });
            
            setError('حدث خطأ أثناء جلب البيانات. يرجى تحديث الصفحة والمحاولة مرة أخرى');
        } finally {
            setIsLoading(false);
        }
    }, []);

    // استدعاء fetchData عند تحميل المكون
    useEffect(() => {
        console.log('Component mounted, calling fetchData');
        fetchData().catch(err => {
            console.error('Error in fetchData:', err);
        });
    }, [fetchData]);

    // تصفية المنتجات حسب الصنف النشط وحساب الصفحات
    const filteredProducts = useMemo(() => {
        if (!activeCategory) return products;
        return products.filter(product => product.category_id === activeCategory);
    }, [products, activeCategory]);
    
    // حساب عدد الصفحات
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    
    // حساب المنتجات المعروضة في الصفحة الحالية
    const paginatedProducts = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredProducts, currentPage, itemsPerPage]);
    
    // تحديث المنتجات المعروضة عند تغيير التصفية أو الصفحة
    useEffect(() => {
        setDisplayProducts(activeCategory ? filteredProducts : products);
        // Reset to first page when filter changes
        if (currentPage !== 1) setCurrentPage(1);
    }, [filteredProducts, products, activeCategory, currentPage]);
    
    // تغيير الصفحة
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // معالجة طلب الواتساب
    const handleWhatsAppOrder = useCallback((product: Product) => {
        const message = `مرحباً، أود طلب المنتج: ${product.name_ar}`;
        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');
    }, []);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* البانر الرئيسي */}
            <div className="mb-8">
                <ImageCarousel images={carouselImages} />
            </div>

            {/* المحتوى الرئيسي */}
            <main className="container mx-auto px-4 py-8">
                {/* عرض رسالة الخطأ أو التحميل */}
                {error && (
                    <div role="alert" className="p-4 mb-8 bg-red-100 border border-red-400 text-red-700 rounded-lg font-bold text-center">
                        {error}
                    </div>
                )}

                {isLoading && !error && (
                    <div className="text-center p-10 text-gray-500 text-xl">
                        <svg className="animate-spin h-8 w-8 text-green-600 mx-auto mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        جارٍ تحميل البيانات...
                    </div>
                )}
                
                {/* قسم فلاتر الأصناف */}
                {!isLoading && !error && (
                    <section id="categories" className="mb-12">
                        <div className="flex flex-wrap gap-2 justify-center">
                            <button
                                onClick={() => setActiveCategory(null)}
                                className={`px-4 py-2 rounded-full ${!activeCategory ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                            >
                                الكل
                            </button>
                            {categories.map((category) => (
                                <button
                                    key={category.id}
                                    onClick={() => setActiveCategory(category.id)}
                                    className={`px-4 py-2 rounded-full ${activeCategory === category.id ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                                >
                                    {category.name}
                                </button>
                            ))}
                        </div>
                    </section>
                )}

                {/* قسم المنتجات */}
                {!isLoading && (
                    <section id="products" className="mb-16">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {error ? (
                                <div className="col-span-full text-center p-10 bg-red-50 rounded-xl">
                                    <p className="text-xl text-red-600">{error}</p>
                                    <button 
                                        onClick={fetchData}
                                        className="mt-4 bg-primary text-white px-6 py-2 rounded-md hover:bg-primary-dark transition-colors"
                                    >
                                        إعادة المحاولة
                                    </button>
                                </div>
                            ) : filteredProducts.length > 0 ? (
                                <>
                                    {paginatedProducts.map((product) => {
                                        // تحضير البيانات لتكون متوافقة مع مكون ProductCard
                                        const productData = {
                                            id: product.id,
                                            name_ar: product.name_ar || product.name || 'بدون اسم',
                                            description_ar: product.description_ar || product.description || '',
                                            price: product.price?.toString() || '0',
                                            image_url: product.image_url || product.image || '',
                                            category_id: product.category_id
                                        };
                                        return <DynamicProductCard key={product.id} product={productData} />;
                                    })}
                                    
                                    {/* Pagination Controls */}
                                    {totalPages > 1 && (
                                        <div className="col-span-full flex justify-center mt-8 gap-2 flex-wrap">
                                            <button
                                                onClick={() => handlePageChange(1)}
                                                disabled={currentPage === 1}
                                                className="px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                الأولى
                                            </button>
                                            <button
                                                onClick={() => handlePageChange(currentPage - 1)}
                                                disabled={currentPage === 1}
                                                className="px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                السابق
                                            </button>
                                            
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
                                                    <button
                                                        key={pageNum}
                                                        onClick={() => handlePageChange(pageNum)}
                                                        className={`px-4 py-2 rounded-md border ${currentPage === pageNum 
                                                            ? 'bg-primary text-white border-primary' 
                                                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                );
                                            })}
                                            
                                            <button
                                                onClick={() => handlePageChange(currentPage + 1)}
                                                disabled={currentPage === totalPages}
                                                className="px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                التالي
                                            </button>
                                            <button
                                                onClick={() => handlePageChange(totalPages)}
                                                disabled={currentPage === totalPages}
                                                className="px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                الأخيرة
                                            </button>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="col-span-full text-center p-10 bg-gray-100 rounded-xl">
                                    <p className="text-2xl text-gray-600">لا توجد منتجات متاحة حالياً.</p>
                                </div>
                            )}
                        </div>
                    </section>
                )}
            </main>
        </div>
    );
};

export default Page;
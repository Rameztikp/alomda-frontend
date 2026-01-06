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
const Page = () => 
 {
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
    const [itemsPerPage, setItemsPerPage] = useState(12);
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState<{type: 'term' | 'product', content: any}[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const [priceRange, setPriceRange] = useState({ min: 0, max: 10000 });
    
    // Remove diacritics from Arabic text for better matching
    const removeDiacritics = (text: string) => {
        return text
            .replace(/[\u064B-\u065F]/g, '') // Arabic diacritics
            .replace(/[\u0670-\u06FF]/g, function(letter) {
                // Map similar Arabic letters to their base form
                const map: {[key: string]: string} = {
                    'أ': 'ا', 'إ': 'ا', 'آ': 'ا', 'ٱ': 'ا', 'ى': 'ي', 'ة': 'ه', 'ؤ': 'ء', 'ئ': 'ء'
                };
                return map[letter] || letter;
            });
    };
    
    // Generate search suggestions and matching products with improved search
    const updateSuggestions = (query: string) => {
        if (!query.trim()) {
            setSuggestions([]);
            setShowSuggestions(false);
            setHighlightedIndex(-1);
            return;
        }
        
        const queryNormalized = removeDiacritics(query.toLowerCase().trim());
        const queryTerms = queryNormalized.split(/\s+/).filter(Boolean);
        
        // 1. First pass: Exact matches in product names (highest priority)
        const exactNameMatches = products
            .filter(product => {
                const name = removeDiacritics(product.name.toLowerCase());
                return queryTerms.some(term => name === term);
            })
            .map(product => ({
                type: 'product' as const,
                content: product,
                score: 200 // Highest score for exact name match
            }));
        
        // 2. Second pass: Contains matches in product names
        const containsNameMatches = products
            .filter(product => !exactNameMatches.some(p => p.content.id === product.id))
            .map(product => {
                const name = removeDiacritics(product.name.toLowerCase());
                const nameTerms = name.split(/\s+/);
                
                // Calculate score based on term matches
                const score = queryTerms.reduce((total, term) => {
                    // Exact match in name
                    if (name === term) return total + 150;
                    
                    // Contains term in name
                    if (name.includes(term)) {
                        // Higher score if the term is at the beginning of the name
                        if (name.startsWith(term)) return total + 120;
                        return total + 100;
                    }
                    
                    // Match at the beginning of words in the name
                    const wordStartMatch = nameTerms.some(nameTerm => nameTerm.startsWith(term));
                    if (wordStartMatch) return total + 80;
                    
                    // Match anywhere in the name
                    if (name.includes(term)) return total + 60;
                    
                    return total;
                }, 0);
                
                return { product, score };
            })
            .filter(({ score }) => score > 0);
        
        // 3. Third pass: Category matches (higher priority than description)
        const categoryMatches = products
            .filter(product => 
                !exactNameMatches.some(p => p.content.id === product.id) &&
                !containsNameMatches.some(p => p.product.id === product.id)
            )
            .map(product => {
                const category = categories.find(c => c.id === product.category_id);
                if (!category) return null;
                
                const categoryName = removeDiacritics(category.name.toLowerCase());
                
                const score = queryTerms.reduce((total, term) => {
                    // Exact match in category name
                    if (categoryName === term) return total + 90;
                    
                    // Contains term in category name
                    if (categoryName.includes(term)) {
                        // Higher score if the term is at the beginning of the category name
                        if (categoryName.startsWith(term)) return total + 70;
                        return total + 50;
                    }
                    
                    return total;
                }, 0);
                
                return score > 0 ? { product, score } : null;
            })
            .filter((match): match is { product: Product; score: number } => match !== null);
        
        // 4. Fourth pass: Description matches (lowest priority)
        const descriptionMatches = products
            .filter(product => 
                !exactNameMatches.some(p => p.content.id === product.id) &&
                !containsNameMatches.some(p => p.product.id === product.id) &&
                !categoryMatches.some(p => p.product.id === product.id) &&
                product.description
            )
            .map(product => {
                const description = removeDiacritics((product.description || '').toLowerCase());
                
                const score = queryTerms.reduce((total, term) => {
                    // Match at the beginning of words in description
                    const wordStartMatch = new RegExp(`\\b${term}`, 'i').test(description);
                    if (wordStartMatch) return total + 30;
                    
                    // Match anywhere in description
                    if (description.includes(term)) return total + 15;
                    
                    return total;
                }, 0);
                
                return score > 0 ? { product, score } : null;
            })
            .filter((match): match is { product: Product; score: number } => match !== null);
        
        // Combine and sort all matches with type information
        const allMatches = [
            ...exactNameMatches,
            ...containsNameMatches.map(({ product, score }) => ({
                type: 'product' as const,
                content: product,
                score
            })),
            ...categoryMatches.map(({ product, score }) => ({
                type: 'product' as const,
                content: product,
                score: score * 0.9 // Slightly reduce score for category matches
            })),
            ...descriptionMatches.map(({ product, score }) => ({
                type: 'product' as const,
                content: product,
                score: score * 0.7 // Further reduce score for description matches
            }))
        ];
        
        // Remove duplicates and sort by score
        const uniqueMatches = Array.from(new Map(
            allMatches.map(item => [item.content.id, item])
        ).values());
        
        // Only show products with a minimum score threshold
        const MIN_SCORE = 30;
        const sortedMatches = uniqueMatches
            .filter(item => item.score >= MIN_SCORE)
            .sort((a, b) => b.score - a.score)
            .slice(0, 5) // Top 5 products
            .map(({ type, content }) => ({ type, content }));
        
        // Generate term suggestions from product names and categories
        const suggestionSet = new Set<string>();
        
        // Add product names that match the search terms
        products.forEach(product => {
            const name = removeDiacritics(product.name.toLowerCase());
            if (queryTerms.some(term => name.includes(term) && term.length > 2)) {
                suggestionSet.add(product.name);
            }
        });
        
        // Add category names that match the search terms
        categories.forEach(category => {
            const name = removeDiacritics(category.name.toLowerCase());
            if (queryTerms.some(term => name.includes(term) && term.length > 2)) {
                suggestionSet.add(category.name);
            }
        });
        
        // Add the original search terms if they're not too short
        queryTerms
            .filter(term => term.length > 2)
            .forEach(term => suggestionSet.add(term));
        
        const termSuggestions = Array.from(suggestionSet)
            .filter(term => {
                // Filter out terms that are too similar to what's already in the results
                const normalizedTerm = removeDiacritics(term.toLowerCase());
                return !sortedMatches.some(item => 
                    removeDiacritics(item.content.name.toLowerCase()).includes(normalizedTerm) ||
                    (item.content.category && 
                     removeDiacritics(item.content.category.name.toLowerCase()).includes(normalizedTerm))
                );
            })
            .slice(0, 3)
            .map(term => ({
                type: 'term' as const,
                content: term
            }));
        
        // Combine products and term suggestions
        const finalSuggestions = [...sortedMatches, ...termSuggestions].slice(0, 8);
        setSuggestions(finalSuggestions);
        setShowSuggestions(finalSuggestions.length > 0);
    };

    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    
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
                .order('name', { ascending: true });

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

    // ✅ إضافة مهمة جدًا: إعادة توليد الاقتراحات بعد تحميل المنتجات/الفئات
    useEffect(() => {
        if (searchQuery.trim() && products.length > 0) {
            updateSuggestions(searchQuery);
        }
        // ملاحظة: لا نضع updateSuggestions في deps لأنه inline function ويتغير كل رندر
        // ونكتفي بالمؤثرات الفعلية (products/categories/searchQuery).
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [products, categories]); 

    // حساب درجة التطابق بين النص والاستعلام
    const calculateMatchScore = (text: string, query: string): number => {
        if (!text || !query) return 0;
        
        const normalizedText = removeDiacritics(text.toLowerCase());
        const normalizedQuery = removeDiacritics(query.toLowerCase());
        const queryTerms = normalizedQuery.split(/\s+/).filter(Boolean);
        
        if (queryTerms.length === 0) return 0;
        
        // حساب عدد المصطلحات المتطابقة
        const matchedTerms = queryTerms.filter(term => 
            normalizedText.includes(term)
        ).length;
        
        // حساب نسبة التطابق
        const matchRatio = matchedTerms / queryTerms.length;
        
        // إعطاء وزن أعلى للمطابقة في بداية الكلمة
        const positionBonus = queryTerms.some(term => 
            normalizedText.startsWith(term)
        ) ? 0.2 : 0;
        
        return matchRatio + positionBonus;
    };
    
    // تصفية المنتجات حسب البحث والفلاتر
    const filteredProducts = useMemo(() => {
        if (!searchQuery.trim()) {
            // إذا لم يكن هناك بحث، قم بتطبيق الفلاتر فقط
            return products.filter(product => {
                const productPrice = parseFloat(product.price?.toString() || '0');
                const matchesPrice = productPrice >= priceRange.min && productPrice <= priceRange.max;
                const matchesSelectedCategories = selectedCategories.length === 0 || 
                    (product.category_id && selectedCategories.includes(product.category_id));
                const matchesCategory = !activeCategory || product.category_id === activeCategory;
                
                return matchesPrice && matchesSelectedCategories && matchesCategory;
            });
        }
        
        // إذا كان هناك بحث، قم بحساب درجة التطابق لكل منتج
        return products
            .map(product => {
                const searchText = [
                    product.name || '',
                    product.description || '',
                    categories.find((c: Category) => c.id === product.category_id)?.name || ''
                ].join(' ');
                
                const score = calculateMatchScore(searchText, searchQuery);
                return { product, score };
            })
            .filter(({ score }) => score > 0)
            .filter(({ product }) => {
                const productPrice = parseFloat(product.price?.toString() || '0');
                const matchesPrice = productPrice >= priceRange.min && productPrice <= priceRange.max;
                const matchesSelectedCategories = selectedCategories.length === 0 || 
                    (product.category_id && selectedCategories.includes(product.category_id));
                const matchesCategory = !activeCategory || product.category_id === activeCategory;
                
                return matchesPrice && matchesSelectedCategories && matchesCategory;
            })
            .sort((a, b) => b.score - a.score)
            .map(({ product }) => product);
    }, [products, activeCategory, searchQuery, priceRange, selectedCategories, categories]);
    
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
        const message = `مرحباً، أود طلب المنتج: ${product.name}`;
        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');
    }, [WHATSAPP_NUMBER]);
    
    // معالجة تغيير نص البحث
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchQuery(value);
        updateSuggestions(value);
        setShowSuggestions(true);
        setHighlightedIndex(-1);
    };
    
    // معالجة اختيار اقتراح
    const handleSuggestionClick = (suggestion: {type: string, content: any}) => {
        if (suggestion.type === 'term') {
            setSearchQuery(suggestion.content);
        } else {
            setSearchQuery(suggestion.content.name);
        }
        setShowSuggestions(false);
    };
    
    // معالجة الضغط على الأزرار في حقل البحث
    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlightedIndex(prev => 
                prev < suggestions.length - 1 ? prev + 1 : prev
            );
            // Scroll into view
            const activeElement = document.querySelector('.suggestion-item.highlighted');
            activeElement?.scrollIntoView({ block: 'nearest' });
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightedIndex(prev => 
                prev > 0 ? prev - 1 : -1
            );
            // Scroll into view
            const activeElement = document.querySelector('.suggestion-item.highlighted');
            activeElement?.scrollIntoView({ block: 'nearest' });
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
                handleSuggestionClick(suggestions[highlightedIndex]);
            }
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
        }
    };
    
    // إبراز النص المطابق للبحث
    const highlightMatch = (text: string | null | undefined, query: string) => {
        // التعامل مع القيم الفارغة أو غير المعرفة
        if (!text) return '';
        if (!query?.trim()) return text;
        
        try {
            const queryTerms = query.split(/\s+/).filter(Boolean);
            let result = text.toString(); // التحويل إلى نص لضمان أن النتيجة نصية
            
            queryTerms.forEach(term => {
                if (!term) return;
                try {
                    const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
                    result = result.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
                } catch (e) {
                    console.warn('خطأ في معالجة مصطلح البحث:', term, e);
                }
            });
            
            return <span dangerouslySetInnerHTML={{ __html: result }} />;
        } catch (error) {
            console.error('خطأ في إبراز النص المطابق:', error);
            return text; // إرجاع النص الأصلي في حالة حدوث خطأ
        }
    };

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
                
                {/* شريط البحث والفلاتر */}
                {!isLoading && !error && (
                    <div className="mb-8 bg-white p-6 rounded-lg shadow-sm">
                        <div className="flex flex-col md:flex-row gap-6">
                            {/* شريط البحث */}
                            <div className="flex-1">
                                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                                    بحث المنتجات
                                </label>

                                {/* ✅ تعديل: overflow-visible لمنع قص القائمة */}
                                <div className="relative overflow-visible">
                                    <input
                                        type="text"
                                        id="search"
                                        placeholder="ابحث عن منتج..."
                                        value={searchQuery}
                                        onChange={handleSearchChange}
                                        onKeyDown={handleSearchKeyDown}
                                        onFocus={() => setShowSuggestions(true)}
                                        onBlur={() => setTimeout(() => setShowSuggestions(false), 300)} // ✅ تعديل
                                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                                        autoComplete="off"
                                    />
                                    <div className="absolute right-3 top-2.5 text-gray-400">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                    
                                    {/* قائمة الاقتراحات */}
                                    {showSuggestions && suggestions.length > 0 && (
                                        <div className="absolute z-[9999] mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-96 overflow-y-auto">
                                            {suggestions.map((suggestion, index) => (
                                                <div
                                                    key={suggestion.type + '-' + (suggestion.content.id || suggestion.content)}
                                                    className={[
                                                        "suggestion-item",
                                                        "px-4 py-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-0",
                                                        highlightedIndex === index ? "bg-blue-50" : ""
                                                    ].join(" ")}
                                                    onMouseDown={() => handleSuggestionClick(suggestion)}
                                                >
                                                    {suggestion.type === 'product' ? (
                                                        <div className="flex items-start gap-3">
                                                            <div className="flex-shrink-0">
                                                                <div className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded-md border border-gray-200">
                                                                    <img 
                                                                        src={suggestion.content.image || '/placeholder-product.svg'} 
                                                                        alt={suggestion.content.name}
                                                                        className="w-10 h-10 object-contain"
                                                                        onError={(e) => {
                                                                            const target = e.target as HTMLImageElement;
                                                                            target.onerror = null; // Prevent infinite loop
                                                                            target.src = '/placeholder-product.svg';
                                                                        }}
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="font-medium text-gray-900 mb-1">
                                                                    {highlightMatch(suggestion.content.name, searchQuery)}
                                                                </div>
                                                                {suggestion.content.description && (
                                                                    <div className="text-sm text-gray-600 line-clamp-2 mb-1">
                                                                        {highlightMatch(suggestion.content.description.substring(0, 100) + (suggestion.content.description.length > 100 ? '...' : ''), searchQuery)}
                                                                    </div>
                                                                )}
                                                                <div className="flex items-center justify-between mt-1">
                                                                    <span className="text-sm font-semibold text-primary">
                                                                        {suggestion.content.price ? `${suggestion.content.price.toLocaleString()} ريال` : 'السعر غير متوفر'}
                                                                    </span>
                                                                    {suggestion.content.category_id && (
                                                                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                                                            {categories.find(c => c.id === suggestion.content.category_id)?.name || ''}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center py-1">
                                                            <svg className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                            </svg>
                                                            <span className="truncate">
                                                                البحث عن: {highlightMatch(suggestion.content, searchQuery)}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    
                                    {/* زر مسح البحث */}
                                    {searchQuery && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSearchQuery('');
                                                setSuggestions([]);
                                                setShowSuggestions(false); // ✅ تعديل بسيط: إخفاء القائمة عند المسح
                                                setHighlightedIndex(-1);
                                            }}
                                            className="absolute left-3 top-2.5 text-gray-400 hover:text-gray-600"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* فلتر السعر */}
                            <div className="w-full md:w-80">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    نطاق السعر: {priceRange.min} - {priceRange.max} ريال
                                </label>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="range"
                                        min="0"
                                        max="10000"
                                        step="100"
                                        value={priceRange.max}
                                        onChange={(e) => setPriceRange(prev => ({ ...prev, max: parseInt(e.target.value) }))}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* فلاتر الفئات */}
                        <div className="mt-6">
                            <h3 className="text-sm font-medium text-gray-700 mb-2">الفئات:</h3>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => setSelectedCategories([])}
                                    className={`px-3 py-1.5 text-sm rounded-full ${selectedCategories.length === 0 ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                >
                                    الكل
                                </button>
                                {categories.map((category) => (
                                    <button
                                        key={category.id}
                                        onClick={() => {
                                            setSelectedCategories(prev => 
                                                prev.includes(category.id)
                                                    ? prev.filter(id => id !== category.id)
                                                    : [...prev, category.id]
                                            );
                                        }}
                                        className={`px-3 py-1.5 text-sm rounded-full ${selectedCategories.includes(category.id) ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                    >
                                        {category.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* عدد المنتجات المعروضة */}
                {!isLoading && !error && (
                    <div className="flex justify-between items-center mb-6">
                        <div className="text-sm text-gray-600">
                            عرض <span className="font-medium">{filteredProducts.length}</span> منتج
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">عرض:</span>
                            <select 
                                value={itemsPerPage}
                                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                                className="border border-gray-300 rounded-md text-sm px-2 py-1"
                            >
                                <option value="12">12</option>
                                <option value="24">24</option>
                                <option value="48">48</option>
                                <option value="96">96</option>
                            </select>
                        </div>
                    </div>
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

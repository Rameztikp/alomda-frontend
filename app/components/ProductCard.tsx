import React, { memo } from 'react';
import Image from 'next/image';

interface ProductCardProps {
  product: {
    id: string | number;  // UUID أو رقم
    name_ar: string;
    description_ar?: string;
    price: string | number;
    image_url: string;
    category_id?: string | number;  // UUID أو رقم
  };
}

const ProductCard: React.FC<ProductCardProps> = memo(({ product }) => {
  const { name_ar, description_ar, price, image_url } = product;

  const handleWhatsAppClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const message = `مرحباً، أنا مهتم بالمنتج: ${name_ar} - السعر: ${typeof price === 'number' ? price.toFixed(2) : price} ريال يمني`;
    const phoneNumber = '967782888988'; // رقم الواتساب الخاص بك
    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col h-full">
      
<div className="relative h-64 w-full bg-white flex items-center justify-center p-4 border-b border-gray-200">
  {product.image_url ? (
    <div className="w-full h-full flex items-center justify-center">
      <img
        src={
          // If it's already a full URL, use it as is
          product.image_url.startsWith('http') 
            ? product.image_url 
            // Otherwise, construct the full URL using the API base URL
            : `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}${
                product.image_url.startsWith('/storage/') 
                  ? product.image_url.replace('/storage/', '/storage/')
                  : product.image_url.startsWith('storage/')
                    ? `/${product.image_url}`
                    : `/storage/${product.image_url}`
              }`
        }
        alt={product.name_ar}
        className="max-w-full max-h-full object-contain"
        style={{
          maxWidth: '100%',
          maxHeight: '100%',
          width: 'auto',
          height: 'auto'
        }}
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          console.error('فشل تحميل الصورة:', target.src);
          target.style.display = 'none';
          target.nextElementSibling?.classList.remove('hidden');
        }}
      />
    </div>
  ) : (
    <div className="text-gray-300">
      <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    </div>
  )}
</div>


      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">{name_ar}</h3>
        {description_ar && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-2 flex-grow">
            {description_ar}
          </p>
        )}
        <div className="mt-auto">
          <div className="flex justify-between items-center mb-3">
            <span className="text-lg font-bold text-primary">
              {typeof price === 'number' ? price.toFixed(2) : Number(price || 0).toFixed(2)} ريال يمني
            </span>
          </div>
          <button
            onClick={handleWhatsAppClick}
            className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md flex items-center justify-center gap-2 transition-colors"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="currentColor"
              className="flex-shrink-0"
            >
              <path d="M17.5 2h-11C4.57 2 3 3.57 3 5.5v13C3 20.43 4.57 22 6.5 22h11c1.93 0 3.5-1.57 3.5-3.5v-13C21 3.57 19.43 2 17.5 2zm-11 2h11c.827 0 1.5.673 1.5 1.5v.5h-14v-.5c0-.827.673-1.5 1.5-1.5zm11 16h-11A1.502 1.502 0 015 18.5V7h14v11.5c0 .827-.673 1.5-1.5 1.5z"/>
              <path d="M12 10c-1.103 0-2 .897-2 2s.897 2 2 2 2-.897 2-2-.897-2-2-2zm0 3a1 1 0 110-2 1 1 0 010 2z"/>
            </svg>
            تواصل عبر واتساب
          </button>
        </div>
      </div>
    </div>
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;
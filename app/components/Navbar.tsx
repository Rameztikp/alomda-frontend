'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronDown, Menu, X } from 'lucide-react';
import WhatsAppButton from './WhatsAppButton';

// رقم هاتف الواتساب
const WHATSAPP_NUMBER = '966500000000';

// قائمة المنتجات
const products = [
  { name: 'شامبو طبيعي', href: '#shampoo' },
  { name: 'صابون طبيعي', href: '#soap' },
  { name: 'كريمات طبيعية', href: '#creams' },
  { name: 'زيوت طبيعية', href: '#oils' },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isProductsOpen, setIsProductsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // إغلاق القائمة المنسدلة عند النقر خارجها
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProductsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsOpen(false);
      }
    };

    // Set initial mobile state
    handleResize();
    
    // Add event listener for window resize
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center justify-between w-full md:w-auto">
            <Link href="/" className="flex items-center group">
              <div className="p-1 rounded-full bg-white/50 group-hover:bg-white/80 transition-all duration-300">
                <Image
                  src="/logo-final-01.png"
                  alt="شعار العمدة ستار"
                  width={60}
                  height={60}
                  className="h-14 w-auto object-contain"
                  priority
                />
              </div>
              <h1 className="mr-3 text-2xl font-bold bg-gradient-to-l from-[#0c6c74] to-[#0f8a94] bg-clip-text text-transparent hidden sm:block">
                العمدة ستار
              </h1>
            </Link>
            
            {/* Mobile menu button */}
            <button 
              onClick={toggleMenu}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 text-[#0c6c74] transition-colors"
              aria-label="قائمة الهاتف"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1 rtl:space-x-reverse">
            {/* Products Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setIsProductsOpen(!isProductsOpen)}
                className="flex items-center px-4 py-3 text-[#0c6c74] hover:text-[#0f8a94] font-medium transition-colors rounded-lg hover:bg-gray-50"
              >
                <span>المنتجات</span>
                <ChevronDown className={`w-4 h-4 mr-1 transition-transform duration-200 ${isProductsOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {/* Dropdown Menu */}
              {isProductsOpen && (
                <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl bg-white shadow-lg ring-1 ring-black/5 focus:outline-none z-50 animate-in fade-in-80">
                  <div className="p-2">
                    {products.map((product) => (
                      <a
                        key={product.href}
                        href={product.href}
                        className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                        onClick={() => setIsProductsOpen(false)}
                      >
                        {product.name}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <a 
              href="#contact" 
              className="px-4 py-3 text-[#0c6c74] hover:text-[#0f8a94] font-medium transition-colors rounded-lg hover:bg-gray-50"
            >
              تواصل معنا
            </a>
            
            <a 
              href={`https://wa.me/${WHATSAPP_NUMBER}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center w-10 h-10"
            >
              <WhatsAppButton />
            </a>
          </nav>
        </div>
        
        {/* Mobile Navigation */}
        {isOpen && isMobile && (
          <div className="md:hidden mt-2 pb-4 animate-in slide-in-from-top">
            <div className="flex flex-col space-y-1 p-2 bg-white rounded-xl shadow-lg">
              <div className="border-b border-gray-100 pb-2">
                <h3 className="px-4 py-2 text-sm font-medium text-gray-500">القائمة الرئيسية</h3>
                <a 
                  href="#products" 
                  className="block px-4 py-3 text-[#0c6c74] hover:bg-gray-50 rounded-lg font-medium transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  المنتجات
                </a>
                <a 
                  href="#contact" 
                  className="block px-4 py-3 text-[#0c6c74] hover:bg-gray-50 rounded-lg font-medium transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  تواصل معنا
                </a>
              </div>
              <div className="border-b border-gray-100 pb-2">
                <h3 className="px-4 py-2 text-sm font-medium text-gray-500">المنتجات</h3>
                {products.map((product) => (
                  <a
                    key={product.href}
                    href={product.href}
                    className="block px-4 py-3 text-[#0c6c74] hover:bg-gray-50 rounded-lg font-medium transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    {product.name}
                  </a>
                ))}
              </div>
              <div className="pt-2">
                <a 
                  href="#contact" 
                  className="block px-4 py-3 text-[#0c6c74] hover:bg-gray-50 rounded-lg font-medium transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  تواصل معنا
                </a>
                <a 
                  href={`https://wa.me/${WHATSAPP_NUMBER}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-12 h-12 mx-auto mt-4"
                  onClick={() => setIsOpen(false)}
                >
                  <WhatsAppButton />
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;

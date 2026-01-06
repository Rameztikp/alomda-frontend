import Link from 'next/link';
import { FaFacebook, FaInstagram, FaMapMarkerAlt, FaPhone, FaEnvelope, FaCode } from 'react-icons/fa';

export default function Footer() {
  return (
    <footer className="bg-gradient-to-b from-gray-900 to-gray-800 text-gray-100 py-12 mt-16 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* معلومات الاتصال */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold mb-4">تواصل معنا</h3>
            <div className="flex items-start space-x-3 space-x-reverse">
              <FaMapMarkerAlt className="mt-1 text-amber-400" />
              <a 
                href="https://www.google.com/maps/place/%D9%85%D8%B3%D8%AA%D8%B4%D9%81%D9%89+%D8%A7%D9%84%D8%A7%D9%87%D8%AF%D8%A7%D9%84+%D8%A7%D9%84%D8%AE%D8%A7%D8%B5+%D8%A8%D8%A7%D9%84%D8%B9%D9%8A%D9%88%D9%86+%D9%88%D8%A7%D9%84%D8%A7%D9%85%D8%B1%D8%A7%D8%B6+%D8%A7%D9%84%D8%A8%D8%A7%D8%B7%D9%86%D9%8A%D8%A9%E2%80%AD/@13.584476,44.0219499,17z/data=!3m1!4b1!4m6!3m5!1s0x0:0x8e8e9d9d9d9d9d9d!8m2!3d13.5844708!4d44.0219499!16s%2Fg%2F11bw4v5v5v?entry=ttu" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-200 hover:text-amber-400 transition-colors"
              >
                اليمن - تعز - التحرير الاسفل - جوار مستشفى الأهدال
              </a>
            </div>
            <div className="flex items-center space-x-3 space-x-reverse">
              <FaPhone className="text-amber-400" />
              <a href="tel:+967XXXXXXXXX" className="text-gray-200 hover:text-amber-400 transition-colors">+967 782 888 988</a>
            </div>
            <div className="flex items-center space-x-3 space-x-reverse">
              <FaEnvelope className="text-amber-400" />
              <a href="mailto:info@example.com" className="text-gray-200 hover:text-amber-400 transition-colors">alomdastartrading@gmail.com</a>
            </div>
          </div>

          {/* قائمة سريعة */}
          <div>
            <h3 className="text-xl font-bold mb-4">روابط سريعة</h3>
            <ul className="space-y-2">
              <li><span className="text-gray-200">من نحن</span></li>
              <li><span className="text-gray-200">المنتجات</span></li>
              <li><span className="text-gray-200">اتصل بنا</span></li>
              <li><span className="text-gray-200">سياسة الخصوصية</span></li>
            </ul>
          </div>

          {/* وسائل التواصل الاجتماعي */}
          <div>
            <h3 className="text-xl font-bold mb-4">تابعنا على</h3>
            <div className="flex space-x-4 space-x-reverse">
              <Link 
                href="https://www.facebook.com/share/1CpMduMkrG/?mibextid=wwXIfr" 
                target="_blank" 
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="bg-[#1877F2] hover:bg-blue-600 text-white p-3 rounded-full transition-all duration-300 transform hover:scale-110 shadow-lg"
              >
                <FaFacebook size={20} />
              </Link>
              <Link 
                href="https://www.instagram.com/your-instagram-account/" 
                target="_blank" 
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white p-3 rounded-full transition-all duration-300 transform hover:scale-110 shadow-lg"
              >
                <FaInstagram size={20} />
              </Link>
              <Link 
                href="https://wa.me/967782478767" 
                target="_blank"
                rel="noopener noreferrer"
                aria-label="تواصل مع المطور"
                title="تواصل مع المطور - رامز طلال"
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white p-3 rounded-full transition-all duration-300 transform hover:scale-110 shadow-lg"
              >
                <FaCode size={20} />
              </Link>
            </div>
          </div>
        </div>

        {/* حقوق النشر */}
        <div className="border-t border-gray-700/50 mt-12 pt-6 text-center">
          <p className="text-gray-300">
            © {new Date().getFullYear()} جميع الحقوق محفوظة لشركة العمدة ستار
          </p>
          {/* شارة المطور */}
          <div className="mt-4">
            <div className="inline-flex items-center space-x-2 space-x-reverse bg-gray-800/50 backdrop-blur-sm px-3 py-1 rounded-full border border-amber-500/20">
              <span className="text-amber-400 text-xs">تصميم وتطوير</span>
              <a 
                href="https://wa.me/967782478767" 
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1 space-x-reverse group"
              >
                <span className="text-white text-sm font-medium group-hover:text-amber-400 transition-colors">رامز طلال</span>
                <FaCode className="text-amber-400 w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

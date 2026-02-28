import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import "../css/HeroSlider.css";

// Import all hero images using the exact filenames
import heroImage696cf7a7eaa50_1768748967 from "../assets/696cf7a7eaa50_1768748967.jpg";
import heroImage696cf7a3680c9_1768748963 from "../assets/696cf7a3680c9_1768748963.jpg";
import heroImage696cf7b20a1bb_1768748978 from "../assets/696cf7b20a1bb_1768748978.jpg";
import heroImage696cf7c95ecbc_1768749001 from "../assets/696cf7c95ecbc_1768749001.jpg";
import heroImage696cf7d320be4_1768749011 from "../assets/696cf7d320be4_1768749011.jpg";
import heroImage696cf7da13153_1768749018 from "../assets/696cf7da13153_1768749018.jpg";
import heroImage696cf7e008862_1768749024 from "../assets/696cf7e008862_1768749024.jpg";
import heroImage696cf7ea2e65f_1768749034 from "../assets/696cf7ea2e65f_1768749034.jpg";
import heroImage696cf7f1b3853_1768749041 from "../assets/696cf7f1b3853_1768749041.jpg";
import heroImage696cf7f94140a_1768749049 from "../assets/696cf7f94140a_1768749049.jpg";
import heroImage696cf8a488bca_1768749220 from "../assets/696cf8a488bca_1768749220.jpg";
import heroImage696cf8ac5ad8e_1768749228 from "../assets/696cf8ac5ad8e_1768749228.jpg";
import heroImage696cf8b296943_1768749234 from "../assets/696cf8b296943_1768749234.jpg";
import heroImage696cf8bd16752_1768749245 from "../assets/696cf8bd16752_1768749245.jpg";
import heroImage696cf8c56251f_1768749253 from "../assets/696cf8c56251f_1768749253.jpg";
import heroImage696cf8cd77384_1768749261 from "../assets/696cf8cd77384_1768749261.jpg";
import heroImage696cf8d5d03f1_1768749269 from "../assets/696cf8d5d03f1_1768749269.jpg";
import heroImage696cf73ad5160_1768748858 from "../assets/696cf73ad5160_1768748858.jpg";
import heroImage696cf74a81690_1768748874 from "../assets/696cf74a81690_1768748874.jpg";
import heroImage696cf75a19f3f_1768748890 from "../assets/696cf75a19f3f_1768748890.jpg";
import heroImage696cf79a35632_1768748954 from "../assets/696cf79a35632_1768748954.jpg";
import heroImage696cf80c84433_1768749068 from "../assets/696cf80c84433_1768749068.jpg";
import heroImage696cf83e2bf2b_1768749118 from "../assets/696cf83e2bf2b_1768749118.jpg";
import heroImage696cf84d1c384_1768749133 from "../assets/696cf84d1c384_1768749133.jpg";
import heroImage696cf85bf33ae_1768749147 from "../assets/696cf85bf33ae_1768749147.jpg";
import heroImage696cf87b8ed51_1768749179 from "../assets/696cf87b8ed51_1768749179.jpg";
import heroImage696cf89fe99ad_1768749215 from "../assets/696cf89fe99ad_1768749215.jpg";
import heroImage696cf769cf28c_1768748905 from "../assets/696cf769cf28c_1768748905.jpg";
import heroImage696cf771d3206_1768748913 from "../assets/696cf771d3206_1768748913.jpg";
import heroImage696cf787c213f_1768748935 from "../assets/696cf787c213f_1768748935.jpg";
import heroImage696cf800dd463_1768749056 from "../assets/696cf800dd463_1768749056.jpg";
import heroImage696cf837ef1c1_1768749111 from "../assets/696cf837ef1c1_1768749111.jpg";
import heroImage696cf882b78a2_1768749186 from "../assets/696cf882b78a2_1768749186.jpg";
import heroImage696cf7434e76c_1768748867 from "../assets/696cf7434e76c_1768748867.jpg";
import heroImage696cf7773c188_1768748919 from "../assets/696cf7773c188_1768748919.jpg";
import heroImage696cf8125f5b5_1768749074 from "../assets/696cf8125f5b5_1768749074.jpg";
import heroImage696cf8534cd92_1768749139 from "../assets/696cf8534cd92_1768749139.jpg";
import heroImage696cf8691af55_1768749161 from "../assets/696cf8691af55_1768749161.jpg";
import heroImage696cf8758ce77_1768749173 from "../assets/696cf8758ce77_1768749173.jpg";
import heroImage696cf8984e6cb_1768749208 from "../assets/696cf8984e6cb_1768749208.jpg";
import heroImage696cf88989c75_1768749193 from "../assets/696cf88989c75_1768749193.jpg";
import heroImage696cf780511fd_1768748928 from "../assets/696cf780511fd_1768748928.jpg";
import heroImage696cf791888e7_1768748945 from "../assets/696cf791888e7_1768748945.jpg";
import heroImage696cf861903e4_1768749153 from "../assets/696cf861903e4_1768749153.jpg";
import heroImage696cf870350d3_1768749168 from "../assets/696cf870350d3_1768749168.jpg";
import heroImage696cf8470344c_1768749127 from "../assets/696cf8470344c_1768749127.jpg";
import heroImage696cf75158384_1768748881 from "../assets/696cf75158384_1768748881.jpg";
import heroImage696cf89027138_1768749200 from "../assets/696cf89027138_1768749200.jpg";

const slides = [
  { id: "696cf7a7eaa50_1768748967", image: heroImage696cf7a7eaa50_1768748967, alt: "سيف الزرق - للمحقق الدين عثمان عابد" },
  { id: "696cf7a3680c9_1768748963", image: heroImage696cf7a3680c9_1768748963, alt: "روح زهرة اليانسي - رفعه العجاني" },
  { id: "696cf7b20a1bb_1768748978", image: heroImage696cf7b20a1bb_1768748978, alt: "د. أسماء عبدالرحمن - المفردات" },
  { id: "696cf7c95ecbc_1768749001", image: heroImage696cf7c95ecbc_1768749001, alt: "د. حنان الشين - سيروش" },
  { id: "696cf7d320be4_1768749011", image: heroImage696cf7d320be4_1768749011, alt: "أكرهك لا تشركني - جيرولد ج. كريسمان" },
  { id: "696cf7da13153_1768749018", image: heroImage696cf7da13153_1768749018, alt: "أحمد آل محمد - رواية" },
  { id: "696cf7e008862_1768749024", image: heroImage696cf7e008862_1768749024, alt: "المريضة الضامنة - ألكس مايكاليديس" },
  { id: "696cf7ea2e65f_1768749034", image: heroImage696cf7ea2e65f_1768749034, alt: "سمت الحمالن - توماس هاريس" },
  { id: "696cf7f1b3853_1768749041", image: heroImage696cf7f1b3853_1768749041, alt: "أنفصال - مسعود حكيم" },
  { id: "696cf7f94140a_1768749049", image: heroImage696cf7f94140a_1768749049, alt: "ذكر شرقي منقرض - د. محمد طه" },
  { id: "696cf8a488bca_1768749220", image: heroImage696cf8a488bca_1768749220, alt: "1984 - جورج أورويل" },
  { id: "696cf8ac5ad8e_1768749228", image: heroImage696cf8ac5ad8e_1768749228, alt: "إيمان الناضفي - أحمد" },
  { id: "696cf8b296943_1768749234", image: heroImage696cf8b296943_1768749234, alt: "ويلد الضباب - براندون ساندرسون" },
  { id: "696cf8bd16752_1768749245", image: heroImage696cf8bd16752_1768749245, alt: "خولة حمدي - رواية" },
  { id: "696cf8c56251f_1768749253", image: heroImage696cf8c56251f_1768749253, alt: "شاتير - طاهرة مافي" },
  { id: "696cf8cd77384_1768749261", image: heroImage696cf8cd77384_1768749261, alt: "مخطوطات ابن اسحاق" },
  { id: "696cf8d5d03f1_1768749269", image: heroImage696cf8d5d03f1_1768749269, alt: "أبو مهدي - فوز محمد باقر" },
  { id: "696cf73ad5160_1768748858", image: heroImage696cf73ad5160_1768748858, alt: "خُتة للذبذبة - Agustina Bazterrica" },
  { id: "696cf74a81690_1768748874", image: heroImage696cf74a81690_1768748874, alt: "جسمك يتذكر كل شيء - د. بيسيل فان دير كوكك" },
  { id: "696cf75a19f3f_1768748890", image: heroImage696cf75a19f3f_1768748890, alt: "أوراق شمعون المحرم - إسامة عبدالرؤوف الشاذلي" },
  { id: "696cf79a35632_1768748954", image: heroImage696cf79a35632_1768748954, alt: "فيكتور هوجو - ترجمة: بستت عادل فؤاد" },
  { id: "696cf80c84433_1768749068", image: heroImage696cf80c84433_1768749068, alt: "DEFY ME - طاهرة مافي" },
  { id: "696cf83e2bf2b_1768749118", image: heroImage696cf83e2bf2b_1768749118, alt: "مطرقة السحارات - MALLEUS MALEFICARUM" },
  { id: "696cf84d1c384_1768749133", image: heroImage696cf84d1c384_1768749133, alt: "36 - حسن الجندي" },
  { id: "696cf85bf33ae_1768749147", image: heroImage696cf85bf33ae_1768749147, alt: "أذكار الموت 13 - حسن الجندي" },
  { id: "696cf87b8ed51_1768749179", image: heroImage696cf87b8ed51_1768749179, alt: "أطيب 4 - ميرنا المهدي" },
  { id: "696cf89fe99ad_1768749215", image: heroImage696cf89fe99ad_1768749215, alt: "الملاحوس - د. أحمد خضر" },
  { id: "696cf769cf28c_1768748905", image: heroImage696cf769cf28c_1768748905, alt: "عالم القدس - DISCWORLD" },
  { id: "696cf771d3206_1768748913", image: heroImage696cf771d3206_1768748913, alt: "الكتاب الذهبي - فلسفة ببري" },
  { id: "696cf787c213f_1768748935", image: heroImage696cf787c213f_1768748935, alt: "طائفة الشعبية - عثمان عابد" },
  { id: "696cf800dd463_1768749056", image: heroImage696cf800dd463_1768749056, alt: "Regretting You - كولين هوفر" },
  { id: "696cf837ef1c1_1768749111", image: heroImage696cf837ef1c1_1768749111, alt: "الطبع 42 - حسن الجندي" },
  { id: "696cf882b78a2_1768749186", image: heroImage696cf882b78a2_1768749186, alt: "التربية الإيجابية - JANE NELSEN" },
  { id: "696cf7434e76c_1768748867", image: heroImage696cf7434e76c_1768748867, alt: "الزخارف - محمد الجيزاوي" },
  { id: "696cf7773c188_1768748919", image: heroImage696cf7773c188_1768748919, alt: "بيت الخناس - معنى بن هلال الهنائي" },
  { id: "696cf8125f5b5_1768749074", image: heroImage696cf8125f5b5_1768749074, alt: "اللہم وہاں جھوڑے" },
  { id: "696cf8534cd92_1768749139", image: heroImage696cf8534cd92_1768749139, alt: "أذكار الموت 13 - حسن الجندي" },
  { id: "696cf8691af55_1768749161", image: heroImage696cf8691af55_1768749161, alt: "الخبرية - أمير كامو" },
  { id: "696cf8758ce77_1768749173", image: heroImage696cf8758ce77_1768749173, alt: "عزازيل - يوسف زيدان" },
  { id: "696cf8984e6cb_1768749208", image: heroImage696cf8984e6cb_1768749208, alt: "واقد مدينه - رفعان بن حسن" },
  { id: "696cf88989c75_1768749193", image: heroImage696cf88989c75_1768749193, alt: "الزخارف - محمد الجيزاوي" },
  { id: "696cf780511fd_1768748928", image: heroImage696cf780511fd_1768748928, alt: "سجلات 1500 ل.م" },
  { id: "696cf791888e7_1768748945", image: heroImage696cf791888e7_1768748945, alt: "CARAVAL - STEPHANIE GARBER" },
  { id: "696cf861903e4_1768749153", image: heroImage696cf861903e4_1768749153, alt: "السياسي - أحمد خيري الغمرى" },
  { id: "696cf870350d3_1768749168", image: heroImage696cf870350d3_1768749168, alt: "الغباء العاطفي - DEAN BURNETT" },
  { id: "696cf8470344c_1768749127", image: heroImage696cf8470344c_1768749127, alt: "القرآن نسخة شخصية - أحمد خيري العمري" },
  { id: "696cf75158384_1768748881", image: heroImage696cf75158384_1768748881, alt: "THE WALKING DEAD - الغد الشام" },
  { id: "696cf89027138_1768749200", image: heroImage696cf89027138_1768749200, alt: "د. خولة حمدي - الكتاب الأول" },
];

export default function HeroSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const sliderInterval = useRef(null);

  const goToSlide = useCallback((index) => {
    setCurrentIndex(index);
  }, []);

  const goToPrevSlide = useCallback(() => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? slides.length - 1 : prevIndex - 1
    );
  }, []);

  const goToNextSlide = useCallback(() => {
    setCurrentIndex((prevIndex) => 
      prevIndex === slides.length - 1 ? 0 : prevIndex + 1
    );
  }, []);

  useEffect(() => {
    if (isAutoPlaying) {
      sliderInterval.current = setInterval(() => {
        goToNextSlide();
      }, 5000);
    }

    return () => {
      if (sliderInterval.current) {
        clearInterval(sliderInterval.current);
      }
    };
  }, [isAutoPlaying, goToNextSlide]);

  const handleMouseEnter = () => {
    setIsAutoPlaying(false);
  };

  const handleMouseLeave = () => {
    setIsAutoPlaying(true);
  };

  return (
    <section 
      className="hero-slider"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="slider-container">
        <div 
          className="slider-track"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {slides.map((slide) => (
            <div className="slide" key={slide.id}>
              <img 
                src={slide.image} 
                alt={slide.alt} 
                className="slide-image"
                loading={slides.indexOf(slide) === 0 ? "eager" : "lazy"}
              />
              <div className="slide-overlay" />
            </div>
          ))}
        </div>

        {/* Single centered button */}
        <div className="hero-content" style={{ textAlign: 'center' }}>
          <a href="#livres" className="btn-secondary">
            استعرض الكتب
          </a>
        </div>

        {/* Navigation Buttons */}
        <button className="slider-nav prev" onClick={goToPrevSlide} aria-label="Previous slide">
          <ChevronRight size={24} />
        </button>
        <button className="slider-nav next" onClick={goToNextSlide} aria-label="Next slide">
          <ChevronLeft size={24} />
        </button>

        {/* Dots Indicator */}
        <div className="slider-dots">
          {slides.map((_, index) => (
            <button
              key={index}
              className={`slider-dot ${index === currentIndex ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Header from "../components/Header";
import WhatsAppFloat from "../components/WhatsAppFloat";
import { BookOpen, Mail, Phone, MapPin, MessageCircle, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";
import "../css/Contact.css";

// Import Redux actions and selectors
import { createMessage, clearMessageError } from "../store/store";
import { selectMessagesLoading, selectMessagesError } from "../store/store";

export default function Contact() {
  const dispatch = useDispatch();
  
  // Redux state
  const loading = useSelector(selectMessagesLoading);
  const error = useSelector(selectMessagesError);
  
  // Local state for form
  const [formData, setFormData] = useState({
    nom_complet: "",
    email: "",
    message: ""
  });
  
  // Local state for form submission status
  const [submitStatus, setSubmitStatus] = useState({
    success: false,
    message: ""
  });

  // Clear error when component unmounts
  useEffect(() => {
    return () => {
      dispatch(clearMessageError());
    };
  }, [dispatch]);

  const whatsappLink = `https://wa.me/212688069942?text=${encodeURIComponent("مرحباً فانتازيا 📚، لدي سؤال:")}`;
  
  // Google Maps URLs
  const googleMapsEmbedUrl = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3323.144845585287!2d-7.620618924246!3d33.595080573324!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xda7d3731f884cb3%3A0x8c6b2e9e8b3c5f!2sCasablanca%2C%20Morocco!5e0!3m2!1sen!2sus!4v1700000000000!5m2!1sen!2sus";
  
  const googleMapsDirectionsUrl = "https://maps.app.goo.gl/4KvFJ4pueR8YJN3V7";
  
  // Function to handle map click
  const handleMapClick = () => {
    window.open(googleMapsDirectionsUrl, '_blank', 'noopener,noreferrer');
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
    // Clear submit status when user starts typing again
    if (submitStatus.success || submitStatus.message) {
      setSubmitStatus({ success: false, message: "" });
    }
    // Clear Redux error when user types
    if (error) {
      dispatch(clearMessageError());
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.nom_complet.trim() || !formData.email.trim() || !formData.message.trim()) {
      setSubmitStatus({
        success: false,
        message: "الرجاء ملء جميع الحقول"
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setSubmitStatus({
        success: false,
        message: "الرجاء إدخال بريد إلكتروني صحيح"
      });
      return;
    }

    try {
      // Dispatch createMessage action
      const result = await dispatch(createMessage(formData)).unwrap();
      
      // Check if message was sent successfully
      if (result.success || result.data) {
        setSubmitStatus({
          success: true,
          message: "تم إرسال الرسالة بنجاح! سنرد عليك في أقرب وقت."
        });
        
        // Reset form
        setFormData({
          nom_complet: "",
          email: "",
          message: ""
        });
        
        // Clear success message after 5 seconds
        setTimeout(() => {
          setSubmitStatus({ success: false, message: "" });
        }, 5000);
      }
    } catch (err) {
      // Handle error (error is already in Redux state)
      console.error("فشل إرسال الرسالة:", err);
      setSubmitStatus({
        success: false,
        message: err?.message || "حدث خطأ أثناء إرسال الرسالة"
      });
    }
  };

  return (
    <div className="contact-page">
      <Header />

      <section className="page-hero">
        <h1>اتصل بنا</h1>
        <p>نحن هنا لمساعدتك</p>
      </section>

      <section className="contact-content">
        <div className="contact-grid">
          <div className="contact-info">
            <h2>معلومات الاتصال</h2>
            <div className="info-items">
              <div className="info-item">
                <div className="info-icon">
                  <Mail />
                </div>
                <div className="info-content">
                  <p>البريد الإلكتروني</p>
                  <a href="mailto:info.fantasia.library@gmail.com">info.fantasia.library@gmail.com</a>
                </div>
              </div>

              <div className="info-item">
                <div className="info-icon">
                  <Phone />
                </div>
                <div className="info-content">
                  <p>الهاتف</p>
                  <a href="tel:+212688069942">+212 688 069 942</a>
                </div>
              </div>

              {/* Google Maps Embed - Clickable Map */}
              <div className="info-item map-embed-item">
                <div className="info-icon">
                  <MapPin />
                </div>
                <div className="info-content map-embed-content">
                  <p>موقعنا على الخريطة</p>
                  <div 
                    className="map-embed-container clickable-map"
                    onClick={handleMapClick}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleMapClick();
                      }
                    }}
                    title="انقر لفتح الموقع في خرائط جوجل"
                  >
                    <iframe
                      src={googleMapsEmbedUrl}
                      width="100%"
                      height="200"
                      style={{ border: 0, borderRadius: '8px', pointerEvents: 'none' }}
                      allowFullScreen=""
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Fantasia Book Store Location"
                    ></iframe>
                    <div className="map-overlay">
                      <ExternalLink size={24} />
                      <span>انقر لفتح في خرائط جوجل</span>
                    </div>
                  </div>
                  <a 
                    href={googleMapsDirectionsUrl}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="map-embed-link"
                  >
                    فتح في خرائط جوجل
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>

              <a 
                href={whatsappLink} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="whatsapp-item"
              >
                <MessageCircle />
                <div>
                  <p>تواصل عبر واتساب</p>
                  <p>رد سريع مضمون</p>
                </div>
              </a>
            </div>
          </div>

          <div className="contact-form-card">
            <h2>أرسل رسالة</h2>
            
            {/* Status Message */}
            {submitStatus.message && (
              <div className={`status-message ${submitStatus.success ? 'success' : 'error'}`}>
                {submitStatus.success ? (
                  <CheckCircle size={20} />
                ) : (
                  <AlertCircle size={20} />
                )}
                <span>{submitStatus.message}</span>
              </div>
            )}
            
            {/* Redux Error Message */}
            {error && !submitStatus.message && (
              <div className="status-message error">
                <AlertCircle size={20} />
                <span>{typeof error === 'string' ? error : error?.message || "حدث خطأ"}</span>
              </div>
            )}

            <form className="contact-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="nom_complet">الاسم الكامل</label>
                <input 
                  type="text" 
                  id="nom_complet"
                  name="nom_complet"
                  value={formData.nom_complet}
                  onChange={handleChange}
                  placeholder="اسمك"
                  disabled={loading}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="email">البريد الإلكتروني</label>
                <input 
                  type="email" 
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="بريدك@example.com"
                  disabled={loading}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="message">الرسالة</label>
                <textarea 
                  id="message"
                  name="message"
                  rows={5}
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="رسالتك..."
                  disabled={loading}
                  required
                />
              </div>
              
              <button 
                type="submit" 
                className={`submit-btn ${loading ? 'loading' : ''}`}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    جاري الإرسال...
                  </>
                ) : (
                  "إرسال الرسالة"
                )}
              </button>
            </form>
          </div>
        </div>
      </section>

      <WhatsAppFloat />
    </div>
  );
}
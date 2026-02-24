import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Header from "../components/Header";
import WhatsAppFloat from "../components/WhatsAppFloat";
import { BookOpen, Mail, Phone, MapPin, MessageCircle, CheckCircle, AlertCircle } from "lucide-react";
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

  const whatsappLink = `https://wa.me/212625854078?text=${encodeURIComponent("مرحباً فانتازيا 📚، لدي سؤال:")}`;
  
  // Google Maps location link
  const googleMapsLink = "https://maps.app.goo.gl/4KvFJ4pueR8YJN3V7";

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
                  <a href="mailto:contact@fantasia.fr">contact@fantasia.fr</a>
                </div>
              </div>

              <div className="info-item">
                <div className="info-icon">
                  <Phone />
                </div>
                <div className="info-content">
                  <p>الهاتف</p>
                  <a href="tel:+212625854078">+212 625 854 078</a>
                </div>
              </div>

              <div className="info-item">
                <div className="info-icon">
                  <MapPin />
                </div>
                <div className="info-content">
                  <p>العنوان</p>
                  <a 
                    href={googleMapsLink}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="location-link"
                  >
                    12 شارع الكتب، الدار البيضاء، المغرب
                    <span className="map-indicator">(عرض على الخريطة)</span>
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
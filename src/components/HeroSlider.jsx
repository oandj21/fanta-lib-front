import { useEffect, useRef } from "react";
import "../css/HeroSlider.css";

export default function HeroSlider() {
  const videoRef = useRef(null);

  useEffect(() => {
    // Ensure video plays automatically and loops
    if (videoRef.current) {
      videoRef.current.play().catch(error => {
        console.log("Video autoplay failed:", error);
      });
    }
  }, []);

  return (
    <section className="hero-slider">
      <div className="slider-container">
        {/* Video Background */}
        <video
          ref={videoRef}
          className="hero-video"
          autoPlay
          loop
          muted
          playsInline
        >
          <source src="/video.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        
        {/* Overlay */}
        <div className="video-overlay" />

        {/* Single centered button */}
        <div className="hero-conten" style={{ textAlign: 'center' }}>
          <a href="/livres" className="btn-secondar">
            عرض كل الكتب ←
          </a>
        </div>
      </div>
    </section>
  );
}
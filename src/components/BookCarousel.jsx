// BookCarousel.jsx
import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import BookCard from "./BookCard";
import "../css/BookCarousel.css";

export default function BookCarousel({ onShowDetails }) {
  const { list: books } = useSelector((state) => state.livres);
  const trackRef = useRef(null);
  const animRef = useRef(null);
  const posRef = useRef(0);
  const pausedRef = useRef(false);

  const loopedBooks = [...books, ...books, ...books];

  useEffect(() => {
    const track = trackRef.current;
    if (!track || books.length === 0) return;

    const SPEED = 0.8;

    const animate = () => {
      if (!pausedRef.current) {
        posRef.current += SPEED;
        const cardWidth = track.children[0]?.offsetWidth || 220;
        const gap = 20;
        const itemWidth = cardWidth + gap;
        
        if (posRef.current >= itemWidth * books.length) {
          posRef.current = 0;
        }
        
        track.style.transform = `translateX(-${posRef.current}px)`;
      }
      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      if (animRef.current) {
        cancelAnimationFrame(animRef.current);
      }
    };
  }, [books.length]);

  if (books.length === 0) {
    return null;
  }

  return (
    <div className="carousel-container">
      <div
        className="carousel-gradient carousel-gradient-left"
      ></div>
      <div
        className="carousel-gradient carousel-gradient-right"
      ></div>
      
      <div
        className="carousel-track-container"
        onMouseEnter={() => { pausedRef.current = true; }}
        onMouseLeave={() => { pausedRef.current = false; }}
      >
        <div ref={trackRef} className="carousel-track">
          {loopedBooks.map((book, index) => (
            <div key={`${book.id}-${index}`} className="carousel-item">
              <BookCard book={book} onShowDetails={onShowDetails} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
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
  const isHoveringRef = useRef(false);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const dragStartTimeRef = useRef(0);

  const loopedBooks = [...books, ...books, ...books];

  useEffect(() => {
    const track = trackRef.current;
    if (!track || books.length === 0) return;

    const SPEED = 0.8;

    const animate = () => {
      // Only pause if hovering OR dragging, not when modal is open
      if (!pausedRef.current && !isHoveringRef.current && !isDraggingRef.current) {
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

  // Mouse/Touch drag handlers
  const handleMouseDown = (e) => {
    e.preventDefault();
    isDraggingRef.current = true;
    startXRef.current = e.pageX - (trackRef.current?.offsetLeft || 0);
    scrollLeftRef.current = posRef.current;
    dragStartTimeRef.current = Date.now();
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current) return;
    e.preventDefault();
    
    const x = e.pageX - (trackRef.current?.offsetLeft || 0);
    const walk = (x - startXRef.current) * 1.5;
    const newPos = Math.max(0, scrollLeftRef.current - walk);
    
    posRef.current = newPos;
    if (trackRef.current) {
      trackRef.current.style.transform = `translateX(-${newPos}px)`;
    }
  };

  const handleMouseUp = (e) => {
    if (isDraggingRef.current) {
      const dragDuration = Date.now() - dragStartTimeRef.current;
      
      // If it was a quick click (less than 200ms), don't treat as drag
      if (dragDuration < 200) {
        // Let the click event propagate to BookCard
        isDraggingRef.current = false;
        return;
      }
      
      e.preventDefault();
    }
    isDraggingRef.current = false;
  };

  // Combined mouse leave handler
  const handleMouseLeave = () => {
    isHoveringRef.current = false;
    isDraggingRef.current = false;
  };

  // Touch events for mobile
  const handleTouchStart = (e) => {
    e.preventDefault();
    isDraggingRef.current = true;
    startXRef.current = e.touches[0].pageX - (trackRef.current?.offsetLeft || 0);
    scrollLeftRef.current = posRef.current;
    dragStartTimeRef.current = Date.now();
  };

  const handleTouchMove = (e) => {
    if (!isDraggingRef.current) return;
    e.preventDefault();
    
    const x = e.touches[0].pageX - (trackRef.current?.offsetLeft || 0);
    const walk = (x - startXRef.current) * 1.5;
    const newPos = Math.max(0, scrollLeftRef.current - walk);
    
    posRef.current = newPos;
    if (trackRef.current) {
      trackRef.current.style.transform = `translateX(-${newPos}px)`;
    }
  };

  const handleTouchEnd = (e) => {
    if (isDraggingRef.current) {
      const dragDuration = Date.now() - dragStartTimeRef.current;
      
      // If it was a quick tap (less than 200ms), let the click event propagate
      if (dragDuration < 200) {
        isDraggingRef.current = false;
        return;
      }
      
      e.preventDefault();
    }
    isDraggingRef.current = false;
  };

  // Handle card click - this will open the modal but won't affect auto-scroll
  const handleCardClick = (book) => {
    if (onShowDetails) {
      onShowDetails(book);
    }
  };

  if (books.length === 0) {
    return null;
  }

  return (
    <div className="carousel-container">
      <div className="carousel-gradient carousel-gradient-left"></div>
      <div className="carousel-gradient carousel-gradient-right"></div>
      
      <div
        className={`carousel-track-container ${isDraggingRef.current ? 'dragging' : ''}`}
        onMouseEnter={() => { 
          isHoveringRef.current = true; 
        }}
        onMouseLeave={handleMouseLeave}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div ref={trackRef} className="carousel-track">
          {loopedBooks.map((book, index) => (
            <div 
              key={`${book.id}-${index}`} 
              className="carousel-item"
              onClick={(e) => {
                // Only trigger if not dragging
                if (!isDraggingRef.current) {
                  handleCardClick(book);
                }
              }}
            >
              <BookCard book={book} onShowDetails={handleCardClick} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
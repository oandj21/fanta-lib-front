// BookCarousel.jsx
import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import BookCard from "./BookCard";
import "../css/BookCarousel.css";

export default function BookCarousel({ onShowDetails }) {
  const { list: books } = useSelector((state) => state.livres);
  const trackRef = useRef(null);
  const animRef = useRef(null);
  const posRef = useRef(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [dragStartTime, setDragStartTime] = useState(0);
  const containerRef = useRef(null);
  const userInteractedRef = useRef(false);
  const autoScrollTimeoutRef = useRef(null);

  const loopedBooks = [...books, ...books, ...books];

  // Auto-scroll animation
  useEffect(() => {
    const track = trackRef.current;
    if (!track || books.length === 0 || isPaused) return;

    const SPEED = 0.8;

    const animate = () => {
      if (!isPaused && !userInteractedRef.current) {
        posRef.current += SPEED;
        const cardWidth = track.children[0]?.offsetWidth || 220;
        const gap = 20;
        const itemWidth = cardWidth + gap;
        
        // Reset position when we've scrolled through one set of books
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
  }, [books.length, isPaused]);

  // Handle user interaction pause/resume
  const pauseAutoScroll = () => {
    userInteractedRef.current = true;
    
    // Clear any existing timeout
    if (autoScrollTimeoutRef.current) {
      clearTimeout(autoScrollTimeoutRef.current);
    }
    
    // Set timeout to resume auto-scroll after 3 seconds of no interaction
    autoScrollTimeoutRef.current = setTimeout(() => {
      userInteractedRef.current = false;
      autoScrollTimeoutRef.current = null;
    }, 3000);
  };

  // Mouse/Touch drag handlers
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    setStartX(e.pageX - (containerRef.current?.offsetLeft || 0));
    setScrollLeft(posRef.current);
    setDragStartTime(Date.now());
    pauseAutoScroll();
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    
    const x = e.pageX - (containerRef.current?.offsetLeft || 0);
    const walk = (x - startX) * 1.5; // Scroll speed multiplier
    const newPos = Math.max(0, scrollLeft - walk);
    
    posRef.current = newPos;
    if (trackRef.current) {
      trackRef.current.style.transform = `translateX(-${newPos}px)`;
    }
  };

  const handleMouseUp = (e) => {
    if (isDragging) {
      const dragDuration = Date.now() - dragStartTime;
      
      // If it was a quick click/tap (less than 200ms), don't treat as drag
      if (dragDuration < 200 && e.target.closest('.book-card')) {
        // Let the click event propagate to BookCard
        setIsDragging(false);
        return;
      }
      
      e.preventDefault();
    }
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
    }
  };

  // Touch events for mobile
  const handleTouchStart = (e) => {
    setIsDragging(true);
    setStartX(e.touches[0].pageX - (containerRef.current?.offsetLeft || 0));
    setScrollLeft(posRef.current);
    setDragStartTime(Date.now());
    pauseAutoScroll();
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    
    const x = e.touches[0].pageX - (containerRef.current?.offsetLeft || 0);
    const walk = (x - startX) * 1.5;
    const newPos = Math.max(0, scrollLeft - walk);
    
    posRef.current = newPos;
    if (trackRef.current) {
      trackRef.current.style.transform = `translateX(-${newPos}px)`;
    }
  };

  const handleTouchEnd = (e) => {
    if (isDragging) {
      const dragDuration = Date.now() - dragStartTime;
      
      // If it was a quick tap (less than 200ms), check if it's on a card
      if (dragDuration < 200) {
        // Let the click event propagate
        setIsDragging(false);
        return;
      }
      
      e.preventDefault();
    }
    setIsDragging(false);
  };

  // Handle card click through the carousel
  const handleCardClick = (book) => {
    if (onShowDetails) {
      onShowDetails(book);
    }
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (autoScrollTimeoutRef.current) {
        clearTimeout(autoScrollTimeoutRef.current);
      }
    };
  }, []);

  if (books.length === 0) {
    return null;
  }

  return (
    <div className="carousel-container">
      <div className="carousel-gradient carousel-gradient-left"></div>
      <div className="carousel-gradient carousel-gradient-right"></div>
      
      <div
        ref={containerRef}
        className={`carousel-track-container ${isDragging ? 'dragging' : ''}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div ref={trackRef} className="carousel-track">
          {loopedBooks.map((book, index) => (
            <div 
              key={`${book.id}-${index}`} 
              className="carousel-item"
              onClick={() => handleCardClick(book)}
            >
              <BookCard book={book} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
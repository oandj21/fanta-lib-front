// BookCarousel.jsx
import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { useSelector } from "react-redux";
import BookCard from "./BookCard";
import "../css/BookCarousel.css";

const BookCarousel = forwardRef(({ onShowDetails }, ref) => {
  const { list: books } = useSelector((state) => state.livres);
  const trackRef = useRef(null);
  const animRef = useRef(null);
  const posRef = useRef(0);
  const isHoveringRef = useRef(false);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const dragStartTimeRef = useRef(0);
  const modalOpenRef = useRef(false);
  const containerRef = useRef(null);

  const loopedBooks = [...books, ...books, ...books];

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    onModalOpen: () => {
      modalOpenRef.current = true;
      // Reset all interaction states when modal opens
      isHoveringRef.current = false;
      isDraggingRef.current = false;
    },
    onModalClose: () => {
      modalOpenRef.current = false;
      // Reset all interaction states when modal closes
      isHoveringRef.current = false;
      isDraggingRef.current = false;
    }
  }));

  useEffect(() => {
    const track = trackRef.current;
    if (!track || books.length === 0) return;

    const SPEED = 0.8;

    const animate = () => {
      // Only animate if not hovering, not dragging, and modal is not open
      if (!isHoveringRef.current && !isDraggingRef.current && !modalOpenRef.current) {
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
  }, [books.length]);

  // Mouse/Touch drag handlers
  const handleMouseDown = (e) => {
    // Don't start drag if modal is open
    if (modalOpenRef.current) return;
    
    e.preventDefault();
    isDraggingRef.current = true;
    startXRef.current = e.pageX - (containerRef.current?.offsetLeft || 0);
    scrollLeftRef.current = posRef.current;
    dragStartTimeRef.current = Date.now();
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current || modalOpenRef.current) return;
    e.preventDefault();
    
    const x = e.pageX - (containerRef.current?.offsetLeft || 0);
    const walk = (x - startXRef.current) * 1.5;
    const newPos = Math.max(0, scrollLeftRef.current - walk);
    
    posRef.current = newPos;
    if (trackRef.current) {
      trackRef.current.style.transform = `translateX(-${newPos}px)`;
    }
  };

  const handleMouseUp = (e) => {
    if (isDraggingRef.current && !modalOpenRef.current) {
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
    // Only reset if modal is not open
    if (!modalOpenRef.current) {
      isHoveringRef.current = false;
      isDraggingRef.current = false;
    }
  };

  // Touch events for mobile
  const handleTouchStart = (e) => {
    // Don't start drag if modal is open
    if (modalOpenRef.current) return;
    
    e.preventDefault();
    isDraggingRef.current = true;
    startXRef.current = e.touches[0].pageX - (containerRef.current?.offsetLeft || 0);
    scrollLeftRef.current = posRef.current;
    dragStartTimeRef.current = Date.now();
  };

  const handleTouchMove = (e) => {
    if (!isDraggingRef.current || modalOpenRef.current) return;
    e.preventDefault();
    
    const x = e.touches[0].pageX - (containerRef.current?.offsetLeft || 0);
    const walk = (x - startXRef.current) * 1.5;
    const newPos = Math.max(0, scrollLeftRef.current - walk);
    
    posRef.current = newPos;
    if (trackRef.current) {
      trackRef.current.style.transform = `translateX(-${newPos}px)`;
    }
  };

  const handleTouchEnd = (e) => {
    if (isDraggingRef.current && !modalOpenRef.current) {
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

  if (books.length === 0) {
    return null;
  }

  return (
    <div className="carousel-container">
      <div className="carousel-gradient carousel-gradient-left"></div>
      <div className="carousel-gradient carousel-gradient-right"></div>
      
      <div
        ref={containerRef}
        className={`carousel-track-container ${isDraggingRef.current ? 'dragging' : ''}`}
        onMouseEnter={() => { 
          // Only set hovering if modal is not open
          if (!modalOpenRef.current) {
            isHoveringRef.current = true; 
          }
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
                // Only trigger if not dragging and modal is not open
                if (!isDraggingRef.current && !modalOpenRef.current) {
                  onShowDetails(book);
                }
              }}
            >
              <BookCard 
                book={book} 
                onShowDetails={(book) => {
                  // This prevents the card's internal state from interfering
                  if (!isDraggingRef.current && !modalOpenRef.current) {
                    onShowDetails(book);
                  }
                }} 
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

export default BookCarousel;
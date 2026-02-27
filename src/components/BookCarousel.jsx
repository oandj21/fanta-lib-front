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
  const autoScrollEnabledRef = useRef(true);
  const clickProcessedRef = useRef(false); // Track if click has been processed

  const loopedBooks = [...books, ...books, ...books];

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    onModalOpen: () => {
      modalOpenRef.current = true;
      isHoveringRef.current = false;
      isDraggingRef.current = false;
      autoScrollEnabledRef.current = true;
    },
    onModalClose: () => {
      modalOpenRef.current = false;
      isHoveringRef.current = false;
      isDraggingRef.current = false;
      autoScrollEnabledRef.current = true;
      
      setTimeout(() => {
        isHoveringRef.current = false;
        isDraggingRef.current = false;
      }, 50);
    }
  }));

  useEffect(() => {
    const track = trackRef.current;
    if (!track || books.length === 0) return;

    const SPEED = 0.8;

    const animate = () => {
      if (autoScrollEnabledRef.current && !isHoveringRef.current && !isDraggingRef.current) {
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
    if (modalOpenRef.current) return;
    
    e.preventDefault();
    isDraggingRef.current = true;
    autoScrollEnabledRef.current = false;
    startXRef.current = e.pageX - (containerRef.current?.offsetLeft || 0);
    scrollLeftRef.current = posRef.current;
    dragStartTimeRef.current = Date.now();
    clickProcessedRef.current = false; // Reset click tracking
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
      
      if (dragDuration < 200) {
        isDraggingRef.current = false;
        autoScrollEnabledRef.current = true;
        return;
      }
      
      e.preventDefault();
    }
    isDraggingRef.current = false;
    autoScrollEnabledRef.current = true;
  };

  const handleMouseLeave = () => {
    if (!modalOpenRef.current) {
      isHoveringRef.current = false;
      isDraggingRef.current = false;
      autoScrollEnabledRef.current = true;
    }
  };

  // Touch events for mobile
  const handleTouchStart = (e) => {
    if (modalOpenRef.current) return;
    
    e.preventDefault();
    isDraggingRef.current = true;
    autoScrollEnabledRef.current = false;
    startXRef.current = e.touches[0].pageX - (containerRef.current?.offsetLeft || 0);
    scrollLeftRef.current = posRef.current;
    dragStartTimeRef.current = Date.now();
    clickProcessedRef.current = false; // Reset click tracking
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
      
      if (dragDuration < 200) {
        isDraggingRef.current = false;
        autoScrollEnabledRef.current = true;
        return;
      }
      
      e.preventDefault();
    }
    isDraggingRef.current = false;
    autoScrollEnabledRef.current = true;
  };

  const handleTouchCancel = (e) => {
    isDraggingRef.current = false;
    autoScrollEnabledRef.current = true;
  };

  // Handle card click with debounce to prevent double triggers
  const handleCardClick = (book, e) => {
    e.stopPropagation(); // Stop event from bubbling
    
    // Prevent double clicks
    if (clickProcessedRef.current) return;
    
    if (!isDraggingRef.current && !modalOpenRef.current) {
      clickProcessedRef.current = true;
      onShowDetails(book);
      
      // Reset after a short delay
      setTimeout(() => {
        clickProcessedRef.current = false;
      }, 300);
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
        ref={containerRef}
        className={`carousel-track-container ${isDraggingRef.current ? 'dragging' : ''}`}
        onMouseEnter={() => { 
          if (!modalOpenRef.current) {
            isHoveringRef.current = true; 
            autoScrollEnabledRef.current = false;
          }
        }}
        onMouseLeave={handleMouseLeave}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
      >
        <div ref={trackRef} className="carousel-track">
          {loopedBooks.map((book, index) => (
            <div 
              key={`${book.id}-${index}`} 
              className="carousel-item"
              onClick={(e) => handleCardClick(book, e)}
            >
              {/* Pass null to onShowDetails to prevent double triggers */}
              <BookCard book={book} onShowDetails={null} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

export default BookCarousel;
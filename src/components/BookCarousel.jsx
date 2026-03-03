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
  const clickProcessedRef = useRef(false);

  const loopedBooks = [...books, ...books, ...books];

  useImperativeHandle(ref, () => ({
    onModalOpen: () => {
      modalOpenRef.current = true;
      isHoveringRef.current = false;
      isDraggingRef.current = false;
      autoScrollEnabledRef.current = false; // Stop auto-scroll when modal opens
    },
    onModalClose: () => {
      modalOpenRef.current = false;
      isHoveringRef.current = false;
      isDraggingRef.current = false;
      autoScrollEnabledRef.current = true; // Resume auto-scroll when modal closes
      
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
      // Only animate if auto-scroll is enabled AND not hovering AND not dragging AND modal is closed
      if (autoScrollEnabledRef.current && !isHoveringRef.current && !isDraggingRef.current && !modalOpenRef.current) {
        posRef.current += SPEED;
        const cardWidth = track.children[0]?.offsetWidth || 220;
        const gap = 20;
        const itemWidth = cardWidth + gap;
        
        // Smooth infinite loop
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
  const handleDragStart = (clientX) => {
    if (modalOpenRef.current) return;
    
    // Prevent default to avoid text selection
    if (clientX instanceof MouseEvent) {
      clientX.preventDefault();
    }
    
    isDraggingRef.current = true;
    autoScrollEnabledRef.current = false; // Immediately stop auto-scroll
    
    // Get the starting position
    const containerRect = containerRef.current?.getBoundingClientRect();
    const containerLeft = containerRect?.left || 0;
    
    startXRef.current = clientX - containerLeft;
    scrollLeftRef.current = posRef.current;
    dragStartTimeRef.current = Date.now();
    clickProcessedRef.current = false;
  };

  const handleDragMove = (clientX) => {
    if (!isDraggingRef.current || modalOpenRef.current) return;
    
    // Prevent default to avoid text selection
    if (clientX instanceof MouseEvent) {
      clientX.preventDefault();
    }
    
    const containerRect = containerRef.current?.getBoundingClientRect();
    const containerLeft = containerRect?.left || 0;
    
    const x = clientX - containerLeft;
    const walk = (x - startXRef.current) * 1.5;
    let newPos = scrollLeftRef.current - walk;
    
    // Clamp position to prevent going out of bounds
    const track = trackRef.current;
    if (track) {
      const cardWidth = track.children[0]?.offsetWidth || 220;
      const gap = 20;
      const itemWidth = cardWidth + gap;
      const maxPos = itemWidth * books.length;
      
      // Allow some resistance at edges but still allow movement
      if (newPos < -50) {
        newPos = -50;
      } else if (newPos > maxPos + 50) {
        newPos = maxPos + 50;
      }
    }
    
    posRef.current = Math.max(0, newPos);
    trackRef.current.style.transform = `translateX(-${posRef.current}px)`;
  };

  const handleDragEnd = () => {
    if (isDraggingRef.current) {
      const dragDuration = Date.now() - dragStartTimeRef.current;
      
      // Reset position if dragged out of bounds
      const track = trackRef.current;
      if (track) {
        const cardWidth = track.children[0]?.offsetWidth || 220;
        const gap = 20;
        const itemWidth = cardWidth + gap;
        const maxPos = itemWidth * books.length;
        
        // Smoothly return to valid position if out of bounds
        if (posRef.current < 0) {
          posRef.current = 0;
          track.style.transform = `translateX(0px)`;
        } else if (posRef.current > maxPos) {
          posRef.current = maxPos;
          track.style.transform = `translateX(-${maxPos}px)`;
        }
      }
      
      // If it was a quick tap (< 150ms), it's probably a click
      if (dragDuration < 150) {
        // Don't reset anything, just end dragging
      }
    }
    
    isDraggingRef.current = false;
    // Only resume auto-scroll if not hovering and modal is closed
    if (!isHoveringRef.current && !modalOpenRef.current) {
      autoScrollEnabledRef.current = true;
    }
  };

  // Mouse events
  const handleMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleDragStart(e.pageX);
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    handleDragMove(e.pageX);
  };

  const handleMouseUp = (e) => {
    if (isDraggingRef.current) {
      e.preventDefault();
      e.stopPropagation();
    }
    handleDragEnd();
  };

  const handleMouseLeave = () => {
    if (isDraggingRef.current) {
      handleDragEnd();
    }
    
    isHoveringRef.current = false;
    // Only resume auto-scroll if not dragging and modal is closed
    if (!isDraggingRef.current && !modalOpenRef.current) {
      autoScrollEnabledRef.current = true;
    }
  };

  // Touch events
  const handleTouchStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleDragStart(e.touches[0].pageX);
  };

  const handleTouchMove = (e) => {
    if (!isDraggingRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    handleDragMove(e.touches[0].pageX);
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleDragEnd();
  };

  const handleTouchCancel = (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleDragEnd();
  };

  // Handle card click
  const handleCardClick = (book, e) => {
    e.stopPropagation();
    
    if (clickProcessedRef.current) return;
    
    const dragDuration = Date.now() - dragStartTimeRef.current;
    
    // Only open modal if it wasn't a drag (short duration and no significant movement)
    if (!isDraggingRef.current && dragDuration < 200 && !modalOpenRef.current) {
      clickProcessedRef.current = true;
      onShowDetails(book);
      
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
            autoScrollEnabledRef.current = false; // Stop auto-scroll on hover
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
              className="carousel-item carousel-book-card"
              onClick={(e) => handleCardClick(book, e)}
              onMouseDown={(e) => e.stopPropagation()} // Prevent card from interfering with drag
            >
              <BookCard book={book} onShowDetails={onShowDetails} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

export default BookCarousel;
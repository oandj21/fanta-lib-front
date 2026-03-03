// BookCarousel.jsx
import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { useSelector } from "react-redux";
import BookCard from "./BookCard";
import "../css/BookCarousel.css";

const BookCarousel = forwardRef(({ onShowDetails }, ref) => {
  const { list: books } = useSelector((state) => state.livres);

  const trackRef = useRef(null);
  const containerRef = useRef(null);
  const animRef = useRef(null);

  const posRef = useRef(0);
  const isDraggingRef = useRef(false);
  const isHoveringRef = useRef(false);
  const autoScrollRef = useRef(true);
  const modalOpenRef = useRef(false);

  const startXRef = useRef(0);
  const scrollStartRef = useRef(0);

  const itemWidthRef = useRef(0);

  const loopedBooks = [...books, ...books, ...books];

  useImperativeHandle(ref, () => ({
    onModalOpen: () => {
      modalOpenRef.current = true;
      autoScrollRef.current = false;
    },
    onModalClose: () => {
      modalOpenRef.current = false;
      autoScrollRef.current = true;
    }
  }));

  // Measure card width once
  useEffect(() => {
    const track = trackRef.current;
    if (!track || books.length === 0) return;

    const cardWidth = track.children[0]?.offsetWidth || 220;
    const gap = 20;

    itemWidthRef.current = cardWidth + gap;
  }, [books.length]);

  // Auto scroll animation
  useEffect(() => {
    if (books.length === 0) return;

    const SPEED = 0.7;

    const animate = () => {
      if (
        autoScrollRef.current &&
        !isDraggingRef.current &&
        !isHoveringRef.current &&
        !modalOpenRef.current
      ) {
        posRef.current += SPEED;

        const maxScroll = itemWidthRef.current * books.length;

        if (posRef.current >= maxScroll) {
          posRef.current = 0;
        }

        trackRef.current.style.transform = `translate3d(-${posRef.current}px, 0, 0)`;
      }

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animRef.current);
  }, [books.length]);

  // Drag logic
  const startDrag = (clientX) => {
    if (modalOpenRef.current) return;

    isDraggingRef.current = true;
    autoScrollRef.current = false;

    startXRef.current = clientX;
    scrollStartRef.current = posRef.current;
  };

  const onDrag = (clientX) => {
    if (!isDraggingRef.current) return;

    const walk = (clientX - startXRef.current) * 1.5;
    posRef.current = scrollStartRef.current - walk;

    trackRef.current.style.transform = `translate3d(-${posRef.current}px, 0, 0)`;
  };

  const endDrag = () => {
    isDraggingRef.current = false;

    if (!modalOpenRef.current && !isHoveringRef.current) {
      autoScrollRef.current = true;
    }
  };

  // Mouse
  const handleMouseDown = (e) => {
    e.preventDefault();
    startDrag(e.pageX);
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current) return;
    onDrag(e.pageX);
  };

  const handleMouseUp = () => endDrag();

  // Touch (non-passive)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const touchStart = (e) => {
      startDrag(e.touches[0].pageX);
    };

    const touchMove = (e) => {
      if (!isDraggingRef.current) return;
      e.preventDefault();
      onDrag(e.touches[0].pageX);
    };

    const touchEnd = () => endDrag();

    container.addEventListener("touchstart", touchStart, { passive: false });
    container.addEventListener("touchmove", touchMove, { passive: false });
    container.addEventListener("touchend", touchEnd);

    return () => {
      container.removeEventListener("touchstart", touchStart);
      container.removeEventListener("touchmove", touchMove);
      container.removeEventListener("touchend", touchEnd);
    };
  }, []);

  if (books.length === 0) return null;

  return (
    <div className="carousel-container">
      <div className="carousel-gradient carousel-gradient-left"></div>
      <div className="carousel-gradient carousel-gradient-right"></div>

      <div
        ref={containerRef}
        className="carousel-track-container"
        onMouseEnter={() => (isHoveringRef.current = true)}
        onMouseLeave={() => {
          isHoveringRef.current = false;
          if (!modalOpenRef.current) autoScrollRef.current = true;
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <div ref={trackRef} className="carousel-track">
          {loopedBooks.map((book, index) => (
            <div
              key={`${book.id}-${index}`}
              className="carousel-item"
              onClick={() => onShowDetails(book)}
            >
              <BookCard book={book} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

export default BookCarousel;

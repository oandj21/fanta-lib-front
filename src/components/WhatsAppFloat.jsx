import { useCart } from "../context/CartContext";
import "../css/WhatsAppFloat.css";

const WHATSAPP_NUMBER = "212625854078";

export default function WhatsAppFloat() {
  const { totalCount, getWhatsAppMessage } = useCart();

  const handleClick = () => {
    const message = encodeURIComponent(getWhatsAppMessage());
    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`,
      "_blank"
    );
  };

  return (
    <button
      onClick={handleClick}
      className="whatsapp-float"
      aria-label="Commander via WhatsApp"
    >
      <svg
        viewBox="0 0 24 24"
        width="30"
        height="30"
        className="whatsapp-icon"
      >
        <path d="M12.004 2.004C6.486 2.004 2 6.49 2 12.008c0 1.76.46 3.416 1.334 4.87L2.59 21.41l4.675-1.165c1.38.752 2.94 1.167 4.74 1.167 5.517 0 10.004-4.486 10.004-10.004S17.52 2.004 12.004 2.004zm0 18.338c-1.49 0-2.94-.39-4.215-1.123l-.302-.177-3.18.792.8-3.094-.187-.32a8.28 8.28 0 0 1-1.26-4.51c0-4.578 3.726-8.304 8.304-8.304s8.304 3.726 8.304 8.304-3.726 8.304-8.304 8.304z"/>
      </svg>

      {totalCount > 0 && (
        <span className="whatsapp-badge">{totalCount}</span>
      )}
    </button>
  );
}

"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";

const SCRIM_GRADIENTS = {
  normal: "linear-gradient(90deg, rgba(11,37,69,0.96) 0%, rgba(11,37,69,0.82) 45%, rgba(11,37,69,0.25) 75%, transparent 100%)",
  strong: "linear-gradient(90deg, rgba(11,37,69,0.98) 0%, rgba(11,37,69,0.88) 45%, rgba(11,37,69,0.3) 75%, transparent 100%)",
  light: "linear-gradient(90deg, rgba(11,37,69,0.92) 0%, rgba(11,37,69,0.65) 35%, rgba(11,37,69,0.05) 65%, transparent 100%)"
} as const;

export const carouselSlides = [
  {
    id: 1,
    title: "Sağlığın için doğru adres.",
    subtitle: "Doktor, kurum ve sağlık hizmetlerini tek yerde keşfet.",
    desktopImage: "/assets/services/hero-01-desktop.png",
    mobileImage: "/assets/services/hero-01-mobile.png",
    alt: "Sağlık Hizmetleri",
    href: "/organizations",
    mobileArt: {
      textTop: "38%",
      textWidth: "44%",
      imagePosition: "center 25%",
      scrimStrength: "normal" as keyof typeof SCRIM_GRADIENTS
    }
  },
  {
    id: 2,
    title: "Uzmanını kolayca bul.",
    subtitle: "İhtiyacına uygun doktor ve klinikleri keşfet.",
    desktopImage: "/assets/services/hero-02-desktop.png",
    mobileImage: "/assets/services/hero-02-mobile.png",
    alt: "Uzman Doktor Keşfi",
    href: "/doctors",
    mobileArt: {
      textTop: "38%",
      textWidth: "43%",
      imagePosition: "center 25%",
      scrimStrength: "normal" as keyof typeof SCRIM_GRADIENTS
    }
  },
  {
    id: 3,
    title: "Sigortana uygun seçenekleri keşfet.",
    subtitle: "Sana uygun sağlık kurumlarına daha kolay ulaş.",
    desktopImage: "/assets/services/hero-03-desktop.png",
    mobileImage: "/assets/services/hero-03-mobile.png",
    alt: "Sağlık Sigortası",
    href: "/insurance",
    mobileArt: {
      textTop: "35%",
      textWidth: "41%",
      imagePosition: "70% 35%",
      scrimStrength: "strong" as keyof typeof SCRIM_GRADIENTS
    }
  },
  {
    id: 4,
    title: "Sağlık yolculuğunu kolaylaştır.",
    subtitle: "Sağlık turizmi seçeneklerini tek yerde keşfet.",
    desktopImage: "/assets/services/hero-04-desktop.png",
    mobileImage: "/assets/services/hero-04-mobile.png",
    alt: "Sağlık Turizmi",
    href: "/health-tourism",
    mobileArt: {
      textTop: "38%",
      textWidth: "50%",
      imagePosition: "center 60%",
      scrimStrength: "light" as keyof typeof SCRIM_GRADIENTS
    }
  },
  {
    id: 5,
    title: "Luma’ya anlat, doğru hizmeti bul.",
    subtitle: "İhtiyacını doğal şekilde anlat, uygun hizmetlere yönel.",
    desktopImage: "/assets/services/hero-05-desktop.png",
    mobileImage: "/assets/services/hero-05-mobile.png",
    alt: "Yapay Zeka Sağlık Asistanı",
    href: "/ai",
    mobileArt: {
      textTop: "35%",
      textWidth: "42%",
      imagePosition: "60% 35%",
      scrimStrength: "strong" as keyof typeof SCRIM_GRADIENTS
    }
  },
];

const AUTOPLAY_INTERVAL = 4000;
const TRANSITION_DURATION = 600;

export default function CampaignCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  
  const carouselRef = useRef<HTMLDivElement>(null);
  const autoplayRef = useRef<NodeJS.Timeout | null>(null);
  const prefersReducedMotion = useRef<boolean>(false);

  useEffect(() => {
    prefersReducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === carouselSlides.length - 1 ? 0 : prev + 1));
  }, []);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? carouselSlides.length - 1 : prev - 1));
  }, []);

  useEffect(() => {
    if (isPaused || isDragging || prefersReducedMotion.current) {
      if (autoplayRef.current) clearInterval(autoplayRef.current);
      return;
    }

    autoplayRef.current = setInterval(goToNext, AUTOPLAY_INTERVAL);
    return () => {
      if (autoplayRef.current) clearInterval(autoplayRef.current);
    };
  }, [goToNext, isPaused, isDragging]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsPaused(true);
      } else {
        setIsPaused(false);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      goToPrev();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      goToNext();
    }
  };

  const handleDragStart = (clientX: number) => {
    setIsDragging(true);
    setDragStartX(clientX);
    setDragOffset(0);
    setIsPaused(true);
  };

  const handleDragMove = (clientX: number) => {
    if (!isDragging) return;
    const offset = clientX - dragStartX;
    setDragOffset(offset);
  };

  const handleDragEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    setIsPaused(false);
    
    if (dragOffset > 50) {
      goToPrev();
    } else if (dragOffset < -50) {
      goToNext();
    }
    setDragOffset(0);
  };

  return (
    <section 
      className="superapp-campaign-section"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      aria-label="Öne Çıkan Kampanyalar ve Hizmetler"
      aria-roledescription="carousel"
    >
      <div 
        className="superapp-campaign-slider" 
        ref={carouselRef}
        onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
        onTouchMove={(e) => handleDragMove(e.touches[0].clientX)}
        onTouchEnd={handleDragEnd}
        onMouseDown={(e) => handleDragStart(e.clientX)}
        onMouseMove={(e) => handleDragMove(e.clientX)}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
      >
        <div 
          className="carousel-track"
          style={{
            display: "flex",
            height: "100%",
            width: `${carouselSlides.length * 100}%`,
            transform: `translateX(calc(-${(currentIndex * 100) / carouselSlides.length}% + ${dragOffset}px))`,
            transition: isDragging ? "none" : `transform ${TRANSITION_DURATION}ms cubic-bezier(0.25, 1, 0.5, 1)`,
          }}
        >
          {carouselSlides.map((slide, index) => {
            const isNear = Math.abs(currentIndex - index) <= 1 || (currentIndex === 0 && index === carouselSlides.length - 1) || (currentIndex === carouselSlides.length - 1 && index === 0);
            
            return (
              <div 
                key={slide.id} 
                className="carousel-slide" 
                aria-hidden={currentIndex !== index}
                role="group"
                aria-roledescription="slide"
                style={{ 
                  width: `${100 / carouselSlides.length}%`,
                  "--mobile-text-top": slide.mobileArt.textTop,
                  "--mobile-text-width": slide.mobileArt.textWidth,
                  "--mobile-image-pos": slide.mobileArt.imagePosition,
                  "--mobile-scrim": SCRIM_GRADIENTS[slide.mobileArt.scrimStrength]
                } as React.CSSProperties}
              >
                {slide.href ? (
                  <Link href={slide.href} className="slide-content-wrapper" tabIndex={currentIndex === index ? 0 : -1}>
                    <SlideContent slide={slide} isNear={isNear} />
                  </Link>
                ) : (
                  <div className="slide-content-wrapper">
                    <SlideContent slide={slide} isNear={isNear} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button 
          className="carousel-control prev-control" 
          onClick={(e) => { e.stopPropagation(); goToPrev(); }}
          aria-label="Önceki Slayt"
          tabIndex={-1}
        >
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button 
          className="carousel-control next-control" 
          onClick={(e) => { e.stopPropagation(); goToNext(); }}
          aria-label="Sonraki Slayt"
          tabIndex={-1}
        >
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <div className="campaign-dots" role="tablist">
          {carouselSlides.map((_, index) => (
            <button
              key={index}
              role="tab"
              aria-selected={currentIndex === index}
              aria-label={`Slayt ${index + 1}`}
              className={`dot ${currentIndex === index ? "active" : ""}`}
              onClick={(e) => { e.stopPropagation(); goToSlide(index); }}
              tabIndex={-1}
            />
          ))}
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .superapp-campaign-section {
          outline: none;
        }
        .superapp-campaign-section:focus-visible .superapp-campaign-slider {
          box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.5);
        }
        .superapp-campaign-slider {
          height: 400px;
          border-radius: 24px;
          overflow: hidden;
          position: relative;
          background: #0b2545;
          margin: 0 auto;
          max-width: 1280px;
          width: calc(100% - 48px);
          max-width: calc(1360px - 48px);
        }
        @media (min-width: 1600px) {
          .superapp-campaign-slider {
            max-width: calc(1400px - 48px);
          }
        }
        .carousel-slide {
          height: 100%;
          position: relative;
          overflow: hidden;
        }
        .slide-content-wrapper {
          display: block;
          height: 100%;
          width: 100%;
          text-decoration: none;
          color: white;
          position: relative;
        }
        .slide-content-wrapper:focus-visible {
          outline: none;
        }
        .campaign-visual {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          z-index: 1;
        }
        .campaign-visual img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          transition: transform 6s ease-out;
        }
        .carousel-slide[aria-hidden="false"] .campaign-visual img {
          transform: scale(1.02);
        }
        .carousel-slide[aria-hidden="true"] .campaign-visual img {
          transform: scale(1);
        }
        .campaign-visual::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 120px;
          background: linear-gradient(to right, #0b2545 0%, transparent 100%);
          z-index: 2;
        }
        .campaign-content {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          left: 5%;
          width: 40%;
          z-index: 3;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .campaign-content h1 {
          font-size: clamp(34px, 4vw, 44px);
          font-weight: 850;
          line-height: 1.1;
          margin: 0 0 12px 0;
          letter-spacing: -0.5px;
          color: white;
          text-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .campaign-content p {
          font-size: clamp(14px, 1.5vw, 17px);
          opacity: 0.95;
          margin: 0;
          line-height: 1.4;
          color: #f8fafc;
        }
        
        .carousel-control {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 48px;
          height: 48px;
          border-radius: 24px;
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(8px);
          border: none;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 10;
          opacity: 0;
          transition: all 0.2s ease;
        }
        .superapp-campaign-slider:hover .carousel-control {
          opacity: 1;
        }
        .carousel-control:hover {
          background: rgba(255, 255, 255, 0.3);
        }
        .prev-control {
          left: 16px;
        }
        .next-control {
          right: 16px;
        }

        .campaign-dots {
          position: absolute;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 10;
          display: flex;
          gap: 8px;
        }
        .campaign-dots .dot {
          width: 6px;
          height: 6px;
          border-radius: 3px;
          background: rgba(255, 255, 255, 0.4);
          border: none;
          padding: 0;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .campaign-dots .dot.active {
          width: 20px;
          background: white;
        }

        @media (max-width: 768px) {
          .superapp-campaign-section {
            margin-bottom: 12px;
          }
          .superapp-campaign-slider {
            width: 100%;
            height: clamp(290px, 42vh, 360px);
            min-height: auto;
            border-radius: 0;
          }
          .carousel-control {
            display: none !important;
          }
          
          /* Disable desktop gradient on mobile */
          .campaign-visual::before {
            display: none;
          }
          
          /* Apply dynamic mobile scrim */
          .campaign-visual::after {
            content: '';
            position: absolute;
            inset: 0;
            background: var(--mobile-scrim);
            z-index: 2;
            pointer-events: none;
          }
          
          .campaign-visual img {
            object-position: var(--mobile-image-pos);
          }
          
          .campaign-content {
            top: var(--mobile-text-top);
            left: 18px;
            width: var(--mobile-text-width);
            z-index: 3;
          }
          .campaign-content h1 {
            font-size: clamp(25px, 7vw, 30px);
            line-height: 1.05;
            text-shadow: 0 1px 2px rgba(0,0,0,0.15);
          }
          .campaign-content p {
            font-size: 13.5px;
            line-height: 1.4;
            color: rgba(255,255,255,0.92);
            text-shadow: 0 1px 2px rgba(0,0,0,0.15);
            margin-top: 6px;
          }
          .campaign-dots {
            bottom: 14px;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .carousel-slide[aria-hidden="false"] .campaign-visual img {
            transform: none !important;
          }
        }
      `}} />
    </section>
  );
}

function SlideContent({ slide, isNear }: { slide: typeof carouselSlides[0], isNear: boolean }) {
  return (
    <>
      <div className="campaign-visual">
        <picture>
          <source media="(max-width: 768px)" srcSet={slide.mobileImage} />
          <source media="(min-width: 769px)" srcSet={slide.desktopImage} />
          <img 
            src={slide.desktopImage} 
            alt={slide.alt} 
            loading={isNear ? "eager" : "lazy"}
          />
        </picture>
      </div>
      <div className="campaign-content">
        <h1>{slide.title}</h1>
        <p>{slide.subtitle}</p>
      </div>
    </>
  );
}

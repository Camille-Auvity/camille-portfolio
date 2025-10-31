if (document.getElementById('my-work-link')) {
  document.getElementById('my-work-link').addEventListener('click', () => {
    document.getElementById('my-work-section').scrollIntoView({behavior: "smooth"})
  })
}


// 3D Carousel
document.addEventListener("DOMContentLoaded", () => {
  const track = document.querySelector(".carousel-track");
  const cards = Array.from(document.querySelectorAll(".carousel-card"));
  let currentIndex = 0;
  let startX = 0;
  let currentTranslate = 0;
  let prevTranslate = 0;
  let dragging = false;

  const updateCarousel = () => {
    cards.forEach((card, i) => {
      const offset = (i - currentIndex) * 60; // spacing
      card.style.transform = `translateX(${offset}%) scale(${i === currentIndex ? 1 : 0.8})`;
      card.classList.toggle("active", i === currentIndex);
    });
  };

  const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

  const startDrag = (e) => {
    dragging = true;
    startX = e.pageX || e.touches[0].pageX;
    track.style.transition = "none";
  };

  const moveDrag = (e) => {
    if (!dragging) return;
    const x = e.pageX || e.touches[0].pageX;
    const dx = x - startX;
    currentTranslate = prevTranslate + dx;
    track.style.transform = `translateX(${currentTranslate}px)`;
  };

  const endDrag = () => {
    dragging = false;
    const moved = currentTranslate - prevTranslate;
    if (moved < -50) currentIndex = clamp(currentIndex + 1, 0, cards.length - 1);
    else if (moved > 50) currentIndex = clamp(currentIndex - 1, 0, cards.length - 1);
    track.style.transition = "transform 0.4s ease";
    track.style.transform = "translateX(0)";
    prevTranslate = 0;
    currentTranslate = 0;
    updateCarousel();
  };

  track.addEventListener("mousedown", startDrag);
  track.addEventListener("mousemove", moveDrag);
  track.addEventListener("mouseup", endDrag);
  track.addEventListener("mouseleave", endDrag);
  track.addEventListener("touchstart", startDrag);
  track.addEventListener("touchmove", moveDrag);
  track.addEventListener("touchend", endDrag);

  updateCarousel();
});

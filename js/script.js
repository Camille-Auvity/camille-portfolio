if (document.getElementById('my-work-link')) {
  document.getElementById('my-work-link').addEventListener('click', () => {
    document.getElementById('my-work-section').scrollIntoView({behavior: "smooth"})
  })
}

// ===== Smooth horizontal drag scroll =====
const scrollContainers = document.querySelectorAll('.projects-scroll');

scrollContainers.forEach(container => {
  let isDown = false;
  let startX;
  let scrollLeft;

  container.addEventListener('mousedown', (e) => {
    isDown = true;
    container.classList.add('active');
    startX = e.pageX - container.offsetLeft;
    scrollLeft = container.scrollLeft;
  });

  container.addEventListener('mouseleave', () => {
    isDown = false;
    container.classList.remove('active');
  });

  container.addEventListener('mouseup', () => {
    isDown = false;
    container.classList.remove('active');
  });

  container.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - container.offsetLeft;
    const walk = (x - startX) * 1.5; // scroll speed
    container.scrollLeft = scrollLeft - walk;
  });
});

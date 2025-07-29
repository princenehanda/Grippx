const hamb = document.querySelector('.hamburger');
const nav = document.querySelector('.nav-links');
hamb.addEventListener('click', () => {
  nav.classList.toggle('active');
});

function toggleNav(){
  document.querySelector('.nav-links').classList.toggle('active');
}

document.querySelectorAll('#mobileMenu a').forEach(link => {
  link.addEventListener('click', () => {
    hamburger.classList.remove("active");
    menu.classList.remove("active");
  });
});

document.querySelectorAll(".overlay-menu a").forEach(link => {
  link.addEventListener("click", () => {
    document.getElementById("mobileMenu").classList.remove("active");
    document.querySelector(".nav-toggle").classList.remove("active");
  });
});

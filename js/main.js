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
let lastScroll = 0;
const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', () => {
  let currentScroll = window.pageYOffset;

  if (currentScroll > lastScroll || currentScroll > 50) {
    navbar.classList.add('visible');
  } else {
    navbar.classList.remove('visible');
  }

  lastScroll = currentScroll;
});

let mouseMoved = false;
window.addEventListener('mousemove', () => {
  if (!mouseMoved) {
    navbar.classList.add('visible');
    mouseMoved = true;
    setTimeout(() => {
      navbar.classList.remove('visible');
    }, 3000);
  }
});

document.addEventListener("DOMContentLoaded", function () {
  const toggle = document.querySelector(".nav-toggle");
  const navLinks = document.querySelector(".nav-links");

  if (toggle && navLinks) {
    toggle.addEventListener("click", function () {
      navLinks.classList.toggle("active");
    });
  }

  // You can add your scroll logic or other scripts here too
});

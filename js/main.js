const hamb = document.querySelector('.hamburger');
const nav = document.querySelector('.nav-links');
hamb.addEventListener('click', () => {
  nav.classList.toggle('active');
});

function toggleNav(){
  document.querySelector('.nav-links').classList.toggle('active');
}

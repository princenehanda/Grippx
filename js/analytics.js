window.dataLayer = window.dataLayer || [];
function gtag() { dataLayer.push(arguments); }

(function () {
  var GA_MEASUREMENT_ID = "G-F9TPZFZKEG";

  var script = document.createElement("script");
  script.async = true;
  script.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_MEASUREMENT_ID;
  document.head.appendChild(script);

  gtag("js", new Date());
  gtag("config", GA_MEASUREMENT_ID);
})();

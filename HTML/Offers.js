const menuBtn = document.getElementById("menu-btn");
const navLinks = document.getElementById("nav-links");
const menuBtnIcon = menuBtn.querySelector("i");


menuBtn.addEventListener("click", (e) =>{
  navLinks.classList.toggle("open");
  
  const isOpen = navLinks.classList.contains("open");
  menuBtnIcon.setAttribute("class", isOpen?"ri-close-line" : "ri-menu-3-line");
});

navLinks.addEventListener("click",(e) =>{
  navLinks.classList.remove("open")
  menuBtnIcon.setAttribute("class","ri-menu-3-line");
});


const ScrollRevealOption = {
    distance: "50px",
    origin: "bottom",
    duration: 1000,

};
ScrollReveal().reveal(".header_image img",{
    ...ScrollRevealOption,
    origin: "right",
});
ScrollReveal().reveal(".header_content h1",{
    ...ScrollRevealOption,
    delay: 500,
});
ScrollReveal().reveal(".header_content p",{
    ...ScrollRevealOption,
    delay: 1000,
});
ScrollReveal().reveal(".discountoffer20",{
    ...ScrollRevealOption,
    delay: 1500,
});
ScrollReveal().reveal(".header_content h4",{
    ...ScrollRevealOption,
    delay: 2000,
});
ScrollReveal().reveal(".header_btns",{
    ...ScrollRevealOption,
    delay: 2500,
});

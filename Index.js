const menuBtn = document.getElementById("menu-btn");
const navLinks = document.getElementById("nav-links");
const menuBtnIcon = menuBtn.querySelector("i");


menuBtn.addEventListener("click", () => {
   navLinks.classList.toggle("open");

   const isOpen = navLinks.classList.contains("open")
   menuBtnIcon.setAttribute("class", isOpen? "ri-menu-3-line":"ri-menu-3-line");
});


navLinks.addEventListener("click", () => {
   navLinks.classList.remove("open");
   menuBtnIcon.setAttribute("class", isOpen? "ri-menu-3-line":"ri-menu-3-line");
});



const scrollRevealOption = {
    origin:"bottom",
    distance:"50px",
    duration: 1000,
};


//header_container
ScrollReveal().reveal(".header_content p",{
 ...scrollRevealOption,

});

ScrollReveal().reveal(".header_content h1",{
 ...scrollRevealOption,
 delay: 500,
});

ScrollReveal().reveal(".header_content .header_btn",{
 ...scrollRevealOption,
 delay: 1000,
});


ScrollReveal().reveal(".blog_card",{
 ...scrollRevealOption,
 delay: 500,
});


const instagram = document.querySelector(".instagram_flex");

const instagramContent = Array.from(instagram.children);
instagramContent.forEach(item => {
    const duplicateNode = item.cloneNode(true);
    duplicateNode.setAttribute("aria-hidder", true);
    instagram.appendChild(duplicateNode);
});






  
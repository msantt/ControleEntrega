const links = document.querySelectorAll('.header div nav ul li a');

links.forEach(link => {
    link.addEventListener('click', () => {links.forEach(l => l.classList.remove('active'));
link.classList.add('active');
});
}); 
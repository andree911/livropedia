fetch('../sidebar/sidebar.html')
    .then(res => res.text())
    .then(data => {
        document.getElementById('sidebar-container').innerHTML = data;
    });

function iniciarNav() {

    const sidebar = document.getElementById("nav-sidebar");
    const overlay = document.getElementById("nav-overlay");

    overlay.addEventListener("click", closeNav);

    document.addEventListener("click", (e) => {
        if (!sidebar.classList.contains("active")) return;

        if (sidebar.contains(e.target)) return;

        closeNav();
    });
}

function toggleNav() {
    document.getElementById("nav-sidebar").classList.toggle("active");
    document.getElementById("nav-overlay").classList.toggle("active");
}

function closeNav() {
    document.getElementById("nav-sidebar").classList.remove("active");
    document.getElementById("nav-overlay").classList.remove("active");
}

function goToHome() {
    window.location.href = "/index.html";
}

function goToAdd() {
    window.location.href = "/add/add.html";
}

function goToEdit() {
    window.location.href = "/edit/edit.html";
}

function goToRemove() {
    window.location.href = "/remove/remove.html";
}

function goToMyAccount() {
    window.location.href = "/account/account.html";
}
let darkmode = localStorage.getItem('darkmode')
const themeSwitch = document.getElementById('switch')

function enableDarkmode() {
    document.body.classList.add('darkmode');
    localStorage.setItem('darkmode', 'active')
}

function disableDarkmode() {
    document.body.classList.remove('darkmode');
    localStorage.setItem('darkmode', null)
}

if (darkmode === "active") enableDarkmode();

themeSwitch.addEventListener('click', () => {
    console.log("click")
    darkmode = localStorage.getItem('darkmode')
    darkmode !== "active" ? enableDarkmode() : disableDarkmode();
})
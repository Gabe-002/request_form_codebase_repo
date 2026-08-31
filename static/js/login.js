const incorrectCredentials = document.getElementById('incorrect-credentials')
function failedCredentials () {
    incorrectCredentials.replaceChildren(); // Clear out any <p> elements
    const pElement = document.createElement("p");
    pElement.textContent= "Invalid username or password";
    incorrectCredentials.style.display = '';
    incorrectCredentials.appendChild(pElement);
}

const loginBtn = document.getElementById('login-button').addEventListener("click", async (event) => {
    const username = document.getElementById('username')
    const password = document.getElementById('password')
    if(!username.value || !password.value) return;

    const response = await fetch(`/login/`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({username: username.value, password: password.value})
    })
    if (response.ok) {
        incorrectCredentials.replaceChildren();
        const data = await response.json(); 
        window.location.href = data.redirect;
    }
    else {
        const error = await response.json();
        failedCredentials()
        username.value = '';
        password.value = '';
    }
})
const pageData = JSON.parse(document.getElementById("page-data").textContent)
console.log(pageData)
const userId = pageData.userId
const userRole = pageData.userRole

const logoutBtn = document.getElementById('logout-button').addEventListener("click", async () => {
    const confirmation = confirm("Do you wish to logout?")
    if (!confirmation) return;

    const response = await fetch("/login/logout", {
        method: "DELETE",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({})
    })
    if (response.ok) {
        const data = await response.json();
        window.location.href = data.redirect;
    }
    else {
        alert("There was an error when attempting to log out")
    }
})

// This is the search bar to search all current and previous requests
const searchBar = document.getElementById("requests-search-bar")
const searchResults = document.getElementById("search-results")
searchResults.style.display = 'none'
searchBar.addEventListener('input', async (event) => {
    const query = encodeURIComponent(event.target.value);
    searchResults.innerHTML='';
    if (!query){
        searchResults.style.display = 'none'
        return;
    }
    const response = await fetch(`/requests/search?query=${query}`);
    if (response.ok){
        const results = await response.json();
        searchResults.style.display = 'flex'
        results.forEach((result) => {
            // This will be where we construct the login
            const isRequestor = userRole==="admin" && userId===result.requestor_user_id;
            const isProjectManager = userRole==="pm" && userId===result.project_manager_id;
            const isFinancialDirector = userRole==="fd";
            if (isRequestor || isProjectManager || isFinancialDirector) {
                renderResultChild(result, searchResults)
            }       
        })
    } else {
        alert("Something has gone wrong with the search function");
    }
})

function renderResultChild(result, parentDiv) {
    const item = document.createElement("a");
    item.className = "result"
    item.href = `/requests/pending/${result.request_id}`

    const status = document.createElement("p");
    status.className = "request-info";
    if (result.pm_review_status == "pending_review" || result.fd_review_status == "pending_review"){
        status.textContent = "PENDING";
    } else if (result.pm_review_status == "approved" && result.fd_review_status =="approved"){
        status.textContent = "APPROVED";
    } else {
        status.textContent = "DECLINED"
    }

    const name = document.createElement("p")
    name.className = "request-info";
    name.textContent = `${result.first_name} ${result.surname}`;

    const project_code = document.createElement("p");
    project_code.className = "request-info";
    project_code.textContent = `Project Code: ${result.project_code}`


    item.appendChild(status);
    item.appendChild(name);
    item.appendChild(project_code);

    parentDiv.appendChild(item);
}
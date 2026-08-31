async function httpRequest(path, method, obj = null) {
    try {
        const response = await fetch(path, {
            method: method,
            headers: {"Content-Type": "application/json"},
            body: obj ? JSON.stringify(obj) : null,
        });
        return response
    } catch (error) {
        console.error("HTTP Request Failed:", error)
        alert("Something has gone wrong with the HTTP request!")
    }
}

const addUserForm = document.getElementById("add-new-member-page")
const addUser = document.getElementById("add-new-member")

addUser.addEventListener("click", (event) => {
    
    console.log(addUserForm.style.display)
    if(!addUserForm.style.display){
        addUserForm.style.display = 'none';
        alert("You are about to close this window");
    }
    else {
        addUserForm.style.display = '';
    }
})

// This function is the one that will process the submission
const createNewUser = document.getElementById("create-new-user").addEventListener("click", async () => {
    const username = document.getElementById("username");
    const password = document.getElementById("password");
    const user_first_name = document.getElementById("user_first_name")
    const user_surname = document.getElementById("user_surname");
    const user_email = document.getElementById("user_email");
    const role = document.getElementById("role")

    const fields = [
        username,
        password,
        user_first_name,
        user_surname,
        user_email
    ]

    let complete_form = true;

    fields.forEach(field=>{
        if (field.value.trim() === ''){
            field.classList.add("invalid");
            complete_form = false;
        } else {
            field.classList.remove("invalid");
        }
    })
    if (!complete_form) {
        console.log("Form not complete");
        return;
    }

    let database_id = user_first_name.value.toLowerCase() + '_' + user_surname.value.toLowerCase()
    body_object = {
        username: username.value,
        password: password.value,
        role: role.value,
        user_first_name: user_first_name.value,
        user_surname: user_surname.value,
        user_email: user_email.value,
        database_id: database_id
    };

    const response = await httpRequest("/admin/create", "POST", body_object)
    if (response.ok){
        window.location.reload()
    } else {
        alert("Response Status:", response.status)
    }
})


const memberSearchBar = document.getElementById("admin-member-search");
let timer;
memberSearchBar.addEventListener("input", (event)=> {
    clearTimeout(timer);
    timer = setTimeout(() => {
        const query = event.target.value.trim().toLowerCase()
        document.querySelectorAll(".member-item").forEach(row => {
            const match = row.dataset.name.includes(query) || row.dataset.user_email.includes(query) || row.dataset.surname.includes(query)
            row.style.display = match ? '' : 'none'
        })
    }, 300);
});

const memberList = document.getElementById("member-list")
memberList.addEventListener("click", async (event) => {
    const button = event.target.closest(".remove-user")
    if(!button) return;

    const memberItem = event.target.closest(".member-item");
    const userId = memberItem.dataset.id

    const confirmed = confirm("Do you wish to remove this member?");
    if(!confirmed)return;

    const response = await httpRequest("/admin/remove", "DELETE", {id: Number(userId)})
    if (response.ok) {
        memberItem.remove();
    } else {
        alert("Something has gone wrong")
    }
})

memberList.addEventListener("focus", (event) => {
    if (event.target.matches(".roles")) {
        event.target.dataset.prevValue = event.target.value;
    }
}, true)
memberList.addEventListener("change", async (event) => {
    if(event.target.matches(".roles")){
        const item = event.target.closest('.roles')
        const confirmation = confirm("Do you wish to change the role of the user?")
        if(!confirmation){
            event.target.value = event.target.dataset.prevValue;
            return;
        }
        const memberId = event.target.closest('.member-item').dataset.id
        const memberRole = item.value
        const response = await httpRequest("/admin/update", "PATCH", {id: Number(memberId), role: memberRole})
        if (response.ok){
            window.location.reload()
        } else {
            alert("Response Status:", response.status)
        }
    }
})


// This is for dynamically adding in new project codes
const projectCodeList = document.getElementById("project-code-list")
const addProjectCodeBtn = document.getElementById("new-project-code")

addProjectCodeBtn.addEventListener("click", ()=>{
    const pcInputTemplate = document.getElementById("code-item-input-template");
    const row = pcInputTemplate.content.cloneNode(true); // Create an item from the template in the DOM 
    projectCodeList.prepend(row); // The creates the item at the top of the list
    projectCodeList.querySelector(".pc-input")?.focus(); // This places the cursor at the first instace of project code input
})
projectCodeList.addEventListener('click', async (event) => {
    if (event.target.matches('.save-project-code')){
        const item = event.target.closest('.code-item')
        const projectCode = item.querySelector('.pc-input').value.trim()
        const description = item.querySelector('.desc-input').value.trim()
        if (!projectCode || !description) return;

        const response = await httpRequest("/admin/projectcodes/add", "POST", {project_code: projectCode, description: description});

        if (response.ok){
            window.location.reload()
        } else {
            alert("Response Status:", response.status)
        }
    }
    if (event.target.matches('.cancel-project-code')){
        event.target.closest('.code-item').remove();
    }
    if (event.target.matches('.remove-project-code')){
        const item = event.target.closest('.code-item');
        projectCodeId = item.dataset.project_code_id;
        const confirmation = confirm("Do you wish to remove this project code?");
        if (!confirmation) return;
        const response = await httpRequest("/admin/projectcodes/remove", "DELETE", {id: Number(projectCodeId)});
        if (response.ok) {
            item.remove();
        }
        else {
            alert("An error has occurred with this action");
        }
    }
})


const softwareList = document.getElementById("software-list")
const addSoftwareBtn = document.getElementById("new-software").addEventListener("click", () => {
    const softwareInputTemplate = document.getElementById("software-input-item");
    const row = softwareInputTemplate.content.cloneNode(true)
    softwareList.prepend(row);
    softwareList.querySelector(".software-input")?.focus()
})


softwareList.addEventListener("click", async (event) => {
    if (event.target.matches('.save-software')){
        const item = event.target.closest('.software-item')
        const softwareName = item.querySelector(".software-input").value.trim()
        if(!softwareName) return;
        
        const response = await httpRequest("/admin/software/add", "POST", {display_name: softwareName})
        if (response.ok){
            window.location.reload()
        } else {
            alert("Response Status:", response.status)
        }
    }
    if (event.target.matches('.cancel-software')){
        event.target.closest('.software-item').remove()
    }
    if (event.target.matches('.remove-software')){
        const item = event.target.closest('.software-item');
        const softwareItemId = item.dataset.software_id;
        const confirmation = confirm("Do you wish to remove this software");
        if(!confirmation) return;
        const response = await fetch("/admin/software/remove", {
            method: "DELETE",
            headers: {"Content-Type": "application/json"}, 
            body: JSON.stringify({id: Number(softwareItemId)})});
        if (response.ok){
            item.remove()
        } else {
            alert("Response Status:",response.status)
        }
    }
})



function createTemplateItem(buttonId, templateId, listId, inputSelector){
    const template = document.getElementById(templateId);
    const button = document.getElementById(buttonId);
    const list = document.getElementById(listId)

    button.addEventListener("click", () => {
        const newItem = template.content.cloneNode(true);
        list.prepend(newItem);
        list.querySelector(inputSelector)?.focus();
    })
}
// This add the country to the country list
async function addItem(event, url, fieldName) {
    const templateItem = event.target.closest(".template-item");
    const itemDescription = templateItem.querySelector(".template-input").value.trim();
    if (!itemDescription) return;
    console.log({[fieldName]: itemDescription})
    const response = await httpRequest(url, "POST", {[fieldName]: itemDescription})
    if (response.ok){
        window.location.reload()
    } else {
        alert("Could not create a new item!")
    }
}
// This cancels the creation of the item
function cancelItem(event, itemId) {
    event.target.closest(itemId).remove()
}
// This deletes the item
async function removeItem(event, url, fieldName, itemId) {
    const confirmation = confirm("Do you wish to remove this country?");
    if (!confirmation) return;
    const item = event.target.closest(itemId);
    const dbId = item.dataset.itemid
    const response = await httpRequest(url, "DELETE", {[fieldName]: Number(dbId)})
    if (response.ok) {
        item.remove()
    } else {
        alert("Could not remove the item!")
    }
}

const baseCountrieList = document.getElementById("base-countries-list")
createTemplateItem("new-country", "input-template", "base-countries-list", "template-input")
baseCountrieList.addEventListener("click", (event) => {
    if (event.target.matches(".template-save")) {
        addItem(event, "/admin/countries/add", "country_name")
    }
    if (event.target.matches(".template-cancel")) {
        cancelItem(event, ".template-item")
    }
    if (event.target.matches(".remove-button")) {
        removeItem(event, "/admin/countries/remove", "id", ".standard-item")
    }
})

const employeeDivisionList = document.getElementById("employee-division-list")
createTemplateItem("new-division", "input-template", "employee-division-list", "template-input")
employeeDivisionList.addEventListener("click", (event) => {
    if (event.target.matches(".template-save")) {
        addItem(event, "/admin/divisions/add", "division_name")
    }
    if (event.target.matches(".template-cancel")) {
        cancelItem(event, ".template-item")
    }
    if (event.target.matches(".remove-button")) {
        removeItem(event, "/admin/divisions/remove", "id", ".standard-item")
    }
})
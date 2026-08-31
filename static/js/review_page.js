// Contains the fields: userId, userRole, pmReviewStatus, fdReviewStatus
const pageData = JSON.parse(document.getElementById("page-data").textContent);
const buttonsArea = document.getElementById("buttons")
const reviewArea = document.getElementById("review-area")

function formatTimeStamp(rawTimeStamp){
    if (!rawTimeStamp) return "-";
    const formattedString = rawTimeStamp.replace(" ", "T").replace(/(\.\d{3})\d*/, "$1");

    const date = new Date(formattedString);
    if (isNaN(date)) return "-";
    return new Intl.DateTimeFormat("en-ZA", {
        dateStyle: "medium",
        timeStyle: "short"
    }).format(date)
}
const formSubmissionAt = formatTimeStamp(pageData.submittedAt)
const pmReviewTime = formatTimeStamp(pageData.pmReviewTime)
const fdReviewTime = formatTimeStamp(pageData.fdReviewTime)

const requestId = pageData.requestId
const userRole = pageData.userRole
const pmReviewStatus = pageData.pmReviewStatus
const fdReviewStatus = pageData.fdReviewStatus
const userId = pageData.userId
const projectManagerId = pageData.projectManagerId

console.log(userId)
console.log(projectManagerId)
console.log(userRole)

function renderTable(){
    rows = [
        {
            role: "Admin",
            action: "Submitted",
            time: formSubmissionAt
        },
        {
            role: "PM",
            action: pmReviewStatus.charAt(0).toUpperCase() + pmReviewStatus.slice(1).replace("_", " "),
            time: pmReviewTime
        },
        {
            role: "FD",
            action: fdReviewStatus.charAt(0).toUpperCase() + fdReviewStatus.slice(1).replace("_", " "),
            time: fdReviewTime
        }
    ]
    const tbody = document.getElementById("table-body")
    tbody.innerHTML = "" //Clear it
    
    rows.forEach( ({role, action, time}) => {
        const tr = document.createElement("tr");

        const roleCell = document.createElement("td");
        roleCell.textContent = role;
        const actionCell = document.createElement("td");
        actionCell.textContent = action;
        const timeCell = document.createElement("td");
        timeCell.textContent = time;

        tr.append(roleCell, actionCell, timeCell);
        tbody.appendChild(tr);
    })
}
renderTable();

buttonsArea.addEventListener("click", async (event) => {
    event.preventDefault();
    if (userRole === 'pm' && userId !== projectManagerId){
        alert("You do not have the permissions to complete this action");
        return;
    }

    const type = event.target.closest(".review-button")
    if (type && type.dataset.action !== "edit") {
        const status = type.dataset.action
        console.log(status)
        const response = await fetch(`/requests/pending/review`, {
            method: "PATCH",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                status: status,
                role: userRole,
                request_id: requestId})
            }
        )
        if (response.ok){
            location.reload()
        } else {
            alert("Something has gone wrong!")
        }
    } else if (type.dataset.action === "edit") {
        window.location.href = `/requests/pending/edit/${pageData.requestId}`
    } else {
        alert("The click is empty. Please report this issue")
    }
})


function reviewMessage(reviewMessage, messageColorClass) {
    const messageContainer = document.createElement("p")
    messageContainer.className = `review-message ${messageColorClass}`;
    messageContainer.textContent = reviewMessage;
    reviewArea.appendChild(messageContainer)
}
function renderAdminControls() {
    if (pmReviewStatus === "pending_review"){
        const editButton = document.createElement("button");
        editButton.type = "button"
        editButton.className = "review-button review-button--pending";
        editButton.textContent = "Edit Request";
        editButton.dataset.action = "edit"
        buttonsArea.appendChild(editButton);
    }
}

function renderProjectManagerControls(){
    if (pmReviewStatus === "pending_review"){
        const rejectButton = document.createElement("button");
        rejectButton.type = "button"
        rejectButton.className = "review-button review-button--reject";
        rejectButton.textContent = "Reject Request";
        rejectButton.dataset.action = "rejected"

        const approveButton = document.createElement("button");
        rejectButton.type = "button"
        approveButton.className = "review-button review-button--approve";
        approveButton.textContent = "Approve Request"
        approveButton.dataset.action = "approved"

        buttonsArea.appendChild(rejectButton);
        buttonsArea.appendChild(approveButton);
    }
}

function renderFinancialDirectorControls(){
    if (pmReviewStatus === "pending_review"){
        reviewMessage("Pending project manager approval", "pending-color")
    } else if (pmReviewStatus === "rejected"){
        reviewMessage("The project manager has rejected this request", "reject-color")
    } else if (fdReviewStatus === "approved") {
        reviewMessage("You have approved this request", "approve-color")
    } else if (fdReviewStatus === "rejected") {
        reviewMessage("You have rejected this request", "reject-color")
    } else {
        const rejectButton = document.createElement("button");
        rejectButton.type = "button"
        rejectButton.className = "review-button review-button--reject";
        rejectButton.textContent = "Reject Request";
        rejectButton.dataset.action = "rejected"

        const approveButton = document.createElement("button");
        rejectButton.type = "button"
        approveButton.className = "review-button review-button--approve";
        approveButton.textContent = "Approve Request"
        approveButton.dataset.action = "approved"

        buttonsArea.appendChild(rejectButton);
        buttonsArea.appendChild(approveButton);
    }
}

if (userRole === "admin"){
    renderAdminControls();
} else if (userRole === "pm"){
    renderProjectManagerControls();
}
else if (userRole == "fd"){
    renderFinancialDirectorControls();
}
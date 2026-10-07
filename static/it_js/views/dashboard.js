import { deviceModalHTML, initDeviceModal } from "../Devicemodal.js";

export const dashboardView = {
    async mount(container) {
        container.innerHTML = `<p>Loading...</p>`;
        let body = `
            <div class="dashboard-header">
                <div class="site-heading">
                    <h2>Dashboard</h2>
                    <p>site overview</p>
                </div>
                <div class="header-actions">
                    <div class="sync-block">
                        <button id="sync-tenants" type="button" class="secondary-button">⟳ Sync Users</button>
                        <small id="last-synced">Last synced: —</small>
                    </div>
                    <span class="header-divider"></span>
                    <div class="quick-buttons">
                        <button id="add-device" type="button">+ Add Device</button>
                        <button id="new-assignment" type="button">+ New Assignment</button>
                    </div>
                </div>
            </div>

            ${deviceModalHTML()}

            <div id="review-modal">
                <div class="review-content">
                    <h3>Review Request</h3>

                    <div id="review-details">

                    </div>

                    <div class="review-buttons">
                        <button id="issue-button" type="button">Issue</button>
                        <button id="transfer-button" type="button">Transfer</button>
                        <button id="cancel-review" type="button">Cancel</button>
                    </div>
                </div>
            </div>

            <div id="issue-modal">
                <div class="issue-page">
                    <h3>Issue a device</h3>
                    <h4>Device Info</h4>
                    <div class="asset-search">
                        <label>Asset Number
                            <input type="text" id="issue-asset-number" name="asset_number" required">
                            <div id="asset-results"></div>
                        </label>
                    </div>
                        <label>Asset Description
                            <input type="text" id="issue-model" name="model" required>
                        </label>
                        <label>Serial Number
                            <input type="text" id="issue-serial-number" name="serial_number" required>
                        </label>
                    <h4>Transfer Info</h4>
                        <label>Transfer To
                            <input type="text" id="issue-name" name="issue-name" required>
                        </label>
                        <label>Company No.
                            <input type="text" id="issue-company-no" name="company-no" required>
                        </label>
                        <label>Location
                            <input type="text" id="" name="" required>
                        </label>
                        <div class="user-search">
                            <label>Username
                                <input type="text" id="issue-tenant-username" name="issue-tenant-username" required>
                            </label>
                            <div id="users-results"></div>
                        </div>
                        <label>Tenant Email
                            <input type="text" id="issue-tenant-email" name="issue-tenant-email" required>
                        </label>

                    <div class="review-buttons">
                        <button id="confirm-issue" type="button">Confirm</button>
                        <button id="cancel-issue" type="button">Cancel</button>
                    </div>
                </div>
            </div>
        `

        const [response, deviceResponse] = await Promise.all([
            fetch(`/it/api/requests`),
            fetch(`/it/api/devices`)
        ]);
        if (!response.ok){
            container.innerHTML = `<p>Could not fetch the pending requests</p>`;
            return;
        }
        if (!deviceResponse.ok) {
            container.innerHTML = `<p>Failed to capture devices!</p>`;
            return;
        }


        const awaiting_assignments = await response.json();
        const devices = await deviceResponse.json();
        const numberPending = awaiting_assignments.length;
        body += renderQuickView(devices, numberPending)
        body += `<div class="activity-and-assignments">`
        body += renderPendingAssignments(awaiting_assignments);
        body += renderRecentActivity()
        body += `</div>`
        container.innerHTML = body;

        const addDeviceBtn = document.getElementById('add-device')
        const modal = document.getElementById('device-modal')
        addDeviceBtn.addEventListener('click', () => {
            modal.classList.toggle('open')
        })

        const cancelDeviceBtn = document.getElementById('cancel-device');
        const deviceForm = document.getElementById('new-device-form');

        cancelDeviceBtn.addEventListener("click", () => {
            modal.classList.remove('open');
            deviceForm.reset();
        })

        deviceForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            const formData = new FormData(deviceForm);
            const payload = Object.fromEntries(formData.entries())
            try {
                const response = await fetch('/it/api/devices', {
                    method: 'POST',
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify(payload)
                })
                if (!response.ok) {
                    throw new Error("Failed to add new device")
                }
                modal.classList.remove('open')
                deviceForm.reset();
                window.location.reload();
            } catch (err) {
                alert("Could not connect to the database correctly")
            }
        })
        const reviewModel = document.getElementById("review-modal")
        document.getElementById("pending-assignments-block")?.addEventListener('click', (event)=> {
            if (event.target.classList.contains('review-button')) {
                reviewModel.dataset.requestid = event.target.dataset.requestid;
                renderReviewPage(event.target.dataset.requestid);
            }
        }) 
        document.getElementById('cancel-review').addEventListener('click', () => {
            reviewModel.classList.toggle('open');
        })
        document.getElementById('issue-button').addEventListener('click', () => {
            const reviewModel = document.getElementById("review-modal")
            reviewModel.classList.toggle('open');
            renderIssuePage(reviewModel.dataset.requestid);
        })

        document.getElementById('cancel-issue').addEventListener('click', () => {
            const confirmation = confirm("Are you sure you would like to cancel this issue?")
            if (!confirmation) return;
            document.getElementById('issue-modal').classList.toggle('open')
            document.getElementById('issue-modal').querySelectorAll('input').forEach(
                (input) => {
                    input.value =''
                }
            )
        })

        const deviceResults = document.getElementById('asset-results')
        deviceResults.style.display = 'none'
        document.getElementById('issue-asset-number').addEventListener('input',
            (event) => searchResults(event, deviceResults, `/it/api/query/devices`, (device)=> `${device.asset_number} - ${device.manufacturer} ${device.model}`))
        deviceResults.addEventListener('click', (event) => {
            const item = event.target.closest('.device-item')
            const assetNumber = document.getElementById('issue-asset-number')
            const modelNumber = document.getElementById('issue-model')
            const serialNumber = document.getElementById('issue-serial-number')

            assetNumber.value = item.dataset.assetNumber
            modelNumber.value = `${item.dataset.manufacturer} ${item.dataset.model}`
            serialNumber.value = item.dataset.serialNumber

            deviceResults.dataset.deviceId = item.dataset.id
            deviceResults.style.display = 'none'
        })

        const userResults = document.getElementById('users-results')
        userResults.style.display = 'none'
        document.getElementById('issue-tenant-username').addEventListener('input',
            (event) => searchResults(event, userResults, `/it/api/query/users`, (user)=> `${user.display_name}`))
  
        userResults.addEventListener('click', (event)=>{
            const item = event.target.closest('.device-item')
            const displayName = document.getElementById('issue-tenant-username')
            const email = document.getElementById('issue-tenant-email')

            displayName.value = item.dataset.displayName
            email.value = item.dataset.email

            userResults.dataset.userId = item.dataset.id
            userResults.style.display = 'none'
        })

        // This if for the issue
        document.getElementById('confirm-issue').addEventListener('click', async () => {
            const assetNumber = document.getElementById('issue-asset-number').value
            const tenantUsername = document.getElementById('issue-tenant-username').value
            const tenantEmail = document.getElementById('issue-tenant-email').value
            if (!assetNumber || !tenantUsername)
                alert('Critical fields are missing. Please fill them in!')
            const userId = userResults.dataset.userId
            const deviceId = deviceResults.dataset.deviceId
            const requestId = reviewModel.dataset.requestid
            const response = await fetch(`/it/api/assign`, {
                headers: {"Content-Type": "application/json"},
                method: "POST",
                body: JSON.stringify({
                    "request_id": Number(requestId),
                    "device_id": Number(deviceId),
                    "tenant_id": userId,
                    "assigned_to": tenantUsername,
                    "assignee_email": tenantEmail
                })
            })
            if(!response.ok){
                alert("Could not assign device!")
            } else {
                window.location.reload()
            }
        })
    }
}

function renderQuickView(devices, numberPending) {
    const stats = devices.reduce((acc, device) => {
        acc.byType[device.asset_type] = (acc.byType[device.asset_type] || 0) + 1;
        if (device.asset_type === 'Laptop')
            acc.byStatus[device.status] = (acc.byStatus[device.status] || 0) + 1;
        return acc;
    }, {byType: {}, byStatus: {}})
    const totalLaptops = stats.byType.Laptop
    const availableLaptops = stats.byStatus.available
    const assignedLaptops = totalLaptops - availableLaptops

    return `
        <h3>Quick View</h3>
        <div class="quick-view">
            <div class="quick-view-item">
                <p>Total Devices</p>
                <p>${totalLaptops}</p>
            </div>
            <div class="quick-view-item">
                <p>Assigned</p>
                <p>${assignedLaptops}</p>
            </div>
            <div class="quick-view-item">
                <p>Available</p>
                <p>${availableLaptops}</p>
            </div>
            <div class="quick-view-item pending-item">
                <p>Pending Assignments</p>
                <p>${numberPending}</p>
            </div>
        </div>
    `
}

function renderPendingAssignments(items) {
    if (!items?.length)
        return `<div id="pending-assignments-block"><h3>Pending Assignments</h3><p>There are not requerts pending!</p></div>`
    return `
        <div id="pending-assignments-block">
            <h3>Pending Assignments</h3>
                ${items
                    .map(aw => 
                    `<div class="pending-assignment-item">
                        <div class="pending-assignment-info">
                            <p>${aw.first_name} ${aw.surname}</p>
                            <p>Project Code: ${aw.project_code}</p>
                        </div>
                        <button class="review-button" type="button" data-requestId=${aw.id}>Review</button>
                    </div>`)
                    .join('')}
        </div>`
}

function renderRecentActivity(){
    return `
        <div class="recent-activity-block">
            <h3>Recent Activity</h3>
            <div class="recent-activity">
                <p>Here is some holder text</p>
            </div>
        </div>
    `
}

async function renderReviewPage(request_id) {
    const response = await fetch(`/it/api/request?request_id=${request_id}`)
    if (!response.ok) {
        alert("Failed to get the request!")
        return;
    }
    const request = await response.json();
    const reviewModel = document.getElementById("review-modal")
    reviewModel.classList.toggle('open');

    const reviewDetails = document.getElementById("review-details")
    let details = `
        <div class='detail-item'>
            <p>Full Name:</p> <p>${request.first_name} ${request.surname}</p>
        </div>
        <div class='detail-item'>
            <p>Project Code:</p> <p>${request.project_code}</p>
        </div>
        <div class='detail-item'>
            <p>Employee Division:</p> <p>${request.employee_division}</p>
        </div>
        <div class='detail-item'>
            <p>Country:</p> <p>${request.base_country_computer.replace("_", " ")}</p>
        </div>
        <div class='detail-item'>
            <p>Computer Required:</p> <p>${request.computer_required}</p>
        </div>
        <div class='detail-item'>
            <p>Desk Phone Required:</p> <p>${request.desk_phone_required}</p>
        </div>
        <div class='detail-item'>
            <p>Required Software:</p>
        </div>
        <ul class="software-list">`
    request.required_software.forEach((item) => {
        details += `<li>${item
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')}</li>`
    })
    details += `</ul>`
    reviewDetails.innerHTML = details
}

async function renderIssuePage(requestid) {
    const issueModal = document.getElementById('issue-modal')
    issueModal.classList.toggle('open')

    const response = await fetch(`/it/api/request?request_id=${requestid}`)
    if (!response.ok) {
        alert("Failed to get the request!")
        return;
    }
    const request = await response.json();
    const name = document.getElementById('issue-name')
    name.value = `${request.first_name} ${request.surname}`


}

// This is for the search bars
async function searchResults(event, container, url, renderItem){
    const query = event.target.value
    if (!query) {
        container.innerHTML = ''
        container.style.display = 'none'
        return
    }
    const response = await fetch(`${url}?query=${query}`)
    if (!response.ok) {
        alert("An error has occured while fetching results")
        return
    }
    container.style.display = 'flex'
    const items = await response.json()
    let body = ``
    items.forEach((item) => {
        const attrs = Object.entries(item)
            .map(([key, value]) => `data-${key.replace(/_/g, '-')}="${value}"`)
            .join(' ')
        body += `<p class="device-item" ${attrs}>${renderItem(item)}</p>`
    })
    container.innerHTML = body
}
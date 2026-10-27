import { deviceModalHTML, initDeviceModal, assignDeviceModal, initAssignModal } from "../Devicemodal.js";
import { FormModal, InfoModal } from "../modal.js";

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
                        <small id="last-synced">Last synced: <span id="last-synced-time">-</span></small>
                    </div>
                    <span class="header-divider"></span>
                    <div class="quick-buttons">
                        <button id="add-device" type="button">+ Add Device</button>
                        <button id="new-assignment" type="button">+ New Assignment</button>
                    </div>
                </div>
            </div>


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
        `
        const [response, deviceResponse, lastSyncResponse] = await Promise.all([
            fetch(`/it/api/requests`),
            fetch(`/it/api/devices`),
            fetch(`/it/api/last/sync`)
        ]);
        if (!response.ok){
            container.innerHTML = `<p>Could not fetch the pending requests</p>`;
            return;
        }
        if (!deviceResponse.ok) {
            container.innerHTML = `<p>Failed to capture devices!</p>`;
            return;
        }

        const [awaiting_assignments, devices, lastSync] = await Promise.all([
            response.json(),
            deviceResponse.json(),
            lastSyncResponse.json()
        ])

        const numberPending = awaiting_assignments.length;
        body += renderQuickView(devices, numberPending)
        body += `<div class="activity-and-assignments">`
        body += renderPendingAssignments(awaiting_assignments);
        body += renderRecentActivity()
        body += `</div>`
        container.innerHTML = body;
        
        // !!!! Another piece of shit function I have to redo
        // !!!! Ok, maybe's its not that bad, but we should generalize form submissions
        async function submitDevice(event, modal) {
            event.preventDefault()
            
            const formData = new FormData(event.target);
            const deviceData = Object.fromEntries(formData.entries());
            try {
                const response = await fetch('/it/api/devices', {
                    method: 'POST',
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify(deviceData)
                });
                if(!response.ok) {
                    throw new Error(`HTTP Error. Status: ${response.status}`);
                }
                modal.close();
                window.location.reload();
            } catch (err) {
                alert(`Fetch Error - ${err}`)
                window.location.reload();
            }
        }

        async function submitFormInfo(event, modal, url) {
            event.preventDefault();
            const formObject = new FormData(event.target);
            const formData = Object.fromEntries(formObject.entries());
            try {
                const reponse = await fetch(
                    url,
                    {
                        headers: {"Content-Type": "application/json"},
                        method: "POST",
                        body: JSON.stringify(formData)
                    }
                );
                if (!response.ok) {
                    throw new Error("Failed to add a new device");
                }
                modal.close();
            } catch (err) {
                alert("Could not connect to the database correctly")
            }
        }


        const newAssignmentBtn = document.getElementById('new-assignment')
        newAssignmentBtn.addEventListener('click', async () => {
            const newAssignmentModal = new FormModal(
                "Assign a Device",
                {
                    inputs: [
                        {label: "Device Info", name: "", type: "heading"},
                        {label: "Asset Number", name: "asset_number", type: "input", required: true, search: true},
                        {label: "", name: "device_id", type: "hidden", required: false},
                        {label: "Asset Description", name: "asset_description", type: "input"},
                        {label: "Serial Number", name: "serial_number", type: "input"},
                        {label: "Transfer Info", name: "", type: "heading"},
                        {label: "Location", name: "location", type: "input", required: true},
                        {label: "Username", name: "tenant_username", type: "input", required: true, search: true},
                        {label: "", name: "tenant_id", type: "hidden", required: false},
                        {label: "Email", name: "tenant_email", type: "input", required: true}
                    ],
                    buttons: [
                        {label: "Confirm", onClick: () => {}, type: "submit", event: "submit"}
                    ]
                }
            );

            // !!!!! We must add error handling to our fetches (making own fetch funciton)
            const [devices, users] = await Promise.all([
                fetch('/it/api/devices').then(response => response.json()),
                fetch(`/it/api/users`).then(response => response.json())
            ])

            newAssignmentModal.addDatabaseInfo("devices", devices);
            newAssignmentModal.addDatabaseInfo("users", users);
            newAssignmentModal.open();
            newAssignmentModal.searchBar('asset_number', 'devices', {onSearch: onSearchDevice, onRender: onRenderDevice, onClick: onClickDevice});
            newAssignmentModal.searchBar('tenant_username', 'users', {onSearch: onSearchUsers, onRender: onRenderUsers, onClick: onClickUsers});
            newAssignmentModal.submitBehaviour(onSubmitAssign);
        })

        const addDeviceBtn = document.getElementById('add-device')
        addDeviceBtn.addEventListener('click', () => {
            const newDeviceModal = new FormModal(
                "Add a New Devive",
                {
                    inputs: [
                        {label: "Asset Number", name: "asset_number", type: "input", required: true},
                        {label: "Serial Number", name: "serial_number", type: "input", required: true},
                        {label: "Manufacturer", name: "manufacturer", type: "input", required: true},
                        {label: "Model", name: "model", type: "input", required: true},
                        {label: "Purchase Price", name: "purchase_price", type: "number", required: true},
                        {label: "Order Number", name: "order_number", type: "input", required: true},
                        {
                            label: "Asset Type", 
                            name: "asset_type", 
                            type: "select", 
                            options: [
                                {value: "Laptop", label: "Laptop"},
                                {value: "Monitor", label: "Monitor"}
                            ]
                        },
                        {
                            label: "Status",
                            name: "status",
                            type: "select",
                            options: [
                                {value: "available", label: "Available"},
                                {value: "assigned", label: "Assigned"},
                                {value: "repair", label: "Repair"},
                                {value: "retired", label: "Retired"},
                            ]
                        },
                        {label: "Condition Notes", name: "condition_notes", type: "textarea", required: true}
                    ],
                    buttons: [
                        {label: "Test", onClick: () => {}, type: "submit", event: "submit"}
                    ]
                }
            );
            newDeviceModal.open();
            newDeviceModal.submitBehaviour(submitDevice);
        })

        //////////////////////////////////////////////////////////////////////////////////////////////////////////////
        // Anything pertaining to the tenant sync
        //////////////////////////////////////////////////////////////////////////////////////////////////////////////

        let currentLastSync = lastSync
        const syncTimeElement = document.getElementById('last-synced-time')

        function updateSyncTime() {
            syncTimeElement.textContent = lastSyncTime(currentLastSync)
        }
        updateSyncTime()
        const timerHandle = setInterval(updateSyncTime, 60000)


        const syncBtn = document.getElementById('sync-tenants')
        syncBtn.addEventListener('click', async () => {
            document.documentElement.classList.add('is-loading')
            syncBtn.disabled = true

            try {
                const syncResponse = await fetch(`/it/api/sync/tenant/users`, {
                    headers: {"Content-Type": "application/json"},
                    method: "POST",
                    body: JSON.stringify({})
                })
                if (!syncResponse.ok){
                    alert("There was a problem while syncing the tenant table")
                    return
                }
                currentLastSync = await syncResponse.json()
                document.getElementById('last-synced-time').textContent = lastSyncTime(currentLastSync)
            } finally {
                document.documentElement.classList.remove('is-loading')
                syncBtn.disabled = false
            }
        })


        const reviewModel = document.getElementById("review-modal")
        document.getElementById("pending-assignments-block")?.addEventListener('click', async (event)=> {
            if (event.target.classList.contains('review-button')) {
                reviewModel.dataset.requestid = event.target.dataset.requestid;
                const requestId = event.target.dataset.requestid;

                const [requestInfo] = await Promise.all([
                    fetch(`/it/api/request?request_id=${requestId}`).then(response => response.json()),
                ])
                console.log(requestInfo);

                const newReviewModal = new InfoModal(
                    'Review Request',
                    {
                        fields: [
                            {label: "Full Name", key: 'full_name'},
                            {label: "Project Code", key: 'project_code'},
                            {label: "Employee Division", key: 'employee_division'},
                            {label: "Country", key:'base_country_computer'},
                            {label: "Computer Required", key: 'computer_required'},
                            {label: "Desk Phone Required", key: 'desk_phone_required'},
                        ],
                        buttons: [
                            {label: "Issue", onClick: () => onClickReviewIssue(requestId)},
                            {label: "Transfer", onClick: () => {}},
                        ],
                    }
                )
                requestInfo['full_name'] = `${requestInfo.first_name} ${requestInfo.surname}`;
                newReviewModal.appendInfo(requestInfo);
                newReviewModal.open();

                async function onClickReviewIssue(requestId) {
                    const issueModal = new FormModal(
                        "Issue a Devive",
                        {
                            inputs: [
                                {label: "Device Info", name: "", type: "heading"},
                                {label: "Asset Number", name: "asset_number", type: "input", required: true, search: true},
                                {label: "Asset Description", name: "asset_description", type: "input"},
                                {label: "", name: "device_id", type: "hidden"},
                                {label: "Serial Number", name: "serial_number", type: "input"},
                                {label: "Transfer Info", name: "", type: "heading"},
                                {label: "Location", name: "location", type: "input", required: true},
                                {label: "Username", name: "tenant_username", type: "input", required: true, search: true},
                                {label: "", name: "tenant_id", type: "hidden"},
                                {label: "Email", name: "tenant_email", type: "input", required: true},
                            ],
                            buttons: [
                                {label: "Confirm", onClick: () => {}, type: "submit", event: "submit"},
                            ],
                        }
                    )
                    const [devices, users] = await Promise.all([
                        fetch('/it/api/devices').then(response => response.json()),
                        fetch(`/it/api/users`).then(response => response.json())
                    ])

                    issueModal.addDatabaseInfo("devices", devices);
                    issueModal.addDatabaseInfo("users", users);
                    issueModal.addDatabaseInfo("request_id", requestId);
                    issueModal.open();
                    issueModal.searchBar('asset_number', 'devices', {onSearch: onSearchDevice, onRender: onRenderDevice, onClick: onClickDevice});
                    issueModal.searchBar('tenant_username', 'users', {onSearch: onSearchUsers, onRender: onRenderUsers, onClick: onClickUsers});
                    issueModal.submitBehaviour(onSubmitIssue);
                }

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

        // This if for the issue
        document.getElementById('confirm-issue').addEventListener('click', async () => {
            const assetNumber = document.getElementById('issue-asset-number').value
            const tenantUsername = document.getElementById('issue-tenant-username').value
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
                    "tenant_id": userId
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

////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Device modal related code
////////////////////////////////////////////////////////////////////////////////////////////////////////////

function onSearchUsers(query, info) {
    const results = info.filter((item) => {
        return (
            item.display_name.toLowerCase().includes(query.toLowerCase()) 
            || item.email.toLowerCase().includes(query.toLowerCase()))
    });
    return results;
}
function onRenderUsers(result, element) {
    element.dataset.userId = result.id;
    element.textContent = `${result.display_name} - ${result.email}`;
}
function onClickUsers(result, modal) {
    const form = modal.form;

    const tenantUsername = form.elements.tenant_username;
    const tenantEmail = form.elements.tenant_email;
    const tenantId = form.elements.tenant_id;

    tenantUsername.value = result.display_name;
    tenantEmail.value = result.email;
    tenantId.value = result.id;
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Assignment modal related code
////////////////////////////////////////////////////////////////////////////////////////////////////////////

function onSearchDevice(query, info) {
    const results = info.filter((item) => {
        return (
            (item.asset_number.toLowerCase().includes(query.toLowerCase()) 
            || item.model.toLowerCase().includes(query.toLowerCase()))
            && item.status === 'available')
    })
    return results
}
function onRenderDevice(result, element) {
    element.dataset.deviceId = result.id;
    element.textContent = result.asset_number ?? '-';
}
function onClickDevice(result, modal) {
    const form = modal.form

    const assetNumber = form.elements.asset_number;
    const assetDescription = form.elements.asset_description;
    const serialNumber = form.elements.serial_number;
    const deviceId = form.elements.device_id;

    
    assetNumber.value = result.asset_number;
    deviceId.value = result.id;
    assetDescription.value = `${result.manufacturer} - ${result.model}`;
    serialNumber.value = result.serial_number;
}

async function onSubmitAssign(event, modal) {
    event.preventDefault();
    const form = modal.form;
    const formObject = new FormData(form);
    const formData = Object.fromEntries(formObject); // We need the location

    const assignmentInfo = {
        device_id: Number(formData.device_id),
        tenant_id: Number(formData.tenant_id),
        location: formData.location
    }
    const response = await fetch(`/it/api/assign`, {
        headers: {"Content-Type": "application/json"},
        method: "POST",
        body: JSON.stringify(assignmentInfo)
    })
    if (!response.ok) {
        alert("Could not correctly assign the device")
    }
    window.location.reload()
}

async function onSubmitIssue(event, modal) {
    event.preventDefault();
    const form = modal.form;
    const formObject = new FormData(form);
    const formData = Object.fromEntries(formObject); // We need the location

    const issueInfo = {
        device_id: Number(formData.device_id),
        tenant_id: Number(formData.tenant_id),
        request_id: Number(modal.databaseCalls['request_id'] ?? null),
        location: formData.location,
    };
    const response = await fetch(`/it/api/assign`, {
        headers: {"Content-Type": "application/json"},
        method: "POST",
        body: JSON.stringify(issueInfo)
    })

    if(!response.ok){
        alert("Could not assign device!")
    } else {
        window.location.reload()
    }
}

///////////////////////////////////////////////////
// Functions related to the sync
///////////////////////////////////////////////////

function lastSyncTime(lastSync) {
    const past = new Date(lastSync)

    const diffMs = (Date.now()-past.getTime())
    const diffSecs = Math.floor(diffMs/1000)
    const diffMins = Math.floor(diffSecs/60)
    const diffHours = Math.floor(diffMins/60)
    const diffDays = Math.floor(diffHours/24)
    
    if (diffDays >= 1) {
        return `${diffDays} day${diffDays !== 1 ? 's' : ''}`
    } else if (diffHours >= 1) {
        return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
    } else if (diffMins >= 1) {
        return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`
    } else {
        return `seconds ago`
    }
}

////////////////////////////////////////////////////////////////////////////
// Some other function I have yet to classify
////////////////////////////////////////////////////////////////////////////


function renderQuickView(devices, numberPending) {
    const stats = devices.reduce((acc, device) => {
        acc.byType[device.asset_type] = (acc.byType[device.asset_type] || 0) + 1;
        if (device.asset_type === 'Laptop')
            acc.byStatus[device.status] = (acc.byStatus[device.status] || 0) + 1;
        return acc;
    }, {byType: {}, byStatus: {}})
    console.log(stats)
    const totalLaptops = stats.byType.Laptop ? stats.byType.Laptop : 0
    const availableLaptops = stats.byStatus.available ? stats.byStatus.available : 0
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
// async function searchResults(event, container, url, renderItem){
//     const query = event.target.value
//     if (query.length === 0) {
//         container.innerHTML = ''
//         container.style.display = 'none'
//         return
//     }
//     const response = await fetch(`${url}?query=${query}`)
//     if (!response.ok) {
//         alert("An error has occured while fetching results")
//         return
//     }
//     container.style.display = 'flex'
//     const items = await response.json()
//     let body = ``
//     items.forEach((item) => {
//         const attrs = Object.entries(item)
//             .map(([key, value]) => `data-${key.replace(/_/g, '-')}="${value}"`)
//             .join(' ')
//         body += `<p class="device-item" ${attrs}>${renderItem(item)}</p>`
//     })
//     container.innerHTML = body
// }

        // const cancelDeviceBtn = document.getElementById('cancel-device');
        // const deviceForm = document.getElementById('new-device-form');

        // cancelDeviceBtn.addEventListener("click", () => {
        //     modal.classList.remove('open');
        //     deviceForm.reset();
        // })

        // deviceForm.addEventListener("submit", async (event) => {
        //     event.preventDefault();

        //     const formData = new FormData(deviceForm);
        //     const payload = Object.fromEntries(formData.entries())
        //     try {
        //         const response = await fetch('/it/api/devices', {
        //             method: 'POST',
        //             headers: {"Content-Type": "application/json"},
        //             body: JSON.stringify(payload)
        //         })
        //         if (!response.ok) {
        //             throw new Error("Failed to add new device")
        //         }
        //         modal.classList.remove('open')
        //         deviceForm.reset();
        //         window.location.reload();
        //     } catch (err) {
        //         alert("Could not connect to the database correctly")
        //     }
        // })
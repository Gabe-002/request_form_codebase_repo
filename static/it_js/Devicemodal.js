// Shared "+ Add Device" modal.
// Used by both the dashboard and devices views so the markup and behaviour live in one place.

export function deviceModalHTML() {
    return `
        <div id="device-modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Add a new device</h3>
                </div>
                <form id="new-device-form" method="POST" action="/it/api/devices">
                    <label>Asset Number
                        <input type="text" id="asset_number" name="asset_number" required placeholder="Add asset number">
                    </label>
                    <label>Serial Number
                        <input type="text" id="serial_number" name="serial_number" required placeholder="Add serial number">
                    </label>
                    <label>Manufacturer
                        <input type="text" id="manufacturer" name="manufacturer" required placeholder="Add manufacturer">
                    </label>
                    <label>Model
                        <input type="text" id="model" name="model" required placeholder="Add model">
                    </label>
                    <label>Purchase Price
                        <input type="value" id="purchase_price" name="purchase_price" placeholder="R...">
                    </label>
                    <label>Order Number
                        <input type="text" id="order_number" name="order_number" placeholder="Add order number">
                    </label>
                    <label>Asset Type
                        <select name="asset_type">
                            <option value="Laptop">Laptop</option>
                            <option value="Monitor">Monitor</option>
                            <option value="Phone">Phone</option>
                        </select>
                    </label>
                    <label>Status
                        <select name="status">
                            <option value="available">Available</option>
                            <option value="assigned">Assigned</option>
                        </select>
                    </label>
                    <label>Condition Notes
                        <textarea id="condition_notes" name="condition_notes" placeholder="Describe the condition of the asset"></textarea>
                    </label>

                    <div class="form-buttons">
                        <button id="submit-device" type="submit">Add Device</button>
                        <button id="cancel-device" type="button">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    `
}

export function assignDeviceModal() {
    return `
        <div id="assign-modal">
            <form id="new-assign-form">
                <div class="issue-page">
                    <h3>Assign a Device</h3>
                    <h4>Device Info</h4>
                    <div class="asset-search">
                        <label>Asset Number
                            <input type="text" id="new-assign-issue-asset-number" name="asset_number" required>
                            <div id="new-assign-asset-results"></div>
                        </label>
                    </div>
                    <label>Asset Description
                        <input type="text" id="new-assign-issue-model" name="model" required>
                    </label>
                    <label>Serial Number
                        <input type="text" id="new-assign-issue-serial-number" name="serial_number" required>
                    </label>
                    <h4>Transfer Info</h4>
                    <label>Location
                        <input type="text" id="new-assign-location" name="location" required>
                    </label>
                    <div class="user-search">
                        <label>Username
                            <input type="text" id="new-assign-issue-tenant-username" name="issue-tenant-username" required>
                        </label>
                        <div id="new-assign-users-results"></div>
                    </div>
                    <label>Tenant Email
                        <input type="text" id="new-assign-issue-tenant-email" name="issue-tenant-email" required>
                    </label>

                    <div class="review-buttons">
                        <button id="new-assign-confirm-assign" type="submit">Confirm</button>
                        <button id="cancel-assign" type="button">Cancel</button>
                    </div>
                </div>
            </form>
        </div>
    `
}

async function searchResults(event, container, url, renderItem){
    const query = event.target.value
    if (query.length === 0) {
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

// Call this AFTER the view's HTML (including deviceModalHTML()) is in the DOM.
// onAdded runs after a device is saved successfully. Defaults to a full page reload,
// which is what the dashboard did before.
export function initDeviceModal({ onAdded = () => window.location.reload() } = {}) {
    const modal = document.getElementById('device-modal')
    const form = document.getElementById('new-device-form')
    const addDeviceBtn = document.getElementById('add-device')
    const cancelDeviceBtn = document.getElementById('cancel-device')

    addDeviceBtn.addEventListener('click', () => {
        modal.classList.toggle('open')
    })

    cancelDeviceBtn.addEventListener('click', () => {
        modal.classList.remove('open')
        form.reset()
    })

    form.addEventListener('submit', async (event) => {
        event.preventDefault()

        const payload = Object.fromEntries(new FormData(form).entries())
        try {
            const response = await fetch('/it/api/devices', {
                method: 'POST',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            })
            if (!response.ok) {
                throw new Error("Failed to add new device")
            }
            modal.classList.remove('open')
            form.reset()
            await onAdded()
        } catch (err) {
            alert("Could not connect to the database correctly")
        }
    })
}

export function initAssignModal() {
    const modal = document.getElementById('assign-modal')
    const newAssignmentBtn = document.getElementById('new-assignment')
    const confirmAssignmentBtn = document.getElementById('new-assign-confirm-assign')
    const cancelAssignmentBtn = document.getElementById('cancel-assign')

    const newAssignmentForm = document.getElementById('new-assign-form')

    const deviceSearchBar = document.getElementById('new-assign-issue-asset-number')
    const deviceResults = document.getElementById('new-assign-asset-results')
    deviceResults.style.display = 'none'

    const userSearchBar = document.getElementById('new-assign-issue-tenant-username')
    const userResults = document.getElementById('new-assign-users-results')
    userResults.style.display = 'none'

    newAssignmentBtn.addEventListener('click', () => {
        modal.classList.toggle('open')
    })
    cancelAssignmentBtn.addEventListener('click', () => {
        modal.classList.remove('open')
        modal.querySelectorAll('input').forEach(input => {
            input.value = ""
        })
    })

    deviceSearchBar.addEventListener('input', (event) => {
        searchResults(event, deviceResults, `/it/api/query/devices`, (device)=> `${device.asset_number} - ${device.manufacturer} ${device.model}`)
    })

    userSearchBar.addEventListener('input', (event) => {
        searchResults(event, userResults, `/it/api/query/users`, (user)=> `${user.display_name}`)
    })

    deviceResults.addEventListener('click', (event) => {
        const item = event.target.closest('.device-item')

        const assetNumber = document.getElementById('new-assign-issue-asset-number')
        const modelNumber = document.getElementById('new-assign-issue-model')
        const serialNumber = document.getElementById('new-assign-issue-serial-number')

        assetNumber.value = item.dataset.assetNumber
        modelNumber.value = `${item.dataset.manufacturer} ${item.dataset.model}`
        serialNumber.value = item.dataset.serialNumber

        deviceResults.dataset.deviceId = item.dataset.id
        deviceResults.style.display = 'none'
    })

    userResults.addEventListener('click', (event) => {
        const item = event.target.closest('.device-item')

        const username = document.getElementById("new-assign-issue-tenant-username")
        const email = document.getElementById("new-assign-issue-tenant-email")

        username.value = item.dataset.displayName
        email.value = item.dataset.email

        userResults.dataset.userId = item.dataset.id
        userResults.style.display = 'none'
    })

    newAssignmentForm.addEventListener('submit', async (event) => {
        event.preventDefault()
        const formData = new FormData(newAssignmentForm)
        const data = Object.fromEntries(formData)

        const tenant_id = document.getElementById('new-assign-users-results').dataset.userId
        const device_id = document.getElementById('new-assign-asset-results').dataset.deviceId
        const location = data.location

        const assignmentInfo = {
            device_id,
            tenant_id,
            location
        }
        console.log(assignmentInfo)
        const response = await fetch(`/it/api/assign`, {
            headers: {"Content-Type": "application/json"},
            method: "POST",
            body: JSON.stringify(assignmentInfo)
        })
        if (!response.ok) {
            alert("Could not correctly assign the device")
            window.location.reload()
        }
        window.location.reload()
    })
}
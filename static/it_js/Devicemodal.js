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
            <div class="issue-page">
                <h3>Assign a Device</h3>
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
                    <button id="confirm-assign" type="button">Confirm</button>
                    <button id="cancel-assign" type="button">Cancel</button>
                </div>
            </div>
        </div>
    `
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
    const cancelAssignmentBtn = document.getElementById('cancel-assign')
    newAssignmentBtn.addEventListener('click', () => {
        modal.classList.toggle('open')
    })
    cancelAssignmentBtn.addEventListener('click', () => {
        modal.classList.remove('open')
        modal.querySelectorAll('input').forEach(input => {
            input.value = ""
        })
    })
}
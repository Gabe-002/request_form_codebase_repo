import { deviceModalHTML, initDeviceModal } from "../Devicemodal.js";

export const devicesView = {
    async mount(container) {
        container.innerHTML = `
            <div class="dashboard-header">
                <div class="site-heading">
                <h2>Devices Panel</h2>
                <p>Manage devices</p>
                </div>
                <div class="quick-buttons">
                    <button id="add-device" type="button">+ Add Device</button>
                </div>
            </div>

            ${deviceModalHTML()}
            ${deviceModalInfo()}

            <div>
                <div class="search-options" id="search-options">
                    <input id="device-search">
                    <button id="all-devices" class="selected" data-status="all">All</button>
                    <button id="allocated-devices" data-status="allocated">Allocated</button>
                    <button id="free-devices" data-status="free">Free</button>
                </div>
            </div>
            <div class="table-container" id="table-container">
                <div class="table-row table-header">
                    <div>Device</div>
                    <div>Asset Type</div>
                    <div>Site</div>
                    <div>Status</div>
                </div>

                <template id="row-template">
                    <div class="table-row">
                        <div class="asset_number"></div>
                        <div class="assignee">-</div>
                        <div class="site">Storage</div>
                        <div class="status"></div>
                    </div>
                </template>
            </div>
        `;

        const buttons = document.querySelectorAll('.search-options button')
        monitorButtons(buttons);

        // Wire up the modal first so it still works if loading the table fails.
        // After a successful add we re-fetch the rows instead of reloading the page.
        initDeviceModal({ onAdded: refreshDevices })


        await refreshDevices()
        await openDeviceModal()
    }
}

async function refreshDevices() {
    const deviceResponse = await fetch(`/it/api/devices`)
    if (!deviceResponse.ok) {
        alert("Could not load in the devices")
        return
    }
    const devices = await deviceResponse.json()
    console.log(devices)

    // Clear existing rows (keeps the header; the <template> content isn't matched by this query)
    document.querySelectorAll('#table-container .table-row:not(.table-header)')
        .forEach(row => row.remove())

    loadDevices(document.getElementById('row-template'), devices)
}

function monitorButtons(buttons) {
    const searchOptions = document.getElementById("search-options")
    searchOptions.addEventListener('click', (event) => {
        if (!event.target.matches('button')) return
        buttons.forEach(btn => btn.classList.remove('selected'))
        event.target.classList.add('selected')
    })
}

function loadDevices(template, devices) {
    const rowContainer = document.getElementById('table-container')
    devices.forEach(device => {
        const item = template.content.cloneNode(true)
        item.querySelector('.table-row').dataset.deviceId = device.id
        item.querySelector('.asset_number').textContent = device.asset_number
        item.querySelector('.status').textContent = device.status
        if (device.asset_type) {
            item.querySelector('.assignee').textContent = device.asset_type
        }
        if (device.site) {
            item.querySelector('.site').textContent = device.site
        }

        if (device.status === "available") {
            item.querySelector('.status').classList.add('free')
        } else if (device.status === "assigned") {
            item.querySelector('.status').classList.add('allocated')
        }
        rowContainer.appendChild(item)
    })
}

async function openDeviceModal() {
    document.getElementById('table-container').addEventListener('click', async (event) => {
        if (!event.target.closest('.table-row')) return
        const deviceRow = event.target.closest('.table-row')
        if (!deviceRow.dataset.deviceId) return

        const response = await fetch(`/it/api/get/device?query=${encodeURIComponent(deviceRow.dataset.deviceId)}`)
        if (!response.ok) {
            alert("Could not load the device information")
            return
        }
        const deviceInfo = await response.json()
        deviceModalFillInfo(deviceInfo)
        const modal = document.getElementById('device-info-modal')
        modal.classList.toggle('open')
    })
}

function deviceModalFillInfo(deviceInfo) {
    document.getElementById('modal-device-asset-number').textContent = deviceInfo.asset_number ?? '-';
    document.getElementById('modal-device-asset-type').textContent = deviceInfo.asset_type ?? '-';
    document.getElementById('modal-device-manufacturer').textContent = deviceInfo.manufacturer ?? '-';
    document.getElementById('modal-device-model').textContent = deviceInfo.model ?? '-';
    document.getElementById('modal-device-serial-number').textContent = deviceInfo.serial_number ?? '-';
    document.getElementById('modal-device-purchase-price').textContent = deviceInfo.purchase_price ?? '-';
    document.getElementById('modal-device-location').textContent = deviceInfo.location ?? '-';
    document.getElementById('modal-device-condition-notes').textContent = deviceInfo.condition_notes !== '' ? deviceInfo.condition_notes : '-';
}
    
function deviceModalInfo() {
    return `
        <div id="device-info-modal">
            <div class="modal-content">

                <div class="modal-header">
                    <h3>Device Info</h3>
                </div>

                <div class="info-list">
                    <div class="info-field">
                        <span class="info-label">Asset Number</span>
                        <span class="info-value" id="modal-device-asset-number">-</span>
                    </div>
                </div>

                <div class="info-list">
                    <div class="info-field">
                        <span class="info-label">Asset Type</span>
                        <span class="info-value" id="modal-device-asset-type">-</span>
                    </div>
                </div>

                <div class="info-list">
                    <div class="info-field">
                        <span class="info-label">Manufacturer</span>
                        <span class="info-value" id="modal-device-manufacturer">-</span>
                    </div>
                </div>

                <div class="info-list">
                    <div class="info-field">
                        <span class="info-label">Model</span>
                        <span class="info-value" id="modal-device-model">-</span>
                    </div>
                </div>


                <div class="info-list">
                    <div class="info-field">
                        <span class="info-label">Serial Number</span>
                        <span class="info-value" id="modal-device-serial-number">-</span>
                    </div>
                </div>


                <div class="info-list">
                    <div class="info-field">
                        <span class="info-label">Purchase Price</span>
                        <span class="info-value" id="modal-device-purchase-price">-</span>
                    </div>
                </div>


                <div class="info-list">
                    <div class="info-field">
                        <span class="info-label">Location</span>
                        <span class="info-value" id="modal-device-location">-</span>
                    </div>
                </div>

                <div class="info-list">
                    <div class="info-field">
                        <span class="info-label">Condition Notes</span>
                        <span class="info-value" id="modal-device-condition-notes">-</span>
                    </div>
                </div>

                <div class="form-buttons">
                    <button id="update-status" class="button-format" type="button">Update Status</button>
                    <button id="device-history" class="button-format" type="button">Device History</button>
                    <button id="cancel-device-info-view" class="button-format" type="button">Cancel</button>
                </div> 

            </div>
        </div>
    `
}
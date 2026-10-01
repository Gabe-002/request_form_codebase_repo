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
        const deviceResponse = await fetch(`/it/api/devices`)
        if (!deviceResponse.ok){
            alert("Could not load in the devices")
            return
        }
        const devices = await deviceResponse.json()
        console.log(devices)
        loadDevices(document.getElementById('row-template'), devices)
    }
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

// <div class="asset_number"></div>
// <div class="assignee">-</div>
// <div class="site">Storage</div>
// {/* <div class="status"></div> */}
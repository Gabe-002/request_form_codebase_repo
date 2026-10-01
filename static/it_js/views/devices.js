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
                    <button id="all-devices" class="selected">All</button>
                    <button id="allocated-devices">Allocated</button>
                    <button id="free-devices">Free</button>
                </div>
            </div>
            <div class="table-container">
                <div class="table-row table-header">
                    <div>Device</div>
                    <div>Assignee</div>
                    <div>Site</div>
                    <div>Status</div>
                </div>

                <template id="">
                    <div class="table-row">
                        <div class="asset_number"></div>
                        <div class="assignee"></div>
                        <div class="site"></div>
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
        if(devices['site']) {
            console.log("This shit works somehow")
        }
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
    const item = template.content.cloneNode(true)
    
}
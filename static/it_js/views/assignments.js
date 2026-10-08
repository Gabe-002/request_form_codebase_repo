export const assignmentsView = {
    async mount(container) {
        container.innerHTML = `
            <div class="dashboard-header">
                <div class="site-heading">
                    <h2>Assignments Panel</h2>
                    <p>View device assignments</p>
                </div>
                <div class="quick-buttons">
                    <button id="new-assignment" type="button">+ New Assignment</button>
                </div>
            </div>

            <div>
                <div class="search-options" id="search-options">
                    <input id="assignment-search" placeholder="Search by name, device or site">
                </div>
            </div>
            <div class="table-container" id="table-container">
                <div class="table-row table-header">
                    <div>Name</div>
                    <div>Device</div>
                    <div>Site</div>
                    <div>Assignment Date</div>
                </div>

                <template id="row-template">
                    <div class="table-row">
                        <div class="assignment-name"></div>
                        <div class="asset_number"></div>
                        <div class="site">-</div>
                        <div class="assignment-date">-</div>
                    </div>
                </template>
            </div>
        `;

        monitorSearch()

        // TODO: wire up your assignment modal here when it's ready
        // document.getElementById('new-assignment').addEventListener('click', openAssignModal)

        // await refreshAssignments()
    }
}

let allAssignments = []

async function refreshAssignments() {
    const response = await fetch(`/it/api/assignments`)
    if (!response.ok) {
        alert("Could not load in the assignments")
        return
    }
    allAssignments = await response.json()
    renderAssignments(filterAssignments())
}

function monitorSearch() {
    const searchInput = document.getElementById('assignment-search')
    searchInput.addEventListener('input', () => {
        renderAssignments(filterAssignments())
    })
}

function filterAssignments() {
    const query = document.getElementById('assignment-search').value.trim().toLowerCase()
    if (!query) return allAssignments

    return allAssignments.filter(a =>
        [a.name, a.asset_number, a.site]
            .some(value => value && String(value).toLowerCase().includes(query))
    )
}

function renderAssignments(assignments) {
    // Clear existing rows (keeps the header and the <template>)
    document.querySelectorAll('#table-container .table-row:not(.table-header)')
        .forEach(row => row.remove())

    loadAssignments(document.getElementById('row-template'), assignments)
}

function loadAssignments(template, assignments) {
    const rowContainer = document.getElementById('table-container')
    assignments.forEach(assignment => {
        const item = template.content.cloneNode(true)
        item.querySelector('.assignment-name').textContent = assignment.name
        item.querySelector('.asset_number').textContent = assignment.asset_number

        if (assignment.site) {
            item.querySelector('.site').textContent = assignment.site
        }
        if (assignment.assigned_at) {
            item.querySelector('.assignment-date').textContent = formatDate(assignment.assigned_at)
        }

        rowContainer.appendChild(item)
    })
}

function formatDate(value) {
    const date = new Date(value)
    if (isNaN(date)) return value
    return date.toLocaleDateString('en-ZA', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    })
}
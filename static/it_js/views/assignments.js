import { Modal, InfoModal } from "../modal.js";

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
            </div>
            
            <div id="tables-section">
            </div>

            <template id="row-template">
                <div class="table-row">
                    <div class="assignment-name"></div>
                    <div class="asset_number"></div>
                    <div class="site">-</div>
                    <div class="assignment-date">-</div>
                </div>
            </template>
            
            <template id="table-section">
                <h3 class="table-section-heading"></h3>
                <div class="table-container">

                </div> 
            </template>
        `;
        monitorSearch()
        tableMonitor()
        await refreshAssignments()
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
    console.log(allAssignments)
    renderAssignments(filterAssignments())
}

function refreshExistingAssignments() {
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

    const results = allAssignments.filter(assignment =>
        [assignment.display_name, assignment.asset_number]
        .some(value => String(value).toLowerCase().includes(query))
    )
    return results
}

// !!!!!! You have to come back and fix this piece of shit function
function renderAssignments(assignments) {
    const collator = new Intl.Collator(undefined, {numeric: true, sensitivity: "case"})
    const alphabeticalLetters = new Set()

    const surname = (name) => name.split(/\s+/).pop()
    const surnameLetter = (name) => surname(name).charAt(0)

    if (assignments.length === 1) {
        alphabeticalLetters.add(surnameLetter(assignments[0].display_name))
    } else {
        assignments.sort((a, b) => {
            alphabeticalLetters.add(surnameLetter(a.display_name))
            return collator.compare(surname(a.display_name), surname(b.display_name));
        })
    }

    const alphabeticalOrder = new Set([...alphabeticalLetters].sort((a, b) => collator.compare(a, b)))
    const orderedAssignments = {}
    alphabeticalOrder.forEach(letter => {
        orderedAssignments[letter] = assignments.filter((assignment) => 
            surnameLetter(assignment.display_name) === letter
        )
    })

    document.getElementById('tables-section').replaceChildren()
    document.querySelectorAll('#table-container .table-row:not(.table-header)')
        .forEach(row => row.remove())

    loadAssignments(document.getElementById('row-template'), orderedAssignments)
}

function loadAssignments(template, assignments) {

    const tablesSection = document.getElementById('tables-section')

    for (const [key, value] of Object.entries(assignments)) {

        const tableTemplate = document.getElementById('table-section')
        const tableItem = tableTemplate.content.cloneNode(true)


        const heading = document.createElement('h3');
        heading.textContent = key;
        tableItem.querySelector('.table-section-heading').appendChild(heading)


        value.forEach(assignment => {
            const item = template.content.cloneNode(true)
            item.querySelector('.assignment-name').textContent = assignment.display_name
            item.querySelector('.asset_number').textContent = assignment.asset_number

            if (assignment.location) {
                item.querySelector('.site').textContent = assignment.location
            }
            if (assignment.allocated_at) {
                item.querySelector('.assignment-date').textContent = formatDate(assignment.allocated_at)
            }
            item.querySelector('.table-row').dataset.assignmentId = assignment.id

            tableItem.querySelector('.table-container').appendChild(item)
        })

        tablesSection.appendChild(tableItem)
    }
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

async function onClickDeallocate(assignmentId, row, modal) {
    const confirmation = confirm("Do you want to deallocate this assignment?")
    if (!confirmation)
        return
    const response = await fetch(`/it/api/deallocate/${assignmentId}`, {
        method: "POST"
    })
    if (!response.ok) {
        alert("Could not deallocate the device correctly")
        return
    }
    
    const assignmentIndex = allAssignments.findIndex(assignmnet => assignmnet.id === Number(assignmentId))
    if (assignmentIndex !== -1) {
        allAssignments.splice(Number(assignmentIndex), 1)
        console.log("We cut that shit")
    }

    row.remove();
    modal.close();

    document.getElementById('assignment-search').value = '';
    refreshExistingAssignments();
}

function tableMonitor() {
    document.getElementById('tables-section').addEventListener('click', async (event) => {
        const row = event.target.closest('.table-row:not(.table-header)');
        if (!row) return;

        const assignmentId = row.dataset.assignmentId;

        const response = await fetch(`/it/api/get/assignment?query=${encodeURIComponent(assignmentId)}`);
        if (!response.ok) {
            alert("Could not load the assignment info");
            return;
        }
        const assignmentInfo = await response.json();

        const newModal = new InfoModal(
            'Assignment Info',
            {
                fields: [
                    {label: "Name", key: "display_name"},
                    {label: "Email", key: "email"},
                    {label: "Device", key: "asset_number"},
                    {label: "Asset Type", key: "asset_type"},
                    {label: "Location", key: "location"},
                    {label: "Assignmnet Date", key: "allocated_at"}
                ],
                buttons: [
                    {label: 'Deallocate', onClick: () => onClickDeallocate(assignmentId, row, newModal)},
                    {label: 'Transfer', onClick: () => {console.log('Transfer')}}
                ]
            }
        )
        // newModal.addButton('Deallocate', () => onClickDeallocate(assignmentId, row, newModal));
        // newModal.addButton('Transfer', () => {console.log('Transfer')});
        newModal.appendInfo(assignmentInfo);
        newModal.open();
    })
}
/* ==================
GELOS TASK MANAGER
Author: George Wu
================ */
//-----------------------
// 1. Global Data Store
//-----------------------
//Array that will hold every task the user adds
//Each task is an object: { name, dueDate, priority, consultant, completed}
/** 
* @typedef {Object} Task
* @property {string} name - Task name
* @property {string} dueDate - ISO date string from <input type="date">, e.g. "2026-05-22"
* @property {string} priority - One of "Low", "Medium", "High" from <select>
* @property {string} consultant - Full name resolved from roles.txt via binary search
*                                 Set to "None" if the user left the role field blank
* @property {boolean} completed - false when added, toggled true by the complete button.
 */
/**
 * @typedef {Object} Role
 * @property {string} role - The Job Title, e.g. "Marketing Manager"
 * @property {string} name - The staff members full name. e.g. "George Wu"
 */
let tasks = [];

//Array that will hold the parsed staff roles from roles.txt
// Each entry: { role, name }

let roles = [];

//-----------------------
// 1b. Task Factory
//-----------------------
/** 
 * Construct a properly-shaped task object from the four form fields.
 * This is the single source of truth for task structure - every part
 * of the app builds tasks through here so the shape is consistent
 * 
 * @param {string} name - Task name (must be non-empty; validated upstresam)
 * @param {string} dueDate - ISO date string from <input type="date">.
 * @param {string} priority - One of "Low", "Medum", "High".
 * @param {string} consultant - Full name from binary search results, or "" if blank.
 * @returns {Task} A new task object with completed = false.
*/

function createTask(name, dueDate, priority, consultant) {
    return {
        name: name,
        dueDate: dueDate,
        priority: priority,
        consultant: consultant || "None",
        completed: false
    };
}

//-----------------------
// 1d. Dark Mode Theme Toggle
//-----------------------
/**
 * Apply the user's saved theme preference (if any) before render.
 * Called once at the top of init() so the page never flashes light
 * mode for a dark-mode user.
 */
function applySavedTheme() {
    const saved = localStorage.getItem("ge-theme");
    if (saved === "dark") {
        document.documentElement.setAttribute("data-theme", "dark");
    }
}

/**
 * Wire the dark-mode toggle button (present on every page in the nav).
 * On click: flip data-theme on <html>, persist to localStorage, swap icon.
 */
function initThemeToggle() {
    const toggle = document.getElementById("themeToggle");
    if (!toggle) return;

    updateThemeIcon(toggle);

    toggle.addEventListener("click", function () {
        const isDark = document.documentElement.getAttribute("data-theme") === "dark";
        if (isDark) {
            document.documentElement.removeAttribute("data-theme");
            localStorage.setItem("ge-theme", "light");
        } else {
            document.documentElement.setAttribute("data-theme", "dark");
            localStorage.setItem("ge-theme", "dark");
        }
        updateThemeIcon(toggle);
    });
}

/**
 * Update the toggle button's icon and accessibility label to match
 * the current theme. Sun (☀) = "click to go light"; Moon (☽) = "click to go dark".
 *
 * @param {HTMLElement} toggle - The toggle button element.
 */
function updateThemeIcon(toggle) {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    toggle.textContent = isDark ? "☀" : "☽";
    const label = isDark ? "Switch to light theme" : "Switch to dark theme";
    toggle.setAttribute("aria-label", label);
    toggle.setAttribute("title", label);
}

//-----------------------
// 1e. Mobile Nav Toggle
//-----------------------
/**
 * Wire the hamburger button to show/hide the mobile nav menu.
 * Toggles a "show" class on #mainNav; CSS handles the actual visibility
 * via the @media (max-width: 768px) #mainNav.show rule.
 *
 * Also updates aria-expanded for screen readers and auto-closes the menu
 * when a nav link is clicked (mobile UX expectation).
 */
function initNavbarToggle() {
    const navToggle = document.getElementById("navToggle");
    const mainNav   = document.getElementById("mainNav");
    if (!navToggle || !mainNav) return;

    navToggle.addEventListener("click", function () {
        const isOpen = mainNav.classList.toggle("show");
        navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    // Close menu when a nav link inside it is clicked (mobile only).
    const links = mainNav.querySelectorAll("a");
    for (let i = 0; i < links.length; i++) {
        links[i].addEventListener("click", function () {
            if (window.innerWidth <= 768) {
                mainNav.classList.remove("show");
                navToggle.setAttribute("aria-expanded", "false");
            }
        });
    }
}

//-----------------------
// 1c. DEBUG HELPER
//-----------------------
/**
 * Wipe the tasks arary. Used only for testing in the Devtools console.
 * Not wired to any UI control - call manually: clearAllTasks()
 * 
 * Demonstrates a function with no parameters and no return value
 * (implicitly returns undefined).
 */
function clearAllTasks() {
    tasks.length = 0;
}
//-----------------------
// 2. Insertion algorithm
//-----------------------
/**
 * Insertion algorithm - append a task to the end of the tasks array.
 * Brief requires a manual algorithm; we do NOT use Array.prototype.push.
 * 
 * Steps:
 * 1. Calculate the next free index (= current array length)
 * 2. Assign the new task at that index
 * 3. The .length property auuto-updates because JS arrays track length.
 * 
 * Time complexity: 0(1) - Single index assignment.
 * Space complexity: 0(1) - no temporary structures.
 * 
 * @param {Task} newTask - The task object to insert
 * @returns {number} The new length of the tasks array.
 */
function insertTask(newTask) {
    const insertAt = tasks.length;
    tasks[insertAt] = newTask;
    return tasks.length;
}

//-----------------------
//3. Form Validation
//-----------------------
/** 
 * Validate the Add Task form fields.
 * Returns true if all required fields are filled; false otherwise.
 * Toggle error messages on each fields sibling .form-error div.
 * 
 * @returns {boolean} True if valid, false if any required field is empty.
 * 
 */

function validateTaskForm() {
    const nameInput = document.getElementById("taskName");
    const dueDateInput = document.getElementById("dueDate");
    const priorityInput = document.getElementById("priority");
    let isValid = true;
    // Check Task Name - trim to reject whitespace-only input
    if (!nameInput.value.trim()) {
        nameInput.nextElementSibling.style.display = "block";
        isValid = false;
    } else {
        nameInput.nextElementSibling.style.display = "none"; // Hide error if name is valid     
    }
    // Check Due Date
    if (!dueDateInput.value) {
        dueDateInput.nextElementSibling.style.display = "block";
        isValid = false;
    } else {
        dueDateInput.nextElementSibling.style.display = "none"; // Hide error if date is valid
    }
    // Check Priority
    if (!priorityInput.value) {
        priorityInput.nextElementSibling.style.display = "block";
        isValid = false;
    } else {
        priorityInput.nextElementSibling.style.display = "none"; // Hide error if priority is valid
    }
    return isValid;
}
//-----------------------
// 4. Add Task Handler
//-----------------------
/** 
 * Handle the Add Task Form submission.
 * 1. Prevent the browsers default form POST/reload behaviour.
 * 2. Validate the form - bail if invalid.
 * 3. Read field values.
 * 4. Build a Task object via the factory.
 * 5. Insert into the tasks array via the insertion algorithm
 * 6. Reset the form for the next entry.
 * 
 * (rendering to the table will be wired in Sector 9 once we have loops) 
 *
 * @param {Event} e - The submit event from the form
 * 
 */
 
function handleAddTask(e) {
    e.preventDefault();
    if (!validateTaskForm()) {
        return; // early return - validation failed, do nothing
    }
    const name = document.getElementById("taskName").value.trim();
    const dueDate = document.getElementById("dueDate").value;
    const priority = document.getElementById("priority").value;
    // Look up consultant via binary search on the sorted roles array.
    // If the role exists, store the canonical name from roles.txt.
    // If the user typed something not in the list, keep their input verbatim.
    const consultantInput = document.getElementById("roles").value.trim();
    let consultant = "";
    if (consultantInput) {
        const lookup = binarySearch(roles, consultantInput);
        consultant = lookup || consultantInput;
    }
    const newTask = createTask(name, dueDate, priority, consultant);

    insertTask(newTask);
    e.target.reset();
    console.log("Task added, Total tasks:", tasks.length, tasks);
    renderTasks();
}
//-----------------------
// 4b. Contact Form Handler
//-----------------------
/**
 * Validate the contact form fields. Returns true if valid, false otherwise.
 * Toggles .form-error sibling divs the same way validateTaskForm does.
 *
 * @param {HTMLFormElement} form - The contact form element.
 * @returns {boolean} True if all required fields are valid.
 */
function validateContactForm(form) {
    const name     = document.getElementById("contactName");
    const email    = document.getElementById("contactEmail");
    const comments = document.getElementById("contactComments");
    let isValid = true;

    if (!name.value.trim()) {
        name.nextElementSibling.style.display = "block";
        isValid = false;
    } else {
        name.nextElementSibling.style.display = "none";
    }

    // Basic email pattern — must contain @ and a dot after it.
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.value.trim() || !emailPattern.test(email.value)) {
        email.nextElementSibling.style.display = "block";
        isValid = false;
    } else {
        email.nextElementSibling.style.display = "none";
    }

    if (!comments.value.trim()) {
        comments.nextElementSibling.style.display = "block";
        isValid = false;
    } else {
        comments.nextElementSibling.style.display = "none";
    }

    return isValid;
}

/**
 * Handle the contact form submission.
 *   1. preventDefault stops the browser's default form POST.
 *   2. Validate — bail if invalid.
 *   3. Reset the form for any future message.
 *   4. Show the success dialog modal (native <dialog> element).
 *
 * @param {Event} e - The submit event from the form.
 */
function handleContactSubmit(e) {
    e.preventDefault();

    if (!validateContactForm(e.target)) {
        return;
    }

    e.target.reset();

    const dialog = document.getElementById("contactSuccessDialog");
    if (dialog && typeof dialog.showModal === "function") {
        dialog.showModal();
    } else if (dialog) {
        // Fallback for ancient browsers that don't support <dialog>
        dialog.setAttribute("open", "");
    }
}
//-----------------------
// 5. Deletion Algorithm
//-----------------------
/**
 * Deletion algorithm — remove the task at the given index from tasks.
 * Brief requires a manual algorithm; we do NOT use Array.prototype.splice.
 *
 * Steps:
 *   1. Validate the index is in range [0, tasks.length - 1].
 *   2. Shift every element after the target one position to the left.
 *   3. Truncate the array length by 1 to drop the (now duplicated) tail.
 *
 * Time complexity:  O(n) — worst case, every element after index 0 moves.
 * Space complexity: O(1) — in-place shift, no temporary array.
 *
 * @param {number} index - The array index of the task to delete.
 * @returns {boolean} True if a task was deleted, false if index out of range.
 */
function deleteTask(index) {
    if (index < 0 || index >= tasks.length) {
        return false;
    }
    for (let j = index; j < tasks.length - 1; j++) {
        tasks[j] = tasks[j + 1];
    }
    tasks.length = tasks.length - 1;
    return true;
}

//-----------------------
// 6. Complete Toggle
//-----------------------
/**
 * Toggle the completed state of the task at the given index.
 * Used by the Complete/Undo button in each rendered row.
 *
 * @param {number} index - The array index of the task to toggle.
 * @returns {boolean} The new completed state, or undefined if out of range.
 */
function completeTask(index) {
    if (index < 0 || index >= tasks.length) {
        return undefined;
    }
    tasks[index].completed = !tasks[index].completed;
    return tasks[index].completed;
}
//-----------------------
// 7. Render Tasks
//-----------------------
/**
 * Render the entire tasks array into the #taskBody table body.
 * Clears existing rows and rebuilds. Toggles the "No tasks" empty-state
 * paragraph based on whether the array has any entries.
 *
 * Uses a classic for loop because we need the index `i` for the
 * Complete and Delete button onclick attributes.
 *
 * Time complexity: O(n) — one row built per task.
 */
function renderTasks() {
    const tbody  = document.getElementById("taskBody");
    const empty  = document.getElementById("noTasks");
    if (!tbody) return;   // not on tasks.html — bail safely

    // Wipe existing rows
    tbody.innerHTML = "";

    // Toggle the empty-state message
    if (tasks.length === 0) {
        if (empty) empty.style.display = "block";
        return;
    }
    if (empty) empty.style.display = "none";

    // Build a row per task
    for (let i = 0; i < tasks.length; i++) {
        const { name, dueDate, priority, consultant, completed } = tasks[i];
        const row = document.createElement("tr");

        if (completed) {
            row.classList.add("task-completed");
        }

        row.innerHTML =
            "<td>" + escapeHtml(name) + "</td>" +
            "<td>" + dueDate + "</td>" +
            "<td>" + priority + "</td>" +
            "<td>" + escapeHtml(consultant) + "</td>" +
            "<td>" +
                "<button type='button' onclick='handleCompleteClick(" + i + ")'>" +
                    (completed ? "Undo" : "Complete") +
                "</button> " +
                "<button type='button' onclick='handleDeleteClick(" + i + ")'>Delete</button>" +
            "</td>";

        tbody.appendChild(row);
    }
}

/**
 * Escape HTML special characters to prevent XSS via task names or
 * consultant strings that contain markup.
 *
 * @param {string} text - Raw text from user input.
 * @returns {string} Escaped text safe for innerHTML insertion.
 */
function escapeHtml(text) {
    if (!text) return "";
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

/**
 * Button click handler for Complete/Undo — invoked from inline onclick.
 * Toggles state and re-renders.
 */
function handleCompleteClick(index) {
    completeTask(index);
    renderTasks();
}

/**
 * Button click handler for Delete — invoked from inline onclick.
 * Removes the task and re-renders.
 */
function handleDeleteClick(index) {
    deleteTask(index);
    renderTasks();
}


//-----------------------
// 8a. Sequential Search Algorithm
//-----------------------
/**
 * Sequential search — find a task by exact name match (case-insensitive).
 * Brief requires a manual algorithm; we do NOT use Array.prototype.indexOf
 * or .find or .includes.
 *
 * Walks the tasks array element by element. Returns the index of the
 * first match, or -1 if no task matches. The early return on match
 * keeps the average case below the O(n) worst case.
 *
 * Time complexity:  O(n) — worst case, scans the whole array.
 * Space complexity: O(1) — no temporary structures.
 *
 * @param {string} query - The task name to search for (case-insensitive).
 * @returns {number} Index of the first matching task, or -1 if not found.
 */
function sequentialSearch(query) {
    const q = query.toLowerCase();
    for (let i = 0; i < tasks.length; i++) {
        if (tasks[i].name.toLowerCase() === q) {
            return i;
        }
    }
    return -1;
}
//-----------------------
// 8b. Binary Search Algorithm
//-----------------------
/**
 * Binary search — find a role in the sorted roles array and return the
 * matched consultant's name. Brief requires a manual algorithm.
 *
 * Requires the input array to be SORTED by .role (case-insensitive).
 * We sort once after loading roles.txt — see loadRoles() in Section 8c.
 *
 * Iteratively halves the search window:
 *   - mid = Math.floor((low + high) / 2)
 *   - If sortedArr[mid].role === query → return the name (found)
 *   - If sortedArr[mid].role <  query → search upper half (low = mid + 1)
 *   - If sortedArr[mid].role >  query → search lower half (high = mid - 1)
 *
 * Time complexity:  O(log n) — search space halves each iteration.
 * Space complexity: O(1) — only three pointer variables.
 *
 * @param {Role[]} sortedArr - The roles array, sorted by .role.
 * @param {string} query     - The role title to look up.
 * @returns {string|null}    - The consultant's name, or null if not found.
 */
function binarySearch(sortedArr, query) {
    let low  = 0;
    let high = sortedArr.length - 1;
    const q  = query.toLowerCase();

    while (low <= high) {
        const mid    = Math.floor((low + high) / 2);
        const midKey = sortedArr[mid].role.toLowerCase();

        if (midKey === q) {
            return sortedArr[mid].name;
        }
        if (midKey < q) {
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }
    return null;
}
//-----------------------
// 8c. Load Roles
//-----------------------
/**
 * Load the staff roles into the global roles array from window.ROLES_DATA.
 * roles.js (auto-generated from roles.txt and loaded by a <script> tag
 * before app.js on every page) defines window.ROLES_DATA as a pre-sorted
 * array of {role, name} objects.
 *
 * Embedding the data instead of fetching it means the site runs under
 * file:// without needing a local web server — browsers block fetch() of
 * local files under file:// for security reasons.
 *
 * @returns {number} The number of roles loaded into the global roles array.
 */
function loadRoles() {
    // Roles are now embedded in roles.js (auto-generated from roles.txt) and
    // exposed on window.ROLES_DATA. Reading from there means the site works
    // under file:// without needing a local web server (fetch() of local files
    // is blocked by browser CORS policy under file://).
    if (!window.ROLES_DATA || !Array.isArray(window.ROLES_DATA)) {
        console.error("loadRoles: window.ROLES_DATA missing. Check roles.js loads before app.js.");
        return 0;
    }
    // Data is already sorted at generation time, so no runtime sort needed.
    for (let i = 0; i < window.ROLES_DATA.length; i++) {
        roles[roles.length] = window.ROLES_DATA[i];
    }
    console.log("Loaded " + roles.length + " roles.");
    populateRolesDatalist();
    return roles.length;
}

//-----------------------
// 8c2. Populate Roles Datalist
//-----------------------
/**
 * Fill the #rolesList <datalist> with one <option> per loaded role.
 * The browser then provides native filter-as-you-type suggestions
 * in any <input list="rolesList"> field.
 *
 * Each option's value is "Role Title — Person Name" so the user can
 * search by either the role or the person. binarySearch still matches
 * on the role title only (text after — is informational).
 *
 * Called from loadRoles() once parsing completes.
 */
function populateRolesDatalist() {
    const dl = document.getElementById("rolesList");
    if (!dl) return;
    dl.innerHTML = "";
    for (let i = 0; i < roles.length; i++) {
        const opt = document.createElement("option");
        opt.value = roles[i].role;                          // what gets typed into the input
        opt.label = roles[i].role + " — " + roles[i].name;  // what shows in the dropdown
        dl.appendChild(opt);
    }
}

//-----------------------
// 8d. Search Button Handler
//-----------------------
/**
 * Handle the Search button click on tasks.html. Reads the query from
 * #searchInput, runs the sequential-search algorithm, and writes the
 * result (or "Task not found") into #searchResult.
 */
function handleSearch() {
    const inputEl  = document.getElementById("searchInput");
    const resultEl = document.getElementById("searchResult");
    if (!inputEl || !resultEl) return;

    const query = inputEl.value.trim();
    if (!query) {
        resultEl.textContent = "";
        return;
    }

    const idx = sequentialSearch(query);
    if (idx === -1) {
        resultEl.textContent = "Task not found.";
    } else {
        const t = tasks[idx];
        resultEl.textContent =
            "Found: " + t.name +
            " | Due: " + t.dueDate +
            " | Priority: " + t.priority +
            " | Consultant: " + t.consultant +
            (t.completed ? " | COMPLETED" : "");
    }
}
//-----------------------
// 9. Bootstrap
//------------------------
/**
 * Application entry point. Called once the DOM is ready.
 * Wires up event listeners now that the DOM exists.
 */
function init() {
    applySavedTheme();
    console.log("app.js loaded. tasks:", tasks, "roles:", roles);

    const taskForm = document.querySelector(".task-form form");
    if (taskForm) taskForm.addEventListener("submit", handleAddTask);

    const searchBtn = document.getElementById("searchBtn");
    if (searchBtn) searchBtn.addEventListener("click", handleSearch);
    // Contact form (only on contact.html)
    const contactForm = document.getElementById("contactForm");
    if (contactForm) {
        contactForm.addEventListener("submit", handleContactSubmit);
    }

    // Contact success dialog close button
    const contactDialogClose = document.getElementById("contactDialogClose");
    if (contactDialogClose) {
        contactDialogClose.addEventListener("click", function () {
            const d = document.getElementById("contactSuccessDialog");
            if (d && typeof d.close === "function") d.close();
        });
    }
    initThemeToggle();
    initNavbarToggle();  

    loadRoles();
    renderTasks();
}

// Wait until the HTML is fully parsed before running init()
// Without this guard, getElementById() can return null because
// the elements don't exist in the DOM yet when the script runs
document.addEventListener("DOMContentLoaded", init);
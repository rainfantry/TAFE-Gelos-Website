/* ============================================================
   GELOS ENTERPRISES - Task Manager System
   Pure JavaScript (No Bootstrap or External Libraries)
   
   This script handles:
   - Mobile navigation toggle (pure JS)
   - Job/task management (add, delete, complete)
   - Linear search algorithm for finding jobs
   - Form validation (pure JS)
   ============================================================ */

// ------------------------------------------------------------
// 1. GLOBAL DATA STORE
// ------------------------------------------------------------
// Array to store all job objects
// Each job: { name, dueDate, priority, consultant, completed }
var tasks = [];

// ------------------------------------------------------------
// 2. INITIALISATION
// ------------------------------------------------------------
// Wait for DOM to be fully loaded before attaching event listeners
document.addEventListener('DOMContentLoaded', function () {
  
  // Initialise mobile navigation toggle functionality
  initNavbarToggle();
  
  // Initialise task/job form (tasks.html)
  var taskForm = document.getElementById('taskForm');
  if (taskForm) {
    taskForm.addEventListener('submit', handleAddTask);
  }
  
  // Initialise search button (tasks.html)
  var searchBtn = document.getElementById('searchBtn');
  if (searchBtn) {
    searchBtn.addEventListener('click', handleSearch);
  }
  
  // Allow Enter key in search input to trigger search
  var searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();  // Prevent form submission
        handleSearch();      // Run the search
      }
    });
  }
  
  // Initialise contact form (contact.html)
  var contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', handleContactSubmit);
  }
});

// ------------------------------------------------------------
// 3. NAVIGATION FUNCTIONALITY (Pure JS - No Bootstrap)
// ------------------------------------------------------------
/**
 * Initialise the mobile navbar toggle button
 * This replaces Bootstrap's collapse component with pure JS
 */
function initNavbarToggle() {
  var navToggle = document.getElementById('navToggle');
  var mainNav = document.getElementById('mainNav');
  
  if (navToggle && mainNav) {
    navToggle.addEventListener('click', function () {
      // Toggle the 'show' class on the navbar-collapse element
      // This controls visibility via CSS
      var isExpanded = mainNav.classList.toggle('show');
      
      // Update ARIA attributes for accessibility
      navToggle.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
    });
    
    // Close mobile menu when a nav link is clicked
    var navLinks = mainNav.querySelectorAll('.nav-link');
    for (var i = 0; i < navLinks.length; i++) {
      navLinks[i].addEventListener('click', function () {
        // Only close if we're in mobile view (menu is collapsible)
        if (window.innerWidth < 992) {
          mainNav.classList.remove('show');
          navToggle.setAttribute('aria-expanded', 'false');
        }
      });
    }
  }
}

// ------------------------------------------------------------
// 4. TASK/JOB MANAGEMENT
// ------------------------------------------------------------
/**
 * Handle adding a new job from the form
 * Uses manual form validation (no Bootstrap validation classes needed)
 * @param {Event} e - The submit event object
 */
function handleAddTask(e) {
  e.preventDefault();  // Prevent default form submission
  
  var form = e.target;
  var isValid = validateTaskForm(form);
  
  if (!isValid) {
    return;  // Stop if validation fails
  }
  
  // Get values from form inputs
  var name       = document.getElementById('taskName').value.trim();
  var dueDate    = document.getElementById('dueDate').value;
  var priority   = document.getElementById('priority').value;
  var consultant = document.getElementById('consultant').value;
  
  // Create job object
  var task = {
    name:       name,
    dueDate:    dueDate,
    priority:   priority,
    consultant: consultant || 'None',
    completed:  false
  };
  
  // Add to tasks array using push() method
  tasks.push(task);
  
  // Reset form and re-render the table
  form.reset();
  clearFormValidation(form);  // Remove any validation error states
  renderTasks();
}

/**
 * Validate the task form fields
 * Pure JS validation without Bootstrap classes
 * @param {HTMLFormElement} form - The form to validate
 * @returns {boolean} - True if valid, false otherwise
 */
function validateTaskForm(form) {
  var isValid = true;
  
  // Get form fields
  var taskName = document.getElementById('taskName');
  var dueDate  = document.getElementById('dueDate');
  var priority = document.getElementById('priority');
  
  // Validate task name (required)
  if (!taskName.value.trim()) {
    showFieldError(taskName);
    isValid = false;
  } else {
    clearFieldError(taskName);
  }
  
  // Validate due date (required)
  if (!dueDate.value) {
    showFieldError(dueDate);
    isValid = false;
  } else {
    clearFieldError(dueDate);
  }
  
  // Validate priority (required)
  if (!priority.value) {
    showFieldError(priority);
    isValid = false;
  } else {
    clearFieldError(priority);
  }
  
  return isValid;
}

/**
 * Show error state on a form field
 * @param {HTMLElement} field - The input element
 */
function showFieldError(field) {
  field.style.borderColor = '#dc3545';
  field.style.boxShadow = '0 0 0 0.2rem rgba(220, 53, 69, 0.25)';
}

/**
 * Clear error state from a form field
 * @param {HTMLElement} field - The input element
 */
function clearFieldError(field) {
  field.style.borderColor = '';
  field.style.boxShadow = '';
}

/**
 * Clear all validation states from a form
 * @param {HTMLFormElement} form - The form to clear
 */
function clearFormValidation(form) {
  var fields = form.querySelectorAll('.form-control, .form-select');
  for (var i = 0; i < fields.length; i++) {
    clearFieldError(fields[i]);
  }
}

// ------------------------------------------------------------
// 5. RENDERING (Display jobs in the table)
// ------------------------------------------------------------
/**
 * Render all jobs into the HTML table
 * Uses DOM manipulation to create rows dynamically
 */
function renderTasks() {
  var taskBody = document.getElementById('taskBody');
  var noJobs   = document.getElementById('noJobs');
  
  // Clear existing rows
  taskBody.innerHTML = '';
  
  // Show "No Jobs" message if array is empty
  if (tasks.length === 0) {
    if (noJobs) noJobs.style.display = 'block';
    return;
  }
  
  // Hide "No Jobs" message
  if (noJobs) noJobs.style.display = 'none';
  
  // Loop through tasks array and create table rows
  // This is a linear traversal algorithm: O(n) time complexity
  for (var i = 0; i < tasks.length; i++) {
    var task = tasks[i];
    var row  = document.createElement('tr');  // Create new table row
    
    // Add completed class if task is marked complete
    if (task.completed) {
      row.classList.add('task-completed');
    }
    
    // Determine CSS class for priority badge
    var priorityClass = 'badge-' + task.priority.toLowerCase();
    
    // Build row HTML content
    // Using string concatenation for browser compatibility
    row.innerHTML =
      '<td>' + escapeHtml(task.name) + '</td>' +
      '<td>' + task.dueDate + '</td>' +
      '<td><span class="badge ' + priorityClass + '">' + task.priority + '</span></td>' +
      '<td>' + escapeHtml(task.consultant) + '</td>' +
      '<td>' +
        '<button class="btn btn-sm btn-ge-gold me-1" onclick="completeTask(' + i + ')">' +
          (task.completed ? 'Undo' : 'Complete') +
        '</button>' +
        '<button class="btn btn-sm btn-danger" onclick="deleteTask(' + i + ')">Delete</button>' +
      '</td>';
    
    // Append row to table body
    taskBody.appendChild(row);
  }
}

/**
 * Escape HTML special characters to prevent XSS attacks
 * @param {string} text - The text to escape
 * @returns {string} - Escaped text
 */
function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ------------------------------------------------------------
// 6. TASK OPERATIONS (Complete, Delete)
// ------------------------------------------------------------
/**
 * Toggle the completed state of a job
 * @param {number} index - The array index of the job
 */
function completeTask(index) {
  // Validate index is within bounds
  if (index >= 0 && index < tasks.length) {
    // Toggle the boolean value
    tasks[index].completed = !tasks[index].completed;
    // Re-render to show updated state
    renderTasks();
  }
}

/**
 * Delete a job from the array
 * Uses array splice() method to remove element
 * @param {number} index - The array index of the job to delete
 */
function deleteTask(index) {
  // Validate index is within bounds
  if (index >= 0 && index < tasks.length) {
    // Remove 1 element at the specified index
    tasks.splice(index, 1);
    // Re-render to update the table
    renderTasks();
  }
}

// ------------------------------------------------------------
// 7. SEARCH ALGORITHM (Linear Search)
// ------------------------------------------------------------
/**
 * Linear Search Algorithm - Find a job by exact name match
 * 
 * Time Complexity: O(n) - we check each element once in worst case
 * Space Complexity: O(1) - only using a few variables
 * 
 * This performs a case-insensitive comparison
 */
function handleSearch() {
  var searchInput  = document.getElementById('searchInput');
  var searchResult = document.getElementById('searchResult');
  
  // Get and normalise the search query
  var query = searchInput.value.trim().toLowerCase();
  
  // Clear result if query is empty
  if (!query) {
    searchResult.className = 'search-result';
    searchResult.innerHTML = '';
    return;
  }
  
  // LINEAR SEARCH ALGORITHM:
  // Iterate through array from index 0 to length-1
  // Compare each job name with the query
  var found = null;
  var foundIndex = -1;
  
  for (var i = 0; i < tasks.length; i++) {
    // Convert stored name to lowercase for case-insensitive comparison
    if (tasks[i].name.toLowerCase() === query) {
      found = tasks[i];      // Store the found job object
      foundIndex = i;        // Store its index
      break;                 // Exit loop early (optimisation)
    }
  }
  
  // Display search result
  if (found) {
    searchResult.className = 'search-result found';
    searchResult.innerHTML =
      '<strong>Job found:</strong> ' + escapeHtml(found.name) +
      ' &mdash; Due: ' + found.dueDate +
      ' &mdash; Priority: ' + found.priority +
      ' &mdash; Consultant: ' + escapeHtml(found.consultant) +
      (found.completed ? ' &mdash; <em>Completed</em>' : '');
  } else {
    searchResult.className = 'search-result not-found';
    searchResult.innerHTML = 'Task not found.';
  }
}

// ------------------------------------------------------------
// 8. CONTACT FORM HANDLING
// ------------------------------------------------------------
/**
 * Handle contact form submission
 * Pure JS validation and success message display
 * @param {Event} e - The submit event object
 */
function handleContactSubmit(e) {
  e.preventDefault();
  
  var form = e.target;
  var isValid = validateContactForm(form);
  
  if (!isValid) {
    return;
  }
  
  // Reset form
  form.reset();
  clearFormValidation(form);
  
  // Hide form and show success message
  form.style.display = 'none';
  
  var successMsg = document.getElementById('contactSuccess');
  if (successMsg) {
    successMsg.style.display = 'block';
  }
}

/**
 * Validate contact form fields
 * @param {HTMLFormElement} form - The contact form
 * @returns {boolean} - True if valid
 */
function validateContactForm(form) {
  var isValid = true;
  
  // Get form fields
  var name     = document.getElementById('contactName');
  var email    = document.getElementById('contactEmail');
  var comments = document.getElementById('contactComments');
  
  // Validate name
  if (!name.value.trim()) {
    showFieldError(name);
    isValid = false;
  } else {
    clearFieldError(name);
  }
  
  // Validate email (basic pattern check)
  var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email.value.trim() || !emailPattern.test(email.value)) {
    showFieldError(email);
    isValid = false;
  } else {
    clearFieldError(email);
  }
  
  // Validate comments
  if (!comments.value.trim()) {
    showFieldError(comments);
    isValid = false;
  } else {
    clearFieldError(comments);
  }
  
  return isValid;
}

// ------------------------------------------------------------
// END OF FILE
// ------------------------------------------------------------

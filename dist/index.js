export class KanbanBoard {
    constructor() {
        this.tasks = [];
        this.nextId = 1;
        this.STORAGE_KEY = 'kanban-board-data';
        this.loadFromStorage();
    }
    saveToStorage() {
        const dataToSave = {
            tasks: this.tasks,
            nextId: this.nextId
        };
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dataToSave));
    }
    loadFromStorage() {
        const storedData = localStorage.getItem(this.STORAGE_KEY);
        if (storedData) {
            try {
                const parsed = JSON.parse(storedData);
                this.tasks = parsed.tasks;
                this.nextId = parsed.nextId;
                // backfill priority for tasks saved before this field existed
                this.tasks.forEach(t => {
                    if (!t.priority)
                        t.priority = 'med';
                });
            }
            catch (e) {
                console.error("Failed to parse local storage data:", e);
                this.tasks = [];
                this.nextId = 1;
            }
        }
    }
    addTask(title, description, priority = 'med', dueDate) {
        try {
            const cleanTitle = title.trim();
            if (!cleanTitle)
                throw new Error("Task title cannot be empty.");
            const newTask = {
                id: this.nextId++,
                title: cleanTitle,
                description: description.trim(),
                status: 'todo',
                priority,
                ...(dueDate ? { dueDate } : {}),
            };
            this.tasks.push(newTask);
            this.saveToStorage();
        }
        catch (error) {
            if (error instanceof Error) {
                alert(`Error: ${error.message}`);
                throw error;
            }
            throw new Error("An unknown error occurred.");
        }
    }
    getTasksByStatus(status) {
        return this.tasks.filter(task => task.status === status);
    }
    getAllTasks() {
        return [...this.tasks];
    }
    updateTaskStatus(id, newStatus) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.status = newStatus;
            this.saveToStorage();
        }
    }
    updateTaskDetails(id, updates) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            Object.assign(task, updates);
            this.saveToStorage();
        }
    }
    deleteTask(id) {
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.saveToStorage();
    }
}
// ==========================================
const board = new KanbanBoard();
const form = document.getElementById('task-form');
const titleInput = document.getElementById('task-title');
const descInput = document.getElementById('task-desc');
const priorityInput = document.getElementById('task-priority');
const dueDateInput = document.getElementById('task-due');
const columns = {
    'todo': document.getElementById('col-todo'),
    'in-progress': document.getElementById('col-in-progress'),
    'review': document.getElementById('col-review'),
    'done': document.getElementById('col-done')
};
// Edit modal elements
const editModal = document.getElementById('edit-task-modal');
const editForm = document.getElementById('edit-task-form');
const editTitleInput = document.getElementById('edit-task-title');
const editDescInput = document.getElementById('edit-task-desc');
const editPriorityInput = document.getElementById('edit-task-priority');
const editDueInput = document.getElementById('edit-task-due');
const closeEditBtn = document.querySelector('.close-edit-modal');
let taskBeingEdited = null;
function openEditModal(task) {
    var _a;
    taskBeingEdited = task.id;
    editTitleInput.value = task.title;
    editDescInput.value = task.description;
    editPriorityInput.value = task.priority;
    editDueInput.value = (_a = task.dueDate) !== null && _a !== void 0 ? _a : '';
    editModal.classList.add('active');
}
function closeEditModal() {
    editModal.classList.remove('active');
    taskBeingEdited = null;
    editForm.reset();
}
closeEditBtn.addEventListener('click', closeEditModal);
editModal.addEventListener('click', (e) => {
    if (e.target === editModal)
        closeEditModal();
});
editForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (taskBeingEdited === null)
        return;
    const newTitle = editTitleInput.value.trim();
    if (!newTitle)
        return; // title is required, mirrors the add-task validation
    const newDueDate = editDueInput.value;
    const updates = {
        title: newTitle,
        description: editDescInput.value.trim(),
        priority: editPriorityInput.value,
    };
    if (newDueDate) {
        updates.dueDate = newDueDate;
    }
    board.updateTaskDetails(taskBeingEdited, updates);
    closeEditModal();
    renderBoard();
});
form.addEventListener('submit', (e) => {
    e.preventDefault();
    try {
        const priority = (priorityInput === null || priorityInput === void 0 ? void 0 : priorityInput.value) || 'med';
        const dueDate = (dueDateInput === null || dueDateInput === void 0 ? void 0 : dueDateInput.value) || undefined;
        board.addTask(titleInput.value, descInput.value, priority, dueDate);
        form.reset();
        renderBoard();
    }
    catch (err) {
    }
});
// Returns a human-friendly "due" label, or null if no due date.
// Also flags whether the task is overdue.
function getDueInfo(dueDate) {
    if (!dueDate)
        return null;
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const msPerDay = 1000 * 60 * 60 * 24;
    const diffDays = Math.round((due.getTime() - today.getTime()) / msPerDay);
    const formattedDate = due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    if (diffDays < 0) {
        return { label: `Overdue \u00b7 ${formattedDate}`, overdue: true };
    }
    if (diffDays === 0) {
        return { label: `Due today \u00b7 ${formattedDate}`, overdue: false };
    }
    if (diffDays === 1) {
        return { label: `1d left \u00b7 ${formattedDate}`, overdue: false };
    }
    return { label: `${diffDays}d left \u00b7 ${formattedDate}`, overdue: false };
}
// Render the entire board
function renderBoard() {
    //prevent duplicatess
    Object.values(columns).forEach((colElement) => {
        const container = colElement.querySelector('.task-container');
        container.innerHTML = '';
    });
    ////////
    const statuses = ['todo', 'in-progress', 'review', 'done'];
    statuses.forEach(status => {
        const tasksInStatus = board.getTasksByStatus(status);
        const container = columns[status].querySelector('.task-container');
        // Update the column's task count badge, if present
        const countBadge = columns[status].querySelector('.column-count');
        if (countBadge) {
            countBadge.textContent = tasksInStatus.length.toString();
        }
        // Empty state when a column has no tasks
        if (tasksInStatus.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'empty-state';
            empty.textContent = 'Drop tasks here';
            container.appendChild(empty);
            return;
        }
        tasksInStatus.forEach(task => {
            const card = document.createElement('div');
            card.className = 'task-card';
            card.draggable = true;
            const dueInfo = getDueInfo(task.dueDate);
            const dueChipHtml = dueInfo
                ? `<span class="due-chip${dueInfo.overdue ? ' due-chip--overdue' : ''}">${dueInfo.label}</span>`
                : '';
            card.innerHTML = `
                <span class="priority-badge priority-badge--${task.priority}" title="${task.priority} priority"></span>
                ${dueChipHtml}
                <div class="card-header">
                    <h4>${task.title}</h4>
                </div>
                <p>${task.description}</p>
                <div class="card-actions"></div>
            `;
            const editBtn = document.createElement('button');
            editBtn.textContent = 'Edit';
            editBtn.classList.add('edit-btn');
            editBtn.onclick = () => {
                openEditModal(task);
            };
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Delete';
            deleteBtn.classList.add('delete-btn');
            deleteBtn.onclick = () => {
                board.deleteTask(task.id);
                renderBoard();
            };
            const actionsDiv = card.querySelector('.card-actions');
            actionsDiv.appendChild(editBtn);
            actionsDiv.appendChild(deleteBtn);
            card.addEventListener('dragstart', (e) => {
                if (e.dataTransfer) {
                    e.dataTransfer.setData('text/plain', task.id.toString());
                    e.dataTransfer.effectAllowed = 'move';
                }
                setTimeout(() => card.classList.add('dragging'), 0);
            });
            card.addEventListener('dragend', () => {
                card.classList.remove('dragging');
            });
            container.appendChild(card);
        });
    });
}
//i hate drags
const dropSound = new Audio('assets/sounds/drop.mp3');
dropSound.volume = 0.5;
Object.entries(columns).forEach(([status, colElement]) => {
    colElement.addEventListener('dragover', (e) => {
        e.preventDefault();
        colElement.classList.add('drag-over');
    });
    colElement.addEventListener('dragleave', () => {
        colElement.classList.remove('drag-over');
    });
    colElement.addEventListener('drop', (e) => {
        var _a;
        e.preventDefault();
        colElement.classList.remove('drag-over');
        const taskIdStr = (_a = e.dataTransfer) === null || _a === void 0 ? void 0 : _a.getData('text/plain');
        if (taskIdStr) {
            const taskId = parseInt(taskIdStr, 10);
            board.updateTaskStatus(taskId, status);
            renderBoard();
            // Restart and play in case of rapid consecutive drops
            dropSound.currentTime = 0;
            dropSound.play().catch(() => {
                // Browsers block autoplay until the user has interacted with the page;
                // a drag-and-drop action counts as interaction, so this should rarely fire.
            });
        }
    });
});
// Prevent Duplicateeess
if (board.getAllTasks().length === 0) {
    board.addTask("Setup environment", "Initialize pnpm and create tsconfig.json", 'low');
    board.addTask("Write KanbanBoard class", "Implement CRUD operations", 'high');
    board.updateTaskStatus(1, "done");
    board.updateTaskStatus(2, "in-progress");
}
renderBoard();
// Accordion + light mode toggle
const toolsToggle = document.getElementById('tools-toggle');
const toolsPanel = document.getElementById('tools-panel');
const lightModeToggle = document.getElementById('light-mode-toggle');
if (toolsToggle && toolsPanel) {
    toolsToggle.addEventListener('click', () => {
        const isOpen = toolsPanel.classList.toggle('open');
        toolsToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
}
if (lightModeToggle) {
    const THEME_KEY = 'kanban-theme';
    const applyTheme = (isLight) => {
        document.body.classList.toggle('light-theme', isLight);
        lightModeToggle.checked = isLight;
    };
    // Restore saved preference on load
    const savedTheme = localStorage.getItem(THEME_KEY);
    applyTheme(savedTheme === 'light');
    lightModeToggle.addEventListener('change', () => {
        const isLight = lightModeToggle.checked;
        applyTheme(isLight);
        localStorage.setItem(THEME_KEY, isLight ? 'light' : 'dark');
    });
}
document.addEventListener('DOMContentLoaded', () => {
    let currentUserEmail = localStorage.getItem('currentUserEmail') || '';
    let isLoggedIn = currentUserEmail !== '';
    const mainActionBtn = document.getElementById('login-btn');
    const loginModal = document.getElementById('login-modal');
    const closeLoginBtn = document.querySelector('#login-modal .close-modal');
    const loginForm = document.getElementById('popup-login-form');
    const emailInput = document.getElementById('email');
    const logoutModal = document.getElementById('logout-modal');
    const closeLogoutBtn = document.querySelector('.close-logout-modal');
    const confirmLogoutBtn = document.getElementById('confirm-logout');
    const cancelLogoutBtn = document.getElementById('cancel-logout');
    const currentUserEmailDisplay = document.getElementById('current-user-email');
    const updateButtonUI = () => {
        if (!mainActionBtn)
            return;
        if (isLoggedIn) {
            mainActionBtn.classList.add('is-logged-in');
            mainActionBtn.innerHTML = `
            <span>${currentUserEmail}</span>
            <img src="https://images.unsplash.com/photo-1701772165288-39c9ef3775c0?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                 alt="Profile Picture"
                 class="profile-avatar">
        `;
            mainActionBtn.style.textTransform = 'none';
            mainActionBtn.style.padding = '6px 8px 6px 16px';
        }
        else {
            mainActionBtn.classList.remove('is-logged-in');
            mainActionBtn.innerHTML = 'LOGIN';
            mainActionBtn.style.textTransform = 'uppercase';
            mainActionBtn.style.padding = '10px 16px';
        }
    };
    if (mainActionBtn && loginModal && logoutModal && loginForm && emailInput) {
        updateButtonUI();
        mainActionBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (isLoggedIn) {
                if (currentUserEmailDisplay) {
                    currentUserEmailDisplay.textContent = currentUserEmail;
                }
                logoutModal.classList.add('active');
            }
            else {
                loginModal.classList.add('active');
            }
        });
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const userEmail = emailInput.value.trim();
            if (userEmail) {
                isLoggedIn = true;
                currentUserEmail = userEmail;
                localStorage.setItem('currentUserEmail', userEmail);
                updateButtonUI();
                loginModal.classList.remove('active');
                loginForm.reset();
            }
        });
        confirmLogoutBtn === null || confirmLogoutBtn === void 0 ? void 0 : confirmLogoutBtn.addEventListener('click', () => {
            isLoggedIn = false;
            currentUserEmail = '';
            localStorage.removeItem('currentUserEmail');
            updateButtonUI();
            logoutModal.classList.remove('active');
        });
        closeLoginBtn === null || closeLoginBtn === void 0 ? void 0 : closeLoginBtn.addEventListener('click', () => loginModal.classList.remove('active'));
        loginModal.addEventListener('click', (e) => {
            if (e.target === loginModal)
                loginModal.classList.remove('active');
        });
        closeLogoutBtn === null || closeLogoutBtn === void 0 ? void 0 : closeLogoutBtn.addEventListener('click', () => logoutModal.classList.remove('active'));
        cancelLogoutBtn === null || cancelLogoutBtn === void 0 ? void 0 : cancelLogoutBtn.addEventListener('click', () => logoutModal.classList.remove('active'));
        logoutModal.addEventListener('click', (e) => {
            if (e.target === logoutModal)
                logoutModal.classList.remove('active');
        });
    }
    else {
        console.warn('One or more modal elements were not found in the DOM.');
    }
});
//# sourceMappingURL=index.js.map
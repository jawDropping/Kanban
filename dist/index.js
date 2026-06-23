// 2. The Core Class: KanbanBoard
export class KanbanBoard {
    constructor() {
        this.tasks = [];
        this.nextId = 1;
    }
    // [C] Create
    addTask(title, description) {
        try {
            const cleanTitle = title.trim();
            if (!cleanTitle) {
                throw new Error("Task title cannot be empty.");
            }
            const newTask = {
                id: this.nextId++,
                title: cleanTitle,
                description: description.trim(),
                status: 'todo',
            };
            this.tasks.push(newTask);
        }
        catch (error) {
            if (error instanceof Error) {
                alert(`Error: ${error.message}`);
                throw error;
            }
            throw new Error("An unknown error occurred.");
        }
    }
    // [R] Read
    getTasksByStatus(status) {
        return this.tasks.filter(task => task.status === status);
    }
    getAllTasks() {
        // Return a shallow copy as a ReadonlyArray to prevent direct mutation
        return [...this.tasks];
    }
    // [U] Update
    updateTaskStatus(id, newStatus) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.status = newStatus;
        }
    }
    updateTaskDetails(id, updates) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            Object.assign(task, updates);
        }
    }
    // [D] Delete
    deleteTask(id) {
        this.tasks = this.tasks.filter(t => t.id !== id);
    }
}
// ==========================================
// 3. Frontend UI & Drag-and-Drop Implementation
// ==========================================
const board = new KanbanBoard();
// DOM References
const form = document.getElementById('task-form');
const titleInput = document.getElementById('task-title');
const descInput = document.getElementById('task-desc');
const columns = {
    'todo': document.getElementById('col-todo'),
    'in-progress': document.getElementById('col-in-progress'),
    'review': document.getElementById('col-review'),
    'done': document.getElementById('col-done')
};
// Handle Form Submission
form.addEventListener('submit', (e) => {
    e.preventDefault();
    try {
        board.addTask(titleInput.value, descInput.value);
        form.reset(); // Clear inputs
        renderBoard();
    }
    catch (err) {
        // Error is handled inside addTask's try/catch via alert
    }
});
// Render the entire board
function renderBoard() {
    // 1. Clear out old DOM elements to prevent duplicates
    Object.values(columns).forEach((colElement) => {
        const container = colElement.querySelector('.task-container');
        container.innerHTML = '';
    });
    // 2. Map and generate new Task elements
    const statuses = ['todo', 'in-progress', 'review', 'done'];
    statuses.forEach(status => {
        const tasksInStatus = board.getTasksByStatus(status);
        const container = columns[status].querySelector('.task-container');
        tasksInStatus.forEach(task => {
            const card = document.createElement('div');
            card.className = 'task-card';
            card.draggable = true;
            card.innerHTML = `
                <h4>${task.title}</h4>
                <p>${task.description}</p>
                <div class="card-actions"></div>
            `;
            // Setup Edit Button
            const editBtn = document.createElement('button');
            editBtn.textContent = 'Edit';
            editBtn.onclick = () => {
                const newTitle = prompt('Edit Title:', task.title);
                const newDesc = prompt('Edit Description:', task.description);
                if (newTitle !== null) {
                    board.updateTaskDetails(task.id, {
                        title: newTitle,
                        description: newDesc !== null ? newDesc : task.description
                    });
                    renderBoard();
                }
            };
            // Setup Delete Button
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Delete';
            deleteBtn.onclick = () => {
                board.deleteTask(task.id);
                renderBoard();
            };
            const actionsDiv = card.querySelector('.card-actions');
            actionsDiv.appendChild(editBtn);
            actionsDiv.appendChild(deleteBtn);
            // Drag Start
            card.addEventListener('dragstart', (e) => {
                if (e.dataTransfer) {
                    e.dataTransfer.setData('text/plain', task.id.toString());
                    e.dataTransfer.effectAllowed = 'move';
                }
                setTimeout(() => card.classList.add('dragging'), 0);
            });
            // Drag End
            card.addEventListener('dragend', () => {
                card.classList.remove('dragging');
            });
            container.appendChild(card);
        });
    });
}
// Setup Drag & Drop Zones
Object.entries(columns).forEach(([status, colElement]) => {
    // Required to allow dropping
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
        }
    });
});
// Seed data to start UI smoothly
board.addTask("Setup environment", "Initialize pnpm and create tsconfig.json");
board.addTask("Write KanbanBoard class", "Implement CRUD operations");
board.updateTaskStatus(1, "done");
board.updateTaskStatus(2, "in-progress");
// Initial render call
renderBoard();
//# sourceMappingURL=index.js.map
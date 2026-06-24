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
            }
            catch (e) {
                console.error("Failed to parse local storage data:", e);
                this.tasks = [];
                this.nextId = 1;
            }
        }
    }
    addTask(title, description) {
        try {
            const cleanTitle = title.trim();
            if (!cleanTitle)
                throw new Error("Task title cannot be empty.");
            const newTask = {
                id: this.nextId++,
                title: cleanTitle,
                description: description.trim(),
                status: 'todo',
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
form.addEventListener('submit', (e) => {
    e.preventDefault();
    try {
        board.addTask(titleInput.value, descInput.value);
        form.reset();
        renderBoard();
    }
    catch (err) {
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
            editBtn.classList.add('edit-btn');
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
            deleteBtn.classList.add('delete-btn');
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
// Seed data only if the board is completely empty (first time visit)
if (board.getAllTasks().length === 0) {
    board.addTask("Setup environment", "Initialize pnpm and create tsconfig.json");
    board.addTask("Write KanbanBoard class", "Implement CRUD operations");
    board.updateTaskStatus(1, "done");
    board.updateTaskStatus(2, "in-progress");
}
// Initial render call
renderBoard();
//# sourceMappingURL=index.js.map
// 1. Type Architecture
export type ColumnStatus = 'todo' | 'in-progress' | 'review' | 'done';

export interface Task {
    id: number;
    title: string;
    description: string;
    status: ColumnStatus;
}

// 2. The Core Class: KanbanBoard
export class KanbanBoard {
    private tasks: Task[] = [];
    private nextId: number = 1;

    // [C] Create
    public addTask(title: string, description: string): void {
        try {
            const cleanTitle = title.trim();
            if (!cleanTitle) {
                throw new Error("Task title cannot be empty.");
            }
            
            const newTask: Task = {
                id: this.nextId++,
                title: cleanTitle,
                description: description.trim(),
                status: 'todo',
            };
            
            this.tasks.push(newTask);
        } catch (error: unknown) {
            if (error instanceof Error) {
                alert(`Error: ${error.message}`);
                throw error;
            }
            throw new Error("An unknown error occurred.");
        }
    }

    // [R] Read
    public getTasksByStatus(status: ColumnStatus): ReadonlyArray<Task> {
        return this.tasks.filter(task => task.status === status);
    }

    public getAllTasks(): ReadonlyArray<Task> {
        // Return a shallow copy as a ReadonlyArray to prevent direct mutation
        return [...this.tasks];
    }

    // [U] Update
    public updateTaskStatus(id: number, newStatus: ColumnStatus): void {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.status = newStatus;
        }
    }

    public updateTaskDetails(id: number, updates: Partial<Task>): void {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            Object.assign(task, updates);
        }
    }

    // [D] Delete
    public deleteTask(id: number): void {
        this.tasks = this.tasks.filter(t => t.id !== id);
    }
}

// ==========================================
// 3. Frontend UI & Drag-and-Drop Implementation
// ==========================================

const board = new KanbanBoard();

// DOM References
const form = document.getElementById('task-form') as HTMLFormElement;
const titleInput = document.getElementById('task-title') as HTMLInputElement;
const descInput = document.getElementById('task-desc') as HTMLTextAreaElement;

const columns: Record<ColumnStatus, HTMLElement> = {
    'todo': document.getElementById('col-todo') as HTMLElement,
    'in-progress': document.getElementById('col-in-progress') as HTMLElement,
    'review': document.getElementById('col-review') as HTMLElement,
    'done': document.getElementById('col-done') as HTMLElement
};

// Handle Form Submission
form.addEventListener('submit', (e: Event) => {
    e.preventDefault();
    try {
        board.addTask(titleInput.value, descInput.value);
        form.reset(); // Clear inputs
        renderBoard();
    } catch (err) {
        // Error is handled inside addTask's try/catch via alert
    }
});

// Render the entire board
function renderBoard(): void {
    // 1. Clear out old DOM elements to prevent duplicates
    Object.values(columns).forEach((colElement: HTMLElement) => {
        const container = colElement.querySelector('.task-container') as HTMLElement;
        container.innerHTML = '';
    });

    // 2. Map and generate new Task elements
    const statuses: ColumnStatus[] = ['todo', 'in-progress', 'review', 'done'];
    
    statuses.forEach(status => {
        const tasksInStatus = board.getTasksByStatus(status);
        const container = columns[status].querySelector('.task-container') as HTMLElement;

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

            const actionsDiv = card.querySelector('.card-actions') as HTMLElement;
            actionsDiv.appendChild(editBtn);
            actionsDiv.appendChild(deleteBtn);

            // Drag Start
            card.addEventListener('dragstart', (e: DragEvent) => {
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
Object.entries(columns).forEach(([status, colElement]: [string, HTMLElement]) => {
    // Required to allow dropping
    colElement.addEventListener('dragover', (e: DragEvent) => {
        e.preventDefault(); 
        colElement.classList.add('drag-over');
    });

    colElement.addEventListener('dragleave', () => {
        colElement.classList.remove('drag-over');
    });

    colElement.addEventListener('drop', (e: DragEvent) => {
        e.preventDefault();
        colElement.classList.remove('drag-over');
        
        const taskIdStr = e.dataTransfer?.getData('text/plain');
        if (taskIdStr) {
            const taskId = parseInt(taskIdStr, 10);
            board.updateTaskStatus(taskId, status as ColumnStatus);
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
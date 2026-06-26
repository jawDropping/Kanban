export type ColumnStatus = 'todo' | 'in-progress' | 'review' | 'done';
export type Priority = 'high' | 'med' | 'low';

export interface Task {
    id: number;
    title: string;
    description: string;
    status: ColumnStatus;
    priority: Priority;
    dueDate?: string; // ISO date string, e.g. "2026-07-01"
}

export class KanbanBoard {
    private tasks: Task[] = [];
    private nextId: number = 1;
    private readonly STORAGE_KEY = 'kanban-board-data';

    constructor() {
        this.loadFromStorage();
    }


    private saveToStorage(): void {
        const dataToSave = {
            tasks: this.tasks,
            nextId: this.nextId
        };
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dataToSave));
    }

    private loadFromStorage(): void {
        const storedData = localStorage.getItem(this.STORAGE_KEY);
        if (storedData) {
            try {
                const parsed = JSON.parse(storedData);
                this.tasks = parsed.tasks;
                this.nextId = parsed.nextId;
                // backfill priority for tasks saved before this field existed
                this.tasks.forEach(t => {
                    if (!t.priority) t.priority = 'med';
                });
            } catch (e) {
                console.error("Failed to parse local storage data:", e);
                this.tasks = [];
                this.nextId = 1;
            }
        }
    }


    public addTask(title: string, description: string, priority: Priority = 'med', dueDate?: string): void {
        try {
            const cleanTitle = title.trim();
            if (!cleanTitle) throw new Error("Task title cannot be empty.");

            const newTask: Task = {
                id: this.nextId++,
                title: cleanTitle,
                description: description.trim(),
                status: 'todo',
                priority,
                ...(dueDate ? { dueDate } : {}),
            };

            this.tasks.push(newTask);
            this.saveToStorage();

        } catch (error: unknown) {
            if (error instanceof Error) {
                alert(`Error: ${error.message}`);
                throw error;
            }
            throw new Error("An unknown error occurred.");
        }
    }


    public getTasksByStatus(status: ColumnStatus): ReadonlyArray<Task> {
        return this.tasks.filter(task => task.status === status);
    }

    public getAllTasks(): ReadonlyArray<Task> {
        return [...this.tasks];
    }


    public updateTaskStatus(id: number, newStatus: ColumnStatus): void {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.status = newStatus;
            this.saveToStorage();
        }
    }

    public updateTaskDetails(id: number, updates: Partial<Task>): void {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            Object.assign(task, updates);
            this.saveToStorage();
        }
    }


    public deleteTask(id: number): void {
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.saveToStorage();
    }
}

// ==========================================


const board = new KanbanBoard();


const form = document.getElementById('task-form') as HTMLFormElement;
const titleInput = document.getElementById('task-title') as HTMLInputElement;
const descInput = document.getElementById('task-desc') as HTMLTextAreaElement;
const priorityInput = document.getElementById('task-priority') as HTMLSelectElement | null;
const dueDateInput = document.getElementById('task-due') as HTMLInputElement | null;

const columns: Record<ColumnStatus, HTMLElement> = {
    'todo': document.getElementById('col-todo') as HTMLElement,
    'in-progress': document.getElementById('col-in-progress') as HTMLElement,
    'review': document.getElementById('col-review') as HTMLElement,
    'done': document.getElementById('col-done') as HTMLElement
};


form.addEventListener('submit', (e: Event) => {
    e.preventDefault();
    try {
        const priority = (priorityInput?.value as Priority) || 'med';
        const dueDate = dueDateInput?.value || undefined;
        board.addTask(titleInput.value, descInput.value, priority, dueDate);
        form.reset();
        renderBoard();
    } catch (err) {

    }
});

// Returns a human-friendly "due" label, or null if no due date.
// Also flags whether the task is overdue.
function getDueInfo(dueDate?: string): { label: string; overdue: boolean } | null {
    if (!dueDate) return null;

    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const msPerDay = 1000 * 60 * 60 * 24;
    const diffDays = Math.round((due.getTime() - today.getTime()) / msPerDay);

    if (diffDays < 0) {
        return { label: 'Overdue', overdue: true };
    }
    if (diffDays === 0) {
        return { label: 'Due today', overdue: false };
    }
    if (diffDays === 1) {
        return { label: '1d left', overdue: false };
    }
    return { label: `${diffDays}d left`, overdue: false };
}

// Render the entire board
function renderBoard(): void {

  //prevent duplicatess
    Object.values(columns).forEach((colElement: HTMLElement) => {
        const container = colElement.querySelector('.task-container') as HTMLElement;
        container.innerHTML = '';
    });

  ////////
    const statuses: ColumnStatus[] = ['todo', 'in-progress', 'review', 'done'];

    statuses.forEach(status => {
        const tasksInStatus = board.getTasksByStatus(status);
        const container = columns[status].querySelector('.task-container') as HTMLElement;

        // Update the column's task count badge, if present
        const countBadge = columns[status].querySelector('.column-count') as HTMLElement | null;
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
                ${dueChipHtml}
                <h4>${task.title}</h4>
                <p>${task.description}</p>
                <div class="card-actions"></div>
            `;


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


            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Delete';
            deleteBtn.classList.add('delete-btn');
            deleteBtn.onclick = () => {
                board.deleteTask(task.id);
                renderBoard();
            };

            const actionsDiv = card.querySelector('.card-actions') as HTMLElement;
            actionsDiv.appendChild(editBtn);
            actionsDiv.appendChild(deleteBtn);


            card.addEventListener('dragstart', (e: DragEvent) => {
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
function playDropSound(): void {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.15);
}

Object.entries(columns).forEach(([status, colElement]: [string, HTMLElement]) => {

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

    
            playDropSound();
            playDropSound();
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

document.addEventListener('DOMContentLoaded', () => {

    let currentUserEmail = localStorage.getItem('currentUserEmail') || '';
    let isLoggedIn = currentUserEmail !== '';


    const mainActionBtn = document.getElementById('login-btn') as HTMLElement | null;


    const loginModal = document.getElementById('login-modal') as HTMLDivElement | null;
    const closeLoginBtn = document.querySelector('#login-modal .close-modal') as HTMLSpanElement | null;
    const loginForm = document.getElementById('popup-login-form') as HTMLFormElement | null;
    const emailInput = document.getElementById('email') as HTMLInputElement | null;

    const logoutModal = document.getElementById('logout-modal') as HTMLDivElement | null;
    const closeLogoutBtn = document.querySelector('.close-logout-modal') as HTMLSpanElement | null;
    const confirmLogoutBtn = document.getElementById('confirm-logout') as HTMLButtonElement | null;
    const cancelLogoutBtn = document.getElementById('cancel-logout') as HTMLButtonElement | null;
    const currentUserEmailDisplay = document.getElementById('current-user-email') as HTMLElement | null;


    const updateButtonUI = () => {
    if (!mainActionBtn) return;

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
    } else {
        mainActionBtn.classList.remove('is-logged-in');

        mainActionBtn.innerHTML = 'LOGIN';
        mainActionBtn.style.textTransform = 'uppercase';
        mainActionBtn.style.padding = '10px 16px';
    }
};

    if (mainActionBtn && loginModal && logoutModal && loginForm && emailInput) {

        updateButtonUI();

        mainActionBtn.addEventListener('click', (e: MouseEvent) => {
            e.preventDefault();
            if (isLoggedIn) {
                if (currentUserEmailDisplay) {
                    currentUserEmailDisplay.textContent = currentUserEmail;
                }
                logoutModal.classList.add('active');
            } else {
                loginModal.classList.add('active');
            }
        });

        loginForm.addEventListener('submit', (e: Event) => {
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


        confirmLogoutBtn?.addEventListener('click', () => {
            isLoggedIn = false;
            currentUserEmail = '';


            localStorage.removeItem('currentUserEmail');


            updateButtonUI();

            logoutModal.classList.remove('active');
        });


        closeLoginBtn?.addEventListener('click', () => loginModal.classList.remove('active'));
        loginModal.addEventListener('click', (e: MouseEvent) => {
            if (e.target === loginModal) loginModal.classList.remove('active');
        });

        closeLogoutBtn?.addEventListener('click', () => logoutModal.classList.remove('active'));
        cancelLogoutBtn?.addEventListener('click', () => logoutModal.classList.remove('active'));
        logoutModal.addEventListener('click', (e: MouseEvent) => {
            if (e.target === logoutModal) logoutModal.classList.remove('active');
        });

    } else {
        console.warn('One or more modal elements were not found in the DOM.');
    }
});
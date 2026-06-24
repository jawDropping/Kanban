export type ColumnStatus = 'todo' | 'in-progress' | 'review' | 'done';

export interface Task {
    id: number;
    title: string;
    description: string;
    status: ColumnStatus;
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
            } catch (e) {
                console.error("Failed to parse local storage data:", e);
                this.tasks = [];
                this.nextId = 1;
            }
        }
    }


    public addTask(title: string, description: string): void {
        try {
            const cleanTitle = title.trim();
            if (!cleanTitle) throw new Error("Task title cannot be empty.");
            
            const newTask: Task = {
                id: this.nextId++,
                title: cleanTitle,
                description: description.trim(),
                status: 'todo',
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


form.addEventListener('submit', (e: Event) => {
    e.preventDefault();
    try {
        board.addTask(titleInput.value, descInput.value);
        form.reset();
        renderBoard();
    } catch (err) {
        
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
            deleteBtn.textContent = 'Delete';
            deleteBtn.classList.add('delete-btn');
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

// Prevent Duplicateeess
if (board.getAllTasks().length === 0) {
    board.addTask("Setup environment", "Initialize pnpm and create tsconfig.json");
    board.addTask("Write KanbanBoard class", "Implement CRUD operations");
    board.updateTaskStatus(1, "done");
    board.updateTaskStatus(2, "in-progress");
}


renderBoard();

document.addEventListener('DOMContentLoaded', () => {
    // --- Application State (Initialized from localStorage if it exists) ---
    let currentUserEmail = localStorage.getItem('currentUserEmail') || '';
    let isLoggedIn = currentUserEmail !== '';

    // --- DOM Elements: Shared ---
    const mainActionBtn = document.getElementById('login-btn') as HTMLElement | null;
    
    // --- DOM Elements: Login Modal ---
    const loginModal = document.getElementById('login-modal') as HTMLDivElement | null;
    const closeLoginBtn = document.querySelector('#login-modal .close-modal') as HTMLSpanElement | null;
    const loginForm = document.getElementById('popup-login-form') as HTMLFormElement | null;
    const emailInput = document.getElementById('email') as HTMLInputElement | null;

    // --- DOM Elements: Logout Modal ---
    const logoutModal = document.getElementById('logout-modal') as HTMLDivElement | null;
    const closeLogoutBtn = document.querySelector('.close-logout-modal') as HTMLSpanElement | null;
    const confirmLogoutBtn = document.getElementById('confirm-logout') as HTMLButtonElement | null;
    const cancelLogoutBtn = document.getElementById('cancel-logout') as HTMLButtonElement | null;
    const currentUserEmailDisplay = document.getElementById('current-user-email') as HTMLElement | null;

    // Helper function to update the button UI based on login state
    const updateButtonUI = () => {
    if (!mainActionBtn) return;
    
    if (isLoggedIn) {
        // NEW: Add the class that drops the border
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
        // NEW: Strip the class away when logging out to restore the standard button border
        mainActionBtn.classList.remove('is-logged-in');
        
        mainActionBtn.innerHTML = 'LOGIN';
        mainActionBtn.style.textTransform = 'uppercase';
        mainActionBtn.style.padding = '10px 16px'; 
    }
};

    // Safety check ensuring all core elements exist
    if (mainActionBtn && loginModal && logoutModal && loginForm && emailInput) {
        
        // Run immediately on page load to restore UI if they were already logged in
        updateButtonUI();

        // 1. Handle Top-Right Button Click
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

        // 2. Handle Login Submission
        loginForm.addEventListener('submit', (e: Event) => {
            e.preventDefault(); 
            const userEmail = emailInput.value.trim();

            if (userEmail) {
                isLoggedIn = true;
                currentUserEmail = userEmail;
                
                // NEW: Save to browser storage
                localStorage.setItem('currentUserEmail', userEmail);
                
                // Update UI
                updateButtonUI();
                
                loginModal.classList.remove('active');
                loginForm.reset();
            }
        });

        // 3. Handle Logout Confirmation
        confirmLogoutBtn?.addEventListener('click', () => {
            isLoggedIn = false;
            currentUserEmail = '';

            // NEW: Clear from browser storage
            localStorage.removeItem('currentUserEmail');
            
            // Reset UI
            updateButtonUI();
            
            logoutModal.classList.remove('active');
        });

        // 4. Modal Closing Mechanisms
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
export type ColumnStatus = 'todo' | 'in-progress' | 'review' | 'done';
export type Priority = 'high' | 'med' | 'low';
export interface Task {
    id: number;
    title: string;
    description: string;
    status: ColumnStatus;
    priority: Priority;
    dueDate?: string;
}
export declare class KanbanBoard {
    private tasks;
    private nextId;
    private readonly STORAGE_KEY;
    constructor();
    private saveToStorage;
    private loadFromStorage;
    addTask(title: string, description: string, priority?: Priority, dueDate?: string): void;
    getTasksByStatus(status: ColumnStatus): ReadonlyArray<Task>;
    getAllTasks(): ReadonlyArray<Task>;
    updateTaskStatus(id: number, newStatus: ColumnStatus): void;
    updateTaskDetails(id: number, updates: Partial<Task>): void;
    deleteTask(id: number): void;
}
//# sourceMappingURL=index.d.ts.map
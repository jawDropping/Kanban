export type ColumnStatus = 'todo' | 'in-progress' | 'review' | 'done';
export interface Task {
    id: number;
    title: string;
    description: string;
    status: ColumnStatus;
}
export declare class KanbanBoard {
    private tasks;
    private nextId;
    addTask(title: string, description: string): void;
    getTasksByStatus(status: ColumnStatus): ReadonlyArray<Task>;
    getAllTasks(): ReadonlyArray<Task>;
    updateTaskStatus(id: number, newStatus: ColumnStatus): void;
    updateTaskDetails(id: number, updates: Partial<Task>): void;
    deleteTask(id: number): void;
}
//# sourceMappingURL=index.d.ts.map
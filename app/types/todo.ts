export interface Todo {
  id: string;
  title: string; 
  priority: 'low' | 'medium' | 'high'; 
  dueDate?: string;
  completed: boolean; 
  createdAt: string;
  platform: string; 
  clientName: string; 
}
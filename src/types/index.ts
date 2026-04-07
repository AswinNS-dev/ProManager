export type ProjectStatus = 'Active' | 'On-Hold' | 'Completed'
export type TaskStatus = 'Todo' | 'In Progress' | 'Review' | 'Done'
export type TaskPriority = 'High' | 'Medium' | 'Low'

export interface Project {
  id: string
  name: string
  description?: string
  owner_id: string
  created_at: string
  status: ProjectStatus
}

export interface Team {
  id: string
  name: string
  project_id: string
  created_at: string
}

export interface Task {
  id: string
  title: string
  description?: string
  priority: TaskPriority
  status: TaskStatus
  due_date?: string
  project_id: string
  created_at: string
}

export interface Comment {
  id: string
  task_id: string
  user_id: string
  content: string
  created_at: string
}

export interface TaskFile {
  id: string
  task_id: string
  uploader_id: string
  file_name: string
  file_url: string
  file_size?: number
  file_type?: string
  created_at: string
}

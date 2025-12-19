import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type JobType = 'import' | 'scan' | 'metadata' | 'backup' | 'encrypt' | 'download'
export type JobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'

export interface Job {
  id: string
  type: JobType
  status: JobStatus
  title: string
  description?: string
  progress?: number // 0-100
  retries: number
  maxRetries: number
  error?: string
  createdAt: number
  startedAt?: number
  completedAt?: number
  data?: Record<string, any> // Job-specific data
}

interface JobQueueState {
  jobs: Job[]
  currentJobId: string | null
  
  // Actions
  addJob: (job: Omit<Job, 'id' | 'createdAt' | 'retries' | 'status'>) => string
  updateJob: (id: string, updates: Partial<Job>) => void
  removeJob: (id: string) => void
  setCurrentJob: (id: string | null) => void
  incrementRetry: (id: string) => void
  clearCompleted: () => void
  clearAll: () => void
  getJob: (id: string) => Job | undefined
  getJobsByStatus: (status: JobStatus) => Job[]
}

export const useJobQueueStore = create<JobQueueState>()(
  persist(
    (set, get) => ({
      jobs: [],
      currentJobId: null,

      addJob: (jobData) => {
        const id = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const job: Job = {
          ...jobData,
          id,
          status: 'queued',
          retries: 0,
          createdAt: Date.now(),
        }
        
        set((state) => ({
          jobs: [...state.jobs, job],
        }))
        
        return id
      },

      updateJob: (id, updates) => {
        set((state) => ({
          jobs: state.jobs.map((job) =>
            job.id === id ? { ...job, ...updates } : job
          ),
        }))
      },

      removeJob: (id) => {
        set((state) => ({
          jobs: state.jobs.filter((job) => job.id !== id),
          currentJobId: state.currentJobId === id ? null : state.currentJobId,
        }))
      },

      setCurrentJob: (id) => {
        set({ currentJobId: id })
      },

      incrementRetry: (id) => {
        set((state) => ({
          jobs: state.jobs.map((job) =>
            job.id === id ? { ...job, retries: job.retries + 1 } : job
          ),
        }))
      },

      clearCompleted: () => {
        set((state) => ({
          jobs: state.jobs.filter(
            (job) => job.status !== 'completed' && job.status !== 'cancelled'
          ),
        }))
      },

      clearAll: () => {
        set({ jobs: [], currentJobId: null })
      },

      getJob: (id) => {
        return get().jobs.find((job) => job.id === id)
      },

      getJobsByStatus: (status) => {
        return get().jobs.filter((job) => job.status === status)
      },
    }),
    {
      name: 'reel-reader-job-queue',
      partialize: (state) => ({
        jobs: state.jobs.filter((job) => job.status !== 'running'), // Don't persist running jobs
        currentJobId: null, // Reset current job on reload
      }),
    }
  )
)

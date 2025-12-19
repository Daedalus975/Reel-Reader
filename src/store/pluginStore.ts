import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Plugin, AutomationRule } from '../types/features'

interface PluginState {
  plugins: Plugin[]
  rules: AutomationRule[]
  scriptsEnabled: boolean
  sandboxEnabled: boolean
}

interface PluginActions {
  // Plugin Management
  installPlugin: (plugin: Plugin) => void
  uninstallPlugin: (pluginId: string) => void
  enablePlugin: (pluginId: string) => void
  disablePlugin: (pluginId: string) => void
  updatePlugin: (pluginId: string, updates: Partial<Plugin>) => void
  
  // Automation Rules
  createRule: (rule: Omit<AutomationRule, 'id' | 'createdAt'>) => void
  updateRule: (ruleId: string, updates: Partial<AutomationRule>) => void
  deleteRule: (ruleId: string) => void
  enableRule: (ruleId: string) => void
  disableRule: (ruleId: string) => void
  
  // Rule Execution
  executeRule: (ruleId: string) => Promise<void>
  triggerRules: (trigger: AutomationRule['trigger']) => Promise<void>
  
  // Script Runner
  runScript: (script: string) => Promise<any>
  
  // Settings
  toggleScripts: () => void
  toggleSandbox: () => void
}

export const usePluginStore = create<PluginState & PluginActions>()(
  persist(
    (set, get) => ({
      // State
      plugins: [],
      rules: [],
      scriptsEnabled: false,
      sandboxEnabled: true,

      // Plugin Management
      installPlugin: (plugin) => {
        set((state) => ({
          plugins: [...state.plugins, { ...plugin, enabled: false }]
        }))
      },

      uninstallPlugin: (pluginId) => {
        set((state) => ({
          plugins: state.plugins.filter((p) => p.id !== pluginId)
        }))
      },

      enablePlugin: (pluginId) => {
        set((state) => ({
          plugins: state.plugins.map((p) =>
            p.id === pluginId ? { ...p, enabled: true } : p
          )
        }))
      },

      disablePlugin: (pluginId) => {
        set((state) => ({
          plugins: state.plugins.map((p) =>
            p.id === pluginId ? { ...p, enabled: false } : p
          )
        }))
      },

      updatePlugin: (pluginId, updates) => {
        set((state) => ({
          plugins: state.plugins.map((p) =>
            p.id === pluginId ? { ...p, ...updates } : p
          )
        }))
      },

      // Automation Rules
      createRule: (rule) => {
        const newRule: AutomationRule = {
          ...rule,
          id: crypto.randomUUID(),
          createdAt: new Date()
        }

        set((state) => ({
          rules: [...state.rules, newRule]
        }))
      },

      updateRule: (ruleId, updates) => {
        set((state) => ({
          rules: state.rules.map((r) =>
            r.id === ruleId ? { ...r, ...updates } : r
          )
        }))
      },

      deleteRule: (ruleId) => {
        set((state) => ({
          rules: state.rules.filter((r) => r.id !== ruleId)
        }))
      },

      enableRule: (ruleId) => {
        set((state) => ({
          rules: state.rules.map((r) =>
            r.id === ruleId ? { ...r, enabled: true } : r
          )
        }))
      },

      disableRule: (ruleId) => {
        set((state) => ({
          rules: state.rules.map((r) =>
            r.id === ruleId ? { ...r, enabled: false } : r
          )
        }))
      },

      // Rule Execution
      executeRule: async (ruleId) => {
        const rule = get().rules.find((r) => r.id === ruleId)
        if (!rule || !rule.enabled) return

        try {
          // TODO: Implement rule execution logic
          console.log('Executing rule:', rule.name)
          
          // Example: Apply actions based on rule
          for (const action of rule.actions) {
            switch (action.type) {
              case 'tag':
                console.log('Adding tag:', action.params.tag)
                break
              case 'move':
                console.log('Moving to:', action.params.destination)
                break
              case 'notify':
                console.log('Sending notification:', action.params.message)
                break
            }
          }
        } catch (error) {
          console.error('Rule execution failed:', error)
        }
      },

      triggerRules: async (trigger) => {
        const rules = get().rules.filter(
          (r) => r.enabled && r.trigger === trigger
        )

        await Promise.all(rules.map((r) => get().executeRule(r.id)))
      },

      // Script Runner
      runScript: async (script) => {
        const { scriptsEnabled, sandboxEnabled } = get()
        
        if (!scriptsEnabled) {
          throw new Error('Scripts are disabled')
        }

        try {
          if (sandboxEnabled) {
            // TODO: Run in sandboxed environment
            console.log('Running script in sandbox:', script)
            return null
          } else {
            // DANGEROUS: Direct execution (not recommended)
            return eval(script)
          }
        } catch (error) {
          console.error('Script execution failed:', error)
          throw error
        }
      },

      // Settings
      toggleScripts: () => {
        set((state) => ({ scriptsEnabled: !state.scriptsEnabled }))
      },

      toggleSandbox: () => {
        set((state) => ({ sandboxEnabled: !state.sandboxEnabled }))
      }
    }),
    {
      name: 'plugin-store',
      version: 1
    }
  )
)

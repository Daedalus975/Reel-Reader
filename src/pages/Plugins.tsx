import { useState } from 'react'
import { Plug, Power, Shield, Code, Trash2, Settings, Plus } from 'lucide-react'
import { usePluginStore } from '../store/pluginStore'
import { Button } from '../components/Button'
import { HeaderBar } from '../components/HeaderBar'

export function Plugins() {
  const {
    plugins,
    rules,
    scriptsEnabled,
    sandboxEnabled,
    enablePlugin,
    disablePlugin,
    uninstallPlugin,
    deleteRule,
    toggleScripts,
    toggleSandbox
  } = usePluginStore()

  const [showInstall, setShowInstall] = useState(false)

  // TODO: showInstall panel implementation
  void showInstall

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <HeaderBar />

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Plugins & Automation</h1>
            <p className="text-white/60 mt-1">
              Extend functionality with plugins and automation rules
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={toggleScripts}>
              <Code size={20} />
              Scripts: {scriptsEnabled ? 'ON' : 'OFF'}
            </Button>
            <Button onClick={() => setShowInstall(true)}>
              <Plus size={20} />
              Install Plugin
            </Button>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 flex items-start gap-3">
          <Shield size={20} className="text-yellow-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-yellow-400 mb-1">Security Settings</p>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={sandboxEnabled}
                  onChange={toggleSandbox}
                  className="w-4 h-4"
                />
                <span>Sandbox Mode (Recommended)</span>
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={scriptsEnabled}
                  onChange={toggleScripts}
                  className="w-4 h-4"
                />
                <span>Allow Script Execution</span>
              </label>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Installed Plugins */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Installed Plugins</h2>
            </div>

            {plugins.map((plugin) => (
              <div
                key={plugin.id}
                className="bg-white/5 border border-white/10 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      plugin.enabled ? 'bg-purple-500/20' : 'bg-white/10'
                    }`}>
                      <Plug size={20} className={plugin.enabled ? 'text-purple-400' : 'text-white/40'} />
                    </div>
                    <div>
                      <h3 className="font-semibold">{plugin.name}</h3>
                      <p className="text-xs text-white/60">v{plugin.version} by {plugin.author || 'Unknown'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => plugin.enabled ? disablePlugin(plugin.id) : enablePlugin(plugin.id)}
                    >
                      <Power size={16} />
                      {plugin.enabled ? 'Disable' : 'Enable'}
                    </Button>
                    <button
                      onClick={() => uninstallPlugin(plugin.id)}
                      className="text-white/40 hover:text-red-400 transition"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {plugin.description && (
                  <p className="text-sm text-white/60 mb-3">{plugin.description}</p>
                )}

                <div className="flex flex-wrap gap-2">
                  {plugin.permissions.map((perm, i) => (
                    <span
                      key={i}
                      className="text-xs bg-white/10 px-2 py-1 rounded"
                    >
                      {perm.type}: {perm.scope}
                    </span>
                  ))}
                </div>
              </div>
            ))}

            {plugins.length === 0 && (
              <div className="text-center text-white/40 py-12 border-2 border-dashed border-white/10 rounded-lg">
                <Plug size={48} className="mx-auto mb-4 opacity-20" />
                <p>No plugins installed</p>
                <p className="text-xs mt-1">Install plugins to extend functionality</p>
              </div>
            )}
          </div>

          {/* Automation Rules */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Automation Rules</h2>
              <Button size="sm">
                <Plus size={16} />
                Add Rule
              </Button>
            </div>

            {rules.map((rule) => (
              <div
                key={rule.id}
                className="bg-white/5 border border-white/10 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold">{rule.name}</h3>
                    <p className="text-xs text-white/60 mt-1">
                      Trigger: {rule.trigger}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded ${
                      rule.enabled ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/60'
                    }`}>
                      {rule.enabled ? 'Active' : 'Inactive'}
                    </span>
                    <button
                      onClick={() => deleteRule(rule.id)}
                      className="text-white/40 hover:text-red-400 transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="text-xs text-white/60 space-y-1">
                  <p>Conditions: {rule.conditions.length}</p>
                  <p>Actions: {rule.actions.length}</p>
                </div>
              </div>
            ))}

            {rules.length === 0 && (
              <div className="text-center text-white/40 py-12 border-2 border-dashed border-white/10 rounded-lg">
                <Settings size={48} className="mx-auto mb-4 opacity-20" />
                <p>No automation rules</p>
                <p className="text-xs mt-1">Create rules to automate tasks</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

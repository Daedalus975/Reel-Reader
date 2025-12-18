import React from 'react'
import metadataService from '../services/metadataService'

export const MetadataSettings: React.FC = () => {
  const providers = (metadataService as any)._providers || []

  return (
    <div className="bg-surface p-6 rounded-none mb-6 max-w-2xl">
      <h2 className="text-xl font-semibold text-light mb-4">Metadata Providers</h2>
      <div className="space-y-3">
        <p className="text-sm text-gray-400">Register metadata providers in <code>src/features/metadata/providers</code>. Providers are tried sequentially until a match is found.</p>
        <div className="pt-2">
          {providers.length ? (
            <div className="space-y-2">
              {providers.map((p: any) => (
                <div key={p.name} className="flex items-center justify-between p-2 bg-dark/10">
                  <div className="font-medium text-light">{p.name}</div>
                  <div className="text-xs text-gray-400">Adapter</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-400">No providers registered (example provider available).</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MetadataSettings

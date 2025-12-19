import React, { useState } from 'react'
import { Button } from './Button'
import { useAudioSettingsStore } from '@/store/audioSettingsStore'

interface AudioSettingsPanelProps {
  onClose?: () => void
}

export const AudioSettingsPanel: React.FC<AudioSettingsPanelProps> = ({ onClose }) => {
  const {
    crossfadeEnabled,
    crossfadeDuration,
    gaplessEnabled,
    normalizationEnabled,
    targetVolume,
    replayGainEnabled,
    replayGainMode,
    replayGainPreamp,
    eqEnabled,
    eqPreset,
    sleepTimerEnabled,
    sleepTimerMinutes,
    sleepTimerEndTime,
    setCrossfade,
    setGapless,
    setNormalization,
    setReplayGain,
    setEq,
    setSleepTimer,
    clearSleepTimer,
  } = useAudioSettingsStore()

  const [localSleepMinutes, setLocalSleepMinutes] = useState(sleepTimerMinutes)

  const timeRemaining = sleepTimerEndTime
    ? Math.max(0, Math.floor((sleepTimerEndTime - Date.now()) / 1000 / 60))
    : 0

  return (
    <div className="bg-surface text-light p-6 rounded-none border border-dark max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Audio Settings</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-light transition"
          >
            ✕
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* Crossfade */}
        <div className="border-b border-dark pb-4">
          <label className="flex items-center justify-between mb-2">
            <span className="font-medium">Crossfade</span>
            <input
              type="checkbox"
              checked={crossfadeEnabled}
              onChange={(e) => setCrossfade(e.target.checked)}
              className="w-4 h-4"
            />
          </label>
          {crossfadeEnabled && (
            <div>
              <label className="text-sm text-gray-400 block mb-1">
                Duration: {crossfadeDuration}s
              </label>
              <input
                type="range"
                min="0"
                max="12"
                step="0.5"
                value={crossfadeDuration}
                onChange={(e) => setCrossfade(true, parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          )}
        </div>

        {/* Gapless Playback */}
        <div className="border-b border-dark pb-4">
          <label className="flex items-center justify-between">
            <div>
              <span className="font-medium block">Gapless Playback</span>
              <span className="text-xs text-gray-400">
                Seamless transitions between tracks
              </span>
            </div>
            <input
              type="checkbox"
              checked={gaplessEnabled}
              onChange={(e) => setGapless(e.target.checked)}
              className="w-4 h-4"
            />
          </label>
        </div>

        {/* Loudness Normalization */}
        <div className="border-b border-dark pb-4">
          <label className="flex items-center justify-between mb-2">
            <span className="font-medium">Loudness Normalization</span>
            <input
              type="checkbox"
              checked={normalizationEnabled}
              onChange={(e) => setNormalization(e.target.checked)}
              className="w-4 h-4"
            />
          </label>
          {normalizationEnabled && (
            <div>
              <label className="text-sm text-gray-400 block mb-1">
                Target Volume: {Math.round(targetVolume * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={targetVolume}
                onChange={(e) => setNormalization(true, parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          )}
        </div>

        {/* ReplayGain */}
        <div className="border-b border-dark pb-4">
          <label className="flex items-center justify-between mb-2">
            <span className="font-medium">ReplayGain</span>
            <input
              type="checkbox"
              checked={replayGainEnabled}
              onChange={(e) => setReplayGain(e.target.checked)}
              className="w-4 h-4"
            />
          </label>
          {replayGainEnabled && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <button
                  onClick={() => setReplayGain(true, 'track')}
                  className={`flex-1 px-3 py-1 text-sm rounded-none ${
                    replayGainMode === 'track'
                      ? 'bg-primary text-white'
                      : 'bg-dark text-light'
                  }`}
                >
                  Track
                </button>
                <button
                  onClick={() => setReplayGain(true, 'album')}
                  className={`flex-1 px-3 py-1 text-sm rounded-none ${
                    replayGainMode === 'album'
                      ? 'bg-primary text-white'
                      : 'bg-dark text-light'
                  }`}
                >
                  Album
                </button>
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-1">
                  Pre-amp: {replayGainPreamp > 0 ? '+' : ''}{replayGainPreamp} dB
                </label>
                <input
                  type="range"
                  min="-15"
                  max="15"
                  step="1"
                  value={replayGainPreamp}
                  onChange={(e) => setReplayGain(true, undefined, parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          )}
        </div>

        {/* EQ Presets */}
        <div className="border-b border-dark pb-4">
          <label className="flex items-center justify-between mb-2">
            <span className="font-medium">Equalizer</span>
            <input
              type="checkbox"
              checked={eqEnabled}
              onChange={(e) => setEq(e.target.checked)}
              className="w-4 h-4"
            />
          </label>
          {eqEnabled && (
            <select
              value={eqPreset}
              onChange={(e) => setEq(true, e.target.value)}
              className="w-full bg-dark text-light px-3 py-2 text-sm rounded-none border border-dark"
            >
              <option value="flat">Flat</option>
              <option value="rock">Rock</option>
              <option value="pop">Pop</option>
              <option value="jazz">Jazz</option>
              <option value="classical">Classical</option>
              <option value="electronic">Electronic</option>
              <option value="bass-boost">Bass Boost</option>
            </select>
          )}
        </div>

        {/* Sleep Timer */}
        <div className="border-b border-dark pb-4">
          <label className="flex items-center justify-between mb-2">
            <span className="font-medium">Sleep Timer</span>
            <input
              type="checkbox"
              checked={sleepTimerEnabled}
              onChange={(e) => {
                if (e.target.checked) {
                  setSleepTimer(localSleepMinutes)
                } else {
                  clearSleepTimer()
                }
              }}
              className="w-4 h-4"
            />
          </label>
          {sleepTimerEnabled && (
            <div className="space-y-2">
              <p className="text-sm text-gray-400">
                Music will stop in {timeRemaining} minute{timeRemaining !== 1 ? 's' : ''}
              </p>
              <Button variant="secondary" size="sm" onClick={clearSleepTimer}>
                Cancel Timer
              </Button>
            </div>
          )}
          {!sleepTimerEnabled && (
            <div className="flex gap-2 mt-2">
              <input
                type="number"
                min="1"
                max="180"
                value={localSleepMinutes}
                onChange={(e) => setLocalSleepMinutes(parseInt(e.target.value) || 30)}
                className="flex-1 bg-dark text-light px-3 py-2 text-sm rounded-none border border-dark"
                placeholder="Minutes"
              />
              <Button
                variant="primary"
                size="sm"
                onClick={() => setSleepTimer(localSleepMinutes)}
              >
                Set Timer
              </Button>
            </div>
          )}
        </div>
      </div>

      {onClose && (
        <div className="mt-6 flex justify-end">
          <Button variant="primary" size="md" onClick={onClose}>
            Done
          </Button>
        </div>
      )}
    </div>
  )
}

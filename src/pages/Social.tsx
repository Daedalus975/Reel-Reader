import { useState } from 'react'
import { Users, Share2, Send, Heart, MessageCircle, X } from 'lucide-react'
import { useSocialStore } from '../store/socialStore'
import { useWatchPartyStore } from '../store/watchPartyStore'
import { Button } from '../components/Button'
import { HeaderBar } from '../components/HeaderBar'

export function Social() {
  const {
    friends,
    shareLinks,
    recommendations,
    createShareLink,
    sendFriendRequest
  } = useSocialStore()

  const { parties } = useWatchPartyStore()
  const [friendUsername, setFriendUsername] = useState('')

  const handleCreateShareLink = (mediaId: string) => {
    const link = createShareLink(mediaId, { expiresIn: 86400, maxAccess: 10 })
    const url = `${window.location.origin}/shared/${link.token}`
    navigator.clipboard.writeText(url)
    alert('Share link copied to clipboard!')
  }

  const handleSendFriendRequest = () => {
    if (friendUsername.trim()) {
      sendFriendRequest(friendUsername)
      setFriendUsername('')
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <HeaderBar />

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Social</h1>
          <p className="text-white/60 mt-1">Connect and share with friends</p>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Friends */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users size={20} />
              <h2 className="text-xl font-semibold">Friends</h2>
            </div>

            <div className="mb-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={friendUsername}
                  onChange={(e) => setFriendUsername(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendFriendRequest()}
                  placeholder="Username..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                />
                <Button size="sm" onClick={handleSendFriendRequest}>
                  <Send size={16} />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              {friends.filter(f => f.status === 'accepted').map((friend) => (
                <div
                  key={friend.id}
                  className="flex items-center gap-3 p-3 bg-white/5 rounded-lg"
                >
                  <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                    <Users size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{friend.username}</p>
                    <p className="text-xs text-green-400">Online</p>
                  </div>
                  <Button variant="secondary" size="sm">
                    <MessageCircle size={16} />
                  </Button>
                </div>
              ))}

              {friends.filter(f => f.status === 'accepted').length === 0 && (
                <p className="text-center text-white/40 py-8 text-sm">
                  No friends yet
                </p>
              )}
            </div>

            {/* Pending Requests */}
            {friends.filter(f => f.status === 'pending').length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-sm text-white/60 mb-2">Pending Requests</p>
                {friends.filter(f => f.status === 'pending').map((friend) => (
                  <div
                    key={friend.id}
                    className="flex items-center justify-between p-2 bg-white/5 rounded-lg mb-2"
                  >
                    <span className="text-sm">{friend.username}</span>
                    <Button size="sm">Accept</Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Share Links */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Share2 size={20} />
              <h2 className="text-xl font-semibold">Share Links</h2>
            </div>

            <div className="space-y-2">
              {shareLinks.slice(0, 5).map((link) => (
                <div
                  key={link.id}
                  className="p-3 bg-white/5 rounded-lg"
                >
                  <p className="text-sm font-medium truncate">Media ID: {link.mediaId}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-white/60">
                      {link.accessCount} views
                    </span>
                    <button
                      onClick={() => handleCreateShareLink(link.mediaId)}
                      className="text-xs text-purple-400 hover:text-purple-300"
                    >
                      Copy Link
                    </button>
                  </div>
                </div>
              ))}

              {shareLinks.length === 0 && (
                <p className="text-center text-white/40 py-8 text-sm">
                  No active share links
                </p>
              )}
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Heart size={20} />
              <h2 className="text-xl font-semibold">Recommendations</h2>
            </div>

            <div className="space-y-2">
              {recommendations.filter(r => !r.viewed).map((rec) => (
                <div
                  key={rec.id}
                  className="p-3 bg-white/5 rounded-lg"
                >
                  <p className="text-sm font-medium">From {rec.fromUserId}</p>
                  {rec.message && (
                    <p className="text-xs text-white/60 mt-1">{rec.message}</p>
                  )}
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" variant="secondary" className="flex-1">
                      View
                    </Button>
                    <button className="text-white/40 hover:text-white">
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))}

              {recommendations.filter(r => !r.viewed).length === 0 && (
                <p className="text-center text-white/40 py-8 text-sm">
                  No new recommendations
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Watch Parties */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users size={20} />
              <h2 className="text-xl font-semibold">Watch Parties</h2>
            </div>
            <Button>
              <Users size={20} />
              Create Party
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {parties.filter(p => p.status !== 'ended').map((party) => (
              <div
                key={party.id}
                className="bg-white/5 border border-white/10 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Party {party.id.slice(0, 8)}</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    party.status === 'playing' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {party.status}
                  </span>
                </div>
                <p className="text-xs text-white/60 mb-3">
                  {party.participants.length} participants
                </p>
                <Button size="sm" className="w-full">
                  Join Party
                </Button>
              </div>
            ))}

            {parties.filter(p => p.status !== 'ended').length === 0 && (
              <div className="col-span-2 text-center text-white/40 py-8">
                <Users size={48} className="mx-auto mb-4 opacity-20" />
                <p>No active watch parties</p>
                <p className="text-xs mt-1">Create one to watch with friends</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

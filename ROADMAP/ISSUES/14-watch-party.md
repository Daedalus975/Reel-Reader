# Watch Party (Social Viewing)

**Status**: Deferred  
**Priority**: Low  
**Feature Flag**: `feature_watch_party`

## Overview
Enable synchronized watch parties where multiple users can watch the same content together with synced playback and a chat/reactions system.

## User Story
As a user, I want to host watch parties with friends so that we can watch movies/shows together remotely with synchronized playback.

## Acceptance Criteria
- [ ] Create watch party (generate shareable link)
- [ ] Join watch party via link
- [ ] Host controls (play/pause/seek) sync to all participants
- [ ] Participant list display
- [ ] Real-time chat panel
- [ ] Reactions/emojis overlay on video
- [ ] Playback position sync (within 1-2 seconds)
- [ ] Auto-pause when host pauses
- [ ] Kick/ban participants (host only)
- [ ] Watch party history

## Technical Details

### Dependencies
```bash
npm install socket.io-client
# OR use WebRTC for peer-to-peer sync
npm install simple-peer
```

### Backend Required
- WebSocket server for real-time sync
- Room/session management
- Authentication (profile-based)

### New Files
- `src/services/watchParty.ts` — WebSocket client for sync
- `src/store/watchPartyStore.ts` — Party state management
- `src/components/WatchPartyPanel.tsx` — Chat/participants UI
- `src/pages/WatchPartyHost.tsx` — Host watch party page
- `src/pages/WatchPartyJoin.tsx` — Join watch party page

### Integration Points
- Extend VideoPlayer to receive sync events
- Add "Start Watch Party" button in Detail page
- Wire chat to WebSocket messages

## Sync Algorithm
1. Host broadcasts play/pause/seek events
2. Participants adjust local playback position
3. Periodic sync checks every 5s to correct drift
4. Buffer participants slightly behind host to avoid stuttering

## Implementation Steps
1. Set up WebSocket server (Node.js + socket.io)
2. Implement room/session management backend
3. Create watch party client service
4. Build WatchPartyPanel UI (chat + participants)
5. Wire VideoPlayer to sync events
6. Add host controls and participant list
7. Implement reactions overlay
8. Test with multiple clients/browsers
9. Add bandwidth/quality negotiation

## Testing
- [ ] Test with 2-10 participants
- [ ] Verify playback sync within 2s
- [ ] Test host pause/play/seek propagation
- [ ] Verify chat messages deliver in real-time
- [ ] Test kick/ban functionality
- [ ] Simulate network lag and verify graceful handling

## Security Considerations
- Require authentication (profile-based)
- Rate-limit chat messages
- Encrypt watch party links
- Expire links after 24h or party end

## Related Issues
- #11-video-player (requires video player)
- #04-profiles-security (for authentication)
- #12-social-community (for broader social features)

## Design Considerations
- Chat panel: right sidebar (30% width)
- Reactions: floating emojis over video (top-right)
- Participant list: compact avatars/names
- Square corners, dark theme

## Links
- [socket.io docs](https://socket.io/docs/)
- [simple-peer docs](https://github.com/feross/simple-peer)
- PRD: Optional → Watch Parties
- OPTIONAL_FEATURES: #12 Social & Community

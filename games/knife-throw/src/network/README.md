# Network Architecture Documentation

## Overview

The networking code has been refactored into a modular architecture with clear separation of concerns:

```
client/src/network/
├── NetworkManager.js          # Main coordinator (Socket.IO + matchmaking)
├── GameConnection.js          # Generic WebRTC for game state (reusable)
├── VideoConnection.js         # WebRTC for video/audio streaming
├── KnifeThrowConnection.js    # Game-specific logic for Knife Throw
└── NetworkProtocol.js         # Binary protocol encoder/decoder
```

---

## Architecture

### 1. **NetworkManager.js** - Main Coordinator

**Responsibilities:**
- Socket.IO connection management
- Authentication with Firebase token
- Matchmaking (join queue, match found)
- Coordinates GameConnection and VideoConnection
- **Game-agnostic** - no game-specific code

**Public API:**

```javascript
// Constructor
const network = new NetworkManager(scene);

// Methods
await network.connect()                    // Connect to signaling server
network.findMatch(preferences)             // Join matchmaking queue
network.disconnect()                       // Disconnect all connections

// Properties (read-only)
network.isConnected                        // Game connection status
network.isVideoConnected                   // Video connection status
network.gameConnection                     // Access to GameConnection instance
network.videoConnection                    // Access to VideoConnection instance
```

**Events Emitted (on scene.events):**
- `queued` - Added to matchmaking queue
- `match_found` - Match found with config data

---

### 2. **GameConnection.js** - Generic Game State WebRTC

**Responsibilities:**
- WebRTC peer connection setup
- Data channel creation (reliable + unreliable)
- Offer/Answer/ICE candidate handling
- Connection state management
- **Game-agnostic** - can be reused for any game

**Public API:**

```javascript
// Constructor
const gameConn = new GameConnection(socket, eventEmitter);

// Methods
await gameConn.initialize(config)          // Initialize WebRTC
gameConn.send(data, reliable)              // Send binary data
await gameConn.handleOffer(data)           // Handle incoming offer
await gameConn.handleAnswer(data)          // Handle incoming answer
await gameConn.handleCandidate(data)       // Handle ICE candidate
gameConn.close()                           // Close connection

// Properties
gameConn.isConnected                       // Connection status
gameConn.isInitiator                       // Is this peer the initiator
gameConn.roomId                            // Room ID
gameConn.opponentId                        // Opponent's socket ID
```

**Config Object:**
```javascript
{
    isInitiator: boolean,      // Whether this peer creates the offer
    opponentId: string,        // Opponent's socket ID
    roomId: string,            // Room identifier
    iceServers: Array          // TURN/STUN server configuration
}
```

**Events Emitted:**
- `game_connection_established` - WebRTC connected
- `game_connection_lost` - Connection lost
- `game_datachannel_open` - Data channel ready
- `game_data_received` - Raw data received `{ data: ArrayBuffer, channel: string }`

---

### 3. **VideoConnection.js** - Video/Audio Streaming

**Responsibilities:**
- WebRTC peer connection for media
- Local media capture (camera/microphone)
- Remote media stream handling
- Audio/video muting controls

**Public API:**

```javascript
// Constructor
const videoConn = new VideoConnection(socket, eventEmitter);

// Methods
await videoConn.initialize(config)         // Initialize WebRTC
await videoConn.startLocalMedia(constraints) // Start camera/mic
await videoConn.createAndSendOffer()       // Create and send offer
await videoConn.handleOffer(data)          // Handle incoming offer
await videoConn.handleAnswer(data)         // Handle incoming answer
await videoConn.handleCandidate(data)      // Handle ICE candidate
videoConn.toggleAudio(enabled)             // Mute/unmute audio
videoConn.toggleVideo(enabled)             // Enable/disable video
videoConn.stopLocalMedia()                 // Stop camera/mic
videoConn.close()                          // Close connection

// Properties
videoConn.isConnected                      // Connection status
videoConn.localStream                      // Local MediaStream
videoConn.remoteStream                     // Remote MediaStream
```

**Media Constraints:**
```javascript
{
    video: true,               // Enable video
    audio: true                // Enable audio
}
```

**Events Emitted:**
- `video_connection_established` - Video WebRTC connected
- `video_connection_lost` - Connection lost
- `local_video_track` - Local media stream ready (MediaStream)
- `remote_video_track` - Remote media stream received (MediaStream)

---

## Integration Guide for New Games

### Step 1: Create Your Game-Specific Protocol

Create a protocol encoder/decoder for your game messages:

```javascript
// MyGameProtocol.js
export const MSG_TYPE = {
    MOVE: 1,
    ATTACK: 2,
    CHAT: 3
};

export class MyGameProtocol {
    static encode(data) {
        switch (data.type) {
            case 'move':
                return this.encodeMove(data);
            case 'attack':
                return this.encodeAttack(data);
            default:
                console.error('Unknown message type:', data.type);
                return null;
        }
    }

    static decode(buffer) {
        const view = new DataView(buffer);
        const type = view.getUint8(0);

        switch (type) {
            case MSG_TYPE.MOVE:
                return this.decodeMove(view);
            case MSG_TYPE.ATTACK:
                return this.decodeAttack(view);
            default:
                console.error('Unknown message type:', type);
                return null;
        }
    }

    static encodeMove(data) {
        // [Type:1][X:2][Y:2][Timestamp:4] = 9 bytes
        const buffer = new ArrayBuffer(9);
        const view = new DataView(buffer);
        
        view.setUint8(0, MSG_TYPE.MOVE);
        view.setInt16(1, data.x);
        view.setInt16(3, data.y);
        view.setUint32(5, data.timestamp);
        
        return buffer;
    }

    static decodeMove(view) {
        return {
            type: 'move',
            x: view.getInt16(1),
            y: view.getInt16(3),
            timestamp: view.getUint32(5)
        };
    }

    // Add more encoders/decoders...
}
```

---

### Step 2: Create Your Game-Specific Connection Class

```javascript
// MyGameConnection.js
import { MyGameProtocol } from './MyGameProtocol.js';
import { GameConnection } from './GameConnection.js';

export class MyGameConnection {
    constructor(gameConnection, scene) {
        if (!(gameConnection instanceof GameConnection)) {
            throw new Error('MyGameConnection requires a GameConnection instance');
        }
        
        this.gameConnection = gameConnection;
        this.scene = scene;
        this.setupMessageHandlers();
    }

    /**
     * Setup handlers for game-specific messages
     */
    setupMessageHandlers() {
        this.scene.events.on('game_data_received', (event) => {
            const msg = MyGameProtocol.decode(event.data);
            if (msg) {
                this.handleGameMessage(msg);
            }
        });
    }

    /**
     * Handle incoming game messages
     */
    handleGameMessage(msg) {
        switch (msg.type) {
            case 'move':
                this.scene.events.emit('opponent_move', {
                    x: msg.x,
                    y: msg.y,
                    timestamp: msg.timestamp
                });
                break;

            case 'attack':
                this.scene.events.emit('opponent_attack', {
                    damage: msg.damage,
                    timestamp: msg.timestamp
                });
                break;

            default:
                console.log('[MyGame] Unknown message:', msg.type);
        }
    }

    /**
     * Send player move
     */
    sendMove(x, y) {
        const data = {
            type: 'move',
            x: x,
            y: y,
            timestamp: Date.now()
        };
        
        const encoded = MyGameProtocol.encode(data);
        if (encoded) {
            this.gameConnection.send(encoded, true); // Reliable
        }
    }

    /**
     * Send attack
     */
    sendAttack(damage) {
        const data = {
            type: 'attack',
            damage: damage,
            timestamp: Date.now()
        };
        
        const encoded = MyGameProtocol.encode(data);
        if (encoded) {
            this.gameConnection.send(encoded, true); // Reliable
        }
    }

    /**
     * Cleanup
     */
    destroy() {
        this.scene.events.off('game_data_received');
    }
}
```

---

### Step 3: Integrate in Your Game Scene

```javascript
// MyGameScene.js
import Phaser from 'phaser';
import { NetworkManager } from '../network/NetworkManager.js';
import { MyGameConnection } from '../network/MyGameConnection.js';

export class MyGameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MyGameScene' });
    }

    init() {
        // Network - Generic network manager
        this.network = new NetworkManager(this);
        
        // Game-specific connection (initialized after match found)
        this.gameConnection = null;
    }

    create() {
        // Setup network event listeners
        this.setupNetworkEvents();
        
        // Connect to server
        this.connectToServer();
        
        // Setup input handlers
        this.input.on('pointerdown', this.handleClick, this);
    }

    async connectToServer() {
        try {
            await this.network.connect();
            console.log('Finding opponent...');
            this.network.findMatch(); // Or with preferences: findMatch({ gender: 'female' })
        } catch (error) {
            console.error('Failed to connect:', error);
        }
    }

    setupNetworkEvents() {
        // Matchmaking events
        this.events.on('queued', () => {
            console.log('Waiting for opponent...');
        });

        this.events.on('match_found', (msg) => {
            console.log('Match found!', msg);
        });

        // Game connection established
        this.events.on('game_datachannel_open', () => {
            console.log('Game connection ready!');
            
            // Initialize game-specific connection
            this.gameConnection = new MyGameConnection(
                this.network.gameConnection,
                this
            );
            
            // Start the game
            this.startGame();
        });

        // Game-specific events
        this.events.on('opponent_move', (data) => {
            console.log('Opponent moved to:', data.x, data.y);
            this.handleOpponentMove(data);
        });

        this.events.on('opponent_attack', (data) => {
            console.log('Opponent attacked for:', data.damage);
            this.handleOpponentAttack(data);
        });
    }

    handleClick(pointer) {
        if (this.gameConnection) {
            // Send move to opponent
            this.gameConnection.sendMove(pointer.x, pointer.y);
        }
    }

    handleOpponentMove(data) {
        // Update opponent position
        // ... your game logic
    }

    handleOpponentAttack(data) {
        // Handle opponent attack
        // ... your game logic
    }

    startGame() {
        // Initialize your game
        console.log('Game started!');
    }
}
```

---

### Step 4: (Optional) Add Video Chat

```javascript
setupNetworkEvents() {
    // ... existing events ...

    // Video connection events
    this.events.on('local_video_track', (stream) => {
        // Display local video
        const videoElement = document.getElementById('local-video');
        videoElement.srcObject = stream;
    });

    this.events.on('remote_video_track', (stream) => {
        // Display remote video
        const videoElement = document.getElementById('remote-video');
        videoElement.srcObject = stream;
    });
}
```

---

## Complete API Reference

### NetworkManager

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `constructor` | `scene` | `NetworkManager` | Create instance |
| `connect()` | - | `Promise<void>` | Connect to signaling server |
| `findMatch()` | `preferences?` | `void` | Join matchmaking queue |
| `disconnect()` | - | `void` | Disconnect all connections |

**Properties:**
- `isConnected` (boolean) - Game connection status
- `isVideoConnected` (boolean) - Video connection status
- `gameConnection` (GameConnection) - Game connection instance
- `videoConnection` (VideoConnection) - Video connection instance

---

### GameConnection

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `constructor` | `socket, eventEmitter` | `GameConnection` | Create instance |
| `initialize()` | `config` | `Promise<void>` | Initialize WebRTC |
| `send()` | `data: ArrayBuffer, reliable: boolean` | `boolean` | Send binary data |
| `handleOffer()` | `data` | `Promise<void>` | Handle incoming offer |
| `handleAnswer()` | `data` | `Promise<void>` | Handle incoming answer |
| `handleCandidate()` | `data` | `Promise<void>` | Handle ICE candidate |
| `close()` | - | `void` | Close connection |

**Properties:**
- `isConnected` (boolean) - Connection status
- `isInitiator` (boolean) - Is this peer the initiator
- `roomId` (string) - Room ID
- `opponentId` (string) - Opponent's socket ID

**Events:**
- `game_connection_established` - Connection ready
- `game_datachannel_open` - Data channel open
- `game_data_received` - Data received `{ data, channel }`

---

### VideoConnection

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `constructor` | `socket, eventEmitter` | `VideoConnection` | Create instance |
| `initialize()` | `config` | `Promise<void>` | Initialize WebRTC |
| `startLocalMedia()` | `constraints?` | `Promise<MediaStream>` | Start camera/mic |
| `createAndSendOffer()` | - | `Promise<void>` | Create and send offer |
| `handleOffer()` | `data` | `Promise<void>` | Handle incoming offer |
| `handleAnswer()` | `data` | `Promise<void>` | Handle incoming answer |
| `handleCandidate()` | `data` | `Promise<void>` | Handle ICE candidate |
| `toggleAudio()` | `enabled: boolean` | `void` | Mute/unmute audio |
| `toggleVideo()` | `enabled: boolean` | `void` | Enable/disable video |
| `stopLocalMedia()` | - | `void` | Stop camera/mic |
| `close()` | - | `void` | Close connection |

**Properties:**
- `isConnected` (boolean) - Connection status
- `localStream` (MediaStream) - Local media stream
- `remoteStream` (MediaStream) - Remote media stream

**Events:**
- `video_connection_established` - Connection ready
- `local_video_track` - Local stream ready (MediaStream)
- `remote_video_track` - Remote stream received (MediaStream)

---

## Message Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Your Game Scene                         │
│  - Game logic                                               │
│  - Input handling                                           │
│  - Rendering                                                │
└──────────────┬──────────────────────────────────────────────┘
               │
               │ Creates
               ▼
    ┌──────────────────────┐
    │  NetworkManager      │
    │  - Matchmaking       │
    │  - Socket.IO         │
    └────────┬─────────────┘
             │
             │ Initializes
             ▼
    ┌──────────────────────┐
    │  GameConnection      │
    │  - WebRTC            │
    │  - DataChannels      │
    └────────┬─────────────┘
             │
             │ Wraps
             ▼
    ┌──────────────────────┐
    │  YourGameConnection  │
    │  - Protocol          │
    │  - Game messages     │
    └──────────────────────┘
```

---

## Best Practices

### 1. **Use Reliable Channel for Critical Data**
```javascript
// Critical game state (moves, scores, etc.)
gameConnection.send(data, true);  // reliable = true
```

### 2. **Use Unreliable Channel for Frequent Updates**
```javascript
// Frequent updates (positions, rotations, etc.)
gameConnection.send(data, false); // reliable = false
```

### 3. **Binary Protocol for Efficiency**
```javascript
// Use binary encoding for network efficiency
const buffer = new ArrayBuffer(8);
const view = new DataView(buffer);
view.setUint8(0, MSG_TYPE.MOVE);
view.setInt16(1, x);
view.setInt16(3, y);
```

### 4. **Handle Disconnections**
```javascript
this.events.on('game_connection_lost', () => {
    // Show reconnection UI
    // Pause game
    // Wait for reconnection
});
```

### 5. **Clean Up on Scene Shutdown**
```javascript
shutdown() {
    if (this.gameConnection) {
        this.gameConnection.destroy();
    }
    this.network.disconnect();
}
```

---

## Debugging

### Enable Detailed Logging

The code already includes detailed logging. Check browser console for:

```
[NetworkManager] Connected to signaling server
[NetworkManager] Added to queue: {...}
=== MATCH FOUND ===
[GameConnection] Initializing WebRTC...
[GameConnection] DataChannel game_reliable OPEN
[YourGame] Setting up message handlers
[GameConnection] Data received on game_reliable, size: 9 bytes
[YourGame] Decoded message: move
```

### Check Connection States

```javascript
console.log('Game connected:', network.gameConnection.isConnected);
console.log('Video connected:', network.videoConnection?.isConnected);
console.log('Room ID:', network.gameConnection.roomId);
```

### Monitor Data Flow

```javascript
this.events.on('game_data_received', (event) => {
    console.log('Raw data received:', event.data.byteLength, 'bytes');
});
```

---

## Example: Complete Chess Game Integration

```javascript
// ChessProtocol.js
export const MSG_TYPE = {
    MOVE: 1,
    RESIGN: 2,
    DRAW_OFFER: 3
};

export class ChessProtocol {
    static encode(data) {
        switch (data.type) {
            case 'move':
                // [Type:1][From:1][To:1][Promotion:1] = 4 bytes
                const buffer = new ArrayBuffer(4);
                const view = new DataView(buffer);
                view.setUint8(0, MSG_TYPE.MOVE);
                view.setUint8(1, data.from); // 0-63
                view.setUint8(2, data.to);   // 0-63
                view.setUint8(3, data.promotion || 0);
                return buffer;
            // ... other cases
        }
    }

    static decode(buffer) {
        const view = new DataView(buffer);
        const type = view.getUint8(0);
        
        switch (type) {
            case MSG_TYPE.MOVE:
                return {
                    type: 'move',
                    from: view.getUint8(1),
                    to: view.getUint8(2),
                    promotion: view.getUint8(3)
                };
            // ... other cases
        }
    }
}

// ChessConnection.js
import { ChessProtocol } from './ChessProtocol.js';
import { GameConnection } from './GameConnection.js';

export class ChessConnection {
    constructor(gameConnection, scene) {
        this.gameConnection = gameConnection;
        this.scene = scene;
        this.setupMessageHandlers();
    }

    setupMessageHandlers() {
        this.scene.events.on('game_data_received', (event) => {
            const msg = ChessProtocol.decode(event.data);
            if (msg) {
                this.handleGameMessage(msg);
            }
        });
    }

    handleGameMessage(msg) {
        switch (msg.type) {
            case 'move':
                this.scene.events.emit('opponent_move', msg);
                break;
        }
    }

    sendMove(from, to, promotion) {
        const data = { type: 'move', from, to, promotion };
        const encoded = ChessProtocol.encode(data);
        if (encoded) {
            this.gameConnection.send(encoded, true);
        }
    }
}

// ChessScene.js
import { NetworkManager } from '../network/NetworkManager.js';
import { ChessConnection } from '../network/ChessConnection.js';

export class ChessScene extends Phaser.Scene {
    init() {
        this.network = new NetworkManager(this);
        this.chessConnection = null;
    }

    create() {
        this.setupNetworkEvents();
        this.connectToServer();
    }

    async connectToServer() {
        await this.network.connect();
        this.network.findMatch();
    }

    setupNetworkEvents() {
        this.events.on('game_datachannel_open', () => {
            this.chessConnection = new ChessConnection(
                this.network.gameConnection,
                this
            );
        });

        this.events.on('opponent_move', (data) => {
            this.makeMove(data.from, data.to, data.promotion);
        });
    }

    onPieceMoved(from, to, promotion) {
        this.chessConnection.sendMove(from, to, promotion);
    }
}
```

---

## Summary

✅ **NetworkManager** - Handles matchmaking and coordination
✅ **GameConnection** - Generic WebRTC (reusable for any game)
✅ **VideoConnection** - Generic video/audio (reusable)
✅ **YourGameConnection** - Game-specific logic
✅ **YourGameProtocol** - Binary encoding/decoding

This architecture provides:
- **Separation of concerns** - Each class has one job
- **Reusability** - Core networking works for any game
- **Maintainability** - Easy to find and fix bugs
- **Scalability** - Easy to add features
- **Performance** - Binary protocol for efficiency

# 🔥 MiniRedis - A Redis-like In-Memory Data Store in Node.js

> A lightweight Redis clone built using **vanilla JavaScript** and raw TCP sockets — no external libraries used.

---

## 🚀 Features

- 🧠 In-memory key-value store
- 🔐 Password-based authentication
- 🚝 Commands: `SET`, `GET`, `DEL`, `EXPIRE`, `TTL`, `INCR`, `DECR`
- 📚 List operations: `LPUSH`, `RPUSH`, `LPOP`, `RPOP`, `LRANGE`
- 🥒 Key expiration support
- 📂 Optional persistence:

  - **RDB-like** snapshotting
  - **AOF** (Append Only File) command logging

- 🧪 RESP protocol-compatible parsing
- 📜 Custom logger with namespace filtering
- 🧼 Written in **pure Node.js (no external dependencies)**

---

## 📦 Setup

### 1. Clone the Repo

```bash
git clone https://github.com/your-username/miniredis.git
cd miniredis
```

### 2. Run the Server

```bash
node server.js
```

By default, it starts on `127.0.0.1:6379`.

✅ **No need to install packages — built using only core Node.js modules.**

---

## ⚙️ Configuration

Edit `config.json`:

```json
{
  "snapshot": false,
  "snapshotInterval": 5000,
  "appendonly": true,
  "aofCommands": [
    "SET",
    "DEL",
    "INCR",
    "DECR",
    "LPUSH",
    "RPUSH",
    "LPOP",
    "RPOP"
  ],
  "password": "admin123"
}
```

- `snapshot`: enables RDB-like periodic snapshotting
- `appendonly`: enables AOF command logging
- `password`: required by clients before executing commands

---

## 💡 Supported Commands

| Command                 | Description             |
| ----------------------- | ----------------------- |
| `AUTH`                  | Authenticate client     |
| `SET key val`           | Set a string value      |
| `GET key`               | Get a string value      |
| `DEL key`               | Delete a key            |
| `EXPIRE key sec`        | Set TTL in seconds      |
| `TTL key`               | Time left before expiry |
| `INCR key`              | Increment integer value |
| `DECR key`              | Decrement integer value |
| `LPUSH key val`         | Push to list (left)     |
| `RPUSH key val`         | Push to list (right)    |
| `LPOP key`              | Pop left value          |
| `RPOP key`              | Pop right value         |
| `LRANGE key start stop` | Get range from list     |
| `COMMAND`               | Health check (`+OK`)    |

---

## 🧪 Example (with Redis CLI)

```bash
redis-cli -p 6379
> AUTH admin123
OK

> SET name yash
OK

> GET name
"yash"

> LPUSH skills NodeJS
(integer) 1

> LRANGE skills 0 -1
1) "NodeJS"
```

---

## 📂 Project Structure

```
.
├── server.js         # TCP server entry point
├── core.js           # Command execution + RESP parsing
├── persistence.js    # Snapshot & AOF logic
├── utils/
│   ├── auth.js       # Auth logic
│   └── logger.js     # Custom logger
├── config.json       # App configuration
```

---

## 🧼 No Dependencies

This project uses **no external libraries** — built entirely with:

- `net`, `fs`, `path` – core Node.js modules
- JavaScript only (no frameworks)

---

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you'd like to change.

---

## 📜 License

MIT © Yashwant Soni

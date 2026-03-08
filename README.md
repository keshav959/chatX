# ChatX Social Backend (MVP)

Spring Boot backend scaffold with:
- JWT stateless auth (`Spring Security`)
- MySQL for users/posts/follows
- MongoDB for chat messages
- REST APIs for auth, profile, social graph, posts/feed, chats
- WebSocket STOMP endpoint for live chat broadcast

## Requirements
- Java 21+
- Maven 3.9+
- Docker + Docker Compose

## Run locally

1. Start data stores:
```bash
docker compose up -d
```

2. Start backend:
```bash
mvn spring-boot:run
```

Server runs at `http://localhost:8080`.

### Frontend
- Open `http://localhost:8080/` for the built-in UI (served from `src/main/resources/static`).
- If backend runs on another port (for example `8090`), open that port in your browser.

## Key endpoints

### Auth
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/refresh`

### Users / Social Graph
- `GET /api/users/{id}`
- `PUT /api/users/{id}`
- `POST /api/users/{id}/follow`
- `DELETE /api/users/{id}/follow`
- `GET /api/users/{id}/social`

### Posts / Feed
- `POST /api/posts`
- `GET /api/feed?page=0&size=20`

### Messaging
- `POST /api/chats/{chatId}/messages`
- `GET /api/chats/{chatId}/messages?size=50`
- WebSocket endpoint: `/ws`
- STOMP send destination: `/app/chat.send.{chatId}`
- STOMP subscription topic: `/topic/chat.{chatId}`

## Notes
- `app.jwt.secret` in `application.yml` is for local development only.
- WebSocket message payload currently includes `senderId`; for production, bind sender from authenticated principal.

## Postman
- Collection: `postman/ChatX-Social-Backend.postman_collection.json`
- Environment: `postman/ChatX-Local.postman_environment.json`

Suggested order:
1. `Health`
2. `Auth` (signup/login)
3. `Users & Social`
4. `Posts & Feed`
5. `Chat`

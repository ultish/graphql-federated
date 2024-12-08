# Start Application
```
pnpm ts-node users.ts
```


# Offline GraphIQL
https://the-guild.dev/graphql/yoga-server/docs/features/graphiql 

Install dependencies
```bash
pnpm add @graphql-yoga/render-graphiql
```

Modify yoga
```typescript
import { createYoga } from 'graphql-yoga'
import { renderGraphiQL } from '@graphql-yoga/render-graphiql'
 
const yoga = createYoga({ renderGraphiQL })
```

# Websocket vs SSE
By default Yoga uses SSE to stream subscriptions. If you want to use WebSockets instead, you can use the `graphql-ws` package.
This project is currently set up to use Websockets. See users.ts for details.
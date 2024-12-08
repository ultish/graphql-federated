
import { parse } from 'graphql';
import { buildSubgraphSchema } from '@apollo/subgraph';
import { createYoga } from 'graphql-yoga';
import { createServer } from 'http'; 
import { renderGraphiQL } from '@graphql-yoga/render-graphiql'
import { setTimeout as setTimeout$ } from 'node:timers/promises'
import { WebSocketServer } from 'ws'
import { useServer } from 'graphql-ws/lib/use/ws';
 
 
const edsTypeDefs = parse(/* GraphQL */ `
  directive @edfs__natsPublish(subject: String!, providerId: String! = "default") on FIELD_DEFINITION

  type UpdateUserInput {
    forename: String!
    surname: String!
  }

  type Mutation {
    updateUser(id: ID!, update: UpdateUserInput!): edfs__PublishResult! @edfs__natsPublish(subject: "updateUser.{{ args.id }}")
  }

  type edfs__PublishResult {
    success: Boolean!
  }
`)
const typeDefs = parse(/* GraphQL */ `
  type Subscription {
    countdown(from: Int!): Int!
  }
`) 

const resolvers = {
  Query: {
    // me() {
    //   return { id: '1', username: '@ava' }
    // }
  },
  User: {
    // __resolveReference(user: any, { fetchUserById }: any) {
    //   return fetchUserById(user.id)
    // }
  },
  Subscription: {
    countdown: {
      // This will return the value on every 1 sec until it reaches 0
      subscribe: async function* (_:any, { from }:any) {
        for (let i = from; i >= 0; i--) {
          await setTimeout$(1000)
          yield { countdown: i }
        }
      }
    }
  }
} 
const yoga = createYoga({
    renderGraphiQL,
    graphiql: {
      // Use WebSockets in GraphiQL
      subscriptionsProtocol: 'WS'
    },
    schema: buildSubgraphSchema([{ typeDefs, resolvers }])
})


// Get NodeJS Server from Yoga
const httpServer = createServer(yoga)
// Create WebSocket server instance from our Node server
const wsServer = new WebSocketServer({
  server: httpServer,
  path: yoga.graphqlEndpoint
})
 


// Integrate Yoga's Envelop instance and NodeJS server with graphql-ws
useServer(
  {
    execute: (args: any) => args.rootValue.execute(args),
    subscribe: (args: any) => args.rootValue.subscribe(args),
    onSubscribe: async (ctx:any, msg:any) => {
      const { schema, execute, subscribe, contextFactory, parse, validate } = yoga.getEnveloped({
        ...ctx,
        req: ctx.extra.request,
        socket: ctx.extra.socket,
        params: msg.payload
      })
 
      const args = {
        schema,
        operationName: msg.payload.operationName,
        document: parse(msg.payload.query),
        variableValues: msg.payload.variables,
        contextValue: await contextFactory(),
        rootValue: {
          execute,
          subscribe
        }
      }
 
      const errors = validate(args.schema, args.document)
      if (errors.length) return errors
      return args
    }
  },
  wsServer
)
 
httpServer.listen(4000, () => {
  console.log('Server is running on port 4000')
})
// const server = createServer(yoga)
 
// server.listen(4001, () => {
//   console.log(`🚀 Server ready at http://localhost:4001`)
// })
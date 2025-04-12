import { parse } from "graphql";
import { buildSubgraphSchema } from "@apollo/subgraph";
import { createYoga, createPubSub } from "graphql-yoga";
import { createServer } from "http";
import { renderGraphiQL } from "@graphql-yoga/render-graphiql";
import { setTimeout as setTimeout$ } from "node:timers/promises";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/lib/use/ws";

// Initialize PubSub
const pubSub = createPubSub();

// Type Definitions
const typeDefs = parse(/* GraphQL */ `
  type Person {
    id: ID!
    name: String!
    age: Int!
    pets: [Pet!]!
  }

  type Pet {
    id: ID!
    name: String!
    species: String!
    toys: [Toy!]!
  }

  type Toy {
    id: ID!
    name: String!
    type: String!
  }

  type Query {
    person(id: ID!): Person!
    people: [Person!]!
  }

  type Subscription {
    countdown(from: Int!): Int!
    personUpdated(id: ID!): Person!
  }

  type Mutation {
    updatePerson(
      id: ID!
      personName: String
      petId: ID
      petName: String
    ): Person!
  }
`);

// Sample data
const people = [
  {
    id: "1",
    name: "Alice",
    age: 30,
    pets: [
      {
        id: "p1",
        name: "Max",
        species: "Dog",
        toys: [
          { id: "t1", name: "Ball", type: "Chew" },
          { id: "t2", name: "Rope", type: "Tug" },
        ],
      },
      {
        id: "p2",
        name: "Luna",
        species: "Cat",
        toys: [
          { id: "t3", name: "Mouse", type: "Chase" },
          { id: "t4", name: "Feather Wand", type: "Interactive" },
        ],
      },
    ],
  },
];

const resolvers = {
  Query: {
    person: (_: any, { id }: { id: string }) => {
      const person = people.find((p) => p.id === id);
      if (!person) throw new Error(`Person with id ${id} not found`);
      return person;
    },
    people: () => {
      return people;
    },
  },
  Subscription: {
    countdown: {
      subscribe: async function* (_: any, { from }: any) {
        for (let i = from; i >= 0; i--) {
          await setTimeout$(1000);
          yield { countdown: i };
        }
      },
    },
    personUpdated: {
      subscribe: (_: any, { id }: { id: string }) => {
        return pubSub.subscribe(`PERSON_UPDATED_${id}`);
      },
    },
  },
  Mutation: {
    updatePerson: (
      _: any,
      {
        id,
        personName,
        petId,
        petName,
      }: { id: string; personName?: string; petId?: string; petName?: string }
    ) => {
      const person = people.find((p) => p.id === id);
      if (!person) {
        throw new Error(`Person with id ${id} not found`);
      }

      let updated = false;

      // Update person's name if provided
      if (personName) {
        person.name = personName;
        updated = true;
      }

      // Update pet's name if both petId and petName are provided
      if (petId && petName) {
        const pet = person.pets.find((p) => p.id === petId);
        if (!pet) {
          throw new Error(`Pet with id ${petId} not found`);
        }
        pet.name = petName;
        updated = true;
      } else if (petId && !petName) {
        throw new Error(`Pet name must be provided when petId is specified`);
      } else if (!petId && petName) {
        throw new Error(`Pet ID must be provided when petName is specified`);
      }

      if (!updated) {
        throw new Error(`No updates provided`);
      }

      // Publish update to subscribers
      pubSub.publish(`PERSON_UPDATED_${id}`, { personUpdated: person });

      return person;
    },
  },
};

const yoga = createYoga({
  renderGraphiQL,
  graphiql: {
    subscriptionsProtocol: "WS",
  },
  schema: buildSubgraphSchema([{ typeDefs, resolvers }]),
});

const httpServer = createServer(yoga);
const wsServer = new WebSocketServer({
  server: httpServer,
  path: yoga.graphqlEndpoint,
});

useServer(
  {
    execute: (args: any) => args.rootValue.execute(args),
    subscribe: (args: any) => args.rootValue.subscribe(args),
    onSubscribe: async (ctx: any, msg: any) => {
      const { schema, execute, subscribe, contextFactory, parse, validate } =
        yoga.getEnveloped({
          ...ctx,
          req: ctx.extra.request,
          socket: ctx.extra.socket,
          params: msg.payload,
        });

      const args = {
        schema,
        operationName: msg.payload.operationName,
        document: parse(msg.payload.query),
        variableValues: msg.payload.variables,
        contextValue: await contextFactory(),
        rootValue: {
          execute,
          subscribe,
        },
      };

      const errors = validate(args.schema, args.document);
      if (errors.length) return errors;
      return args;
    },
  },
  wsServer
);

httpServer.listen(4000, () => {
  console.log("Server is running on port 4000");
});

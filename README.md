This repo contains tests for GraphQL, mostly with federated graphql and subscriptions.

# Setup
1. Yoga

   Yoga is a GraphQL server runs on http://localhost:4000/graphql. 

   Run this project to start the first subgraph
2. DGS

   Spring Boot application with Netflix DGS, runs on http://localhost:8080/graphql. 
   
   Run this project to start the 2nd subgraph
3. Wunder-Router

   The Wundergraph Router, runs on http://localhost:3002/graphql. 

   Run this router to create a federated graph
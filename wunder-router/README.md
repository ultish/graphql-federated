# How to start the Wundergraph Router with Docker

1. Download the Wundergraph CLI: 
   ```bash
   npm install -g wgc@latest
   ```
2. Create a config.yaml file that configures the router. We'll use this to give the router a static subgraph config
   ```yaml
   version: '1'
   dev_mode: true
   log_level: debug
   access_logs:
     enabled: true
   execution_config:
     file:
       path: "/router.json"
   ```
3. Create a subgraphs.yaml file that tells Wundergraph how to connect to your subgraphs:
   ```yaml
   version: 1
   subgraphs:
     - name: yoga
       routing_url: http://localhost:4000/graphql
       introspection:
         url: http://localhost:4000/graphql
     - name: jikan-ga-aru
       routing_url: http://localhost:8080/graphql
       subscription:
         url: http://localhost:8080/graphql 
         protocol: "ws"
         websocketSubprotocol: "graphql-transport-ws"
       introspection:
         url: http://localhost:8080/graphql
   ```
   See https://cosmo-docs.wundergraph.com/cli/router/compose for more config options
3. Run the following command to generate the router.json file, this configures the router to connect to your subgraphs:
   ```bash
   wgc router compose -i subgraphs.yaml -o router.json
   ```
2. docker-compose up
3. http://localhost:3002/
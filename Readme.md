# Build
```
docker build -t osbb/cooperatives-service . --no-cache
```

# Run
```
# production
docker run -d --name mongo mongo
docker run -d --hostname rabbitmq --name rabbitmq rabbitmq:3
docker run -d --link rabbitmq --link mongo --name cooperatives osbb/cooperatives-service

# development
docker run -d --name mongo mongo
docker run -d --hostname rabbitmq --name rabbitmq -p 15672:15672 -p 5672:5672 rabbitmq:3-management
docker run -d --link rabbitmq --link mongo --name cooperatives osbb/cooperatives-service
```

# METAR

https://aviationweather.gov/data/api/

## Arduino HTTPS

This ended up being too much of a headache due to the secure connection over port 443. Better to just host the API locally on the home network and access via port 80

If the node server isnt working and want to directly hit .gov api with esp will need secure client
https://www.youtube.com/watch?v=HUjFMVOpXBM

millis explaination
https://forum.arduino.cc/t/using-millis-for-timing-a-beginners-guide/483573/2

METAR Help
https://weather.cod.edu/notes/metar.html#time

# Docker Start

`docker build -t metar:latest .`

`docker run -d -p 3000:3000 metar:latest`

# Docker Private Repo

`docker run -d -p 5000:5000 registry`

`docker login <REGISTRY_HOST>:<REGISTRY_PORT>`
`docker tag <IMAGE_ID> <REGISTRY_HOST>:<REGISTRY_PORT>/<APPNAME>:<APPVERSION>`
`docker push <REGISTRY_HOST>:<REGISTRY_PORT>/<APPNAME>:<APPVERSION>`

Add to Docker daemon from pushing device
`"insecure-registries": ["<<REGISTRY_HOST>:<REGISTRY_PORT>"]`

TODO: find out how to use SSL and then expose port

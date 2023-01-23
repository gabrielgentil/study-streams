import { createServer } from "node:http"
import { createReadStream } from "node:fs"
import { Readable, Transform } from "node:stream"
import { WritableStream, TransformStream } from "node:stream/web"
import csvtojson from 'csvtojson'
import { setTimeout } from "node:timers/promises"

const PORT = 3000

//curl -N localhost:3000

createServer(async (request, response) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': '*'
  }
  if (request.method === 'OPTIONS') {
    response.writeHead(204, headers)
    response.end('ok')
    return;
  }

  let items = 0

  let continues = 0

  request.once('close', _ => {
    console.log(`connection was closed!`, items)
    continues = items
  })

  Readable.toWeb(createReadStream('./animeflv.csv'))
    .pipeThrough(Transform.toWeb(csvtojson()))
    .pipeThrough(new TransformStream({
      transform(chunk, controller) {
        console.log(continues, 'teste')
        // console.log('chunk', Buffer.from(chunk).toString())
        const data = JSON.parse(Buffer.from(chunk).toString())
        const mappedData = {
          title: data.title,
          description: data.description,
          url_anime: data.url_anime
        }

        //quebra de linhas
        controller.enqueue(JSON.stringify(mappedData).concat('\n'))
      }
    }))
    .pipeTo(new WritableStream({

      async write(chunk) {
        await setTimeout(1000)
        items++
        console.log(chunk)
        response.write(chunk)
      },
      close() {
        response.end()
      }
    }))

  response.writeHead(200, headers)

  // response.end('ok')
})
  .listen(PORT)
  .on('listening', _ => console.log(`server is running at ${PORT}`))
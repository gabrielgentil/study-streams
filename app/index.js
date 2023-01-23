const API_URL = 'http://localhost:3000'
async function consumeAPI(signal) {
  const response = await fetch(API_URL, {
    signal
  })
  const reader = response.body
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(parseNDJSON())
  // .pipeTo(new WritableStream({
  //   write(chunk) {
  //     console.log('chunk', chunk)
  //   }
  // }))

  return reader
}

function appendToHTML(element) {
  return new WritableStream({
    write({
      title, description, url_anime
    }) {

      const cards = `
      <article>
        <div class="text">
          <h3>${title}</h3>
          <p>${description.slice(0, 100)}</p>
          <a href="${url_anime}">Clica aqui</a>
        </div>
      </article>
      `

      element.innerHTML += cards

    }
  })
}

function parseNDJSON() {
  let ndjsonBuffer = ''
  return new TransformStream({
    transform(chunk, controller) {
      ndjsonBuffer += chunk
      const items = ndjsonBuffer.split('\n')
      items.slice(0, -1)
        .forEach(item => controller.enqueue(JSON.parse(item)))

      ndjsonBuffer = items[items.length - 1]
    },
    flush(controller) {
      if (!ndjsonBuffer) return;
      controller.enqueue(JSON.parse(ndjsonBuffer))
    }
  })
}

const [
  start,
  stop,
  cards
] = ['start', 'stop', 'cards'].map(item => document.getElementById(item))

let abortController = new AbortController()

start.addEventListener('click', async () => {
  try {
    const readable = await consumeAPI(abortController.signal)
    await readable.pipeTo(appendToHTML(cards), { signal: abortController.signal })
  } catch (error) {
    if (!error.message.includes('abort')) throw error
  }
})

stop.addEventListener('click', () => {
  abortController.abort()
  console.log('aborting...',)
  abortController = new AbortController()
})
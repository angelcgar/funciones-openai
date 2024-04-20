import OpenAI from 'openai'
import dotenv from 'dotenv'
import axios from 'axios'
import moment from 'moment-timezone'

dotenv.config()

const openai = new OpenAI({
  apiKey: process.env.API_KEY
})

async function lookupTime (location) {
  const res = await axios.get(`http://worldtimeapi.org/api/timezone/${location}`)
  const { datetime } = res.data
  const time = moment.tz(datetime, location).format('dddd, MMMM Do YYYY, h:mm:ss a z')

  console.log(`The time in ${location} is ${time}`)
}

async function main () {
  const completion = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'What time is it in Mountain View?' }
    ],
    functions: [
      {
        name: 'lookup-time',
        description: 'Looks up the time in a given location',
        parameters: {
          type: 'object',
          properties: {
            location: {
              type: 'string',
              description: 'La ubicacion de la cual se quiere saber la hora actual. Ejemplo: "Bogota". Pero debe estar escrigo con el nombre del timezone por ejemplo: Asia/Shangai, America/Bogota, Europe/Madrid, etc'
            }
          },
          required: ['location']
        }
      }
    ],
    function_call: 'auto'
  })
}

const completionResponse = completion.choises[0].message

if (!completionResponse.content) {
  const functionCallName = completionResponse.function_call.name
  console.log(`The function ${functionCallName} was not found`)

  if (functionCallName === 'lookup-time') {
    const args = JSON.parse(completionResponse.function_call.arguments.location)
    lookupTime(args.location)
  }
}

main()

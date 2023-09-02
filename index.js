import express from 'express'
import axios from 'axios'
import { GetLatLngByAddress } from '@geocoder-free/google'
import dotenv from 'dotenv'
import { DateTime } from 'luxon'
import lookup from 'tz-lookup'
dotenv.config()

const app = express()
const PORT = 4000
app.use(express.static('public'))
app.set('view engine', 'ejs')
app.use(express.urlencoded({ extended: true }))

app.get('/', (req, res) => {
  res.render('index')
})
app.post('/', async (req, res) => {
  function formatTime(lat, lon) {
    const monthNames = [
      'Jan',
      'Feb',
      'March',
      'April',
      'May',
      'June',
      'July',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ]

    const timeZone = lookup(lat, lon)
    const currentTime = DateTime.now().setZone(timeZone)
    let hour = currentTime.hour
    if (hour > 12) hour -= 12

    const formattedTime = ` ${hour}:${currentTime.minute}:${
      currentTime.second
    } ${monthNames[currentTime.month - 1]} ${currentTime.day},${
      currentTime.year
    }`
    return formattedTime
  }

  let loc = req.body.loc
  let address = async (loc) => {
    try {
      const result = await GetLatLngByAddress(loc)
      const latitude = result[0]
      const longitude = result[1]

      let respone = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}`,
        {
          params: {
            appid: process.env.API_KEY,
          },
        }
      )
      return respone.data
    } catch (error) {
      console.error(error)
      res.status(501).render('index', { error: error })
    }
  }
  try {
    const result = await address(loc)
    res.render('index', {
      data: result,
      time: formatTime(result.coord.lat, result.coord.lon),
    })
  } catch (error) {
    console.error(error)
    res.status(501).render('index', { error: error })
  }
})

app.listen(PORT, () => {
  console.log(`Server Is Listening At ${PORT}`)
})

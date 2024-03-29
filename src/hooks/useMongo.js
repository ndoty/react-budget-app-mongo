import Axios from "axios"
import { useState, useEffect } from "react"

export default function useMongo(key, defaultValue) {
  let jsonValue = null
  console.log('Key: ' + key)
  const [value, setValue] = useState(() => {
    Axios.get('http://localhost:5000/api/'+key)
    .then((res) => {
      console.log("Response Time!")
      console.log(res.data)
      return res.data
    }).catch((err) => {
      console.log("Error Time!")
      console.log(err)
    })

    // console.log('JSON: ' + JSON.parse(jsonValue))

    // if (jsonValue != null) {
    //   console.log('JSON: ' + JSON.parse(jsonValue))
    //   return JSON.parse(jsonValue)
    // }
    if (typeof defaultValue === "function") {
      return defaultValue()
    } else {
      return defaultValue
    }

  })

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])

  return [value, setValue]
}

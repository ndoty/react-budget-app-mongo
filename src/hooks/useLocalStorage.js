import { useState, useEffect } from "react"

export default function useLocalStorage(key, defaultValue) {
  const [value, setValue] = useState(() => {
    console.log("Default: " +  defaultValue)
    console.log("Key: " +  key)

    const jsonValue = localStorage.getItem(key)

    console.log("JSON: " +  jsonValue)

    if (jsonValue != null) return JSON.parse(jsonValue)

    if (typeof defaultValue === "function") {
      return defaultValue()
    } else {
      return defaultValue
    }
  })

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value))
    console.log("Key: " + key)
    console.log("Value: " + JSON.stringify(value) )
  }, [key, value])

  return [value, setValue]
}

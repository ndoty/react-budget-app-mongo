import Axios from "axios"
import { useState, useEffect } from "react"

const fetchData = async (key) => {
  try {
    const response = await Axios.get(`//budget-api.technickservices.com/api/${key}`)
    return response.data
  } catch (error) {
    console.error("Error fetching data:", error)
    return null
  }
}

const postData = async (key, data) => {
  try {
    const response = await Axios.post(`//budget-api.technickservices.com/api/${key}`, { data })
  } catch (error) {
    console.error("Error fetching data:", error)
    return null
  }
}

export default function useMongo(key) {
  const [value, setValue] = useState([])
  const [previousBudgets, setPreviousBudgets] = useState([])
  const [previousExpenses, setPreviousExpenses] = useState([])
  const [previousMonthlyCap, setPreviousMonthlyCap] = useState([])


  const setPrevious = (key, value) => {
    if (key === "expenses" ) {
      setPreviousExpenses(value)
    }    
    if (key === "budgets" ) {
      setPreviousBudgets(value)
    }
    if (key === "monthlyCap" ) {
      setPreviousMonthlyCap(value)
    }
  }
  
  const getPrevious = (key) => {
    if (key === "expenses" ) {
      const value = previousExpenses
      return value
    }    
    if (key === "budgets" ) {
      const value = previousBudgets
      return value
    }
    if (key === "monthlyCap" ) {
      const value = previousMonthlyCap
      return value
    }
  }
  
  useEffect(() => {
    fetchData(key).then((jsonValue) => {
      setValue(jsonValue)
    })
  }, [])

  useEffect(() => {
    let postIt = false
    
    const lastValue = getPrevious(key)

    if (lastValue.length === 0 && value.length === 0) {
      return
    } else if (lastValue !== value) {
      setPrevious(key, value)
      postIt = true
    } else if (lastValue.length === 0 && value.length >= 1) {
      setPrevious(key, value)
      postIt = true
    }   

    if (postIt) {
      postData(key, JSON.stringify(value))
    }   
  }, [key, value])

  return [value, setValue]
}

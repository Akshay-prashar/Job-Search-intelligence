import axios from 'axios'

const api = axios.create({
  baseURL: process.env.PYTHON_SERVICE_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
    'X-API-KEY': process.env.PYTHON_API_KEY || 'internal-secret-key'
  }
})

export default api

import axios from 'axios'

const api = axios.create({
    baseURL: 'https://devznr.epatronus.net/compliance/api/api',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    }
})

api.interceptors.request.use(config => {
    const token = localStorage.getItem('token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }

    // Let the browser set multipart boundaries. A hardcoded JSON or
    // multipart Content-Type (without boundary) makes Laravel ignore the file.
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
        if (config.headers && typeof config.headers.delete === 'function') {
            config.headers.delete('Content-Type')
        } else if (config.headers) {
            delete config.headers['Content-Type']
            delete config.headers['content-type']
        }
    }

    return config
})

export default api

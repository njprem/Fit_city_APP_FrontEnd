import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      <div className="flex gap-6">
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1 className="mt-8 text-4xl font-bold">Vite + React + Tailwind</h1>
      <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur">
        <button
          className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white shadow hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          onClick={() => setCount((count) => count + 1)}
        >
          count is {count}
        </button>
        <p className="mt-3 text-slate-300">
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="mt-6 text-slate-400">
        Click on the Vite and React logos to learn more
      </p>
    </div>
  )
}

export default App

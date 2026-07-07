import { WeTalkApp } from './WeTalkApp'
import { AuthProvider } from './contexts/AuthContext'

function App() {
  return (
    <AuthProvider>
      <WeTalkApp />
    </AuthProvider>
  )
}

export default App

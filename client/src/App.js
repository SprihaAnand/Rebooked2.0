import {Routes, Route} from 'react-router-dom'
import HomePage from './pages/HomePage'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import { ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ProtectedRoute from './components/Routes/ProtectedRoute';
import PublicRoute from './components/Routes/PublicRoute';
import Spinner from './components/Shared/Spinner';
import Donar from "./pages/Dashboard/Donar";
import Institute from './pages/Dashboard/Institutes';
import OrganisationPage from './pages/Dashboard/OrganisationPage';
import Consumer from './pages/Dashboard/Consumer';
import Donation from './pages/Donation'
import Analytics from './pages/Dashboard/Analytics';
function App() {
  return (
    <>
      <ToastContainer/>
      <Routes>
        <Route path='/' element={
          <ProtectedRoute>
            <HomePage/>
          </ProtectedRoute>
          }/>
        <Route path='/login' element={
          <PublicRoute>
            <Login/>
          </PublicRoute> 
          }/>
        <Route path='/register' element={
          <PublicRoute>
            <Register/>
          </PublicRoute>
          }/>
      <Route
          path="/donar"
          element={
            <ProtectedRoute>
              <Donar />
            </ProtectedRoute>
          }
        />
        <Route
          path="/institute"
          element={
            <ProtectedRoute>
              <Institute/>
            </ProtectedRoute>
          }
        />
        <Route
          path="/orgnaisation"
          element={
            <ProtectedRoute>
              <OrganisationPage/>
            </ProtectedRoute>
          }
        />
        <Route
          path="/consumer"
          element={
            <ProtectedRoute>
              <Consumer/>
            </ProtectedRoute>
          }
        />
        <Route
          path="/donation"
          element={
            <ProtectedRoute>
              <Donation/>
            </ProtectedRoute>
          }
        />
      <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <Analytics/>
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}

export default App;



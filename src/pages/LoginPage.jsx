import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApiUrl } from '../config/api';

const LoginPage = ({ setIsAuthenticated, setProfilePicture }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(getApiUrl('/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Guardar solo token y userId
        localStorage.setItem('token', data.token);
        localStorage.setItem('userId', data.user.id);
        
        // Actualizar el estado de autenticación
        setIsAuthenticated(true);
        
        // Navegar a la página de inicio
        navigate('/');
      } else {
        setError(data.error || 'Error al iniciar sesión');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ marginTop: '100px' }}>
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card" style={{ backgroundColor: '#1e2328', border: '1px solid #454d5d' }}>
            <div className="card-body">
              <h2 className="text-light mb-4">Iniciar Sesión</h2>
              
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label text-light">
                    Correo Electrónico
                  </label>
                  <input 
                    type="email" 
                    className="form-control" 
                    id="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete='off'
                    style={{ backgroundColor: '#2c3440', color: '#fff', border: '1px solid #454d5d' }}
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="password" className="form-label text-light">
                    Contraseña
                  </label>
                  <input 
                    type="password" 
                    className="form-control" 
                    id="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{ backgroundColor: '#2c3440', color: '#fff', border: '1px solid #454d5d' }}
                  />
                </div>

                {error && (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                )}

                <button 
                  type="submit" 
                  className="btn btn-primary w-100"
                  disabled={loading}
                >
                  {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                </button>
              </form>

              <div className="text-center mt-3">
                <p className="text-muted">
                  ¿No tienes cuenta?{' '}
                  <a href="/register" className="text-primary">
                    Regístrate aquí
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
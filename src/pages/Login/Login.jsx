import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import Button from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';
import { Music, Lock, Mail } from 'lucide-react';
import { APP_NAME } from '../../lib/constants';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { signIn } = useAuth();
  const { error: showError } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      showError('Please enter both email and password');
      return;
    }

    setLoading(true);

    const { success, error } = await signIn(email, password);

    if (success) {
      navigate('/');
    } else {
      showError(error || 'Invalid email or password');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-brand-600 flex items-center justify-center">
              <Music className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-text-primary">
              Welcome to {APP_NAME}
            </h1>
            <p className="text-text-muted mt-2">
              Sign in to access the school management system
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              icon={Mail}
              required
              autoComplete="email"
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              icon={Lock}
              required
              autoComplete="current-password"
            />

            <Button
              type="submit"
              className="w-full"
              size="lg"
              loading={loading}
            >
              Sign In
            </Button>
          </form>

          {/* Demo credentials hint */}
          <div className="mt-6 p-4 rounded-lg bg-white/5 border border-border">
            <p className="text-xs text-text-muted text-center">
              Demo credentials for testing:
              <br />
              <span className="text-text-primary">Admin:</span> admin@elislearning.ae / admin123
              <br />
              <span className="text-text-primary">Teacher:</span> teacher@elislearning.ae / teacher123
            </p>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-text-muted mt-6">
            Music & Arts School - Sharjah, UAE
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default Login;

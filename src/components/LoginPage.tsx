import React, { useState } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { loginWithEmail, loginWithGoogle } from '../firebase';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const canSignIn = email.trim().length > 0 && password.length > 0 && !isLoading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setNotice('Please enter email and password.');
      return;
    }
    setNotice(null);
    setIsLoading(true);

    try {
      await loginWithEmail(email, password);
      setIsLoading(false);
      onLoginSuccess();
    } catch (error: any) {
      setIsLoading(false);
      const msg = error?.message || String(error);
      if (msg.includes('invalid-credential') || msg.includes('user-not-found') || msg.includes('wrong-password')) {
        setNotice('Invalid email or password. Please check your credentials.');
      } else if (msg.includes('network-request-failed')) {
        setNotice('Network error. Please check your internet connection.');
      } else {
        setNotice(msg.replace('Firebase: ', ''));
      }
    }
  };

  const handleGoogleLogin = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setNotice(null);
    try {
      await loginWithGoogle();
      setIsLoading(false);
      onLoginSuccess();
    } catch (error: any) {
      setIsLoading(false);
      const msg = error?.message || String(error);
      if (msg.includes('popup-closed-by-user')) {
        setNotice('Google sign-in cancelled.');
      } else {
        setNotice(msg.replace('Firebase: ', ''));
      }
    }
  };

  return (
    <div
      style={{ fontFamily: "'Calibri', sans-serif" }}
      className="min-h-screen w-full bg-white flex items-center justify-center px-6 py-10"
    >
      <div className="w-full max-w-xs sm:max-w-sm flex flex-col">
        {/* Header Title & Subtitle */}
        <div className="text-center mb-10 space-y-2">
          <h1
            style={{
              fontFamily: "'Calibri', sans-serif",
              fontWeight: 900,
              WebkitTextStroke: '0.4px currentColor',
              transform: 'scaleY(1.22)',
            }}
            className="text-[26px] sm:text-[28px] font-black text-[#0B1726] tracking-wide uppercase"
          >
            WELCOME BACK
          </h1>
          <p
            style={{
              fontFamily: "'Calibri', sans-serif",
              fontWeight: 900,
              WebkitTextStroke: '0.35px currentColor',
              transform: 'scaleY(1.22)',
            }}
            className="text-[15px] sm:text-[16px] font-black text-[#64748B] tracking-wide uppercase"
          >
            SIGN IN TO CONTINUE
          </p>
        </div>

        {/* Clean Minimal Login Form matching reference UI with Calibri Bold & Tall Text */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* EMAIL */}
          <div>
            <input
              type="email"
              value={email}
              disabled={isLoading}
              style={{
                fontFamily: "'Calibri', sans-serif",
                fontWeight: 900,
                WebkitTextStroke: '0.35px currentColor',
                textTransform: 'none',
                transform: 'scaleY(1.22)',
                transformOrigin: 'left center',
              }}
              onChange={(e) => {
                setEmail(e.target.value);
                if (notice) setNotice(null);
              }}
              placeholder="EMAIL"
              autoComplete="email"
              className="w-full py-2.5 bg-transparent border-b border-slate-200 focus:border-slate-800 text-[17px] font-black text-[#0B1726] placeholder:text-[#64748B] placeholder:font-black placeholder:tracking-wide outline-none transition-colors disabled:opacity-50"
            />
          </div>

          {/* PASSWORD */}
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              disabled={isLoading}
              style={{
                fontFamily: "'Calibri', sans-serif",
                fontWeight: 900,
                WebkitTextStroke: '0.35px currentColor',
                textTransform: 'none',
                transform: 'scaleY(1.22)',
                transformOrigin: 'left center',
              }}
              onChange={(e) => {
                setPassword(e.target.value);
                if (notice) setNotice(null);
              }}
              placeholder="PASSWORD"
              autoComplete="current-password"
              className="w-full py-2.5 pr-10 bg-transparent border-b border-slate-200 focus:border-slate-800 text-[17px] font-black text-[#0B1726] placeholder:text-[#64748B] placeholder:font-black placeholder:tracking-wide outline-none transition-colors disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-[#526071] hover:text-[#0B1726] transition-colors cursor-pointer"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5 stroke-[2.5]" />
              ) : (
                <Eye className="w-5 h-5 stroke-[2.5]" />
              )}
            </button>
          </div>

          {/* FORGOT PASSWORD? */}
          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={() => setNotice('PLEASE CONTACT ADMIN TO RESET PASSWORD.')}
              style={{
                fontFamily: "'Calibri', sans-serif",
                fontWeight: 900,
                WebkitTextStroke: '0.35px currentColor',
              }}
              className="text-[14px] font-black text-[#1E70EB] hover:text-[#1558BD] tracking-wide uppercase cursor-pointer"
            >
              <span style={{ display: 'inline-block', transform: 'scaleY(1.22)' }}>
                FORGOT PASSWORD?
              </span>
            </button>
          </div>

          {notice && (
            <p
              style={{
                fontFamily: "'Calibri', sans-serif",
                fontWeight: 900,
                WebkitTextStroke: '0.3px currentColor',
                transform: 'scaleY(1.18)',
              }}
              className="text-[14px] font-black text-rose-600 text-center bg-rose-50 p-2 rounded-lg border border-rose-100 uppercase"
            >
              {notice}
            </p>
          )}

          {/* SIGN IN Pill Button */}
          <button
            type="submit"
            disabled={!canSignIn}
            style={{
              fontFamily: "'Calibri', sans-serif",
              fontWeight: 900,
              WebkitTextStroke: '0.35px currentColor',
            }}
            className={`w-full h-14 rounded-full text-[17px] font-black tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer ${
              canSignIn
                ? 'bg-[#0B1726] text-white hover:bg-slate-800 shadow-sm'
                : 'bg-[#F0F2F5] text-[#8E959D] cursor-not-allowed'
            }`}
          >
            {isLoading && <Loader2 className="w-5 h-5 animate-spin stroke-[2.75]" />}
            <span style={{ display: 'inline-block', transform: 'scaleY(1.22)' }}>
              SIGN IN
            </span>
          </button>
        </form>

        {/* OR Divider */}
        <div
          style={{
            fontFamily: "'Calibri', sans-serif",
            fontWeight: 900,
            WebkitTextStroke: '0.35px currentColor',
            transform: 'scaleY(1.22)',
          }}
          className="text-center text-[14px] font-black text-[#64748B] tracking-widest uppercase my-6"
        >
          OR
        </div>

        {/* CONTINUE WITH GOOGLE */}
        <div className="text-center">
          <button
            type="button"
            disabled={isLoading}
            onClick={handleGoogleLogin}
            style={{
              fontFamily: "'Calibri', sans-serif",
              fontWeight: 900,
              WebkitTextStroke: '0.35px currentColor',
            }}
            className="text-[16px] font-black text-[#1E70EB] hover:text-[#1558BD] tracking-wide uppercase cursor-pointer disabled:opacity-50"
          >
            <span style={{ display: 'inline-block', transform: 'scaleY(1.22)' }}>
              CONTINUE WITH GOOGLE
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

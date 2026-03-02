import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Mail, Lock, User as UserIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { signInUser, signUpUser } from "../firebase";

export default function Login() {
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (isRegistering && !name)) return;
    
    setIsLoading(true);
    setErrorMsg("");

    try {
      let user;
      if (isRegistering) {
        user = await signUpUser(email, password, name);
      } else {
        user = await signInUser(email, password);
      }
      
      localStorage.setItem("beksar_user_name", user.displayName || name || "Kullanıcı");
      localStorage.setItem("beksar_user_photo", ""); // Fotoğraf yok, Agent ekranı varsayılan ikon kullanacak
      
      navigate("/agent");
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        setErrorMsg("Hatalı e-posta veya şifre.");
      } else if (error.code === 'auth/email-already-in-use') {
        setErrorMsg("Bu e-posta zaten kullanımda.");
      } else {
        setErrorMsg("Bir hata oluştu. Lütfen tekrar dene.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="h-screen w-screen bg-[#070510] flex flex-col items-center justify-center relative font-sans text-white">
      <div data-tauri-drag-region className="absolute top-0 left-0 w-full h-8 z-50 cursor-grab" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-900/10 blur-[150px] rounded-full" />
      
      <div className="w-full max-w-sm bg-[#10111a] border border-white/5 rounded-3xl p-8 shadow-2xl relative z-10">
        <div className="text-center mb-6">
            <Sparkles className="w-8 h-8 text-indigo-400 mx-auto mb-3" />
            <h1 className="text-xl font-semibold mb-1">{isRegistering ? "Beksar'a Katıl" : "Beksar'a Giriş Yap"}</h1>
            <p className="text-xs text-gray-500">Sistemi başlatmak için kimliğini doğrula.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegistering && (
            <div>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="İsim Soyisim" className="w-full bg-[#0a0b10] border border-white/5 rounded-xl py-3 pl-10 pr-4 text-sm text-gray-300 outline-none focus:border-indigo-500/50 transition-colors" />
              </div>
            </div>
          )}

          <div>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-posta adresin" className="w-full bg-[#0a0b10] border border-white/5 rounded-xl py-3 pl-10 pr-4 text-sm text-gray-300 outline-none focus:border-indigo-500/50 transition-colors" />
            </div>
          </div>

          <div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Şifren" className="w-full bg-[#0a0b10] border border-white/5 rounded-xl py-3 pl-10 pr-4 text-sm text-gray-300 outline-none focus:border-indigo-500/50 transition-colors" />
            </div>
          </div>

          {errorMsg && <p className="text-xs text-red-500 text-center">{errorMsg}</p>}

          <button type="submit" disabled={isLoading || !email || !password || (isRegistering && !name)} className="w-full mt-2 bg-indigo-600 border border-indigo-500 text-white py-3.5 rounded-xl text-sm font-medium hover:bg-indigo-500 disabled:opacity-50 transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)]">
            {isLoading ? "İşleniyor..." : (isRegistering ? "Kayıt Ol ve Başla" : "Giriş Yap")}
          </button>
        </form>

        <div className="mt-6 text-center">
            <button onClick={() => { setIsRegistering(!isRegistering); setErrorMsg(""); }} className="text-xs text-gray-500 hover:text-indigo-400 transition-colors">
                {isRegistering ? "Zaten hesabın var mı? Giriş yap" : "Hesabın yok mu? Kayıt ol"}
            </button>
        </div>
      </div>
    </motion.div>
  );
}
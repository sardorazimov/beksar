import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Kendi Firebase Config'in (Burası sende zaten doğruydu)
const firebaseConfig = {
  apiKey: "AIzaSyBxhlgBTCWf2BxhJv1MSCHfXWSKUnJ9uaI",
  authDomain: "beksar-f595e.firebaseapp.com",
  projectId: "beksar-f595e",
  storageBucket: "beksar-f595e.firebasestorage.app",
  messagingSenderId: "992047150209",
  appId: "1:992047150209:web:3b24ec32e2fdeb0a6f0980",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// 1. Yeni Kayıt (Register)
export const signUpUser = async (email: string, password: string, name: string) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const user = result.user;
    
    // İsmi profile ekle
    await updateProfile(user, { displayName: name });

    // ŞİMDİLİK BURAYI YORUMA ALIYORUZ (Veya silebilirsin)
    /*
    await setDoc(doc(db, "users", user.uid), {
      email: user.email,
      name: name,
      joinedAt: new Date().toISOString(),
    });
    */

    return user;
  } catch (error) {
    throw error;
  }
};

// 2. Giriş Yap (Login)
export const signInUser = async (email: string, password: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error) {
    throw error;
  }
};
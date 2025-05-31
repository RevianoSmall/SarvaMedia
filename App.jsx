import { useEffect, useState } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  getDownloadURL,
  uploadBytes,
  ref as storageRef,
} from "firebase/auth";
import {
  getDatabase,
  ref as dbRef,
  push,
  set,
  onValue,
  query,
  limitToLast,
} from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyARi5VXlXkixaBDJ2HZJuF_oYanIo_GFdA",
  authDomain: "webgame1-7363e.firebaseapp.com",
  projectId: "webgame1-7363e",
  storageBucket: "webgame1-7363e.firebasestorage.app",
  messagingSenderId: "982854260169",
  appId: "1:982854260169:android:a1c5fb83f793d4422b0418",
  databaseURL: "https://webgame1-7363e-default-rtdb.firebaseio.com/", 
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [posts, setPosts] = useState([]);
  const [newPostText, setNewPostText] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);

  // Handle Auth State
  useEffect(() => {
    onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser && !currentUser.emailVerified) {
        setError("Silakan verifikasi email Anda.");
      }
    });

    // Load Posts
    const postsRef = dbRef(database, "posts");
    onValue(query(postsRef, limitToLast(20)), (snapshot) => {
      const data = [];
      snapshot.forEach((childSnapshot) => {
        data.push(childSnapshot.val());
      });
      setPosts(data.reverse());
    });
  }, []);

  // Register User
  const handleRegister = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      await updateProfile(userCredential.user, { displayName: username });
      await sendEmailVerification(userCredential.user);
      setError("Verifikasi email telah dikirim!");
    } catch (err) {
      setError(err.message);
    }
  };

  // Login with Email
  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError(err.message);
    }
  };

  // Google Login
  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      setError(err.message);
    }
  };

  // Logout
  const handleLogout = async () => {
    await signOut(auth);
  };

  // Submit Post
  const submitPost = async () => {
    if (!newPostText.trim()) return;
    setLoading(true);
    try {
      const postRef = push(dbRef(database, "posts"));
      let imageUrl = "";
      if (imageFile) {
        const imageStorageRef = storageRef(
          app.storage(),
          `posts/${auth.currentUser.uid}/${Date.now()}-${imageFile.name}`
        );
        const snapshot = await uploadBytes(imageStorageRef, imageFile);
        imageUrl = await getDownloadURL(snapshot.ref);
      }

      await set(postRef, {
        text: newPostText,
        userId: auth.currentUser.uid,
        username: auth.currentUser.displayName || auth.currentUser.email,
        photoURL: auth.currentUser.photoURL || "",
        imageUrl,
        timestamp: Date.now(),
      });

      setNewPostText("");
      setImageFile(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-600">MySocial</h1>
        {user ? (
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
          >
            Keluar
          </button>
        ) : null}
      </header>

      <main className="container mx-auto p-4">
        {!user ? (
          // Login / Register Form
          <div className="max-w-md mx-auto bg-white p-6 rounded shadow mt-8">
            <h2 className="text-2xl font-semibold mb-4">Masuk atau Daftar</h2>
            {error && <p className="text-red-500 mb-4">{error}</p>}
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded p-2 mb-2"
            />
            <input
              type="password"
              placeholder="Kata Sandi"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded p-2 mb-2"
            />
            <button
              onClick={handleLogin}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded mb-4"
            >
              Masuk
            </button>
            <input
              type="text"
              placeholder="Username (untuk daftar)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border rounded p-2 mb-2"
            />
            <button
              onClick={handleRegister}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded mb-4"
            >
              Daftar
            </button>
            <button
              onClick={handleGoogleLogin}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-2 rounded"
            >
              Masuk dengan Google
            </button>
          </div>
        ) : (
          <>
            {/* Post Form */}
            <div className="max-w-lg mx-auto bg-white p-6 rounded shadow mt-8">
              <textarea
                placeholder="Apa yang kamu pikirkan?"
                value={newPostText}
                onChange={(e) => setNewPostText(e.target.value)}
                className="w-full border rounded p-2 mb-2 h-24"
              ></textarea>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files[0])}
                className="mb-2"
              />
              <button
                onClick={submitPost}
                disabled={loading}
                className={`w-full ${
                  loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
                } text-white py-2 rounded`}
              >
                {loading ? "Mengunggah..." : "Posting"}
              </button>
            </div>

            {/* Feed */}
            <div className="max-w-lg mx-auto mt-8 space-y-4">
              {posts.map((post, index) => (
                <div key={index} className="bg-white p-4 rounded shadow">
                  <div className="flex items-center gap-2 mb-2">
                    <img
                      src={post.photoURL || "https://placehold.co/40x40"} 
                      alt="Profil"
                      className="w-10 h-10 rounded-full"
                    />
                    <strong>{post.username}</strong>
                  </div>
                  <p>{post.text}</p>
                  {post.imageUrl && (
                    <img
                      src={post.imageUrl}
                      alt="Posting"
                      className="mt-2 max-h-64 w-full object-cover rounded"
                    />
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default App;

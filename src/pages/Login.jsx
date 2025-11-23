// src/pages/Login.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const role = localStorage.getItem("selectedRole");
    setSelectedRole(role);
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();

    const users = JSON.parse(localStorage.getItem("users")) || [];
    const user = users.find((u) => u.email === email && u.password === password);

    if (!user) {
      alert("Invalid credentials");
      return;
    }

    // ❗ Completely reset old login state
    localStorage.removeItem("currentUser");
    localStorage.removeItem("role");

    // ❗ Verify correct role
    if (selectedRole && user.role !== selectedRole) {
      alert(`You are registered as "${user.role}". Please choose the correct role on homepage.`);
      navigate("/");
      return;
    }

    // ❗ Clean login
    localStorage.setItem("currentUser", JSON.stringify(user));
    localStorage.setItem("role", user.role);
    localStorage.removeItem("selectedRole");

    // ❗ Redirect accurately
    if (user.role === "user") navigate("/user");
    else if (user.role === "owner") navigate("/owner");
  };

  return (
    <div style={{ maxWidth: "400px", margin: "50px auto" }}>
      <h2 className="text-center mb-3">Login</h2>

      {selectedRole && (
        <p className="text-center text-muted mb-3">
          Logging in as: <strong>{selectedRole}</strong>
        </p>
      )}

      <form onSubmit={handleLogin}>
        <input
          type="email"
          className="form-control mb-3"
          placeholder="Email"
          required
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          className="form-control mb-3"
          placeholder="Password"
          required
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="btn btn-primary w-100" type="submit">
          Login
        </button>
      </form>
    </div>
  );
}


import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Button, Table, Image } from "react-bootstrap";
import { motion } from "framer-motion";

export default function Home() {
  const navigate = useNavigate();
  const [auctions, setAuctions] = useState([]);

  useEffect(() => {
    const storedItems = JSON.parse(localStorage.getItem("auctionItems")) || [];
    setAuctions(storedItems);
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #fef6f6, #eaf9f3, #f5f4fb)",
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-start",
          alignItems: "center",
          gap: "15px",
          padding: "20px 40px",
          color: "#2c3e50",
          fontWeight: "600",
          fontSize: "1.1rem",
        }}
      >
        <span
          style={{ color: "#1a5276", fontWeight: "700", fontSize: "1.3rem" }}
        >
          🔐 SealedBid Auctions
        </span>

        {/* Login button (User or Owner based on selection box below) */}
        <Button
          variant="link"
          style={{
            color: "#007bff",
            textDecoration: "none",
            fontWeight: "500",
          }}
          onClick={() => navigate("/login")}
        >
          Login
        </Button>

        <Button
          variant="link"
          style={{
            color: "#28a745",
            textDecoration: "none",
            fontWeight: "500",
          }}
          onClick={() => navigate("/register")}
        >
          Register
        </Button>
      </div>

      {/* MAIN HEADING */}
      <h1
        style={{
          textAlign: "center",
          color: "#2f3e75",
          fontWeight: "700",
          fontSize: "2.5rem",
          marginTop: "10px",
          marginBottom: "50px",
        }}
      >
        🕵️‍♂️ Welcome to Sealed-Bid Auctions
      </h1>

      {/* ROLE SELECTION BOX */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          backgroundColor: "#f7f9fa",
          borderRadius: "16px",
          boxShadow: "0px 3px 10px rgba(0,0,0,0.1)",
          padding: "40px 80px",
          width: "85%",
          margin: "0 auto 60px auto",
          gap: "40px",
        }}
      >
        {/* USER BOX */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.3 }}
          onClick={() => {
            localStorage.setItem("selectedRole", "user");
            navigate("/login");
          }}
          style={{
            backgroundColor: "#e2f7f1",
            borderRadius: "12px",
            flex: 1,
            padding: "40px 20px",
            textAlign: "center",
            cursor: "pointer",
            boxShadow: "0px 3px 6px rgba(0,0,0,0.1)",
          }}
        >
          <h4 style={{ fontWeight: "600", color: "#2c3e50" }}>
            Enter as User
          </h4>
          <p style={{ fontSize: "0.9rem", color: "#6c757d", marginTop: "10px" }}>
            Submit confidential bids and compete fairly in auctions.
          </p>
        </motion.div>

        {/* OWNER BOX */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.3 }}
          onClick={() => {
            localStorage.setItem("selectedRole", "owner");
            navigate("/login");
          }}
          style={{
            backgroundColor: "#fdeaea",
            borderRadius: "12px",
            flex: 1,
            padding: "40px 20px",
            textAlign: "center",
            cursor: "pointer",
            boxShadow: "0px 3px 6px rgba(0,0,0,0.1)",
          }}
        >
          <h4 style={{ fontWeight: "600", color: "#2c3e50" }}>
            Enter as Owner
          </h4>
          <p style={{ fontSize: "0.9rem", color: "#6c757d", marginTop: "10px" }}>
            Add auction items and view encrypted bidding activity.
          </p>
        </motion.div>
      </div>

      {/* AUCTIONS TABLE */}
      <Container fluid style={{ padding: "0 50px" }}>
        <h3
          className="text-center mb-4"
          style={{ color: "#3c3b6e", fontWeight: "600" }}
        >
          🔥 Current Live Auctions
        </h3>

        {auctions.length === 0 ? (
          <p className="text-center text-muted">
            No auction items yet. Owners can add items from the dashboard.
          </p>
        ) : (
          <Table
            striped
            bordered
            hover
            responsive
            className="shadow-sm rounded-4"
            style={{
              backgroundColor: "#ffffffd9",
              width: "95%",
              margin: "0 auto",
              borderRadius: "14px",
              fontSize: "1.05rem",
            }}
          >
            <thead
              style={{
                backgroundColor: "#e3f2fd",
                textAlign: "center",
                fontWeight: "600",
                fontSize: "1.1rem",
              }}
            >
              <tr>
                <th>#</th>
                <th>Image</th>
                <th>Item Name</th>
                <th>Description</th>
                <th>Base Price (₹)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {auctions.map((item, index) => (
                <motion.tr
                  key={item.id}
                  whileHover={{
                    scale: 1.01,
                    backgroundColor: "#f8f9fa",
                  }}
                  transition={{ duration: 0.2 }}
                  style={{ textAlign: "center" }}
                >
                  <td>{index + 1}</td>
                  <td>
                    <Image
                      src={item.image}
                      alt={item.name}
                      rounded
                      style={{
                        width: "130px",
                        height: "130px",
                        objectFit: "cover",
                        border: "2px solid #dee2e6",
                      }}
                    />
                  </td>
                  <td className="fw-semibold">{item.name}</td>
                  <td>{item.description}</td>
                  <td>{item.basePrice}</td>
                  <td>
                    {item.live ? (
                      <span style={{ color: "green", fontWeight: "600" }}>
                        🟢 LIVE
                      </span>
                    ) : (
                      <span style={{ color: "gray" }}>⚪ Pending</span>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </Table>
        )}
      </Container>
    </div>
  );
}

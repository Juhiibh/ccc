// src/pages/UserDashboard.jsx
import React, { useState, useEffect } from "react";
import { Row, Col, Card, Button, Form } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { encryptTo } from "../utils/eccCrypto";
import { simulateOT } from "../utils/simulatedOT";

/*
User flow:
- Loads only LIVE items.
- When user places a bid:
  1) obtains auctionPub via simulateOT(item.otPayloads, choiceIndex)
  2) encrypts bid with encryptTo(auctionPub, bid)
  3) stores sealed bid { itemId, cipher, userEmail, userName, ts } in localStorage sealedBids
- Prevents multiple bids per user per item (client-side).
*/

export default function UserDashboard() {
  const [items, setItems] = useState([]);
  const [bids, setBids] = useState({});
  const [userBids, setUserBids] = useState([]);
  const navigate = useNavigate();
  const [loadingOt, setLoadingOt] = useState({});

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("auctionItems")) || [];
    const live = stored.filter((i) => i.live === true);
    setItems(live);

    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    const sealed = JSON.parse(localStorage.getItem("sealedBids")) || [];
    const my = sealed
      .filter((b) => b.userEmail === currentUser?.email)
      .map((b) => b.itemId);
    setUserBids(my);
  }, []);

  const handleBidChange = (itemId, value) => {
    setBids({ ...bids, [itemId]: value });
  };

  async function obtainAuctionPubViaOT(item) {
    const otPayloads = item.otPayloads || (item.auctionPub ? [item.auctionPub] : []);
    if (!Array.isArray(otPayloads) || otPayloads.length === 0) {
      throw new Error("No OT payloads available for this auction item.");
    }
    // demo: pick index 0
    setLoadingOt((s) => ({ ...s, [item.id]: true }));
    try {
      const chosen = await simulateOT(otPayloads, 0);
      return chosen;
    } finally {
      setLoadingOt((s) => ({ ...s, [item.id]: false }));
    }
  }

  const handleBidSubmit = async (itemId) => {
    const bidValue = bids[itemId];
    if (!bidValue) return alert("Enter your bid amount");

    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    if (!currentUser) return alert("Login required!");

    const prev = JSON.parse(localStorage.getItem("sealedBids")) || [];
    const already = prev.some((b) => b.itemId === itemId && b.userEmail === currentUser.email);
    if (already) return alert("You already bid for this item!");

    const allItems = JSON.parse(localStorage.getItem("auctionItems")) || [];
    const item = allItems.find((i) => i.id === itemId);
    if (!item) return alert("Item not found.");

    try {
      // Obtain auction public key via simulated OT
      const auctionPub = await obtainAuctionPubViaOT(item);
      if (!auctionPub) {
        alert("Failed to obtain auction public key via OT.");
        return;
      }

      // Encrypt with ECIES helper
      const cipher = await encryptTo(auctionPub, String(bidValue));

      const sealed = {
        itemId,
        cipher,
        userEmail: currentUser.email,
        userName: currentUser.name,
        ts: Date.now(),
      };

      prev.push(sealed);
      localStorage.setItem("sealedBids", JSON.stringify(prev));
      setUserBids((prevIds) => [...prevIds, itemId]);

      alert("✅ Encrypted bid submitted (via simulated OT)!");
      navigate("/");
    } catch (err) {
      console.error("OT/encrypt error:", err);
      alert("Error during OT or encryption: " + (err.message || err));
    }
  };

  return (
    <div
      className="container mt-5"
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #f6fffb, #e8faf2)",
        padding: "60px 0",
      }}
    >
      <h2 className="mb-5 text-center" style={{ fontWeight: "800", color: "#145c52" }}>
        🚀 Live Auctions (OT demo)
      </h2>

      <Row className="justify-content-center" style={{ width: "90%", maxWidth: "1200px" }}>
        {items.length === 0 ? (
          <p className="text-center text-muted fs-5">No live auctions.</p>
        ) : (
          items.map((item) => {
            const hasBid = userBids.includes(item.id);

            return (
              <Col key={item.id} xs={12} sm={6} md={4} className="mb-5">
                <Card className="h-100 shadow-lg" style={{ borderRadius: "20px" }}>
                  <Card.Img
                    variant="top"
                    src={item.image}
                    style={{
                      height: "240px",
                      objectFit: "cover",
                      borderBottom: "4px solid #cdeede",
                    }}
                  />
                  <Card.Body className="text-center p-4">
                    <Card.Title style={{ fontWeight: "700", color: "#2c3e50" }}>
                      {item.name}
                    </Card.Title>
                    <Card.Text style={{ color: "#6c757d" }}>{item.description}</Card.Text>
                    <h5 className="text-success mb-3">Base Price: ₹{item.basePrice}</h5>

                    {hasBid ? (
                      <div
                        style={{
                          backgroundColor: "#f9f9f9",
                          border: "2px dashed #27ae60",
                          padding: "20px",
                          borderRadius: "12px",
                        }}
                      >
                        <h5 style={{ color: "#27ae60", fontWeight: "700" }}>🔒 Bid Already Submitted</h5>
                      </div>
                    ) : (
                      <>
                        <Form.Control
                          type="number"
                          placeholder="Enter your bid"
                          value={bids[item.id] || ""}
                          onChange={(e) => handleBidChange(item.id, e.target.value)}
                          style={{ borderRadius: "12px", marginBottom: "12px", padding: "12px" }}
                        />
                        <Button
                          variant="success"
                          className="w-100 py-2"
                          style={{ fontWeight: "700", borderRadius: "10px" }}
                          onClick={() => handleBidSubmit(item.id)}
                        >
                          {loadingOt[item.id] ? "Requesting OT..." : "Submit Bid"}
                        </Button>
                      </>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            );
          })
        )}
      </Row>
    </div>
  );
}

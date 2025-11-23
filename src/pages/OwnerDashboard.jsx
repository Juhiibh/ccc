// src/pages/OwnerDashboard.jsx
import React, { useState, useEffect } from "react";
import { Container, Form, Button, Table, Modal } from "react-bootstrap";
import { motion } from "framer-motion";
import { FaSignOutAlt, FaGavel, FaEye } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { generateKeyPair, decryptWith } from "../utils/eccCrypto";

function OwnerDashboard() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ name: "", image: "", description: "", basePrice: "" });
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [maskedBids, setMaskedBids] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("auctionItems")) || [];
    setItems(stored);
  }, []);

  const saveItems = (updated) => {
    localStorage.setItem("auctionItems", JSON.stringify(updated));
    setItems(updated);
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const addItem = () => {
    const { priv: auctionPriv, pub: auctionPub } = generateKeyPair();

    const newItem = {
      ...form,
      id: Date.now(),
      live: false,
      auctionPub,
      auctionPriv,
      otPayloads: [auctionPub],
    };

    const updated = [...items, newItem];
    saveItems(updated);
    setForm({ name: "", image: "", description: "", basePrice: "" });
  };

  const deleteItem = (id) => {
    const updated = items.filter((it) => it.id !== id);
    saveItems(updated);
  };

  const makeLive = (id) => {
    const updated = items.map((it) => (it.id === id ? { ...it, live: true } : it));
    saveItems(updated);
  };

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("role");
    navigate("/");
  };

  // Masking functions
  const maskEmail = (email) => {
    const parts = email.split("@");
    return "xxxx@" + parts[1];
  };

  const maskAmount = (num) => {
    const s = String(num);
    return "₹" + "x".repeat(s.length);
  };

  const handleViewMaskedBids = async (item) => {
    setSelectedItem(item);

    const sealed = JSON.parse(localStorage.getItem("sealedBids")) || [];
    const related = sealed.filter((b) => b.itemId === item.id);

    let auctionPriv = item.auctionPriv;
    if (!auctionPriv) {
      const stored = JSON.parse(localStorage.getItem("auctionItems")) || [];
      const found = stored.find((it) => it.id === item.id);
      auctionPriv = found?.auctionPriv;
    }

    if (!auctionPriv) {
      alert("Missing private key.");
      setMaskedBids([]);
      setShowModal(true);
      return;
    }

    const bids = [];

    for (const bid of related) {
      try {
        const plain = await decryptWith(auctionPriv, bid.cipher);
        const amount = Number(plain);
        bids.push({
          realAmount: amount,
          maskedAmount: maskAmount(amount),
          maskedEmail: maskEmail(bid.userEmail),
        });
      } catch (_) {}
    }

    if (bids.length === 0) {
      setMaskedBids([]);
      setShowModal(true);
      return;
    }

    bids.sort((a, b) => b.realAmount - a.realAmount);

    // Mark winner
    bids[0].isWinner = true;

    setMaskedBids(bids);
    setShowModal(true);
  };

  return (
    <div style={{ padding: "60px 0", background: "linear-gradient(#ebfaf4,#dff6ec)" }}>
      <Container style={{ maxWidth: 1200, background: "#fff", borderRadius: 18, padding: 40 }}>

        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 style={{ color: "#155d52", fontWeight: 800 }}>
            <FaGavel /> Owner Dashboard
          </h1>
          <Button variant="outline-danger" onClick={handleLogout}>
            <FaSignOutAlt /> Logout
          </Button>
        </div>

        {/* Add Item */}
        <motion.div style={{ padding: 30, borderRadius: 12, background: "#f9fcfb", marginBottom: 30 }}>
          <h3 className="text-center mb-3">🪙 Add New Auction Item</h3>
          <Form style={{ maxWidth: 900, margin: "0 auto" }}>
            <Form.Group className="mb-3">
              <Form.Label>Item Name</Form.Label>
              <Form.Control name="name" value={form.name} onChange={handleChange} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Image URL</Form.Label>
              <Form.Control name="image" value={form.image} onChange={handleChange} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control as="textarea" rows={2} name="description" value={form.description} onChange={handleChange} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Base Price</Form.Label>
              <Form.Control type="number" name="basePrice" value={form.basePrice} onChange={handleChange} />
            </Form.Group>
            <div className="text-center">
              <Button variant="success" onClick={addItem}>➕ Add Item</Button>
            </div>
          </Form>
        </motion.div>

        {/* Items Table */}
        <h3 className="text-center">📦 Auction Items</h3>
        <Table striped bordered hover responsive className="align-middle text-center mt-3">
          <thead>
            <tr>
              <th>Name</th>
              <th>Image</th>
              <th>Description</th>
              <th>Base Price</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {items.map((it) => (
              <tr key={it.id}>
                <td>{it.name}</td>
                <td><img src={it.image} width="120" style={{ borderRadius: 8 }} /></td>
                <td>{it.description}</td>
                <td>₹{it.basePrice}</td>
                <td>{it.live ? "LIVE" : "—"}</td>

                <td>
                  <Button variant="success" className="me-2" onClick={() => makeLive(it.id)}>
                    Make Live
                  </Button>
                  <Button variant="info" className="me-2" onClick={() => handleViewMaskedBids(it)}>
                    <FaEye /> View Masked Bids
                  </Button>
                  <Button variant="danger" onClick={() => deleteItem(it.id)}>
                    Remove
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>

        {/* Modal */}
        <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Masked Bids — {selectedItem?.name}</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <Table bordered hover className="text-center">
              <thead>
                <tr>
                  <th>Masked Email</th>
                  <th>Masked Bid</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {maskedBids.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="text-muted">
                      No bids for this item.
                    </td>
                  </tr>
                ) : (
                  maskedBids.map((b, idx) => (
                    <tr key={idx} style={{ background: b.isWinner ? "#eafbe7" : "white" }}>
                      <td>{b.maskedEmail}</td>
                      <td>{b.maskedAmount}</td>
                      <td>{b.isWinner ? "🏆 Winner" : "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </Modal.Body>
        </Modal>
      </Container>
    </div>
  );
}

export default OwnerDashboard;

/*
Emergency Blood Donation Portal (React single-file app)
Project: Emergency Blood Donation Portal
Author: Jamila Fatima (Project spec provided)
File: App.jsx

Notes / How to use:
- This is a single-file React component (default export App) that you can drop
  into a React project created with Vite or Create React App.
- Styling uses Tailwind CSS utility classes. If you don't use Tailwind,
  replace classes or include Tailwind in your build.
- The UI calls placeholder REST endpoints (e.g. /api/requests, /api/donors,
  /api/hospitals, /api/contact). Implement corresponding backend routes in
  Node.js/Express to persist and serve data.
- For deployment to GitHub Pages: build the React app and push the build to
  the gh-pages branch (or use a static host). GitHub Pages supports only
  static assets; backend must be hosted separately (Heroku/Render/Vercel/etc.)

Features implemented in UI:
1. Request blood form (patient details, location, blood type, urgency)
2. Donor registration form (donor details) -> donors receive matching alerts
   on the backend (backend should implement matching & notification logic)
3. Hospital & blood bank list (sample static list, backend endpoint optional)
4. Contact/Live chat (simple message stream; not real-time unless backend
   supports WebSockets)
5. Filter requests by city, blood type, urgency

Replace/mock API calls as needed. This file intentionally keeps logic
straightforward and well-documented for integration.
*/

<style></style>
import React, { useEffect, useState, useRef } from "react";

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const URGENCIES = ["Low", "Medium", "High", "Critical"];

// Helper: simple fetch wrapper with error handling
async function apiFetch(path, opts = {}) {
  try {
    const res = await fetch(path, {
      headers: { "Content-Type": "application/json" },
      ...opts,
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`${res.status} ${res.statusText}: ${text}`);
    }
    return await res.json();
  } catch (err) {
    console.error("API fetch error", path, err);
    throw err;
  }
}

export default function App() {
  // Requests (patients requesting blood)
  const [requests, setRequests] = useState([]);
  const [filters, setFilters] = useState({ city: "", bloodType: "", urgency: "" });

  // Donor registration state
  const [donorStatus, setDonorStatus] = useState(null);

  // Contact / chat
  const [chatMessages, setChatMessages] = useState([]);
  const chatInputRef = useRef(null);

  // Hospitals (static sample; replace with backend call if desired)
  const [hospitals] = useState([
    { id: 1, name: "City General Hospital", phone: "+92-21-111-000-111", city: "Karachi" },
    { id: 2, name: "Downtown Blood Bank", phone: "+92-21-222-222-222", city: "Karachi" },
    { id: 3, name: "Lahore Central Hospital", phone: "+92-42-333-333-333", city: "Lahore" },
  ]);

  useEffect(() => {
    // Initial load of requests from backend
    loadRequests();

    // Poll every 12 seconds to get new requests (simple approach). For real
    // real-time, swap in WebSocket or SSE.
    const id = setInterval(loadRequests, 12000);
    return () => clearInterval(id);
  }, []);

  async function loadRequests() {
    try {
      // Replace with your backend endpoint that returns active requests
      const data = await apiFetch("/api/requests");
      setRequests(data || []);
    } catch (err) {
      // If backend isn't ready, we can fall back to a local sample so UI remains usable
      console.warn("Could not load requests from /api/requests, using sample");
      setRequests((r) => r.length ? r : sampleRequests());
    }
  }

  function sampleRequests() {
    return [
      { id: "r1", patientName: "Ali Khan", bloodType: "A+", city: "Karachi", urgency: "High", note: "Accident - OR waiting", contact: "+92-300-0000000", createdAt: new Date().toISOString() },
      { id: "r2", patientName: "Sara Ahmed", bloodType: "O-", city: "Lahore", urgency: "Critical", note: "Neonate transfusion", contact: "+92-300-1111111", createdAt: new Date().toISOString() },
    ];
  }

  // Create a new blood request
  async function handleCreateRequest(e) {
    e.preventDefault();
    const form = new FormData(e.target);
    const payload = {
      patientName: form.get("patientName"),
      bloodType: form.get("bloodType"),
      city: form.get("city"),
      urgency: form.get("urgency"),
      note: form.get("note"),
      contact: form.get("contact"),
      createdAt: new Date().toISOString(),
    };

    try {
      // Post to backend; backend should notify matching donors (e.g. via push, SMS, email)
      await apiFetch("/api/requests", { method: "POST", body: JSON.stringify(payload) });
      // Optimistically update UI
      setRequests((prev) => [payload, ...prev]);
      e.target.reset();
      alert("Blood request submitted — matching donors will be alerted if available.");
    } catch (err) {
      alert("Failed to submit request. If you're offline, the sample UI will still work.");
    }
  }

  // Register a donor
  async function handleDonorSignup(e) {
    e.preventDefault();
    const form = new FormData(e.target);
    const payload = {
      name: form.get("name"),
      bloodType: form.get("bloodType"),
      city: form.get("city"),
      phone: form.get("phone"),
      lastDonated: form.get("lastDonated") || null,
      registeredAt: new Date().toISOString(),
    };

    try {
      await apiFetch("/api/donors", { method: "POST", body: JSON.stringify(payload) });
      setDonorStatus({ success: true, message: "Registered successfully. You'll be alerted for matching requests." });
      e.target.reset();
    } catch (err) {
      setDonorStatus({ success: false, message: "Could not register. Save this info and try again later." });
    }
  }

  // Contact / chat handling (simple message posting to backend)
  async function sendChatMessage(e) {
    e.preventDefault();
    const text = chatInputRef.current.value?.trim();
    if (!text) return;

    const msg = { id: Date.now(), from: "You", text, at: new Date().toISOString() };
    setChatMessages((m) => [...m, msg]);
    chatInputRef.current.value = "";

    try {
      await apiFetch("/api/contact", { method: "POST", body: JSON.stringify(msg) });
      // Optionally fetch responses from backend and append
    } catch (err) {
      // keep local message for usability
    }
  }

  // Filtering logic
  const filteredRequests = requests.filter((r) => {
    const byCity = !filters.city || r.city.toLowerCase().includes(filters.city.toLowerCase());
    const byBlood = !filters.bloodType || r.bloodType === filters.bloodType;
    const byUrg = !filters.urgency || r.urgency === filters.urgency;
    return byCity && byBlood && byUrg;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <header className="mb-6">
          <h1 className="text-3xl font-extrabold">Emergency Blood Donation Portal</h1>
          <p className="text-sm text-gray-600">A centralized place to request blood, register as a donor, and find hospitals & blood banks.</p>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: Forms */}
          <section className="lg:col-span-1 space-y-4">
            <div className="bg-white p-4 rounded-2xl shadow">
              <h2 className="font-semibold">Request Blood</h2>
              <form onSubmit={handleCreateRequest} className="mt-3 space-y-2">
                <input name="patientName" required placeholder="Patient full name" className="w-full p-2 border rounded" />
                <select name="bloodType" required className="w-full p-2 border rounded">
                  <option value="">Select blood type</option>
                  {BLOOD_TYPES.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
                <input name="city" required placeholder="City" className="w-full p-2 border rounded" />
                <select name="urgency" required className="w-full p-2 border rounded">
                  <option value="">Select urgency</option>
                  {URGENCIES.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
                <input name="contact" placeholder="Contact number" className="w-full p-2 border rounded" />
                <textarea name="note" placeholder="Notes (hospital, condition, bed no.)" className="w-full p-2 border rounded" />
                <div className="flex gap-2">
                  <button type="submit" className="px-3 py-2 bg-red-600 text-white rounded">Submit Request</button>
                  <button type="button" onClick={() => { navigator.clipboard?.writeText(window.location.href); alert('Link copied. Share with helpers.'); }} className="px-3 py-2 border rounded">Share Page</button>
                </div>
              </form>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow">
              <h2 className="font-semibold">Register as Donor</h2>
              <form onSubmit={handleDonorSignup} className="mt-3 space-y-2">
                <input name="name" required placeholder="Your name" className="w-full p-2 border rounded" />
                <select name="bloodType" required className="w-full p-2 border rounded">
                  <option value="">Blood type</option>
                  {BLOOD_TYPES.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
                <input name="city" placeholder="City" className="w-full p-2 border rounded" />
                <input name="phone" placeholder="Phone or WhatsApp" className="w-full p-2 border rounded" />
                <input name="lastDonated" type="date" className="w-full p-2 border rounded" />
                <button type="submit" className="px-3 py-2 bg-green-600 text-white rounded">Register</button>
                {donorStatus && (
                  <p className={`mt-2 text-sm ${donorStatus.success ? 'text-green-700' : 'text-red-700'}`}>{donorStatus.message}</p>
                )}
              </form>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow">
              <h2 className="font-semibold">Contact / Quick Chat</h2>
              <div className="mt-3 space-y-2">
                <div className="h-40 overflow-auto border rounded p-2 bg-gray-50">
                  {chatMessages.length === 0 ? <p className="text-sm text-gray-500">No messages yet.</p> : (
                    chatMessages.map(m => (
                      <div key={m.id} className="mb-2">
                        <div className="text-xs text-gray-500">{m.from} • {new Date(m.at).toLocaleString()}</div>
                        <div className="text-sm">{m.text}</div>
                      </div>
                    ))
                  )}
                </div>
                <form onSubmit={sendChatMessage} className="flex gap-2">
                  <input ref={chatInputRef} placeholder="Type a quick message" className="flex-1 p-2 border rounded" />
                  <button className="px-3 py-2 bg-blue-600 text-white rounded">Send</button>
                </form>
                <p className="text-xs text-gray-500">Note: For urgent live support, call the hospital numbers listed below.</p>
              </div>
            </div>
          </section>

          {/* Middle column: Requests list + filters */}
          <section className="lg:col-span-1 bg-white p-4 rounded-2xl shadow h-full">
            <h2 className="font-semibold mb-2">Active Requests</h2>

            <div className="mb-3 grid grid-cols-3 gap-2">
              <input placeholder="Filter by city" value={filters.city} onChange={(e) => setFilters(f => ({...f, city: e.target.value}))} className="col-span-1 p-2 border rounded" />
              <select value={filters.bloodType} onChange={(e) => setFilters(f => ({...f, bloodType: e.target.value}))} className="col-span-1 p-2 border rounded">
                <option value="">All blood types</option>
                {BLOOD_TYPES.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
              <select value={filters.urgency} onChange={(e) => setFilters(f => ({...f, urgency: e.target.value}))} className="col-span-1 p-2 border rounded">
                <option value="">Any urgency</option>
                {URGENCIES.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>

            <div className="space-y-3 max-h-[520px] overflow-auto">
              {filteredRequests.length === 0 ? (
                <p className="text-sm text-gray-500">No matching requests.</p>
              ) : filteredRequests.map(r => (
                <article key={r.id || r.createdAt} className="p-3 border rounded">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="font-semibold">{r.patientName} • {r.bloodType}</div>
                      <div className="text-xs text-gray-500">{r.city} • {r.urgency} • {r.contact}</div>
                    </div>
                    <div className="text-right">
                      <div className={`px-2 py-1 rounded text-xs ${r.urgency === 'Critical' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>{r.urgency}</div>
                      <div className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleString()}</div>
                    </div>
                  </div>
                  {r.note && <div className="mt-2 text-sm">{r.note}</div>}
                  <div className="mt-2 flex gap-2">
                    <a href={`tel:${r.contact}`} className="text-sm px-2 py-1 border rounded">Call</a>
                    <button onClick={() => navigator.clipboard?.writeText(`Request for ${r.bloodType} in ${r.city}. Contact: ${r.contact}`) } className="text-sm px-2 py-1 border rounded">Copy Info</button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* Right column: Hospitals list & resources */}
          <aside className="lg:col-span-1 space-y-4">
            <div className="bg-white p-4 rounded-2xl shadow">
              <h2 className="font-semibold">Hospitals & Blood Banks</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {hospitals.map(h => (
                  <li key={h.id} className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">{h.name}</div>
                      <div className="text-xs text-gray-500">{h.city}</div>
                    </div>
                    <div className="flex flex-col items-end">
                      <a href={`tel:${h.phone}`} className="text-sm">{h.phone}</a>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow">
              <h2 className="font-semibold">Resources & Tips</h2>
              <ol className="mt-2 text-sm list-decimal list-inside text-gray-700 space-y-1">
                <li>Confirm blood type and crossmatch at the receiving hospital.</li>
                <li>Inform donors about eligibility and last-donation date.</li>
                <li>Use contact numbers for urgent coordination.</li>
              </ol>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow">
              <h2 className="font-semibold">Developer notes</h2>
              <p className="text-xs text-gray-500 mt-2">Backend endpoints expected by this UI:</p>
              <ul className="text-xs mt-2 space-y-1">
                <li><code>/api/requests</code> GET (list), POST (create)</li>
                <li><code>/api/donors</code> POST (register donor)</li>
                <li><code>/api/hospitals</code> GET (optional)</li>
                <li><code>/api/contact</code> POST (messages)</li>
              </ul>
              <p className="text-xs text-gray-500 mt-2">For donor alerts, implement server-side matching and notifications (SMS/WhatsApp/email/push).</p>
            </div>
          </aside>
        </main>

        <footer className="mt-8 text-center text-sm text-gray-500">© Emergency Blood Donation Portal — Built per project proposal by Jamila Fatima</footer>
      </div>
    </div>
  );
}

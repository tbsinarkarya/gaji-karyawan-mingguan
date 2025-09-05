// pages/api/employees.js
export default function handler(req, res) {
  if (req.method === "GET") {
    // ambil data dari DB
    res.status(200).json([{ id: 1, name: "John Doe" }]);
  } else if (req.method === "POST") {
    // simpan data ke DB
    res.status(201).json({ message: "Employee saved" });
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}

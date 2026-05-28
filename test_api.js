async function test() {
  try {
    const res = await fetch('http://localhost:3000/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: "Test User",
        email: "test123456@email.com",
        password: "password123",
        role: "patient",
        phone: null,
        address: null,
        emergency_contact: null,
        dob: null,
        medical_history: null
      })
    });
    const data = await res.json();
    console.log("STATUS:", res.status);
    console.log("RESPONSE:", data);
  } catch (err) {
    console.log("ERROR:", err);
  }
}

test();

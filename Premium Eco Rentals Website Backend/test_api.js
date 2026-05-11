import http from "http";

function request(method, path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: "localhost", port: 5000, path, method,
      headers: {
        "Content-Type": "application/json",
        "Content-Length": data ? Buffer.byteLength(data) : 0,
        ...headers
      }
    };
    const req = http.request(options, res => {
      let raw = "";
      res.on("data", chunk => raw += chunk);
      res.on("end", () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

async function run() {
  console.log("\n=== 1. CREATE USER ===");
  const create = await request("POST", "/api/V1/users/create", {
    username: "testuser3", email: "test3@example.com", password: "password123"
  });
  console.log("Status:", create.status);
  console.log(JSON.stringify(create.body, null, 2));

  console.log("\n=== 2. LOGIN ===");
  const login = await request("POST", "/api/V1/users/login", {
    email: "test3@example.com", password: "password123"
  });
  console.log("Status:", login.status);
  const token = login.body.token;
  const userId = login.body.user?._id;
  console.log("Token:", token ? token.substring(0, 50) + "..." : "MISSING");
  console.log("UserId:", userId);

  console.log("\n=== 3. ELITE SIGNUP (Protected) ===");
  const elite = await request("POST", "/api/V1/elite/signup",
    { userId },
    { Authorization: "Bearer " + token }
  );
  console.log("Status:", elite.status);
  console.log(JSON.stringify(elite.body, null, 2));

  console.log("\n=== 4. PREVIEW POINTS (Public) ===");
  const preview = await request("POST", "/api/V1/loyalty/preview", {
    eligibleSpend: 500, tier: "Bronze", baseRate: 1
  });
  console.log("Status:", preview.status);
  console.log(JSON.stringify(preview.body, null, 2));

  console.log("\n=== 5. EARN POINTS (Protected) ===");
  const earn = await request("POST", "/api/V1/loyalty/earn",
    { userId, eligibleSpend: 500, baseRate: 1 },
    { Authorization: "Bearer " + token }
  );
  console.log("Status:", earn.status);
  console.log(JSON.stringify(earn.body, null, 2));
}

run().catch(console.error);

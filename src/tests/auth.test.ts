import request from "supertest";
import app from "../app";
import { pool } from "../db/pool";

describe("POST /auth/register", () => {
  it("should register a new user and return 201", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ email: "test@test.com", password: "password123" });

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe("Account created successfully");
  });

  it("should return error if email already in use", async () => {
    //register first
    await request(app).post("/auth/register").send({
      email: "test@test.com",
      password: "password123",
    });

    //register with the same email
    const res = await request(app)
      .post("/auth/register")
      .send({ email: "test@test.com", password: "password123" });

    expect(res.statusCode).toBe(409);
    expect(res.body.error).toBe("Email already in use");
  });

  it("should return 400 if email is invalid", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ email: "notemail", password: "password123" });

    expect(res.statusCode).toBe(400);
    expect(res.body.error[0].message).toBe("Invalid email address");
  });

  it("should return 400 if password is too short", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ email: "test@test.com", password: "123" });

    expect(res.statusCode).toBe(400);
    expect(res.body.error[0].message).toBe(
      "Too small: expected string to have >=8 characters",
    );
  });
});

describe("POST /auth/login", () => {
  it("should login a user and return 200", async () => {
    await request(app).post("/auth/register").send({
      email: "test@test.com",
      password: "password123",
    });

    const res = await request(app)
      .post("/auth/login")
      .send({ email: "test@test.com", password: "password123" });

    expect(res.statusCode).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    expect(typeof res.body.accessToken).toBe("string");
  });

  it("should return 401 if password is wrong", async () => {
    await request(app)
      .post("/auth/register")
      .send({ email: "test@test.com", password: "password123" });

    const res = await request(app)
      .post("/auth/login")
      .send({ email: "test@test.com", password: "password125" });

    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe("Email or password is wrong");
  });

  it("should return 401 if email doesnt exist", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "test@test.com", password: "password123" });

    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe("Email or password is wrong");
  });

  describe("POST /auth/refresh", () => {
    it("should return 200 and a new access token", async () => {
      const agent = request.agent(app);

      await agent
        .post("/auth/register")
        .send({ email: "test@test.com", password: "password123" });
      await agent
        .post("/auth/login")
        .send({ email: "test@test.com", password: "password123" });

      const res = await agent.post("/auth/refresh");

      expect(res.statusCode).toBe(200);
      expect(res.body.accessToken).toBeDefined();
      expect(typeof res.body.accessToken).toBe("string");
    });

    it("should return 401 if there is no cookie", async () => {
      const res = await request(app).post("/auth/refresh");

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe("No refresh token provided");
    });

    it("should return 401 if token is invalid", async () => {
      const res = await request(app)
        .post("/auth/refresh")
        .set("Cookie", "refreshToken=invalidtoken");

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe("Invalid refresh token.");
    });

    it("should return 401 if token is expired", async () => {
      const agent = request.agent(app);

      await agent
        .post("/auth/register")
        .send({ email: "test@test.com", password: "password123" });
      await agent
        .post("/auth/login")
        .send({ email: "test@test.com", password: "password123" });

      await pool.query(
        `UPDATE refresh_tokens SET expires_at = NOW() - INTERVAL '1 day'`,
      );
      const res = await agent.post("/auth/refresh");

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe("Refresh token expired");
    });
  });

  describe("POST /auth/logout", () => {
    it("should return 200 if user logged out", async () => {
      const agent = request.agent(app);

      await agent
        .post("/auth/register")
        .send({ email: "test@test.com", password: "password123" });
      const loginRes = await agent
        .post("/auth/login")
        .send({ email: "test@test.com", password: "password123" });

      const accessToken = loginRes.body.accessToken;

      const res = await agent
        .post("/auth/logout")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe("Logged out successfully");
    });

    it("should return 401 if no cookie", async () => {
      const res = await request(app)
        .post("/auth/logout")
        .set("Authorization", "Bearer faketoken");

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe("Invalid or expired token");
    });

    it("should return 401 if no access token", async () => {
      const res = await request(app)
        .post("/auth/logout")
        .set("Cookie", "refreshToken=sometoken");

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe("No token provided");
    });
  });
});

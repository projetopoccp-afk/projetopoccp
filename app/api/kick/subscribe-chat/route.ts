console.log(
  "Kick subscribe payload:",
  JSON.stringify({
    events: [
      {
        name: "chat.message.sent",
        version: 1,
      },
    ],
  }),
);

const response = await fetch(
  "https://api.kick.com/public/v1/events/subscriptions",
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${account.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      events: [
        {
          name: "chat.message.sent",
          version: 1,
        },
      ],
    }),
  },
);

const text = await response.text();

console.log("Kick subscribe status:", response.status);
console.log("Kick subscribe response:", text);

let payload: unknown = text;

try {
  payload = JSON.parse(text);
} catch {
  // mantém texto bruto
}

return NextResponse.json(
  {
    ok: response.ok,
    status: response.status,
    kickResponse: payload,
    account: {
      user_id: account.user_id,
      platform_username: account.platform_username,
      scopes: account.scopes,
    },
  },
  { status: response.ok ? 200 : 500 },
);
import { json } from "@remix-run/node";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import prisma from "../db.server";

function withCors<T>(body: T, status = 200) {
  return json(body, {
    status,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

function methodNotAllowed() {
  return withCors({ error: "Method not allowed" }, 405);
}

export async function loader({ request }: LoaderFunctionArgs) {
  if (request.method === "OPTIONS") {
    return withCors({ ok: true });
  }
  return methodNotAllowed();
}

export async function action({ request }: ActionFunctionArgs) {
  if (request.method === "OPTIONS") {
    return withCors({ ok: true });
  }

  if (request.method !== "POST") {
    return methodNotAllowed();
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch (_error) {
    return json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const { widgetId, widgetType, shop } = (payload ?? {}) as {
    widgetId?: string;
    widgetType?: string;
    shop?: string;
  };

  if (!widgetId || !widgetType || !shop) {
    return json(
      {
        error:
          "Missing required fields. Expected widgetId, widgetType and shop.",
      },
      { status: 400 },
    );
  }

  try {
    const prismaClient = prisma as unknown as {
      widgetClickEvent: {
        create: (args: {
          data: { widgetId: string; widgetType: string; shop: string };
        }) => Promise<unknown>;
      };
    };

    await prismaClient.widgetClickEvent.create({
      data: {
        widgetId,
        widgetType,
        shop: shop.toLowerCase(),
      },
    });

    return withCors({ success: true });
  } catch (error) {
    console.error("Failed to store widget click event", error);
    return withCors({ error: "Failed to store widget click event" }, 500);
  }
}

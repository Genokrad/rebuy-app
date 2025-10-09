import prisma from "../db.server";
import type { Widget } from "../graphql/createWidget";

export async function createWidget(
  name: string,
  type: string,
  shop: string,
): Promise<Widget> {
  const widget = await prisma.widget.create({
    data: {
      name,
      type,
      shop,
    },
  });

  return {
    id: widget.id,
    name: widget.name,
    type: widget.type,
    shop: widget.shop,
    createdAt: widget.createdAt.toISOString(),
    updatedAt: widget.updatedAt.toISOString(),
  };
}

export async function deleteWidget(id: string): Promise<void> {
  await prisma.widget.delete({
    where: { id },
  });
}

export async function updateWidget(
  id: string,
  name: string,
  type: string,
): Promise<Widget> {
  const widget = await prisma.widget.update({
    where: { id },
    data: { name, type },
  });

  return {
    id: widget.id,
    name: widget.name,
    type: widget.type,
    shop: widget.shop,
    createdAt: widget.createdAt.toISOString(),
    updatedAt: widget.updatedAt.toISOString(),
  };
}

export async function getWidgetsByShop(shop: string): Promise<Widget[]> {
  const widgets = await prisma.widget.findMany({
    where: {
      shop,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return widgets.map((widget) => ({
    id: widget.id,
    name: widget.name,
    type: widget.type,
    shop: widget.shop,
    createdAt: widget.createdAt.toISOString(),
    updatedAt: widget.updatedAt.toISOString(),
  }));
}

export async function getWidgetById(id: string): Promise<Widget | null> {
  const widget = await prisma.widget.findUnique({
    where: {
      id,
    },
  });

  if (!widget) {
    return null;
  }

  return {
    id: widget.id,
    name: widget.name,
    type: widget.type,
    shop: widget.shop,
    createdAt: widget.createdAt.toISOString(),
    updatedAt: widget.updatedAt.toISOString(),
  };
}

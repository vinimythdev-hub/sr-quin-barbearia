import { NextResponse } from 'next/server';

async function handleBypass() {
  return NextResponse.json({
    message: 'O envio de notificações por WhatsApp foi desativado por decisão da gerência.',
    status: 'disabled'
  }, { status: 200 });
}

export async function GET() {
  return handleBypass();
}

export async function POST() {
  return handleBypass();
}

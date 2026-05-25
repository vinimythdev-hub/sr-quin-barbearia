import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@barbearia/shared';

// Cliente de serviço do Supabase para ignorar políticas de RLS no cron job autônomo
const getSupabaseServiceClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return createClient<Database>(url, serviceKey);
};

// Sanitiza o número de telefone para o padrão aceito pela Evolution API
// Exemplo: "(69) 99999-9999" -> "5569999999999"
function sanitizePhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 0) return '';
  
  // Se não começar com 55 (DDI do Brasil), e tiver o tamanho de celular brasileiro padrão (10 ou 11 dígitos)
  if (!cleaned.startsWith('55') && cleaned.length >= 10 && cleaned.length <= 11) {
    cleaned = '55' + cleaned;
  }
  
  return cleaned;
}

async function handleProcessNotifications(request: Request) {
  try {
    // 1. Autorização opcional por token (para proteger contra abusos)
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && token !== cronSecret) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const supabase = getSupabaseServiceClient() as any;

    // 2. Buscar configurações ativas do WhatsApp
    const { data: settings, error: settingsError } = await supabase
      .from('whatsapp_settings')
      .select('*')
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    if (settingsError || !settings) {
      console.warn('Configurações de WhatsApp inativas ou inexistentes. Fila não processada.');
      return NextResponse.json({ message: 'WhatsApp inativo ou não configurado.' }, { status: 200 });
    }

    // 3. Buscar notificações pendentes agendadas para agora ou no passado
    const { data: notifications, error: notifError } = await supabase
      .from('pending_notifications')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(10); // Lote para evitar timeouts

    if (notifError) {
      throw notifError;
    }

    if (!notifications || notifications.length === 0) {
      return NextResponse.json({ message: 'Nenhuma notificação pendente para envio.' }, { status: 200 });
    }

    const results = [];
    const notificationsList = notifications as any[];

    // 4. Enviar cada notificação via Evolution API
    for (const notif of notificationsList) {
      const targetPhone = sanitizePhoneNumber(notif.phone);
      
      if (!targetPhone) {
        await supabase
          .from('pending_notifications')
          .update({
            status: 'failed',
            error_message: 'Número de telefone inválido ou vazio após sanitização.'
          })
          .eq('id', notif.id);
        
        results.push({ id: notif.id, status: 'failed', error: 'Telefone inválido' });
        continue;
      }

      try {
        // Enviar requisição POST para a API do WhatsApp (Evolution API)
        const response = await fetch(`${settings.api_url}/message/sendText/${settings.instance_name}`, {
          method: 'POST',
          headers: {
            'apikey': settings.api_token,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            number: targetPhone,
            options: {
              delay: 1200,
              presence: 'composing'
            },
            textMessage: {
              text: notif.message
            }
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Erro na API do WhatsApp: ${response.status} - ${errorText}`);
        }

        // Atualizar status para sucesso
        await supabase
          .from('pending_notifications')
          .update({
            status: 'sent',
            error_message: null
          })
          .eq('id', notif.id);

        results.push({ id: notif.id, status: 'sent' });

      } catch (err: any) {
        console.error(`Falha ao enviar notificação ${notif.id}:`, err);
        
        await supabase
          .from('pending_notifications')
          .update({
            status: 'failed',
            error_message: err.message || 'Erro de rede ou timeout.'
          })
          .eq('id', notif.id);

        results.push({ id: notif.id, status: 'failed', error: err.message });
      }
    }

    return NextResponse.json({
      message: 'Processamento de notificações concluído.',
      total_processed: notificationsList.length,
      results
    }, { status: 200 });

  } catch (error: any) {
    console.error('Erro geral no processador de notificações:', error);
    return NextResponse.json({ error: error.message || 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return handleProcessNotifications(request);
}

export async function POST(request: Request) {
  return handleProcessNotifications(request);
}
